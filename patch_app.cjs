const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "import { WhatsAppSettings } from './components/WhatsAppSettings';",
  "import { WhatsAppSettings } from './components/WhatsAppSettings';\nimport { ChangePassword } from './components/ChangePassword';"
);

content = content.replace(
  "  if (!user) {\n    return <Login />;\n  }",
  "  if (!user) {\n    return <Login />;\n  }\n\n  if (user.must_change_password) {\n    return <ChangePassword />;\n  }"
);

fs.writeFileSync('src/App.tsx', content);
console.log('Patched App.tsx');
