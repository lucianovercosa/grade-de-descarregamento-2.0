const fs = require('fs');
let code = fs.readFileSync('src/server/routes.ts', 'utf8');

const oldVehiclesPost = /router\.post\('\/vehicles', authMiddleware, async \(req, res\) => \{[\s\S]*?res\.json\(\{ id \}\);\n\}\);/s;

const newVehiclesPost = `router.post('/vehicles', authMiddleware, async (req, res) => {
  const id = Date.now().toString();
  const data = req.body;
  const fields = ['id', ...Object.keys(data)];
  const values = [id, ...Object.values(data).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v)];
  
  const placeholders = fields.map(() => '?').join(', ');
  
  try {
    await dbRun(
      \`INSERT INTO vehicles (\${fields.join(', ')}) VALUES (\${placeholders})\`,
      values
    );
    res.json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});`;

const oldVehiclesPut = /router\.put\('\/vehicles\/:id', authMiddleware, async \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true \}\);\n\}\);/s;

const newVehiclesPut = `router.put('/vehicles/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  
  const fields = [];
  const values = [];
  
  for (const [key, value] of Object.entries(data)) {
    fields.push(\`\${key} = ?\`);
    values.push(typeof value === 'object' && value !== null ? JSON.stringify(value) : value);
  }
  
  if (fields.length > 0) {
    values.push(id);
    try {
      await dbRun(\`UPDATE vehicles SET \${fields.join(', ')} WHERE id = ?\`, values);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.json({ success: true });
  }
});`;

code = code.replace(oldVehiclesPost, newVehiclesPost);
code = code.replace(oldVehiclesPut, newVehiclesPut);

fs.writeFileSync('src/server/routes.ts', code);
