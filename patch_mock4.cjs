const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase-mock.ts', 'utf8');

code = code.replace(
  "docs: docs.map(d => ({ id: d.id, data: () => d }))", // This might match onSnapshot first!
  "empty: docs.length === 0, docs: docs.map(d => ({ id: d.id, data: () => d }))"
);

fs.writeFileSync('src/lib/firebase-mock.ts', code);
