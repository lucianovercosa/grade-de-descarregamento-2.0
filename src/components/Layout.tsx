import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Sidebar } from './Sidebar';
import { Menu, LogOut, X } from 'lucide-react';
import { Logo } from './Logo';

export function Layout({ children, activeView, onNavigate }: { children: React.ReactNode, activeView: string, onNavigate: (v: string) => void }) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-[#E0E0E0] font-sans overflow-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#15151A] border-b border-white/5 flex items-center justify-between px-4 z-50">
        <Logo />
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-white/70 hover:text-white"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar - Desktop & Mobile */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setMobileMenuOpen(false)} activeView={activeView} onNavigate={onNavigate} />
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 pt-16 lg:pt-0">
        <header className="h-16 border-b border-white/5 bg-[#0A0A0B]/50 backdrop-blur-md hidden lg:flex items-center justify-end px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-white/50">{user?.role}</p>
            </div>
            <button 
              onClick={() => logout()}
              className="p-2 text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-4 lg:p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
