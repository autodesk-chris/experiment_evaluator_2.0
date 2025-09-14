const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    process.exit(1);
});

console.log('Starting server initialization...');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Check for required environment variables
if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY is not set in environment variables');
    process.exit(1);
}

// Initialize OpenAI
let openai;
try {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
} catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    process.exit(1);
}

// Import evaluation prompts and functions
const { EVALUATION_PROMPTS, getFunctionForSection } = require('../functions/evaluateSection.js');

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// OpenAI test endpoint
app.get('/test-openai', async (req, res) => {
    if (!openai) {
        return res.status(500).json({
            success: false,
            error: 'OpenAI client not initialized'
        });
    }

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: 'Say "OpenAI API is working correctly!"' }],
            max_tokens: 20
        });

        res.json({
            success: true,
            message: completion.choices[0].message.content
        });
    } catch (error) {
        console.error('OpenAI API Test Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Evaluation endpoint
app.post('/evaluate-section', async (req, res) => {
    if (!openai) {
        return res.status(500).json({
            error: 'OpenAI client not initialized',
            section: req.body.section
        });
    }

    try {
        console.log('Received evaluation request:', {
            section: req.body.section,
            content: req.body.content
        });
        
        const { section, content } = req.body;
        
        if (!section || !content) {
            console.error('Missing required fields:', { section, content });
            return res.status(400).json({
                error: 'Missing section or content'
            });
        }

        const prompt = EVALUATION_PROMPTS[section];
        if (!prompt) {
            console.error('Invalid section type:', section);
            return res.status(400).json({
                error: 'Invalid section type'
            });
        }
        
        console.log('Using prompt for section:', section);

        // Get the appropriate function definition for this section
        const functions = getFunctionForSection(section);

        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert experiment evaluator. Evaluate the content based on the provided criteria and return a structured evaluation.'
                },
                {
                    role: 'user',
                    content: `${prompt}\n\nContent to evaluate:\n${content}`
                }
            ],
            functions,
            function_call: { name: 'evaluate_section' },
            temperature: 0.3,
            max_tokens: 1000
        });

        console.log('OpenAI API Response:', {
            section,
            choice: completion.choices[0],
            message: completion.choices[0].message,
            function_call: completion.choices[0].message.function_call
        });

        const functionCall = completion.choices[0].message.function_call;
        if (!functionCall) {
            throw new Error('No function call in response');
        }

        console.log('Function call arguments (raw):', functionCall.arguments);
        
        const evaluation = JSON.parse(functionCall.arguments);
        console.log('Parsed evaluation:', evaluation);
        
        res.json(evaluation);
    } catch (error) {
        console.error('Evaluation error:', error);
        res.status(500).json({
            error: 'Failed to evaluate content',
            details: error.message,
            section: req.body.section
        });
    }
});

// Start server
const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}).on('error', (error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
}); 