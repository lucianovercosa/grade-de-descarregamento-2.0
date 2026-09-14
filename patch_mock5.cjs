const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase-mock.ts', 'utf8');

// Fix line 123
code = code.replace(
    "empty: docs.length === 0, empty: docs.length === 0, docs: docs.map(d => ({ id: d.id, data: () => d }))",
    "empty: docs.length === 0, docs: docs.map((d: any) => ({ id: d.id, data: () => d }))"
);

// Fix line 141
code = code.replace(
    "docs: docs.map(d => ({ id: d.id, data: () => d }))",
    "empty: docs.length === 0, docs: docs.map((d: any) => ({ id: d.id, data: () => d }))"
);

// Also fix the createUserWithEmailAndPassword expected arguments (error TS2554)
// Wait, error TS2554: Expected 3 arguments, but got 2.
// Let's just make createUserWithEmailAndPassword accept any args.
code = code.replace(
    "export async function createUserWithEmailAndPassword(auth, email, password) {",
    "export async function createUserWithEmailAndPassword(auth: any, email: any, password: any) {"
);

// Make sure filterAndSort accepts any
code = code.replace(
    "function filterAndSort(docsObj, constraints = []) {",
    "function filterAndSort(docsObj: any, constraints: any[] = []) {"
);

fs.writeFileSync('src/lib/firebase-mock.ts', code);
