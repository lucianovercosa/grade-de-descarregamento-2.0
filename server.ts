import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

async function initDb() {
  await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
  await fs.mkdir(path.join(process.cwd(), 'public', 'uploads'), { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify({
      users: {
        "admin-master-local": {
          id: "admin-master-local",
          email: "admin@local.com",
          role: "admin",
          name: "Administrador Master (Local)",
          permissions: ["manage_vehicles", "manage_products", "manage_users", "manage_responsibles", "manage_roles", "view_dashboard", "view_tv", "chat"]
        }
      },
      roles: {
        "admin": {
          id: "admin",
          name: "Administrador",
          permissions: ["manage_vehicles", "manage_products", "manage_users", "manage_responsibles", "manage_roles", "view_dashboard", "view_tv", "chat"]
        }
      },
      products: {},
      vehicles: {},
      responsibles: {},
      messages: {}
    }, null, 2));
  }
}

let dbCache: any = null;
async function readDb() {
  if (dbCache) return dbCache;
  const data = await fs.readFile(DB_PATH, 'utf-8');
  dbCache = JSON.parse(data);
  return dbCache;
}

async function writeDb(db: any) {
  dbCache = db;
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

app.get('/api/db', async (req, res) => {
  const db = await readDb();
  res.json(db);
});

app.post('/api/collections/:collection', async (req, res) => {
  const db = await readDb();
  const col = req.params.collection;
  if (!db[col]) db[col] = {};
  
  const id = req.body.id || crypto.randomUUID();
  const doc = { ...req.body, id };
  
  db[col][id] = doc;
  await writeDb(db);
  res.json({ id, ...doc });
});

app.put('/api/collections/:collection/:id', async (req, res) => {
  const db = await readDb();
  const { collection, id } = req.params;
  if (!db[collection]) db[collection] = {};
  
  db[collection][id] = { ...(db[collection][id] || {}), ...req.body, id };
  await writeDb(db);
  res.json(db[collection][id]);
});

app.delete('/api/collections/:collection/:id', async (req, res) => {
  const db = await readDb();
  const { collection, id } = req.params;
  if (db[collection] && db[collection][id]) {
    delete db[collection][id];
    await writeDb(db);
  }
  res.json({ success: true });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const db = await readDb();
  const users = Object.values(db.users || {}) as any[];
  
  const user = users.find(u => u.email === email);
  if (user) {
     res.json(user);
  } else {
     if (email === 'admin@local.com') {
         res.json(db.users['admin-master-local']);
     } else {
         res.status(401).json({ error: 'User not found' });
     }
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'public', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

async function start() {
  await initDb();
  
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Local Server running on port ${PORT}`);
  });
}
start();
