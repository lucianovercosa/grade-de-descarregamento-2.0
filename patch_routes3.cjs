const fs = require('fs');
let code = fs.readFileSync('src/server/routes.ts', 'utf8');

const postPattern = /router\.post\('\/vehicles', authMiddleware, async \(req, res\) => \{[\s\S]*?res\.json\(\{ id \}\);\n\s*\} catch \(err: any\) \{[\s\S]*?\}\n\}\);/s;

const newPost = `router.post('/vehicles', authMiddleware, async (req, res) => {
  const id = Date.now().toString();
  const data = req.body;
  if (!data.public_token) {
    data.public_token = Math.random().toString(36).substring(2, 10);
  }
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

if(code.match(postPattern)) {
    code = code.replace(postPattern, newPost);
} else {
    console.log("Could not find POST /vehicles");
}

fs.writeFileSync('src/server/routes.ts', code);
