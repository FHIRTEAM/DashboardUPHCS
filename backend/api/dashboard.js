// routes/dashboard.js
const express = require('express');
const router = express.Router();
const db = require('../db');

const CHRONIC_CONDITIONS = {
  "44054006": "Diabetes",
  "38341003": "Hypertension",
  "233604007": "COPD",
  "195967001": "Asthma",
  "55822004": "Depression",
  "25064002": "Heart Failure"
};

function getMonths2024() {
  const months = {};
  for (let i = 1; i <= 12; i++) {
    months[`2024-${String(i).padStart(2, '0')}`] = 0;
  }
  return months;
}

function isoDayFromAny(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10); // YYYY-MM-DD
}

router.get('/:patientId', async (req, res) => {
  const patientId = req.params.patientId;

  try {
    let name = 'All Patients';
    const monthlyCounts = getMonths2024();

    let conditionQuery = `SELECT code, display FROM conditions`;
    // Used ONLY effectiveDateTime from observations
    let observationQuery = `
      SELECT patient_id, effectiveDateTime
      FROM observations
    `;
    const queryParams = [];

    if (patientId !== 'all') {
      const [[patient]] = await db.query(
        `SELECT CONCAT(given_name, ' ', family_name) AS name
         FROM patients
         WHERE patient_id = ?`,
        [patientId]
      );
      if (!patient) return res.status(404).json({ error: 'Patient not found' });

      name = patient.name;
      conditionQuery += ` WHERE patient_id = ?`;
      observationQuery += ` WHERE patient_id = ?`;
      queryParams.push(patientId);
    }

    const [conditions] = await db.query(conditionQuery, queryParams);
    const [observations] = await db.query(observationQuery, queryParams);

    
    const chronicSet = new Set();
    const comorbidSet = new Set();

    for (const cond of conditions) {
      const code = cond.code?.trim();
      const display = cond.display?.trim();
      const label = display || code || "Unknown";
      if (!code) continue;

      if (Object.prototype.hasOwnProperty.call(CHRONIC_CONDITIONS, code)) {
        chronicSet.add(CHRONIC_CONDITIONS[code]);
      } else {
        comorbidSet.add(label.replace(/[\^]/g, ''));
      }
    }

    // ---- Hospital visit frequency using Observation dates ----
    const seenPatientDay = new Set();   // de-dup per patient per day
    const perPatientDays = new Map();   // pid -> Set('YYYY-MM-DD')

    for (const row of observations) {
      const pid = row.patient_id;
      if (!pid) continue;

      const day = isoDayFromAny(row.effectiveDateTime);
      if (!day) continue;

      const ym = day.slice(0, 7); // 'YYYY-MM'
      if (!ym.startsWith('2024')) continue;

      const key = `${pid}::${day}`;
      if (!seenPatientDay.has(key)) {
        seenPatientDay.add(key);
        monthlyCounts[ym] = (monthlyCounts[ym] || 0) + 1;
      }

      if (!perPatientDays.has(pid)) perPatientDays.set(pid, new Set());
      perPatientDays.get(pid).add(day);
    }

    // Average time between visits (in days)
    let totalGapDays = 0;
    let gapCount = 0;

    for (const daysSet of perPatientDays.values()) {
      const days = Array.from(daysSet).sort(); // 'YYYY-MM-DD' strings sort lexicographically
      for (let i = 1; i < days.length; i++) {
        const gap = (new Date(days[i]) - new Date(days[i - 1])) / (1000 * 60 * 60 * 24);
        if (gap > 0 && Number.isFinite(gap)) {
          totalGapDays += gap;
          gapCount++;
        }
      }
    }

    const avgTimeBetweenVisits = gapCount ? Number((totalGapDays / gapCount).toFixed(1)) : 0;

    // Kept for compatibility if UI expects it (placeholder)
    const avgLengthOfStay = seenPatientDay.size ? 1 : 0;

    res.json({
      patient_id: patientId,
      name,
      conditions: [...chronicSet],
      comorbidities: [...comorbidSet],
      monthly_visits: monthlyCounts,
      avg_time_between_visits: avgTimeBetweenVisits,
      avg_length_of_stay: avgLengthOfStay
    });

  } catch (err) {
    console.error("❌ Error in /api/dashboard/:patientId", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
