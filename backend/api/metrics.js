// backend/api/metrics.js
const express = require('express');
const db = require('../db');
const router = express.Router();

const observationCodes = {
  heart_rate: '8867-4',
  resp_rate: '9279-1',
  bmi: '39156-5',
  bp_sys: '8480-6',
  bp_dia: '8462-4',
  oxygen: '59408-5',
};

// GET /api/metrics/patient-observations
router.get('/patient-observations', async (req, res) => {
  const { patient_ids } = req.query;

  try {
    const selectedPatients = patient_ids
      ? patient_ids.split(',').map((id) => id.trim())
      : null;

    const results = {};

    for (const [key, code] of Object.entries(observationCodes)) {
      let query = `
        SELECT 
          patient_id,
          value_numeric AS value,
          effectiveDateTime AS timestamp
        FROM observations
        WHERE 
          code = ?
          AND effectiveDateTime IS NOT NULL
      `;

      const params = [code];

      if (selectedPatients && selectedPatients.length > 0) {
        const placeholders = selectedPatients.map(() => '?').join(',');
        query += ` AND patient_id IN (${placeholders})`;
        params.push(...selectedPatients);
      }

      query += ` ORDER BY effectiveDateTime`;

      const [rows] = await db.query(query, params);
      results[key] = rows;
    }

    res.json(results);
  } catch (err) {
    console.error('❌ Error fetching patient observations:', err.message);
    res.status(500).json({ error: 'Failed to fetch patient observations' });
  }
});

module.exports = router;
