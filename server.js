import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Geocoding API proxy
app.get('/api/geocode', async (req, res) => {
  try {
    const { q, lat, lon, type } = req.query;

    let url;
    if (type === 'reverse') {
      if (!lat || !lon) {
        res.status(400).json({ error: 'Missing lat or lon' });
        return;
      }
      url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&format=json&addressdetails=1`;
    } else {
      if (!q) {
        res.status(400).json({ error: 'Missing q' });
        return;
      }
      url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1&countrycodes=no`;
    }

    // Add delay to respect Nominatim rate limits (max 1 request per second)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Solsoker Weather App/1.0 (https://github.com/your-repo)',
        'Accept': 'application/json',
        'Accept-Language': 'no,en;q=0.9'
      }
    });

    if (!upstream.ok) {
      console.error(`Nominatim error ${upstream.status}: ${await upstream.text()}`);
      res.status(upstream.status).json({ error: `Upstream error ${upstream.status}` });
      return;
    }

    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=600');
    res.status(200).json(data);
    
  } catch (err) {
    console.error('Geocode proxy error:', err);
    res.status(500).json({ error: 'Proxy error', details: String(err) });
  }
});

// Weather API proxy
app.get('/api/met', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      res.status(400).json({ error: 'Missing lat or lon' });
      return;
    }

    const url = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
    
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Solsoker Weather App/1.0 (https://github.com/your-repo)'
      }
    });

    if (!upstream.ok) {
      console.error(`Met.no error ${upstream.status}`);
      res.status(upstream.status).json({ error: `Upstream error ${upstream.status}` });
      return;
    }

    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=300');
    res.status(200).json(data);
    
  } catch (err) {
    console.error('Weather proxy error:', err);
    res.status(500).json({ error: 'Proxy error', details: String(err) });
  }
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


