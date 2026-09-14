const fs = require('fs');
let code = fs.readFileSync('src/components/Login.tsx', 'utf8');

code = code.replace(
  "setError(err.message || 'Erro ao fazer login.');",
  "setError(`Erro: ${err.code} - ${err.message}`);"
);

fs.writeFileSync('src/components/Login.tsx', code);
