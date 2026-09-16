import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { dbRun, dbGet, dbAll } from './db';

const router = Router();
const JWT_SECRET = 'super-secret-key-change-in-prod';
const authMiddleware = (req: any, res: any, next: any) => {
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
};


// File Uploads Config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// === AUTH ===
router.post('/auth/change-password', authMiddleware, async (req: any, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await dbGet<any>('SELECT * FROM users WHERE uid = ?', [req.user.uid]);
  
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(401).json({ error: 'Senha atual incorreta' });
  
  const hash = await bcrypt.hash(newPassword, 10);
  await dbRun('UPDATE users SET password = ?, must_change_password = 0 WHERE uid = ?', [hash, req.user.uid]);
  res.json({ success: true });
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const loginEmail = email.includes('@') ? email : `${email}@local.com`;
  
  const user = await dbGet<any>('SELECT * FROM users WHERE email = ?', [loginEmail]);
  if (!user || user.active === 0) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const role = await dbGet<any>('SELECT * FROM roles WHERE name = ?', [user.role]);
  const permissions = role && role.permissions ? JSON.parse(role.permissions) : [];

  const token = jwt.sign({ uid: user.uid, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  
  // Also get permissions
  if (user.role === 'admin' && !permissions.length) {
      permissions.push('manage_vehicles', 'manage_products', 'manage_users', 'manage_responsibles', 'manage_roles', 'view_dashboard', 'view_tv');
  }

  res.json({ token, user: { ...user, permissions } });
});

router.get('/auth/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await dbGet<any>('SELECT * FROM users WHERE uid = ?', [decoded.uid]);
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    const role = await dbGet<any>('SELECT * FROM roles WHERE name = ?', [user.role]);
    const permissions = role && role.permissions ? JSON.parse(role.permissions) : [];
    
    if (user.role === 'admin' && !permissions.length) {
      permissions.push('manage_vehicles', 'manage_products', 'manage_users', 'manage_responsibles', 'manage_roles', 'view_dashboard', 'view_tv');
    }

    res.json({ user: { ...user, permissions } });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Helper middleware for auth
// === FILE UPLOADS ===
router.post('/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

router.post('/upload-multiple', authMiddleware, upload.array('files', 10), (req, res) => {
  if (!req.files || (req.files as any[]).length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  const urls = (req.files as any[]).map(f => `/uploads/${f.filename}`);
  res.json({ urls });
});

// === CRUD ROUTES ===

// Vehicles
router.get('/vehicles', authMiddleware, async (req, res) => {
  const vehicles = await dbAll('SELECT * FROM vehicles ORDER BY created_at DESC');
  res.json(vehicles);
});

router.post('/vehicles', authMiddleware, async (req, res) => {
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
      `INSERT INTO vehicles (${fields.join(', ')}) VALUES (${placeholders})`,
      values
    );
    res.json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/vehicles/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  
  const fields = [];
  const values = [];
  
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(typeof value === 'object' && value !== null ? JSON.stringify(value) : value);
  }
  
  if (fields.length > 0) {
    values.push(id);
    try {
      await dbRun(`UPDATE vehicles SET ${fields.join(', ')} WHERE id = ?`, values);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.json({ success: true });
  }
});

router.delete('/vehicles/:id', authMiddleware, async (req, res) => {
  await dbRun('DELETE FROM vehicles WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// Products Catalog
router.get('/products', authMiddleware, async (req, res) => {
  const products = await dbAll('SELECT * FROM products ORDER BY code ASC');
  res.json(products);
});

router.post('/products/batch', authMiddleware, async (req, res) => {
  const { items } = req.body;
  let count = 0;
  for (const item of items) {
    if (item.code && item.description) {
      // Upsert
      await dbRun(
        'INSERT INTO products (code, description, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(code) DO UPDATE SET description=excluded.description, updated_at=CURRENT_TIMESTAMP',
        [String(item.code), item.description]
      );
      count++;
    }
  }
  res.json({ success: true, count });
});

// Roles
router.get('/roles', authMiddleware, async (req, res) => {
  const roles = await dbAll('SELECT * FROM roles');
  res.json(roles);
});

router.post('/roles', authMiddleware, async (req, res) => {
  const { id, name, permissions } = req.body;
  await dbRun(
    'INSERT INTO roles (id, name, permissions) VALUES (?, ?, ?)',
    [id, name, JSON.stringify(permissions || [])]
  );
  res.json({ success: true });
});

router.put('/roles/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, permissions } = req.body;
  await dbRun('UPDATE roles SET name = ?, permissions = ? WHERE id = ?', [name, JSON.stringify(permissions || []), id]);
  res.json({ success: true });
});

router.delete('/roles/:id', authMiddleware, async (req, res) => {
  await dbRun('DELETE FROM roles WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// Users
router.get('/users', authMiddleware, async (req, res) => {
  const users = await dbAll('SELECT uid, email, username, role, name, active, created_at FROM users');
  res.json(users);
});

router.post('/users', authMiddleware, async (req, res) => {
  const uid = Date.now().toString();
  const { email, password, role, name, must_change_password } = req.body;
  const loginEmail = email.includes('@') ? email : `${email}@local.com`;
  const username = email.split('@')[0];
  const hash = await bcrypt.hash(password || '123456', 10);
  
  await dbRun(
    'INSERT INTO users (uid, email, username, password, role, name, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [uid, loginEmail, username, hash, role, name, must_change_password ? 1 : 0]
  );
  res.json({ success: true });
});

router.put('/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { role, active, password, name } = req.body;
  const fields = [];
  const values = [];
  if (role !== undefined) { fields.push('role = ?'); values.push(role); }
  if (active !== undefined) { fields.push('active = ?'); values.push(active); }
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    fields.push('password = ?'); values.push(hash);
  }
  
  if (fields.length > 0) {
    values.push(id);
    await dbRun(`UPDATE users SET ${fields.join(', ')} WHERE uid = ?`, values);
  }
  res.json({ success: true });
});

router.delete('/users/:id', authMiddleware, async (req, res) => {
  await dbRun('DELETE FROM users WHERE uid = ?', [req.params.id]);
  res.json({ success: true });
});

// Responsibles
router.get('/responsibles', authMiddleware, async (req, res) => {
  const responsibles = await dbAll('SELECT * FROM responsibles');
  res.json(responsibles);
});

router.post('/responsibles', authMiddleware, async (req, res) => {
  const { id, name } = req.body;
  await dbRun('INSERT INTO responsibles (id, name) VALUES (?, ?)', [id, name]);
  res.json({ success: true });
});

router.put('/responsibles/:id', authMiddleware, async (req, res) => {
  const { name } = req.body;
  await dbRun('UPDATE responsibles SET name = ? WHERE id = ?', [name, req.params.id]);
  res.json({ success: true });
});

router.delete('/responsibles/:id', authMiddleware, async (req, res) => {
  await dbRun('DELETE FROM responsibles WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// Chat Messages
router.get('/chat_messages', authMiddleware, async (req, res) => {
  const messages = await dbAll('SELECT * FROM chat_messages ORDER BY created_at ASC');
  // parse JSON read_by
  res.json(messages.map((m: any) => ({ ...m, read_by: m.read_by ? JSON.parse(m.read_by) : [] })));
});

router.post('/chat_messages', authMiddleware, async (req, res) => {
  const id = Date.now().toString();
  const { text, user_id, user_name, reply_to } = req.body;
  await dbRun(
    'INSERT INTO chat_messages (id, text, user_id, user_name, reply_to, read_by) VALUES (?, ?, ?, ?, ?, ?)',
    [id, text, user_id, user_name, reply_to, JSON.stringify([user_id])]
  );
  res.json({ id });
});

router.post('/chat_messages/mark-read', authMiddleware, async (req, res) => {
  const { user_id } = req.body;
  const messages = await dbAll('SELECT id, read_by FROM chat_messages');
  for (const msg of messages as any[]) {
    const readBy = msg.read_by ? JSON.parse(msg.read_by) : [];
    if (!readBy.includes(user_id)) {
      readBy.push(user_id);
      await dbRun('UPDATE chat_messages SET read_by = ? WHERE id = ?', [JSON.stringify(readBy), msg.id]);
    }
  }
  res.json({ success: true });
});

export default router;
