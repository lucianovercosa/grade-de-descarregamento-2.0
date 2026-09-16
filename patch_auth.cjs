const fs = require('fs');
let code = fs.readFileSync('src/server/routes.ts', 'utf8');

const oldAuth = /const authMiddleware = \(req: any, res: any, next: any\) => \{[\s\S]*?res\.status\(401\)\.json\(\{ error: 'Invalid token' \}\);\n  \}\n\};/s;

const newAuth = `const authMiddleware = (req: any, res: any, next: any) => {
  let token = req.cookies && req.cookies.token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    console.log("No token found. Headers:", req.headers);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("Invalid token:", token, err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};`;

code = code.replace(oldAuth, newAuth);
fs.writeFileSync('src/server/routes.ts', code);
