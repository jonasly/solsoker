export default async function handler(req, res) {
  try {
    const { q, lat, lon, type } = req.query

    let url
    if (type === 'reverse') {
      if (!lat || !lon) {
        res.status(400).json({ error: 'Missing lat or lon' })
        return
      }
      url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&format=json&addressdetails=1`
    } else {
      if (!q) {
        res.status(400).json({ error: 'Missing q' })
        return
      }
      url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1&countrycodes=no`
    }

    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'solsoker/1.0 (contact: jonas@example.com)'
      },
      signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
    })

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Upstream error ${upstream.status}` })
      return
    }

    const data = await upstream.json()
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=600')
    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ error: 'Proxy error', details: String(err) })
  }
}


