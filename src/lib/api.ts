import { db } from '../firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

export const API_URL = '/api';

export function getToken() { return localStorage.getItem('token'); }
export function setToken(token: string) { localStorage.setItem('token', token); }
export function clearToken() { localStorage.removeItem('token'); }

function getCollectionFromEndpoint(endpoint: string) {
  // e.g. "/vehicles" -> "vehicles"
  // e.g. "/vehicles/123" -> coll: "vehicles", id: "123"
  const parts = endpoint.split('/').filter(Boolean);
  if (parts.length === 1) return { coll: parts[0], id: null };
  if (parts.length === 2) return { coll: parts[0], id: parts[1] };
  return { coll: null, id: null };
}

export const api = {
  get: async (endpoint: string): Promise<any> => {
    // Edge case: if asking for me/auth, just return mock
    if (endpoint.includes('/auth/')) return {};

    const { coll, id } = getCollectionFromEndpoint(endpoint);
    if (!coll) return [];
    
    if (id) {
      const d = await getDoc(doc(db, coll, id));
      return d.exists() ? { id: d.id, ...d.data() } : null;
    } else {
      const snap = await getDocs(collection(db, coll));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  },
  post: async (endpoint: string, body: any): Promise<any> => {
    if (endpoint.includes('/auth/')) return { token: 'mock', user: {} };

    if (endpoint === '/products/batch') {
      const batch = writeBatch(db);
      body.items.forEach((item: any) => {
        const docId = item.id ? String(item.id) : undefined;
        const ref = docId ? doc(db, 'products', docId) : doc(collection(db, 'products'));
        const { id, ...data } = item;
        batch.set(ref, data);
      });
      await batch.commit();
      return { success: true };
    }

    const { coll } = getCollectionFromEndpoint(endpoint);
    if (!coll) return null;

    let ref;
    let dataToSave = { ...body };
    const docId = body.id ? String(body.id) : null;
    
    if (docId) {
      ref = doc(db, coll, docId);
      delete dataToSave.id;
    } else {
      ref = doc(collection(db, coll));
    }
    
    await setDoc(ref, dataToSave);
    return { id: ref.id, ...dataToSave };
  },
  put: async (endpoint: string, body: any) => {
    if (endpoint.includes('/auth/')) return {};

    const { coll, id } = getCollectionFromEndpoint(endpoint);
    if (!coll || !id) return null;
    
    const ref = doc(db, coll, id);
    const dataToSave = { ...body };
    delete dataToSave.id;
    
    // In case the document doesn't exist, setDoc with merge is safer
    await setDoc(ref, dataToSave, { merge: true });
    return { id, ...dataToSave };
  },
  delete: async (endpoint: string) => {
    const { coll, id } = getCollectionFromEndpoint(endpoint);
    if (!coll) return;
    
    if (id) {
      await deleteDoc(doc(db, coll, id));
    } else {
      // Clear entire collection (used for chat_messages reset)
      const snap = await getDocs(collection(db, coll));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
    return { success: true };
  }
};
