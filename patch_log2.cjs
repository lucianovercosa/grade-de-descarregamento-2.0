const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');
if (!serverCode.includes("fs.appendFileSync('client-errors.log'")) {
    serverCode = serverCode.replace(
        "app.post('/api/log', (req, res) => { console.log('[CLIENT LOG]', req.body); res.send('ok'); });",
        "app.post('/api/log', (req, res) => { \n  console.log('[CLIENT LOG]', req.body); \n  const fs = require('fs');\n  fs.appendFileSync('client-errors.log', JSON.stringify(req.body) + '\\n');\n  res.send('ok'); \n});"
    );
    fs.writeFileSync('server.ts', serverCode);
}
