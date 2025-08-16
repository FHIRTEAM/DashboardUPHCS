const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
   const [rows] = await db.query(`
  SELECT patient_id, CONCAT(given_name, ' ', family_name) AS name FROM patients
`);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching patients:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
