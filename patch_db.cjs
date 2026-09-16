const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

// Replace the CREATE TABLE for vehicles
const oldVehiclesTable = /\/\/ Create Vehicles\s+db\.run\(`CREATE TABLE IF NOT EXISTS vehicles \(.*?\)`\);/s;
const newVehiclesTable = `// Create Vehicles
    db.run(\`CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      daily_sequence INTEGER,
      plate TEXT,
      driver TEXT,
      driver_phone TEXT,
      transporter TEXT,
      supplier TEXT,
      invoice_number TEXT,
      items TEXT,
      attachments TEXT,
      forklift_user_id TEXT,
      forklift_name TEXT,
      notes TEXT,
      public_token TEXT,
      progress_status TEXT,
      progress_percent INTEGER,
      started_at DATETIME,
      analysis_started_at DATETIME,
      analysis_finished_at DATETIME,
      unload_started_at DATETIME,
      finished_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      images TEXT
    )\`);`;

code = code.replace(oldVehiclesTable, newVehiclesTable);
fs.writeFileSync('src/server/db.ts', code);
