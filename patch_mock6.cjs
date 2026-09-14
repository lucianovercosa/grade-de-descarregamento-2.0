const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase-mock.ts', 'utf8');

code = code.replace(
    "set: async (ref, data) => setDoc(ref, data),",
    "set: async (ref: any, data: any) => setDoc(ref, data, {}),"
);
code = code.replace(
    "update: async (ref, data) => updateDoc(ref, data),",
    "update: async (ref: any, data: any) => updateDoc(ref, data),"
);
code = code.replace(
    "delete: async (ref) => deleteDoc(ref),",
    "delete: async (ref: any) => deleteDoc(ref),"
);

fs.writeFileSync('src/lib/firebase-mock.ts', code);
