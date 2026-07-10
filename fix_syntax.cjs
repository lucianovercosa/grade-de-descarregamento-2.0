const fs = require('fs');

function fixDash() {
  let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
  // Fix the useEffect
  const badUseEffect = `    return (
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
      )}) => clearInterval(timer);`;
  content = content.replace(badUseEffect, `    return () => clearInterval(timer);`);
  
  const targetReturn = `  return (
    <div className="flex flex-col gap-6 relative">`;
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
  
  if (content.includes(targetReturn) && !content.includes('previewAtt &&')) {
     content = content.replace(targetReturn, targetReturn + modalUI);
  }
  fs.writeFileSync('src/components/Dashboard.tsx', content);
}

function fixForm() {
  let content = fs.readFileSync('src/components/VehicleForm.tsx', 'utf8');
  const badReturn = `    return (
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
      <div className="bg-[#15151A] rounded-xl border border-white/10 p-6 max-w-sm shadow-sm text-white font-sans text-center">`;
  
  content = content.replace(badReturn, `    return (
      <div className="bg-[#15151A] rounded-xl border border-white/10 p-6 max-w-sm shadow-sm text-white font-sans text-center">`);
      
  const targetReturn = `  return (
    <div className="bg-[#15151A] rounded-xl border border-white/10 p-6 shadow-sm font-sans text-white w-full max-w-4xl">`;
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
  
  if (content.includes(targetReturn) && !content.includes('previewAtt &&')) {
     content = content.replace(targetReturn, targetReturn + modalUI);
  }
  fs.writeFileSync('src/components/VehicleForm.tsx', content);
}

function fixPublic() {
  let content = fs.readFileSync('src/components/PublicStatus.tsx', 'utf8');
  const badReturn = `    return (
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
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">`;
  
  content = content.replace(badReturn, `    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">`);
      
  const targetReturn = `  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-800">`;
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
  if (content.includes(targetReturn) && !content.includes('previewAtt &&')) {
     content = content.replace(targetReturn, targetReturn + modalUI);
  }
  fs.writeFileSync('src/components/PublicStatus.tsx', content);
}

fixDash();
fixForm();
fixPublic();
console.log('Fixed');
