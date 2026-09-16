const fs = require('fs');
let code = fs.readFileSync('src/server/routes.ts', 'utf8');

const authMid = `
const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
`;

// Remove original if exists
code = code.replace(/const authMiddleware.*?\} catch \(err\) \{\s*res\.status\(401\)\.json\(\{ error: 'Invalid token' \}\);\s*\}\s*\};\s*/s, '');

// Insert after JWT_SECRET
code = code.replace("const JWT_SECRET = 'super-secret-key-change-in-prod';", "const JWT_SECRET = 'super-secret-key-change-in-prod';" + authMid);

fs.writeFileSync('src/server/routes.ts', code);
