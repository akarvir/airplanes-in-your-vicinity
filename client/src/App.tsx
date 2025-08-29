import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlane, 
  FaMapMarkerAlt, 
  FaCompass, 
  FaGlobe,
  FaRedo,
  FaInfoCircle
} from 'react-icons/fa';
import './App.css';

interface Aircraft {
  id: number;
  icao24: string;
  callsign: string;
  origin_country: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  true_track: number;
  distance_km: number;
  last_updated: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface AircraftResponse {
  success: boolean;
  data: {
    aircraft: Aircraft[];
    user_location: UserLocation;
    search_radius_km: number;
    timestamp: string;
    count: number;
  };
}

const App: React.FC = () => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState(100);
  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setLoading(false);
        
        // Fetch aircraft data immediately after getting location
        fetchAircraftData(latitude, longitude);
      },
      (error) => {
        setError(`Unable to get your location: ${error.message}`);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, []);

  // Fetch aircraft data from API
  const fetchAircraftData = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<AircraftResponse>(
        `/api/aircraft/nearby?lat=${lat}&lon=${lon}&radius=${searchRadius}`
      );

      if (response.data.success) {
        setAircraft(response.data.data.aircraft);
        setLastUpdate(new Date());
      } else {
        setError('Failed to fetch aircraft data');
      }
    } catch (err) {
      console.error('Error fetching aircraft data:', err);
      setError('Failed to connect to the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate direction relative to user
  const getDirection = (aircraftLat: number, aircraftLon: number): string => {
    if (!userLocation) return 'Unknown';

    const latDiff = aircraftLat - userLocation.latitude;
    const lonDiff = aircraftLon - userLocation.longitude;

    let direction = '';

    // North/South
    if (Math.abs(latDiff) > Math.abs(lonDiff)) {
      direction += latDiff > 0 ? 'North' : 'South';
    } else {
      direction += lonDiff > 0 ? 'East' : 'West';
    }

    // Add secondary direction if significant
    if (Math.abs(latDiff) > 0.1 && Math.abs(lonDiff) > 0.1) {
      if (Math.abs(latDiff) > Math.abs(lonDiff)) {
        direction += lonDiff > 0 ? ' East' : ' West';
      } else {
        direction += latDiff > 0 ? ' North' : ' South';
      }
    }

    return direction;
  };

  // Format aircraft information for display
  const formatAircraftInfo = (plane: Aircraft): string => {
    const direction = getDirection(plane.latitude, plane.longitude);
    const callsign = plane.callsign || 'Unknown Aircraft';
    const altitude = plane.altitude ? `${Math.round(plane.altitude)}m` : 'Unknown altitude';
    const speed = plane.velocity ? `${Math.round(plane.velocity * 1.94384)} knots` : 'Unknown speed';
    
    return `Look to your ${direction}, there is a ${callsign} at ${altitude} flying at ${speed}`;
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !userLocation) return;

    const interval = setInterval(() => {
      fetchAircraftData(userLocation.latitude, userLocation.longitude);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, userLocation, searchRadius]);

  // Initial location detection
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  const handleRefresh = () => {
    if (userLocation) {
      fetchAircraftData(userLocation.latitude, userLocation.longitude);
    }
  };

  const handleRadiusChange = (newRadius: number) => {
    setSearchRadius(newRadius);
    if (userLocation) {
      fetchAircraftData(userLocation.latitude, userLocation.longitude);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="header-content"
        >
          <FaPlane className="header-icon" />
          <h1>Airplane Tracker</h1>
          <p>Real-time aircraft in your vicinity</p>
        </motion.div>
      </header>

      <main className="App-main">
        {/* Location Status */}
        <motion.section
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="location-section"
        >
          <div className="location-header">
            <FaMapMarkerAlt className="location-icon" />
            <h2>Your Location</h2>
          </div>
          
          {userLocation ? (
            <div className="location-info">
              <p>
                <strong>Latitude:</strong> {userLocation.latitude.toFixed(6)}
              </p>
              <p>
                <strong>Longitude:</strong> {userLocation.longitude.toFixed(6)}
              </p>
              <button 
                onClick={handleRefresh}
                className="refresh-btn"
                disabled={loading}
              >
                <FaRedo className={loading ? 'spinning' : ''} />
                Refresh Aircraft
              </button>
            </div>
          ) : (
            <div className="location-prompt">
              <p>Getting your location...</p>
              <button onClick={getUserLocation} className="location-btn">
                <FaMapMarkerAlt />
                Get My Location
              </button>
            </div>
          )}
        </motion.section>

        {/* Settings Panel */}
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="settings-section"
        >
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="settings-toggle"
          >
            <FaInfoCircle />
            Settings
          </button>
          
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="settings-panel"
              >
                <div className="setting-item">
                  <label>Search Radius: {searchRadius} km</label>
                  <input
                    type="range"
                    min="25"
                    max="500"
                    value={searchRadius}
                    onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                    className="radius-slider"
                  />
                </div>
                
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                    Auto-refresh every 30 seconds
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Aircraft List */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="aircraft-section"
        >
          <div className="section-header">
            <FaPlane className="section-icon" />
            <h2>Nearby Aircraft</h2>
            {lastUpdate && (
              <span className="last-update">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>

          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Searching for aircraft...</p>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="error-message"
            >
              <p>⚠️ {error}</p>
              <button onClick={handleRefresh} className="retry-btn">
                Try Again
              </button>
            </motion.div>
          )}

          {!loading && !error && aircraft.length === 0 && userLocation && (
            <div className="no-aircraft">
              <FaPlane className="no-aircraft-icon" />
              <p>No aircraft found within {searchRadius} km of your location</p>
              <p>Try increasing the search radius or check back later</p>
            </div>
          )}

          <AnimatePresence>
            {aircraft.map((plane, index) => (
              <motion.div
                key={plane.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className="aircraft-card"
              >
                <div className="aircraft-header">
                  <FaPlane className="aircraft-icon" />
                  <div className="aircraft-title">
                    <h3>{plane.callsign}</h3>
                    <span className="aircraft-id">ICAO: {plane.icao24}</span>
                  </div>
                  <div className="aircraft-direction">
                    <FaCompass className="compass-icon" />
                    <span>{getDirection(plane.latitude, plane.longitude)}</span>
                  </div>
                </div>
                
                <div className="aircraft-details">
                  <p className="aircraft-description">
                    {formatAircraftInfo(plane)}
                  </p>
                  
                  <div className="aircraft-stats">
                    <div className="stat">
                      <strong>Distance:</strong> {plane.distance_km.toFixed(1)} km
                    </div>
                    <div className="stat">
                      <strong>Altitude:</strong> {plane.altitude ? `${Math.round(plane.altitude)}m` : 'Unknown'}
                    </div>
                    <div className="stat">
                      <strong>Speed:</strong> {plane.velocity ? `${Math.round(plane.velocity * 1.94384)} knots` : 'Unknown'}
                    </div>
                    <div className="stat">
                      <strong>Country:</strong> {plane.origin_country || 'Unknown'}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.section>
      </main>

      <footer className="App-footer">
        <p>
          <FaGlobe className="footer-icon" />
          Powered by OpenSky Network & Aviation APIs
        </p>
      </footer>
    </div>
  );
};

export default App;
