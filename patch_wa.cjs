const fs = require('fs');
let content = fs.readFileSync('src/whatsapp.ts', 'utf8');
const target = `          <div style="font-size: 12px; display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">
            <div style="display: flex; align-items: baseline; gap: 4px;"><span style="color: rgba(255,255,255,0.4);">Motorista:</span> <span style="font-weight: bold;">\${v.driver || 'Não informado'}</span></div>
          </div>
        </div>
        <div style="text-align: right; margin-top: 4px;">
          <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background-color: \${badgeBg}; color: \${badgeText}; border: 1px solid rgba(255,255,255,0.1);">
            \${v.progress_status}
          </span>
        </div>
      </div>
      <div style="font-size: 12px; display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">
        <div style="display: flex; align-items: baseline; gap: 4px;"><span style="color: rgba(255,255,255,0.4);">Transportador:</span> <span style="font-weight: bold;">\${v.transporter || '-'}</span></div>
        <div style="display: flex; align-items: baseline; gap: 4px;"><span style="color: rgba(255,255,255,0.4);">Fornecedor:</span> <span style="font-weight: bold;">\${v.supplier || '-'}</span></div>
        <div style="display: flex; align-items: baseline; gap: 4px;"><span style="color: rgba(255,255,255,0.4);">Resp. Descarreg.:</span> <span style="font-weight: bold;">\${v.forklift_name || 'Nenhum'}</span></div>
      </div>
    </div>`;

const replacement = `          <div style="font-size: 12px; display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">
            <div style="display: flex; align-items: baseline; gap: 4px;"><span style="color: rgba(255,255,255,0.4); width: 110px; flex-shrink: 0; display: inline-block;">Motorista:</span> <span style="font-weight: bold;">\${v.driver || 'Não informado'}</span></div>
            <div style="display: flex; align-items: baseline; gap: 4px;"><span style="color: rgba(255,255,255,0.4); width: 110px; flex-shrink: 0; display: inline-block;">Transportador:</span> <span style="font-weight: bold;">\${v.transporter || '-'}</span></div>
            <div style="display: flex; align-items: baseline; gap: 4px;"><span style="color: rgba(255,255,255,0.4); width: 110px; flex-shrink: 0; display: inline-block;">Fornecedor:</span> <span style="font-weight: bold;">\${v.supplier || '-'}</span></div>
            <div style="display: flex; align-items: baseline; gap: 4px;"><span style="color: rgba(255,255,255,0.4); width: 110px; flex-shrink: 0; display: inline-block;">Resp. Descarreg.:</span> <span style="font-weight: bold;">\${v.forklift_name || 'Nenhum'}</span></div>
          </div>
        </div>
        <div style="text-align: right; margin-top: 4px;">
          <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background-color: \${badgeBg}; color: \${badgeText}; border: 1px solid rgba(255,255,255,0.1);">
            \${v.progress_status}
          </span>
        </div>
      </div>
    </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/whatsapp.ts', content);
  console.log('Success Whatsapp');
} else {
  console.log('Target not found Whatsapp');
}
