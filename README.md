# ✈️ Airplane Tracker


**Wondering what airplane is flying over your head? Check at - https://tinyurl.com/airplanetracker**

A real-time airplane tracking application that shows aircraft currently flying in your vicinity. The app provides detailed information about nearby aircraft including direction, altitude, speed, and destination.

## 🌟 Features

- **Real-time Aircraft Tracking**: Get live updates of aircraft in your area
- **Geolocation**: Automatically detects your current location
- **Directional Information**: Shows which direction to look for each aircraft
- **Comprehensive Aircraft Data**: Displays callsign, altitude, speed, country of origin
- **Customizable Search Radius**: Adjust search area from 25km to 500km
- **Auto-refresh**: Automatically updates aircraft data every 30 seconds
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Beautiful, intuitive interface with smooth animations

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Modern web browser with geolocation support

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd airplane_tracker
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your API keys (see API Configuration section below)

4. **Start the application**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 🔑 API Configuration

The application uses multiple aviation data sources for redundancy and reliability:

### 1. OpenSky Network (Recommended - Free)
- **No API key required**
- **Rate limit**: 10 requests per minute
- **Coverage**: Worldwide
- **Data**: Real-time aircraft positions, altitude, speed, heading

### 2. Aviation Stack (Optional - Paid)
- **API key required**: Get from [aviationstack.com](https://aviationstack.com/)
- **Free tier**: 100 requests per month
- **Coverage**: Global flight data
- **Data**: Flight schedules, airline information

### Environment Variables

```bash
# Aviation Stack API (optional)
AVIATION_API_KEY=your_api_key_here
AVIATION_API_BASE_URL=https://api.aviationstack.com/v1

# OpenSky Network (optional - for higher rate limits)
OPENSKY_USERNAME=your_username_here
OPENSKY_PASSWORD=your_password_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_PATH=./data/airplanes.db

# Update Intervals (in seconds)
AIRCRAFT_UPDATE_INTERVAL=30
USER_LOCATION_CACHE_DURATION=300
```

## 🏗️ Architecture

### Backend (Node.js/Express)
- **Server**: Express.js with security middleware
- **Database**: SQLite with automatic schema creation
- **Real-time Updates**: Cron jobs for aircraft data refresh
- **API Endpoints**: RESTful API for aircraft and location data
- **Security**: Helmet, CORS, rate limiting

### Frontend (React/TypeScript)
- **Framework**: React 18 with TypeScript
- **Styling**: CSS3 with modern design patterns
- **Animations**: Framer Motion for smooth transitions
- **State Management**: React hooks for local state
- **Responsive**: Mobile-first design approach

### Data Flow
1. User grants location permission
2. App fetches aircraft data from aviation APIs
3. Data is processed and stored in SQLite database
4. Frontend displays aircraft with directional information
5. Auto-refresh keeps data current

## 📱 Usage

### Getting Started
1. **Allow Location Access**: Grant permission when prompted
2. **View Aircraft**: See all aircraft within your search radius
3. **Adjust Settings**: Modify search radius and refresh settings
4. **Monitor Updates**: Watch real-time aircraft movements

### Understanding the Display
Each aircraft card shows:
- **Callsign**: Aircraft identification (e.g., "UAL123")
- **Direction**: Where to look relative to your position
- **Distance**: How far the aircraft is from you
- **Altitude**: Aircraft height above sea level
- **Speed**: Current airspeed in knots
- **Country**: Origin country of the aircraft

### Example Output
```
Look to your North East, there is a UAL123 at 10,000m flying at 450 knots
```

## 🔧 Development

### Project Structure
```
airplane_tracker/
├── server/                 # Backend server
│   ├── database/          # Database initialization
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic
│   └── index.js           # Server entry point
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/               # Source code
│   └── package.json       # Frontend dependencies
├── data/                   # SQLite database files
├── package.json            # Backend dependencies
└── README.md              # This file
```

### Available Scripts

#### Backend
```bash
npm run server:dev     # Start server with nodemon
npm start             # Start production server
```

#### Frontend
```bash
npm run client:dev    # Start React dev server
npm run build         # Build for production
```

#### Full Stack
```bash
npm run dev           # Start both frontend and backend
npm run install:all   # Install all dependencies
```

### Database Schema

#### Aircraft Table
- `icao24`: Unique aircraft identifier
- `callsign`: Flight number or callsign
- `latitude/longitude`: Current position
- `altitude`: Height above sea level
- `velocity`: Ground speed
- `true_track`: Direction of travel
- `origin_country`: Country of origin

#### User Locations Table
- `user_id`: Unique user identifier
- `latitude/longitude`: User's position
- `timestamp`: When location was recorded

## 🌐 API Endpoints

### Aircraft Endpoints
- `GET /api/aircraft/nearby` - Get aircraft near coordinates
- `GET /api/aircraft/all` - Get all aircraft in database
- `GET /api/aircraft/:icao24` - Get specific aircraft
- `GET /api/aircraft/stats/overview` - Get aircraft statistics

### Location Endpoints
- `POST /api/location/store` - Store user location
- `GET /api/location/:user_id` - Get user location
- `GET /api/location/reverse/:lat/:lon` - Reverse geocoding
- `POST /api/location/distance` - Calculate distance between points

## 🚨 Troubleshooting

### Common Issues

1. **No aircraft displayed**
   - Check if aviation APIs are accessible
   - Verify API keys in `.env` file
   - Increase search radius
   - Check browser console for errors

2. **Location permission denied**
   - Allow location access in browser settings
   - Try refreshing the page
   - Check if HTTPS is required (some browsers require secure context)

3. **API rate limiting**
   - OpenSky Network: 10 requests/minute
   - Aviation Stack: Check your plan limits
   - Consider upgrading to paid plans for higher limits

4. **Database errors**
   - Check file permissions for `./data/` directory
   - Verify SQLite is properly installed
   - Check server logs for specific error messages

### Debug Mode
Enable debug logging by setting:
```bash
NODE_ENV=development
DEBUG=airplane-tracker:*
```

## 🔒 Security Features

- **CORS Protection**: Configurable allowed origins
- **Helmet Security**: Security headers and CSP
- **Input Validation**: All API inputs are validated
- **Rate Limiting**: Built-in request throttling
- **SQL Injection Protection**: Parameterized queries

## 📊 Performance

- **Database Indexing**: Optimized queries with proper indexes
- **Caching**: Aircraft data cached in SQLite
- **Compression**: Gzip compression for API responses
- **Efficient Updates**: Only fetch new/changed data
- **Background Processing**: Non-blocking aircraft updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **OpenSky Network**: Free aviation data API
- **Aviation Stack**: Commercial aviation data
- **OpenStreetMap**: Reverse geocoding services
- **React Community**: Frontend framework and ecosystem

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review API documentation for external services

---

**Note**: This application is for educational and personal use. Always respect privacy and aviation regulations when tracking aircraft.


