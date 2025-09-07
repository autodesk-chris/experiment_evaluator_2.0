class DisplayManager {
    constructor() {
        this.totalScoreElement = document.getElementById('total-score');
        this.sectionListElement = document.getElementById('section-list');
        this.feedbackListElement = document.getElementById('feedback-list');
        this.exportBtn = document.getElementById('export-btn');
        this.newEvaluationBtn = document.getElementById('new-evaluation-btn');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.exportBtn.addEventListener('click', () => {
            window.exportManager.exportResults(this.currentResults);
        });

        this.newEvaluationBtn.addEventListener('click', () => {
            this.resetUI();
        });
    }

    updateResults(scores, feedback, totalScore) {
        this.currentResults = { scores, feedback, totalScore };
        this.updateTotalScore(totalScore);
        this.updateSectionScores(scores, feedback);
        this.updateDetailedFeedback(feedback);
    }

    updateTotalScore(score) {
        this.totalScoreElement.textContent = score;
        this.totalScoreElement.className = this.getScoreClass(score);
    }

    getMaxScore(section) {
        // Binary sections (10 points)
        const binarySections = ['outcome', 'trunkProblem', 'branchProblem'];
        // AI-evaluated sections (10 points)
        const aiSections = ['rootCause', 'supportingData', 'hypothesis', 'prediction'];
        // AI-evaluated sections with 2-point scoring
        const aiTwoPointSections = ['learningObjective', 'testVariant'];
        
        if (binarySections.includes(section) || aiSections.includes(section)) {
            return 10;
        }
        // 2-point sections (AI or pattern-matching)
        return 2;
    }

    updateSectionScores(scores, feedback) {
        this.sectionListElement.innerHTML = '';
        
        Object.entries(scores).forEach(([section, score]) => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'score-item';
            
            const label = document.createElement('div');
            label.className = 'score-label';
            label.textContent = this.formatSectionName(section);
            
            const maxScore = this.getMaxScore(section);
            const value = document.createElement('div');
            value.className = `score-value ${this.getScoreClass((score / maxScore) * 10)}`; // Normalize to /10 for color coding
            value.textContent = `${score}/${maxScore}`;
            
            scoreItem.appendChild(label);
            scoreItem.appendChild(value);
            this.sectionListElement.appendChild(scoreItem);
        });
    }

    updateDetailedFeedback(feedback) {
        this.feedbackListElement.innerHTML = '';
        
        Object.entries(feedback).forEach(([section, data]) => {
            const feedbackItem = document.createElement('div');
            feedbackItem.className = 'feedback-item';
            
            const header = document.createElement('div');
            header.className = 'feedback-header';
            
            const title = document.createElement('div');
            title.className = 'feedback-title';
            title.textContent = this.formatSectionName(section);
            
            const score = document.createElement('div');
            const maxScore = this.getMaxScore(section);
            score.className = `score-value ${this.getScoreClass(data.score !== undefined ? (data.score / maxScore) * 10 : 0)}`;
            if (data.score !== undefined) {
                score.textContent = `${data.score}/${maxScore}`;
            }
            
            header.appendChild(title);
            header.appendChild(score);
            
            const content = document.createElement('div');
            content.className = 'feedback-content';
            
            // Add main message
            const message = document.createElement('p');
            message.textContent = data.message;
            content.appendChild(message);
            
            // Add detailed feedback if available
            if (data.details) {
                Object.entries(data.details).forEach(([key, value]) => {
                    if (value) {
                        const detail = document.createElement('p');
                        detail.innerHTML = `<strong>${this.formatDetailName(key)}:</strong> ${value}`;
                        content.appendChild(detail);
                    }
                });
            }
            
            // Add recommendation if available
            if (data.recommendation) {
                const recommendation = document.createElement('p');
                recommendation.innerHTML = `<strong>Recommendation:</strong> ${data.recommendation}`;
                content.appendChild(recommendation);
            }
            
            feedbackItem.appendChild(header);
            feedbackItem.appendChild(content);
            this.feedbackListElement.appendChild(feedbackItem);
        });
    }

    resetUI() {
        // Reset file input
        document.getElementById('file-input').value = '';
        
        // Show upload section, hide results
        document.getElementById('upload-section').hidden = false;
        document.getElementById('results-section').hidden = true;
        
        // Clear results
        this.totalScoreElement.textContent = '0';
        this.sectionListElement.innerHTML = '';
        this.feedbackListElement.innerHTML = '';
        
        // Reset current results
        this.currentResults = null;
    }

    getScoreClass(score) {
        if (score >= 8) return 'good';
        if (score >= 5) return 'warning';
        return 'poor';
    }

    formatSectionName(section) {
        return section
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