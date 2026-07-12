import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const usersSnap = await getDocs(collection(db, 'users'));
  usersSnap.forEach(doc => {
    console.log("User:", doc.id, doc.data());
  });
  
  const rolesSnap = await getDocs(collection(db, 'roles'));
  rolesSnap.forEach(doc => {
    console.log("Role:", doc.id, doc.data());
  });
}
run();
