const mongoose = require('mongoose');

const habitLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
    date: {
        type: String,
        required: true
    }, // Format: YYYY-MM-DD
    completed: { type: Boolean, default: false }
}, {
    timestamps: true
});

// Create index for quick lookups
habitLogSchema.index({ userId: 1, date: 1, habitId: 1 }, { unique: true });

module.exports = mongoose.model('HabitLog', habitLogSchema);
