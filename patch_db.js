const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

const oldVehiclesTable = /\/\/ Create Vehicles\s+db\.run\(`CREATE TABLE IF NOT EXISTS vehicles \(.*?\)`\);/s;
const newVehiclesTable = `// Create Vehicles
    db.run(\`CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      license_plate TEXT,
      type TEXT,
      status TEXT,
      user_id TEXT,
      user_name TEXT,
      reason TEXT,
      observations TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      images TEXT
    )\`);`;

code = code.replace(oldVehiclesTable, newVehiclesTable);
fs.writeFileSync('src/server/db.ts', code);
