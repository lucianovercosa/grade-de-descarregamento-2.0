const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const auth = getAuth(app);

async function checkAdmin() {
  try {
    await signInWithEmailAndPassword(auth, 'admin@local.com', '123456');
    console.log('Admin user exists and password is correct.');
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
       try {
         await createUserWithEmailAndPassword(auth, 'admin@local.com', '123456');
         console.log('Admin user created successfully.');
       } catch (createErr) {
         console.error('Failed to create admin:', createErr);
       }
    } else {
       console.error('Login failed with other error:', err);
    }
  }
  process.exit(0);
}
checkAdmin();
