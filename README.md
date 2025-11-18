# Solsøker / Stormsøker ☀️⛈️

En intelligent væroptimaliseringsapp som hjelper brukere med å finne de beste værforholdene innenfor en spesifisert radius ved å analysere sol, temperatur og vind.

## 🌟 Funksjoner

- **Interaktiv værvekting** med ternær trekantkontroll for prioritering av sol, temperatur og vind
- **Polar grid-søkealgoritme** for effektiv værlokasjonsfinnning (81 punkter på 5 ringer)
- **Interaktivt kart** med Leaflet.js som viser søkeresultater
- **Dark/Light mode** toggle (Solsøker/Stormsøker)
- **Sanntids værdata** fra Met.no API
- **Stedssøk** med autocomplete fra Nominatim (OpenStreetMap)
- **Responsiv design** for mobil og desktop

## 🏗️ Arkitektur

### Frontend
- **React 18** med hooks (useState, useEffect, useRef)
- **Vite** som build tool og dev server
- **Leaflet.js** for interaktive kart (ikke Google Maps)
- **CSS-in-JS** styling direkte i komponenter
- **Responsive design** med window.innerWidth detection

### Backend/API
Appen har to deployment-modeller:

#### 1. **Lokal/Docker**: Node.js Express Server
- `server.js` - Express server som:
  - Serverer statiske filer fra `/dist`
  - Proxyer API-kall til Met.no og Nominatim
  - Håndterer CORS og caching

#### 2. **Vercel**: Serverless Functions
- `api/geocode.js` - Nominatim geocoding proxy
- `api/met.js` - Met.no værdataproxy
- Hver funksjon er en separat serverless endpoint

### Eksterne API-er (alle gratis!)
- **Met.no Locationforecast API** - Norske værdata
- **Nominatim (OpenStreetMap)** - Geocoding og stedssøk
- **OpenStreetMap** - Kartfliser via Leaflet
- **Kartverket WMS** - Fjellskygge-overlay for Norge

## 📁 Prosjektstruktur

```
solsoker/
├── src/                          # Frontend kildekode
│   ├── App.jsx                   # Hovedkomponent med all app-logikk
│   ├── main.jsx                  # React entry point
│   ├── assets/                   # Statiske ressurser
│   │   └── symbols/              # Værikoner (SVG) og UI-ikoner (PNG)
│   │       ├── clearsky_day.svg  # 90+ værikon-filer fra Met.no
│   │       ├── sun.png           # Sol-ikon for UI
│   │       ├── temperature.png   # Temperatur-ikon for UI
│   │       ├── wind.png          # Vind-ikon for UI
│   │       └── storm.png         # Storm-ikon for dark mode
│   └── working_app.jsx           # Backup/tidligere versjon
│
├── api/                          # Vercel Serverless Functions
│   ├── geocode.js                # Nominatim geocoding proxy
│   └── met.js                    # Met.no værdata proxy
│
├── public/                       # Statiske filer (kopieres til dist/)
│   └── favicon.png               # App-ikon
│
├── server.js                     # Express server for lokal/Docker kjøring
├── index.html                    # HTML entry point
├── vite.config.js                # Vite build-konfigurasjon
├── package.json                  # npm dependencies og scripts
├── Dockerfile                    # Multi-stage Docker build
└── README.md                     # Denne filen

```

## 🔧 Komponenter og Filer

### Frontend Komponenter

#### `src/App.jsx` (1606 linjer)
Hovedkomponenten som inneholder all app-logikk:

**Komponenter:**
- `LeafletMap` - Interaktivt kartkomponent med markører for brukerposisjon, beste lokasjon, og topp 3 værspots
- `ErrorBoundary` - React error boundary for feilhåndtering
- `App` - Hovedkomponent med all state management

**Hovedfunksjoner:**
- `processLocation()` - Kjører polar grid-søkealgoritmen for å finne beste vær
- `handleManualLocation()` - Håndterer manuell stedssøk med validering
- `handlePickSuggestion()` - Håndterer valg av stedsforslag
- `findBestWeather()` - Bruker GPS for å finne brukerens posisjon
- Ternær trekantkontroll - matematiske funksjoner for barycentriske koordinater

**State management:**
- Værdatastate (best, userLocation, topWeatherSpots)
- UI-state (loading, error, showMap, darkMode)
- Søkestate (manualLocation, suggestions, searchRadius)
- Vektingsstate (solWeight, tempWeight, windWeight)

**Styling:**
- Inline CSS-in-JS styling
- Dynamisk dark/light mode
- Responsive design med media queries
- Animasjoner (wave, searchPulse)

#### `src/main.jsx`
React entry point som:
- Importerer Leaflet CSS
- Laster Leaflet.js fra CDN dynamisk
- Monterer App-komponenten

### Backend/API

#### `server.js` (97 linjer)
Express server for lokal/Docker deployment:

**Endepunkter:**
- `GET /api/geocode` - Geocoding proxy til Nominatim
  - Forward geocoding: `?q={search_term}`
  - Reverse geocoding: `?type=reverse&lat={lat}&lon={lon}`
  - Rate limiting: 1 forespørsel per sekund
  - Caching: 10 minutter
  
- `GET /api/met` - Værdata proxy til Met.no
  - `?lat={lat}&lon={lon}`
  - Caching: 5 minutter
  
- `GET *` - Serve React app (SPA routing)

**Funksjoner:**
- CORS aktivert for alle ruter
- Proper User-Agent headers for API-krav
- Error logging til console
- Static file serving fra `/dist`

#### `api/geocode.js`
Vercel Serverless Function for geocoding:
- Identisk logikk som server.js geocode-rute
- Default export av async handler-funksjon
- Caching headers for Vercel Edge Network

#### `api/met.js`
Vercel Serverless Function for værdata:
- Identisk logikk som server.js met-rute
- Default export av async handler-funksjon
- Caching headers for Vercel Edge Network

### Konfigurasjon

#### `vite.config.js`
Vite build-konfigurasjon:
- React plugin aktivert
- Port 3000 for dev server
- Build output til `/dist`

#### `package.json`
Dependencies og scripts:

**Dependencies:**
- `react` & `react-dom` ^18.2.0
- `express` ^4.18.2 (for server.js)
- `cors` ^2.8.5

**DevDependencies:**
- `vite` ^5.0.0
- `@vitejs/plugin-react` ^4.0.0

**Scripts:**
- `npm run dev` - Start Vite dev server
- `npm run build` - Build production bundle
- `npm run serve` - Preview production build
- `npm start` - Start Express server (prod)

#### `Dockerfile` (Multi-stage build)
To-stegs Docker build for optimal image-størrelse:

**Stage 1: Builder**
- Base: `node:18-alpine`
- Installerer dependencies
- Kjører `npm run build`
- Output: `/app/dist`

**Stage 2: Production**
- Base: `node:18-alpine`
- Kopierer kun production dependencies
- Kopierer bygget app fra stage 1
- Kopierer `server.js`
- Eksponerer port 3000
- CMD: `npm start`

## 🚀 Lokal Utvikling

### Metode 1: Docker (anbefalt for prod-testing)

**Forutsetninger:**
- Docker Desktop installert og kjørende

**Start app:**
```bash
# Bygg Docker image
docker build -t solsoker .

# Kjør container
docker run -d -p 3000:3000 --name solsoker-app solsoker

# Åpne i nettleser
open http://localhost:3000
```

**Nyttige kommandoer:**
```bash
# Se logger
docker logs -f solsoker-app

# Stopp app
docker stop solsoker-app

# Start app igjen
docker start solsoker-app

# Fjern container
docker rm -f solsoker-app

# Rebuild etter kodeendringer
docker rm -f solsoker-app
docker build -t solsoker .
docker run -d -p 3000:3000 --name solsoker-app solsoker
```

### Metode 2: Direkte med npm (raskest for utvikling)

**Forutsetninger:**
- Node.js 18+ installert

**Start app:**
```bash
# Installer dependencies
npm install

# Start dev server (hot reload)
npm run dev
# Åpner på http://localhost:3000

# ELLER bygg og kjør production
npm run build
npm start
```

**Dev vs Prod:**
- `npm run dev` - Vite dev server med hot reload, bruker proxy i vite.config.js
- `npm start` - Express server som i Docker, serverer fra `/dist`

## 🌐 Deployment til Vercel

### Automatisk deployment (anbefalt)

**Setup:**
1. Push kode til GitHub repository
2. Gå til [vercel.com](https://vercel.com)
3. Importer repository
4. Vercel detekterer Vite automatisk
5. Deploy!

**Automatisk ved hver push:**
- Push til `main` branch → Production deployment
- Push til andre branches → Preview deployment

### Hvordan Vercel deployment fungerer

**Build prosess:**
1. Vercel kjører `npm run build`
2. Genererer statisk bundle i `/dist`
3. Deployer `/dist` til Vercel Edge Network
4. Oppdager `/api` folder og deployer som Serverless Functions

**Routing:**
- `/` - Serve React app
- `/api/geocode` - Serverless function
- `/api/met` - Serverless function
- `/*` - Client-side routing (React Router)

**Fordeler med Vercel:**
- Global CDN for statiske filer
- Serverless functions skalerer automatisk
- Gratis SSL/HTTPS
- Automatiske preview deployments
- Edge Network caching

### Manuell deployment via CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy til production
vercel --prod
```

## 🔑 Miljøvariabler

**Ingen miljøvariabler nødvendig!** ✅

Alle eksterne API-er som brukes er gratis og krever ikke API-nøkler:
- Met.no - Gratis, krever kun User-Agent header
- Nominatim - Gratis, krever User-Agent + rate limiting (1 req/sek)
- OpenStreetMap - Gratis kartfliser
- Kartverket - Gratis WMS fjellskygge

## 📊 Polar Grid-Søkealgoritme

Appen bruker en effektiv polar grid-søkealgoritme for å finne beste vær:

**Algoritme:**
1. Generer 81 punkter på 5 konsentriske ringer rundt brukerposisjon
   - Ring 0: 1 punkt (sentrum)
   - Ring 1: 8 punkter
   - Ring 2: 16 punkter
   - Ring 3: 24 punkter
   - Ring 4: 32 punkter

2. Hent 24-timers værvarsel for hvert punkt (parallelt i batches av 10)

3. Beregn score basert på brukerdefinerte vekter:
   ```
   score = wSol * sol + wTemp * tempScore + wWind * windScore
   ```
   
4. Finn topp 3 lokasjoner med høyest score

5. Vis på kart med fargede markører

**Optimaliseringer:**
- Parallell API-kall (10 samtidige)
- Batch processing for å respektere rate limits
- Caching av værdata og geocoding
- Avbryt tidligere søk ved nytt søk

## 🎨 UI/UX Features

**Ternær Trekantkontroll:**
- Interaktiv trekant for å sette vekter for sol, temperatur, og vind
- Drag-and-drop med mus eller touch
- Barycentriske koordinater for presis vektberegning
- Automatisk normalisering (total alltid 100%)

**Dark Mode (Stormsøker):**
- Toggle mellom Solsøker (☀️) og Stormsøker (⛈️)
- Optimaliserer for vind i stedet for minimal vind
- Mørk fargepalett
- Alle ikoner inverteres automatisk

**Interaktivt Kart:**
- Leaflet.js med OpenStreetMap tiles
- Kartverket fjellskygge-overlay
- Fargede markører for topp 3 lokasjoner
- Popup med værinfo på markører
- Søkeradius-sirkel visualisering
- Legend med score for hver lokasjon

**Stedssøk:**
- Autocomplete med Nominatim
- Debounced søk (300ms)
- Keyboard navigering (↑↓ Enter Esc)
- Filtrert til Norge (countrycodes=no)
- Hierarkisk visning (by, kommune, fylke)

## 🛠️ Utvikling

### Kodestil
- Funksjonskomponenter med hooks
- Inline styling (CSS-in-JS)
- Omfattende kommentarer
- Deskriptive variabelnavn
- Error boundaries for robusthet

### Testing i nettleser
```bash
# Start dev server
npm run dev

# Test i forskjellige nettlesere
open -a "Google Chrome" http://localhost:3000
open -a "Safari" http://localhost:3000
open -a "Firefox" http://localhost:3000
```

### Debug
- React DevTools for component state
- Network tab for API-kall
- Console for error logging
- `docker logs -f solsoker-app` for server logs

## 📝 Lisens

Dette prosjektet bruker:
- **Met.no API** - [Norsk lisens for offentlige data (NLOD)](https://api.met.no/doc/License)
- **OpenStreetMap data** - [ODbL](https://www.openstreetmap.org/copyright)
- **Leaflet.js** - [BSD 2-Clause License](https://github.com/Leaflet/Leaflet/blob/main/LICENSE)

## 🐛 Kjente Issues

1. **Nominatim Rate Limiting** - 1 sekund delay på stedsforslag (nødvendig for API compliance)
2. **GPS nøyaktighet** - Avhengig av enhetens GPS-kvalitet
3. **Mobile Safari** - Krever HTTPS for GPS-tilgang (OK i Vercel, ikke i lokal HTTP)

## 🚧 Fremtidige Forbedringer

- [ ] Lagre favorittlokasjoner i localStorage
- [ ] Værhistorikk og trendanalyse
- [ ] Push-varsler ved optimal vær
- [ ] Dele værsøk via URL
- [ ] Flere kartlag (satellitt, topografi)
- [ ] Export værsøk til kalender

## 👤 Kontakt

Opprettet av Jonas Lyng Jørgensen

## 🙏 Takk til

- **Met.no** for gratis værdata API
- **OpenStreetMap** og Nominatim for geocoding
- **Kartverket** for flotte kartlag
- **Vercel** for enkel hosting
