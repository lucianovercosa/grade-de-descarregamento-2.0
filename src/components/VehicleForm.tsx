import { api } from '../lib/api';
import React, { useEffect, useState } from 'react';
import { Vehicle, PROGRESS_OPTIONS, PROGRESS_PERCENT, VehicleItem } from '../types';
import { startOfDay, endOfDay, format } from 'date-fns';

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
  const [empilhadores, setEmpilhadores] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<{code: string, description: string}[]>([]);
  const [previewAtt, setPreviewAtt] = useState<{name: string, url: string, type: string} | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await api.get('/users');
        const responsibles = await api.get('/responsibles');
        setEmpilhadores([...users.filter((u: any) => u.role === 'empilhador'), ...responsibles]);
      } catch (err) {}
    };
    
    const loadProducts = async () => {
      try {
        const pList = await api.get('/products');
        setProductsList(pList);
      } catch (err) {}
    };

    loadUsers();
    loadProducts();

    if (vehicleId) {
      const loadVehicle = async () => {
        try {
          const data = await api.get('/vehicles');
          const vehicle = data.find((v: any) => v.id === vehicleId);
          if (vehicle) {
            if (typeof vehicle.items === 'string') vehicle.items = JSON.parse(vehicle.items);
            if (typeof vehicle.images === 'string') vehicle.images = JSON.parse(vehicle.images);
            if (typeof vehicle.attachments === 'string') vehicle.attachments = JSON.parse(vehicle.attachments);
            setFormData(vehicle);
          }
        } catch (err) {}
      };
      loadVehicle();
    } else {
      setFormData(emptyVehicle);
    }
  }, [vehicleId]);

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
          finalFile = await imageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 1920, useWebWorker: true });
        }
        
        const formDataUpload = new FormData();
        formDataUpload.append('file', finalFile, file.name);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload
        });

        if (!response.ok) throw new Error("Falha no upload do arquivo para o servidor local.");
        
        const data = await response.json();
        
        newAttachments.push({ name: file.name, url: data.url, type: file.type });
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
    if (att.url.startsWith('data:image/') || att.url.includes('firebasestorage') || att.url.startsWith('/uploads/')) {
      setPreviewAtt({ name: att.name || 'Anexo', url: att.url, type: att.type || 'image/jpeg' });
    } else {
      if (att.url.startsWith('data:')) {
        try {
          const byteString = atob(att.url.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) { ia[i] = byteString.charCodeAt(i); }
          const blob = new Blob([ab], { type: att.type || 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        } catch (err) { window.open(att.url, '_blank'); }
      } else { window.open(att.url, '_blank'); }
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...(formData.attachments || [])];
    newAttachments.splice(index, 1);
    setFormData({ ...formData, attachments: newAttachments });
  };

  const handleAddItem = () => {
    setFormData(prev => ({ ...prev, items: [...(prev.items || []), { ...emptyItem }] }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => {
      const newItems = [...(prev.items || [])];
      newItems.splice(index, 1);
      return { ...prev, items: newItems };
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newItems = [...(prev.items || [])];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleCodeBlur = async (index: number, code: string) => {
    if (!code) return;
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
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plate) return;
    
    setLoading(true);
    try {
      const dataToSave = { ...formData };
      const now = new Date().toISOString();
      
      if (dataToSave.forklift_user_id) {
        const emp = empilhadores.find(e => e.id === dataToSave.forklift_user_id);
        if (emp) dataToSave.forklift_name = emp.name || emp.username;
      } else {
        dataToSave.forklift_name = '';
      }
      
      if (vehicleId) {
        await api.put(`/vehicles/${vehicleId}`, dataToSave);
      } else {
        dataToSave.created_at = now;
        dataToSave.started_at = now;
        
        const startIso = startOfDay(new Date()).toISOString();
        const endIso = endOfDay(new Date()).toISOString();
        const resVehicles = await api.get('/vehicles');
        let maxSeq = 0;
        resVehicles.forEach((v: any) => {
          if (v.created_at >= startIso && v.created_at <= endIso) {
            const s = v.daily_sequence || 0;
            if (s > maxSeq) maxSeq = s;
          }
        });
        dataToSave.daily_sequence = maxSeq + 1;
        
        await api.post('/vehicles', dataToSave);
      }
      
      if (vehicleId) {
        onSaved();
      } else {
        setFormData(emptyVehicle);
        alert('Veículo cadastrado com sucesso!');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#15151A] rounded-xl border border-white/10 p-6 shadow-sm text-white font-sans max-w-4xl mx-auto">
      {previewAtt && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
          <div className="flex justify-end w-full max-w-4xl mb-4">
            <button onClick={() => setPreviewAtt(null)} className="text-white bg-white/10 hover:bg-white/20 p-2 rounded-full">
              Fechar
            </button>
          </div>
          <img src={previewAtt.url} alt={previewAtt.name} className="max-w-full max-h-[80vh] object-contain rounded" />
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
        <h2 className="text-sm font-bold text-white/80 uppercase tracking-widest">{vehicleId ? 'Editar Veículo' : 'Novo Veículo'}</h2>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Placa
            <input required className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm uppercase focus:outline-none focus:border-blue-500 text-white font-normal font-mono" value={formData.plate || ''} onChange={e => setFormData({...formData, plate: e.target.value.toUpperCase()})} />
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Motorista
            <input className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" value={formData.driver || ''} onChange={e => setFormData({...formData, driver: e.target.value})} />
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Telefone Motorista
            <input type="tel" className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" value={formData.driver_phone || ''} onChange={e => setFormData({...formData, driver_phone: e.target.value})} />
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Transportadora
            <input className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" value={formData.transporter || ''} onChange={e => setFormData({...formData, transporter: e.target.value})} />
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Fornecedor
            <input className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" value={formData.supplier || ''} onChange={e => setFormData({...formData, supplier: e.target.value})} />
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Número da Nota Fiscal
            <input className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" value={formData.invoice_number || ''} onChange={e => setFormData({...formData, invoice_number: e.target.value})} />
          </label>
        </div>

        <hr className="border-white/10" />

        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Itens da Carga</h3>
            <button type="button" onClick={handleAddItem} className="bg-white/5 border border-white/10 text-white text-[10px] font-bold py-1.5 px-3 rounded hover:bg-white/10 transition-colors uppercase tracking-widest">+ Adicionar Item</button>
          </div>
          <div className="flex flex-col gap-3">
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
                        handleItemChange(index, 'code', code);
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold md:col-span-2">
            Responsável / Empilhador
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
                <input type="file" multiple onChange={handleFileUpload} disabled={uploading} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none w-full file:mr-4 file:py-1 file:px-2 file:rounded file:border file:border-white/10 file:text-[10px] file:uppercase file:tracking-widest file:font-bold file:bg-white/5 file:text-white hover:file:bg-white/10 text-white/60 disabled:opacity-50" />
              </label>
              <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
                Tirar foto pelo celular
                <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} disabled={uploading} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none w-full file:mr-4 file:py-1 file:px-2 file:rounded file:border file:border-white/10 file:text-[10px] file:uppercase file:tracking-widest file:font-bold file:bg-white/5 file:text-white hover:file:bg-white/10 text-white/60 disabled:opacity-50" />
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
