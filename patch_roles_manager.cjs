const fs = require('fs');
let code = fs.readFileSync('src/components/RolesManager.tsx', 'utf8');
code = code.replace(
    "{ id: 'admin', name: 'admin', permissions: ['manage_vehicles', 'manage_products', 'manage_users', 'manage_responsibles', 'manage_roles', 'view_dashboard', 'view_tv'], created_at: new Date().toISOString() },",
    "{ id: 'default-admin', name: 'admin', permissions: ['manage_vehicles', 'manage_products', 'manage_users', 'manage_responsibles', 'manage_roles', 'view_dashboard', 'view_tv'], created_at: new Date().toISOString() },"
);
code = code.replace(
    "{ id: 'mro', name: 'mro', permissions: ['manage_vehicles', 'view_dashboard'], created_at: new Date().toISOString() },",
    "{ id: 'default-mro', name: 'mro', permissions: ['manage_vehicles', 'view_dashboard'], created_at: new Date().toISOString() },"
);
code = code.replace(
    "{ id: 'empilhador', name: 'empilhador', permissions: ['manage_vehicles', 'view_dashboard'], created_at: new Date().toISOString() },",
    "{ id: 'default-empilhador', name: 'empilhador', permissions: ['manage_vehicles', 'view_dashboard'], created_at: new Date().toISOString() },"
);
code = code.replace(
    "{ id: 'tv', name: 'tv', permissions: ['view_tv'], created_at: new Date().toISOString() },",
    "{ id: 'default-tv', name: 'tv', permissions: ['view_tv'], created_at: new Date().toISOString() },"
);
fs.writeFileSync('src/components/RolesManager.tsx', code);
