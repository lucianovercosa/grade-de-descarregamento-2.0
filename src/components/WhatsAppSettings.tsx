import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface AlertContact {
  name: string;
  phone: string;
  isGroup?: boolean;
}

export function WhatsAppSettings() {
  const [contacts, setContacts] = useState<AlertContact[]>([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'whatsapp'), (docSnap) => {
      if (docSnap.exists()) {
        setContacts(docSnap.data().contacts || []);
      }
    }, (error) => {
      console.log('WhatsApp settings listener error:', error);
    });
    return unsub;
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || (!isGroup && !newPhone)) return;
    setLoading(true);
    try {
      const updated = [...contacts, { name: newName, phone: isGroup ? '' : newPhone, isGroup }];
      await setDoc(doc(db, 'settings', 'whatsapp'), { contacts: updated }, { merge: true });
      setNewName('');
      setNewPhone('');
      setIsGroup(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar contato.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (index: number) => {
    try {
      const updated = contacts.filter((_, i) => i !== index);
      await setDoc(doc(db, 'settings', 'whatsapp'), { contacts: updated }, { merge: true });
    } catch (err) {
      console.error(err);
      alert('Erro ao remover contato.');
    }
  };

  return (
    <div className="bg-[#15151A] rounded-xl border border-white/10 p-6 max-w-4xl shadow-sm text-white font-sans">
      <h2 className="text-sm font-bold text-white/80 mb-6 uppercase tracking-widest">Contatos para Alertas (WhatsApp)</h2>
      
      <form onSubmit={handleAdd} className="flex gap-4 items-center mb-8 border-b border-white/10 pb-8">
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold flex-1">
          Nome do Contato / Grupo
          <input className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Supervisor Geral" />
        </label>
        
        <label className="flex items-center gap-2 cursor-pointer mt-4">
          <input type="checkbox" checked={isGroup} onChange={e => setIsGroup(e.target.checked)} className="w-4 h-4 bg-black/40 border border-white/10 rounded accent-blue-500" />
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">É um grupo?</span>
        </label>

        {!isGroup && (
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold flex-1">
            Número (País + DDD + Número)
            <input 
              className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-mono" 
              required={!isGroup}
              value={newPhone} 
              onChange={e => {
                const v = e.target.value.replace(/\D/g, '');
                let formatted = v;
                if (v.length > 0) formatted = '+' + v;
                if (v.length > 2) formatted = '+' + v.slice(0, 2) + ' (' + v.slice(2);
                if (v.length > 4) formatted = '+' + v.slice(0, 2) + ' (' + v.slice(2, 4) + ') ' + v.slice(4);
                if (v.length > 9) formatted = '+' + v.slice(0, 2) + ' (' + v.slice(2, 4) + ') ' + v.slice(4, 9) + '-' + v.slice(9, 13);
                setNewPhone(formatted);
              }} 
              placeholder="+55 (11) 99999-9999" 
              maxLength={19}
            />
          </label>
        )}
        
        <button type="submit" disabled={loading} className="bg-blue-600 text-white text-xs font-bold py-2.5 px-6 rounded hover:bg-blue-700 transition-colors uppercase tracking-wider h-[38px] mt-4">
          Adicionar
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {contacts.map((c, i) => (
          <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-lg border border-white/10">
            <div>
              <div className="font-bold text-white text-sm">{c.name} {c.isGroup && <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded uppercase tracking-widest">Grupo</span>}</div>
              <div className="font-mono text-xs text-white/40 mt-1">{c.isGroup ? 'Seleção manual no WhatsApp' : c.phone}</div>
            </div>
            <button onClick={() => handleRemove(i)} className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest">
              Remover
            </button>
          </div>
        ))}
        {contacts.length === 0 && (
          <div className="text-center text-white/40 text-xs italic py-4">Nenhum contato cadastrado.</div>
        )}
      </div>
    </div>
  );
}
