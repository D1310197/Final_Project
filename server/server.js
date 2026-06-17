import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const allowedOrigins = new Set([
    'http://localhost:5173',
    'http://localhost:3000',
    'https://tutorsearch-b0gbfnhcd4dudxdh.japaneast-01.azurewebsites.net'
]);

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('資料庫連線失敗:', (err.message));
    } else {
        console.log('成功連線至 SQLite 資料庫');
    }
});

const getProfessors = (req, res) => {
    db.all('SELECT * FROM professors', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            message: "success",
            data: rows
        });
    });
};

app.get('/professors', getProfessors);
app.get('/api/professors', getProfessors);

// 託管前端編譯後的靜態檔案
const frontendDistPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(frontendDistPath));

// SPA Catch-all 路由 (使用 app.use 避免 Express 5 path-to-regexp 語法衝突)
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && req.path !== '/professors') {
        return res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
    next();
});

app.listen(port, () => {
    console.log(` 伺服器已啟動!`);
    console.log(`本機 API： http://localhost:${port}/api/professors`);
    console.log('Azure 網站：https://tutorsearch-b0gbfnhcd4dudxdh.japaneast-01.azurewebsites.net');
});
