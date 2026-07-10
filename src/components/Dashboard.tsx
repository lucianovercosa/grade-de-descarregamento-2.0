import React, { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Vehicle, PROGRESS_OPTIONS, PROGRESS_PERCENT } from '../types';
import { useAuth } from '../AuthContext';
import { differenceInMinutes, parseISO, format } from 'date-fns';
import QRCode from 'react-qr-code';
import { Truck, BellRing } from 'lucide-react';
import { playNotificationSound, speakNotification } from '../audio';
import * as XLSX from 'xlsx';


interface DashboardProps {
  onEditVehicle: (id: string | null) => void;
}

function formatDuration(startStr?: string, endStr?: string) {
  if (!startStr) return '-';
  const start = parseISO(startStr);
  const end = endStr ? parseISO(endStr) : new Date();
  
  if (isNaN(start.getTime())) return '-';
  
  const diffMins = differenceInMinutes(end, start);
  if (diffMins < 0) return '-';
  
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  
  if (hours > 0) return `${hours}h ${mins.toString().padStart(2, '0')}min`;
  return `${mins}min`;
}

export function Dashboard({ onEditVehicle }: DashboardProps) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [view, setView] = useState<'cards' | 'simple' | 'list'>('cards');
  const [filterText, setFilterText] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [alertText, setAlertText] = useState<string | null>(null);
  const [whatsappContacts, setWhatsappContacts] = useState<{name: string, phone: string}[]>([]);
  
  const [previewAtt, setPreviewAtt] = useState<{name: string, url: string, type: string} | null>(null);
  const prevStatuses = useRef<Record<string, string>>({});
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubContacts = onSnapshot(doc(db, 'settings', 'whatsapp'), (docSnap) => {
      if (docSnap.exists()) {
        setWhatsappContacts(docSnap.data().contacts || []);
      }
    }, (error) => {
      console.log('Contacts listener error:', error);
    });

    const q = query(collection(db, 'vehicles'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
      
      let hasStatusChange = false;
      let lastChangedVehicle: Vehicle | null = null;
      data.forEach(v => {
        if (v.id && v.progress_status) {
          const prevStatus = prevStatuses.current[v.id];
          if (prevStatus && prevStatus !== v.progress_status) {
            hasStatusChange = true;
            lastChangedVehicle = v;
          }
          prevStatuses.current[v.id] = v.progress_status;
        }
      });

      if (hasStatusChange && lastChangedVehicle) {
        const txt = `Atenção: Carro ${(lastChangedVehicle as Vehicle).daily_sequence}, placa ${(lastChangedVehicle as Vehicle).plate}, mudou para o status ${(lastChangedVehicle as Vehicle).progress_status}.`;
        speakNotification(txt);
        setAlertText(txt);
        setTimeout(() => setAlertText(null), 8000);
      }
      
      setVehicles(data);
    }, (error) => {
      console.log('Vehicles listener error:', error);
    });
    return () => {
      unsubscribe();
      unsubContacts();
    };
  }, []);

  const availableDates = Array.from(new Set(vehicles.map(v => v.created_at ? format(parseISO(v.created_at), 'yyyy-MM-dd') : ''))).filter(Boolean).sort().reverse() as string[];

  const handleStatusChange = async (vehicleId: string, nextStatus: string) => {
    try {
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      const now = new Date().toISOString();
      const percent = PROGRESS_PERCENT[nextStatus] || 10;
      
      const updateData: any = {
        progress_status: nextStatus,
        progress_percent: percent,
        updated_at: now
      };
      
      if (nextStatus === 'EM ANALISE') {
        updateData.analysis_started_at = now;
      } else if (nextStatus === 'AGUARDO DESCARGA') {
        updateData.analysis_finished_at = now;
      } else if (nextStatus === 'EM DESCARREGO') {
        updateData.unload_started_at = now;
      } else if (nextStatus === 'RECEBIDO') {
        updateData.finished_at = now;
      }
      
      await updateDoc(vehicleRef, updateData);
      const updatedVehicle = vehicles.find(v => v.id === vehicleId);
      if (updatedVehicle) {
        
      }
    } catch (e: any) {
      alert('Erro ao atualizar: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vehicles', id));
      setConfirmDeleteId(null);
    } catch (e: any) {
      alert('Erro: ' + e.message);
    }
  };

  const baseFiltered = vehicles.filter(v => {
    if (user?.role === 'empilhador' || user?.role === 'mro') {
      if (v.forklift_user_id !== user.uid) return false;
    }
    if (selectedDates.length > 0) {
      const vDate = v.created_at ? format(parseISO(v.created_at), 'yyyy-MM-dd') : '';
      if (!selectedDates.includes(vDate)) return false;
    }
    if (filterText) {
      const search = filterText.toLowerCase();
      return (v.plate?.toLowerCase().includes(search) || v.driver?.toLowerCase().includes(search));
    }
    return true;
  });

  const filtered = baseFiltered.filter(v => {
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(v.progress_status)) {
      return false;
    }
    return true;
  });

  const activeVehicles = filtered.filter(v => v.progress_status !== 'RECEBIDO');
  const finishedVehicles = filtered.filter(v => v.progress_status === 'RECEBIDO');

  const handleExportExcel = () => {
    const dataToExport = filtered.map(v => {
      const effectiveAnalysisStart = v.analysis_started_at || v.analysis_finished_at || v.unload_started_at || (v.progress_status === 'RECEBIDO' ? v.finished_at : undefined);
      const waitTime = v.started_at ? formatDuration(v.started_at, effectiveAnalysisStart) : '-';
      
      const effectiveAnalysisEnd = v.analysis_finished_at || v.unload_started_at || (v.progress_status === 'RECEBIDO' ? v.finished_at : undefined);
      const analysisTime = v.analysis_started_at ? formatDuration(v.analysis_started_at, effectiveAnalysisEnd) : '-';
      
      const effectiveUnloadEnd = v.progress_status === 'RECEBIDO' ? v.finished_at : undefined;
      const unloadTime = v.unload_started_at ? formatDuration(v.unload_started_at, effectiveUnloadEnd) : '-';
      
      const totalTime = v.started_at ? formatDuration(v.started_at, effectiveUnloadEnd) : '-';

      return {
        'Sequência': v.daily_sequence,
        'Placa': v.plate,
        'Motorista': v.driver || '-',
        'Transportador': v.transporter || '-',
        'Fornecedor': v.supplier || '-',
        'Status': v.progress_status,
        'Entrada': v.started_at ? format(parseISO(v.started_at), 'dd/MM/yyyy HH:mm') : '-',
        'Saída': v.finished_at ? format(parseISO(v.finished_at), 'dd/MM/yyyy HH:mm') : '-',
        'Tempo Espera': waitTime,
        'Tempo Análise': analysisTime,
        'Tempo Descarga': unloadTime,
        'Tempo Total': totalTime,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Veículos");
    XLSX.writeFile(workbook, `relatorio_veiculos_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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

  const renderCard = (v: Vehicle, isSimple: boolean = false) => {
    const progressColor = 
      v.progress_status === 'TRIAGEM' ? 'border-orange-500' :
      v.progress_status === 'SEM ESPAÇO' ? 'border-red-500' :
      v.progress_status === 'VEÍCULO RETORNOU' ? 'border-yellow-500' :
      v.progress_status === 'EM ANALISE' ? 'border-blue-500' :
      v.progress_status === 'AGUARDO DESCARGA' ? 'border-cyan-500' :
      v.progress_status === 'EM DESCARREGO' ? 'border-blue-400' :
      'border-green-500';

    const glowEffect = 
      v.progress_status === 'TRIAGEM' ? 'shadow-[0_0_15px_rgba(249,115,22,0.2)] border-orange-500/30' :
      v.progress_status === 'SEM ESPAÇO' ? 'shadow-[0_0_15px_rgba(239,68,68,0.2)] border-red-500/30' :
      v.progress_status === 'VEÍCULO RETORNOU' ? 'shadow-[0_0_15px_rgba(234,179,8,0.2)] border-yellow-500/30' :
      v.progress_status === 'EM ANALISE' ? 'shadow-[0_0_15px_rgba(59,130,246,0.2)] border-blue-500/30' :
      v.progress_status === 'AGUARDO DESCARGA' ? 'shadow-[0_0_15px_rgba(6,182,212,0.2)] border-cyan-500/30' :
      v.progress_status === 'EM DESCARREGO' ? 'shadow-[0_0_15px_rgba(96,165,250,0.2)] border-blue-400/30' :
      'shadow-[0_0_15px_rgba(34,197,94,0.2)] border-green-500/30';

    const badgeColor = 
      v.progress_status === 'TRIAGEM' ? 'bg-orange-500/20 text-orange-400' :
      v.progress_status === 'SEM ESPAÇO' ? 'bg-red-500/20 text-red-400' :
      v.progress_status === 'VEÍCULO RETORNOU' ? 'bg-yellow-500/20 text-yellow-400' :
      v.progress_status === 'EM ANALISE' ? 'bg-blue-500/20 text-blue-400' :
      v.progress_status === 'AGUARDO DESCARGA' ? 'bg-cyan-500/20 text-cyan-400' :
      v.progress_status === 'EM DESCARREGO' ? 'bg-blue-500/20 text-blue-400' :
      'bg-green-500/20 text-green-400';

    const effectiveAnalysisStart = v.analysis_started_at || v.analysis_finished_at || v.unload_started_at || (v.progress_status === 'RECEBIDO' ? v.finished_at : undefined);
    const waitTime = v.started_at ? formatDuration(v.started_at, effectiveAnalysisStart) : '-';
    
    const effectiveAnalysisEnd = v.analysis_finished_at || v.unload_started_at || (v.progress_status === 'RECEBIDO' ? v.finished_at : undefined);
    const analysisTime = v.analysis_started_at ? formatDuration(v.analysis_started_at, effectiveAnalysisEnd) : '-';
    
    const effectiveUnloadEnd = v.progress_status === 'RECEBIDO' ? v.finished_at : undefined;
    const unloadTime = v.unload_started_at ? formatDuration(v.unload_started_at, effectiveUnloadEnd) : '-';
    
    const totalTime = v.started_at ? formatDuration(v.started_at, effectiveUnloadEnd) : '-';
    
    const publicUrl = `${window.location.origin}/status/${v.public_token}`;

    return (
      <div key={v.id} className={`bg-[#15151A] rounded-xl border-l-4 ${progressColor} border-y border-r ${glowEffect} p-5 flex flex-col gap-2 min-w-[300px] w-80 shrink-0 transition-all hover:bg-[#1A1A20]`}>
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-[#39FF14] drop-shadow-[0_0_8px_rgba(57,255,20,0.8)] uppercase tracking-widest font-bold mb-1">{v.daily_sequence}º CARRO</div>
            <div className="text-2xl font-mono text-blue-400 font-bold truncate">{v.plate}</div>
            <div className="text-xs flex flex-col gap-1.5 mt-2">
              <div className="flex items-baseline gap-1"><span className="text-white/40 shrink-0 w-[110px]">Motorista:</span> <span className="font-bold text-white break-words" title={v.driver || 'Não informado'}>{v.driver || 'Não informado'}</span></div>
              {!isSimple && (
                <>
                  <div className="flex items-baseline gap-1"><span className="text-white/40 shrink-0 w-[110px]">Transportador:</span> <span className="font-bold text-white break-words" title={v.transporter || '-'}>{v.transporter || '-'}</span></div>
                  <div className="flex items-baseline gap-1"><span className="text-white/40 shrink-0 w-[110px]">Fornecedor:</span> <span className="font-bold text-white break-words" title={v.supplier || '-'}>{v.supplier || '-'}</span></div>
                  <div className="flex items-baseline gap-1"><span className="text-white/40 shrink-0 w-[110px]">Resp. Descarreg.:</span> <span className="font-bold text-white break-words" title={v.forklift_name || 'Nenhum'}>{v.forklift_name || 'Nenhum'}</span></div>
                </>
              )}
            </div>
          </div>
          <div className="mt-1 shrink-0 text-right">
            <span className={`inline-block px-2 py-1 rounded text-xs font-bold text-center ${badgeColor}`}>
              {v.progress_status}
            </span>
          </div>
        </div>

        {/* Times Grid */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="bg-white/5 border border-white/10 p-2 rounded flex flex-col items-center justify-center text-center">
            <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">Espera</span>
            <span className="text-xs font-mono text-white whitespace-nowrap">{waitTime}</span>
          </div>
          <div className="bg-white/5 border border-white/10 p-2 rounded flex flex-col items-center justify-center text-center">
            <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">Análise</span>
            <span className="text-xs font-mono text-white whitespace-nowrap">{analysisTime}</span>
          </div>
          <div className="bg-white/5 border border-white/10 p-2 rounded flex flex-col items-center justify-center text-center">
            <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">Descarga</span>
            <span className="text-xs font-mono text-white whitespace-nowrap">{unloadTime}</span>
          </div>
          <div className="bg-white/5 border border-white/10 p-2 rounded flex flex-col items-center justify-center text-center">
            <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">Total ASA</span>
            <span className="text-xs font-mono text-white whitespace-nowrap">{totalTime}</span>
          </div>
        </div>

        <div className="flex justify-between items-center bg-black/20 border border-white/5 p-2 rounded mt-2">
          <div className="flex flex-col">
            <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Entrada</span>
            <span className="text-xs font-mono text-white/80">{v.started_at ? format(parseISO(v.started_at), 'HH:mm') : '-'}</span>
          </div>
          {v.finished_at && (
            <div className="flex flex-col text-right">
              <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Término</span>
              <span className="text-xs font-mono text-[#39FF14] drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]">{format(parseISO(v.finished_at), 'HH:mm')}</span>
            </div>
          )}
        </div>

        {/* Items Dropdown */}
        {v.items && v.items.length > 0 && !isSimple && (
          <div className="mt-3">
            <details className="group">
              <summary className="text-[10px] text-white/40 uppercase tracking-widest font-bold cursor-pointer list-none flex items-center justify-between bg-white/5 p-2 rounded hover:bg-white/10 transition-colors">
                <span>Itens ({v.items.length})</span>
                <span className="transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="bg-black/20 border border-white/5 rounded-md p-2 max-h-32 overflow-y-auto flex flex-col gap-2 mt-2">
                {v.items.map((item, idx) => (
                  <div key={idx} className="text-xs flex items-baseline gap-2">
                    <span className="text-white/80 font-bold shrink-0">{item.code || '-'}</span>
                    <span className="text-white/40 shrink-0">-</span>
                    <span className="text-white/60 truncate" title={item.description || '-'}>{item.description || '-'}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Attachments Dropdown */}
        {v.attachments && v.attachments.length > 0 && (
          <div className="mt-2 bg-white/5 p-2 rounded">
            <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Anexos ({v.attachments.length})</div>
            <div className="flex flex-col gap-2">
              {v.attachments.map((att, idx) => (
                <a key={idx} href="#" onClick={(e) => openAttachment(e, att as any)} className="text-xs flex items-center justify-between bg-black/40 border border-white/10 p-2 rounded transition-colors hover:bg-white/10 group/link">
                  <span className="text-blue-400 group-hover/link:text-blue-300 font-bold truncate hover:underline">{att.name || 'Visualizar anexo'}</span>
                  <span className="text-[9px] uppercase tracking-widest text-white/40">Abrir</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-3">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Progresso</p>
          <div className="relative pt-6">
            <div 
              className="absolute top-0 -ml-3 transition-all duration-1000 z-10" 
              style={{ left: `${v.progress_percent}%` }}
            >
              <Truck size={20} className={`${badgeColor.split(' ')[1]} animate-pulse`} />
            </div>
            
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  v.progress_status === 'TRIAGEM' ? 'bg-orange-500' :
                  v.progress_status === 'SEM ESPAÇO' ? 'bg-red-500' :
                  v.progress_status === 'VEÍCULO RETORNOU' ? 'bg-yellow-500' :
                  v.progress_status === 'EM ANALISE' ? 'bg-blue-500' :
                  v.progress_status === 'AGUARDO DESCARGA' ? 'bg-cyan-500' :
                  v.progress_status === 'EM DESCARREGO' ? 'bg-blue-400' :
                  'bg-green-500'
                }`} 
                style={{width: `${v.progress_percent}%`}}
              ></div>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-mono">
            <span>{v.progress_percent}% Concluído</span>
          </div>
        </div>

        <div className="mt-3 bg-black/40 p-2 border border-white/10 rounded-md">
          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold flex flex-col">
            Status
            <select 
              value={v.progress_status} 
              onChange={(e) => handleStatusChange(v.id!, e.target.value)}
              className="mt-1 p-1 border border-white/10 rounded bg-black text-white text-xs"
            >
              {PROGRESS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>
        </div>
        
        {user?.role === 'admin' && (
          <div className="mt-3 p-2 bg-white/5 border border-white/10 rounded flex gap-3 items-center">
            <div className="bg-white p-1 rounded">
              <QRCode value={publicUrl} size={32} />
            </div>
            <div className="flex flex-col text-xs justify-center">
              <span className="font-bold text-white/80">Link Público</span>
              <a href={publicUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 underline truncate w-32">Acessar Monitor</a>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-3">
          
          <button onClick={() => onEditVehicle(v.id!)} className="py-2 px-4 bg-white/5 border border-white/20 text-[10px] font-bold uppercase tracking-widest rounded hover:bg-white/10 transition-colors">Editar</button>
          
          {confirmDeleteId === v.id ? (
            <div className="flex gap-2">
              <button onClick={() => setConfirmDeleteId(null)} className="py-2 px-4 bg-white/5 border border-white/20 text-[10px] font-bold uppercase tracking-widest rounded hover:bg-white/10 transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(v.id!)} className="py-2 px-4 bg-red-600 text-white border border-red-500/30 text-[10px] font-bold uppercase tracking-widest rounded hover:bg-red-700 transition-colors">Confirmar</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDeleteId(v.id!)} className="py-2 px-4 bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase tracking-widest rounded hover:bg-red-600/40 transition-colors">Excluir</button>
          )}
        </div>
      </div>
    );
  };

  const renderTable = (vehicleList: Vehicle[]) => {
    return (
      <div className="overflow-x-auto border border-white/10 rounded-xl bg-[#15151A] w-full">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#0F0F12] text-white/40 uppercase tracking-widest text-[9px]">
            <tr>
              <th className="px-4 py-3 font-bold">Seq</th>
              <th className="px-4 py-3 font-bold">Placa</th>
              <th className="px-4 py-3 font-bold">Motorista/Transp.</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Espera</th>
              <th className="px-4 py-3 font-bold">Análise</th>
              <th className="px-4 py-3 font-bold">Descarga</th>
              <th className="px-4 py-3 font-bold">Total ASA</th>
              <th className="px-4 py-3 font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {vehicleList.map(v => {
              const badgeColor = 
                v.progress_status === 'TRIAGEM' ? 'bg-orange-500/20 text-orange-400' :
                v.progress_status === 'SEM ESPAÇO' ? 'bg-red-500/20 text-red-400' :
                v.progress_status === 'VEÍCULO RETORNOU' ? 'bg-yellow-500/20 text-yellow-400' :
                v.progress_status === 'EM ANALISE' ? 'bg-blue-500/20 text-blue-400' :
                v.progress_status === 'AGUARDO DESCARGA' ? 'bg-cyan-500/20 text-cyan-400' :
                v.progress_status === 'EM DESCARREGO' ? 'bg-blue-500/20 text-blue-400' :
                'bg-green-500/20 text-green-400';

              const effectiveAnalysisStart = v.analysis_started_at || v.analysis_finished_at || v.unload_started_at || (v.progress_status === 'RECEBIDO' ? v.finished_at : undefined);
              const waitTime = v.started_at ? formatDuration(v.started_at, effectiveAnalysisStart) : '-';
              
              const effectiveAnalysisEnd = v.analysis_finished_at || v.unload_started_at || (v.progress_status === 'RECEBIDO' ? v.finished_at : undefined);
              const analysisTime = v.analysis_started_at ? formatDuration(v.analysis_started_at, effectiveAnalysisEnd) : '-';
              
              const effectiveUnloadEnd = v.progress_status === 'RECEBIDO' ? v.finished_at : undefined;
              const unloadTime = v.unload_started_at ? formatDuration(v.unload_started_at, effectiveUnloadEnd) : '-';
              
              const totalTime = v.started_at ? formatDuration(v.started_at, effectiveUnloadEnd) : '-';

              return (
                <tr key={v.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-white/60">{v.daily_sequence}º</td>
                  <td className="px-4 py-3 font-mono text-blue-400 font-bold">{v.plate}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-white">{v.driver || '-'}</div>
                    <div className="text-white/40 text-[9px] mt-0.5">{v.transporter || '-'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="bg-black/40 p-1 border border-white/10 rounded w-fit">
                      <select 
                        value={v.progress_status} 
                        onChange={(e) => handleStatusChange(v.id!, e.target.value)}
                        className={`bg-transparent text-[10px] font-bold uppercase tracking-widest focus:outline-none ${badgeColor.split(' ')[1]}`}
                      >
                        {PROGRESS_OPTIONS.map(opt => (
                          <option key={opt} value={opt} className="bg-black text-white">{opt}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-white/80">{waitTime}</td>
                  <td className="px-4 py-3 font-mono text-white/80">{analysisTime}</td>
                  <td className="px-4 py-3 font-mono text-white/80">{unloadTime}</td>
                  <td className="px-4 py-3 font-mono text-white/80">{totalTime}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      
                      <button onClick={() => onEditVehicle(v.id!)} className="py-1.5 px-3 bg-white/5 border border-white/20 text-[9px] font-bold uppercase tracking-widest rounded hover:bg-white/10 transition-colors">Editar</button>
                      {confirmDeleteId === v.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => setConfirmDeleteId(null)} className="py-1.5 px-3 bg-white/5 border border-white/20 text-[9px] font-bold uppercase tracking-widest rounded hover:bg-white/10 transition-colors">Cancelar</button>
                          <button onClick={() => handleDelete(v.id!)} className="py-1.5 px-3 bg-red-600 text-white border border-red-500/30 text-[9px] font-bold uppercase tracking-widest rounded hover:bg-red-700 transition-colors">Confirmar</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(v.id!)} className="py-1.5 px-3 bg-red-600/20 text-red-400 border border-red-500/30 text-[9px] font-bold uppercase tracking-widest rounded hover:bg-red-600/40 transition-colors">Excluir</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {vehicleList.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-white/40 italic text-sm">
                  Nenhum veículo encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 relative">
      {previewAtt && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-4xl flex justify-between items-center mb-4">
            <h3 className="text-white font-bold truncate">{previewAtt.name}</h3>
            <button onClick={() => setPreviewAtt(null)} className="text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded font-bold uppercase text-xs tracking-widest">Fechar</button>
          </div>
          <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
            <img src={previewAtt.url} alt="Preview" className="max-w-full max-h-full object-contain rounded" />
          </div>
        </div>
      )}

      {alertText && (
        <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-yellow-500/20 border-2 border-yellow-400 text-yellow-400 font-bold px-6 py-4 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.3)] flex items-center gap-3 max-w-[90vw] text-left">
            <BellRing size={24} className="animate-bounce shrink-0" />
            <span className="text-sm md:text-base">{alertText}</span>
          </div>
        </div>
      )}

      <header className="border-b border-white/10 bg-[#0F0F12]/50 backdrop-blur flex flex-col md:flex-row items-center justify-between p-4 gap-4 rounded-xl">
        <div>
          <h1 className="text-sm font-bold text-white/80">Monitor de Operações</h1>
          <p className="text-[10px] text-white/40 uppercase tracking-widest">Acompanhe os veículos por etapa e tempo de operação.</p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <button onClick={handleExportExcel} className="px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/30 text-xs font-bold rounded hover:bg-green-600/30 transition-colors uppercase tracking-wider flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar Excel
          </button>
          {user?.role === 'admin' && (
            <button onClick={() => onEditVehicle(null)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors uppercase tracking-wider">
              Novo Descarrego
            </button>
          )}
          <input 
            type="text" 
            placeholder="Buscar placa..." 
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="bg-black/40 border border-white/10 rounded px-3 py-1 text-xs focus:outline-none focus:border-blue-500 text-white"
          />
          <details className="relative group">
            <summary className="bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs text-white cursor-pointer list-none flex items-center gap-2 focus:outline-none focus:border-blue-500">
              <span>Datas {selectedDates.length > 0 && `(${selectedDates.length})`}</span>
              <span className="group-open:rotate-180 transition-transform text-[8px]">▼</span>
            </summary>
            <div className="absolute right-0 top-full mt-1 bg-[#15151A] border border-white/10 rounded p-2 z-50 flex flex-col gap-1 w-48 max-h-64 overflow-y-auto shadow-xl">
              {availableDates.map(date => (
                <label key={date} className="flex items-center gap-2 text-xs text-white/80 cursor-pointer p-1 hover:bg-white/5 rounded">
                  <input 
                    type="checkbox" 
                    checked={selectedDates.includes(date)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedDates(prev => [...prev, date]);
                      else setSelectedDates(prev => prev.filter(d => d !== date));
                    }}
                    className="accent-blue-500"
                  />
                  {date.split('-').reverse().join('/')}
                </label>
              ))}
              {availableDates.length === 0 && <div className="text-xs text-white/40 p-1">Nenhuma data</div>}
            </div>
          </details>
          <select value={view} onChange={(e) => setView(e.target.value as any)} className="bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 text-white">
            <option value="cards">Cards Completos</option>
            <option value="simple">Cards Simples</option>
            <option value="list">Lista</option>
          </select>
        </div>
      </header>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div 
          onClick={() => setSelectedStatuses([])}
          className={`cursor-pointer bg-[#15151A] rounded-xl border shadow-[0_0_15px_rgba(255,255,255,0.1)] border-white/20 p-4 flex flex-col items-center justify-center gap-2 transition-all hover:bg-[#1A1A20] relative overflow-hidden ${selectedStatuses.length === 0 ? 'ring-2 ring-white/50' : 'opacity-60'}`}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-white/40"></div>
          <span className="text-3xl font-bold font-mono text-white/80">{baseFiltered.length}</span>
          <span className="text-[9px] uppercase tracking-wider text-white/60 text-center font-bold">TODOS</span>
        </div>
        {PROGRESS_OPTIONS.map(status => {
          const count = baseFiltered.filter(v => v.progress_status === status).length;
          
          const cardGlow = 
            status === 'TRIAGEM' ? 'shadow-[0_0_15px_rgba(249,115,22,0.15)] border-orange-500/30' :
            status === 'SEM ESPAÇO' ? 'shadow-[0_0_15px_rgba(239,68,68,0.15)] border-red-500/30' :
            status === 'VEÍCULO RETORNOU' ? 'shadow-[0_0_15px_rgba(234,179,8,0.15)] border-yellow-500/30' :
            status === 'EM ANALISE' ? 'shadow-[0_0_15px_rgba(59,130,246,0.15)] border-blue-500/30' :
            status === 'AGUARDO DESCARGA' ? 'shadow-[0_0_15px_rgba(6,182,212,0.15)] border-cyan-500/30' :
            status === 'EM DESCARREGO' ? 'shadow-[0_0_15px_rgba(96,165,250,0.15)] border-blue-400/30' :
            'shadow-[0_0_15px_rgba(34,197,94,0.15)] border-green-500/30';
            
          const textColor = 
            status === 'TRIAGEM' ? 'text-orange-400' :
            status === 'SEM ESPAÇO' ? 'text-red-400' :
            status === 'VEÍCULO RETORNOU' ? 'text-yellow-400' :
            status === 'EM ANALISE' ? 'text-blue-400' :
            status === 'AGUARDO DESCARGA' ? 'text-cyan-400' :
            status === 'EM DESCARREGO' ? 'text-blue-400' :
            'text-green-400';
            
          const isSelected = selectedStatuses.includes(status);
            
          return (
            <div 
              key={status} 
              onClick={() => {
                setSelectedStatuses(prev => 
                  prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
                );
              }}
              className={`cursor-pointer bg-[#15151A] rounded-xl border ${cardGlow} p-4 flex flex-col items-center justify-center gap-2 transition-all hover:bg-[#1A1A20] relative overflow-hidden ${isSelected ? 'ring-2 ring-white/50' : (selectedStatuses.length > 0 ? 'opacity-40' : '')}`}
            >
              <div className={`absolute top-0 left-0 w-full h-1 ${textColor.replace('text-', 'bg-').replace('400', '500')}`}></div>
              <span className={`text-3xl font-bold font-mono ${textColor}`}>{count}</span>
              <span className="text-[9px] uppercase tracking-wider text-white/60 text-center font-bold">{status}</span>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-8">
        <section>
          <h2 className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-4">Carros em andamento ({activeVehicles.length})</h2>
          {view === 'list' ? renderTable(activeVehicles) : (
            <div className="flex gap-4 overflow-x-auto pb-4 items-stretch">
              {activeVehicles.map(v => renderCard(v, view === 'simple'))}
              {activeVehicles.length === 0 && <div className="text-white/40 italic text-sm">Nenhum veículo em andamento.</div>}
            </div>
          )}
        </section>
        
        <section className="pt-6 border-t border-white/10">
          <h2 className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-4">Carros finalizados ({finishedVehicles.length})</h2>
          {view === 'list' ? renderTable(finishedVehicles) : (
            <div className="flex gap-4 overflow-x-auto pb-4 items-stretch">
              {finishedVehicles.map(v => renderCard(v, view === 'simple'))}
              {finishedVehicles.length === 0 && <div className="text-white/40 italic text-sm">Nenhum veículo finalizado.</div>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
