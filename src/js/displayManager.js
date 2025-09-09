class DisplayManager {
    constructor() {
        this.totalScoreElement = document.getElementById('total-score');
        this.problemSpaceElement = document.getElementById('problem-space');
        this.solutionSpaceElement = document.getElementById('solution-space');
        this.exportBtn = document.getElementById('export-btn');
        this.newEvaluationBtn = document.getElementById('new-evaluation-btn');

        // Define section organization
        this.problemSpaceSections = [
            'outcome', 'trunkProblem', 'branchProblem', 
            'rootCause', 'supportingData', 'hypothesis'
        ];
        
        this.solutionSpaceSections = [
            'prediction', 'testTitle', 'shortDescription', 'learningObjective', 
            'testType', 'testVariant', 'controlVariant', 'audience', 'duration', 
            'successCriteria', 'dataRequirements', 'considerations', 'whatNext'
        ];

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.exportBtn.addEventListener('click', () => {
            if (this.currentResults) {
                window.exportManager.exportResults(this.currentResults);
            }
        });

        this.newEvaluationBtn.addEventListener('click', () => {
            this.resetUI();
        });
    }

    updateResults(scores, feedback, totalScore) {
        this.currentResults = { scores, feedback, totalScore };
        this.updateTotalScore(totalScore);
        // Get the sections content from the evaluator
        const sections = window.evaluator ? window.evaluator.sections : {};
        this.renderSections(scores, feedback, sections);
        // Hide loading overlay when results are ready
        this.hideLoadingOverlay();
    }

    updateTotalScore(score) {
        this.totalScoreElement.textContent = score;
        
        // Apply color coding to the score circle
        const scoreCircle = document.querySelector('.score-circle');
        if (scoreCircle) {
            // Remove existing color classes
            scoreCircle.classList.remove('score-green', 'score-orange', 'score-red');
            
            // Add appropriate color class based on score
            if (score >= 80) {
                scoreCircle.classList.add('score-green');
            } else if (score >= 70) {
                scoreCircle.classList.add('score-orange');
            } else {
                scoreCircle.classList.add('score-red');
            }
        }
    }

    getMaxScore(section) {
        // Binary sections (4 points)
        const binarySections = ['outcome', 'trunkProblem', 'branchProblem'];
        // AI-evaluated sections (10 points)
        const aiSections = ['rootCause', 'supportingData', 'hypothesis', 'prediction'];
        
        if (binarySections.includes(section)) {
            return 4;
        }
        if (aiSections.includes(section)) {
            return 10;
        }
        // All other sections are 2-point sections
        return 2;
    }

    getScoreColor(score, maxScore) {
        if (maxScore === 10) {
            if (score >= 8) return 'green';
            if (score >= 6) return 'orange';
            return 'red';
        } else if (maxScore === 4) {
            if (score === 4) return 'green';
            return 'red';
        } else if (maxScore === 2) {
            if (score === 2) return 'green';
            if (score === 1) return 'orange';
            return 'red';
        }
        return 'neutral';
    }

    calculatePercentage(score, maxScore) {
        if (maxScore === 0) return 0;
        return Math.round((score / maxScore) * 100);
    }

    renderSections(scores, feedback, sections = {}) {
        this.problemSpaceElement.innerHTML = '';
        this.solutionSpaceElement.innerHTML = '';

        // Render Problem Space sections
        this.problemSpaceSections.forEach(section => {
            if (scores.hasOwnProperty(section) || feedback.hasOwnProperty(section)) {
                const sectionElement = this.createSectionElement(section, scores[section], feedback[section], sections[section]);
                this.problemSpaceElement.appendChild(sectionElement);
            }
        });

        // Render Solution Space sections
        this.solutionSpaceSections.forEach(section => {
            if (scores.hasOwnProperty(section) || feedback.hasOwnProperty(section)) {
                const sectionElement = this.createSectionElement(section, scores[section], feedback[section], sections[section]);
                this.solutionSpaceElement.appendChild(sectionElement);
            }
        });
    }

    createSectionElement(section, score, feedbackData, sectionContent) {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'section-item';

        // Header with title and score pill
        const header = document.createElement('div');
        header.className = 'section-header';

        const title = document.createElement('h3');
        title.className = 'section-title';
        title.textContent = this.formatSectionName(section);

        const maxScore = this.getMaxScore(section);
        const scorePill = document.createElement('div');
        scorePill.className = 'score-pill';

        if (score !== undefined) {
            const percentage = this.calculatePercentage(score, maxScore);
            const colorClass = this.getScoreColor(score, maxScore);
            scorePill.className += ` ${colorClass}`;
            scorePill.textContent = `${percentage}%`;
        } else {
            scorePill.className += ' neutral';
            scorePill.textContent = 'N/A';
        }

        header.appendChild(title);
        header.appendChild(scorePill);

        // Section content (the evaluated content)
        const content = document.createElement('div');
        content.className = 'section-content';
        
        if (sectionContent && sectionContent.trim()) {
            content.textContent = sectionContent.trim();
        } else if (feedbackData && feedbackData.content) {
            content.textContent = feedbackData.content;
        } else {
            content.textContent = 'No content provided';
            content.style.fontStyle = 'italic';
            content.style.color = 'var(--text-muted)';
        }

        // Feedback toggle button
        const feedbackToggle = document.createElement('button');
        feedbackToggle.className = 'feedback-toggle';
        feedbackToggle.innerHTML = 'View Feedback <span>▼</span>';
        
        // Feedback content (initially hidden)
        const feedbackContent = document.createElement('div');
        feedbackContent.className = 'feedback-content';
        
        if (feedbackData) {
            this.populateFeedbackContent(feedbackContent, feedbackData, section);
        }

        // Toggle functionality
        feedbackToggle.addEventListener('click', () => {
            const isExpanded = feedbackContent.classList.contains('expanded');
            
            if (isExpanded) {
                feedbackContent.classList.remove('expanded');
                feedbackToggle.classList.remove('expanded');
                feedbackToggle.innerHTML = 'View Feedback <span>▼</span>';
            } else {
                feedbackContent.classList.add('expanded');
                feedbackToggle.classList.add('expanded');
                feedbackToggle.innerHTML = 'Hide Feedback <span>▲</span>';
            }
        });

        // Assemble section
        sectionDiv.appendChild(header);
        sectionDiv.appendChild(content);
        sectionDiv.appendChild(feedbackToggle);
        sectionDiv.appendChild(feedbackContent);

        return sectionDiv;
    }

    populateFeedbackContent(container, feedbackData, section) {
        container.innerHTML = '';

        // Main feedback message
        if (feedbackData.message) {
            const messageSection = document.createElement('div');
            messageSection.className = 'feedback-section';
            
            const messageLabel = document.createElement('div');
            messageLabel.className = 'feedback-label';
            messageLabel.textContent = 'Feedback:';
            
            const messageText = document.createElement('div');
            messageText.className = 'feedback-text';
            messageText.textContent = feedbackData.message;
            
            messageSection.appendChild(messageLabel);
            messageSection.appendChild(messageText);
            container.appendChild(messageSection);
        }

        // AI evaluation details
        if (feedbackData.reason) {
            const reasonSection = document.createElement('div');
            reasonSection.className = 'feedback-section';
            
            const reasonLabel = document.createElement('div');
            reasonLabel.className = 'feedback-label';
            reasonLabel.textContent = 'Reason:';
            
            const reasonText = document.createElement('div');
            reasonText.className = 'feedback-text';
            reasonText.textContent = feedbackData.reason;
            
            reasonSection.appendChild(reasonLabel);
            reasonSection.appendChild(reasonText);
            container.appendChild(reasonSection);
        }

        // Evidence
        if (feedbackData.evidence) {
            const evidenceSection = document.createElement('div');
            evidenceSection.className = 'feedback-section';
            
            const evidenceLabel = document.createElement('div');
            evidenceLabel.className = 'feedback-label';
            evidenceLabel.textContent = 'Evidence:';
            
            const evidenceText = document.createElement('div');
            evidenceText.className = 'feedback-text';
            evidenceText.style.fontStyle = 'italic';
            evidenceText.textContent = `"${feedbackData.evidence}"`;
            
            evidenceSection.appendChild(evidenceLabel);
            evidenceSection.appendChild(evidenceText);
            container.appendChild(evidenceSection);
        }

        // Recommendation
        if (feedbackData.recommendation) {
            const recommendationSection = document.createElement('div');
            recommendationSection.className = 'feedback-section';
            
            const recommendationLabel = document.createElement('div');
            recommendationLabel.className = 'feedback-label';
            recommendationLabel.textContent = 'Recommendation:';
            
            const recommendationText = document.createElement('div');
            recommendationText.className = 'feedback-text';
            recommendationText.textContent = feedbackData.recommendation;
            
            recommendationSection.appendChild(recommendationLabel);
            recommendationSection.appendChild(recommendationText);
            container.appendChild(recommendationSection);
        }

        // Complex AI details (for 10-point sections)
        if (feedbackData.details && typeof feedbackData.details === 'object') {
            Object.entries(feedbackData.details).forEach(([key, value]) => {
                if (value && key !== 'error' && key !== 'status') {
                    const detailSection = document.createElement('div');
                    detailSection.className = 'feedback-section';
                    
                    const detailLabel = document.createElement('div');
                    detailLabel.className = 'feedback-label';
                    detailLabel.textContent = `${this.formatDetailName(key)}:`;
                    
                    const detailText = document.createElement('div');
                    detailText.className = 'feedback-text';
                    detailText.textContent = value;
                    
                    detailSection.appendChild(detailLabel);
                    detailSection.appendChild(detailText);
                    container.appendChild(detailSection);
                }
            });
        }

        // Error details
        if (feedbackData.details && feedbackData.details.error) {
            const errorSection = document.createElement('div');
            errorSection.className = 'feedback-section';
            
            const errorLabel = document.createElement('div');
            errorLabel.className = 'feedback-label';
            errorLabel.textContent = 'Issue:';
            
            const errorText = document.createElement('div');
            errorText.className = 'feedback-text';
            errorText.style.color = 'var(--error-color)';
            errorText.textContent = feedbackData.details.error;
            
            errorSection.appendChild(errorLabel);
            errorSection.appendChild(errorText);
            container.appendChild(errorSection);
        }
    }

    resetUI() {
        // Reset file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.value = '';
        }
        
        // Show upload section, hide results
        const uploadSection = document.getElementById('upload-section');
        const resultsSection = document.getElementById('results-section');
        
        if (uploadSection) uploadSection.hidden = false;
        if (resultsSection) resultsSection.hidden = true;
        
        // Clear results
        if (this.totalScoreElement) {
            this.totalScoreElement.textContent = '0';
        }
        if (this.problemSpaceElement) {
            this.problemSpaceElement.innerHTML = '';
        }
        if (this.solutionSpaceElement) {
            this.solutionSpaceElement.innerHTML = '';
        }
        
        // Reset current results
        this.currentResults = null;
        
        // Hide loading overlay
        this.hideLoadingOverlay();
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    formatSectionName(section) {
        const nameMap = {
            'outcome': 'Outcome',
            'trunkProblem': 'Trunk Problem',
            'branchProblem': 'Branch Problem',
            'rootCause': 'Root Cause',
            'supportingData': 'Supporting Data',
            'hypothesis': 'Hypothesis',
            'prediction': 'Prediction',
            'testTitle': 'Test Title',
            'shortDescription': 'Short Description',
            'learningObjective': 'Learning Objective',
            'testType': 'Test Type',
            'testVariant': 'Test Variant Description',
            'controlVariant': 'Control Variant Description',
            'audience': 'Audience',
            'duration': 'Duration',
            'successCriteria': 'Success Criteria',
            'dataRequirements': 'Data Requirements',
            'considerations': 'Considerations & Investigation Requirements',
            'whatNext': 'What Next'
        };
        
        return nameMap[section] || section
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    }

    formatDetailName(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    }
}

// Initialize the display manager
window.displayManager = new DisplayManager();