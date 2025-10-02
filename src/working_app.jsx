import React, { useState } from 'react'

// Glob-import av alle SVG-ikoner i src/assets/symbols
const iconModules = import.meta.glob('./assets/symbols/*.svg', { eager: true, as: 'url' })

// Beaufort-skala navngivning (m/s)
function getBeaufortName(speed) {
  if (speed < 0.3) return 'stille'
  if (speed < 1.6) return 'flau vind'
  if (speed < 3.4) return 'lett bris'
  if (speed < 5.5) return 'svak bris'
  if (speed < 8.0) return 'laber bris'
  if (speed < 10.8) return 'frisk bris'
  if (speed < 13.9) return 'liten kuling'
  if (speed < 17.2) return 'stiv kuling'
  if (speed < 20.8) return 'sterk kuling'
  if (speed < 24.5) return 'liten storm'
  if (speed < 28.5) return 'full storm'
  if (speed < 32.7) return 'sterk storm'
  return 'orkan'
}

// Kompassretninger på norsk
function getWindDirName(deg) {
  const dirs = ['nord', 'nordøst', 'øst', 'sørøst', 'sør', 'sørvest', 'vest', 'nordvest']
  return dirs[Math.floor((deg + 22.5) / 45) % 8]
}

// Pil etter retning på 8 sektorer
function getWindArrow(deg) {
  const arrows = ['↑','↗','→','↘','↓','↙','←','↖']
  return arrows[Math.floor((deg + 22.5) / 45) % 8]
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

export default function App() {
  const [best, setBest] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Vekt-prioriteringer for faktorer
  const [solWeight, setSolWeight] = useState(0.7)
  const [tempWeight, setTempWeight] = useState(0.3)
  const [windWeight, setWindWeight] = useState(0)

  const [manualLocation, setManualLocation] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)

  const findBestWeather = async () => {
    setLoading(true)
    setError(null)
    setBest(null)

    // Normaliser vekter
    const totalW = solWeight + tempWeight + windWeight
    if (totalW === 0) {
      setError('Vennligst sett minst én vekt > 0')
      setLoading(false)
      return
    }
    const wSol = solWeight / totalW
    const wTemp = tempWeight / totalW
    const wWind = windWeight / totalW

    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const { latitude, longitude } = coords

      // Reverse-geocode brukerposisjon
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          { headers: { 'User-Agent': 'solsoker/1.0' } }
        )
        const geoData = await geoRes.json()
        const addr = geoData.address || {}
        const name = addr.city || addr.town || addr.village || addr.hamlet || geoData.display_name
        setUserLocation({ lat: latitude, lon: longitude, name })
      } catch {
        setUserLocation({ lat: latitude, lon: longitude, name: `${latitude.toFixed(5)},${longitude.toFixed(5)}` })
      }

      // Generer prøvelokasjoner
      const radiusKm = 10
      const samples = []
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * 2 * Math.PI
        const d = radiusKm * 1000
        samples.push({
          lat: latitude + (d / 111000) * Math.cos(angle),
          lon: longitude + (d / (111000 * Math.cos(latitude * Math.PI/180))) * Math.sin(angle)
        })
      }

      // Finn beste punkt
      let bestPoint = null
      let bestScore = -Infinity
      for (const p of samples) {
        const res = await fetch(
          `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${p.lat}&lon=${p.lon}`,
          { headers: { 'User-Agent': 'solsoker/1.0' } }
        )
        const data = await res.json()
        const now = data.properties.timeseries[0].data.instant.details
        const sol = 1 - now.cloud_area_fraction/100
        const tempScore = 1 - Math.min(Math.abs(now.air_temperature - 25)/15,1)
        const windScore = 1 - Math.min(now.wind_speed/15,1)
        const score = wSol*sol + wTemp*tempScore + wWind*windScore
        if (score > bestScore) {
          bestScore = score
          bestPoint = {
            lat: p.lat,
            lon: p.lon,
            temp: now.air_temperature,
            cloud: now.cloud_area_fraction,
            wind: now.wind_speed,
            gust: now.wind_speed_of_gust ?? null,
            symbolCode: data.properties.timeseries[0].data.next_1_hours?.summary?.symbol_code || ''
          }
        }
        await sleep(1100)
      }

      // Hent stedsnavn for beste punkt
      let placeName;
      try {
        const geoRes2 = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${bestPoint.lat}&lon=${bestPoint.lon}&format=json`,
          { headers: { 'User-Agent': 'solsoker/1.0' } }
        )
        const geoData2 = await geoRes2.json()
        const addr2 = geoData2.address || {}
        placeName = addr2.city || addr2.town || addr2.village || addr2.hamlet || geoData2.display_name
      } catch {
        placeName = `${bestPoint.lat.toFixed(5)},${bestPoint.lon.toFixed(5)}`
      }

      // Hent full forecast
      const fRes = await fetch(
        `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${bestPoint.lat}&lon=${bestPoint.lon}`,
        { headers: { 'User-Agent': 'solsoker/1.0' } }
      )
      const fData = await fRes.json()
      const forecast = fData.properties.timeseries

      setBest({ ...bestPoint, name: placeName, forecast })
      setLoading(false)
    }, err => {
      if (err.code === 1) { // PERMISSION_DENIED
        setError('Lokasjonstilgang ble nektet. Vennligst tillat lokasjon i nettleseren eller skriv inn sted manuelt.')
        setShowManualInput(true)
      } else {
        setError('Klarte ikke hente posisjon: ' + err.message)
      }
      setLoading(false)
    }, { enableHighAccuracy: true })
  }

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', padding: '2rem', maxWidth: 900, margin: 'auto' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>Solsøker</h1>
      {/* Sliders for vekter */}
      <fieldset style={{ border: '1px solid #ccc', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
        <legend>Prioriter værfaktorer</legend>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="solRange">Sol {(solWeight * 100).toFixed(0)}%</label>
            <input
              id="solRange"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={solWeight}
              onChange={e => setSolWeight(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="tempRange">Temp {(tempWeight * 100).toFixed(0)}%</label>
            <input
              id="tempRange"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={tempWeight}
              onChange={e => setTempWeight(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="windRange">Vind {(windWeight * 100).toFixed(0)}%</label>
            <input
              id="windRange"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={windWeight}
              onChange={e => setWindWeight(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </fieldset>
      <button onClick={findBestWeather} disabled={loading} style={{ background:'#3498db', color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:8, cursor: loading?'not-allowed':'pointer', fontSize:'1rem', display:'block', margin:'auto' }}>
        {loading ? 'Laster…' : 'Finn beste vær innen 10 km'}
      </button>
      {error && <p style={{ color:'red', textAlign:'center' }}>{error}</p>}

      {userLocation && (
        <div style={{ background:'#ecf0f1', padding:'1rem', borderRadius:6, marginTop:'1rem' }}>
          <strong>Din posisjon:</strong> {userLocation.name} ({userLocation.lat.toFixed(5)}, {userLocation.lon.toFixed(5)})
        </div>
      )}

      {best && (
        <div style={{ background:'white', padding:'1.5rem', borderRadius:10, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', marginTop:'1.5rem' }}>
          <h2 style={{ color:'#34495e' }}>Beste sted: {best.name}</h2>
          <p>Temperatur nå: <strong>{best.temp}°C</strong></p>
          <p>Skydekke nå: <strong>{best.cloud}%</strong></p>
          <p>
            Vind nå: <strong>{best.wind.toFixed(1)} m/s</strong>
            {best.gust !== null && (
              <>&nbsp;– kast: <strong>{best.gust.toFixed(1)} m/s</strong></>
            )}
          </p>

          <h3>Værmelding (neste 24 timer)</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr 3fr', textAlign:'left', fontWeight:'bold', borderBottom:'2px solid #ddd', paddingBottom:'0.5rem' }}>
            <div>Tid</div><div>Vær</div><div>Temp.</div><div>Nedbør mm</div><div>Vind (m/s, kast)</div><div>Vindbeskrivelse</div>
          </div>
          {best.forecast.slice(0,24).map(f => {
            const time = new Date(f.time).toLocaleTimeString('no-NO',{hour:'2-digit',minute:'2-digit'})
            const det = f.data.instant.details
            const nxt = f.data.next_1_hours?.details || {}
            const sym = f.data.next_1_hours?.summary?.symbol_code || 'unknown'
            const iconUrl = iconModules[`./assets/symbols/${sym}.svg`]
            const precip = nxt.precipitation_amount != null ? nxt.precipitation_amount.toFixed(1) : ''
            const speed = det.wind_speed.toFixed(0)
            // Bruk detaljert vindkast hvis tilgjengelig
            const gustF = det.wind_speed_of_gust != null ? det.wind_speed_of_gust.toFixed(0) : ''
            const dirDeg = det.wind_from_direction
            const arrow = getWindArrow(dirDeg)
            const dirName = getWindDirName(dirDeg)
            const beauName = getBeaufortName(det.wind_speed)
            const desc = `${beauName} fra ${dirName}`

            return (
              <div key={f.time} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr 3fr', padding:'0.5rem 0', borderBottom:'1px solid #eee', alignItems:'center' }}>
                <div>{time}</div>
                <div>{iconUrl ? <img src={iconUrl} alt={sym} style={{width:24,height:24}} /> : '❓'}</div>
                <div>{det.air_temperature}°</div>
                <div style={{color:'#007aff'}}>{precip}</div>
                <div>{`${speed}${gustF ? `, ${gustF}` : ''} ${arrow}`}</div>
                <div style={{ textAlign:'left' }}>{desc}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
