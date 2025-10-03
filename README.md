# 🌞 Solsøker

A Norwegian weather optimization app that helps you find the best weather conditions within a specified radius using an intelligent polar grid search algorithm.

## 🎯 Features

- **Interactive Weather Prioritization**: Drag-and-drop triangle interface to prioritize sunshine, temperature, and wind
- **Polar Grid Search**: Efficient 37-point initial search with adaptive refinement
- **Interactive Map**: Real-time map with Leaflet integration showing your location and best weather spot
- **Radius Control**: Adjustable search radius from 5km to 100km
- **Norwegian Location Search**: Smart location suggestions for Norwegian places
- **Weather Data**: Real-time data from Met.no API

## 🚀 Quick Start with Docker

### Prerequisites
- Docker Desktop installed and running
- Git (to clone the repository)

### 1. Clone the Repository
```bash
git clone https://github.com/jonasly/solsoker.git
cd solsoker
```

### 2. Build the Docker Image
```bash
docker build -t solsoker:latest .
```

### 3. Run the Application
```bash
docker run --name solsoker -d -p 8081:80 solsoker:latest
```

### 4. Access the App
Open your browser and navigate to:
```
http://localhost:8081
```

## 🔧 Development Commands

### Rebuild and Restart
```bash
# Stop and remove existing container
docker rm -f solsoker

# Rebuild image
docker build -t solsoker:latest .

# Run new container
docker run --name solsoker -d -p 8081:80 solsoker:latest
```

### View Container Logs
```bash
docker logs solsoker
```

### Stop the Application
```bash
docker stop solsoker
```

## 🏗️ How It Works

### Weather Search Algorithm
1. **Polar Grid Search**: Creates 37 initial points in a circular pattern
2. **Adaptive Refinement**: Focuses search on promising areas (19 → 7 → 7 points)
3. **Weather Scoring**: Combines sunshine, temperature, and wind factors
4. **Real-time Results**: Updates map with best weather location

### Scoring System
- **☀️ Sunshine**: `1 - (cloud_area_fraction/100)`
- **🌡️ Temperature**: `1 - min(|temp - 25°C|/20, 1)` (20°C deviation penalty)
- **💨 Wind**: `1 - min(wind_speed/15, 1)` (15 m/s threshold)

## 🎨 User Interface

### Weather Prioritization
- Drag the blue dot in the triangle to set priorities
- Real-time percentage updates
- Norwegian descriptions for each factor

### Location Input
- Manual location entry with Norwegian place suggestions
- GPS fallback for automatic location detection
- Interactive map with radius control

### Map Features
- Blue marker: Your location
- Green marker: Best weather location
- Green circle: Search radius
- Interactive zoom and pan

## 📊 Technical Details

### Architecture
- **Frontend**: React.js with Vite
- **Maps**: Leaflet.js for interactive mapping
- **Weather API**: Met.no (Norwegian Meteorological Institute)
- **Geocoding**: Nominatim (OpenStreetMap)
- **Container**: Nginx serving static files

### API Endpoints
- Weather data: `https://api.met.no/weatherapi/locationforecast/2.0/compact`
- Geocoding: `https://nominatim.openstreetmap.org/`

### Performance
- **Initial search**: 37 points
- **Total iterations**: 4 adaptive rounds
- **API rate limiting**: 200ms between requests
- **Search time**: ~8-15 seconds for 10km radius

## 🐳 Docker Configuration

### Dockerfile Structure
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
# ... build React app

FROM nginx:alpine
# ... serve static files
```

### Container Details
- **Base Image**: nginx:alpine
- **Port**: 80 (mapped to host 8081)
- **Volume**: Static files from build stage
- **Health Check**: HTTP endpoint available

## 🔍 Troubleshooting

### Common Issues

#### Docker Daemon Not Running
```bash
# Start Docker Desktop or Docker daemon
# On macOS: Open Docker Desktop application
# On Linux: sudo systemctl start docker
```

#### Port Already in Use
```bash
# Use different port
docker run --name solsoker -d -p 8082:80 solsoker:latest
# Then access: http://localhost:8082
```

#### Container Won't Start
```bash
# Check logs
docker logs solsoker

# Check if port is available
netstat -tulpn | grep 8081
```

#### Changes Not Appearing
```bash
# Hard refresh browser (Ctrl+F5 / Cmd+Shift+R)
# Or rebuild container completely
docker rm -f solsoker
docker build -t solsoker:latest .
docker run --name solsoker -d -p 8081:80 solsoker:latest
```

## 📝 Development

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### File Structure
```
solsoker/
├── src/
│   ├── App.jsx              # Main application
│   ├── main.jsx             # React entry point
│   └── assets/symbols/      # Weather icons
├── Dockerfile               # Docker configuration
├── package.json            # Dependencies
└── index.html              # HTML template
```

## 🌐 Browser Compatibility

- **Chrome**: ✅ Recommended
- **Firefox**: ✅ Supported
- **Safari**: ✅ Supported
- **Edge**: ✅ Supported

### Required Features
- Geolocation API
- ES6+ JavaScript
- CSS Grid/Flexbox
- Fetch API

## 📄 License

This project is open source. Feel free to use and modify as needed.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker
5. Submit a pull request

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Review Docker logs: `docker logs solsoker`
- Ensure Docker Desktop is running
- Verify port 8081 is available

---

**Solsøker** - Find the best weather in Norway! 🇳🇴🌤️
