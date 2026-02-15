/**
 * Goal Calculation Engine for NutriLens
 * Centralizes all health and nutrition calculations.
 */

const GoalEngine = {
    // Constants for Activity Factors
    ACTIVITY_FACTORS: {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
    },

    // Macro Distributions by Goal
    MACRO_SPLITS: {
        lose: { protein: 0.35, carbs: 0.40, fat: 0.25 },
        gain: { protein: 0.30, carbs: 0.45, fat: 0.25 },
        maintain: { protein: 0.25, carbs: 0.50, fat: 0.25 }
    },

    // Habit Recommendations by Goal
    HABIT_RECOMMENDATIONS: {
        lose: [
            { title: 'Step Goal', subtitle: '8,000+ steps/day', icon: 'steps' },
            { title: 'Training', subtitle: '3–4 strength sessions/week', icon: 'fitness_center' },
            { title: 'Nutrition', subtitle: 'Reduce sugar intake', icon: 'no_food' },
            { title: 'Rest', subtitle: 'Sleep 7–8 hours', icon: 'bedtime' }
        ],
        gain: [
            { title: 'Training', subtitle: '3 strength sessions/week', icon: 'fitness_center' },
            { title: 'Nutrition', subtitle: 'Calorie surplus tracking', icon: 'restaurant' },
            { title: 'Protein', subtitle: '1g protein per kg bodyweight', icon: 'egg' },
            { title: 'Rest', subtitle: 'Sleep 8 hours', icon: 'bedtime' }
        ],
        maintain: [
            { title: 'Step Goal', subtitle: '7,000 steps/day', icon: 'steps' },
            { title: 'Nutrition', subtitle: 'Balanced macro intake', icon: 'restaurant' },
            { title: 'Protein', subtitle: 'Maintain protein intake', icon: 'egg' },
            { title: 'Consistency', subtitle: 'Daily log tracking', icon: 'history' }
        ]
    },

    /**
     * Calculates Basal Metabolic Rate using Mifflin-St Jeor Equation
     */
    calculateBMR(profile) {
        const { age, gender, height, weight } = profile;
        if (gender === 'male') {
            return (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else {
            return (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }
    },

    /**
     * Calculates Total Daily Energy Expenditure
     */
    calculateTDEE(bmr, activityLevel) {
        const factor = this.ACTIVITY_FACTORS[activityLevel] || 1.2;
        return bmr * factor;
    },

    /**
     * Generates a complete health plan based on profile metrics
     */
    generatePlan(profile) {
        const bmr = this.calculateBMR(profile);
        const tdee = this.calculateTDEE(bmr, profile.activityLevel);

        // Goal Adjustment
        let targetCalories = tdee;
        if (profile.goal === 'lose') targetCalories -= 400;
        else if (profile.goal === 'gain') targetCalories += 400;

        // Safety Floor
        targetCalories = Math.max(targetCalories, 1200);

        // Macro Targets
        const split = this.MACRO_SPLITS[profile.goal] || this.MACRO_SPLITS.maintain;

        return {
            dailyTargets: {
                calories: parseFloat(targetCalories.toFixed(2)),
                protein: parseFloat(((targetCalories * split.protein) / 4).toFixed(2)),
                carbs: parseFloat(((targetCalories * split.carbs) / 4).toFixed(2)),
                fat: parseFloat(((targetCalories * split.fat) / 9).toFixed(2)),
                fiber: 30.00
            },
            recommendedHabits: this.HABIT_RECOMMENDATIONS[profile.goal] || this.HABIT_RECOMMENDATIONS.maintain
        };
    }
};

// Export for browser
window.GoalEngine = GoalEngine;
