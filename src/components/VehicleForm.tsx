import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Vehicle, PROGRESS_OPTIONS, PROGRESS_PERCENT, AppUser, VehicleItem } from '../types';
import { startOfDay, endOfDay, format } from 'date-fns';
import { handleWhatsAppShare } from '../whatsapp';
import { onSnapshot } from 'firebase/firestore';

interface VehicleFormProps {
  vehicleId?: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

const emptyItem: VehicleItem = {
  code: '',
  description: '',
  location: '',
  volume: 0
};

const emptyVehicle: Partial<Vehicle> = {
  plate: '', driver: '', driver_phone: '', transporter: '', supplier: '', invoice_number: '',
  items: [{ ...emptyItem }], notes: '', forklift_user_id: '', forklift_name: '',
  progress_status: 'TRIAGEM', progress_percent: 10, started_at: ''
};

export function VehicleForm({ vehicleId, onSaved, onCancel }: VehicleFormProps) {
  const [formData, setFormData] = useState<Partial<Vehicle>>(emptyVehicle);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setUploading(true);
    const files = Array.from(e.target.files);
    const newAttachments = [...(formData.attachments || [])];

    try {
      for (const f of files) {
        const file = f as File;
        let finalFile = file;
        if (file.type.startsWith('image/')) {
          const imageCompression = (await import('browser-image-compression')).default;
          const options = {
            maxSizeMB: 0.1,
            maxWidthOrHeight: 800,
            useWebWorker: true
          };
          finalFile = await imageCompression(file, options);
        }
        
        const reader = new FileReader();
        const base64Url = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(finalFile);
        });
        
        newAttachments.push({ name: file.name, url: base64Url, type: file.type });
      }
      setFormData({ ...formData, attachments: newAttachments });
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Erro ao processar o arquivo. Tente um arquivo menor.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const openAttachment = (e: React.MouseEvent, att: {name?: string, url: string, type?: string}) => {
    e.preventDefault();
    if (att.url.startsWith('data:image/') || att.url.includes('firebasestorage')) {
      setPreviewAtt({ name: att.name || 'Anexo', url: att.url, type: att.type || 'image/jpeg' });
    } else {
      if (att.url.startsWith('data:')) {
        try {
          const byteString = atob(att.url.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: att.type || 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        } catch (err) {
          window.open(att.url, '_blank');
        }
      } else {
        window.open(att.url, '_blank');
      }
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...(formData.attachments || [])];
    newAttachments.splice(index, 1);
    setFormData({ ...formData, attachments: newAttachments });
  };
  const [empilhadores, setEmpilhadores] = useState<AppUser[]>([]);
  const [productsList, setProductsList] = useState<{code: string, description: string}[]>([]);
  const [whatsappContacts, setWhatsappContacts] = useState<{name: string, phone: string}[]>([]);
  const [alertVehicle, setAlertVehicle] = useState<Vehicle | null>(null);
  const [previewAtt, setPreviewAtt] = useState<{name: string, url: string, type: string} | null>(null);

  useEffect(() => {
    const unsubContacts = onSnapshot(doc(db, 'settings', 'whatsapp'), (docSnap) => {
      if (docSnap.exists()) {
        setWhatsappContacts(docSnap.data().contacts || []);
      }
    }, (error) => {
      console.log('Contacts listener error:', error);
    });

    // Load empilhadores
    const loadUsers = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'empilhador'));
        const snap = await getDocs(q);
        const usersList: AppUser[] = [];
        snap.forEach(d => usersList.push({ id: d.id, ...d.data() } as AppUser));
        setEmpilhadores(usersList);
      } catch (err) {
        console.error("Failed to load empilhadores", err);
      }
    };
    
    // Load products
    const loadProducts = async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        const pList: {code: string, description: string}[] = [];
        snap.forEach(d => {
          const data = d.data();
          pList.push({ code: data.code, description: data.description });
        });
        // Sort by description
        pList.sort((a, b) => a.description.localeCompare(b.description));
        setProductsList(pList);
      } catch (err) {
        console.error("Failed to load products", err);
      }
    };

    loadUsers();
    loadProducts();
    return unsubContacts;
  }, []);

  useEffect(() => {
    if (vehicleId) {
      getDoc(doc(db, 'vehicles', vehicleId)).then(snap => {
        if (snap.exists()) {
          const data = snap.data() as Vehicle;
          setFormData({
            ...data,
            items: data.items && data.items.length > 0 ? data.items : [{ ...emptyItem }]
          });
        }
      });
    } else {
      setFormData(emptyVehicle);
    }
  }, [vehicleId]);

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), { ...emptyItem }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: keyof VehicleItem, value: any) => {
    setFormData(prev => {
      const newItems = [...(prev.items || [])];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleCodeBlur = async (index: number, code: string) => {
    if (!code) return;
    try {
      const pDoc = await getDoc(doc(db, 'products', code));
      if (pDoc.exists()) {
        const pData = pDoc.data();
        if (pData.description) {
          handleItemChange(index, 'description', pData.description);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const selectedEmp = empilhadores.find(u => u.id === formData.forklift_user_id);
      
      const dataToSave = {
        ...formData,
        forklift_name: selectedEmp ? (selectedEmp.name || selectedEmp.username) : '',
        progress_percent: PROGRESS_PERCENT[formData.progress_status || 'TRIAGEM'],
        updated_at: now
      };

      if (vehicleId) {
        await setDoc(doc(db, 'vehicles', vehicleId), dataToSave, { merge: true });
      } else {
        dataToSave.created_at = now;
        
        const startIso = startOfDay(new Date()).toISOString();
        const endIso = endOfDay(new Date()).toISOString();
        const q = query(collection(db, 'vehicles'), where('created_at', '>=', startIso), where('created_at', '<=', endIso));
        const qs = await getDocs(q);
        let maxSeq = 0;
        qs.forEach(doc => {
          const s = doc.data().daily_sequence || 0;
          if (s > maxSeq) maxSeq = s;
        });
        dataToSave.daily_sequence = maxSeq + 1;

        dataToSave.public_token = Math.random().toString(36).substring(2, 15);
        if (!dataToSave.started_at) {
          dataToSave.started_at = now;
        }
        await addDoc(collection(db, 'vehicles'), dataToSave);
        setAlertVehicle(dataToSave as Vehicle);
      }
      
      if (vehicleId) {
        onSaved();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (alertVehicle) {
    return (
      <div className="bg-[#15151A] rounded-xl border border-white/10 p-6 max-w-sm shadow-sm text-white font-sans text-center">
        <h3 className="text-lg font-bold text-white mb-2">Veículo Cadastrado!</h3>
        <p className="text-white/60 text-xs mb-6">Deseja enviar um alerta no WhatsApp de novo cadastro?</p>
        
        <div className="flex flex-col gap-2 mb-6">
          {alertVehicle.driver_phone && (
            <button onClick={() => { handleWhatsAppShare(alertVehicle, alertVehicle.driver_phone); onSaved(); }} className="p-3 bg-green-600/20 border border-green-500/30 rounded flex justify-between items-center hover:bg-green-600/40 transition-colors">
              <span className="text-xs font-bold text-white">Motorista</span>
              <span className="text-[10px] font-mono text-green-400">{alertVehicle.driver_phone}</span>
            </button>
          )}
          {whatsappContacts.map((c, i) => (
            <button key={i} onClick={() => { handleWhatsAppShare(alertVehicle, c.phone); onSaved(); }} className="p-3 bg-green-600/20 border border-green-500/30 rounded flex justify-between items-center hover:bg-green-600/40 transition-colors">
              <span className="text-xs font-bold text-white">{c.name}</span>
              <span className="text-[10px] font-mono text-green-400">{c.phone}</span>
            </button>
          ))}
          {!alertVehicle.driver_phone && whatsappContacts.length === 0 && (
            <div className="text-white/40 text-xs italic">Nenhum contato cadastrado.</div>
          )}
        </div>

        <button onClick={() => onSaved()} className="w-full p-3 bg-white/5 border border-white/10 rounded text-xs font-bold text-white/80 hover:bg-white/10 transition-colors uppercase tracking-widest">
          Não Enviar / Concluir
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#15151A] rounded-xl border border-white/10 p-6 max-w-4xl shadow-sm text-white font-sans">
      <h2 className="text-sm font-bold text-white/80 mb-6 uppercase tracking-widest">{vehicleId ? 'Editar Veículo' : 'Novo Veículo'}</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Placa
            <input maxLength={10} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-mono" required value={formData.plate || ''} onChange={e => setFormData({...formData, plate: e.target.value.toUpperCase()})} />
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Motorista
            <input className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" value={formData.driver || ''} onChange={e => setFormData({...formData, driver: e.target.value})} />
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Celular
            <input 
              maxLength={15}
              className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" 
              value={formData.driver_phone || ''} 
              onChange={e => {
                let v = e.target.value.replace(/\D/g, '');
                if (v.length > 11) v = v.substring(0, 11);
                let formatted = v;
                if (v.length > 2 && v.length <= 7) {
                  formatted = `(${v.substring(0,2)}) ${v.substring(2)}`;
                } else if (v.length > 7) {
                  formatted = `(${v.substring(0,2)}) ${v.substring(2,7)}-${v.substring(7)}`;
                }
                setFormData({...formData, driver_phone: formatted});
              }} 
            />
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Transportador
            <input className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" value={formData.transporter || ''} onChange={e => setFormData({...formData, transporter: e.target.value})} />
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Fornecedor
            <input className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" value={formData.supplier || ''} onChange={e => setFormData({...formData, supplier: e.target.value})} />
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Nota fiscal
            <input maxLength={10} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" value={formData.invoice_number || ''} onChange={e => setFormData({...formData, invoice_number: e.target.value})} />
          </label>
          
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Hora inicial de entrada</span>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal [color-scheme:dark] flex-1" 
                  value={formData.started_at ? format(new Date(formData.started_at), 'yyyy-MM-dd') : ''} 
                  onChange={e => {
                    const dateVal = e.target.value;
                    if (!dateVal) {
                      setFormData({...formData, started_at: ''});
                      return;
                    }
                    const current = formData.started_at ? new Date(formData.started_at) : new Date();
                    const [y, m, d] = dateVal.split('-').map(Number);
                    current.setFullYear(y, m - 1, d);
                    setFormData({...formData, started_at: current.toISOString()});
                  }} 
                />
                <input 
                  type="time" 
                  className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal [color-scheme:dark] w-32" 
                  value={formData.started_at ? format(new Date(formData.started_at), 'HH:mm') : ''} 
                  onChange={e => {
                    const timeVal = e.target.value;
                    if (!timeVal) return;
                    const current = formData.started_at ? new Date(formData.started_at) : new Date();
                    const [h, min] = timeVal.split(':').map(Number);
                    current.setHours(h, min, 0, 0);
                    setFormData({...formData, started_at: current.toISOString()});
                  }} 
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold truncate">Hora da saída (Automático)</span>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal [color-scheme:dark] flex-1" 
                  value={formData.finished_at ? format(new Date(formData.finished_at), 'yyyy-MM-dd') : ''} 
                  onChange={e => {
                    const dateVal = e.target.value;
                    if (!dateVal) {
                      setFormData({...formData, finished_at: ''});
                      return;
                    }
                    const current = formData.finished_at ? new Date(formData.finished_at) : new Date();
                    const [y, m, d] = dateVal.split('-').map(Number);
                    current.setFullYear(y, m - 1, d);
                    setFormData({...formData, finished_at: current.toISOString()});
                  }} 
                />
                <input 
                  type="time" 
                  className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal [color-scheme:dark] w-32" 
                  value={formData.finished_at ? format(new Date(formData.finished_at), 'HH:mm') : ''} 
                  onChange={e => {
                    const timeVal = e.target.value;
                    if (!timeVal) return;
                    const current = formData.finished_at ? new Date(formData.finished_at) : new Date();
                    const [h, min] = timeVal.split(':').map(Number);
                    current.setHours(h, min, 0, 0);
                    setFormData({...formData, finished_at: current.toISOString()});
                  }} 
                />
              </div>
            </div>
          </div>
        </div>

        <hr className="border-white/10" />

        {/* Items Section */}
        <div>
          <h3 className="text-sm font-bold text-white/80 mb-4 uppercase tracking-widest">Itens do carro</h3>
          <button type="button" onClick={handleAddItem} className="bg-white/5 border border-white/10 text-white text-[10px] font-bold py-2 px-4 rounded hover:bg-white/10 transition-colors mb-4 inline-block uppercase tracking-widest">
            Adicionar item
          </button>
          
          <div className="flex flex-col gap-6">
            {formData.items?.map((item, index) => (
              <div key={index} className="flex flex-col gap-4 p-4 border border-white/10 rounded relative bg-black/20">
                <div className="flex flex-col md:flex-row gap-4">
                  <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold w-full md:w-40 shrink-0">
                    Código do produto
                    <input 
                      type="text"
                      pattern="\d*"
                      maxLength={11}
                      className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" 
                      value={item.code} 
                      onChange={e => {
                        const code = e.target.value.replace(/\D/g, '');
                        const product = productsList.find(p => p.code === code);
                        
                        setFormData(prev => {
                          const newItems = [...(prev.items || [])];
                          newItems[index] = { 
                            ...newItems[index], 
                            code, 
                            description: product ? product.description : ''
                          };
                          return { ...prev, items: newItems };
                        });
                      }}
                      onBlur={() => handleCodeBlur(index, item.code)}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold w-full md:flex-1">
                    Descrição do produto
                    <input className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold md:col-span-5">
                    Local recebimento
                    <input className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" value={item.location} onChange={e => handleItemChange(index, 'location', e.target.value)} />
                  </label>
                  <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold md:col-span-5">
                    Volumes
                    <input type="number" className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" value={item.volume || ''} onChange={e => handleItemChange(index, 'volume', Number(e.target.value))} />
                  </label>
                  <div className="md:col-span-2 flex">
                    <button type="button" onClick={() => handleRemoveItem(index)} className="w-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold py-2.5 px-4 rounded hover:bg-red-500/20 transition-colors uppercase tracking-widest">
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-white/10" />

        {/* Bottom fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold md:col-span-2">
            Empilhador
            <select className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" value={formData.forklift_user_id || ''} onChange={e => setFormData({...formData, forklift_user_id: e.target.value})}>
              <option value="" className="bg-[#15151A]">Sem responsável</option>
              {empilhadores.map(emp => (
                <option key={emp.id} value={emp.id} className="bg-[#15151A]">{emp.name || emp.username}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold md:col-span-2">
            Observações
            <textarea className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal min-h-[80px]" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </label>
          
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
                Anexar fotos ou arquivos
                <div className="flex items-center gap-2">
                  <input type="file" multiple onChange={handleFileUpload} disabled={uploading} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none w-full file:mr-4 file:py-1 file:px-2 file:rounded file:border file:border-white/10 file:text-[10px] file:uppercase file:tracking-widest file:font-bold file:bg-white/5 file:text-white hover:file:bg-white/10 text-white/60 disabled:opacity-50" />
                </div>
              </label>

              <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
                Tirar foto pelo celular
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} disabled={uploading} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none w-full file:mr-4 file:py-1 file:px-2 file:rounded file:border file:border-white/10 file:text-[10px] file:uppercase file:tracking-widest file:font-bold file:bg-white/5 file:text-white hover:file:bg-white/10 text-white/60 disabled:opacity-50" />
                </div>
              </label>
            </div>
            
            {uploading && <div className="text-blue-400 text-xs font-bold animate-pulse">Enviando arquivo(s)...</div>}

            {formData.attachments && formData.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Arquivos Anexados ({formData.attachments.length})</div>
                <div className="flex flex-col gap-2">
                  {formData.attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-black/40 border border-white/10 rounded p-2">
                      <a href="#" onClick={(e) => openAttachment(e, att)} className="text-blue-400 hover:text-blue-300 text-sm truncate max-w-[80%] hover:underline">
                        {att.name}
                      </a>
                      <button type="button" onClick={() => removeAttachment(idx)} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-widest px-2 py-1 bg-red-500/10 rounded">
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white text-xs font-bold py-3 px-6 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 inline-block uppercase tracking-wider">
            {vehicleId ? 'Salvar Alterações' : 'Cadastrar veículo'}
          </button>
          <button type="button" onClick={onCancel} className="bg-white/5 border border-white/10 text-white text-xs font-bold py-3 px-6 rounded hover:bg-white/10 transition-colors uppercase tracking-wider">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
