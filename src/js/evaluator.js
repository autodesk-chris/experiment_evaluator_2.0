class Evaluator {
    constructor() {
        this.sections = null;
        this.scores = {};
        this.feedback = {};
    }

    async evaluate(sections) {
        this.sections = sections;
        this.scores = {};
        this.feedback = {};

        // Evaluate each section
        await Promise.all([
            this.evaluateOutcome(),
            this.evaluateTrunkProblem(),
            this.evaluateBranchProblem(),
            this.evaluateRootCause(),
            this.evaluateSupportingData(),
            this.evaluateHypothesis(),
            this.evaluatePrediction(),
            this.evaluateTestTitle(),
            this.evaluateShortDescription(),
            this.evaluateLearningObjective(),
            this.evaluateTestType(),
            this.evaluateTestVariant(),
            this.evaluateControlVariant(),
            this.evaluateAudience(),
            this.evaluateDuration(),
            this.evaluateSuccessCriteria(),
            this.evaluateDataRequirements(),
            this.evaluateConsiderations(),
            this.evaluateWhatNext()
        ]);

        // Calculate total score
        const totalScore = this.calculateTotalScore();

        // Update display
        window.displayManager.updateResults(this.scores, this.feedback, totalScore);
    }

    // Binary sections (10 points if present)
    evaluateOutcome() {
        const score = this.sections.outcome ? 10 : 0;
        this.scores.outcome = score;
        this.feedback.outcome = {
            score,
            message: score ? 'Present' : 'Missing'
        };
    }

    evaluateTrunkProblem() {
        const score = this.sections.trunkProblem ? 10 : 0;
        this.scores.trunkProblem = score;
        this.feedback.trunkProblem = {
            score,
            message: score ? 'Present' : 'Missing'
        };
    }

    evaluateBranchProblem() {
        const score = this.sections.branchProblem ? 10 : 0;
        this.scores.branchProblem = score;
        this.feedback.branchProblem = {
            score,
            message: score ? 'Present' : 'Missing'
        };
    }

    // Complex sections with multiple criteria
    async evaluateRootCause() {
        const content = this.sections.rootCause;
        if (!content) {
            this.scores.rootCause = 0;
            this.feedback.rootCause = {
                score: 0,
                message: 'Missing root cause statement',
                details: {}
            };
            return;
        }

        // Send to OpenAI for evaluation
        try {
            const evaluation = await this.evaluateWithAI('rootCause', content);
            this.scores.rootCause = evaluation.score;
            this.feedback.rootCause = {
                score: evaluation.score,
                message: evaluation.summary,
                details: evaluation.details
            };
        } catch (error) {
            this.handleAIError('rootCause');
        }
    }

    async evaluateSupportingData() {
        const content = this.sections.supportingData;
        if (!content) {
            this.scores.supportingData = 0;
            this.feedback.supportingData = {
                score: 0,
                message: 'Missing supporting data',
                details: {}
            };
            return;
        }

        try {
            const evaluation = await this.evaluateWithAI('supportingData', content);
            this.scores.supportingData = evaluation.score;
            this.feedback.supportingData = {
                score: evaluation.score,
                message: evaluation.summary,
                details: evaluation.details
            };
        } catch (error) {
            this.handleAIError('supportingData');
        }
    }

    async evaluateHypothesis() {
        const content = this.sections.hypothesis;
        if (!content) {
            this.scores.hypothesis = 0;
            this.feedback.hypothesis = {
                score: 0,
                message: 'Missing hypothesis statement',
                details: {}
            };
            return;
        }

        try {
            const evaluation = await this.evaluateWithAI('hypothesis', content);
            this.scores.hypothesis = evaluation.score;
            this.feedback.hypothesis = {
                score: evaluation.score,
                message: evaluation.summary,
                details: evaluation.details
            };
        } catch (error) {
            this.handleAIError('hypothesis');
        }
    }

    async evaluatePrediction() {
        const content = this.sections.prediction;
        if (!content) {
            this.scores.prediction = 0;
            this.feedback.prediction = {
                score: 0,
                message: 'Missing prediction',
                details: {}
            };
            return;
        }

        try {
            const evaluation = await this.evaluateWithAI('prediction', content);
            this.scores.prediction = evaluation.score;
            this.feedback.prediction = {
                score: evaluation.score,
                message: evaluation.summary,
                details: evaluation.details
            };
        } catch (error) {
            this.handleAIError('prediction');
        }
    }

    evaluateTestTitle() {
        const content = this.sections.testTitle;
        if (!content) {
            this.feedback.testTitle = {
                message: 'Missing test title'
            };
            return;
        }

        const isValid = content.length <= 50;
        this.feedback.testTitle = {
            message: isValid ? 'Valid test title' : 'Test title exceeds 50 characters',
            recommendation: isValid ? null : 'Shorten the title to be under 50 characters'
        };
    }

    evaluateShortDescription() {
        const content = this.sections.shortDescription;
        if (!content) {
            this.feedback.shortDescription = {
                message: 'Missing short description'
            };
            return;
        }

        this.feedback.shortDescription = {
            message: 'Short description present',
            recommendation: null // AI evaluation could provide recommendations
        };
    }

    async evaluateLearningObjective() {
        const content = this.sections.learningObjective;
        if (!content) {
            this.scores.learningObjective = 0;
            this.feedback.learningObjective = {
                score: 0,
                message: 'Missing learning objective',
                details: {
                    error: 'No learning objective provided. Please add a clear, single learning objective that states what you want to learn and the expected user behavior.',
                    status: 'MISSING_CONTENT'
                }
            };
            return;
        }

        try {
            const evaluation = await this.evaluateWithAI('learningObjective', content);
            
            // Validate the AI response structure
            if (!evaluation || typeof evaluation !== 'object') {
                throw new Error('Invalid AI response format: Response is empty or not an object');
            }
            
            if (typeof evaluation.score !== 'number' || 
                !evaluation.reason || 
                !evaluation.evidence || 
                evaluation.recommendation === undefined) {
                throw new Error('Invalid AI response format: Missing required fields (score, reason, evidence, or recommendation)');
            }

            // Update scores and feedback
            this.scores.learningObjective = evaluation.score;
            this.feedback.learningObjective = {
                score: evaluation.score,
                message: evaluation.reason,
                details: {
                    evidence: evaluation.evidence,
                    recommendation: evaluation.recommendation,
                    status: 'SUCCESS'
                }
            };

            // Log successful evaluation for debugging
            console.log('Learning Objective Evaluation:', {
                content,
                score: evaluation.score,
                reason: evaluation.reason
            });

        } catch (error) {
            console.error('Learning Objective Evaluation Error:', {
                content,
                error: error.message,
                stack: error.stack
            });

            this.scores.learningObjective = 0;
            this.feedback.learningObjective = {
                score: 0,
                message: 'Error evaluating learning objective',
                details: {
                    error: `Evaluation failed: ${error.message}. Please try again or contact support if the issue persists.`,
                    status: 'ERROR',
                    technicalDetails: error.stack
                }
            };
        }
    }

    evaluateTestType() {
        const content = this.sections.testType;
        this.feedback.testType = {
            message: content ? 'Test type specified' : 'Missing test type'
        };
    }

    async evaluateTestVariant() {
        const content = this.sections.testVariant;
        if (!content) {
            this.scores.testVariant = 0;
            this.feedback.testVariant = {
                score: 0,
                message: 'Missing test variant description',
                details: {
                    error: 'No test variant description provided. Please add a clear description of the variant experience and how it differs from the control.',
                    status: 'MISSING_CONTENT'
                }
            };
            return;
        }

        try {
            const evaluation = await this.evaluateWithAI('testVariant', content);
            
            // Validate the AI response structure
            if (!evaluation || typeof evaluation !== 'object') {
                throw new Error('Invalid AI response format: Response is empty or not an object');
            }
            
            if (typeof evaluation.score !== 'number' || 
                !evaluation.reason || 
                !evaluation.evidence || 
                evaluation.recommendation === undefined) {
                throw new Error('Invalid AI response format: Missing required fields (score, reason, evidence, or recommendation)');
            }

            // Update scores and feedback
            this.scores.testVariant = evaluation.score;
            this.feedback.testVariant = {
                score: evaluation.score,
                message: evaluation.reason,
                details: {
                    evidence: evaluation.evidence,
                    recommendation: evaluation.recommendation,
                    status: 'SUCCESS'
                }
            };

            // Log successful evaluation for debugging
            console.log('Test Variant Evaluation:', {
                content,
                score: evaluation.score,
                reason: evaluation.reason
            });

        } catch (error) {
            console.error('Test Variant Evaluation Error:', {
                content,
                error: error.message,
                stack: error.stack
            });

            this.scores.testVariant = 0;
            this.feedback.testVariant = {
                score: 0,
                message: 'Error evaluating test variant',
                details: {
                    error: `Evaluation failed: ${error.message}. Please try again or contact support if the issue persists.`,
                    status: 'ERROR',
                    technicalDetails: error.stack
                }
            };
        }
    }

    async evaluateControlVariant() {
        const content = this.sections.controlVariant;
        if (!content) {
            this.scores.controlVariant = 0;
            this.feedback.controlVariant = {
                score: 0,
                message: 'Missing control variant description',
                details: {
                    error: 'No control variant description provided. Please add a clear description of the existing baseline experience.',
                    status: 'MISSING_CONTENT'
                }
            };
            return;
        }

        try {
            const evaluation = await this.evaluateWithAI('controlVariant', content);
            
            // Validate the AI response structure
            if (!evaluation || typeof evaluation !== 'object') {
                throw new Error('Invalid AI response format: Response is empty or not an object');
            }
            
            if (typeof evaluation.score !== 'number' || 
                !evaluation.reason || 
                !evaluation.evidence || 
                evaluation.recommendation === undefined) {
                throw new Error('Invalid AI response format: Missing required fields (score, reason, evidence, or recommendation)');
            }

            // Update scores and feedback
            this.scores.controlVariant = evaluation.score;
            this.feedback.controlVariant = {
                score: evaluation.score,
                message: evaluation.reason,
                details: {
                    evidence: evaluation.evidence,
                    recommendation: evaluation.recommendation,
                    status: 'SUCCESS'
                }
            };

            // Log successful evaluation for debugging
            console.log('Control Variant Evaluation:', {
                content,
                score: evaluation.score,
                reason: evaluation.reason
            });

        } catch (error) {
            console.error('Control Variant Evaluation Error:', {
                content,
                error: error.message,
                stack: error.stack
            });

            this.scores.controlVariant = 0;
            this.feedback.controlVariant = {
                score: 0,
                message: 'Error evaluating control variant',
                details: {
                    error: `Evaluation failed: ${error.message}. Please try again or contact support if the issue persists.`,
                    status: 'ERROR',
                    technicalDetails: error.stack
                }
            };
        }
    }

    async evaluateAudience() {
        const content = this.sections.audience;
        if (!content) {
            this.scores.audience = 0;
            this.feedback.audience = {
                score: 0,
                message: 'Missing audience definition',
                details: {
                    error: 'No audience definition provided. Please add a clear description of the target audience with specific criteria and randomization method.',
                    status: 'MISSING_CONTENT'
                }
            };
            return;
        }

        try {
            const evaluation = await this.evaluateWithAI('audience', content);
            
            // Validate the AI response structure
            if (!evaluation || typeof evaluation !== 'object') {
                throw new Error('Invalid AI response format: Response is empty or not an object');
            }
            
            if (typeof evaluation.score !== 'number' || 
                !evaluation.reason || 
                !evaluation.evidence || 
                evaluation.recommendation === undefined) {
                throw new Error('Invalid AI response format: Missing required fields (score, reason, evidence, or recommendation)');
            }

            // Update scores and feedback
            this.scores.audience = evaluation.score;
            this.feedback.audience = {
                score: evaluation.score,
                message: evaluation.reason,
                details: {
                    evidence: evaluation.evidence,
                    recommendation: evaluation.recommendation,
                    status: 'SUCCESS'
                }
            };

            // Log successful evaluation for debugging
            console.log('Audience Evaluation:', {
                content,
                score: evaluation.score,
                reason: evaluation.reason
            });

        } catch (error) {
            console.error('Audience Evaluation Error:', {
                content,
                error: error.message,
                stack: error.stack
            });

            this.scores.audience = 0;
            this.feedback.audience = {
                score: 0,
                message: 'Error evaluating audience',
                details: {
                    error: `Evaluation failed: ${error.message}. Please try again or contact support if the issue persists.`,
                    status: 'ERROR',
                    technicalDetails: error.stack
                }
            };
        }
    }

    evaluateDuration() {
        const content = this.sections.duration;
        if (!content) {
            this.scores.duration = 0;
            this.feedback.duration = {
                score: 0,
                message: 'Missing duration'
            };
            return;
        }

        // Basic scoring based on specificity and rationale
        const hasTimeframe = /days|weeks|months|until/i.test(content);
        const hasRationale = /because|due to|based on|expect|need|require/i.test(content);
        
        let score = 0;
        if (hasTimeframe && hasRationale) score = 2;
        else if (hasTimeframe || hasRationale) score = 1;

        this.scores.duration = score;
        this.feedback.duration = {
            score,
            message: this.getDurationFeedback(score)
        };
    }

    evaluateSuccessCriteria() {
        const content = this.sections.successCriteria;
        if (!content) {
            this.scores.successCriteria = 0;
            this.feedback.successCriteria = {
                score: 0,
                message: 'Missing success criteria'
            };
            return;
        }

        // Basic scoring based on measurability
        const hasMetric = /increase|decrease|improve|reduce|[0-9]+%|ratio|rate/i.test(content);
        const hasThreshold = /significant|p-value|confidence|statistical|threshold/i.test(content);
        
        let score = 0;
        if (hasMetric && hasThreshold) score = 2;
        else if (hasMetric || hasThreshold) score = 1;

        this.scores.successCriteria = score;
        this.feedback.successCriteria = {
            score,
            message: this.getSuccessCriteriaFeedback(score)
        };
    }

    evaluateDataRequirements() {
        const content = this.sections.dataRequirements;
        if (!content) {
            this.scores.dataRequirements = 0;
            this.feedback.dataRequirements = {
                score: 0,
                message: 'Missing data requirements'
            };
            return;
        }

        // Basic scoring based on completeness
        const hasMetrics = /metric|event|property|attribute|track/i.test(content);
        const hasCollection = /collect|measure|record|capture|store/i.test(content);
        
        let score = 0;
        if (hasMetrics && hasCollection) score = 2;
        else if (hasMetrics || hasCollection) score = 1;

        this.scores.dataRequirements = score;
        this.feedback.dataRequirements = {
            score,
            message: this.getDataRequirementsFeedback(score)
        };
    }

    evaluateConsiderations() {
        const content = this.sections.considerations;
        if (!content) {
            this.scores.considerations = 0;
            this.feedback.considerations = {
                score: 0,
                message: 'Missing considerations'
            };
            return;
        }

        // Basic scoring based on thoughtfulness
        const hasRisks = /risk|concern|challenge|limitation|dependency/i.test(content);
        const hasDetails = content.split(' ').length >= 20;
        
        let score = 0;
        if (hasRisks && hasDetails) score = 2;
        else if (hasRisks || hasDetails) score = 1;

        this.scores.considerations = score;
        this.feedback.considerations = {
            score,
            message: this.getConsiderationsFeedback(score)
        };
    }

    evaluateWhatNext() {
        const content = this.sections.whatNext;
        if (!content) {
            this.scores.whatNext = 0;
            this.feedback.whatNext = {
                score: 0,
                message: 'Missing what next section'
            };
            return;
        }

        // Basic scoring based on completeness
        const hasSuccess = /success|pass|achieve|meet|exceed/i.test(content);
        const hasFailure = /fail|not|below|miss|alternative/i.test(content);
        
        let score = 0;
        if (hasSuccess && hasFailure) score = 2;
        else if (hasSuccess || hasFailure) score = 1;

        this.scores.whatNext = score;
        this.feedback.whatNext = {
            score,
            message: this.getWhatNextFeedback(score)
        };
    }

    async evaluateWithAI(section, content) {
        try {
            console.log('Making API request:', {
                section,
                content,
                url: '/api/evaluate-section'
            });

            const response = await fetch('/api/evaluate-section', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    section,
                    content
                })
            });

            console.log('API Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`AI evaluation failed: ${response.status} ${errorText}`);
            }

            const jsonResponse = await response.json();
            console.log('API Success Response:', jsonResponse);
            return jsonResponse;
        } catch (error) {
            console.error('API Call Error:', {
                error: error.message,
                stack: error.stack,
                type: error.constructor.name
            });
            throw new Error(`Failed to evaluate with AI: ${error.message}`);
        }
    }

    handleAIError(section) {
        this.scores[section] = 0;
        this.feedback[section] = {
            score: 0,
            message: 'Error evaluating section',
            details: {
                error: 'Failed to evaluate with AI. Please try again.'
            }
        };
    }

    calculateTotalScore() {
        const totalPoints = Object.values(this.scores).reduce((sum, score) => sum + score, 0);
        const maxPoints = 88; // Total possible points (3×10 + 4×10 + 9×2)
        return Math.round((totalPoints / maxPoints) * 100);
    }





    getDurationFeedback(score) {
        switch (score) {
            case 2:
                return 'Clear duration with supporting rationale';
            case 1:
                return 'Duration needs more justification';
            default:
                return 'Duration is unclear or missing rationale';
        }
    }

    getSuccessCriteriaFeedback(score) {
        switch (score) {
            case 2:
                return 'Clear success metrics and thresholds';
            case 1:
                return 'Success criteria needs more specific thresholds';
            default:
                return 'Success criteria lack clear metrics or thresholds';
        }
    }

    getDataRequirementsFeedback(score) {
        switch (score) {
            case 2:
                return 'Clear metrics and collection methods specified';
            case 1:
                return 'Data requirements need more detail';
            default:
                return 'Data requirements are unclear or incomplete';
        }
    }

    getConsiderationsFeedback(score) {
        switch (score) {
            case 2:
                return 'Thorough consideration of risks and dependencies';
            case 1:
                return 'Considerations need more detail';
            default:
                return 'Considerations are missing or lack depth';
        }
    }

    getWhatNextFeedback(score) {
        switch (score) {
            case 2:
                return 'Clear plans for both success and failure scenarios';
            case 1:
                return 'What next section needs more scenarios';
            default:
                return 'What next section is incomplete or missing scenarios';
        }
    }
}

// Initialize the evaluator
window.evaluator = new Evaluator(); 