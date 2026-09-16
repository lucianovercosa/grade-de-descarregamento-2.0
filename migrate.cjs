const fs = require('fs');

const filesToMigrate = [
  'src/components/Dashboard.tsx',
  'src/components/TVMode.tsx',
  'src/components/PublicStatus.tsx',
  'src/components/ChatWidget.tsx',
  'src/components/VehicleForm.tsx'
];

for (const file of filesToMigrate) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace imports
  content = content.replace(/import \{.*?\} from 'firebase\/firestore';\n?/g, '');
  content = content.replace(/import \{.*?\} from '\.\.\/firebase';\n?/g, '');
  content = content.replace(/import \{.*?\} from 'firebase\/auth';\n?/g, '');
  content = content.replace(/import \{.*?\} from 'firebase\/storage';\n?/g, '');
  content = content.replace(/import \{.*?\} from '\.\/firebase';\n?/g, '');

  content = `import { api, API_URL } from '../lib/api';\n` + content;
  
  if (file.includes('ChatWidget.tsx')) {
    content = content.replace(/const q = query\(collection\(db, 'chat_messages'\), orderBy\('created_at', 'asc'\)\);.*?const unsubscribe = onSnapshot\(q, \(snapshot\) => \{.*?const data = snapshot\.docs\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \}\) as ChatMessage\);.*?setMessages\(data\);.*?\}.*?\);.*?return unsubscribe;/gs, `
      const fetchMessages = async () => {
        try {
          const data = await api.get('/chat_messages');
          setMessages(data);
        } catch (e) {}
      };
      fetchMessages();
      const int = setInterval(fetchMessages, 5000);
      return () => clearInterval(int);
    `);
    
    content = content.replace(/await addDoc\(collection\(db, 'chat_messages'\), \{.*?\text: newMessage,.*?\user_id: user\.uid,.*?\user_name: user\.name,.*?\reply_to: replyTo \? replyTo\.id : null,.*?\read_by: \[user\.uid\],.*?\created_at: new Date\(\)\.toISOString\(\).*?\}\);/gs, `
      await api.post('/chat_messages', {
        text: newMessage,
        user_id: user.uid,
        user_name: user.name,
        reply_to: replyTo ? replyTo.id : null
      });
    `);
    
    content = content.replace(/const batch = writeBatch\(db\);.*?messages\.forEach\(msg => \{.*?if \(\!msg\.read_by\.includes\(user\.uid\)\) \{.*?const ref = doc\(db, 'chat_messages', msg\.id\);.*?batch\.update\(ref, \{ read_by: \[...msg\.read_by, user\.uid\] \}\);.*?\}[\s\S]*?await batch\.commit\(\);/gs, `
      await api.post('/chat_messages/mark-read', { user_id: user.uid });
    `);
  }

  if (file.includes('Dashboard.tsx') || file.includes('TVMode.tsx') || file.includes('PublicStatus.tsx')) {
    // Replace onSnapshot with polling
    content = content.replace(/const q = query\(collection\(db, 'vehicles'\), orderBy\('created_at', 'asc'\)\);.*?const unsubscribe = onSnapshot\(q, \(snapshot\) => \{.*?const data = snapshot\.docs\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \}\) as Vehicle\);.*?setVehicles\(data\);.*?\}.*?\);.*?return unsubscribe;/gs, `
      const fetchVehicles = async () => {
        try {
          const data = await api.get('/vehicles');
          setVehicles(data);
        } catch (e) {}
      };
      fetchVehicles();
      const int = setInterval(fetchVehicles, 5000);
      return () => clearInterval(int);
    `);
    
    // Also TVMode has it
    content = content.replace(/const unsubscribe = onSnapshot.*?setVehicles.*?unsubscribe;/gs, `
      const fetchVehicles = async () => {
        try {
          const data = await api.get('/vehicles');
          setVehicles(data);
        } catch (e) {}
      };
      fetchVehicles();
      const int = setInterval(fetchVehicles, 5000);
      return () => clearInterval(int);
    `);
    
    // Updates
    content = content.replace(/await updateDoc\(doc\(db, 'vehicles', vehicleId\), \{[\s\S]*?\}\);/g, (match) => {
      const inner = match.substring(match.indexOf('{'), match.lastIndexOf('}') + 1);
      return `await api.put(\`/vehicles/\${vehicleId}\`, ${inner});`;
    });
    
    content = content.replace(/await deleteDoc\(doc\(db, 'vehicles', id\)\);/g, `await api.delete(\`/vehicles/\${id}\`);`);
  }
  
  if (file.includes('VehicleForm.tsx')) {
    content = content.replace(/await getDocs\(query\(collection\(db, 'users'\), where\('role', '==', 'empilhador'\)\)\);/g, `await api.get('/users').then((r: any) => ({ forEach: (cb: any) => r.filter((u:any)=>u.role==='empilhador').forEach((u:any) => cb({id: u.uid || u.id, data: () => u})) }));`);
    content = content.replace(/await getDocs\(collection\(db, 'responsibles'\)\);/g, `await api.get('/responsibles').then((r: any) => ({ forEach: (cb: any) => r.forEach((u:any) => cb({id: u.id, data: () => u})) }));`);
    content = content.replace(/await getDocs\(collection\(db, 'products'\)\);/g, `await api.get('/products').then((r: any) => ({ forEach: (cb: any) => r.forEach((u:any) => cb({data: () => u})) }));`);
    
    // Document fetching
    content = content.replace(/const docSnap = await getDoc\(doc\(db, 'vehicles', vehicleId\)\);.*?if \(docSnap\.exists\(\)\) \{.*?const data = docSnap\.data\(\) as Vehicle;.*?setFormData\(data\);.*?\}/gs, `
      const data = await api.get('/vehicles');
      const vehicle = data.find((v: any) => v.id === vehicleId);
      if (vehicle) {
        if (typeof vehicle.items === 'string') vehicle.items = JSON.parse(vehicle.items);
        if (typeof vehicle.images === 'string') vehicle.images = JSON.parse(vehicle.images);
        if (typeof vehicle.attachments === 'string') vehicle.attachments = JSON.parse(vehicle.attachments);
        setFormData(vehicle);
      }
    `);
    
    // Save logic
    content = content.replace(/await setDoc\(doc\(db, 'vehicles', vehicleId\), dataToSave, \{ merge: true \}\);/g, `
      await api.put(\`/vehicles/\${vehicleId}\`, dataToSave);
    `);
    content = content.replace(/await addDoc\(collection\(db, 'vehicles'\), dataToSave\);/g, `
      await api.post('/vehicles', dataToSave);
    `);
    
    // File uploads - use multer
    content = content.replace(/const storageRef = ref\(storage, \`vehicles\/\$\{Date\.now\(\)\}_\$\{finalFile\.name\}\`\);.*?await uploadBytes\(storageRef, finalFile\);.*?const url = await getDownloadURL\(storageRef\);/gs, `
      const formData = new FormData();
      formData.append('file', finalFile);
      const res = await api.post('/upload', formData);
      const url = res.url;
    `);
    
    // Settings logic bypass
    content = content.replace(/onSnapshot\(doc\(db, 'settings', 'whatsapp'\).*?\);/gs, `
      // removed settings fetch
    `);
  }

  fs.writeFileSync(file, content, 'utf8');
}
