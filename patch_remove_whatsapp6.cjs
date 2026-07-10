const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const regex = /\s*\{whatsappContacts\.map\([\s\S]*?Fechar\s*<\/button>\s*<\/div>\s*<\/div>\s*\)\}/;
if (regex.test(content)) {
  content = content.replace(regex, '');
  fs.writeFileSync('src/components/Dashboard.tsx', content);
  console.log('Fixed Dash remaining block');
} else {
  console.log('Not found in Dash');
}

