const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Replace imports
code = code.replace(/import \{ collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc \} from 'firebase\/firestore';/, '');
code = code.replace(/import \{ db \} from '\.\.\/firebase';/, "import { api, API_URL } from '../lib/api';");

const target = `  useEffect(() => {
    const unsubContacts = onSnapshot(doc(db, 'settings', 'whatsapp'), (docSnap) => {
      if (docSnap.exists()) {
        setWhatsappContacts(docSnap.data().contacts || []);
      }
    }, (error) => {
      console.log('Contacts listener error:', error);
    });

    const q = query(collection(db, 'vehicles'), orderBy('started_at', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
      
      let hasStatusChange = false;
      let lastChangedVehicle: Vehicle | null = null;
      
      data.forEach(v => {
        if (v.id && v.progress_status) {
          const prevStatus = prevStatuses.current[v.id];
          if (prevStatus && prevStatus !== v.progress_status) {
            hasStatusChange = true;
            lastChangedVehicle = v;
          }
          prevStatuses.current[v.id] = v.progress_status;
        }
      });

      if (hasStatusChange && lastChangedVehicle) {
        const txt = \`Atenção: Carro \${(lastChangedVehicle as Vehicle).daily_sequence}, placa \${(lastChangedVehicle as Vehicle).plate}, mudou para o status \${(lastChangedVehicle as Vehicle).progress_status}.\`;
        speakNotification(txt);
        setAlertText(txt);
        setTimeout(() => setAlertText(null), 8000);
      }
      
      setVehicles(data);
    }, (error) => {
      console.log('Vehicles listener error:', error);
    });

    return () => {
      unsubscribe();
      unsubContacts();
    };
  }, []);`;

const replacement = `  useEffect(() => {
    let intId: any;
    
    const fetchVehicles = async () => {
      try {
        const data = await api.get('/vehicles');
        
        let hasStatusChange = false;
        let lastChangedVehicle: Vehicle | null = null;
        
        data.forEach((v: any) => {
          if (typeof v.items === 'string') v.items = JSON.parse(v.items);
          if (typeof v.images === 'string') v.images = JSON.parse(v.images);
          if (typeof v.attachments === 'string') v.attachments = JSON.parse(v.attachments);
          
          if (v.id && v.progress_status) {
            const prevStatus = prevStatuses.current[v.id];
            if (prevStatus && prevStatus !== v.progress_status) {
              hasStatusChange = true;
              lastChangedVehicle = v;
            }
            prevStatuses.current[v.id] = v.progress_status;
          }
        });

        if (hasStatusChange && lastChangedVehicle) {
          const txt = \`Atenção: Carro \${(lastChangedVehicle as Vehicle).daily_sequence}, placa \${(lastChangedVehicle as Vehicle).plate}, mudou para o status \${(lastChangedVehicle as Vehicle).progress_status}.\`;
          speakNotification(txt);
          setAlertText(txt);
          setTimeout(() => setAlertText(null), 8000);
        }
        
        setVehicles(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchVehicles();
    intId = setInterval(fetchVehicles, 5000);

    return () => {
      clearInterval(intId);
    };
  }, []);`;

code = code.replace(target, replacement);

code = code.replace(/await updateDoc\(doc\(db, 'vehicles', vehicleId\), \{/g, 'await api.put(`/vehicles/${vehicleId}`, {');
code = code.replace(/progress_percent: newPercent\s*\}/g, 'progress_percent: newPercent\n      }');
code = code.replace(/await updateDoc\(doc\(db, 'vehicles', vehicleId\), \{[\s\S]*?\}\);/g, (match) => {
    // If it's already using api.put, skip
    if (match.includes('api.put')) return match;
    const inner = match.substring(match.indexOf('{'), match.lastIndexOf('}') + 1);
    return `await api.put(\`/vehicles/\${vehicleId}\`, ${inner});`;
});
code = code.replace(/await deleteDoc\(doc\(db, 'vehicles', id\)\);/g, 'await api.delete(`/vehicles/${id}`);');

fs.writeFileSync('src/components/Dashboard.tsx', code);
