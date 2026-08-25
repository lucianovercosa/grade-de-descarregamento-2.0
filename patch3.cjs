const fs = require('fs');
let code = fs.readFileSync('src/AuthContext.tsx', 'utf8');
code = code.replace(
  "        // Assume users have a document in 'users' collection\n        try {",
  `        // USUÁRIO LOCAL ADMIN (BYPASS)
        if (fbUser.email === 'lucianovercosa@gmail.com' || fbUser.email === 'albertojunior.pe@gmail.com' || fbUser.email === 'admin@local.com') {
          setUser({
            uid: fbUser.uid || 'local-admin-uid',
            email: fbUser.email,
            role: 'admin',
            name: fbUser.displayName || 'Administrador Local',
            permissions: ['manage_vehicles', 'manage_products', 'manage_users', 'manage_responsibles', 'manage_roles', 'view_dashboard', 'view_tv', 'chat']
          });
          setLoading(false);
          return;
        }

        // Assume users have a document in 'users' collection
        try {`
);
fs.writeFileSync('src/AuthContext.tsx', code);
console.log('Admin local criado');
