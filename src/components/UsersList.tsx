import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AppUser } from '../types';

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Acesso total: Usuários, Produtos, Cadastro e Dashboards.',
  mro: 'Operador Master: Gestão da operação e status.',
  empilhador: 'Operacional: Movimentação e atualização de status.',
  tv: 'Painel TV: Apenas visualização, sem interação.'
};

export function UsersList() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
      setUsers(data);
    }, (error) => {
      console.log('Users listener error:', error);
    });
    return unsubscribe;
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const role = (form.elements.namedItem('role') as HTMLSelectElement).value as AppUser['role'];
    const active = (form.elements.namedItem('active') as HTMLInputElement).checked;
    
    try {
      if (isAdding) {
        // Create user with email as the ID initially, AuthContext will migrate it when they login
        const newDocRef = doc(db, 'users', email);
        await setDoc(newDocRef, {
          email,
          username: email.split('@')[0],
          name,
          role,
          active,
          created_at: new Date().toISOString()
        });
      } else if (editingUser?.id) {
        await updateDoc(doc(db, 'users', editingUser.id), {
          email,
          name,
          role,
          active
        });
      }
      setIsAdding(false);
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar usuário.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este usuário?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (err) {
        console.error(err);
        alert('Erro ao remover usuário.');
      }
    }
  };

  if (isAdding || editingUser) {
    const user = editingUser || { email: '', name: '', role: 'empilhador', active: true };
    return (
      <div className="bg-[#15151A] rounded-xl border border-white/10 p-6 max-w-2xl text-white font-sans">
        <h2 className="text-sm font-bold text-white/80 mb-6 uppercase tracking-widest">{isAdding ? 'Novo Usuário' : 'Editar Usuário'}</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Email
            <input name="email" type="email" required defaultValue={user.email} disabled={!isAdding} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal disabled:opacity-50 disabled:bg-black/20" />
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Nome Completo
            <input name="name" required defaultValue={user.name} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" />
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Função / Permissão
            <select name="role" defaultValue={user.role} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal">
              <option value="admin" className="bg-[#15151A]">Administrador - {ROLE_DESCRIPTIONS.admin}</option>
              <option value="mro" className="bg-[#15151A]">MRO - {ROLE_DESCRIPTIONS.mro}</option>
              <option value="empilhador" className="bg-[#15151A]">Empilhador - {ROLE_DESCRIPTIONS.empilhador}</option>
              <option value="tv" className="bg-[#15151A]">TV / Painel - {ROLE_DESCRIPTIONS.tv}</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-white/80 mt-2 cursor-pointer">
            <input name="active" type="checkbox" defaultChecked={user.active} className="w-4 h-4 rounded border-white/10 bg-black/40 text-blue-500 focus:ring-blue-500/20" />
            Usuário Ativo
          </label>
          
          <div className="flex gap-3 mt-4">
            <button type="submit" className="bg-blue-600 text-white text-xs font-bold py-3 px-6 rounded hover:bg-blue-700 transition-colors uppercase tracking-wider">
              Salvar Usuário
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
              <div className="font-bold text-lg text-white">{u.name} <span className="text-sm font-normal text-white/40">({u.email || u.username})</span></div>
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
              <button onClick={() => handleDelete(u.id!)} className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest">
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
