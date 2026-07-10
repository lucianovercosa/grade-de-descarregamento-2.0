import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Role } from '../types';

const AVAILABLE_PERMISSIONS = [
  { id: 'manage_vehicles', label: 'Gerenciar Cadastro' },
  { id: 'manage_products', label: 'Gerenciar Produtos' },
  { id: 'manage_users', label: 'Gerenciar Usuários' },
  { id: 'manage_responsibles', label: 'Gerenciar Responsáveis' },
  { id: 'manage_roles', label: 'Gerenciar Funções' },
  { id: 'view_dashboard', label: 'Visualizar Dashboard' },
  { id: 'view_tv', label: 'Visualizar TV' },
];

export function RolesManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'roles'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
      setRoles(data);
    }, (error) => {
      console.log('Roles listener error:', error);
    });
    return unsubscribe;
  }, []);

  const getDisplayRoles = () => {
    const display = [...roles];
    const defaultRoles: Role[] = [
      { id: 'admin', name: 'admin', permissions: ['manage_vehicles', 'manage_products', 'manage_users', 'manage_responsibles', 'manage_roles', 'view_dashboard', 'view_tv'], created_at: new Date().toISOString() },
      { id: 'mro', name: 'mro', permissions: ['manage_vehicles', 'view_dashboard'], created_at: new Date().toISOString() },
      { id: 'empilhador', name: 'empilhador', permissions: ['manage_vehicles', 'view_dashboard'], created_at: new Date().toISOString() },
      { id: 'tv', name: 'tv', permissions: ['view_tv'], created_at: new Date().toISOString() },
    ];
    
    defaultRoles.forEach(dr => {
      if (!display.find(r => r.name.toLowerCase() === dr.name.toLowerCase())) {
        display.unshift(dr);
      }
    });
    return display;
  };

  const displayRoles = getDisplayRoles();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;

    setLoading(true);
    try {
      if (isAdding) {
        const newDocRef = doc(collection(db, 'roles'));
        await setDoc(newDocRef, {
          name,
          permissions: selectedPermissions,
          created_at: new Date().toISOString()
        });
      } else if (editingRole?.id) {
        if (['admin', 'mro', 'empilhador', 'tv'].includes(editingRole.id)) {
          await setDoc(doc(db, 'roles', editingRole.id), {
            name,
            permissions: selectedPermissions,
            created_at: new Date().toISOString()
          });
        } else {
          await updateDoc(doc(db, 'roles', editingRole.id), {
            name,
            permissions: selectedPermissions,
          });
        }
      }
      setIsAdding(false);
      setEditingRole(null);
      setSelectedPermissions([]);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar função: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (['admin', 'mro', 'empilhador', 'tv'].includes(id)) {
         alert('Esta é uma função padrão e não pode ser excluída, apenas editada.');
         setDeletingRoleId(null);
         return;
      }
      await deleteDoc(doc(db, 'roles', id));
      setDeletingRoleId(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao remover função.');
    }
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  if (isAdding || editingRole) {
    const role = editingRole || { name: '', permissions: [] };
    
    return (
      <div className="bg-[#15151A] rounded-xl border border-white/10 p-6 max-w-2xl text-white font-sans">
        <h2 className="text-sm font-bold text-white/80 mb-6 uppercase tracking-widest">{isAdding ? 'Nova Função' : 'Editar Função'}</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Nome da Função
            <input name="name" required defaultValue={role.name} disabled={['admin', 'mro', 'empilhador', 'tv'].includes(role.id!)} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal disabled:opacity-50" />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Permissões</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AVAILABLE_PERMISSIONS.map(perm => (
                <label key={perm.id} className="flex items-center gap-3 text-sm cursor-pointer group">
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedPermissions.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                  />
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedPermissions.includes(perm.id) ? 'bg-blue-600 border-blue-500 text-white' : 'border-white/20 bg-black/40 group-hover:border-white/40 text-transparent'}`}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <span className="text-white/80 group-hover:text-white transition-colors">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-white/10">
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors uppercase tracking-wider disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" disabled={loading} onClick={() => { setIsAdding(false); setEditingRole(null); setSelectedPermissions([]); }} className="px-6 py-2 bg-white/5 text-white/60 text-xs font-bold rounded hover:bg-white/10 hover:text-white transition-colors uppercase tracking-wider disabled:opacity-50">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white/80 uppercase tracking-widest">Gerenciador de Funções / Permissões</h2>
        <button onClick={() => { setIsAdding(true); setSelectedPermissions([]); }} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors uppercase tracking-wider flex items-center gap-2">
          + Nova Função
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {displayRoles.map(role => (
          <div key={role.id} className="bg-[#15151A] rounded-xl border border-white/10 p-4 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-white uppercase tracking-widest text-xs">{role.name}</span>
              <span className="text-[10px] text-white/40 uppercase tracking-widest">
                {role.permissions.length} permissões configuradas
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={() => { setEditingRole(role); setSelectedPermissions(role.permissions || []); }} className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest">
                Editar
              </button>
              
              {deletingRoleId === role.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold mr-2">Tem certeza?</span>
                  <button onClick={() => handleDelete(role.id!)} className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded">Sim</button>
                  <button onClick={() => setDeletingRoleId(null)} className="text-[10px] font-bold text-white/60 hover:text-white uppercase tracking-widest px-3 py-1 bg-white/5 rounded">Não</button>
                </div>
              ) : (
                <button 
                  onClick={() => setDeletingRoleId(role.id!)} 
                  className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded transition-colors ${['admin', 'mro', 'empilhador', 'tv'].includes(role.id!) ? 'text-white/20 cursor-not-allowed' : 'text-red-500/60 hover:text-red-500 hover:bg-red-500/10'}`}
                  disabled={['admin', 'mro', 'empilhador', 'tv'].includes(role.id!)}
                  title={['admin', 'mro', 'empilhador', 'tv'].includes(role.id!) ? 'Função padrão não pode ser excluída' : ''}
                >
                  Excluir
                </button>
              )}
            </div>
          </div>
        ))}
        {displayRoles.length === 0 && (
          <div className="text-center py-12 text-white/40 text-sm">
            Nenhuma função cadastrada
          </div>
        )}
      </div>
    </div>
  );
}
