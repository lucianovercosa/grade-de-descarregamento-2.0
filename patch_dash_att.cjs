const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const targetFunc = `  const renderCard = (v: Vehicle, isSimple: boolean = false) => {`;
const replacementFunc = `  const openAttachment = (e: React.MouseEvent, att: {url: string, type?: string}) => {
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

  const renderCard = (v: Vehicle, isSimple: boolean = false) => {`;

if (content.includes(targetFunc) && !content.includes('openAttachment')) {
  content = content.replace(targetFunc, replacementFunc);
}

const targetLink = `<a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="text-xs flex items-baseline gap-2 hover:bg-white/5 p-1 rounded transition-colors group/link">`;
const replacementLink = `<a key={idx} href="#" onClick={(e) => openAttachment(e, att as any)} className="text-xs flex items-baseline gap-2 hover:bg-white/5 p-1 rounded transition-colors group/link">`;

if (content.includes(targetLink)) {
  content = content.replace(targetLink, replacementLink);
  fs.writeFileSync('src/components/Dashboard.tsx', content);
  console.log('Success Dash Upload');
} else {
  console.log('Target not found Dash Upload Link');
}
