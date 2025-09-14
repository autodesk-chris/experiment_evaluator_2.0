const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Function definitions for OpenAI API
exports.EVALUATION_FUNCTIONS = {
    // For 2-point sections (learning objective, test variant, etc.)
    twoPointFunction: {
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
    },
    // For 10-point sections (root cause, supporting data, etc.)
    tenPointFunction: {
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
                        belief: { type: "string" },
                        reason: { type: "string" },
                        falsifiability: { type: "string" },
                        insights: { type: "string" }
                    }
                }
            },
            required: ["score", "summary", "details"]
        }
    }
};

// Helper function to determine which function definition to use
exports.getFunctionForSection = (section) => {
    const twoPointSections = ['learningObjective', 'testVariant', 'controlVariant', 'audience', 'duration', 'successCriteria', 'dataRequirements', 'considerations', 'whatNext'];
    return twoPointSections.includes(section) ? [exports.EVALUATION_FUNCTIONS.twoPointFunction] : [exports.EVALUATION_FUNCTIONS.tenPointFunction];
};

// Evaluation prompts for each section type
exports.EVALUATION_PROMPTS = {
    rootCause: `
        [VERSION: 2025-09-14 Updated Criteria]
        Evaluate this root cause statement using these criteria:

        1. Length (1 Point): One or two sentences.
           - 1: Statement is concise (1–2 sentences).
           - 0: Too long (3+ sentences).

        2. Format (1 Point): Uses "[trunk problem] because [reason]" causal structure.
           - 1: Clear cause-effect phrasing is present.
           - 0: No clear causal link.

        3. Focus (4 Points): Must be user-centric and avoid solution drift.
           - 4: Users are the subject, is clearly about an observable behavior, and no features/workflows/solutions are named.
           - 3: Mostly user-focused, but minor product/system references present.
           - 2: Mix of user challenge and product/system framing, partially in solution space.
           - 1: Primarily product/system focused with little user perspective.
           - 0: Purely product/system or solution-focused, no user challenge.

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
        [VERSION: 2025-09-14 Updated Criteria]
        Evaluate this hypothesis using these criteria:

        1. Belief Statement (2 Points): Present-tense statement about the core user problem or behavior.
           - 2: Clearly states the core belief about the problem or behavior, aligns with root cause, avoids solutions
           - 1: States a belief but weakly connects to root cause, or mixes in implied actions/solutions
           - 0: Describes an action, feature, or goal rather than a belief; no connection to root cause, uses 'if' in the statement

        2. Reason (2 Points): Clear rationale explaining why this belief matters.
           - 2: Provides rationale that logically follows from insights/evidence and connects to user behavior
           - 1: Offers a reason but it is vague, generic, or loosely related to the problem
           - 0: Provides no rationale or relies purely on speculation

        3. Falsifiability (3 Points): The belief must be testable and capable of being proven false.
           - 3: Can be definitively validated or refuted with specific, measurable outcomes
           - 2: Mostly testable, but contains ambiguous or subjective elements
           - 1: Difficult to test or relies heavily on qualitative judgment
           - 0: Cannot be validated or falsified through measurement

        4. Reflects Insights (3 Points): The belief should build from what is already known.
           - 3: Directly addresses root cause and is consistent with available insights/evidence
           - 2: Generally consistent with insights but overlooks key aspects
           - 1: Weakly connected to insights, or potentially contradicts them
           - 0: No connection to root cause or ignores available evidence

        Scoring Guidance:
        - Max score = 10
        - Deduct points for:
          • Future-tense or conditional language ('will', 'should', 'could')
          • Solution- or feature-oriented framing
          • Vague or unmeasurable statements
          • Multiple beliefs embedded in one statement
        - Apply these tests:
          • Can the belief be proven false?
          • Is it written as a belief, not a solution/goal?
          • Does it connect to the root cause?
          • Is it logically supported by evidence?

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
        2. Solution Alignment (3 points): States a solution. No requirement to provide details
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
    `,
    learningObjective: `
        [VERSION: 2025-09-14 Updated Criteria]
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
    testVariant: `
        [VERSION: 2025-09-14 Updated Criteria]
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
        [VERSION: 2025-09-14 Updated Criteria]
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
        [VERSION: 2025-09-14 Updated Criteria]
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
        [VERSION: 2025-09-14 Updated Criteria]
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
        [VERSION: 2025-09-14 Updated Criteria]
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
        [VERSION: 2025-09-14 Updated Criteria]
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
        [VERSION: 2025-09-14 Updated Criteria]
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
        [VERSION: 2025-09-14 Updated Criteria]
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
        console.log('DEBUG - Using prompt for section:', section);
        console.log('DEBUG - Prompt content:', prompt);
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