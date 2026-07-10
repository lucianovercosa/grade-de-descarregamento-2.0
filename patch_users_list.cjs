const fs = require('fs');
let content = fs.readFileSync('src/components/UsersList.tsx', 'utf8');

// Imports
content = content.replace(
  "import { db } from '../firebase';",
  "import { db, secondaryAuth } from '../firebase';\nimport { createUserWithEmailAndPassword, signOut } from 'firebase/auth';"
);

// Add state for creating loading
content = content.replace(
  "const [isAdding, setIsAdding] = useState(false);",
  "const [isAdding, setIsAdding] = useState(false);\n  const [loading, setLoading] = useState(false);"
);

const handleSaveStart = "  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {\n    e.preventDefault();\n    const form = e.currentTarget;";

const handleSaveNew = `  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const role = (form.elements.namedItem('role') as HTMLSelectElement).value as AppUser['role'];
    const active = (form.elements.namedItem('active') as HTMLInputElement).checked;
    const passwordInput = form.elements.namedItem('password') as HTMLInputElement;
    const password = passwordInput ? passwordInput.value : '';

    setLoading(true);
    try {
      if (isAdding) {
        if (!password || password.length < 6) {
          alert('A senha deve ter pelo menos 6 caracteres.');
          setLoading(false);
          return;
        }
        
        // Create in secondary auth
        const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const uid = userCred.user.uid;
        await signOut(secondaryAuth); // Sign out the secondary instance

        const newDocRef = doc(db, 'users', uid);
        await setDoc(newDocRef, {
          email,
          username: email.split('@')[0],
          name,
          role,
          active,
          must_change_password: true,
          created_at: new Date().toISOString()
        });
      } else if (editingUser?.id) {
        await updateDoc(doc(db, 'users', editingUser.id), {
          email,
          name,
          role,
          active
        });
      }
      setIsAdding(false);
      setEditingUser(null);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar usuário: ' + err.message);
    } finally {
      setLoading(false);
    }
  };`;

// replace handleSave block
const handleSaveBlockStart = content.indexOf('  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {');
const handleDeleteBlockStart = content.indexOf('  const handleDelete = async (id: string) => {');

content = content.substring(0, handleSaveBlockStart) + handleSaveNew + "\n\n" + content.substring(handleDeleteBlockStart);


// Add password field
const emailLabel = `<label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Email
            <input name="email" type="email" required defaultValue={user.email} disabled={!isAdding} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal disabled:opacity-50 disabled:bg-black/20" />
          </label>`;

const newEmailLabel = `<label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Email
            <input name="email" type="email" required defaultValue={user.email} disabled={!isAdding} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal disabled:opacity-50 disabled:bg-black/20" />
          </label>
          {isAdding && (
            <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
              Senha Inicial (Padrão)
              <input name="password" type="text" required={isAdding} defaultValue="123456" className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-normal" />
              <span className="text-[9px] normal-case text-white/30">O usuário será solicitado a alterar esta senha no primeiro login.</span>
            </label>
          )}`;

content = content.replace(emailLabel, newEmailLabel);

// disable submit button while loading
content = content.replace(
  '<button type="submit" className="bg-blue-600',
  '<button type="submit" disabled={loading} className="bg-blue-600 disabled:opacity-50'
);
content = content.replace(
  'Salvar Usuário\n            </button>',
  '{loading ? "Aguarde..." : "Salvar Usuário"}\n            </button>'
);

fs.writeFileSync('src/components/UsersList.tsx', content);
console.log('Patched UsersList.tsx');
