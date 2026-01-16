// ==================== NutriLens Express Server ====================

const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve all static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Ignore favicon requests (prevents noise)
app.get('/favicon.ico', (req, res) => res.sendStatus(204));

// ==================== ROUTES ====================

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Register page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// ==================== API ====================

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// In-memory user store (replace with DB later)
const users = [];

// Register
app.post('/api/auth/register', (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(409).json({
            success: false,
            message: 'User already exists'
        });
    }

    const newUser = {
        id: `user_${Date.now()}`,
        fullName,
        email,
        password, // ⚠️ hash in production
        createdAt: new Date().toISOString()
    };

    users.push(newUser);

    const { password: _, ...safeUser } = newUser;

    res.status(201).json({
        success: true,
        message: 'Registration successful',
        user: safeUser,
        token: generateToken(newUser.id)
    });
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password required'
        });
    }

    const user = users.find(u => u.email === email);
    if (!user || user.password !== password) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    const { password: _, ...safeUser } = user;

    res.status(200).json({
        success: true,
        message: 'Login successful',
        user: safeUser,
        token: generateToken(user.id)
    });
});

// Protected profile route
app.get('/api/user/profile', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.userId);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
});

// ==================== HELPERS ====================

function generateToken(userId) {
    return Buffer.from(`${userId}:${Date.now()}`).toString('base64');
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token required'
        });
    }

    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [userId] = decoded.split(':');
        req.userId = userId;
        next();
    } catch {
        res.status(403).json({
            success: false,
            message: 'Invalid token'
        });
    }
}

// ==================== ERROR HANDLING ====================

// 404 handler (silent)
app.use((req, res) => {
    res.status(404).send('404 - Page Not Found');
});

// Global error handler (silent)
app.use((err, req, res, next) => {
    res.status(500).json({
        success: false,
        message: 'Internal Server Error'
    });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`
🌐 NutriLens Server Running
✅ Server started successfully at http://localhost:${PORT}
`);



});


module.exports = app;
