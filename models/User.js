const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please provide your full name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8
    },
    profile: {
        age: Number,
        weight: Number,
        weightUnit: { type: String, default: 'kg' },
        height: Number,
        heightUnit: { type: String, default: 'cm' },
        dietType: { type: String, enum: ['veg', 'nonveg'], default: 'veg' },
        goal: { type: String, enum: ['lose', 'maintain', 'gain'], default: 'maintain' },
        commitment: { type: String, enum: ['consistent', 'balanced', 'intense'], default: 'balanced' },
        activityLevel: { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'], default: 'moderate' }
    },
    assignedHabits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Habit' }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update updatedAt before saving
userSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('User', userSchema);    