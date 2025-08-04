const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Evaluation prompts for each section type
const EVALUATION_PROMPTS = {
    rootCause: `
        Evaluate this root cause statement using these criteria:
        1. Length (1 Point): One or two sentences
        2. Format (1 Point): Uses "[trunk problem] because [reason]" format
        3. Focus (4 Points): Describes user problems without referencing solutions
        4. Clarity (4 Points): Logically and clearly explains WHY the problem exists

        Provide evaluation in this format:
        {
            "score": number,
            "summary": "Brief overall assessment",
            "details": {
                "length": "Score and explanation",
                "format": "Score and explanation",
                "focus": "Score and explanation",
                "clarity": "Score and explanation"
            },
            "recommendation": "Specific improvement suggestion"
        }
    `,
    supportingData: `
        Evaluate this supporting data using these criteria:
        1. Structure & Format (2 points): Clear bullet points
        2. Relevance (3 points): Directly supports root cause
        3. Clarity & Specificity (3 points): Clear and specific evidence
        4. Source Attribution (2 points): Clear data sources

        Provide evaluation in this format:
        {
            "score": number,
            "summary": "Brief overall assessment",
            "details": {
                "structure": "Score and explanation",
                "relevance": "Score and explanation",
                "clarity": "Score and explanation",
                "sources": "Score and explanation"
            },
            "recommendation": "Specific improvement suggestion"
        }
    `,
    hypothesis: `
        Evaluate this hypothesis using these criteria:
        1. Belief Statement (2 points): Present-tense belief
        2. Reason (2 points): Clear rationale
        3. Falsifiability (3 points): Testable/measurable
        4. Reflects Insights (3 points): Aligns with root cause

        Provide evaluation in this format:
        {
            "score": number,
            "summary": "Brief overall assessment",
            "details": {
                "belief": "Score and explanation",
                "reason": "Score and explanation",
                "falsifiability": "Score and explanation",
                "insights": "Score and explanation"
            },
            "recommendation": "Specific improvement suggestion"
        }
    `,
    prediction: `
        Evaluate this prediction using these criteria:
        1. Format (2 points): Clear "If... then..." structure
        2. Solution Alignment (3 points): References solution without details
        3. Testability (3 points): Measurable outcome
        4. Multiple Tests (2 points): Supports various implementations

        Provide evaluation in this format:
        {
            "score": number,
            "summary": "Brief overall assessment",
            "details": {
                "format": "Score and explanation",
                "solution": "Score and explanation",
                "testability": "Score and explanation",
                "flexibility": "Score and explanation"
            },
            "recommendation": "Specific improvement suggestion"
        }
    `
};

exports.handler = async function(event, context) {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { section, content } = JSON.parse(event.body);

        // Validate input
        if (!section || !content) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing section or content' })
            };
        }

        // Get evaluation prompt
        const prompt = EVALUATION_PROMPTS[section];
        if (!prompt) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid section type' })
            };
        }

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert experiment evaluator. Analyze the provided content and return a structured evaluation based on the given criteria.'
                },
                {
                    role: 'user',
                    content: `${prompt}\n\nContent to evaluate:\n${content}`
                }
            ],
            temperature: 0.3,
            max_tokens: 1000
        });

        // Parse and validate response
        const response = completion.choices[0].message.content;
        let evaluation;
        try {
            evaluation = JSON.parse(response);
        } catch (error) {
            console.error('Failed to parse OpenAI response:', response);
            throw new Error('Invalid AI response format');
        }

        // Validate evaluation structure
        if (!evaluation.score || !evaluation.summary || !evaluation.details) {
            throw new Error('Invalid evaluation structure');
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(evaluation)
        };
    } catch (error) {
        console.error('Evaluation error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to evaluate content',
                details: error.message
            })
        };
    }
}; 