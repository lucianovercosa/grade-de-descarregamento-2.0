const fs = require('fs');
let code = fs.readFileSync('src/AuthContext.tsx', 'utf8');

// The bypass is currently:
//        // BYPASS DE ADMIN PARA LOGIN (GOOGLE OU SENHA)
//        if (fbUser.email === 'lucianovercosa@gmail.com' || fbUser.email === 'albertojunior.pe@gmail.com' || fbUser.email === 'admin@local.com') { ... return; }
//
//        // Assume users have a document in 'users' collection

code = code.replace(
  /\/\/ BYPASS DE ADMIN PARA LOGIN \(GOOGLE OU SENHA\)[\s\S]*?\/\/ Assume users have a document in 'users' collection/,
  "// Assume users have a document in 'users' collection"
);

fs.writeFileSync('src/AuthContext.tsx', code);
console.log('cleaned auth bypass');
