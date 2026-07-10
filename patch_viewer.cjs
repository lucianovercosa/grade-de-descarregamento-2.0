const fs = require('fs');

function injectViewer(filePath, isPublic) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Inject state for modal
  const stateTarget = isPublic ? `const [loading, setLoading] = useState(true);` : `const [alertVehicle, setAlertVehicle] = useState<Vehicle | null>(null);`;
  const stateReplacement = stateTarget + `\n  const [previewAtt, setPreviewAtt] = useState<{name: string, url: string, type: string} | null>(null);`;
  
  if (content.includes(stateTarget) && !content.includes('setPreviewAtt')) {
    content = content.replace(stateTarget, stateReplacement);
  }

  // Update openAttachment
  const openAttRegex = /const openAttachment = \(e: React\.MouseEvent, att: \{url: string, type\?: string\}\) => \{[\s\S]*?\n  \};/;
  const openAttFormRegex = /const openAttachment = \(e: React\.MouseEvent, att: \{url: string, type: string\}\) => \{[\s\S]*?\n  \};/;
  
  const replacementOpen = `const openAttachment = (e: React.MouseEvent, att: {name?: string, url: string, type?: string}) => {
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
  };`;

  if (content.match(openAttRegex)) {
    content = content.replace(openAttRegex, replacementOpen);
  } else if (content.match(openAttFormRegex)) {
    content = content.replace(openAttFormRegex, replacementOpen);
  }

  // Inject modal UI
  const returnTarget = isPublic 
    ? `  return (\n    <div className="min-h-screen bg-slate-900 font-sans text-slate-800">`
    : (filePath.includes('Dashboard') 
        ? `  return (\n    <div className="min-h-screen bg-[#0A0A0C] font-sans text-white">`
        : `  return (\n    <div className="bg-[#15151A] rounded-xl border border-white/10 p-6 shadow-sm font-sans text-white w-full max-w-4xl">`);

  const modalUI = `
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
      )}`;

  if (content.includes(returnTarget) && !content.includes('previewAtt &&')) {
    content = content.replace(returnTarget, returnTarget + modalUI);
  } else if (!content.includes('previewAtt &&')) {
     // fallback if return target is slightly different
     const fallbackTarget = `return (`;
     content = content.replace(fallbackTarget, fallbackTarget + modalUI);
  }

  fs.writeFileSync(filePath, content);
}

injectViewer('src/components/Dashboard.tsx', false);
injectViewer('src/components/VehicleForm.tsx', false);
injectViewer('src/components/PublicStatus.tsx', true);

console.log('Success Viewer');
