export default async function handler(req, res) {
  try {
    const { lat, lon } = req.query
    if (!lat || !lon) {
      res.status(400).json({ error: 'Missing lat or lon' })
      return
    }

    const url = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
    const upstream = await fetch(url, {
      headers: {
        // Identify per met.no ToS
        'User-Agent': 'solsoker/1.0 (contact: jonas@example.com)'
      },
      // 10s timeout via AbortController
      signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
    })

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Upstream error ${upstream.status}` })
      return
    }

    const data = await upstream.json()
    // Basic cache to reduce rate
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=300')
    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ error: 'Proxy error', details: String(err) })
  }
}


