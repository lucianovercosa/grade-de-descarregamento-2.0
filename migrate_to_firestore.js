import sqlite3 from 'sqlite3';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const sqlDb = new (sqlite3.verbose().Database)('./data/local.db');

async function migrateTable(tableName) {
  return new Promise((resolve, reject) => {
    sqlDb.all(`SELECT * FROM ${tableName}`, async (err, rows) => {
      if (err) {
        if (err.message.includes('no such table')) return resolve();
        return reject(err);
      }
      for (const row of rows) {
        const id = row.id || row.uid || Math.random().toString(36).slice(2);
        const ref = doc(db, tableName, String(id));
        
        // Parse JSON fields if necessary
        if (tableName === 'users' && row.permissions) {
          try { row.permissions = JSON.parse(row.permissions); } catch(e){}
        }
        if (tableName === 'roles' && row.permissions) {
          try { row.permissions = JSON.parse(row.permissions); } catch(e){}
        }

        await setDoc(ref, row);
      }
      console.log(`Migrated ${rows.length} records for ${tableName}`);
      resolve();
    });
  });
}

async function run() {
  const tables = ['users', 'roles', 'vehicles', 'products', 'responsibles', 'chat_messages'];
  for (const t of tables) {
    await migrateTable(t);
  }
  console.log("Migration complete!");
  process.exit(0);
}

run();
