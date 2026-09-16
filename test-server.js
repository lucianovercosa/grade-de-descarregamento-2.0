import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const uploadsDir = path.join(__dirname, 'uploads');

app.use('/uploads', express.static(uploadsDir));
app.get('*', (req, res) => {
  res.send('FALLBACK');
});

app.listen(3001, () => {
  console.log('Test server running');
});
