import { Router } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../../db.js';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { authenticateToken } from '../../middleware/auth.js';

const upload = multer();
const router = Router();

router.post('/login', upload.none(), async (req, res) => {
    try {
        const { employeeID, password } = req.body;
        if (!employeeID || !password) {
            return res.status(400).json({ error: 'Missing employeeID or password' });
        }

        const [rows] = await db.query('SELECT employeeID, passwordHash, role, firstName, lastName FROM Employees WHERE employeeID = ?', [employeeID]);
        if (!rows.length) {
            return res.status(401).json({ error: 'Invalid employeeID or password' });
        }

        const isMatch = await bcrypt.compare(password, rows[0].passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid employeeID or password' });
        }

        const token = jwt.sign({ employeeID: rows[0].employeeID, role: rows[0].role, firstName: rows[0].firstName, lastName: rows[0].lastName }, process.env.JWT_SECRET, { expiresIn: '15m' });

        res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax', domain: 'localhost', maxAge: 15 * 60 * 1000 }); // 15 minutes

        res.json({ message: 'Login successful', success: true });
        

    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send('Error during login');
    }
});

router.post("/logout", (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    domain: "localhost",
    expires: new Date(0)
  });
  res.json({ message: "Logged out" });
});

router.get("/me", authenticateToken, (req, res) => {
    res.json({ employeeID: req.user.employeeID, role: req.user.role, name: `${req.user.firstName} ${req.user.lastName}` });
});

export default router;