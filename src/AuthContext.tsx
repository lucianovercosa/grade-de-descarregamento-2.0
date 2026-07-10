import React from "react";
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export type UserRole = 'admin' | 'empilhador' | 'mro' | 'tv';

export interface UserData {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  must_change_password?: boolean;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Assume users have a document in 'users' collection
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            setUser({
              uid: fbUser.uid,
              email: fbUser.email || '',
              role: userDoc.data().role,
              name: userDoc.data().name,
              must_change_password: userDoc.data().must_change_password,
            });
          } else {
            // Try to find the user by email
            const { collection, query, where, getDocs, setDoc } = await import('firebase/firestore');
            const q = query(collection(db, 'users'), where('email', '==', fbUser.email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const matchedDoc = querySnapshot.docs[0];
              const data = matchedDoc.data();
              
              if (!data.active) {
                 setUser(null);
                 await auth.signOut();
                 setLoading(false);
                 return;
              }

              // Create the document with UID for future fast lookups
              await setDoc(doc(db, 'users', fbUser.uid), {
                ...data,
                uid: fbUser.uid,
                updated_at: new Date().toISOString()
              });
              
              setUser({
                uid: fbUser.uid,
                email: fbUser.email || '',
                role: data.role,
                name: data.name || fbUser.displayName || fbUser.email || 'Usuário',
                must_change_password: data.must_change_password,
              });
            } else if (fbUser.email === 'lucianovercosa@gmail.com') {
              try {
                await setDoc(doc(db, 'users', fbUser.uid), {
                  email: fbUser.email,
                  username: fbUser.email.split('@')[0],
                  name: fbUser.displayName || 'Administrador',
                  role: 'admin',
                  active: true,
                  created_at: new Date().toISOString()
                });
                setUser({
                  uid: fbUser.uid,
                  email: fbUser.email,
                  role: 'admin',
                  name: fbUser.displayName || 'Administrador',
                });
              } catch (err) {
                console.error("Failed to create admin user doc", err);
              }
            } else {
              // Sign out if no user found
              alert('Seu usuário não está cadastrado. Peça para o administrador liberar seu acesso.');
              await auth.signOut();
              setUser(null);
            }
          }
        } catch (e) {
          console.error(e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
