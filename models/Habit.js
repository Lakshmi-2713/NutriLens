const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String },
    icon: { type: String, default: 'check_circle' },
    category: { type: [String], default: ['general'] },
    tags: { type: [String], default: ['all'] }, // e.g., ['lose', 'veg', 'intense']
    difficulty: { type: Number, enum: [1, 2, 3], default: 1 } // 1: Easy, 2: Medium, 3: Hard
}, {
    timestamps: true
});

module.exports = mongoose.model('Habit', habitSchema);
