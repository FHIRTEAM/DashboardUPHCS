const db = require('../db');

// Normalize & validate source_type
function normalizeSourceType(st) {
  const v = String(st || '').trim().toLowerCase();
  return ['ccd', 'oru', 'adt'].includes(v) ? v : null;
}

//  JS-level deduplication helper
function dedupeRecords(records, keyGen) {
  const seen = new Set();
  return records.filter(record => {
    const key = keyGen(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Context passed for every batch coming from a single file.
 * @typedef {{ filename?: string, sourceType?: 'ccd'|'oru'|'adt' }} SourceCtx
 */

//  Observations
async function insertObservations(observations, ctx = {}) {
  if (!observations?.length) return;

  const filename = ctx.filename ?? null;
  const source_type = normalizeSourceType(ctx.sourceType);

  const deduped = dedupeRecords(
    observations,
    o => `${o.patient_id}_${o.code}_${o.effectiveDateTime}`
  );

  const values = deduped.map(o => [
    o.id,
    o.patient_id,
    o.code,
    o.display ?? null,
    o.value_numeric ?? null,
    o.value_string ?? null,
    o.unit ?? null,
    o.effectiveDateTime ?? null,
    o.source ?? null,   
    filename,           
    source_type         
  ]);

  const sql = `
    INSERT IGNORE INTO observations
      (id, patient_id, code, display, value_numeric, value_string, unit, effectiveDateTime, source, filename, source_type)
    VALUES ?
  `;

  await db.query(sql, [values]);
}

//  Conditions
async function insertConditions(conditions, ctx = {}) {
  if (!conditions?.length) return;

  const filename = ctx.filename ?? null;
  const source_type = normalizeSourceType(ctx.sourceType);

  const deduped = dedupeRecords(
    conditions,
    c => `${c.patient_id}_${c.code}_${c.effectiveDateTime}`
  );

  const values = deduped.map(c => [
    c.id,
    c.patient_id,
    c.code,
    c.display ?? null,
    c.clinical_status ?? null,
    c.effectiveDateTime ?? null,
    c.source ?? null,  
    filename,          
    source_type         
  ]);

  const sql = `
    INSERT IGNORE INTO conditions
      (id, patient_id, code, display, clinical_status, effectiveDateTime, source, filename, source_type)
    VALUES ?
  `;

  await db.query(sql, [values]);
}

//  Encounters
async function insertEncounters(encounters, ctx = {}) {
  if (!encounters?.length) return;

  const filename = ctx.filename ?? null;
  const source_type = normalizeSourceType(ctx.sourceType);

  const deduped = dedupeRecords(
    encounters,
    e => `${e.patient_id}_${e.date}_${e.admission_reason}`
  );

  const values = deduped.map(e => [
    e.id,
    e.patient_id,
    e.class_code ?? null,
    e.class_display ?? null,
    e.type_code ?? null,
    e.type_display ?? null,
    e.date ?? null,
    e.admission_reason ?? null,
    e.source ?? null,   
    filename,           
    source_type         
  ]);

  const sql = `
    INSERT IGNORE INTO encounters
      (id, patient_id, class_code, class_display, type_code, type_display, date, admission_reason, source, filename, source_type)
    VALUES ?
  `;

  await db.query(sql, [values]);
}

//  Patients with hospital location logic
async function insertPatient(patient, ctx = {}) {
  if (!patient || !patient.id) return;

  const filename = ctx.filename ?? null;
  const source_type = normalizeSourceType(ctx.sourceType);

  let location_id = null;

  if (patient.city && patient.state && patient.postal_code) {
    const [existing] = await db.query(
      `SELECT id FROM hospital_locations WHERE city = ? AND state = ? AND postal_code = ?`,
      [patient.city, patient.state, patient.postal_code]
    );

    if (existing.length > 0) {
      location_id = existing[0].id;
    } else {
      const hospitalName = `${patient.city} General Hospital`;
      const result = await db.execute(
        `INSERT INTO hospital_locations (city, state, postal_code, hospital_name, latitude, longitude)
         VALUES (?, ?, ?, ?, 0, 0)`,
        [patient.city, patient.state, patient.postal_code, hospitalName]
      );
      location_id = result[0].insertId;
    }
  }

  const sql = `
    INSERT INTO patients
      (patient_id, given_name, family_name, birth_date, gender, city, state, postal_code, location_id, filename, source_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      given_name   = VALUES(given_name),
      family_name  = VALUES(family_name),
      birth_date   = VALUES(birth_date),
      gender       = VALUES(gender),
      city         = VALUES(city),
      state        = VALUES(state),
      postal_code  = VALUES(postal_code),
      location_id  = VALUES(location_id),
      filename     = VALUES(filename),     -- NEW
      source_type  = VALUES(source_type)   -- NEW
  `;

  await db.execute(sql, [
    patient.id,
    patient.given_name ?? null,
    patient.family_name ?? null,
    patient.birth_date ?? null,
    patient.gender ?? null,
    patient.city ?? null,
    patient.state ?? null,
    patient.postal_code ?? null,
    location_id,
    filename,          
    source_type        
  ]);
}

module.exports = {
  insertPatient,
  insertObservations,
  insertConditions,
  insertEncounters
};
