const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

const target = `  items: VehicleItem[];`;
const replacement = `  items: VehicleItem[];
  attachments?: { name: string; url: string; type: string }[];`;

if (content.includes(target) && !content.includes('attachments?')) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/types.ts', content);
  console.log('Success Types');
}
