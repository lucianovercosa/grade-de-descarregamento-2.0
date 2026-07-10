const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const target1 = `{v.attachments && v.attachments.length > 0 && !isSimple && (
          <div className="mt-2">
            <details className="group">
              <summary className="text-[10px] text-white/40 uppercase tracking-widest font-bold cursor-pointer list-none flex items-center justify-between bg-white/5 p-2 rounded hover:bg-white/10 transition-colors">
                <span>Anexos ({v.attachments.length})</span>
                <span className="transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="bg-black/20 border border-white/5 rounded-md p-2 max-h-32 overflow-y-auto flex flex-col gap-2 mt-2">
                {v.attachments.map((att, idx) => (
                  <a key={idx} href="#" onClick={(e) => openAttachment(e, att as any)} className="text-xs flex items-baseline gap-2 hover:bg-white/5 p-1 rounded transition-colors group/link">
                    <span className="text-blue-400 group-hover/link:text-blue-300 font-bold shrink-0 truncate hover:underline">{att.name}</span>
                  </a>
                ))}
              </div>
            </details>
          </div>
        )}`;

const replacement1 = `{v.attachments && v.attachments.length > 0 && (
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
        )}`;

if (content.includes(target1)) {
  content = content.replace(target1, replacement1);
  fs.writeFileSync('src/components/Dashboard.tsx', content);
  console.log('Success Dash Visible');
} else {
  console.log('Target not found Dash Visible');
}
