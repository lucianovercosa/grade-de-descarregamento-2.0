const fs = require('fs');
let code = fs.readFileSync('src/AuthContext.tsx', 'utf8');
code = code.replace(
  "        // Assume users have a document in 'users' collection\n        try {",
  `        // BYPASS DE ADMIN PARA LOGIN (GOOGLE OU SENHA)
        if (fbUser.email === 'lucianovercosa@gmail.com' || fbUser.email === 'albertojunior.pe@gmail.com' || fbUser.email === 'admin@local.com') {
          setUser({
            uid: fbUser.uid || 'admin-uid',
            email: fbUser.email,
            role: 'admin',
            name: fbUser.displayName || 'Administrador',
            permissions: ['manage_vehicles', 'manage_products', 'manage_users', 'manage_responsibles', 'manage_roles', 'view_dashboard', 'view_tv', 'chat']
          });
          setLoading(false);
          return;
        }

        // Assume users have a document in 'users' collection
        try {`
);
fs.writeFileSync('src/AuthContext.tsx', code);
console.log('Admin login bypass added');
