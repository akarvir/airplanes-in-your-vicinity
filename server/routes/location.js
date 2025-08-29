const express = require('express');
const { getDatabase } = require('../database/init');

const router = express.Router();

// Store user location
router.post('/store', async (req, res) => {
  try {
    const { user_id, latitude, longitude } = req.body;
    
    if (!user_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'user_id, latitude, and longitude are required'
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'Latitude and longitude must be valid numbers'
      });
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    const db = getDatabase();
    
    const query = `
      INSERT OR REPLACE INTO user_locations (user_id, latitude, longitude, timestamp)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    db.run(query, [user_id, lat, lon], function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to store user location'
        });
      }
      
      res.json({
        success: true,
        data: {
          user_id,
          latitude: lat,
          longitude: lon,
          timestamp: new Date().toISOString(),
          message: 'Location stored successfully'
        }
      });
    });
    
  } catch (error) {
    console.error('Error storing user location:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to store user location'
    });
  }
});

// Get user location
router.get('/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    if (!user_id) {
      return res.status(400).json({
        error: 'Missing user_id',
        message: 'User ID is required'
      });
    }

    const db = getDatabase();
    
    const query = 'SELECT * FROM user_locations WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1';
    
    db.get(query, [user_id], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to retrieve user location'
        });
      }
      
      if (!row) {
        return res.status(404).json({
          error: 'Location not found',
          message: `No location found for user: ${user_id}`
        });
      }
      
      res.json({
        success: true,
        data: {
          user_id: row.user_id,
          latitude: row.latitude,
          longitude: row.longitude,
          timestamp: row.timestamp
        }
      });
    });
    
  } catch (error) {
    console.error('Error getting user location:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve user location'
    });
  }
});

// Get location by coordinates (reverse geocoding helper)
router.get('/reverse/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'Latitude and longitude must be valid numbers'
      });
    }

    // Simple reverse geocoding using OpenStreetMap Nominatim API
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'AirplaneTracker/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        res.json({
          success: true,
          data: {
            coordinates: { latitude, longitude },
            address: data.display_name,
            city: data.address?.city || data.address?.town || data.address?.village,
            state: data.address?.state,
            country: data.address?.country,
            country_code: data.address?.country_code?.toUpperCase()
          }
        });
      } else {
        // Fallback to basic coordinate response
        res.json({
          success: true,
          data: {
            coordinates: { latitude, longitude },
            address: `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`,
            city: null,
            state: null,
            country: null,
            country_code: null
          }
        });
      }
    } catch (fetchError) {
      // Fallback response if geocoding fails
      res.json({
        success: true,
        data: {
          coordinates: { latitude, longitude },
          address: `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`,
          city: null,
          state: null,
          country: null,
          country_code: null
        }
      });
    }
    
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to perform reverse geocoding'
    });
  }
});

// Calculate distance between two points
router.post('/distance', async (req, res) => {
  try {
    const { lat1, lon1, lat2, lon2 } = req.body;
    
    if (!lat1 || !lon1 || !lat2 || !lon2) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'lat1, lon1, lat2, and lon2 are required'
      });
    }

    const lat1Num = parseFloat(lat1);
    const lon1Num = parseFloat(lon1);
    const lat2Num = parseFloat(lat2);
    const lon2Num = parseFloat(lon2);

    if ([lat1Num, lon1Num, lat2Num, lon2Num].some(isNaN)) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'All coordinates must be valid numbers'
      });
    }

    // Haversine formula for calculating distance between two points on Earth
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2Num - lat1Num) * Math.PI / 180;
    const dLon = (lon2Num - lon1Num) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1Num * Math.PI / 180) * Math.cos(lat2Num * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    res.json({
      success: true,
      data: {
        point1: { latitude: lat1Num, longitude: lon1Num },
        point2: { latitude: lat2Num, longitude: lon2Num },
        distance_km: Math.round(distance * 100) / 100,
        distance_miles: Math.round((distance * 0.621371) * 100) / 100
      }
    });
    
  } catch (error) {
    console.error('Error calculating distance:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to calculate distance'
    });
  }
});

module.exports = router;


