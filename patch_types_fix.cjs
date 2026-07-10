const fs = require('fs');
let content = fs.readFileSync('src/components/VehicleForm.tsx', 'utf8');

const target1 = `      for (const file of files) {`;
const replacement1 = `      for (const f of files) {
        const file = f as File;`;

if (content.includes(target1)) {
  content = content.replace(target1, replacement1);
  fs.writeFileSync('src/components/VehicleForm.tsx', content);
  console.log('Success Form Fix');
} else {
  console.log('Target not found Form Fix');
}

let publicContent = fs.readFileSync('src/components/PublicStatus.tsx', 'utf8');
const targetPublicLink = `<a key={idx} href="#" onClick={(e) => openAttachment(e, att as any)} className="bg-white border border-slate-200 p-3 rounded text-sm text-blue-600 hover:text-blue-700 hover:underline hover:bg-slate-50 transition-colors flex items-center justify-between font-medium">`;
const replacementPublicLink = `<a key={idx} href={att.url} onClick={(e) => { e.preventDefault(); window.open(att.url, '_blank'); }} className="bg-white border border-slate-200 p-3 rounded text-sm text-blue-600 hover:text-blue-700 hover:underline hover:bg-slate-50 transition-colors flex items-center justify-between font-medium">`;

if (publicContent.includes(targetPublicLink)) {
  publicContent = publicContent.replace(targetPublicLink, replacementPublicLink);
  fs.writeFileSync('src/components/PublicStatus.tsx', publicContent);
  console.log('Success Public Fix 1');
} else {
  console.log('Target not found Public Fix 1');
}
