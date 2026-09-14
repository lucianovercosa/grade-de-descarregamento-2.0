const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace(
    "const fs = require('fs');",
    "// removed commonjs fs"
);
serverCode = serverCode.replace(
    "fs.appendFileSync('client-errors.log', JSON.stringify(req.body) + '\\n');",
    ""
);
fs.writeFileSync('server.ts', serverCode);

let mainCode = fs.readFileSync('src/main.tsx', 'utf8');
const logCode = `
window.addEventListener('error', e => fetch('/api/log', { method: 'POST', body: JSON.stringify({ error: e.message, stack: e.error?.stack }), headers:{'content-type':'application/json'} }).catch(()=>{}));
window.addEventListener('unhandledrejection', e => fetch('/api/log', { method: 'POST', body: JSON.stringify({ error: e.reason?.message || String(e.reason), stack: e.reason?.stack }), headers:{'content-type':'application/json'} }).catch(()=>{}));
const oldConsoleError = console.error;
console.error = (...args) => {
    fetch('/api/log', { method: 'POST', body: JSON.stringify({ error: 'console.error', args }), headers:{'content-type':'application/json'} }).catch(()=>{});
    oldConsoleError(...args);
};
`;
if (mainCode.includes(logCode)) {
    mainCode = mainCode.replace(logCode, '');
    fs.writeFileSync('src/main.tsx', mainCode);
}
