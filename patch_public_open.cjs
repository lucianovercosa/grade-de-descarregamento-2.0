const fs = require('fs');
let content = fs.readFileSync('src/components/PublicStatus.tsx', 'utf8');

const targetHelper = `  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Buscando...</div>;`;
const replacementHelper = `  const openAttachment = (e: React.MouseEvent, att: {url: string, type?: string}) => {
    e.preventDefault();
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
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Buscando...</div>;`;

if (content.includes(targetHelper) && !content.includes('openAttachment')) {
  content = content.replace(targetHelper, replacementHelper);
}

const targetLink = `<a key={idx} href={att.url} onClick={(e) => { e.preventDefault(); window.open(att.url, '_blank'); }} className="bg-white border border-slate-200 p-3 rounded text-sm text-blue-600 hover:text-blue-700 hover:underline hover:bg-slate-50 transition-colors flex items-center justify-between font-medium">`;
const replacementLink = `<a key={idx} href="#" onClick={(e) => openAttachment(e, att as any)} className="bg-white border border-slate-200 p-3 rounded text-sm text-blue-600 hover:text-blue-700 hover:underline hover:bg-slate-50 transition-colors flex items-center justify-between font-medium">`;

if (content.includes(targetLink)) {
  content = content.replace(targetLink, replacementLink);
}

fs.writeFileSync('src/components/PublicStatus.tsx', content);
console.log('Success Public Helper');
