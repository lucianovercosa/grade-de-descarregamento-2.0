const fs = require('fs');
let code = fs.readFileSync('src/AuthContext.tsx', 'utf8');

const oldCode = `const q = query(collection(db, 'users'), where('email', '==', fbUser.email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const matchedDoc = querySnapshot.docs[0];`;

const newCode = `let matchedDoc = null;
            const qEmail = query(collection(db, 'users'), where('email', '==', fbUser.email));
            const querySnapshotEmail = await getDocs(qEmail);
            if (!querySnapshotEmail.empty) {
              matchedDoc = querySnapshotEmail.docs[0];
            } else if (fbUser.email?.endsWith('@local.com')) {
              const username = fbUser.email.split('@')[0];
              const qUsername = query(collection(db, 'users'), where('username', '==', username));
              const querySnapshotUsername = await getDocs(qUsername);
              if (!querySnapshotUsername.empty) {
                matchedDoc = querySnapshotUsername.docs[0];
              }
            }
            
            if (matchedDoc) {`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/AuthContext.tsx', code);
