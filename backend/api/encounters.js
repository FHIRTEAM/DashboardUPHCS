const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM encounters`);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching encounters:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
