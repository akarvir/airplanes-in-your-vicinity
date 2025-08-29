const axios = require('axios');
const cron = require('node-cron');
const { getDatabase } = require('../database/init');

class AircraftService {
  constructor() {
    this.isRunning = false;
    this.updateInterval = parseInt(process.env.AIRCRAFT_UPDATE_INTERVAL) || 30;
  }

  async fetchAircraftData() {
    try {
      // Try OpenSky Network first (free, no API key required)
      const aircraftData = await this.fetchFromOpenSky();
      if (aircraftData && aircraftData.length > 0) {
        await this.updateDatabase(aircraftData);
        console.log(`✅ Updated ${aircraftData.length} aircraft from OpenSky Network`);
        return;
      }

      // Fallback to Aviation Stack if OpenSky fails
      if (process.env.AVIATION_API_KEY) {
        const aviationData = await this.fetchFromAviationStack();
        if (aviationData && aviationData.length > 0) {
          await this.updateDatabase(aviationData);
          console.log(`✅ Updated ${aviationData.length} aircraft from Aviation Stack`);
          return;
        }
      }

      console.log('⚠️ No aircraft data available from any source');
    } catch (error) {
      console.error('❌ Error fetching aircraft data:', error.message);
    }
  }

  async fetchFromOpenSky() {
    try {
      // Get aircraft within a large bounding box (worldwide)
      const bbox = 'minLat=0&maxLat=90&minLon=-180&maxLon=180';
      const url = `https://opensky-network.org/api/states/all?${bbox}`;
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'AirplaneTracker/1.0'
        }
      });

      if (response.data && response.data.states) {
        return response.data.states.map(state => this.transformOpenSkyData(state));
      }
      return [];
    } catch (error) {
      console.error('OpenSky Network error:', error.message);
      return [];
    }
  }

  async fetchFromAviationStack() {
    try {
      const url = `${process.env.AVIATION_API_BASE_URL}/flights`;
      const response = await axios.get(url, {
        params: {
          access_key: process.env.AVIATION_API_KEY,
          limit: 100
        },
        timeout: 10000
      });

      if (response.data && response.data.data) {
        return response.data.data.map(flight => this.transformAviationStackData(flight));
      }
      return [];
    } catch (error) {
      console.error('Aviation Stack error:', error.message);
      return [];
    }
  }

  transformOpenSkyData(state) {
    return {
      icao24: state[0],
      callsign: state[1] || null,
      origin_country: state[2] || null,
      time_position: state[3] || null,
      time_velocity: state[4] || null,
      longitude: state[5] || null,
      latitude: state[6] || null,
      altitude: state[7] || null,
      on_ground: state[8] || false,
      velocity: state[9] || null,
      true_track: state[10] || null,
      vertical_rate: state[11] || null,
      sensors: state[12] ? state[12].join(',') : null,
      geo_altitude: state[13] || null,
      squawk: state[14] || null,
      spi: state[15] || false,
      position_source: state[16] || null,
      category: state[17] || null
    };
  }

  transformAviationStackData(flight) {
    return {
      icao24: flight.aircraft?.icao24 || null,
      callsign: flight.flight?.iata || flight.flight?.icao || null,
      origin_country: flight.airline?.country || null,
      time_position: null,
      time_velocity: null,
      longitude: flight.departure?.longitude || null,
      latitude: flight.departure?.latitude || null,
      altitude: null,
      on_ground: flight.flight_status === 'landed',
      velocity: null,
      true_track: null,
      vertical_rate: null,
      sensors: null,
      geo_altitude: null,
      squawk: null,
      spi: false,
      position_source: null,
      category: null
    };
  }

  async updateDatabase(aircraftData) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO aircraft (
            icao24, callsign, origin_country, time_position, time_velocity,
            longitude, latitude, altitude, on_ground, velocity, true_track,
            vertical_rate, sensors, geo_altitude, squawk, spi, position_source, category
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        aircraftData.forEach(aircraft => {
          if (aircraft.icao24 && aircraft.latitude && aircraft.longitude) {
            stmt.run([
              aircraft.icao24,
              aircraft.callsign,
              aircraft.origin_country,
              aircraft.time_position,
              aircraft.time_velocity,
              aircraft.longitude,
              aircraft.latitude,
              aircraft.altitude,
              aircraft.on_ground,
              aircraft.velocity,
              aircraft.true_track,
              aircraft.vertical_rate,
              aircraft.sensors,
              aircraft.geo_altitude,
              aircraft.squawk,
              aircraft.spi,
              aircraft.position_source,
              aircraft.category
            ]);
          }
        });

        stmt.finalize((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  async getAircraftNearLocation(lat, lon, radiusKm = 100) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      // ULTRA SIMPLE: Return ALL aircraft that could potentially be visible!
      // No complex bounding box calculations - just get aircraft and let the frontend decide
      
      console.log(`🔍 ULTRA SIMPLE: Getting all potentially visible aircraft for location (${lat}, ${lon})`);
      
      const query = `
        SELECT * FROM aircraft 
        WHERE on_ground = 0
          AND altitude > 0
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
        ORDER BY last_updated DESC
        LIMIT 1000
      `;
      
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          console.log(`🔍 Found ${rows.length} total aircraft in database`);
          
          // Calculate distances for ALL aircraft
          const aircraftWithDistance = rows.map(row => {
            const distance = aircraftService.calculateDistance(lat, lon, row.latitude, row.longitude);
            return { ...row, distance_km: distance };
          });
          
          // NARROWER FILTERING: More realistic visibility criteria
          const visibleAircraft = aircraftWithDistance.filter(aircraft => {
            // Always include aircraft within the requested radius
            if (aircraft.distance_km <= radiusKm) return true;
            
            // Include aircraft within a reasonable local area (within 200km)
            if (aircraft.distance_km <= 200) return true;
            
            // Include very high-flying aircraft that could be visible from farther
            // Aircraft above 35,000 ft (≈10.5km) can be seen from farther away
            if (aircraft.altitude > 10500 && aircraft.distance_km <= 400) return true;
            
            // Include aircraft that are reasonably close (within 2x the requested radius)
            if (aircraft.distance_km <= radiusKm * 2) return true;
            
            // Include aircraft that are high and moderately close
            if (aircraft.altitude > 8000 && aircraft.distance_km <= 300) return true;
            
            return false;
          });
          
          console.log(`✈️ Found ${visibleAircraft.length} potentially visible aircraft out of ${aircraftWithDistance.length} total`);
          
          // Sort by distance (closest first)
          visibleAircraft.sort((a, b) => a.distance_km - b.distance_km);
          
          resolve(visibleAircraft);
        }
      });
    });
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  startAircraftUpdates() {
    if (this.isRunning) {
      console.log('⚠️ Aircraft update service already running');
      return;
    }

    this.isRunning = true;
    
    // Initial update
    this.fetchAircraftData();
    
    // Schedule regular updates
    cron.schedule(`*/${this.updateInterval} * * * * *`, () => {
      this.fetchAircraftData();
    });
    
    console.log(`✅ Aircraft update service started (updates every ${this.updateInterval} seconds)`);
  }

  stopAircraftUpdates() {
    this.isRunning = false;
    console.log('🛑 Aircraft update service stopped');
  }
}

const aircraftService = new AircraftService();

function startAircraftUpdates() {
  aircraftService.startAircraftUpdates();
}

module.exports = {
  aircraftService,
  startAircraftUpdates
};

