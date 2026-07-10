const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const target = `              <div className="bg-black/20 border border-white/5 rounded-md p-2 max-h-32 overflow-y-auto flex flex-col gap-2 mt-2">
                {v.items.map((item, idx) => (
                  <div key={idx} className="bg-white/5 p-2 rounded text-xs flex flex-col gap-1">
                    <div className="text-white/80 font-bold">{item.code || '-'}</div>
                    <div className="text-white/60 truncate">{item.description || '-'}</div>
                  </div>
                ))}
              </div>`;

const replacement = `              <div className="bg-black/20 border border-white/5 rounded-md p-2 max-h-32 overflow-y-auto flex flex-col gap-2 mt-2">
                {v.items.map((item, idx) => (
                  <div key={idx} className="text-xs flex items-baseline gap-2">
                    <span className="text-white/80 font-bold shrink-0">{item.code || '-'}</span>
                    <span className="text-white/40 shrink-0">-</span>
                    <span className="text-white/60 truncate" title={item.description || '-'}>{item.description || '-'}</span>
                  </div>
                ))}
              </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/Dashboard.tsx', content);
  console.log('Success Dash');
} else {
  console.log('Target not found Dash');
}
