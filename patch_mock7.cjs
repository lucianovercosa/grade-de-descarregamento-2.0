const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    'email: "admin@local.com",',
    'email: "admin@local.com",\n          username: "admin",'
);

fs.writeFileSync('server.ts', code);
