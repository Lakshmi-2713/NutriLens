const Habit = require('./models/Habit');

const initialHabits = [
    // Hydration
    { title: 'Stay Hydrated (2L)', subtitle: 'Drink 8 glasses of water today', icon: 'water_drop', category: ['hydration'], tags: ['all'], difficulty: 1 },
    { title: 'Advanced Hydration (3L)', subtitle: 'Optimal hydration for active days', icon: 'water_drop', category: ['hydration'], tags: ['all'], difficulty: 2 },
    { title: 'Elite Hydration (4.5L)', subtitle: 'Maximum hydration protocol', icon: 'water_drop', category: ['hydration'], tags: ['all', 'intense'], difficulty: 3 },

    // Activity
    { title: 'Morning Walk (15 min)', subtitle: 'Fresh air and light movement', icon: 'directions_walk', category: ['activity'], tags: ['all'], difficulty: 1 },
    { title: 'Active Steps (8k)', subtitle: 'Keep the body moving', icon: 'steps', category: ['activity'], tags: ['all'], difficulty: 2 },
    { title: 'HIIT Session (30 min)', subtitle: 'High intensity fat burn', icon: 'exercise', category: ['activity'], tags: ['lose', 'intense'], difficulty: 3 },
    { title: 'Strength Training', subtitle: 'Build lean muscle mass', icon: 'fitness_center', category: ['activity'], tags: ['gain', 'intense'], difficulty: 3 },

    // Nutrition
    { title: 'Protein Focus', subtitle: 'Ensure 20g+ protein in breakfast', icon: 'restaurant', category: ['nutrition'], tags: ['all'], difficulty: 1 },
    { title: 'Fiber Boost', subtitle: 'Eat 2 servings of green veggies', icon: 'grass', category: ['nutrition'], tags: ['veg', 'all'], difficulty: 1 },
    { title: 'Lean Meat Protein', subtitle: 'Focus on chicken or fish', icon: 'restaurant', category: ['nutrition'], tags: ['nonveg'], difficulty: 2 },
    { title: 'Zero Processed Sugar', subtitle: 'Avoid artificial sweeteners today', icon: 'block', category: ['nutrition'], tags: ['lose', 'all'], difficulty: 3 },

    // Mindset/Rest
    { title: 'Daily Gratitude', subtitle: 'Write down 3 things you are thankful for', icon: 'edit_note', category: ['mindset'], tags: ['all'], difficulty: 1 },
    { title: 'Mindful Meditation', subtitle: '10 minutes of guided focus', icon: 'self_improvement', category: ['mindset'], tags: ['all'], difficulty: 2 },
    { title: 'Quality Sleep (8h)', subtitle: 'Prioritize recovery and rest', icon: 'bedtime', category: ['mindset'], tags: ['all'], difficulty: 2 }
];

async function seedHabits() {
    try {
        const count = await Habit.countDocuments();
        if (count === 0) {
            await Habit.insertMany(initialHabits);
            console.log('✓ Successfully seeded initial habit pool');
        }
    } catch (err) {
        console.error('✗ Error seeding habits:', err);
    }
}

module.exports = seedHabits;
