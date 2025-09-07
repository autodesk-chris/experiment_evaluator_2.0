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
    `,
    testVariant: `
        You are an assistant that evaluates the "Test Variant Description" section of an experiment brief.

        Evaluate ONLY against this rubric:

        • 2 points: Must meet ALL of these criteria:
           (A) Clear explanation of the variant experience that users will receive
           (B) Explicitly describes how it differs from the existing/control experience
           (C) Includes visibility of CTA (call-to-action) and user interaction expectations
           (D) Provides sufficient implementation details to understand the user journey
        • 1 point: Has some clarity but either:
           - Missing important implementation details, OR
           - Hard to distinguish from control group, OR
           - Unclear about user interaction expectations or CTA visibility
        • 0 points: Vague, confusing, or not clearly different from the control group

        Operational rules:
        1) The description MUST clearly differentiate the test variant from the control to receive 2 points.
        2) Evidence must quote the specific text being evaluated.
        3) If the text is empty or missing, return score 0 with recommendation to add a clear test variant description.
        4) Keep reasons concise and factual.
        5) Recommendations should suggest how to:
           - Make the variant experience more specific and detailed
           - Clarify how it differs from the control experience
           - Add missing implementation details about CTAs and user interactions
           - Improve clarity of the user journey in the test variant
        6) Output MUST be a strict JSON object with this shape:
           {
             "score": 0 | 1 | 2,
             "reason": string,
             "evidence": string,   // quote from the test variant description
             "recommendation": string
           }

        Return the evaluation in this exact JSON format.
    `,
    controlVariant: `
        You are an assistant that evaluates the "Control Variant Description" section of an experiment brief.

        Evaluate ONLY against this rubric:

        • 2 points: Must meet ALL of these criteria:
           (A) The statement provides a clear reference to an existing user flow
           (B) Provides sufficient detail for someone unfamiliar with the experience to understand what it is
           (C) Represents a true baseline that doesn't overlap with the test variant
        • 1 point: Has some clarity but either:
           - Mostly clear but lacks sufficient detail for reasonable understanding, OR
           - Somewhat vague about the baseline state, OR
           - Unclear reference to existing user flow
        • 0 points: Unclear, not a true baseline, or overlaps too much with the test variant

        Operational rules:
        1) The statement should clearly reference an existing experience and provide sufficient detail that someone unfamiliar with the experience has a reasonable understanding.
        2) Evidence must quote the specific text being evaluated.
        3) If the text is empty or missing, return score 0 with recommendation to add a clear control variant description.
        4) Keep reasons concise and factual.
        5) Recommendations should focus on:
           - Whether it references an existing experience
           - If it can be understood by someone less familiar with the user experience
           - Remove overlap with the test variant
        6) Output MUST be a strict JSON object with this shape:
           {
             "score": 0 | 1 | 2,
             "reason": string,
             "evidence": string,   // quote from the control variant description
             "recommendation": string
           }

        Return the evaluation in this exact JSON format.
    `,
    audience: `
        You are an assistant that evaluates the "Audience" section of an experiment brief.

        Evaluate ONLY against this rubric:

        • 2 points: Must meet ALL of these criteria:
           (A) Specific targeting criteria clearly defined (e.g., new users in last 30 days, specific user segments)
           (B) Split between control and variant is clearly defined
           (C) Randomization method is appropriate and unlikely to introduce bias
        • 1 point: Has reasonable audience definition but either:
           - Vague on timing or specific targeting criteria, OR
           - Unclear about assignment method or randomization, OR
           - Missing some details about the split methodology
        • 0 points: Missing, poorly defined, or likely to introduce bias

        Operational rules:
        1) The audience definition should be specific enough to clearly identify who will be included in the test.
        2) Evidence must quote the specific text being evaluated.
        3) If the text is empty or missing, return score 0 with recommendation to add a clear audience definition.
        4) Keep reasons concise and factual.
        5) Recommendations should focus on:
           - Making targeting criteria more specific and measurable
           - Clarifying the randomization and assignment methodology
           - Ensuring the approach minimizes bias and maintains statistical validity
        6) Output MUST be a strict JSON object with this shape:
           {
             "score": 0 | 1 | 2,
             "reason": string,
             "evidence": string,   // quote from the audience description
             "recommendation": string
           }

        Return the evaluation in this exact JSON format.
    `
};

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

        // Function definitions for OpenAI
        const functions = (section === 'learningObjective' || section === 'testVariant' || section === 'controlVariant' || section === 'audience') ? [
            {
                name: "evaluate_section",
                description: "Evaluates a learning objective, test variant, control variant, or audience",
                parameters: {
                    type: "object",
                    properties: {
                        score: {
                            type: "number",
                            description: "Score (0-2)"
                        },
                        reason: {
                            type: "string",
                            description: "Brief explanation of the score"
                        },
                        evidence: {
                            type: "string",
                            description: "Quote or excerpt from the objective"
                        },
                        recommendation: {
                            type: "string",
                            description: "Suggestion for improvement if needed"
                        }
                    },
                    required: ["score", "reason", "evidence", "recommendation"]
                }
            }
        ] : [
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