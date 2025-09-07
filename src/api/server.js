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
        You are an assistant that evaluates the "Root Cause" section of an experiment brief.

        Evaluate ONLY against this rubric:

        • Length (1 Point): Must meet ONE of these criteria:
           - Contains two sentences or fewer (counted by periods), OR
           - Contains fewer than 50 words
           → If either condition is true, award 1 point. Otherwise, 0.

        • Format (1 Point): Must use a causal structure such as "[problem] because [reason]" or similar.
           - Award 1 point if the text contains a causal connector ("because", "due to", "caused by", "as a result of") that links a problem to a reason.
           - Otherwise, 0.

        • Focus (4 Points): Describes user problems without referencing solutions or features.

        • Clarity (4 Points): Logically and clearly explains WHY the problem exists.

        Operational rules:
        - Do not interpret literally bracketed placeholders. Look for causal logic, not exact text.
        - For length, check sentence count and word count exactly as described above.
        - Focus only on user challenges, not solutions or features.
        - Clarity refers only to whether the reasoning is logical and understandable.

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
    `,
    duration: `
        You are an assistant that evaluates the "Duration" section of an experiment brief.

        Evaluate ONLY against this rubric:

        • 2 points: Must meet ALL of these criteria:
           (A) Duration is clearly stated (specific timeframe, not vague)
           (B) Includes a rationale for the chosen duration
           (C) Rationale references relevant factors (e.g., expected user volume, statistical power, traffic assumptions, learning needs, or alignment with product usage patterns)
        • 1 point: Has some clarity but either:
           - Duration is stated but no rationale is provided, OR
           - Rationale is present but doesn't reference specific factors (user volume, statistical power, traffic assumptions, learning needs, product usage patterns), OR
           - Rationale is unclear or lacks sufficient justification for the chosen timeframe
        • 0 points: Duration is missing, vague (e.g., "a few weeks"), or lacks any justification

        Operational rules:
        1) The duration MUST be specific (e.g., "4 weeks", "30 days") to receive full points. Vague terms like "a few weeks" should reduce the score.
        2) Evidence must quote the duration statement being evaluated.
        3) If the text is empty or missing, return score 0 with recommendation to add a clear duration with rationale.
        4) Keep reasons concise and factual.
        5) Recommendations should suggest how to:
           - Make the duration more specific if it's vague
           - Add rationale if missing (referencing user volume, statistical power, etc.)
           - Strengthen weak rationale with specific factors
        6) Output MUST be a strict JSON object with this shape:
           {
             "score": 0 | 1 | 2,
             "reason": string,
             "evidence": string,   // quote from the duration section
             "recommendation": string
           }

        Return the evaluation in this exact JSON format.
    `,
    successCriteria: `
        You are an assistant that evaluates the "Success Criteria" section of an experiment brief.

        Evaluate ONLY against this rubric:

        • 2 points: Must meet ALL of these criteria:
           (A) Success is clearly defined using quantitative thresholds (e.g., ">20% lift for test over control")
           (B) Includes statistical significance criteria (e.g., "Test is statistically significant") OR clear, logical statement and logic for measuring success
           (C) Criteria align with the learning objective
        • 1 point: Has some clarity but either:
           - Success is stated but lacks specificity in thresholds, OR
           - Some metrics have quantitative thresholds but not all, OR
           - No clear logical way of determining and measuring success, OR
           - Criteria don't clearly align with the learning objective
        • 0 points: No clear success threshold, ambiguous criteria (e.g., "increase usage"), or missing success criteria entirely

        Operational rules:
        1) Success criteria must be specific and quantifiable (e.g., ">20% lift", "p<0.05", "conversion rate increases by 15%") to receive full points.
        2) Evidence must quote the success criteria section being evaluated.
        3) If the text is empty or missing, return score 0 with recommendation to add clear, quantitative success thresholds.
        4) Keep reasons concise and factual.
        5) Recommendations should:
           - Suggest specific quantitative thresholds if missing
           - Recommend statistical significance criteria if absent
           - Ensure alignment with learning objective
           - Replace vague terms with measurable benchmarks
        6) Output MUST be a strict JSON object with this shape:
           {
             "score": 0 | 1 | 2,
             "reason": string,
             "evidence": string,   // quote from the success criteria section
             "recommendation": string
           }

        Return the evaluation in this exact JSON format.
    `,
    dataRequirements: `
        You are an assistant that evaluates the "Data Requirements" section of an experiment brief.

        Evaluate ONLY against this rubric:

        • 2 points: Must meet ALL of these criteria:
           (A) Metrics to be measured are clearly listed
           (B) Metrics align with the success criteria
           (C) Clear explanation of how data will be collected (e.g., tracking method, event definition, or timing)
        • 1 point: Has some clarity but either:
           - Some metrics are listed but alignment to success criteria is unclear, OR
           - Data collection method is vague or missing, OR
           - Metrics are somewhat clear but lack specificity
        • 0 points: Metrics are missing or unclear, and there is no explanation of how data will be collected

        Operational rules:
        1) Data requirements must specify what metrics will be tracked and how they will be collected to receive full points.
        2) Evidence must quote the data requirements section being evaluated.
        3) If the text is empty or missing, return score 0 with recommendation to add clear data collection requirements.
        4) Keep reasons concise and factual.
        5) Recommendations should:
           - Suggest specific metrics if missing or unclear
           - Recommend clear data collection methods (tracking, events, timing)
           - Ensure alignment with success criteria
           - Specify tracking implementation details if vague
        6) Output MUST be a strict JSON object with this shape:
           {
             "score": 0 | 1 | 2,
             "reason": string,
             "evidence": string,   // quote from the data requirements section
             "recommendation": string
           }

        Return the evaluation in this exact JSON format.
    `,
    considerations: `
        You are an assistant that evaluates the "Considerations and investigation requirements" section of an experiment brief.

        Evaluate ONLY against this rubric:

        • 2 points: Must meet this criterion:
           (A) Content is present that outlines at least one consideration, risk, question, or area to investigate (e.g., survey timing, user visibility, content engagement, technical dependencies, user behavior assumptions, potential biases, implementation challenges)
        • 1 point: Has some content but either:
           - Minimal content present but lacks clarity on what needs to be explored, OR
           - Vague mention of considerations without specific details or actionable areas for investigation
        • 0 points: No content provided or content is completely irrelevant to considerations, risks, or investigation areas

        Operational rules:
        1) Look for evidence of thoughtful planning around risks, unknowns, dependencies, or areas requiring further exploration.
        2) Content should demonstrate the team has considered potential challenges, assumptions, or areas that need investigation.
        3) Evidence must quote the considerations section being evaluated.
        4) If the text is empty or missing, return score 0 with recommendation to add considerations.
        5) Keep reasons concise and factual.
        6) Recommendations should:
           - Suggest specific types of considerations if missing (e.g., technical risks, user behavior assumptions, timing considerations, measurement challenges)
           - Focus on areas that could impact experiment success or interpretation
           - Encourage proactive thinking about potential issues
        7) Output MUST be a strict JSON object with this shape:
           {
             "score": 0 | 1 | 2,
             "reason": string,
             "evidence": string,   // quote from the considerations section
             "recommendation": string
           }

        Return the evaluation in this exact JSON format.
    `,
    whatNext: `
        You are an assistant that evaluates the "What next" section of an experiment brief.

        Evaluate ONLY against this rubric:

        • 2 points: Must meet this criterion:
           (A) Clearly identifies what will happen if the test succeeds AND what will happen if the test fails (e.g., roll out to broader audience, iterate on design, investigate reasons for failure, alternative approaches)
        • 1 point: Has some content but either:
           - Only one outcome (success OR failure) has a defined next step, OR
           - Both outcomes are mentioned but lack clarity on specific actions or steps
        • 0 points: No clear next steps are provided or content is completely missing

        Operational rules:
        1) Look for evidence of planning for both success and failure scenarios.
        2) Success scenarios should outline concrete actions like rollout plans, scaling decisions, or implementation steps.
        3) Failure scenarios should outline investigation plans, iteration strategies, or alternative approaches.
        4) Evidence must quote the what next section being evaluated.
        5) If the text is empty or missing, return score 0 with recommendation to add follow-up actions.
        6) Keep reasons concise and factual.
        7) Recommendations should:
           - Specify which scenario (success/failure) needs more detail if only one is covered
           - Suggest concrete follow-up actions for missing scenarios
           - Focus on actionable next steps rather than vague statements
           - Encourage planning for both positive and negative outcomes
        8) Output MUST be a strict JSON object with this shape:
           {
             "score": 0 | 1 | 2,
             "reason": string,
             "evidence": string,   // quote from the what next section
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
        const functions = (section === 'learningObjective' || section === 'testVariant' || section === 'controlVariant' || section === 'audience' || section === 'duration' || section === 'successCriteria' || section === 'dataRequirements' || section === 'considerations' || section === 'whatNext') ? [
            {
                name: "evaluate_section",
                description: "Evaluates a learning objective, test variant, control variant, audience, duration, success criteria, data requirements, considerations, or what next",
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