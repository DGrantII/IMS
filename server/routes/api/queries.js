import { Router } from 'express';
//import bcrypt from 'bcrypt';
import { db } from '../../db.js';
//import multer from 'multer';
//import jwt from 'jsonwebtoken';
import authenticateToken from '../../middleware/auth.js';

//const upload = multer();
const router = Router();

function requirePrivileged(req, res, next) {
  if (req.user.role !== "Privileged") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

router.get('/test', async (req, res) => {
    const sql = 'SELECT * FROM Items LIMIT 10';
    try {
        const [rows, fields] = await db.query(sql);
        res.json(rows);
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).send('Error executing query');
    }
});

export default router;