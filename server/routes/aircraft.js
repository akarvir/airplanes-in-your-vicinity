const express = require('express');
const { aircraftService } = require('../services/aircraftService');
const { getDatabase } = require('../database/init');

const router = express.Router();

// Get aircraft near a specific location
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lon, radius = 100 } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Latitude (lat) and longitude (lon) are required'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const radiusKm = parseInt(radius);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
      return res.status(400).json({
        error: 'Invalid parameters',
        message: 'Latitude, longitude, and radius must be valid numbers'
      });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    const aircraft = await aircraftService.getAircraftNearLocation(latitude, longitude, radiusKm);
    
    // Transform data for frontend consumption
    const transformedAircraft = aircraft.map(plane => ({
      id: plane.id,
      icao24: plane.icao24,
      callsign: plane.callsign || 'Unknown',
      origin_country: plane.origin_country || 'Unknown',
      latitude: plane.latitude,
      longitude: plane.longitude,
      altitude: plane.altitude,
      velocity: plane.velocity,
      true_track: plane.true_track,
      distance_km: Math.round(plane.distance_km * 100) / 100,
      last_updated: plane.last_updated
    }));

    res.json({
      success: true,
      data: {
        aircraft: transformedAircraft,
        user_location: { latitude, longitude },
        search_radius_km: radiusKm,
        timestamp: new Date().toISOString(),
        count: transformedAircraft.length
      }
    });

  } catch (error) {
    console.error('Error getting nearby aircraft:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve nearby aircraft'
    });
  }
});

// Get all aircraft in database
router.get('/all', async (req, res) => {
  try {
    const db = getDatabase();
    
    const query = `
      SELECT * FROM aircraft 
      WHERE on_ground = 0 AND altitude > 0
      ORDER BY last_updated DESC 
      LIMIT 100
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to retrieve aircraft data'
        });
      }
      
      res.json({
        success: true,
        data: {
          aircraft: rows,
          count: rows.length,
          timestamp: new Date().toISOString()
        }
      });
    });
  } catch (error) {
    console.error('Error getting all aircraft:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve aircraft data'
    });
  }
});

// Get aircraft by ICAO24 identifier
router.get('/:icao24', async (req, res) => {
  try {
    const { icao24 } = req.params;
    
    if (!icao24) {
      return res.status(400).json({
        error: 'Missing ICAO24 identifier',
        message: 'ICAO24 identifier is required'
      });
    }

    const db = getDatabase();
    
    const query = 'SELECT * FROM aircraft WHERE icao24 = ?';
    
    db.get(query, [icao24], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to retrieve aircraft data'
        });
      }
      
      if (!row) {
        return res.status(404).json({
          error: 'Aircraft not found',
          message: `No aircraft found with ICAO24: ${icao24}`
        });
      }
      
      res.json({
        success: true,
        data: {
          aircraft: row,
          timestamp: new Date().toISOString()
        }
      });
    });
  } catch (error) {
    console.error('Error getting aircraft by ICAO24:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve aircraft data'
    });
  }
});

// Get aircraft statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const db = getDatabase();
    
    const queries = {
      total: 'SELECT COUNT(*) as count FROM aircraft',
      airborne: 'SELECT COUNT(*) as count FROM aircraft WHERE on_ground = 0 AND altitude > 0',
      on_ground: 'SELECT COUNT(*) as count FROM aircraft WHERE on_ground = 1',
      by_country: 'SELECT origin_country, COUNT(*) as count FROM aircraft WHERE origin_country IS NOT NULL GROUP BY origin_country ORDER BY count DESC LIMIT 10',
      recent_updates: 'SELECT COUNT(*) as count FROM aircraft WHERE last_updated > datetime("now", "-1 hour")'
    };
    
    const stats = {};
    
    // Execute all queries
    const promises = Object.entries(queries).map(([key, query]) => {
      return new Promise((resolve, reject) => {
        db.get(query, [], (err, row) => {
          if (err) reject(err);
          else resolve({ key, data: row });
        });
      });
    });
    
    const results = await Promise.all(promises);
    
    results.forEach(({ key, data }) => {
      if (key === 'by_country') {
        // Handle country stats separately
        db.all(queries.by_country, [], (err, rows) => {
          if (!err) stats[key] = rows;
        });
      } else {
        stats[key] = data?.count || 0;
      }
    });
    
    res.json({
      success: true,
      data: {
        stats,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error getting aircraft statistics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve aircraft statistics'
    });
  }
});

// Debug endpoint to test database queries
router.get('/debug/test', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Test 1: Simple count
    const countQuery = 'SELECT COUNT(*) as total FROM aircraft';
    
    // Test 2: Bounding box around NYC
    const boundingBoxQuery = `
      SELECT COUNT(*) as in_box FROM aircraft 
      WHERE latitude BETWEEN 40.7128 - 5 AND 40.7128 + 5 
        AND longitude BETWEEN -74.006 - 5 AND -74.006 + 5
        AND on_ground = 0 AND altitude > 0
    `;
    
    // Test 3: Sample aircraft in bounding box
    const sampleQuery = `
      SELECT callsign, latitude, longitude, altitude, on_ground 
      FROM aircraft 
      WHERE latitude BETWEEN 40.7128 - 5 AND 40.7128 + 5 
        AND longitude BETWEEN -74.006 - 5 AND -74.006 + 5
        AND on_ground = 0 AND altitude > 0
      LIMIT 5
    `;
    
    db.get(countQuery, [], (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: 'Count query failed', details: err.message });
      }
      
      db.get(boundingBoxQuery, [], (err, boxResult) => {
        if (err) {
          return res.status(500).json({ error: 'Bounding box query failed', details: err.message });
        }
        
        db.all(sampleQuery, [], (err, sampleResult) => {
          if (err) {
            return res.status(500).json({ error: 'Sample query failed', details: err.message });
          }
          
          res.json({
            success: true,
            debug: {
              total_aircraft: countResult.total,
              aircraft_in_bounding_box: boxResult.in_box,
              sample_aircraft: sampleResult,
              bounding_box: {
                lat_min: 40.7128 - 5,
                lat_max: 40.7128 + 5,
                lon_min: -74.006 - 5,
                lon_max: -74.006 + 5
              }
            }
          });
        });
      });
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      error: 'Debug endpoint error',
      message: error.message
    });
  }
});

module.exports = router;

