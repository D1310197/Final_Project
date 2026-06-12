import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err){
        console.error('資料庫連線失敗:', (err.message));
    } else {
        console.log('成功連線至 SQLite 資料庫');
    }
});

app.get('/professors', (req, res) => {
    db.all('SELECT * FROM professors', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message});
            return;
        }
        res.json({
            message: "success",
            data: rows
        });
    });
});

app.listen(port, () => {
    console.log(` 伺服器已啟動!`);
    console.log(`👉 請打開瀏覽器測試 API： http://localhost:${port}/professors`)
});