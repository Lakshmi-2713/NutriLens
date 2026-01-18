const express = require('express');
const router = express.Router();
const path = require('path');

// @route   GET /
// @desc    Serve home page
// @access  Public
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// @route   GET /login
// @desc    Serve login page
// @access  Public
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

// @route   GET /register
// @desc    Serve register page
// @access  Public
router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'register.html'));
});

// @route   GET /dashboard
// @desc    Serve dashboard page (protected on client-side)
// @access  Public (auth check done in frontend)
router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'dashboard.html'));
});

module.exports = router;