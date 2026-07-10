import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, secondaryAuth, auth } from '../firebase';
import { createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { AppUser, Role } from '../types';

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Acesso total: Usuários, Produtos, Cadastro e Dashboards.',
  mro: 'Operador Master: Gestão da operação e status.',
  empilhador: 'Operacional: Movimentação e atualização de status.',
  tv: 'Painel TV: Apenas visualização, sem interação.'
};

export function UsersList() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [customRoles, setCustomRoles] = useState<Role[]>([]);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
      setUsers(data);
    }, (error) => {
      console.log('Users listener error:', error);
    });

    const qRoles = query(collection(db, 'roles'));
    const unsubRoles = onSnapshot(qRoles, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
      setCustomRoles(data);
    }, (error) => {
      console.log('Roles listener error:', error);
    });

    return () => {
      unsubUsers();
      unsubRoles();
    };
  }, []);

  const [resettingEmail, setResettingEmail] = useState<string | null>(null);

  const executeResetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Email de redefinição enviado com sucesso!');
      setResettingEmail(null);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao enviar email de redefinição: ' + err.message);
    }
  };

  const getDisplayRoles = () => {
    const display = [...customRoles];
    const defaultRoles: Role[] = [
      { id: 'admin', name: 'admin', permissions: [], created_at: new Date().toISOString() },
      { id: 'mro', name: 'mro', permissions: [], created_at: new Date().toISOString() },
      { id: 'empilhador', name: 'empilhador', permissions: [], created_at: new Date().toISOString() },
      { id: 'tv', name: 'tv', permissions: [], created_at: new Date().toISOString() },
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
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const role = (form.elements.namedItem('role') as HTMLSelectElement).value as AppUser['role'];
    const active = (form.elements.namedItem('active') as HTMLInputElement).checked;
    const passwordInput = form.elements.namedItem('password') as HTMLInputElement;
    const password = passwordInput ? passwordInput.value : '';

    setLoading(true);
    try {
      if (isAdding) {
        if (!password || password.length < 6) {
          alert('A senha deve ter pelo menos 6 caracteres.');
          setLoading(false);
          return;
        }
        
        // Create in secondary auth
        const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const uid = userCred.user.uid;
        await signOut(secondaryAuth); // Sign out the secondary instance

        const newDocRef = doc(db, 'users', uid);
        await setDoc(newDocRef, {
          email,
          username: email.split('@')[0],
          name,
          role,
          active,
          must_change_password: true,
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
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar usuário: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      setDeletingUserId(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao remover usuário.');
    }
  };

  if (isAdding || editingUser) {
    const user = editingUser || { email: '', name: '', role: 'empilhador', active: true };
    return (
      <div className="bg-[#15151A] rounded-xl border border-white/10 p-6 max-w-2xl text-white font-sans">
        <h2 className="text-sm font-bold text-white/80 mb-6 uppercase tracking-widest">{isAdding ? 'Novo Usuário' : 'Editar Usuário'}</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Usuário ou Gmail
            <input name="email" type="email" required defaultValue={user.email} disabled={!isAdding} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal disabled:opacity-50 disabled:bg-black/20" />
          </label>
          {isAdding && (
            <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
              Senha Inicial (Padrão)
              <input name="password" type="text" required={isAdding} defaultValue="123456" className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" />
              <span className="text-[9px] normal-case text-white/30">O usuário será solicitado a alterar esta senha no primeiro login.</span>
            </label>
          )}
          {!isAdding && (
            <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
              Nova Senha
              <input name="password_disabled" type="text" placeholder="Use o botão 'REDEFINIR SENHA'" disabled className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white/30 font-normal cursor-not-allowed" />
              <span className="text-[9px] normal-case text-orange-400/80 mt-1">
                Por segurança, o Firebase não permite alterar a senha de outro usuário diretamente. Use o botão <strong>REDEFINIR SENHA</strong> abaixo para enviar um email de recuperação.
              </span>
            </label>
          )}
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
            {!isAdding && user.email && (
              resettingEmail === user.email ? (
                <div className="flex gap-2 ml-auto items-center">
                  <span className="text-[10px] text-yellow-500 uppercase tracking-widest mr-2">Enviar email de redefinição?</span>
                  <button type="button" onClick={() => setResettingEmail(null)} className="text-[10px] font-bold text-white/60 hover:text-white uppercase tracking-widest">
                    Cancelar
                  </button>
                  <button type="button" onClick={() => executeResetPassword(user.email!)} className="bg-yellow-600 border border-yellow-500 text-white text-[10px] font-bold py-2 px-4 rounded hover:bg-yellow-700 transition-colors uppercase tracking-widest">
                    Sim, Enviar
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setResettingEmail(user.email!)} className="bg-yellow-600/20 border border-yellow-500/30 text-yellow-500 text-xs font-bold py-3 px-6 rounded hover:bg-yellow-600/30 transition-colors uppercase tracking-wider ml-auto">
                  Redefinir Senha
                </button>
              )
            )}
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
