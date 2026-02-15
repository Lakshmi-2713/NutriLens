/**
 * Comparison and Analysis Engine for NutriLens
 * Compares current intake vs recommended targets and provides logic-based suggestions.
 */

const ComparisonEngine = {
    /**
     * Compares current totals with target values
     */
    compare(current, target) {
        const analysis = [];
        const keys = ['calories', 'protein', 'carbs', 'fat', 'fiber'];

        keys.forEach(key => {
            const consumed = current[key] || 0;
            const rec = target[key] || 0;
            const diff = consumed - rec;
            const percentDiff = rec > 0 ? (diff / rec) * 100 : 0;

            // Rule-based Analysis Logic
            if (key === 'calories') {
                if (Math.abs(diff) > 50) {
                    analysis.push({
                        type: diff > 0 ? 'warning' : 'info',
                        text: `You are ${Math.abs(Math.round(diff))} kcal ${diff > 0 ? 'above' : 'below'} your target.`
                    });
                    if (diff > rec * 0.1) {
                        analysis.push({ type: 'suggestion', text: 'Suggest adjusting portion sizes for your next meal.' });
                    }
                }
            }

            if (key === 'protein') {
                if (consumed < rec * 0.8) {
                    analysis.push({
                        type: 'warning',
                        text: `Protein intake is ${Math.abs(Math.round(diff))}g lower than recommended.`
                    });
                    analysis.push({ type: 'suggestion', text: 'Consider increasing protein-rich foods like eggs, chicken, or lentils.' });
                }
            }

            if (key === 'carbs') {
                if (percentDiff > 12) {
                    analysis.push({
                        type: 'warning',
                        text: `Carbs exceed recommendation by ${Math.round(percentDiff)}%.`
                    });
                }
            }

            if (key === 'fiber') {
                if (consumed < 20) {
                    analysis.push({
                        type: 'warning',
                        text: 'Fiber intake is below optimal range.'
                    });
                    analysis.push({ type: 'suggestion', text: 'Try adding more vegetables or whole grains to your diet.' });
                }
            }
        });

        if (analysis.length === 0) {
            analysis.push({ type: 'success', text: 'Your intake is perfectly aligned with your recommended plan! Keep it up.' });
        }

        return analysis;
    }
};

// Export for browser
window.ComparisonEngine = ComparisonEngine;
