// ============================================================================
// NOMINATIM GEOCODING API PROXY
// ============================================================================
// Vercel serverless function that proxies requests to OpenStreetMap Nominatim
// for both forward and reverse geocoding operations
// 
// Purpose:
// - Avoids CORS issues when calling Nominatim directly from browser
// - Adds proper User-Agent header required by Nominatim Terms of Service
// - Provides timeout handling for mobile devices
// - Adds caching for geocoding results (longer cache than weather data)
// 
// Endpoints:
// - /api/geocode?q={search_term} - Forward geocoding (search for places)
// - /api/geocode?type=reverse&lat={lat}&lon={lon} - Reverse geocoding (coordinates to address)
// ============================================================================

export default async function handler(req, res) {
  try {
    // ============================================================================
    // REQUEST PARAMETER EXTRACTION
    // ============================================================================
    // Extract query parameters for both forward and reverse geocoding
    const { q, lat, lon, type } = req.query

    // ============================================================================
    // URL CONSTRUCTION
    // ============================================================================
    // Build appropriate Nominatim URL based on operation type
    let url
    if (type === 'reverse') {
      // ============================================================================
      // REVERSE GEOCODING
      // ============================================================================
      // Convert coordinates to human-readable address
      if (!lat || !lon) {
        res.status(400).json({ error: 'Missing lat or lon' })
        return
      }
      url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&format=json&addressdetails=1`
    } else {
      // ============================================================================
      // FORWARD GEOCODING
      // ============================================================================
      // Convert place name to coordinates
      if (!q) {
        res.status(400).json({ error: 'Missing q' })
        return
      }
      // Limit to Norway (countrycodes=no) and return up to 5 results
      url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1&countrycodes=no`
    }

    // ============================================================================
    // NOMINATIM API REQUEST
    // ============================================================================
    // Make request to Nominatim with proper headers and timeout
    const upstream = await fetch(url, {
      headers: {
        // Required by Nominatim Terms of Service - identifies our application
        'User-Agent': 'solsoker/1.0 (contact: jonas@example.com)'
      },
      // 10 second timeout to prevent hanging requests on mobile
      signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
    })

    // ============================================================================
    // ERROR HANDLING
    // ============================================================================
    // Check if Nominatim API returned an error
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Upstream error ${upstream.status}` })
      return
    }

    // ============================================================================
    // RESPONSE PROCESSING
    // ============================================================================
    // Parse JSON response from Nominatim
    const data = await upstream.json()
    
    // Add caching headers (longer cache than weather data since addresses change less frequently)
    // 10 minutes cache, 10 minutes stale-while-revalidate
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=600')
    res.status(200).json(data)
    
  } catch (err) {
    // ============================================================================
    // ERROR RESPONSE
    // ============================================================================
    // Return 500 error with details for debugging
    res.status(500).json({ error: 'Proxy error', details: String(err) })
  }
}


