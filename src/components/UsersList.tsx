import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface User {
  id?: string;
  uid?: string;
  email?: string;
  username?: string;
  name: string;
  role: string;
  active: boolean;
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Acesso total: Usuários, Produtos, Cadastro e Dashboards.',
  empilhador: 'Lança/Baixa Carregamento de veículos e painel.',
  mro: 'Solicita e edita informações de veículos.',
  tv: 'Apenas visualização do modo Painel/TV.'
};

export function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [displayRoles, setDisplayRoles] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.get('/users');
      // For compatibility, map uid to id
      setUsers(data.map((u: any) => ({ ...u, id: u.uid })));
    } catch(e) {
      console.error(e);
    }
  };

  const fetchRoles = async () => {
    try {
      const roles = await api.get('/roles');
      const defaultRoles = [
        { id: 'default-admin', name: 'admin', permissions: [], created_at: new Date().toISOString() },
        { id: 'default-mro', name: 'mro', permissions: [], created_at: new Date().toISOString() },
        { id: 'default-empilhador', name: 'empilhador', permissions: [], created_at: new Date().toISOString() },
        { id: 'default-tv', name: 'tv', permissions: [], created_at: new Date().toISOString() },
      ];
      
      const combined = [...roles];
      defaultRoles.forEach(dr => {
        if (!combined.find(r => r.name.toLowerCase() === dr.name.toLowerCase())) {
          combined.unshift(dr);
        }
      });
      setDisplayRoles(combined);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const role = (form.elements.namedItem('role') as HTMLSelectElement).value;
    const active = (form.elements.namedItem('active') as HTMLInputElement).checked;
    
    setLoading(true);
    try {
      if (isAdding) {
        const username = (form.elements.namedItem('username') as HTMLInputElement).value;
        const password = (form.elements.namedItem('password') as HTMLInputElement).value;
        const email = `${username.replace(/\s/g, '').toLowerCase()}@local.com`;
        
        await api.post('/users', {
          email,
          password,
          name,
          role,
          active,
          must_change_password: true
        });
      } else if (editingUser?.id) {
        const passwordInput = (form.elements.namedItem('password') as HTMLInputElement);
        const payload: any = { name, role, active };
        if (passwordInput && passwordInput.value.trim()) {
          payload.password = passwordInput.value;
        }
        await api.put(`/users/${editingUser.id}`, payload);
      }
      setIsAdding(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar usuário: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      setDeletingUserId(null);
      fetchUsers();
    } catch (err: any) {
      alert('Erro ao excluir usuário: ' + err.message);
    }
  };

  if (isAdding || editingUser) {
    const user = editingUser || { email: '', username: '', name: '', role: 'empilhador', active: true };
    return (
      <div className="bg-[#15151A] rounded-xl border border-white/10 p-6 max-w-2xl text-white font-sans">
        <h2 className="text-sm font-bold text-white/80 mb-6 uppercase tracking-widest">{isAdding ? 'Novo Usuário' : 'Editar Usuário'}</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Nome de Usuário
            <input name="username" type="text" required defaultValue={user.username || user.email?.split('@')[0]} disabled={!isAdding} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal disabled:opacity-50 disabled:bg-black/20" />
          </label>
          
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            {isAdding ? 'Senha Inicial' : 'Redefinir Senha (opcional)'}
            <input name="password" type="text" required={isAdding} defaultValue={isAdding ? "123456" : ""} placeholder={isAdding ? "" : "Deixe em branco para não alterar"} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" />
            {isAdding && <span className="text-[9px] normal-case text-white/30">O usuário será solicitado a alterar esta senha no primeiro login.</span>}
          </label>
          
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Nome Completo
            <input name="name" required defaultValue={user.name} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" />
          </label>
          
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Função / Permissão
            <select name="role" defaultValue={user.role} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal">
              {displayRoles.map(role => (
                <option key={role.id} value={role.name} className="bg-[#15151A]">
                  {role.name.toUpperCase()} {ROLE_DESCRIPTIONS[role.name.toLowerCase()] ? `- ${ROLE_DESCRIPTIONS[role.name.toLowerCase()]}` : ''}
                </option>
              ))}
            </select>
          </label>
          
          <label className="flex items-center gap-2 text-sm font-bold text-white/80 mt-2 cursor-pointer">
            <input name="active" type="checkbox" defaultChecked={user.active} className="w-4 h-4 rounded border-white/10 bg-black/40 text-blue-500 focus:ring-blue-500/20" />
            Usuário Ativo
          </label>
          
          <div className="flex gap-3 mt-4 flex-wrap">
            <button type="submit" disabled={loading} className="bg-blue-600 disabled:opacity-50 text-white text-xs font-bold py-3 px-6 rounded hover:bg-blue-700 transition-colors uppercase tracking-wider">
              {loading ? "Aguarde..." : "Salvar Usuário"}
            </button>
            <button type="button" onClick={() => { setIsAdding(false); setEditingUser(null); }} className="bg-white/5 border border-white/10 text-white text-xs font-bold py-3 px-6 rounded hover:bg-white/10 transition-colors uppercase tracking-wider">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-[#15151A] rounded-xl border border-white/10 p-6 text-white max-w-4xl font-sans">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-sm font-bold text-white/80 uppercase tracking-widest">Usuários do Sistema</h2>
        <button onClick={() => setIsAdding(true)} className="bg-blue-600 text-white text-[10px] font-bold py-2 px-4 rounded hover:bg-blue-700 transition-colors uppercase tracking-widest">
          Adicionar Usuário
        </button>
      </div>
      
      <div className="flex flex-col gap-4">
        {users.map(u => (
          <div key={u.id} className="p-4 border border-white/10 rounded-lg flex flex-col md:flex-row justify-between md:items-center bg-white/5 hover:bg-white/10 transition-colors gap-4">
            <div>
              <div className="font-bold text-lg text-white">{u.name} <span className="text-sm font-normal text-white/40">({u.username || u.email?.split('@')[0]})</span></div>
              <div className="text-[10px] uppercase tracking-widest text-white/60 mt-1">
                Função: <span className="font-bold">{u.role}</span> <span className="normal-case tracking-normal ml-2 text-white/40">- {ROLE_DESCRIPTIONS[u.role] || ''}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-2 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase ${u.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {u.active ? 'Ativo' : 'Inativo'}
              </span>
              <button onClick={() => setEditingUser(u)} className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest">
                Editar
              </button>
              {deletingUserId === u.id ? (
                <div className="flex gap-2">
                  <span className="text-[10px] text-white/60 uppercase tracking-widest flex items-center">Tem certeza?</span>
                  <button onClick={() => setDeletingUserId(null)} className="text-[10px] font-bold text-white/60 hover:text-white uppercase tracking-widest">
                    Cancelar
                  </button>
                  <button onClick={() => handleDelete(u.id!)} className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest">
                    Sim
                  </button>
                </div>
              ) : (
                <button onClick={() => setDeletingUserId(u.id!)} className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest">
                  Remover
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
