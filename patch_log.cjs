const fs = require('fs');

// Patch server.ts
let serverCode = fs.readFileSync('server.ts', 'utf8');
if (!serverCode.includes('/api/log')) {
    serverCode = serverCode.replace(
        "app.use(express.json());",
        "app.use(express.json());\napp.post('/api/log', (req, res) => { console.log('[CLIENT LOG]', req.body); res.send('ok'); });"
    );
    fs.writeFileSync('server.ts', serverCode);
}

// Patch main.tsx
let mainCode = fs.readFileSync('src/main.tsx', 'utf8');
if (!mainCode.includes('/api/log')) {
    const logCode = `
window.addEventListener('error', e => fetch('/api/log', { method: 'POST', body: JSON.stringify({ error: e.message, stack: e.error?.stack }), headers:{'content-type':'application/json'} }).catch(()=>{}));
window.addEventListener('unhandledrejection', e => fetch('/api/log', { method: 'POST', body: JSON.stringify({ error: e.reason?.message || String(e.reason), stack: e.reason?.stack }), headers:{'content-type':'application/json'} }).catch(()=>{}));
const oldConsoleError = console.error;
console.error = (...args) => {
    fetch('/api/log', { method: 'POST', body: JSON.stringify({ error: 'console.error', args }), headers:{'content-type':'application/json'} }).catch(()=>{});
    oldConsoleError(...args);
};
`;
    mainCode = logCode + mainCode;
    fs.writeFileSync('src/main.tsx', mainCode);
}
