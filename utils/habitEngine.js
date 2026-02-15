const Habit = require('../models/Habit');

/**
 * Habit Assignment Engine
 * Algorithmically selects habits from the pool based on user profile.
 */
class HabitEngine {
    static async assignHabits(userProfile) {
        const { goal, dietType, commitment, activityLevel } = userProfile;

        // 1. Fetch all available habits
        const habitPool = await Habit.find({});

        // 2. Filter by Hard Constraints (Diet & Goal)
        let candidates = habitPool.filter(h => {
            const isDietMatch = h.tags.includes('all') || h.tags.includes(dietType);
            const isGoalMatch = h.tags.includes('all') || h.tags.includes(goal);
            return isDietMatch && isGoalMatch;
        });

        // 3. Determine Scale based on Commitment
        const limits = { consistent: 3, balanced: 5, intense: 8 };
        const targetCount = limits[commitment] || 5;

        // 4. Selection Logic
        // Sort by difficulty matching commitment and variety of categories
        const shuffled = candidates.sort(() => 0.5 - Math.random());

        // Ensure we try to get one from each category first for variety
        const categories = [...new Set(candidates.map(h => h.category[0]))];
        const selected = [];
        const seenCategories = new Set();

        // Pass 1: Variety
        for (const cat of categories) {
            const habit = shuffled.find(h => h.category.includes(cat) && !selected.includes(h));
            if (habit && selected.length < targetCount) {
                selected.push(habit);
                seenCategories.add(cat);
            }
        }

        // Pass 2: Fill remaining slots
        for (const habit of shuffled) {
            if (!selected.includes(habit) && selected.length < targetCount) {
                selected.push(habit);
            }
        }

        return selected.map(h => h._id);
    }
}

module.exports = HabitEngine;
