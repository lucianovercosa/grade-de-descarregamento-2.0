const fs = require('fs');
let code = fs.readFileSync('src/AuthContext.tsx', 'utf8');
code = code.replace(
  `        // BYPASS DE SEGURANÇA PARA ADMINS
        if (fbUser.email === 'lucianovercosa@gmail.com' || fbUser.email === 'albertojunior.pe@gmail.com') {
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            role: 'admin',
            name: fbUser.displayName || 'Administrador Master',
            permissions: ['manage_vehicles', 'manage_products', 'manage_users', 'manage_responsibles', 'manage_roles', 'view_dashboard', 'view_tv']
          });
          setLoading(false);
          return;
        }

        // Assume users have a document in 'users' collection
        try {`,
  "        // Assume users have a document in 'users' collection\n        try {"
);
fs.writeFileSync('src/AuthContext.tsx', code);
console.log('Reverted AuthContext.tsx completely');
