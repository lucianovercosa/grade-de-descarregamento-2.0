const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase-mock.ts', 'utf8');

code = code.replace(
  "export async function createUserWithEmailAndPassword() {",
  "export async function createUserWithEmailAndPassword(auth, email, password) {"
);

code = code.replace(
  'return { user: { uid: id, email: "new@local" } };',
  'return { user: { uid: id, email } };'
);

fs.writeFileSync('src/lib/firebase-mock.ts', code);
console.log('patched mock email');
