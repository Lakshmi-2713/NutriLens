const mongoose = require('mongoose');

const nutritionLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // Store as a Date object – always start of day UTC for easy range queries
    date: {
        type: Date,
        required: true,
        index: true
    },
    foodName: {
        type: String,
        required: true,
        trim: true
    },
    mealType: {
        type: String,
        enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'],
        default: 'Lunch'
    },
    quantity: {
        type: Number,   // grams
        required: true,
        min: 0
    },
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    icon: { type: String, default: 'restaurant' }
}, {
    timestamps: true
});

// Compound index for fast per-user date-range lookups
nutritionLogSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('NutritionLog', nutritionLogSchema);
