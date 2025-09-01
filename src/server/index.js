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
const port = 3003;

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

// Evaluation prompts
const EVALUATION_PROMPTS = {
    learningObjective: `
        You are an assistant that evaluates the "Test learning objective" section of an experiment brief.

        Evaluate ONLY against this rubric:

        • 2 points — Clear, concise, learning-focused; includes BOTH:
           (A) what we want to learn (the action/unknown) and
           (B) the expected user behavior or outcome (measurable or observable).
        • 1 point — Generally clear BUT vague on behavior or lacks precision in the outcome.
        • 0 points — Ambiguous, missing, or framed as a solution/implementation rather than a learning objective.

        Operational rules:
        1) Treat the input as the raw "Test learning objective" text. If it contains multiple objectives (bullets/lines), evaluate each separately.
        2) Evidence must quote a short excerpt from the objective being scored.
        3) If the text is empty or missing, return one item with score 0 and recommendation to add a clear learning objective framed as a question tied to behavior/outcomes.
        4) Keep reasons concise and factual. Do NOT provide chain-of-thought or step-by-step analysis; just state a brief justification.
        5) Recommendations should be prescriptive rewrites or concrete edits that move the objective to a 2-point standard.
        6) Output MUST be a strict JSON array of objects with this shape:
           {
             "score": 0 | 1 | 2,
             "reason": string,
             "evidence": string,   // short quote or excerpt
             "recommendation": string
           }
        
        Return the evaluation in this exact JSON format.
    `,
    rootCause: `
        Evaluate this root cause statement using these criteria:
        1. Length (1 Point): One or two sentences
        2. Format (1 Point): Uses "[trunk problem] because [reason]" format
        3. Focus (4 Points): Describes user problems without referencing solutions
        4. Clarity (4 Points): Logically and clearly explains WHY the problem exists

        Return the evaluation in this exact JSON format:
        {
            "score": 0,
            "summary": "Brief overall assessment",
            "details": {
                "length": "Score and explanation",
                "format": "Score and explanation",
                "focus": "Score and explanation",
                "clarity": "Score and explanation"
            }
        }
    `,
    supportingData: `
        Evaluate this supporting data using these criteria:
        1. Structure & Format (2 points): Clear bullet points
        2. Relevance (3 points): Directly supports root cause
        3. Clarity & Specificity (3 points): Clear and specific evidence
        4. Source Attribution (2 points): Clear data sources

        Return the evaluation in this exact JSON format:
        {
            "score": 0,
            "summary": "Brief overall assessment",
            "details": {
                "structure": "Score and explanation",
                "relevance": "Score and explanation",
                "clarity": "Score and explanation",
                "sources": "Score and explanation"
            }
        }
    `,
    hypothesis: `
        Evaluate this hypothesis using these criteria:
        1. Belief Statement (2 points): Present-tense belief
        2. Reason (2 points): Clear rationale
        3. Falsifiability (3 points): Testable/measurable
        4. Reflects Insights (3 points): Aligns with root cause

        Return the evaluation in this exact JSON format:
        {
            "score": 0,
            "summary": "Brief overall assessment",
            "details": {
                "belief": "Score and explanation",
                "reason": "Score and explanation",
                "falsifiability": "Score and explanation",
                "insights": "Score and explanation"
            }
        }
    `,
    prediction: `
        Evaluate this prediction using these criteria:
        1. Format (2 points): Clear "If... then..." structure
        2. Solution Alignment (3 points): References solution without details
        3. Testability (3 points): Measurable outcome
        4. Multiple Tests (2 points): Supports various implementations

        Return the evaluation in this exact JSON format:
        {
            "score": 0,
            "summary": "Brief overall assessment",
            "details": {
                "format": "Score and explanation",
                "solution": "Score and explanation",
                "testability": "Score and explanation",
                "flexibility": "Score and explanation"
            }
        }
    `
};

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// OpenAI test endpoint
app.get('/api/test-openai', async (req, res) => {
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
app.post('/api/evaluate-section', async (req, res) => {
    if (!openai) {
        return res.status(500).json({
            error: 'OpenAI client not initialized',
            section: req.body.section
        });
    }

    try {
        const { section, content } = req.body;
        
        if (!section || !content) {
            return res.status(400).json({
                error: 'Missing section or content'
            });
        }

        const prompt = EVALUATION_PROMPTS[section];
        if (!prompt) {
            return res.status(400).json({
                error: 'Invalid section type'
            });
        }

        // Function definition for OpenAI
        const functions = [
            {
                name: "evaluate_section",
                description: "Evaluates a section of an experiment document",
                parameters: {
                    type: "object",
                    properties: {
                        score: {
                            type: "number",
                            description: "The overall score for this section (0-10)"
                        },
                        summary: {
                            type: "string",
                            description: "A brief summary of the evaluation"
                        },
                        details: {
                            type: "object",
                            description: "Detailed evaluation of each criterion",
                            properties: {
                                length: { type: "string" },
                                format: { type: "string" },
                                focus: { type: "string" },
                                clarity: { type: "string" }
                            }
                        }
                    },
                    required: ["score", "summary", "details"]
                }
            }
        ];

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

        const functionCall = completion.choices[0].message.function_call;
        if (!functionCall) {
            throw new Error('No function call in response');
        }

        const evaluation = JSON.parse(functionCall.arguments);
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