import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Logo } from './Logo';

export function Login() {
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Preencha usuário e senha.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    // Convert username to email format if it doesn't have @
    const loginEmail = email.includes('@') ? email.trim() : `${email.trim().toLowerCase()}@local.com`;

    try {
      await signInWithEmailAndPassword(auth, loginEmail, password);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Usuário ou senha incorretos.');
      } else {
        setError(err.message || 'Erro ao fazer login.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Preencha seu e-mail no campo acima para redefinir a senha.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('E-mail de redefinição de senha enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar e-mail de redefinição.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-[#0A0A0B] text-[#E0E0E0] p-5 font-sans">
      <div className="w-full max-w-md bg-[#15151A] rounded-xl shadow-xl p-8 border border-white/10">
        <Logo className="mb-6" />
        
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
          {error && <div className="text-red-400 min-h-[20px] text-xs">{error}</div>}
          {successMsg && <div className="text-green-400 min-h-[20px] text-xs">{successMsg}</div>}
          
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Nome de Usuário
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal"
              required 
            />
          </label>

          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            <div className="flex justify-between items-center">
              <span>Senha</span>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="text-blue-400 hover:text-blue-300 transition-colors normal-case tracking-normal"
              >
                Esqueci minha senha
              </button>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal"
              required 
            />
          </label>

          <button type="submit" disabled={loading} className="mt-2 bg-blue-600 text-white text-xs font-bold py-3 px-4 rounded hover:bg-blue-700 uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? 'Aguarde...' : 'Entrar'}
          </button>
        </form>

              </div>
    </section>
  );
}