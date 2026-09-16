import React from 'react';
import { useAuth } from '../AuthContext';
import { LayoutDashboard, Users, UserCog, Settings, Package, Car, MonitorPlay, X } from 'lucide-react';
import { Logo } from './Logo';

export function Sidebar({ onClose, activeView, onNavigate }: { onClose?: () => void, activeView: string, onNavigate: (view: string) => void }) {
  const { user, hasPermission } = useAuth();
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, permission: 'view_dashboard' },
    { id: 'vehicles', label: 'Cadastro de Veículo', icon: <Car size={18} />, permission: 'manage_vehicles' },
    { id: 'products', label: 'Produtos', icon: <Package size={18} />, permission: 'manage_products' },
    { id: 'users', label: 'Usuários', icon: <Users size={18} />, permission: 'manage_users' },
    { id: 'responsibles', label: 'Responsáveis', icon: <UserCog size={18} />, permission: 'manage_responsibles' },
    { id: 'roles', label: 'Funções', icon: <Settings size={18} />, permission: 'manage_roles' },
    { id: 'tv', label: 'Modo TV', icon: <MonitorPlay size={18} />, permission: 'view_tv' },
  ];

  const allowedItems = navItems.filter(item => hasPermission(item.permission));

  return (
    <div className="w-64 bg-[#15151A] h-full flex flex-col border-r border-white/5 relative">
      <div className="h-16 flex items-center px-6 border-b border-white/5 justify-between">
        <Logo />
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 text-white/50 hover:text-white">
            <X size={20} />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        {allowedItems.map(item => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                if (onClose) onClose();
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-600/10 text-blue-400' : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-white/5">
        <div className="text-[10px] text-white/40 uppercase tracking-widest text-center">
          Versão 1.0.0
        </div>
      </div>
    </div>
  );
}
