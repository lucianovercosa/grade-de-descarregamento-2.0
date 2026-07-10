const fs = require('fs');
let content = fs.readFileSync('src/AuthContext.tsx', 'utf8');

content = content.replace(
  '  name: string;\n}',
  '  name: string;\n  must_change_password?: boolean;\n}'
);

content = content.replace(
  '              name: userDoc.data().name,\n            });',
  '              name: userDoc.data().name,\n              must_change_password: userDoc.data().must_change_password,\n            });'
);

content = content.replace(
  "                name: data.name || fbUser.displayName || fbUser.email || 'Usuário',\n              });",
  "                name: data.name || fbUser.displayName || fbUser.email || 'Usuário',\n                must_change_password: data.must_change_password,\n              });"
);

fs.writeFileSync('src/AuthContext.tsx', content);
console.log('Patched AuthContext.tsx');
