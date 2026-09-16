const fs = require('fs');
let code = fs.readFileSync('src/components/VehicleForm.tsx', 'utf8');

code = code.replace(/const unsubContacts =[\s\S]*?console\.log\('Contacts listener error:', error\);\s*\}\);/g, '');

fs.writeFileSync('src/components/VehicleForm.tsx', code);
