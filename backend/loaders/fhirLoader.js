const fs = require('fs');
const path = require('path');
const db = require('../db');
const { parseFHIRBundle } = require('./fhirParser');
const {
  insertPatient,
  insertObservations,
  insertConditions,
  insertEncounters
} = require('./dbInsert');

const DATA_FOLDER = path.resolve('C:/Users/kasar/CoCM_Platform/backend/data/all_converted_files/All Converted Files');

// Infer source_type from filename
function inferSourceType(filename) {
  const f = String(filename || '').toLowerCase();
  if (f.includes('ccd') || f.includes('ccda')) return 'ccd';
  if (f.includes('oru')) return 'oru';
  if (f.includes('adt')) return 'adt';
  return null; // falls back to NULL in DB
}

// Check if file was already loaded
async function isAlreadyLoaded(filename) {
  const [rows] = await db.query(
    'SELECT id FROM ingested_files WHERE filename = ?',
    [filename]
  );
  return rows.length > 0;
}

//  Mark file as loaded
async function markFileAsLoaded(filename) {
  await db.execute(
    'INSERT INTO ingested_files (filename) VALUES (?)',
    [filename]
  );
}

// Parse & load one FHIR file
async function loadFHIRFromFile(filePath) {
  try {
    const fileOnly = path.basename(filePath);
    const sourceType = inferSourceType(fileOnly);
    const ctx = { filename: fileOnly, sourceType };

    console.log(`📂 Loading file: ${fileOnly}`);
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const bundle = JSON.parse(rawData);
    const parsed = parseFHIRBundle(bundle);

    if (parsed.patient)              await insertPatient(parsed.patient, ctx);
    if (parsed.observations?.length) await insertObservations(parsed.observations, ctx);
    if (parsed.conditions?.length)   await insertConditions(parsed.conditions, ctx);
    if (parsed.encounters?.length)   await insertEncounters(parsed.encounters, ctx);

    console.log(`✅ Done: ${fileOnly}\n`);
  } catch (err) {
    console.error(`❌ Failed to load ${path.basename(filePath)}:`, err.message);
  }
}

// Parse all files in the data folder
async function loadAllFHIRFiles(force = false) {
  const files = fs.readdirSync(DATA_FOLDER).filter(file => file.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(DATA_FOLDER, file);

    if (!force && await isAlreadyLoaded(file)) {
      console.log(`⚠️ Skipping already loaded file: ${file}`);
      continue;
    }

    await loadFHIRFromFile(filePath);

    if (!force) {
      await markFileAsLoaded(file);
    }
  }

  console.log('🚀 All files processed.');
}

//  Entry point if run directly
if (require.main === module) {
  const force = process.argv.includes('--force');
  loadAllFHIRFiles(force);
}

module.exports = { loadFHIRFromFile, loadAllFHIRFiles };
