const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
const target = `            <div className="text-xs flex flex-col gap-1.5 mt-2">
              <div className="flex items-baseline gap-1"><span className="text-white/40 shrink-0">Motorista:</span> <span className="font-bold text-white break-words" title={v.driver || 'Não informado'}>{v.driver || 'Não informado'}</span></div>
            </div>
          </div>
          <div className="mt-1 shrink-0 text-right">
            <span className={\`inline-block px-2 py-1 rounded text-xs font-bold text-center \${badgeColor}\`}>
              {v.progress_status}
            </span>
          </div>
        </div>

          <div className="text-xs flex flex-col gap-1.5 mt-2">
            <div className="flex items-baseline gap-1"><span className="text-white/40 shrink-0">Transportador:</span> <span className="font-bold text-white break-words" title={v.transporter || '-'}>{v.transporter || '-'}</span></div>
            <div className="flex items-baseline gap-1"><span className="text-white/40 shrink-0">Fornecedor:</span> <span className="font-bold text-white break-words" title={v.supplier || '-'}>{v.supplier || '-'}</span></div>
            <div className="flex items-baseline gap-1"><span className="text-white/40 shrink-0">Resp. Descarreg.:</span> <span className="font-bold text-white break-words" title={v.forklift_name || 'Nenhum'}>{v.forklift_name || 'Nenhum'}</span></div>
          </div>
        )}`;
const replacement = `            <div className="text-xs flex flex-col gap-1.5 mt-2">
              <div className="flex items-baseline gap-1"><span className="text-white/40 shrink-0 w-[110px]">Motorista:</span> <span className="font-bold text-white break-words" title={v.driver || 'Não informado'}>{v.driver || 'Não informado'}</span></div>
              {!isSimple && (
                <>
                  <div className="flex items-baseline gap-1"><span className="text-white/40 shrink-0 w-[110px]">Transportador:</span> <span className="font-bold text-white break-words" title={v.transporter || '-'}>{v.transporter || '-'}</span></div>
                  <div className="flex items-baseline gap-1"><span className="text-white/40 shrink-0 w-[110px]">Fornecedor:</span> <span className="font-bold text-white break-words" title={v.supplier || '-'}>{v.supplier || '-'}</span></div>
                  <div className="flex items-baseline gap-1"><span className="text-white/40 shrink-0 w-[110px]">Resp. Descarreg.:</span> <span className="font-bold text-white break-words" title={v.forklift_name || 'Nenhum'}>{v.forklift_name || 'Nenhum'}</span></div>
                </>
              )}
            </div>
          </div>
          <div className="mt-1 shrink-0 text-right">
            <span className={\`inline-block px-2 py-1 rounded text-xs font-bold text-center \${badgeColor}\`}>
              {v.progress_status}
            </span>
          </div>
        </div>`;
if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/Dashboard.tsx', content);
  console.log('Success');
} else {
  console.log('Target not found');
}
