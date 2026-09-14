// Mock for Firebase to redirect all calls to Local Node Server
let dbCache = {};
let listeners = [];

// Polling mimics real-time snapshot
setInterval(async () => {
  try {
    const res = await fetch('/api/db');
    if(res.ok) {
        dbCache = await res.json();
        listeners.forEach(l => l());
    }
  } catch(e) {}
}, 2000);

export function initializeApp() { return {}; }
export function getAuth() { return {}; }
export function initializeFirestore() { return {}; }
export function getStorage() { return {}; }

// AUTH
export class GoogleAuthProvider {}
export async function signInWithPopup() { throw new Error("Local version does not support Google Login"); }

export async function signInWithEmailAndPassword(auth, email, password) {
   const res = await fetch('/api/auth/login', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ email, password })
   });
   if(!res.ok) throw new Error("Login failed");
   const user = await res.json();
   localStorage.setItem('local_user', JSON.stringify(user));
   notifyAuth(user);
   return { user: { uid: user.id, email: user.email, displayName: user.name } };
}

export async function signOut() {
   localStorage.removeItem('local_user');
   notifyAuth(null);
}

let authListeners = [];
function notifyAuth(user) {
   authListeners.forEach(l => l(user ? { uid: user.id, email: user.email, displayName: user.name } : null));
}

export function onAuthStateChanged(auth, callback) {
   authListeners.push(callback);
   const local = localStorage.getItem('local_user');
   if(local) {
       const user = JSON.parse(local);
       callback({ uid: user.id, email: user.email, displayName: user.name });
   } else {
       callback(null);
   }
   return () => {};
}

export async function sendPasswordResetEmail() {}
export async function createUserWithEmailAndPassword(auth, email, password) {
   const id = Date.now().toString();
   return { user: { uid: id, email } };
}
export async function updatePassword() {}

// FIRESTORE
export function collection(db, path) { return { path, type: 'col' }; }
export function doc(db, path, id) { 
    if (id === undefined) {
       if (path && path.type === 'col') {
          return { path: path.path, id: Date.now().toString() + Math.random().toString(36).substr(2, 9), type: 'doc' };
       }
       const parts = path.split('/');
       return { path: parts[0], id: parts[1], type: 'doc' };
    }
    return { path, id, type: 'doc' }; 
}

export function query(colRef, ...constraints) {
    return { ...colRef, constraints };
}
export function where(field, op, value) { return { type: 'where', field, op, value }; }
export function orderBy(field, dir) { return { type: 'orderBy', field, dir }; }

function filterAndSort(docsObj, constraints = []) {
   let docs = Object.values(docsObj || {});
   for (let c of constraints) {
       if (c.type === 'where') {
           docs = docs.filter(d => {
               if (c.op === '==') return d[c.field] === c.value;
               if (c.op === 'in') return c.value.includes(d[c.field]);
               if (c.op === 'array-contains') return Array.isArray(d[c.field]) && d[c.field].includes(c.value);
               return true;
           });
       }
       if (c.type === 'orderBy') {
           docs = docs.sort((a,b) => {
               let valA = a[c.field];
               let valB = b[c.field];
               if (valA < valB) return c.dir === 'desc' ? 1 : -1;
               if (valA > valB) return c.dir === 'desc' ? -1 : 1;
               return 0;
           });
       }
   }
   return docs;
}

export function onSnapshot(q, callback) {
    const trigger = () => {
       if (q.type === 'doc') {
           const d = (dbCache[q.path] || {})[q.id];
           callback({
               exists: () => !!d,
               id: q.id,
               data: () => d
           });
       } else {
           const docs = filterAndSort(dbCache[q.path], q.constraints);
           callback({
               docs: docs.map(d => ({ id: d.id, data: () => d }))
           });
       }
    };
    listeners.push(trigger);
    trigger(); // trigger immediately with cached data
    return () => {
       listeners = listeners.filter(l => l !== trigger);
    };
}

export async function getDocs(q) {
    const res = await fetch('/api/db');
    if (res.ok) {
       dbCache = await res.json();
    }
    const docs = filterAndSort(dbCache[q.path], q.constraints);
    return {
        docs: docs.map(d => ({ id: d.id, data: () => d }))
    };
}

export async function getDoc(docRef) {
    const res = await fetch('/api/db');
    if(res.ok) dbCache = await res.json();
    const d = (dbCache[docRef.path] || {})[docRef.id];
    return {
        exists: () => !!d,
        id: docRef.id,
        data: () => d
    };
}

export async function addDoc(colRef, data) {
    const res = await fetch(`/api/collections/${colRef.path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const d = await res.json();
    return { id: d.id };
}

export async function setDoc(docRef, data, options) {
    await fetch(`/api/collections/${docRef.path}/${docRef.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

export async function updateDoc(docRef, data) {
    await fetch(`/api/collections/${docRef.path}/${docRef.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

export async function deleteDoc(docRef) {
    await fetch(`/api/collections/${docRef.path}/${docRef.id}`, {
        method: 'DELETE'
    });
}

export function writeBatch() {
    return {
        set: async (ref, data) => setDoc(ref, data),
        update: async (ref, data) => updateDoc(ref, data),
        delete: async (ref) => deleteDoc(ref),
        commit: async () => {}
    };
}

// STORAGE
export function ref(storage, path) {
    return { path };
}
export async function uploadBytes(fileRef, file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });
    const data = await res.json();
    fileRef.url = data.url;
}
export async function getDownloadURL(fileRef) {
    return fileRef.url;
}
