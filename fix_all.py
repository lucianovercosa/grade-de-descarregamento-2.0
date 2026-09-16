import os
import re

def process_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r') as f:
        content = f.read()

    # Remove all leftover firebase imports
    content = re.sub(r"import \{.*?\} from 'firebase.*?';\n?", "", content)
    content = re.sub(r"import \{.*?\} from '\.\./firebase';\n?", "", content)
    
    # 1. Dashboard
    if 'Dashboard.tsx' in filepath:
        # replace the useEffect
        target = re.search(r"useEffect\(\(\) => \{\s*const unsubContacts = onSnapshot.*?return \(\) => \{\s*unsubscribe\(\);\s*unsubContacts\(\);\s*\};\s*\}, \[\]\);", content, re.DOTALL)
        if target:
            replacement = """useEffect(() => {
    let intId;
    const fetchVehicles = async () => {
      try {
        const data = await api.get('/vehicles');
        let hasStatusChange = false;
        let lastChangedVehicle = null;
        
        data.forEach(v => {
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
          const txt = `Atenção: Carro ${lastChangedVehicle.daily_sequence}, placa ${lastChangedVehicle.plate}, mudou para o status ${lastChangedVehicle.progress_status}.`;
          speakNotification(txt);
          setAlertText(txt);
          setTimeout(() => setAlertText(null), 8000);
        }
        setVehicles(data);
      } catch (err) {}
    };
    fetchVehicles();
    intId = setInterval(fetchVehicles, 5000);
    return () => clearInterval(intId);
  }, []);"""
            content = content[:target.start()] + replacement + content[target.end():]
            
        content = re.sub(r"await updateDoc\(doc\(db, 'vehicles', vehicleId\), \{", "await api.put(`/vehicles/${vehicleId}`, {", content)
        content = re.sub(r"progress_percent: newPercent\s*\}", "progress_percent: newPercent\n      }", content)
        
        # for dynamic updates
        updates = list(re.finditer(r"await updateDoc\(doc\(db, 'vehicles', ([^\)]+)\), (\{.*?\})\);", content, re.DOTALL))
        for m in reversed(updates):
            v_id = m.group(1)
            payload = m.group(2)
            content = content[:m.start()] + f"await api.put(`/vehicles/${{{v_id}}}`, {payload});" + content[m.end():]
            
        content = re.sub(r"await deleteDoc\(doc\(db, 'vehicles', (.*?)\)\);", r"await api.delete(`/vehicles/${\1}`);", content)

    # 2. PublicStatus
    if 'PublicStatus.tsx' in filepath:
        target = re.search(r"useEffect\(\(\) => \{\s*const q = query\(collection\(db, 'vehicles'\).*?return unsubscribe;\s*\}, \[\]\);", content, re.DOTALL)
        if target:
            replacement = """useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const data = await api.get('/vehicles');
        data.forEach(v => {
          if (typeof v.items === 'string') v.items = JSON.parse(v.items);
        });
        setVehicles(data);
      } catch (e) {}
    };
    fetchVehicles();
    const intId = setInterval(fetchVehicles, 5000);
    return () => clearInterval(intId);
  }, []);"""
            content = content[:target.start()] + replacement + content[target.end():]

    # 3. ChatWidget
    if 'ChatWidget.tsx' in filepath:
        target = re.search(r"useEffect\(\(\) => \{\s*if \(!isOpen\) return;\s*const q = query\(collection\(db, 'chat_messages'\).*?return unsubscribe;\s*\}, \[isOpen, user\]\);", content, re.DOTALL)
        if target:
            replacement = """useEffect(() => {
    if (!isOpen) return;
    const fetchMessages = async () => {
      try {
        const data = await api.get('/chat_messages');
        setMessages(data);
      } catch (e) {}
    };
    fetchMessages();
    const intId = setInterval(fetchMessages, 3000);
    return () => clearInterval(intId);
  }, [isOpen, user]);"""
            content = content[:target.start()] + replacement + content[target.end():]
            
        content = re.sub(r"await addDoc\(collection\(db, 'chat_messages'\), (\{.*?\})\);", r"await api.post('/chat_messages', \1);", content, flags=re.DOTALL)
        
        target2 = re.search(r"const markAsRead = async \(\) => \{.*?await batch\.commit\(\);\s*\} catch \(err\) \{\s*console\.error\(err\);\s*\}\s*\};", content, re.DOTALL)
        if target2:
            replacement2 = """const markAsRead = async () => {
    if (!user) return;
    try {
      await api.post('/chat_messages/mark-read', { user_id: user.uid });
    } catch (err) {}
  };"""
            content = content[:target2.start()] + replacement2 + content[target2.end():]

    # 4. VehicleForm
    if 'VehicleForm.tsx' in filepath:
        target = re.search(r"const loadUsers = async \(\) => \{.*?setProductsList.*?catch \(err\) \{.*?\}.*?\};", content, re.DOTALL)
        if target:
            replacement = """const loadUsers = async () => {
      try {
        const users = await api.get('/users');
        const responsibles = await api.get('/responsibles');
        setEmpilhadores([...users.filter(u => u.role === 'empilhador'), ...responsibles]);
      } catch (err) {}
    };
    const loadProducts = async () => {
      try {
        const pList = await api.get('/products');
        setProductsList(pList);
      } catch (err) {}
    };"""
            content = content[:target.start()] + replacement + content[target.end():]
            
        # load vehicle data
        target_doc = re.search(r"const docSnap = await getDoc\(doc\(db, 'vehicles', vehicleId\)\);.*?if \(docSnap\.exists\(\)\) \{.*?\}", content, re.DOTALL)
        if target_doc:
            replacement_doc = """const data = await api.get('/vehicles');
        const vehicle = data.find(v => v.id === vehicleId);
        if (vehicle) {
          if (typeof vehicle.items === 'string') vehicle.items = JSON.parse(vehicle.items);
          if (typeof vehicle.images === 'string') vehicle.images = JSON.parse(vehicle.images);
          if (typeof vehicle.attachments === 'string') vehicle.attachments = JSON.parse(vehicle.attachments);
          setFormData(vehicle);
        }"""
            content = content[:target_doc.start()] + replacement_doc + content[target_doc.end():]

        # Saves
        content = re.sub(r"await setDoc\(doc\(db, 'vehicles', vehicleId\), dataToSave, \{ merge: true \}\);", "await api.put(`/vehicles/${vehicleId}`, dataToSave);", content)
        content = re.sub(r"await addDoc\(collection\(db, 'vehicles'\), dataToSave\);", "await api.post('/vehicles', dataToSave);", content)

    # ensure import exists
    if "import { api" not in content:
        content = "import { api, API_URL } from '../lib/api';\n" + content

    with open(filepath, 'w') as f:
        f.write(content)

for f in [
  'src/components/Dashboard.tsx',
  'src/components/TVMode.tsx',
  'src/components/PublicStatus.tsx',
  'src/components/ChatWidget.tsx',
  'src/components/VehicleForm.tsx'
]:
    process_file(f)

