import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const now = Math.floor(Date.now() / 1000);
        const timeLeft = decoded.exp - now;

        // If less than 5 minutes left, renew the token
        if (timeLeft < 300) { // 5 minutes in seconds
            const newToken = jwt.sign({ employeeID: decoded.employeeID, role: decoded.role, firstName: decoded.firstName, lastName: decoded.lastName }, process.env.JWT_SECRET, { expiresIn: '15m' });
            res.cookie('token', newToken, { httpOnly: true, secure: false, sameSite: 'lax', domain: 'localhost', maxAge: 15 * 60 * 1000 });
        }

        req.user = decoded;
        next();
    } catch (err) {
        console.error('Error verifying token:', err);
        res.status(403).json({ error: 'Invalid token' });
    }
}

const requirePrivileged = (req, res, next) => {
  if (req.user.role !== "Privileged" && req.user.role !== "Admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

export { authenticateToken, requirePrivileged, requireAdmin };