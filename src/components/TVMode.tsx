import React, { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Vehicle } from '../types';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Truck, BellRing } from 'lucide-react';
import { differenceInMinutes, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Logo } from './Logo';
import { playNotificationSound, speakNotification } from '../audio';

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

export function TVMode({ onBack }: { onBack?: () => void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [alertText, setAlertText] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const prevStatuses = useRef<Record<string, string>>({});

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'vehicles'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
      const filtered = data.filter(v => v.progress_status !== 'RECEBIDO');
      
      let hasStatusChange = false;
      let lastChangedVehicle: Vehicle | null = null;
      filtered.forEach(v => {
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

      setVehicles(filtered);
    }, (error) => {
      console.log('TVMode listener error:', error);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E0E0E0] p-8 font-sans overflow-y-auto relative">
      {alertText && (
        <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-yellow-500/20 border-2 border-yellow-400 text-yellow-400 font-bold px-8 py-5 rounded-2xl shadow-[0_0_30px_rgba(250,204,21,0.4)] flex items-center gap-4 max-w-[90vw] text-left">
            <BellRing size={32} className="animate-bounce shrink-0" />
            <span className="text-xl md:text-3xl tracking-wide">{alertText}</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
        <div>
          <Logo />
        </div>
        <div className="flex items-center gap-6 text-xl font-bold text-white/80">
          <span className="font-mono uppercase tracking-wider">{format(currentTime, "dd 'DE' MMMM 'DE' yyyy ' - ' eeee ' - ' HH:mm:ss", { locale: ptBR }).toUpperCase()}</span>
          <div className="flex gap-2">
            {onBack && (
              <button onClick={onBack} className="text-[10px] bg-white/5 border border-white/10 px-3 py-1 rounded hover:bg-white/10 uppercase tracking-widest transition-colors">Voltar</button>
            )}
            <button onClick={() => signOut(auth)} className="text-[10px] bg-white/5 border border-white/10 px-3 py-1 rounded hover:bg-white/10 uppercase tracking-widest transition-colors">Sair</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {vehicles.map(v => {
            const badgeColor = 
              v.progress_status === 'TRIAGEM' ? 'text-orange-400' :
              v.progress_status === 'SEM ESPAÇO' ? 'text-red-400' :
              v.progress_status === 'VEÍCULO RETORNOU' ? 'text-yellow-400' :
              v.progress_status === 'EM ANALISE' ? 'text-blue-400' :
              v.progress_status === 'AGUARDO DESCARGA' ? 'text-cyan-400' :
              v.progress_status === 'EM DESCARREGO' ? 'text-blue-400' :
              'text-green-400';

            const glowEffect = 
              v.progress_status === 'TRIAGEM' ? 'shadow-[0_0_20px_rgba(249,115,22,0.25)] border-orange-500/30' :
              v.progress_status === 'SEM ESPAÇO' ? 'shadow-[0_0_20px_rgba(239,68,68,0.25)] border-red-500/30' :
              v.progress_status === 'VEÍCULO RETORNOU' ? 'shadow-[0_0_20px_rgba(234,179,8,0.25)] border-yellow-500/30' :
              v.progress_status === 'EM ANALISE' ? 'shadow-[0_0_20px_rgba(59,130,246,0.25)] border-blue-500/30' :
              v.progress_status === 'AGUARDO DESCARGA' ? 'shadow-[0_0_20px_rgba(6,182,212,0.25)] border-cyan-500/30' :
              v.progress_status === 'EM DESCARREGO' ? 'shadow-[0_0_20px_rgba(96,165,250,0.25)] border-blue-400/30' :
              'shadow-[0_0_20px_rgba(34,197,94,0.25)] border-green-500/30';

            const barColor = 
              v.progress_status === 'TRIAGEM' ? 'bg-orange-500' :
              v.progress_status === 'SEM ESPAÇO' ? 'bg-red-500' :
              v.progress_status === 'VEÍCULO RETORNOU' ? 'bg-yellow-500' :
              v.progress_status === 'EM ANALISE' ? 'bg-blue-500' :
              v.progress_status === 'AGUARDO DESCARGA' ? 'bg-cyan-500' :
              v.progress_status === 'EM DESCARREGO' ? 'bg-blue-400' :
              'bg-green-500';

            const effectiveAnalysisStart = v.analysis_started_at || v.analysis_finished_at || v.unload_started_at || (v.progress_status === 'RECEBIDO' ? v.finished_at : undefined);
            const waitTime = v.started_at ? formatDuration(v.started_at, effectiveAnalysisStart) : '-';
            
            const effectiveAnalysisEnd = v.analysis_finished_at || v.unload_started_at || (v.progress_status === 'RECEBIDO' ? v.finished_at : undefined);
            const analysisTime = v.analysis_started_at ? formatDuration(v.analysis_started_at, effectiveAnalysisEnd) : '-';
            
            const effectiveUnloadEnd = v.progress_status === 'RECEBIDO' ? v.finished_at : undefined;
            const unloadTime = v.unload_started_at ? formatDuration(v.unload_started_at, effectiveUnloadEnd) : '-';
            
            const totalTime = v.started_at ? formatDuration(v.started_at, effectiveUnloadEnd) : '-';

          return (
            <div key={v.id} className={`bg-[#15151A] border ${glowEffect} p-6 rounded-xl relative overflow-hidden flex flex-col gap-2 transition-all`}>
              <div className={`absolute top-0 left-0 w-2 h-full ${barColor}`}></div>
              <div className="ml-2">
                <div className="text-[12px] text-[#39FF14] drop-shadow-[0_0_8px_rgba(57,255,20,0.8)] uppercase tracking-widest font-bold mb-2">{v.daily_sequence}º CARRO</div>
                <div className="text-4xl font-mono text-blue-400 font-bold mb-3">{v.plate}</div>
                <div className="text-sm flex flex-col gap-1.5 mb-4">
                  <div className="flex items-baseline gap-1"><span className="text-white/40 shrink-0 w-[110px]">Motorista:</span> <span className="font-bold text-white break-words" title={v.driver || 'Não informado'}>{v.driver || 'Não informado'}</span></div>
                  <div className="flex items-baseline gap-1"><span className="text-white/40 shrink-0 w-[110px]">Transp.:</span> <span className="font-bold text-white break-words" title={v.transporter || '-'}>{v.transporter || '-'}</span></div>
                  <div className="flex items-baseline gap-1"><span className="text-white/40 shrink-0 w-[110px]">Fornecedor:</span> <span className="font-bold text-white break-words" title={v.supplier || '-'}>{v.supplier || '-'}</span></div>
                  <div className="flex items-baseline gap-1"><span className="text-white/40 shrink-0 w-[110px]">Resp. Descarreg.:</span> <span className="font-bold text-white break-words" title={v.forklift_name || 'Nenhum'}>{v.forklift_name || 'Nenhum'}</span></div>
                </div>
                
                <div className="bg-black/40 border border-white/10 rounded-lg p-4">
                  <div className="flex justify-between text-xs font-bold mb-3 uppercase tracking-wider">
                    <span className={badgeColor}>{v.progress_status}</span>
                    <span className="text-white/80 font-mono">{v.progress_percent}%</span>
                  </div>
                  <div className="relative pt-6">
                    <div 
                      className="absolute top-0 -ml-3 transition-all duration-1000 z-10" 
                      style={{ left: `${v.progress_percent}%` }}
                    >
                      <Truck size={24} className={`${badgeColor} animate-pulse`} />
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden w-full">
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
                </div>

                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="bg-white/5 border border-white/10 p-2 rounded flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] sm:text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">Espera</span>
                    <span className="text-[10px] sm:text-xs font-mono text-white whitespace-nowrap">{waitTime}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-2 rounded flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] sm:text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">Análise</span>
                    <span className="text-[10px] sm:text-xs font-mono text-white whitespace-nowrap">{analysisTime}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-2 rounded flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] sm:text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">Descarga</span>
                    <span className="text-[10px] sm:text-xs font-mono text-white whitespace-nowrap">{unloadTime}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-2 rounded flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] sm:text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">Total ASA</span>
                    <span className="text-[10px] sm:text-xs font-mono text-white whitespace-nowrap">{totalTime}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-white/40 uppercase tracking-widest font-bold">Entrada</span>
                    <span className="font-mono text-white/80 text-[10px]">{v.started_at ? format(parseISO(v.started_at), 'HH:mm') : '-'}</span>
                  </div>
                  {v.finished_at && (
                    <div className="flex flex-col text-right">
                      <span className="text-[8px] text-white/40 uppercase tracking-widest font-bold">Término</span>
                      <span className="font-mono text-[#39FF14] text-[10px] drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]">{format(parseISO(v.finished_at), 'HH:mm')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {vehicles.length === 0 && (
        <div className="text-center text-white/40 mt-32 text-sm uppercase tracking-widest font-bold">Nenhum veículo em andamento.</div>
      )}
    </div>
  );
}
