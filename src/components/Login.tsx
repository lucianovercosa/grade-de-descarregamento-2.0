import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';
import { Logo } from './Logo';

export function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login com o Google.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar como visitante.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Preencha email e senha.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || (isSignUp ? 'Erro ao criar conta.' : 'Erro ao fazer login.'));
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
          
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Email
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal"
              required 
            />
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Senha
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal"
              required 
            />
          </label>

          <button type="submit" disabled={loading} className="mt-2 bg-blue-600 text-white text-xs font-bold py-3 px-4 rounded hover:bg-blue-700 uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? 'Aguarde...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[10px] text-white/40 hover:text-white uppercase tracking-widest transition-colors font-bold"
          >
            {isSignUp ? 'Já tenho uma conta (Login)' : 'Criar nova conta com email'}
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
            <span className="px-2 bg-[#15151A] text-white/40">OU</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button onClick={handleAnonymousLogin} disabled={loading} className="bg-blue-600/20 text-blue-400 text-xs font-bold py-3 px-4 border border-blue-500/30 rounded hover:bg-blue-600/30 uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            Entrar como Visitante
          </button>
          
          <button onClick={handleGoogleLogin} disabled={loading} className="bg-white/5 text-white text-xs font-bold py-3 px-4 border border-white/10 rounded hover:bg-white/10 uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            Entrar com Google
          </button>
        </div>
      </div>
    </section>
  );
}
