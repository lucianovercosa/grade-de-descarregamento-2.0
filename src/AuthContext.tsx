import React from "react";
import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken as setLocalToken, clearToken as clearLocalToken } from './lib/api';

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, hasPermission: () => false, login: async () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    // Bypass login screen
    setUser({
      uid: 'admin_uid',
      email: 'admin@local.com',
      role: 'admin',
      name: 'Administrador (Bypass)',
      permissions: ['manage_vehicles','manage_products','manage_users','manage_responsibles','manage_roles','view_dashboard','view_tv']
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    setLocalToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    clearLocalToken();
    setUser(null);
  };

  const hasPermission = (perm: string) => {
    if (!user) return false;
    if (user.role === 'admin') return true; 
    if (user.permissions && user.permissions.includes(perm)) return true;
    return false;
  };

  return <AuthContext.Provider value={{ user, loading, hasPermission, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
