const fs = require('fs');
let content = fs.readFileSync('src/components/PublicStatus.tsx', 'utf8');

const target = `        </div>
        
        <p className="text-xs text-center text-slate-400 mt-4">Atualizado em: {new Date(vehicle.updated_at).toLocaleString('pt-BR')}</p>`;
const replacement = `        </div>

        {vehicle.attachments && vehicle.attachments.length > 0 && (
          <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest">Anexos</h3>
            <div className="flex flex-col gap-2">
              {vehicle.attachments.map((att, idx) => (
                <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="bg-white border border-slate-200 p-3 rounded text-sm text-blue-600 hover:text-blue-700 hover:underline hover:bg-slate-50 transition-colors flex items-center justify-between font-medium">
                  <span className="truncate">{att.name}</span>
                  <span className="shrink-0 text-slate-400 text-xs uppercase tracking-widest ml-2">Visualizar</span>
                </a>
              ))}
            </div>
          </div>
        )}
        
        <p className="text-xs text-center text-slate-400 mt-4">Atualizado em: {new Date(vehicle.updated_at).toLocaleString('pt-BR')}</p>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/PublicStatus.tsx', content);
  console.log('Success Public');
} else {
  console.log('Target not found Public');
}
