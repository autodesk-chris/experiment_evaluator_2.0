// Mock display manager
window.displayManager = {
    updateResults: (scores, feedback, totalScore) => {
        console.log('Display updated with:', { scores, feedback, totalScore });
    }
};

async function testLearningObjectiveEvaluation() {
    console.log('Testing client-side learning objective evaluation...');
    
    const evaluator = new window.evaluator();
    
    // Test cases
    const testCases = [
        {
            description: "Good learning objective",
            sections: {
                learningObjective: "How do users interact with the new navigation system and does it improve their task completion rate?"
            },
            expectedScoreRange: [1, 2] // We expect either 1 or 2 for a good objective
        },
        {
            description: "Missing learning objective",
            sections: {
                learningObjective: ""
            },
            expectedScoreRange: [0]
        },
        {
            description: "Solution-focused (should fail)",
            sections: {
                learningObjective: "Implement a new navigation bar to improve UX"
            },
            expectedScoreRange: [0]
        }
    ];

    let passed = 0;
    const total = testCases.length;

    for (const testCase of testCases) {
        console.log(`\nTesting: ${testCase.description}`);
        try {
            await evaluator.evaluate(testCase.sections);
            const score = evaluator.scores.learningObjective;
            const feedback = evaluator.feedback.learningObjective;

            console.log('Score:', score);
            console.log('Feedback:', feedback);

            const passed = testCase.expectedScoreRange.includes(score);
            console.log(`Test ${passed ? 'PASSED' : 'FAILED'}`);
            
            if (passed) passed++;
        } catch (error) {
            console.error('Test failed with error:', error);
        }
    }

    console.log(`\nTest Summary: ${passed}/${total} tests passed`);
    return passed === total;
}

// Run all tests
async function runAllTests() {
    console.log('Starting evaluator tests...\n');
    
    const results = await Promise.all([
        testLearningObjectiveEvaluation()
    ]);

    const allPassed = results.every(result => result);
    console.log(`\nOverall Test Summary: ${allPassed ? 'ALL PASSED' : 'SOME FAILED'}`);
    return allPassed;
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined' && window.runTests) {
    runAllTests()
        .then(success => {
            console.log('\nTest execution completed.');
            if (typeof window.testCallback === 'function') {
                window.testCallback(success);
            }
        })
        .catch(error => {
            console.error('Test execution failed:', error);
            if (typeof window.testCallback === 'function') {
                window.testCallback(false);
            }
        });
}

