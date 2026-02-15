// ==================== ERROR HANDLING ====================// NutriLens Express Server
const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import models
const User = require('./models/User');
const Habit = require('./models/Habit');
const HabitLog = require('./models/HabitLog');

// Import utils
const HabitEngine = require('./utils/habitEngine');
const seedHabits = require('./seedHabits');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nutrilens')
    .then(async () => {
        console.log('✓ Successfully connected to MongoDB');
        await seedHabits();
    })
    .catch(err => {
        console.error('✗ MongoDB connection error:', err);
        process.exit(1);
    });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (before routes)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filepath) => {
        if (filepath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (filepath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Redundant static paths removed as they are now handled by the 'public' static middleware above

// ==================== ROUTES ====================

// API Routes (must be before HTML routes)
// API: Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ==================== DASHBOARD DATA (Initial Mock) ====================
let dashboardData = {
    user: {
        name: 'Alex Rivera',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCK2fBgUoPcABSWzdyH_oGIXhhq28KRMLsB0q3SpAu1khcXuErum0EBA0i3t07U_eMD80_VlHVXhxAdjKsmgU45yq3ZiRk_KQJGxh-63qHMUaCvL2XhYVoVYhQfkwRHBps5Dq1TVZ9ca-AWw6BYqa7c9dgfbUsx95L3AjageZyrjjlSQpditoCnmWeRwsiRspFqKUviwvVZiIxR4qpL77iJNhqDBm0YOLwX4c9uGrIAuUQXN-WlQoFI6JI7EEmR1Uo10Nd8t63lvXxr',
        status: 'Premium Member',
        streak: 12
    },
    weeklyProgress: [
        { day: 'MON', percentage: 100, completed: true, isToday: false },
        { day: 'TUE', percentage: 100, completed: true, isToday: false },
        { day: 'WED', percentage: 60, completed: false, isToday: false },
        { day: 'THU', percentage: 75, completed: false, isToday: true },
        { day: 'FRI', percentage: 0, completed: false, isToday: false },
        { day: 'SAT', percentage: 0, completed: false, isToday: false },
        { day: 'SUN', percentage: 0, completed: false, isToday: false }
    ],
    nutrition: {
        caloriesLeft: 1640,
        protein: { current: 94, goal: 140 },
        carbs: { current: 180, goal: 220 },
        fats: { current: 52, goal: 70 }
    },
    habits: [
        {
            id: 1,
            title: 'Drink 2.5L Water',
            subtitle: 'Daily Goal: 2,500ml • Current: 2,600ml',
            completed: true
        },
        {
            id: 2,
            title: '15 Min Mindfulness Meditation',
            subtitle: 'Morning Routine • 5 Day Streak',
            completed: false
        },
        {
            id: 3,
            title: 'Post-Lunch Walk (20 min)',
            subtitle: 'Active Habit • Optimal for Digestion',
            completed: false
        },
        {
            id: 4,
            title: 'Daily Vitamin Intake',
            subtitle: 'Omega 3, Vitamin D, Magnesium',
            completed: true
        }
    ],
    meals: [
        {
            id: 1,
            type: 'Breakfast',
            name: 'Berry & Oat Bowl',
            calories: 340,
            protein: 15,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASu72XKq_TLrSI1AgkEjZjZvLMLuQbos96y4rdKUwK5U8__NeWTJyKImUqL-VRokk700wbz0H7tmoCgumxv2iE0XdKSCZUyspg5o2yeZCkhWvUPP1s2ohDHc-Rk-ET4HUf19EGxg2HTG8FRIKnFDOpsTdPbgP0L-8w28RfC4-Nt6mdnGC7zsZV2gfAe2Gnvxi9su86Rywsd9pdbakPp_yL9VmIG5It6Isq8WnUU7Wy5ZXJOBWkTZLyNmCz12WR6fuWqXuA2ZjW14Fz',
            status: 'DONE'
        },
        {
            id: 2,
            type: 'Lunch',
            name: 'Mediterranean Salad',
            calories: 520,
            protein: 32,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChYLteDVYsdVe1lJ-NrzALEdI5-Q6rgyxoe7iOv7Cn23bmClNyJoqOiz4jdVo1sogSqTT4x6st_SqZV-77_EI8xau5O9S3VOOlooQoRhZ7oByUK3XUwBpwzDXKSP7-p4Pt8WQQjMlYsyJ1Hi_P41pm81QfmunXOhKMVug2iCeHshAmnHYWUTqkYLKx47aPlZ05SK2HjAiulowY7Hk0ZVd0Q_Iymc2bdEvBFqvBmNfdKRVPPYcT_wRQpGFlKL7HLE-aRUOU8arlwdXS',
            status: 'EATING NOW'
        },
        {
            id: 3,
            type: 'Dinner',
            name: 'Grilled Salmon',
            calories: 610,
            protein: 42,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWnr0KhEnqQX-zyKx5jruJAM7DXWu1NEmtg6QMuP-IVXeKoRd3Ic9G52blpbnCgY5M9R80tpMMMUESikFq5WCjhEyPMgNA9imQw9UPPPv72JVHL9ypoUhQOVySSYk6l5IoyRLEyHm-V8TRr-GsWqOXgVOxXL1qTc-hTLnrgOkZ8v9yWhwArO_3RoIjAJPnK_-miCH93kiyT8pHYAlzy2z-8JMdHG8XC2R4kZ-JSFrT0bcuN1kyrwUz1NXqAM1Nv5t0cqA1ikvgdQ-q',
            status: null
        },
        {
            id: 4,
            type: 'Snack',
            name: 'Not Logged Yet',
            calories: 0,
            protein: 0,
            image: null,
            status: null
        }
    ]
};

// User Profile Data
let userProfile = {
    age: 24,
    weight: 68.5,
    weightUnit: 'kg',
    height: 175,
    heightUnit: 'cm',
    dietType: 'veg',
    goal: 'maintain'
};

// ==================== HELPER FUNCTIONS ====================
function calculateBMR(profile) {
    const { age, weight, height, gender = 'female' } = profile;
    if (gender === 'male') {
        return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
}

function calculateDailyCalories(profile) {
    const bmr = calculateBMR(profile);
    const activityMultiplier = 1.55;
    let calories = bmr * activityMultiplier;
    if (profile.goal === 'lose') calories -= 500;
    else if (profile.goal === 'gain') calories += 500;
    return Math.round(calories);
}

function calculateMacros(calories, dietType) {
    let proteinPercent = 0.30, carbsPercent = 0.40, fatsPercent = 0.30;
    if (dietType === 'veg') {
        proteinPercent = 0.25; carbsPercent = 0.50; fatsPercent = 0.25;
    }
    return {
        protein: Math.round((calories * proteinPercent) / 4),
        carbs: Math.round((calories * carbsPercent) / 4),
        fats: Math.round((calories * fatsPercent) / 9)
    };
}

// ==================== ROUTES ====================

// HTML Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// API: Dashboard overview
app.get('/api/dashboard', (req, res) => {
    res.json(dashboardData);
});

// ==================== API ENDPOINTS ====================

// API: Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // Validation
        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            fullName,
            email: email.toLowerCase(),
            password: hashedPassword
        });

        await newUser.save();

        // Send response (exclude password)
        const userResponse = {
            id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            createdAt: newUser.createdAt
        };

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: userResponse,
            token: generateToken(newUser._id)
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// API: Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Send response (exclude password)
        const userResponse = {
            id: user._id,
            fullName: user.fullName,
            email: user.email
        };

        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: userResponse,
            token: generateToken(user._id)
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// API: Get user profile info
app.get('/api/user', (req, res) => {
    res.json(dashboardData.user);
});

// API: Get user profile settings
app.get('/api/profile', (req, res) => {
    res.json(userProfile);
});

// API: Save/Update user profile + Auto-assign habits
app.post('/api/profile', async (req, res) => {
    try {
        const { age, weight, weightUnit, height, heightUnit, dietType, goal, commitment, activityLevel } = req.body;

        // In a real app, we'd get userId from token (authenticateToken)
        // For this demo, we'll use a fixed user or create one if not exists
        let user = await User.findOne({ email: 'alex.rivera@example.com' });
        if (!user) {
            user = new User({ fullName: 'Alex Rivera', email: 'alex.rivera@example.com', password: 'password123' });
        }

        user.profile = {
            age: age || user.profile?.age,
            weight: weight || user.profile?.weight,
            weightUnit: weightUnit || user.profile?.weightUnit || 'kg',
            height: height || user.profile?.height,
            heightUnit: heightUnit || user.profile?.heightUnit || 'cm',
            dietType: dietType || user.profile?.dietType || 'veg',
            goal: goal || user.profile?.goal || 'maintain',
            commitment: commitment || user.profile?.commitment || 'balanced',
            activityLevel: activityLevel || user.profile?.activityLevel || 'moderate'
        };

        // Trigger Habit Assignment Engine
        const assignedHabitIds = await HabitEngine.assignHabits(user.profile);
        user.assignedHabits = assignedHabitIds;

        await user.save();

        // Update legacy mock constants for compatibility with existing UI
        userProfile = { ...userProfile, ...user.profile };
        const dailyCalories = calculateDailyCalories(user.profile);
        const macros = calculateMacros(dailyCalories, user.profile.dietType);
        dashboardData.nutrition.protein.goal = macros.protein;
        dashboardData.nutrition.carbs.goal = macros.carbs;
        dashboardData.nutrition.fats.goal = macros.fats;

        res.json({
            success: true,
            message: 'Profile saved and habits assigned successfully',
            redirect: '/dashboard' // In our app, Habit Library is a page within dashboard
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ success: false, message: 'Server error during profile update' });
    }
});

// API: Get weekly progress
app.get('/api/weekly-progress', (req, res) => {
    res.json(dashboardData.weeklyProgress);
});

// API: Get nutrition data
app.get('/api/nutrition', (req, res) => {
    res.json(dashboardData.nutrition);
});

// API: Update nutrition current values
app.patch('/api/nutrition', (req, res) => {
    const { protein, carbs, fats } = req.body;
    if (protein !== undefined) dashboardData.nutrition.protein.current = protein;
    if (carbs !== undefined) dashboardData.nutrition.carbs.current = carbs;
    if (fats !== undefined) dashboardData.nutrition.fats.current = fats;
    const totalConsumed = (dashboardData.nutrition.protein.current * 4) + (dashboardData.nutrition.carbs.current * 4) + (dashboardData.nutrition.fats.current * 9);
    const totalGoal = (dashboardData.nutrition.protein.goal * 4) + (dashboardData.nutrition.carbs.goal * 4) + (dashboardData.nutrition.fats.goal * 9);
    dashboardData.nutrition.caloriesLeft = Math.round(totalGoal - totalConsumed);
    res.json({ success: true, nutrition: dashboardData.nutrition });
});

// API: Get daily habits (Assigned + Today's logs)
app.get('/api/habits/daily', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const user = await User.findOne({ email: 'alex.rivera@example.com' }).populate('assignedHabits');

        if (!user) {
            // Return empty habits array for new users instead of 404 to prevent JS crash
            return res.json([]);
        }

        const logs = await HabitLog.find({
            userId: user._id,
            date: today
        });

        const habitsWithStatus = user.assignedHabits.map(habit => {
            const log = logs.find(l => l.habitId.toString() === habit._id.toString());
            return {
                ...habit.toObject(),
                id: habit._id, // Add id for frontend compatibility
                completed: log ? log.completed : false
            };
        });

        res.json(habitsWithStatus);
    } catch (error) {
        console.error('Fetch habits error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching habits' });
    }
});

// API: Toggle daily habit
app.patch('/api/habits/:id/toggle', async (req, res) => {
    try {
        const habitId = req.params.id;
        const today = new Date().toISOString().split('T')[0];

        const user = await User.findOne({ email: 'alex.rivera@example.com' });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        let log = await HabitLog.findOne({
            userId: user._id,
            habitId: habitId,
            date: today
        });

        if (log) {
            log.completed = !log.completed;
            await log.save();
        } else {
            log = new HabitLog({
                userId: user._id,
                habitId: habitId,
                date: today,
                completed: true
            });
            await log.save();
        }

        res.json({ success: true, completed: log.completed });
    } catch (error) {
        console.error('Toggle habit error:', error);
        res.status(500).json({ success: false, message: 'Server error toggling habit' });
    }
});

// API: Delete habit
app.delete('/api/habits/:id', (req, res) => {
    const habitId = parseInt(req.params.id);
    const habitIndex = dashboardData.habits.findIndex(h => h.id === habitId);
    if (habitIndex === -1) return res.status(404).json({ success: false, message: 'Habit not found' });
    dashboardData.habits.splice(habitIndex, 1);
    res.json({ success: true, message: 'Habit deleted' });
});

// API: Get meals
app.get('/api/meals', (req, res) => {
    res.json(dashboardData.meals);
});

// API: Update meal status
app.patch('/api/meals/:id', (req, res) => {
    const mealId = parseInt(req.params.id);
    const meal = dashboardData.meals.find(m => m.id === mealId);
    if (!meal) return res.status(404).json({ success: false, message: 'Meal not found' });
    if (req.body.status !== undefined) meal.status = req.body.status;
    res.json({ success: true, meal });
});

// API: Search
app.get('/api/search', (req, res) => {
    const query = req.query.q?.toLowerCase() || '';
    if (!query) return res.json({ habits: dashboardData.habits, meals: dashboardData.meals });
    const h = dashboardData.habits.filter(x => x.title.toLowerCase().includes(query) || x.subtitle.toLowerCase().includes(query));
    const m = dashboardData.meals.filter(x => x.name.toLowerCase().includes(query) || x.type.toLowerCase().includes(query));
    res.json({ habits: h, meals: m });
});

// API: Update streak
app.patch('/api/user/streak', (req, res) => {
    if (req.body.streak !== undefined) dashboardData.user.streak = req.body.streak;
    res.json({ success: true, user: dashboardData.user });
});

// API: Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ==================== MIDDLEWARE FUNCTIONS ====================

// JWT token generation
function generateToken(userId) {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET || 'your_fallback_secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_fallback_secret');
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
}

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ==================== START SERVER ====================

const server = app.listen(PORT, () => {
    console.log(`


   • Home:     http://localhost:${PORT}                   
     
        `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = app;