const fs = require('fs');
let code = fs.readFileSync('src/AuthContext.tsx', 'utf8');

code = code.replace(
  "import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';",
  "import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore';"
);

code = code.replace(
  "const { deleteDoc } = require('firebase/firestore');",
  ""
);

fs.writeFileSync('src/AuthContext.tsx', code);
