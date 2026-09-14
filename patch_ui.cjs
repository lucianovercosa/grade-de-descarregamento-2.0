const fs = require('fs');

let loginCode = fs.readFileSync('src/components/Login.tsx', 'utf8');
loginCode = loginCode.replace(
    '<label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">\n            Usuário',
    '<label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">\n            Nome de Usuário'
);
fs.writeFileSync('src/components/Login.tsx', loginCode);

let listCode = fs.readFileSync('src/components/UsersList.tsx', 'utf8');
listCode = listCode.replace(
    '<div className="font-bold text-lg text-white">{u.name} <span className="text-sm font-normal text-white/40">({u.email || u.username})</span></div>',
    '<div className="font-bold text-lg text-white">{u.name} <span className="text-sm font-normal text-white/40">({u.username || u.email?.split("@")[0]})</span></div>'
);
listCode = listCode.replace(
    '<label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">\n            Usuário',
    '<label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">\n            Nome de Usuário'
);
fs.writeFileSync('src/components/UsersList.tsx', listCode);
