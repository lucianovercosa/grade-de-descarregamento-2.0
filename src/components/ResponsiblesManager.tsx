import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface Responsible {
  id?: string;
  name: string;
  created_at: string;
}

export function ResponsiblesManager() {
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [name, setName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'responsibles'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Responsible));
      setResponsibles(data);
    }, (error) => {
      console.log('Responsibles listener error:', error);
    });
    return unsubscribe;
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      const id = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
      await setDoc(doc(db, 'responsibles', id), {
        name: name.trim(),
        created_at: new Date().toISOString()
      });
      setIsAdding(false);
      setName('');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar responsável: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'responsibles', id));
      setDeletingId(null);
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  if (isAdding) {
    return (
      <div className="bg-[#15151A] rounded-xl border border-white/10 p-6 max-w-2xl text-white font-sans">
        <h2 className="text-sm font-bold text-white/80 mb-6 uppercase tracking-widest">Novo Responsável</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Nome do Responsável
            <input 
              type="text" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" 
            />
          </label>
          
          <div className="flex justify-end gap-3 mt-4">
            <button 
              type="button" 
              onClick={() => { setIsAdding(false); setName(''); }}
              className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white uppercase tracking-widest transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 text-white text-xs font-bold py-2 px-6 rounded hover:bg-blue-700 uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Responsável'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-[#15151A] rounded-xl border border-white/10 p-6 text-white max-w-4xl font-sans">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-sm font-bold text-white/80 uppercase tracking-widest">Responsáveis</h2>
        <button onClick={() => setIsAdding(true)} className="bg-blue-600 text-white text-[10px] font-bold py-2 px-4 rounded hover:bg-blue-700 transition-colors uppercase tracking-widest">
          Adicionar Responsável
        </button>
      </div>
      
      <div className="flex flex-col gap-4">
        {responsibles.length === 0 ? (
          <div className="text-center py-8 text-white/40 text-sm">
            Nenhum responsável cadastrado.
          </div>
        ) : (
          responsibles.map(r => (
            <div key={r.id} className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-white/5">
              <div>
                <div className="font-bold text-lg text-white">{r.name}</div>
              </div>
              <div className="flex gap-2">
                {deletingId === r.id ? (
                  <>
                    <span className="text-[10px] text-white/60 uppercase tracking-widest flex items-center mr-2">Tem certeza?</span>
                    <button 
                      onClick={() => setDeletingId(null)}
                      className="text-[10px] uppercase tracking-widest text-white/60 hover:text-white font-bold px-3 py-2 bg-white/5 hover:bg-white/10 rounded transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => handleDelete(r.id!)}
                      className="text-[10px] uppercase tracking-widest text-red-400 hover:text-white font-bold px-3 py-2 bg-red-500 hover:bg-red-600 rounded transition-colors"
                    >
                      Sim, Excluir
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setDeletingId(r.id!)}
                    className="text-[10px] uppercase tracking-widest text-red-400 hover:text-red-300 font-bold px-3 py-2 bg-red-400/10 hover:bg-red-400/20 rounded transition-colors"
                  >
                    Excluir
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
