const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase-mock.ts', 'utf8');

if (!code.includes('console.log("USING FIREBASE MOCK");')) {
    code = 'console.log("USING FIREBASE MOCK");\n' + code;
    fs.writeFileSync('src/lib/firebase-mock.ts', code);
}
