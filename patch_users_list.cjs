const fs = require('fs');
let code = fs.readFileSync('src/components/UsersList.tsx', 'utf8');
code = code.replace(
    "{ id: 'admin', name: 'admin', permissions: [], created_at: new Date().toISOString() },",
    "{ id: 'default-admin', name: 'admin', permissions: [], created_at: new Date().toISOString() },"
);
code = code.replace(
    "{ id: 'mro', name: 'mro', permissions: [], created_at: new Date().toISOString() },",
    "{ id: 'default-mro', name: 'mro', permissions: [], created_at: new Date().toISOString() },"
);
code = code.replace(
    "{ id: 'empilhador', name: 'empilhador', permissions: [], created_at: new Date().toISOString() },",
    "{ id: 'default-empilhador', name: 'empilhador', permissions: [], created_at: new Date().toISOString() },"
);
code = code.replace(
    "{ id: 'tv', name: 'tv', permissions: [], created_at: new Date().toISOString() },",
    "{ id: 'default-tv', name: 'tv', permissions: [], created_at: new Date().toISOString() },"
);
fs.writeFileSync('src/components/UsersList.tsx', code);
