import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Logo } from './Logo';
import { api } from '../lib/api';

export function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As novas senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      alert('Senha alterada com sucesso! Faça login novamente.');
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E0E0E0] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#15151A] rounded-xl shadow-xl p-8 border border-white/10">
        <Logo className="mb-6" />
        
        <h2 className="text-xl font-bold mb-2">Alterar Senha</h2>
        <p className="text-white/50 text-sm mb-6">
          É necessário alterar sua senha padrão para continuar acessando o sistema.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-400 text-xs">{error}</div>
          )}
          
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Senha Atual
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal"
              required
            />
          </label>
          
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Nova Senha
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-3 rounded uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {loading ? 'Alterando...' : 'Salvar Nova Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
