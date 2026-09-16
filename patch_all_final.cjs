const fs = require('fs');

// Fix Dashboard
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
code = code.replace(/const vehicleRef = doc\(db, 'vehicles', vehicleId\);/g, '');
code = code.replace(/await updateDoc\(vehicleRef, updateData\);/g, "await api.put(`/vehicles/${vehicleId}`, updateData);");
fs.writeFileSync('src/components/Dashboard.tsx', code);

// Fix TVMode
let tvCode = fs.readFileSync('src/components/TVMode.tsx', 'utf8');
tvCode = tvCode.replace(/const q = query\(collection.*?return unsubscribe;/s, `let intId: any;
    const fetchVehicles = async () => {
      try {
        const data = await api.get('/vehicles');
        let hasStatusChange = false;
        let lastChangedVehicle: Vehicle | null = null;
        
        data.forEach((v: any) => {
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
      } catch (err) {}
    };
    fetchVehicles();
    intId = setInterval(fetchVehicles, 5000);
    return () => clearInterval(intId);`);
tvCode = tvCode.replace(/await signOut\(auth\);/, 'window.location.href = "/";');
fs.writeFileSync('src/components/TVMode.tsx', tvCode);

// Fix routes.ts
let routesCode = fs.readFileSync('src/server/routes.ts', 'utf8');
const authMid = `const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};`;
routesCode = routesCode.replace("const router = express.Router();", "const router = express.Router();\n\n" + authMid);
routesCode = routesCode.replace(authMid, ''); // remove it first
routesCode = routesCode.replace("const router = express.Router();", "const router = express.Router();\n\n" + authMid);
fs.writeFileSync('src/server/routes.ts', routesCode);

