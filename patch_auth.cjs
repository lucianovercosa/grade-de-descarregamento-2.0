const fs = require('fs');
let code = fs.readFileSync('src/AuthContext.tsx', 'utf8');
code = code.replace(
  "if (!data.active) {",
  "if (data.active === false) {"
);
code = code.replace(
  "alert('Seu usuário não está cadastrado. Peça para o administrador liberar seu acesso.');",
  "console.log('User not found in DB', fbUser); alert('Seu usuário não está cadastrado. Peça para o administrador liberar seu acesso.');"
);
fs.writeFileSync('src/AuthContext.tsx', code);
