import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Garantir que a pasta uploads existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configuração do multer para salvar os arquivos fisicamente
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Mantém o nome original mas adiciona um número único para evitar arquivos com mesmo nome
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, baseName + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// Rota para receber os arquivos
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }
  // Retorna o caminho que o frontend deve usar para acessar a imagem
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Servir os arquivos da pasta uploads para que possam ser visualizados
app.use('/uploads', express.static(uploadsDir));

// Servir arquivos estáticos da pasta dist (gerada pelo vite build)
app.use(express.static(path.join(__dirname, 'dist')));

// Redirecionar todas as outras rotas para o index.html (para o React Router funcionar)
app.get('*all', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor Node.js rodando na porta ${PORT}`);
});
