import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fallbackProfessors from './professors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const allowedOrigins = new Set([
    'http://localhost:5173',
    'http://localhost:3000',
    'https://tutorsearch-b0gbfnhcd4dudxdh.japaneast-01.azurewebsites.net'
]);

let db = null;
let dbStatus = 'fallback';

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
});

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

try {
    const sqlite3 = await import('sqlite3');
    const dbPath = path.resolve(__dirname, 'database.sqlite');
    db = new sqlite3.default.Database(dbPath, (err) => {
        if (err) {
            db = null;
            dbStatus = `fallback: ${err.message}`;
            console.error('SQLite connection failed, using fallback data:', err.message);
            return;
        }
        dbStatus = 'sqlite';
        console.log('SQLite database connected.');
    });
} catch (error) {
    dbStatus = `fallback: ${error.message}`;
    console.error('SQLite module failed to load, using fallback data:', error);
}

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        dataSource: dbStatus,
        professorCount: fallbackProfessors.length
    });
});

const getProfessors = (req, res) => {
    if (!db) {
        res.json({
            message: 'success',
            data: fallbackProfessors
        });
        return;
    }

    db.all('SELECT * FROM professors', [], (err, rows) => {
        if (err) {
            console.error('SQLite query failed, using fallback data:', err.message);
            res.json({
                message: 'success',
                data: fallbackProfessors
            });
            return;
        }
        res.json({
            message: 'success',
            data: rows
        });
    });
};

app.get('/professors', getProfessors);
app.get('/api/professors', getProfessors);

const frontendDistPath = path.resolve(__dirname, '../client/dist');
app.use('/assets', express.static(path.join(frontendDistPath, 'assets'), {
    immutable: true,
    maxAge: '1y'
}));
app.use(express.static(frontendDistPath, {
    maxAge: 0
}));

app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && req.path !== '/professors') {
        return res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
            if (err) {
                console.error('Failed to serve frontend:', err.message);
                res.status(500).send('Frontend build not found. Please run npm run build.');
            }
        });
    }
    next();
});

app.listen(port, () => {
    console.log(`Server started on port ${port}.`);
    console.log(`Health check: /api/health`);
});
