const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('res.setHeader("Cache-Control", "no-store");')) {
    code = code.replace(
        "app.get('/api/db', async (req, res) => {",
        "app.get('/api/db', async (req, res) => {\n  res.setHeader(\"Cache-Control\", \"no-store\");"
    );
    fs.writeFileSync('server.ts', code);
}
