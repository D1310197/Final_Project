import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);
const dbPath = process.env.DB_PATH || path.resolve(__dirname, '..', 'database.sqlite');

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const db = new sqlite3.Database(dbPath);

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) reject(error);
      else resolve(rows);
    });
  });
}

app.get('/api/health', (req, res) => {
  res.json({ message: 'success', service: 'teacher-search-server' });
});

app.get(['/api/professors', '/professors'], async (req, res) => {
  try {
    const rows = await all('SELECT id, name, description FROM professors ORDER BY id ASC');
    res.json({ message: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ message: 'error', error: error.message });
  }
});

process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Teacher Search API running at http://localhost:${port}`);
});
