const fs = require('fs');
let code = fs.readFileSync('src/components/VehicleForm.tsx', 'utf8');

// Replace the old getDoc for products
const targetProductsCode = `const pDoc = await getDoc(doc(db, 'products', code));
                      if (pDoc.exists()) {
                        setFormData(prev => {
                          const newItems = [...(prev.items || [])];
                          newItems[index] = { 
                            ...newItems[index], 
                            code, 
                            description: pDoc.data().description 
                          };
                          return { ...prev, items: newItems };
                        });
                      }`;
const replaceProductsCode = `
                        const product = productsList.find(p => p.code === code);
                        setFormData(prev => {
                          const newItems = [...(prev.items || [])];
                          newItems[index] = { 
                            ...newItems[index], 
                            code, 
                            description: product ? product.description : '' 
                          };
                          return { ...prev, items: newItems };
                        });`;
code = code.replace(targetProductsCode, replaceProductsCode);
code = code.replace(/const pDoc = await getDoc\(doc\(db, 'products', code\)\);[\s\S]*?\}\);[\s\S]*?\}/g, replaceProductsCode);

// Sequence number query
const targetSeq = `const startIso = startOfDay(new Date()).toISOString();
        const endIso = endOfDay(new Date()).toISOString();
        const q = query(collection(db, 'vehicles'), where('created_at', '>=', startIso), where('created_at', '<=', endIso));
        const qs = await getDocs(q);
        let maxSeq = 0;
        qs.forEach(doc => {
          const s = doc.data().daily_sequence || 0;
          if (s > maxSeq) maxSeq = s;
        });
        dataToSave.daily_sequence = maxSeq + 1;`;

const replaceSeq = `const startIso = startOfDay(new Date()).toISOString();
        const endIso = endOfDay(new Date()).toISOString();
        const resVehicles = await api.get('/vehicles');
        let maxSeq = 0;
        resVehicles.forEach((v: any) => {
          if (v.created_at >= startIso && v.created_at <= endIso) {
            const s = v.daily_sequence || 0;
            if (s > maxSeq) maxSeq = s;
          }
        });
        dataToSave.daily_sequence = maxSeq + 1;`;

code = code.replace(/const startIso = startOfDay.*?dataToSave\.daily_sequence = maxSeq \+ 1;/s, replaceSeq);

fs.writeFileSync('src/components/VehicleForm.tsx', code);
