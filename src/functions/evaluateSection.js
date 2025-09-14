const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Evaluation prompts for each section type
const EVALUATION_PROMPTS = {
    rootCause: `
        Evaluate this root cause statement using these criteria:

        1. Length (1 Point): One or two sentences.
           - 1: Statement is concise (1–2 sentences).
           - 0: Too short (fragment) or too long (3+ sentences).

        2. Format (1 Point): Uses "[trunk problem] because [reason]" causal structure.
           - 1: Clear cause-effect phrasing is present.
           - 0: No clear causal link.

        3. Focus (4 Points): Must be user-centric and avoid solution drift.
           - 4: Users are the subject, struggle is clearly about their observable behavior, and no features/workflows/solutions are named.
           - 3: Mostly user-focused, but minor product/system references present.
           - 2: Mix of user struggle and product/system framing, partially in solution space.
           - 1: Primarily product/system focused with little user perspective.
           - 0: Purely product/system or solution-focused, no user struggle.

        4. Clarity (4 Points): Must be observable, measurable, and leave room for multiple solutions.
           - 4: Behavior is measurable in data/feedback and could be solved in 3+ ways.
           - 3: Measurable and open-ended, but phrasing could be sharper.
           - 2: Partly observable, with some assumptions about motivation/intent; multiple solutions possible but not obvious.
           - 1: Vague or unmeasurable, or implies a narrow set of solutions.
           - 0: Attitudinal, unmeasurable, and points to a single obvious fix.

        Scoring Guidance:
        - Max score = 10.
        - Deduct points where statements lack user perspective, drift into solution space, or rely on unmeasurable motivations.
        - Evidence belongs in supporting data, not in the problem statement itself.
        - Apply this test:
           - Does it name a specific feature or mechanism? If yes → solution space.
           - Does it assume a fix or design limitation? If yes → solution space.
           - Can it be solved in multiple ways? If yes → problem space.
           - Can it be backed by data or feedback? If no → too vague.

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