const fs = require('fs');

function patchDashboard() {
  let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
  content = content.replace("import { handleWhatsAppShare } from '../whatsapp';\n", '');
  
  // Replace the button in the first instance (active cards)
  const button1 = `<button onClick={() => handleWhatsAppShare(v)} className="py-2 px-4 bg-green-600/20 text-green-400 border border-green-500/30 text-[10px] font-bold uppercase tracking-widest rounded hover:bg-green-600/40 transition-colors flex items-center gap-1">
            WhatsApp
          </button>`;
  content = content.replace(button1, '');
  
  // Replace the button in the second instance (history table)
  const button2 = `<button onClick={() => handleWhatsAppShare(v)} className="py-1.5 px-3 bg-green-600/20 text-green-400 border border-green-500/30 text-[9px] font-bold uppercase tracking-widest rounded hover:bg-green-600/40 transition-colors">WhatsApp</button>`;
  content = content.replace(button2, '');
  
  fs.writeFileSync('src/components/Dashboard.tsx', content);
  console.log('Patched Dashboard.tsx');
}

function patchVehicleForm() {
  let content = fs.readFileSync('src/components/VehicleForm.tsx', 'utf8');
  content = content.replace("import { handleWhatsAppShare } from '../whatsapp';\n", '');
  fs.writeFileSync('src/components/VehicleForm.tsx', content);
  console.log('Patched VehicleForm.tsx');
}

function patchLayout() {
  let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');
  const navItem = `              <button 
                onClick={() => onNavigate('whatsapp')}
                className={\`text-left px-6 py-3 transition-colors flex items-center gap-3 \${activeView === 'whatsapp' ? 'bg-blue-500/10 border-r-4 border-blue-500 text-blue-400 font-medium' : 'text-white/60 hover:text-white'}\`}
              >
                <span className="text-sm">Alertas WhatsApp</span>
              </button>`;
  content = content.replace(navItem, '');
  fs.writeFileSync('src/components/Layout.tsx', content);
  console.log('Patched Layout.tsx');
}

function patchApp() {
  let content = fs.readFileSync('src/App.tsx', 'utf8');
  content = content.replace("import { WhatsAppSettings } from './components/WhatsAppSettings';\n", '');
  const block = `    if (activeView === 'whatsapp') {\n      return <WhatsAppSettings />;\n    }\n\n`;
  content = content.replace(block, '');
  fs.writeFileSync('src/App.tsx', content);
  console.log('Patched App.tsx');
}

patchDashboard();
patchVehicleForm();
patchLayout();
patchApp();

