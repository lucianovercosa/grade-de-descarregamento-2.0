const fs = require('fs');
let code = fs.readFileSync('src/components/TVMode.tsx', 'utf8');

code = code.replace(/const q = query\(collection\(db, 'vehicles'\), orderBy\('started_at', 'asc'\)\);/, '');
code = code.replace(/await signOut\(auth\);/g, 'window.location.href = "/";');

fs.writeFileSync('src/components/TVMode.tsx', code);
