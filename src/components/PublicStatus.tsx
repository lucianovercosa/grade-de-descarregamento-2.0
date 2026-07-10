import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Vehicle } from '../types';
import { Truck } from 'lucide-react';

export function PublicStatus({ token }: { token: string }) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewAtt, setPreviewAtt] = useState<{name: string, url: string, type: string} | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'vehicles'), where('public_token', '==', token));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setVehicle({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Vehicle);
      } else {
        setVehicle(null);
      }
      setLoading(false);
    }, (error) => {
      console.log('Public status listener error:', error);
      setLoading(false);
    });
    return unsubscribe;
  }, [token]);

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

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Buscando...</div>;

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <h1 className="text-2xl font-bold mb-4">Status Não Encontrado</h1>
        <p className="text-slate-400">Verifique o link informado.</p>
        <button onClick={() => window.location.href = '/'} className="mt-6 px-4 py-2 bg-slate-800 rounded">Início</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(17, 94, 89, 0.84))' }}>
      <div className="w-full max-w-md bg-white text-slate-900 rounded-lg shadow-xl p-8 border-l-8 border-teal-600">
        <h1 className="text-3xl font-black text-teal-800 mb-1">{vehicle.daily_sequence}º CARRO</h1>
        <div className="text-2xl font-bold mb-4">{vehicle.plate}</div>
        
        <div className="flex items-baseline gap-1 text-sm mb-2"><strong className="shrink-0 text-slate-600 w-[130px] inline-block">Motorista:</strong> <span className="text-red-600 font-black break-words" title={vehicle.driver || 'Não informado'}>{vehicle.driver || 'Não informado'}</span></div>
        <div className="flex items-baseline gap-1 text-sm text-slate-600 mb-1"><strong className="shrink-0 w-[130px] inline-block">Fornecedor:</strong> <span className="break-words" title={vehicle.supplier || '-'}>{vehicle.supplier || '-'}</span></div>
        <div className="flex items-baseline gap-1 text-sm text-slate-600 mb-1"><strong className="shrink-0 w-[130px] inline-block">Resp. Descarreg.:</strong> <span className="break-words" title={vehicle.forklift_name || 'Nenhum'}>{vehicle.forklift_name || 'Nenhum'}</span></div>
        <div className="flex items-baseline gap-1 text-sm text-slate-600 mb-6"><strong className="shrink-0 w-[130px] inline-block">Nota fiscal:</strong> <span className="break-words" title={vehicle.invoice_number || '-'}>{vehicle.invoice_number || '-'}</span></div>

        {/* Progress Bar */}
        <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex justify-between text-sm font-bold mb-2">
            <span className={`
              ${vehicle.progress_status === 'TRIAGEM' ? 'text-orange-600' :
                vehicle.progress_status === 'SEM ESPAÇO' ? 'text-red-600' :
                vehicle.progress_status === 'VEÍCULO RETORNOU' ? 'text-yellow-600' :
                vehicle.progress_status === 'EM ANALISE' ? 'text-blue-600' :
                vehicle.progress_status === 'AGUARDO DESCARGA' ? 'text-cyan-600' :
                vehicle.progress_status === 'EM DESCARREGO' ? 'text-blue-500' :
                'text-green-600'}
            `}>{vehicle.progress_status}</span>
            <span className="text-slate-600">{vehicle.progress_percent}%</span>
          </div>
          
          <div className="relative pt-6">
            <div 
              className="absolute top-0 -ml-3 transition-all duration-1000 z-10" 
              style={{ left: `${vehicle.progress_percent}%` }}
            >
              <Truck size={24} className={`animate-pulse ${
                vehicle.progress_status === 'TRIAGEM' ? 'text-orange-500' :
                vehicle.progress_status === 'SEM ESPAÇO' ? 'text-red-500' :
                vehicle.progress_status === 'VEÍCULO RETORNOU' ? 'text-yellow-500' :
                vehicle.progress_status === 'EM ANALISE' ? 'text-blue-500' :
                vehicle.progress_status === 'AGUARDO DESCARGA' ? 'text-cyan-500' :
                vehicle.progress_status === 'EM DESCARREGO' ? 'text-blue-400' :
                'text-green-500'
              }`} />
            </div>
            <div className="h-4 bg-slate-200 rounded-full overflow-hidden w-full">
              <div 
                className={`h-full transition-all duration-1000 ${
                  vehicle.progress_status === 'TRIAGEM' ? 'bg-orange-500' :
                  vehicle.progress_status === 'SEM ESPAÇO' ? 'bg-red-500' :
                  vehicle.progress_status === 'VEÍCULO RETORNOU' ? 'bg-yellow-500' :
                  vehicle.progress_status === 'EM ANALISE' ? 'bg-blue-500' :
                  vehicle.progress_status === 'AGUARDO DESCARGA' ? 'bg-cyan-500' :
                  vehicle.progress_status === 'EM DESCARREGO' ? 'bg-blue-400' :
                  'bg-green-500'
                }`} 
                style={{width: `${vehicle.progress_percent}%`}}
              ></div>
            </div>
          </div>
        </div>

        {vehicle.attachments && vehicle.attachments.length > 0 && (
          <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest">Anexos</h3>
            <div className="flex flex-col gap-2">
              {vehicle.attachments.map((att, idx) => (
                <a key={idx} href="#" onClick={(e) => openAttachment(e, att as any)} className="bg-white border border-slate-200 p-3 rounded text-sm text-blue-600 hover:text-blue-700 hover:underline hover:bg-slate-50 transition-colors flex items-center justify-between font-medium">
                  <span className="truncate">{att.name}</span>
                  <span className="shrink-0 text-slate-400 text-xs uppercase tracking-widest ml-2">Visualizar</span>
                </a>
              ))}
            </div>
          </div>
        )}
        
        <p className="text-xs text-center text-slate-400 mt-4">Atualizado em: {new Date(vehicle.updated_at).toLocaleString('pt-BR')}</p>
        
        <div className="mt-8 text-center border-t border-slate-200 pt-6">
          <button onClick={() => window.location.href = '/'} className="text-xs font-bold text-slate-500 hover:text-slate-800">
            Ir para página principal
          </button>
        </div>
      </div>
    </div>
  );
}
