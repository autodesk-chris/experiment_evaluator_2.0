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

    evaluateLearningObjective() {
        const content = this.sections.learningObjective;
        if (!content) {
            this.scores.learningObjective = 0;
            this.feedback.learningObjective = {
                score: 0,
                message: 'Missing learning objective'
            };
            return;
        }

        // Basic scoring based on presence of key elements
        const hasAction = /what|how|why|when|where|which/i.test(content);
        const hasBehavior = /user|customer|client|behavior|usage|interaction/i.test(content);
        
        let score = 0;
        if (hasAction && hasBehavior) score = 2;
        else if (hasAction || hasBehavior) score = 1;

        this.scores.learningObjective = score;
        this.feedback.learningObjective = {
            score,
            message: this.getLearningObjectiveFeedback(score)
        };
    }

    evaluateTestType() {
        const content = this.sections.testType;
        this.feedback.testType = {
            message: content ? 'Test type specified' : 'Missing test type'
        };
    }

    evaluateTestVariant() {
        const content = this.sections.testVariant;
        if (!content) {
            this.scores.testVariant = 0;
            this.feedback.testVariant = {
                score: 0,
                message: 'Missing test variant description'
            };
            return;
        }

        // Basic scoring based on clarity and completeness
        const hasImplementation = /how|implement|change|modify|add|remove/i.test(content);
        const hasUserImpact = /user|see|experience|interact|receive/i.test(content);
        
        let score = 0;
        if (hasImplementation && hasUserImpact) score = 2;
        else if (hasImplementation || hasUserImpact) score = 1;

        this.scores.testVariant = score;
        this.feedback.testVariant = {
            score,
            message: this.getVariantFeedback(score)
        };
    }

    evaluateControlVariant() {
        const content = this.sections.controlVariant;
        if (!content) {
            this.scores.controlVariant = 0;
            this.feedback.controlVariant = {
                score: 0,
                message: 'Missing control variant description'
            };
            return;
        }

        // Basic scoring based on clarity
        const hasCurrentState = /current|existing|baseline|standard/i.test(content);
        const hasDetail = content.split(' ').length >= 10;
        
        let score = 0;
        if (hasCurrentState && hasDetail) score = 2;
        else if (hasCurrentState || hasDetail) score = 1;

        this.scores.controlVariant = score;
        this.feedback.controlVariant = {
            score,
            message: this.getControlVariantFeedback(score)
        };
    }

    evaluateAudience() {
        const content = this.sections.audience;
        if (!content) {
            this.scores.audience = 0;
            this.feedback.audience = {
                score: 0,
                message: 'Missing audience definition'
            };
            return;
        }

        // Basic scoring based on specificity
        const hasTargeting = /segment|cohort|group|users|customers/i.test(content);
        const hasCriteria = /new|existing|active|inactive|registered|profile|behavior/i.test(content);
        
        let score = 0;
        if (hasTargeting && hasCriteria) score = 2;
        else if (hasTargeting || hasCriteria) score = 1;

        this.scores.audience = score;
        this.feedback.audience = {
            score,
            message: this.getAudienceFeedback(score)
        };
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

            if (!response.ok) {
                throw new Error('AI evaluation failed');
            }

            return await response.json();
        } catch (error) {
            throw new Error('Failed to evaluate with AI');
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
        const maxPoints = 100; // Total possible points
        return Math.round((totalPoints / maxPoints) * 100);
    }

    getLearningObjectiveFeedback(score) {
        switch (score) {
            case 2:
                return 'Clear learning objective with specific action and behavior';
            case 1:
                return 'Learning objective needs more specificity';
            default:
                return 'Learning objective is unclear or missing key elements';
        }
    }

    getVariantFeedback(score) {
        switch (score) {
            case 2:
                return 'Clear implementation and user impact description';
            case 1:
                return 'Test variant needs more detail';
            default:
                return 'Test variant description is unclear or incomplete';
        }
    }

    getControlVariantFeedback(score) {
        switch (score) {
            case 2:
                return 'Clear baseline experience description';
            case 1:
                return 'Control variant needs more detail';
            default:
                return 'Control variant description is unclear or incomplete';
        }
    }

    getAudienceFeedback(score) {
        switch (score) {
            case 2:
                return 'Well-defined audience with clear targeting criteria';
            case 1:
                return 'Audience definition needs more specificity';
            default:
                return 'Audience is poorly defined or missing criteria';
        }
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