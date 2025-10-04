// ============================================================================
// MET.NO API PROXY
// ============================================================================
// Vercel serverless function that proxies requests to Met.no weather API
// 
// Purpose:
// - Avoids CORS issues when calling Met.no directly from browser
// - Adds proper User-Agent header required by Met.no Terms of Service
// - Provides timeout handling for mobile devices
// - Adds caching to reduce API rate limiting
// 
// Endpoint: /api/met?lat={latitude}&lon={longitude}
// Returns: Complete weather forecast data from Met.no
// ============================================================================

export default async function handler(req, res) {
  try {
    // Extract latitude and longitude from query parameters
    const { lat, lon } = req.query
    if (!lat || !lon) {
      res.status(400).json({ error: 'Missing lat or lon' })
      return
    }

    // Construct Met.no API URL with coordinates
    // Uses /complete endpoint for full weather data including gusts
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
    
    // Make request to Met.no with proper headers and timeout
    const upstream = await fetch(url, {
      headers: {
        // Required by Met.no Terms of Service - identifies our application
        'User-Agent': 'solsoker/1.0 (contact: jonas@example.com)'
      },
      // 10 second timeout to prevent hanging requests on mobile
      signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
    })

    // Check if Met.no API returned an error
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Upstream error ${upstream.status}` })
      return
    }

    // Parse JSON response from Met.no
    const data = await upstream.json()
    
    // Add caching headers to reduce API rate limiting
    // 5 minutes cache, 5 minutes stale-while-revalidate
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=300')
    res.status(200).json(data)
    
  } catch (err) {
    // Return 500 error with details for debugging
    res.status(500).json({ error: 'Proxy error', details: String(err) })
  }
}


