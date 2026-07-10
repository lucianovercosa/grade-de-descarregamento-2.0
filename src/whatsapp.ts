import html2canvas from 'html2canvas';
import { Vehicle } from './types';

export const handleWhatsAppShare = async (v: Vehicle, phone?: string) => {
  const text = `*Alerta de Operação MRO*\nPlaca: ${v.plate}\nStatus Atual: ${v.progress_status}\nMotorista: ${v.driver || '-'}\nTransportador: ${v.transporter || '-'}\nFornecedor: ${v.supplier || '-'}\nResp. Descarreg.: ${v.forklift_name || 'Nenhum'}\n${v.progress_status === 'TRIAGEM' ? '\n*(Novo Cadastro)*' : ''}`;
  
  const phoneClean = phone ? phone.replace(/\D/g, '') : '';
  const url = `https://wa.me/${phoneClean}?text=${encodeURIComponent(text)}`;

  // Determine if we can use the Share API
  let canShare = false;
  if (navigator.canShare) {
    const testFile = new File([''], 'test.png', { type: 'image/png' });
    if (navigator.canShare({ files: [testFile] })) {
      canShare = true;
    }
  }

  // Open popup immediately so it's not blocked by popup blockers
  let popup: Window | null = null;
  if (!canShare) {
    popup = window.open('', '_blank');
    if (popup) {
      popup.document.write('<html style="background:#0f172a;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><body><h2>Aguarde, gerando imagem para o WhatsApp...</h2></body></html>');
    }
  }

  // Create a temporary container for the card
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.backgroundColor = '#0f172a';
  container.style.padding = '20px';
  
  let progressColor = '#64748b'; // slate-500
  let badgeBg = 'rgba(100, 116, 139, 0.2)';
  let badgeText = '#94a3b8'; // slate-400
  
  if (v.progress_status === 'TRIAGEM') {
    progressColor = '#f97316';
    badgeBg = 'rgba(249, 115, 22, 0.2)';
    badgeText = '#fb923c';
  } else if (v.progress_status === 'SEM ESPAÇO') {
    progressColor = '#ef4444';
    badgeBg = 'rgba(239, 68, 68, 0.2)';
    badgeText = '#f87171';
  } else if (v.progress_status === 'VEÍCULO RETORNOU') {
    progressColor = '#eab308';
    badgeBg = 'rgba(234, 179, 8, 0.2)';
    badgeText = '#facc15';
  } else if (v.progress_status === 'AGUARDANDO DESCARGA') {
    progressColor = '#3b82f6';
    badgeBg = 'rgba(59, 130, 246, 0.2)';
    badgeText = '#60a5fa';
  } else if (v.progress_status === 'EM DESCARGA') {
    progressColor = '#a855f7';
    badgeBg = 'rgba(168, 85, 247, 0.2)';
    badgeText = '#c084fc';
  } else if (v.progress_status === 'DESCARREGADO') {
    progressColor = '#22c55e';
    badgeBg = 'rgba(34, 197, 94, 0.2)';
    badgeText = '#4ade80';
  }
  
  container.innerHTML = `
    <div style="width: 320px; font-family: sans-serif; background-color: #15151A; border-radius: 12px; border-left: 4px solid ${progressColor}; border-top: 1px solid rgba(255,255,255,0.1); border-right: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1); padding: 20px; display: flex; flex-direction: column; gap: 8px; color: white;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 12px; color: #39FF14; text-transform: uppercase; letter-spacing: 0.1em; font-weight: bold; margin-bottom: 4px;">${v.daily_sequence}º CARRO</div>
          <div style="font-size: 24px; font-family: monospace; color: #60a5fa; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${v.plate}</div>
          <div style="font-size: 12px; display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">
            <div style="display: flex; align-items: baseline; gap: 4px;"><span style="color: rgba(255,255,255,0.4); width: 110px; flex-shrink: 0; display: inline-block;">Motorista:</span> <span style="font-weight: bold;">${v.driver || 'Não informado'}</span></div>
            <div style="display: flex; align-items: baseline; gap: 4px;"><span style="color: rgba(255,255,255,0.4); width: 110px; flex-shrink: 0; display: inline-block;">Transportador:</span> <span style="font-weight: bold;">${v.transporter || '-'}</span></div>
            <div style="display: flex; align-items: baseline; gap: 4px;"><span style="color: rgba(255,255,255,0.4); width: 110px; flex-shrink: 0; display: inline-block;">Fornecedor:</span> <span style="font-weight: bold;">${v.supplier || '-'}</span></div>
            <div style="display: flex; align-items: baseline; gap: 4px;"><span style="color: rgba(255,255,255,0.4); width: 110px; flex-shrink: 0; display: inline-block;">Resp. Descarreg.:</span> <span style="font-weight: bold;">${v.forklift_name || 'Nenhum'}</span></div>
          </div>
        </div>
        <div style="text-align: right; margin-top: 4px;">
          <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background-color: ${badgeBg}; color: ${badgeText}; border: 1px solid rgba(255,255,255,0.1);">
            ${v.progress_status}
          </span>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      backgroundColor: '#0f172a',
      scale: 2,
    });
    
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      const file = new File([blob], 'alerta-mro.png', { type: 'image/png' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Alerta de Operação MRO',
            text: text,
            files: [file]
          });
          document.body.removeChild(container);
          if (popup) popup.close();
          return;
        } catch (e) {
          console.log('Error sharing:', e);
        }
      }
      
      // Fallback: Copy to clipboard and open whatsapp
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);
        // Don't alert so we don't block the popup flow
      } catch (e) {
        console.error('Could not copy image: ', e);
      }
      
      if (popup) {
        popup.location.href = url;
      } else {
        window.open(url, '_blank');
      }
      document.body.removeChild(container);
    }, 'image/png');
  } catch (err) {
    console.error('Error generating canvas:', err);
    document.body.removeChild(container);
    if (popup) {
      popup.location.href = url;
    } else {
      window.open(url, '_blank');
    }
  }
};
