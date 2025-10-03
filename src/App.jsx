import React, { useState, useEffect, useRef } from 'react'

// Leaflet map component with radius circle
const LeafletMap = ({ center, bestLocation, userLocation, searchRadius, topWeatherSpots }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const circleRef = useRef(null)
  const isDraggingRef = useRef(false)

  // Initialize map only once
  useEffect(() => {
    if (!mapRef.current || !window.L || !center || !center.lat || !center.lng) {
      return
    }

    if (!mapInstanceRef.current) {
      console.log('Initializing Leaflet map with center:', center)
      const map = window.L.map(mapRef.current).setView([center.lat, center.lng], 10)
      mapInstanceRef.current = map
      
      // Add OpenStreetMap tiles only once
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [center.lat, center.lng]) // Only reinitialize if center coordinates change

  // Update markers and circle without reinitializing map
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    // Clear existing markers and circle
    markersRef.current.forEach(marker => map.removeLayer(marker))
    markersRef.current = []
    if (circleRef.current) {
      map.removeLayer(circleRef.current)
      circleRef.current = null
    }

    // Add user location marker (blue) - use center if userLocation is missing
    const userCoords = userLocation && userLocation.lat && userLocation.lon 
      ? [userLocation.lat, userLocation.lon]
      : [center.lat, center.lng]
    
    console.log('Adding user location marker at:', userCoords)
    const userMarker = window.L.marker(userCoords, {
      icon: window.L.divIcon({
        className: 'custom-marker',
        html: '<div style="background-color: #2196f3; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      })
    }).addTo(map)
    markersRef.current.push(userMarker)

    // Add best weather location marker (green)
    if (bestLocation && bestLocation.lat && bestLocation.lng) {
      console.log('Adding best location marker:', bestLocation)
      const bestMarker = window.L.marker([bestLocation.lat, bestLocation.lng], {
        icon: window.L.divIcon({
          className: 'custom-marker',
          html: '<div style="background-color: #4caf50; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      }).addTo(map)
      markersRef.current.push(bestMarker)
    }

    // Add top 3 weather spots markers
    if (topWeatherSpots && topWeatherSpots.length > 0) {
      topWeatherSpots.forEach((spot, index) => {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1'] // Red, teal, blue
        const color = colors[index] || '#666'
        const marker = window.L.marker([spot.lat, spot.lon], {
          icon: window.L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: white;">${spot.rank}</div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          })
        }).addTo(map)
        
        // Add popup with weather info
        marker.bindPopup(`
          <div style="font-size: 12px; line-height: 1.4;">
            <strong>#${spot.rank} ${spot.name}</strong><br>
            Score: ${(spot.score * 100).toFixed(1)}%<br>
            Temp: ${spot.temp.toFixed(1)}°C<br>
            Sky: ${(100 - spot.cloud).toFixed(0)}% clear<br>
            Wind: ${spot.wind.toFixed(1)} m/s
          </div>
        `)
        
        markersRef.current.push(marker)
      })
    }

    // Add search radius circle
    if (searchRadius > 0) {
      console.log('Adding search radius circle:', { searchRadius, center })
      const circle = window.L.circle([center.lat, center.lng], {
        radius: searchRadius * 1000, // Convert km to meters
        color: '#4caf50',
        weight: 2,
        opacity: 0.6,
        fillColor: '#4caf50',
        fillOpacity: 0.1
      }).addTo(map)
      circleRef.current = circle
    }
  }, [bestLocation, userLocation, searchRadius, topWeatherSpots]) // Only update when these change

  return <div ref={mapRef} style={{ width: '100%', height: '400px', borderRadius: 8 }} />
}

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

// Pil etter retning på 8 sektorer (korrigert for 180 grader)
function getWindArrow(deg) {
  const arrows = ['↓','↙','←','↖','↑','↗','→','↘']
  return arrows[Math.floor((deg + 22.5) / 45) % 8]
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return await res.json()
  } finally {
    clearTimeout(id)
  }
}

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
          <h2>Noe gikk galt</h2>
          <p>Feil: {this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Last siden på nytt
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default function App() {
  const [best, setBest] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [manualLocation, setManualLocation] = useState('')
  const [showManualInput, setShowManualInput] = useState(true)
  const [suggestions, setSuggestions] = useState([])
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false)
  const [hasSelectedSuggestion, setHasSelectedSuggestion] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const suggestionsBoxRef = useRef(null)
  
  // State for map display
  const [showMap, setShowMap] = useState(false)
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 })
  const [bestLocation, setBestLocation] = useState(null)
  const [topWeatherSpots, setTopWeatherSpots] = useState([])
  
  // State for radius selection
  const [searchRadius, setSearchRadius] = useState(10) // km
  
  // State for workflow
  const [hasLocation, setHasLocation] = useState(false)
  const [showSearchButton, setShowSearchButton] = useState(false)
  
  // Dark mode state
  const [darkMode, setDarkMode] = useState(false)

  // Vekt-prioriteringer for faktorer
  const [solWeight, setSolWeight] = useState(0.7)
  const [tempWeight, setTempWeight] = useState(0.3)
  const [windWeight, setWindWeight] = useState(0)

  // Ternary control position (in px within SVG)
  const TRI_W = 260
  const TRI_H = 230
  const centerX = TRI_W / 2
  const centerY = TRI_H / 2 + 20
  const radius = 110
  
  // Regular equilateral triangle with equal sides
  const vA = { x: centerX, y: centerY - radius }                    // ☀️ Sol (top)
  const vB = { x: centerX - radius * Math.cos(Math.PI/6), y: centerY + radius * Math.sin(Math.PI/6) }  // 🌡️ Temp (bottom-left)
  const vC = { x: centerX + radius * Math.cos(Math.PI/6), y: centerY + radius * Math.sin(Math.PI/6) }  // 💨 Vind (bottom-right)

  const weightsToPoint = (wA, wB, wC) => ({
    x: wA * vA.x + wB * vB.x + wC * vC.x,
    y: wA * vA.y + wB * vB.y + wC * vC.y
  })

  // initial point from weights
  const [selectorPos, setSelectorPos] = useState(() => weightsToPoint(solWeight, tempWeight, windWeight))
  const dragRef = useRef(false)
  const svgRef = useRef(null)

  // Remove automatic sync to prevent unwanted dot movement

  function triArea(p, q, r) {
    return ((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)) / 2
  }

  function barycentric(p) {
    const areaTotal = triArea(vA, vB, vC)
    const wA = triArea(p, vB, vC) / areaTotal
    const wB = triArea(vA, p, vC) / areaTotal
    const wC = triArea(vA, vB, p) / areaTotal
    return { wA, wB, wC }
  }

  const handleDrag = (clientX, clientY) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = clientX - rect.left
    const y = clientY - rect.top
    
    // Always constrain the point to be within the triangle
    const constrainedPoint = constrainToTriangle({ x, y })
    setSelectorPos(constrainedPoint)
    
    // Calculate weights for the constrained point and normalize
    const { wA, wB, wC } = barycentric(constrainedPoint)
    const total = wA + wB + wC
    if (total > 0) {
      setSolWeight(wA / total)
      setTempWeight(wB / total)
      setWindWeight(wC / total)
    }
  }

  // Constrain a point to be within the triangle
  const constrainToTriangle = (p) => {
    const { wA, wB, wC } = barycentric(p)
    
    // If all weights are non-negative, point is inside triangle
    if (wA >= 0 && wB >= 0 && wC >= 0) {
      return p
    }
    
    // Point is outside triangle, project to the nearest edge
    const edges = [
      { start: vA, end: vB },
      { start: vB, end: vC },
      { start: vA, end: vC }
    ]
    
    let minDistance = Infinity
    let closestPoint = p
    
    edges.forEach(edge => {
      const projected = projectToLine(p, edge.start, edge.end)
      const distance = Math.sqrt((p.x - projected.x) ** 2 + (p.y - projected.y) ** 2)
      
      if (distance < minDistance) {
        minDistance = distance
        closestPoint = projected
      }
    })
    
    return closestPoint
  }


  // Project point to line segment
  const projectToLine = (point, lineStart, lineEnd) => {
    const A = point.x - lineStart.x
    const B = point.y - lineStart.y
    const C = lineEnd.x - lineStart.x
    const D = lineEnd.y - lineStart.y

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1
    if (lenSq !== 0) param = dot / lenSq

    if (param < 0) {
      return { x: lineStart.x, y: lineStart.y }
    } else if (param > 1) {
      return { x: lineEnd.x, y: lineEnd.y }
    } else {
      return { x: lineStart.x + param * C, y: lineStart.y + param * D }
    }
  }

  const onMouseDown = (e) => {
    dragRef.current = true
    handleDrag(e.clientX, e.clientY)
  }
  const onMouseMove = (e) => {
    if (!dragRef.current) return
    handleDrag(e.clientX, e.clientY)
  }
  const onMouseUp = () => {
    dragRef.current = false
  }

  const processLocation = async (latitude, longitude, locationName) => {
    // Beregn vekter lokalt slik at de er tilgjengelige her
    const totalWLocal = solWeight + tempWeight + windWeight
    if (totalWLocal === 0) {
      setError('Vennligst sett minst én vekt > 0')
      setLoading(false)
      return
    }
    const wSol = solWeight / totalWLocal
    const wTemp = tempWeight / totalWLocal
    const wWind = windWeight / totalWLocal
      // Reverse-geocode brukerposisjon
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          { headers: { 'User-Agent': 'solsoker/1.0' } }
        )
        const geoData = await geoRes.json()
        const addr = geoData.address || {}
        const name = addr.city || addr.town || addr.village || addr.hamlet || geoData.display_name
      setUserLocation({ lat: latitude, lon: longitude, name: locationName || name })
      } catch {
      setUserLocation({ lat: latitude, lon: longitude, name: locationName || `${latitude.toFixed(5)},${longitude.toFixed(5)}` })
    }

    // Adaptive grid search for optimal weather location
    const maxRadiusKm = searchRadius
    const maxIterations = 4
    const initialGridSize = 5
    
    let bestPoint = null
    let bestScore = -Infinity
    let allWeatherSpots = [] // Collect all weather spots for ranking
    let currentCenter = { lat: latitude, lng: longitude }
    let currentRadius = maxRadiusKm
    
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const samples = []
      
      // Create polar grid - much better coverage of circle
      const numRings = Math.max(2, 4 - iteration) // Fewer rings each iteration
      const pointsPerRing = [1, 6, 12, 18] // Center + rings with increasing density
      
      for (let ring = 0; ring < numRings; ring++) {
        const ringRadius = (ring / (numRings - 1)) * currentRadius
        const pointsInRing = pointsPerRing[ring]
        
        for (let i = 0; i < pointsInRing; i++) {
          // Skip center point after first iteration
          if (ring === 0 && iteration > 0) continue
          
          const angle = (i / pointsInRing) * 2 * Math.PI
          
          // Convert to lat/lng using proper distance calculation
          const lat = currentCenter.lat + (ringRadius / 111) * Math.cos(angle)
          const lon = currentCenter.lng + (ringRadius / (111 * Math.cos(currentCenter.lat * Math.PI / 180))) * Math.sin(angle)
          
          // Only include points within max radius
          const distFromOrigin = Math.sqrt(
            Math.pow((lat - latitude) * 111000, 2) + 
            Math.pow((lon - longitude) * 111000 * Math.cos(latitude * Math.PI / 180), 2)
          ) / 1000
          
          if (distFromOrigin <= maxRadiusKm) {
            samples.push({ lat, lon })
          }
        }
      }
      
      // Evaluate all points in current grid
      let iterationBest = null
      let iterationBestScore = -Infinity
      
      for (const p of samples) {
        try {
          const data = await fetchJsonWithTimeout(
          `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${p.lat}&lon=${p.lon}`,
            { headers: { 'User-Agent': 'solsoker/1.0' } },
            8000
        )
        const now = data.properties.timeseries[0].data.instant.details
        const sol = 1 - now.cloud_area_fraction/100
        const tempScore = 1 - Math.min(Math.abs(now.air_temperature - 25)/20,1)
        const windScore = darkMode 
          ? 1 - Math.min(Math.abs(now.wind_speed - 17)/17, 1) // Storm mode: 17 m/s optimal
          : 1 - Math.min(now.wind_speed/15,1) // Normal mode: low wind preferred
        const score = wSol*sol + wTemp*tempScore + wWind*windScore
        
        // Collect all weather spots for ranking
        allWeatherSpots.push({
          lat: p.lat,
          lon: p.lon,
          temp: now.air_temperature,
          cloud: now.cloud_area_fraction,
          wind: now.wind_speed,
          gust: now.wind_speed_of_gust ?? null,
          symbolCode: data.properties.timeseries[0].data.next_1_hours?.summary?.symbol_code || '',
          score: score
        })
          
          if (score > iterationBestScore) {
            iterationBestScore = score
            iterationBest = {
            lat: p.lat,
            lon: p.lon,
            temp: now.air_temperature,
            cloud: now.cloud_area_fraction,
            wind: now.wind_speed,
            gust: now.wind_speed_of_gust ?? null,
            symbolCode: data.properties.timeseries[0].data.next_1_hours?.summary?.symbol_code || ''
          }
        }
          
          await sleep(200) // Reduced for faster search
        } catch (err) {
          console.warn('Weather fetch failed for point:', p, err)
        }
      }
      
      // Update global best if this iteration found something better
      if (iterationBest && iterationBestScore > bestScore) {
        bestScore = iterationBestScore
        bestPoint = iterationBest
        
        // Move search center to best point and reduce radius
        currentCenter = { lat: iterationBest.lat, lng: iterationBest.lon }
        currentRadius = Math.max(2, currentRadius * 0.6) // Reduce radius by 40% each iteration
      } else {
        // No improvement found, reduce radius and try again
        currentRadius = Math.max(1, currentRadius * 0.7)
      }
      
      // Early termination if radius becomes too small
      if (currentRadius < 1.5) break
      }

      // Get top 3 weather spots
      const sortedSpots = allWeatherSpots
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
      
      // Get place names for top spots
      const topSpotsWithNames = await Promise.all(
        sortedSpots.map(async (spot, index) => {
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${spot.lat}&lon=${spot.lon}&format=json`,
              { headers: { 'User-Agent': 'solsoker/1.0' } }
            )
            const geoData = await geoRes.json()
            const addr = geoData.address || {}
            const name = addr.city || addr.town || addr.village || addr.hamlet || geoData.display_name || `Spot ${index + 1}`
            return { ...spot, name, rank: index + 1 }
          } catch {
            return { ...spot, name: `Spot ${index + 1}`, rank: index + 1 }
          }
        })
      )
      
      setTopWeatherSpots(topSpotsWithNames)

      // Hent stedsnavn for beste punkt
      let placeName;
      try {
      const geoData2 = await fetchJsonWithTimeout(
          `https://nominatim.openstreetmap.org/reverse?lat=${bestPoint.lat}&lon=${bestPoint.lon}&format=json`,
        { headers: { 'User-Agent': 'solsoker/1.0' } },
        8000
        )
        const addr2 = geoData2.address || {}
        placeName = addr2.city || addr2.town || addr2.village || addr2.hamlet || geoData2.display_name
      } catch {
        placeName = `${bestPoint.lat.toFixed(5)},${bestPoint.lon.toFixed(5)}`
      }

      // Hent full forecast
    const fData = await fetchJsonWithTimeout(
        `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${bestPoint.lat}&lon=${bestPoint.lon}`,
      { headers: { 'User-Agent': 'solsoker/1.0' } },
      8000
    )
    const forecast = fData.properties.timeseries

    setBest({ ...bestPoint, name: placeName, forecast })
    
    // Update map state with best location
    setBestLocation({ lat: bestPoint.lat, lng: bestPoint.lon, name: placeName })
    
    setLoading(false)
  }

  const handleManualLocation = async () => {
    if (!manualLocation.trim()) return
    
    setLoading(true)
    setError(null)
    setBest(null)
    
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualLocation)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'solsoker/1.0' } }
      )
      const geoData = await geoRes.json()
      if (geoData.length === 0) {
        setError('Fant ikke stedet: ' + manualLocation)
        setLoading(false)
        return
      }
      const { lat, lon } = geoData[0]
      const latNum = parseFloat(lat)
      const lngNum = parseFloat(lon)
      
      // Set location and show map for radius selection
      console.log('Setting location:', { lat: latNum, lng: lngNum, name: manualLocation })
      setMapCenter({ lat: latNum, lng: lngNum })
      setUserLocation({ lat: latNum, lng: lngNum, name: manualLocation })
      setShowMap(true)
      setHasLocation(true)
      setShowSearchButton(true)
      setLoading(false)
    } catch (err) {
      setError('Feil ved oppslag av sted: ' + err.message)
      setLoading(false)
    }
  }

  // Hent stedsforslag mens man skriver (debounced)
  useEffect(() => {
    let active = true
    if (!manualLocation || manualLocation.trim().length < 2 || hasSelectedSuggestion) {
      setSuggestions([])
      return
    }
    const id = setTimeout(async () => {
      try {
        setIsSearchingPlaces(true)
        const data = await fetchJsonWithTimeout(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualLocation)}&format=json&limit=5&addressdetails=1&countrycodes=no`,
          { headers: { 'User-Agent': 'solsoker/1.0' } },
          8000
        )
        if (!active) return
        setSuggestions(Array.isArray(data) ? data : [])
      } catch {
        if (!active) return
        setSuggestions([])
      } finally {
        if (active) setIsSearchingPlaces(false)
      }
    }, 300)
    return () => {
      active = false
      clearTimeout(id)
    }
  }, [manualLocation, hasSelectedSuggestion])

  const handlePickSuggestion = async (s) => {
    const addr = s.address || {}
    const primary = addr.city || addr.town || addr.village || addr.hamlet || addr.neighbourhood || addr.suburb || s.display_name
    const parts = []
    const municipality = addr.municipality
    const county = addr.county
    const state = addr.state || addr.state_district
    if (municipality && municipality !== primary) parts.push(municipality)
    if (county && county !== primary && county !== municipality) parts.push(county)
    if (state && state !== county && state !== municipality) parts.push(state)
    const display = parts.length ? `${primary}, ${parts.join(', ')}` : primary
    setManualLocation(display)
    setSuggestions([])
    setHasSelectedSuggestion(true)
    setSelectedIndex(-1)
    
    // Set location and show map for radius selection
    const lat = parseFloat(s.lat)
    const lng = parseFloat(s.lon)
    setMapCenter({ lat, lng })
    setUserLocation({ lat, lng, name: display })
    setShowMap(true)
    setHasLocation(true)
    setShowSearchButton(true)
  }

  const handleKeyDown = (e) => {
    if (!suggestions.length) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (selectedIndex === -1) {
          // First arrow down - select first item
          setSelectedIndex(0)
        } else {
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          )
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (selectedIndex === -1) {
          // First arrow up - select last item
          setSelectedIndex(suggestions.length - 1)
        } else {
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          )
        }
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handlePickSuggestion(suggestions[selectedIndex])
        } else {
          // If no selection, trigger search
          handleManualLocation()
        }
        break
      case 'Escape':
        setSuggestions([])
        setSelectedIndex(-1)
        break
    }
  }

  const findBestWeather = async () => {
    setLoading(true)
    setError(null)
    setBest(null)
    setShowManualInput(false)

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
      await processLocation(latitude, longitude)
    }, err => {
      setError('Klarte ikke hente posisjon: ' + err.message + '. Prøv å skrive inn et sted manuelt nedenfor.')
      setShowManualInput(true)
      setLoading(false)
    }, { enableHighAccuracy: true })
  }

  return (
    <ErrorBoundary>
      <div style={{ 
        fontFamily: 'Segoe UI, sans-serif', 
        padding: '2rem', 
        maxWidth: 900, 
        margin: 'auto',
        backgroundColor: darkMode ? '#1a1a1a' : '#fff',
        color: darkMode ? '#fff' : '#000',
        minHeight: '100vh',
        transition: 'all 0.3s ease'
      }}>
        <style>{`
          body {
            background-color: ${darkMode ? '#1a1a1a' : '#fff'};
            color: ${darkMode ? '#fff' : '#000'};
            transition: all 0.3s ease;
          }
          html {
            background-color: ${darkMode ? '#1a1a1a' : '#fff'};
          }
        `}</style>
      <style>{`
        @keyframes wave {
          0%, 80%, 100% {
            transform: translateY(0px);
          }
          40% {
            transform: translateY(-8px);
          }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div></div> {/* Empty div for spacing */}
        <h1 style={{ textAlign: 'center', color: darkMode ? '#ff6b6b' : '#f4d03f', margin: 0 }}>
          {darkMode ? 'Stormsøker' : 'Solsøker'}
        </h1>
      <button
        onClick={() => setDarkMode(!darkMode)}
        style={{
          background: darkMode ? '#2c3e50' : '#2a2a2a',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease'
        }}
        title={darkMode ? 'Switch to Solsøker' : 'Switch to Stormsøker'}
      >
        {darkMode ? '🌞' : '⛈️'}
      </button>
      </div>
      {/* Sliders for vekter */}
      <fieldset style={{ 
        border: darkMode ? '2px solid #444' : '2px solid #d4e6d4', 
        borderRadius: 8, 
        padding: '1rem', 
        marginBottom: '1rem', 
        backgroundColor: darkMode ? '#2a2a2a' : '#f0f8f0', 
        position: 'relative' 
      }}>
        <div style={{ 
          position: 'absolute', 
          top: '0.5rem', 
          left: '0.5rem', 
          fontWeight: 'bold', 
          fontSize: '1rem', 
          color: darkMode ? '#fff' : '#2c3e50', 
          backgroundColor: darkMode ? '#2a2a2a' : '#f0f8f0', 
          padding: '0 0.5rem' 
        }}>Prioriter værfaktorer</div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <svg
            ref={svgRef}
            width={TRI_W}
            height={TRI_H}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{ touchAction: 'none', cursor: 'pointer', userSelect: 'none', background: darkMode ? '#2a2a2a' : '#f0f8f0', borderRadius: 8, overflow: 'visible' }}
          >
            {/* Triangle */}
            <polygon points={`${vA.x},${vA.y} ${vB.x},${vB.y} ${vC.x},${vC.y}`} fill="#f7fbff" stroke="#cfe3ff" strokeWidth="2" />

            {/* Zelda-style grid lines - equilateral triangle subdivisions */}
            {[1, 2, 3, 4].map((level, i) => {
              const t = level / 5 // 0.2, 0.4, 0.6, 0.8
              const lines = []
              
              // Lines parallel to each side
              // Parallel to BC (bottom)
              const p1 = { x: (1 - t) * vA.x + t * vB.x, y: (1 - t) * vA.y + t * vB.y }
              const p2 = { x: (1 - t) * vA.x + t * vC.x, y: (1 - t) * vA.y + t * vC.y }
              lines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y })
              
              // Parallel to AC (right)
              const p3 = { x: (1 - t) * vB.x + t * vA.x, y: (1 - t) * vB.y + t * vA.y }
              const p4 = { x: (1 - t) * vB.x + t * vC.x, y: (1 - t) * vB.y + t * vC.y }
              lines.push({ x1: p3.x, y1: p3.y, x2: p4.x, y2: p4.y })
              
              // Parallel to AB (left)
              const p5 = { x: (1 - t) * vC.x + t * vA.x, y: (1 - t) * vC.y + t * vA.y }
              const p6 = { x: (1 - t) * vC.x + t * vB.x, y: (1 - t) * vC.y + t * vB.y }
              lines.push({ x1: p5.x, y1: p5.y, x2: p6.x, y2: p6.y })
              
              return (
                <g key={i}>
                  {lines.map((line, j) => (
                    <line 
                      key={j}
                      x1={line.x1} y1={line.y1} 
                      x2={line.x2} y2={line.y2} 
                      stroke="#e0e8f0" 
                      strokeWidth="1" 
                      opacity="0.6"
                    />
                  ))}
                </g>
              )
            })}

            {/* Labels */}
            <text x={vA.x} y={vA.y - 12} textAnchor="middle" fontSize="18" style={{ zIndex: 10 }}>☀️</text>
            <text x={vB.x - 8} y={vB.y + 20} textAnchor="end" fontSize="18" style={{ zIndex: 10 }}>🌡️</text>
            <text x={vC.x + 8} y={vC.y + 20} textAnchor="start" fontSize="18" style={{ zIndex: 10 }}>💨</text>

            {/* Selector */}
            <circle cx={selectorPos.x} cy={selectorPos.y} r="7" fill="#2d7ff9" stroke="white" strokeWidth="2" />
          </svg>
          <div style={{ minWidth: 140, fontSize: 12, color: darkMode ? '#fff' : '#34495e' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
              <span style={{ fontSize: '14px', marginRight: '6px' }}>☀️</span>
              <span style={{ minWidth: '30px', textAlign: 'right', marginRight: '6px' }}>{(solWeight * 100).toFixed(0)}%</span>
              <span>- Mest mulig solskinn</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
              <span style={{ fontSize: '14px', marginRight: '6px' }}>🌡️</span>
              <span style={{ minWidth: '30px', textAlign: 'right', marginRight: '6px' }}>{(tempWeight * 100).toFixed(0)}%</span>
              <span>- Temperatur nærmest mulig 25 grader</span>
          </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', marginRight: '6px' }}>💨</span>
              <span style={{ minWidth: '30px', textAlign: 'right', marginRight: '6px' }}>{(windWeight * 100).toFixed(0)}%</span>
              <span>- {darkMode ? 'Sterk vind (17 m/s optimal)' : 'Minst mulig vind'}</span>
          </div>
          </div>
        </div>
      </fieldset>
      
      {error && <p style={{ color:'red', textAlign:'center' }}>{error}</p>}


      {showManualInput && (
        <div style={{ 
          marginBottom: '1rem', 
          background: darkMode ? '#2a2a2a' : '#fff3cd', 
          padding: '1rem', 
          borderRadius: 8, 
          border: darkMode ? '1px solid #444' : '1px solid #ffeaa7', 
          position: 'relative' 
        }}>
          <div style={{ 
            position: 'absolute', 
            top: '0.5rem', 
            left: '0.5rem', 
            fontWeight: 'bold', 
            fontSize: '1rem', 
            color: darkMode ? '#fff' : '#2c3e50', 
            backgroundColor: darkMode ? '#2a2a2a' : '#fff3cd', 
            padding: '0 0.5rem' 
          }}>Posisjon</div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', position: 'relative', minHeight: '60px' }}>
            <div style={{ position: 'relative' }} ref={suggestionsBoxRef}>
              <input
              type="text"
              placeholder="F.eks: Oslo, Bergen, Trondheim..."
              value={manualLocation}
              onChange={e => {
                setManualLocation(e.target.value)
                setHasSelectedSuggestion(false) // Reset when user starts typing again
                setSelectedIndex(-1) // Reset selection when typing
              }}
              onKeyDown={handleKeyDown}
              onKeyPress={e => e.key === 'Enter' && handleManualLocation()}
              style={{ 
                padding: '0.5rem', 
                border: '1px solid #ccc', 
                borderRadius: 4, 
                width: '250px',
                fontSize: '1rem'
              }}
              />
              {(isSearchingPlaces || suggestions.length > 0) && (
                <div style={{ position: 'absolute', top: '110%', left: 0, width: '100%', background: 'white', border: '1px solid #ddd', borderRadius: 6, boxShadow: '0 4px 10px rgba(0,0,0,0.08)', textAlign: 'left', zIndex: 10 }}>
                  {isSearchingPlaces && (
                    <div style={{ padding: '0.5rem 0.75rem', color: '#666', fontSize: 13 }}>Søker…</div>
                  )}
                  {suggestions.length > 0 && (
                    <div style={{ 
                      padding: '0.5rem 0.75rem', 
                      fontSize: '12px', 
                      color: '#666', 
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: '#f8f9fa'
                    }}>
                      ↑↓ Naviger, Enter velg, Esc lukk
                    </div>
                  )}
                  {suggestions.map((s, idx) => {
                    const addr = s.address || {}
                    const primary = addr.city || addr.town || addr.village || addr.hamlet || addr.neighbourhood || addr.suburb || s.display_name
                    const parts = []
                    const municipality = addr.municipality
                    const county = addr.county
                    const state = addr.state || addr.state_district
                    if (municipality && municipality !== primary) parts.push(municipality)
                    if (county && county !== primary && county !== municipality) parts.push(county)
                    if (state && state !== county && state !== municipality) parts.push(state)
                    const secondary = parts.join(', ')
                    return (
                      <button 
                        key={idx} 
                        onClick={() => handlePickSuggestion(s)} 
                        style={{ 
                          display: 'block', 
                          width: '100%', 
                          padding: '0.5rem 0.75rem', 
                          background: selectedIndex === idx ? '#e3f2fd' : 'white', 
                          border: 'none', 
                          borderBottom: '1px solid #f0f0f0', 
                          textAlign: 'left', 
                          cursor: 'pointer',
                          color: selectedIndex === idx ? '#1976d2' : 'inherit'
                        }}
                      >
                        <div style={{ fontSize: 14, color: '#222' }}>{primary}</div>
                        {secondary && <div style={{ fontSize: 12, color: '#777' }}>{secondary}</div>}
                      </button>
                    )
                  })}
                  {!isSearchingPlaces && suggestions.length === 0 && manualLocation.trim().length >= 2 && (
                    <div style={{ padding: '0.5rem 0.75rem', color: '#777', fontSize: 13 }}>Ingen treff</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      
      {/* Map Display - Show after location is set */}
      {showMap && mapCenter && mapCenter.lat && mapCenter.lng && (
        <div style={{ 
          marginTop: '1rem', 
          border: darkMode ? '1px solid #444' : '1px solid #ccc', 
          borderRadius: 8, 
          padding: '1rem', 
          backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9',
          position: 'relative'
        }}>
          <div style={{ 
            position: 'absolute', 
            top: '0.5rem', 
            left: '0.5rem', 
            fontWeight: 'bold', 
            fontSize: '1rem', 
            color: darkMode ? '#fff' : '#2c3e50', 
            backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9', 
            padding: '0 0.5rem' 
          }}>Kart</div>
          
          {/* Location info */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem', 
              backgroundColor: darkMode ? '#1a1a1a' : 'white', 
              borderRadius: 8, 
              border: darkMode ? '1px solid #444' : '1px solid #ddd' 
            }}>
              <div style={{ 
                fontWeight: 'bold', 
                color: darkMode ? '#fff' : '#2c3e50', 
                marginBottom: '0.5rem' 
              }}>Din posisjon</div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: darkMode ? '#ccc' : '#666' 
              }}>{userLocation?.name || 'Ukjent'}</div>
              <div style={{ 
                fontSize: '0.8rem', 
                color: darkMode ? '#999' : '#999' 
              }}>
                {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
              </div>
            </div>
            
            {bestLocation && (
              <>
                <div style={{ fontSize: '1.5rem', color: '#666' }}>→</div>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '1rem', 
                  backgroundColor: darkMode ? '#1a3a1a' : '#e8f5e8', 
                  borderRadius: 8, 
                  border: darkMode ? '1px solid #4caf50' : '1px solid #4caf50' 
                }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: darkMode ? '#fff' : '#2c3e50', 
                    marginBottom: '0.5rem' 
                  }}>Beste vær</div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: darkMode ? '#ccc' : '#666' 
                  }}>{bestLocation?.name || 'Ukjent'}</div>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: darkMode ? '#999' : '#999' 
                  }}>
                    {bestLocation?.lat.toFixed(4)}, {bestLocation?.lng.toFixed(4)}
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Radius slider */}
          <div style={{ 
            marginBottom: '1rem', 
            padding: '1rem', 
            backgroundColor: darkMode ? '#d3d3d3' : '#f8f9fa', 
            border: '1px solid #dee2e6', 
            borderRadius: 8,
            textAlign: 'center'
          }}>
            <label style={{ 
              display: 'block', 
              fontWeight: 'bold', 
              color: '#2c3e50', 
              marginBottom: '0.5rem' 
            }}>
              Søkeradius: {searchRadius} km
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={searchRadius}
              onChange={(e) => setSearchRadius(parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: '#ccc',
                outline: 'none',
                cursor: 'pointer',
                accentColor: '#666'
              }}
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: '0.8rem', 
              color: '#666',
              marginTop: '0.25rem'
            }}>
              <span>5 km</span>
              <span>50 km</span>
              <span>100 km</span>
            </div>
          </div>
          
          {/* Search button */}
          {showSearchButton && (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <button
                onClick={() => {
                  setLoading(true)
                  setError(null)
                  setBest(null)
                  setBestLocation(null)
                  processLocation(mapCenter.lat, mapCenter.lng, userLocation?.name)
                }}
                disabled={loading}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: 6,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                {loading ? (
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.3rem', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    minHeight: '1.1rem',
                    minWidth: '200px'
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      animation: 'wave 1.4s ease-in-out infinite both',
                      animationDelay: '0s'
                    }}></div>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      animation: 'wave 1.4s ease-in-out infinite both',
                      animationDelay: '0.2s'
                    }}></div>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      animation: 'wave 1.4s ease-in-out infinite both',
                      animationDelay: '0.4s'
                    }}></div>
                  </div>
                ) : 'Søk etter beste vær'}
              </button>
            </div>
          )}

          
          {/* Leaflet map */}
          <div style={{ border: '1px solid #90caf9', borderRadius: 8, position: 'relative', overflow: 'hidden' }}>
            <LeafletMap 
              center={mapCenter} 
              bestLocation={bestLocation} 
              userLocation={userLocation}
              searchRadius={searchRadius}
              topWeatherSpots={topWeatherSpots}
            />
            
            {/* Legend */}
            <div style={{ 
              position: 'absolute', 
              bottom: '10px', 
              left: '10px', 
              backgroundColor: darkMode ? 'rgba(42,42,42,0.95)' : 'rgba(255,255,255,0.95)',
              color: darkMode ? '#fff' : '#000',
              padding: '0.75rem',
              borderRadius: 6,
              fontSize: '0.85rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              zIndex: 1000,
              maxWidth: '200px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: '#2196f3', borderRadius: '50%', marginRight: '0.5rem' }}></div>
                Din posisjon
              </div>
              {bestLocation && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <div style={{ width: '10px', height: '10px', backgroundColor: '#4caf50', borderRadius: '50%', marginRight: '0.5rem' }}></div>
                  Beste vær
                </div>
              )}
              {topWeatherSpots && topWeatherSpots.length > 0 && (
                <div style={{ borderTop: '1px solid #eee', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.8rem' }}>Topp 3 vær:</div>
                  {topWeatherSpots.map((spot, index) => {
                    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1']
                    const color = colors[index] || '#666'
                    return (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.15rem', fontSize: '0.75rem' }}>
                        <div style={{ 
                          width: '12px', 
                          height: '12px', 
                          backgroundColor: color, 
                          borderRadius: '50%', 
                          marginRight: '0.4rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '8px',
                          fontWeight: 'bold'
                        }}>
                          {spot.rank}
                        </div>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {spot.name}
                        </span>
                        <span style={{ color: '#666', marginLeft: '0.25rem' }}>
                          {(spot.score * 100).toFixed(0)}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {best && (
        <div style={{ 
          background: darkMode ? '#2a2a2a' : 'white', 
          padding:'1.5rem', 
          borderRadius:10, 
          boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)', 
          marginTop:'1.5rem',
          color: darkMode ? '#fff' : '#000'
        }}>
          <h2 style={{ color: darkMode ? '#fff' : '#34495e' }}>Beste sted: {best.name}</h2>
          <p style={{ color: darkMode ? '#fff' : '#000' }}>Temperatur nå: <strong>{best.temp}°C</strong></p>
          <p style={{ color: darkMode ? '#fff' : '#000' }}>Skydekke nå: <strong>{best.cloud}%</strong></p>
          <p style={{ color: darkMode ? '#fff' : '#000' }}>
            Vind nå: <strong>{best.wind.toFixed(1)} m/s</strong>
            {best.gust !== null && (
              <>&nbsp;– kast: <strong>{best.gust.toFixed(1)} m/s</strong></>
            )}
          </p>

          <h3 style={{ color: darkMode ? '#fff' : '#000' }}>Værmelding (neste 24 timer)</h3>
          <div style={{ 
            display:'grid', 
            gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr 3fr', 
            textAlign:'left', 
            fontWeight:'bold', 
            borderBottom: darkMode ? '2px solid #444' : '2px solid #ddd', 
            paddingBottom:'0.5rem',
            color: darkMode ? '#fff' : '#000'
          }}>
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
              <div key={f.time} style={{ 
                display:'grid', 
                gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr 3fr', 
                padding:'0.5rem 0', 
                borderBottom: darkMode ? '1px solid #444' : '1px solid #eee', 
                alignItems:'center',
                color: darkMode ? '#fff' : '#000'
              }}>
                <div>{time}</div>
                <div>{iconUrl ? <img src={iconUrl} alt={sym} style={{width:24,height:24}} /> : '❓'}</div>
                <div>{det.air_temperature}°</div>
                <div style={{color: darkMode ? '#4fc3f7' : '#007aff'}}>{precip}</div>
                <div>{`${speed}${gustF ? `, ${gustF}` : ''} ${arrow}`}</div>
                <div style={{ textAlign:'left' }}>{desc}</div>
              </div>
            )
          })}
        </div>
      )}

    </div>
    </ErrorBoundary>
  )
}