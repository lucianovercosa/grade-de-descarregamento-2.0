const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const badStartStr = '                    {whatsappContacts.map((c, i) => (';
const badStart = content.indexOf(badStartStr);
if (badStart !== -1) {
  const endStr = '        </div>\n      )}';
  const badEnd = content.indexOf(endStr, badStart) + endStr.length;
  content = content.substring(0, badStart) + content.substring(badEnd);
  fs.writeFileSync('src/components/Dashboard.tsx', content);
  console.log('Fixed Dash remaining block');
} else {
  console.log('Not found in Dash');
}

