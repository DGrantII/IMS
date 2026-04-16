import { Router } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../../db.js';
import multer from 'multer';
import jwt from 'jsonwebtoken';

const upload = multer();

const router = Router();

router.get('/hash', async (req, res) => {
    const password = process.env.ADMIN_PASSWORD;
    try {
        const hash = await bcrypt.hash(password, 10);
        res.json({ password, hash });
    } catch (err) {
        console.error('Error hashing password:', err);
        res.status(500).send('Error hashing password');
    }
});

router.post('/compare', upload.none(), async (req, res) => {
    try {
        if (!req.body.password || !req.body.employeeID) {
            throw new Error('Missing password or employeeID');
        }

        const { password, employeeID } = req.body;
        const [rows] = await db.query('SELECT passwordHash FROM Employees WHERE employeeID = ?', [employeeID]);
        if (!rows.length) {
            throw new Error('Employee not found');
        }
        const isMatch = await bcrypt.compare(password, rows[0].passwordHash);

        res.json({ isMatch });

    } catch (err) {
        console.error('Error comparing password:', err);
        res.status(500).send('Error comparing password');
    }
});

export default router;