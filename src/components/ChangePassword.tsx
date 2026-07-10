import React, { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Logo } from './Logo';
import { useAuth } from '../AuthContext';

export function ChangePassword() {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      if (!auth.currentUser || !user) throw new Error('Usuário não autenticado');
      
      await updatePassword(auth.currentUser, password);
      await updateDoc(doc(db, 'users', user.uid), {
        must_change_password: false
      });
      
      // Reload page to re-evaluate user state
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao alterar a senha. Tente fazer login novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-[#0A0A0B] text-[#E0E0E0] p-5 font-sans">
      <div className="w-full max-w-md bg-[#15151A] rounded-xl shadow-xl p-8 border border-white/10">
        <Logo className="mb-6" />
        <h2 className="text-xl font-bold text-white mb-2">Alterar Senha</h2>
        <p className="text-sm text-white/60 mb-6">Por segurança, você precisa alterar a senha padrão antes de continuar.</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <div className="text-red-400 min-h-[20px] text-xs">{error}</div>}
          
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Nova Senha
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal"
              required 
            />
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Confirmar Nova Senha
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal"
              required 
            />
          </label>
          <button type="submit" disabled={loading} className="mt-2 bg-blue-600 text-white text-xs font-bold py-3 px-4 rounded hover:bg-blue-700 uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? 'Aguarde...' : 'Salvar Senha'}
          </button>
        </form>
      </div>
    </section>
  );
}
