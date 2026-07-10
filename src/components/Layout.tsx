import React from "react";
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../AuthContext';
import { LogOut } from 'lucide-react';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: string) => void;
}

export function Layout({ children, activeView, onNavigate }: LayoutProps) {
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0A0A0B] text-[#E0E0E0] font-sans">
      <aside className="w-full md:w-64 border-r border-white/10 flex flex-col bg-[#0F0F12]">
        <div className="p-6 border-b border-white/10">
          <Logo />
        </div>
        
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
            {user?.name?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-semibold text-white">{user?.name}</p>
            <p className="text-[10px] text-white/40 capitalize">{user?.role}</p>
          </div>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1">
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`text-left px-6 py-3 transition-colors flex items-center gap-3 ${activeView === 'dashboard' ? 'bg-blue-500/10 border-r-4 border-blue-500 text-blue-400 font-medium' : 'text-white/60 hover:text-white'}`}
          >
            <span className="text-sm">Dashboard</span>
          </button>
          
          {user?.role === 'admin' && (
            <>
              <button 
                onClick={() => onNavigate('vehicles')}
                className={`text-left px-6 py-3 transition-colors flex items-center gap-3 ${activeView === 'vehicles' ? 'bg-blue-500/10 border-r-4 border-blue-500 text-blue-400 font-medium' : 'text-white/60 hover:text-white'}`}
              >
                <span className="text-sm">Cadastro</span>
              </button>
              <button 
                onClick={() => onNavigate('products')}
                className={`text-left px-6 py-3 transition-colors flex items-center gap-3 ${activeView === 'products' ? 'bg-blue-500/10 border-r-4 border-blue-500 text-blue-400 font-medium' : 'text-white/60 hover:text-white'}`}
              >
                <span className="text-sm">Produtos</span>
              </button>
              <button 
                onClick={() => onNavigate('users')}
                className={`text-left px-6 py-3 transition-colors flex items-center gap-3 ${activeView === 'users' ? 'bg-blue-500/10 border-r-4 border-blue-500 text-blue-400 font-medium' : 'text-white/60 hover:text-white'}`}
              >
                <span className="text-sm">Usuários</span>
              </button>
              <button 
                onClick={() => onNavigate('whatsapp')}
                className={`text-left px-6 py-3 transition-colors flex items-center gap-3 ${activeView === 'whatsapp' ? 'bg-blue-500/10 border-r-4 border-blue-500 text-blue-400 font-medium' : 'text-white/60 hover:text-white'}`}
              >
                <span className="text-sm">Alertas WhatsApp</span>
              </button>
            </>
          )}

          <button 
            onClick={() => onNavigate('tv')}
            className={`text-left px-6 py-3 transition-colors flex items-center gap-3 ${activeView === 'tv' ? 'bg-blue-500/10 border-r-4 border-blue-500 text-blue-400 font-medium' : 'text-white/60 hover:text-white'}`}
          >
            <span className="text-sm">TV</span>
          </button>
        </nav>

        <div className="p-6 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-white/60 hover:text-white transition-colors text-sm w-full"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden h-screen">
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
        
        {/* Bottom Status Bar */}
        <footer className="h-10 shrink-0 bg-black/60 border-t border-white/10 px-6 flex items-center justify-between text-[9px] tracking-wider text-white/40 uppercase font-medium">
          <div className="flex gap-4">
            <span>Servidor: Ativo</span>
            <span className="text-green-500">● Conectado ao Firestore</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
