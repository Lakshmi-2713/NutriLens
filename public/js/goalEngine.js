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
     * Calculates BMR using Mifflin-St Jeor Equation
     */
    calculateBMR(profile) {
        const weight = parseFloat(profile.weight);
        const height = parseFloat(profile.height);
        const age = parseFloat(profile.age);

        let bmr = (10 * weight) + (6.25 * height) - (5 * age);
        bmr += (profile.gender === 'male') ? 5 : -161;
        return bmr;
    },

    /**
     * Calculates TDEE based on BMR and Activity Factor
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

        // Step 3 - Adjust Calories
        let targetCalories = tdee;
        if (profile.goal === 'lose') targetCalories -= 500;
        else if (profile.goal === 'gain') targetCalories += 500;

        // Safety Floor
        const minCalories = profile.gender === 'female' ? 1200 : 1500;
        targetCalories = Math.max(Math.round(targetCalories), minCalories);

        // Step 4 - Macros
        let proteinMultiplier = 1.6;
        if (profile.goal === 'lose') proteinMultiplier = 1.8;
        else if (profile.goal === 'gain') proteinMultiplier = 2.0;

        const proteinGrams = Math.round(profile.weight * proteinMultiplier);
        const fatCalories = targetCalories * 0.25;
        const fatGrams = Math.round(fatCalories / 9);

        const proteinCalories = proteinGrams * 4;
        const carbsCalories = targetCalories - proteinCalories - fatCalories;
        const carbsGrams = Math.max(0, Math.round(carbsCalories / 4)); // Prevent negative carbs

        // Step 5 - Additional Targets
        const fiberGrams = Math.round((targetCalories / 1000) * 14);
        const waterLiters = parseFloat(((profile.weight * 35) / 1000).toFixed(1));

        // Step 7 - Tone Message
        let message = "Your plan supports maintaining your current weight and energy balance.";
        if (profile.goal === 'lose') {
            message = "You are on a calorie deficit plan designed for healthy fat loss.";
        } else if (profile.goal === 'gain') {
            message = "You are on a calorie surplus plan to support muscle and weight gain.";
        }

        return {
            bmr: Math.round(bmr),
            tdee: Math.round(tdee),
            message: message,
            dailyTargets: {
                calories: targetCalories,
                protein: proteinGrams,
                carbs: carbsGrams,
                fat: fatGrams,
                fiber: fiberGrams,
                water: waterLiters
            },
            recommendedHabits: this.HABIT_RECOMMENDATIONS[profile.goal] || this.HABIT_RECOMMENDATIONS.maintain
        };
    }
};

// Export for browser
window.GoalEngine = GoalEngine;
