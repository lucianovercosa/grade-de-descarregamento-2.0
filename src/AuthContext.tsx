import React from "react";
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';

export type UserRole = 'admin' | 'empilhador' | 'mro' | 'tv';

export interface UserData {
  uid: string;
  email: string;
  role: string;
  name: string;
  must_change_password?: boolean;
  permissions?: string[];
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, hasPermission: () => false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRolePermissions = async (roleName: string): Promise<string[]> => {
    try {
      const q = query(collection(db, 'roles'), where('name', '==', roleName));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data().permissions || [];
      }
      
      // Fallback for default roles
      if (roleName === 'admin') return ['manage_vehicles', 'manage_products', 'manage_users', 'manage_responsibles', 'manage_roles', 'view_dashboard', 'view_tv'];
      if (roleName === 'mro' || roleName === 'empilhador') return ['manage_vehicles', 'view_dashboard'];
      if (roleName === 'tv') return ['view_tv'];
    } catch (e) {
      console.error("Error fetching permissions", e);
    }
    return [];
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        if (fbUser.isAnonymous) {
          setUser({
            uid: fbUser.uid,
            email: 'visitante@anonimo.com',
            role: 'admin',
            name: 'Visitante (Admin)',
            permissions: ['manage_vehicles', 'manage_products', 'manage_users', 'manage_responsibles', 'manage_roles', 'view_dashboard', 'view_tv']
          });
          setLoading(false);
          return;
        }

        // Assume users have a document in 'users' collection
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const permissions = await fetchRolePermissions(userData.role);
            setUser({
              uid: fbUser.uid,
              email: fbUser.email || '',
              role: userData.role,
              name: userData.name,
              must_change_password: userData.must_change_password,
              permissions
            });
          } else {
            // Try to find the user by email
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
              
              const permissions = await fetchRolePermissions(data.role);
              setUser({
                uid: fbUser.uid,
                email: fbUser.email || '',
                role: data.role,
                name: data.name || fbUser.displayName || fbUser.email || 'Usuário',
                must_change_password: data.must_change_password,
                permissions
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
                  permissions: ['manage_vehicles', 'manage_products', 'manage_users', 'manage_responsibles', 'manage_roles', 'view_dashboard', 'view_tv']
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

  const hasPermission = (perm: string) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Hardcoded fallback for super admin
    if (user.permissions && user.permissions.includes(perm)) return true;
    return false;
  };

  return <AuthContext.Provider value={{ user, loading, hasPermission }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
