// App modules
import express from 'express';
import cors from 'cors';
import { db } from './db.js';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Routes
import testingRoutes from './routes/api/testing.js';
import queryRoutes from './routes/api/queries.js';
import loginRoutes from './routes/api/account.js';
import itemRoutes from './routes/api/items.js';
import manifestRoutes from './routes/api/manifests.js';
import adjustmentRoutes from './routes/api/adjustments.js';

// Create Express app
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true, // Allow credentials (cookies)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

// Middleware to serve .html files without extension
app.use((req, res, next) => {
    if (req.method === 'GET' && req.path.indexOf('.') === -1) {
        const filePath = path.join(__dirname, '../client', req.path + '.html');
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            next();
        }
    } else {
        next();
    }
});

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '../client')));

// Test database connection
db.connect(err => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to database');
});

app.use('/api/testing', testingRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/account', loginRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/manifests', manifestRoutes);
app.use('/api/adjustments', adjustmentRoutes);

// API fallback for unknown endpoints
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Client fallback for unknown routes
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../client/404.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});