const { OpenAI } = require('openai');
require('dotenv').config();

// Test cases
const TEST_CASES = {
    good: {
        input: "How do users interact with the new navigation system and does it improve their task completion rate?",
        expectedScore: 2
    },
    vague: {
        input: "Understanding user behavior with the navigation",
        expectedScore: 1
    },
    solution_focused: {
        input: "Implement a new navigation bar to improve UX",
        expectedScore: 0
    },
    empty: {
        input: "",
        expectedScore: 0
    },
    multiple_objectives: {
        input: "How do users navigate the system? What features do they use most? Does the new layout improve efficiency?",
        expectedScore: 2
    }
};

async function runTest(testCase, description) {
    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        console.log(`\nTesting: ${description}`);
        console.log(`Input: "${testCase.input}"`);

        const response = await fetch('http://localhost:3003/api/evaluate-section', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                section: 'learningObjective',
                content: testCase.input
            })
        });

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const result = await response.json();
        const evaluations = Array.isArray(result) ? result : [result];
        const highestScore = Math.max(...evaluations.map(e => e.score));

        console.log('Result:', JSON.stringify(result, null, 2));
        console.log(`Expected score: ${testCase.expectedScore}`);
        console.log(`Actual highest score: ${highestScore}`);
        console.log(`Test ${highestScore === testCase.expectedScore ? 'PASSED' : 'FAILED'}`);

        return highestScore === testCase.expectedScore;
    } catch (error) {
        console.error('Test failed with error:', error);
        return false;
    }
}

async function runAllTests() {
    console.log('Starting Learning Objective evaluation tests...\n');
    
    let passed = 0;
    const total = Object.keys(TEST_CASES).length;

    for (const [description, testCase] of Object.entries(TEST_CASES)) {
        if (await runTest(testCase, description)) {
            passed++;
        }
    }

    console.log(`\nTest Summary: ${passed}/${total} tests passed`);
    return passed === total;
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests()
        .then(success => {
            console.log('\nTest execution completed.');
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { runAllTests, TEST_CASES };
