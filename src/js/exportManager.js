class ExportManager {
    constructor() {
        this.currentResults = null;
        // Define section organization matching the UI
        this.problemSpaceSections = ['outcome', 'trunkProblem', 'branchProblem', 'rootCause', 'supportingData', 'hypothesis'];
        this.solutionSpaceSections = ['prediction', 'testTitle', 'shortDescription', 'learningObjective', 'testType', 'testVariant', 'controlVariant', 'audience', 'duration', 'successCriteria', 'dataRequirements', 'considerations', 'whatNext'];
    }

    exportResults(results) {
        if (!results) {
            console.error('No results to export');
            return;
        }

        const htmlDocument = this.generateWordCompatibleHTML(results);
        this.downloadAsWordDocument(htmlDocument);
    }

    generateWordCompatibleHTML(results) {
        const { scores, feedback, totalScore } = results;
        const sections = window.evaluator ? window.evaluator.sections : {};
        const currentDate = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Experiment Evaluation Report</title>
    <style>
        body { 
            font-family: 'Calibri', 'Arial', sans-serif; 
            margin: 0.5in; 
            line-height: 1.2;
            color: #333;
            font-size: 9pt;
        }
        h1 { 
            color: #2c5aa0; 
            font-size: 18pt; 
            text-align: center;
            margin-bottom: 8pt;
        }
        h2 { 
            color: #365f91; 
            font-size: 14pt; 
            margin-top: 15pt; 
            margin-bottom: 10pt;
            border-bottom: 1pt solid #365f91;
            padding-bottom: 3pt;
        }
        h3 { 
            color: #4f81bd; 
            font-size: 11pt; 
            margin-top: 10pt; 
            margin-bottom: 5pt;
        }
        .header-info {
            text-align: center;
            margin-bottom: 12pt;
            font-size: 9pt;
            color: #666;
        }
        .overall-score {
            text-align: center;
            font-size: 24pt;
            font-weight: bold;
            color: #2c5aa0;
            margin: 12pt 0;
        }
        .score-high { color: #70ad47; font-weight: bold; }
        .score-medium { color: #ff9900; font-weight: bold; }
        .score-low { color: #c5504b; font-weight: bold; }
        .section-content { 
            background-color: #f8f9fa; 
            padding: 8pt; 
            margin: 5pt 0; 
            border-left: 3pt solid #ddd;
            font-style: italic;
            font-size: 8pt;
        }
        .feedback { 
            background-color: #fff2cc; 
            padding: 6pt; 
            margin: 5pt 0; 
            border: 1pt solid #d6d3d1;
            font-size: 8pt;
        }
        .feedback-label {
            font-weight: bold;
            color: #365f91;
            margin-bottom: 3pt;
            font-size: 9pt;
        }
        .section-header {
            display: flex;
            align-items: center;
            margin-bottom: 6pt;
        }
        .section-score {
            margin-left: 8pt;
            padding: 2pt 6pt;
            border-radius: 8pt;
            font-size: 8pt;
            font-weight: bold;
        }
        .page-break { page-break-before: always; }
        p { margin: 4pt 0; font-size: 8pt; }
        strong { font-size: 8pt; }
    </style>
</head>
<body>
    <h1>Experiment Evaluation Report</h1>
    <div class="header-info">
        Generated on ${currentDate}
    </div>
    <div class="overall-score">${totalScore}%</div>
`;

        // Problem Space
        html += '<h2>Problem Space</h2>';
        this.problemSpaceSections.forEach(section => {
            if (feedback[section]) {
                html += this.generateSectionHTML(section, scores[section], feedback[section], sections[section]);
            }
        });

        // Solution Space
        html += '<h2 class="page-break">Solution Space</h2>';
        this.solutionSpaceSections.forEach(section => {
            if (feedback[section]) {
                html += this.generateSectionHTML(section, scores[section], feedback[section], sections[section]);
            }
        });

        html += `
</body>
</html>`;

        return html;
    }

    generateSectionHTML(section, score, feedbackData, sectionContent) {
        const sectionName = this.formatSectionName(section);
        const maxScore = this.getMaxScore(section);
        const percentage = Math.round((score / maxScore) * 100);
        const scoreClass = this.getScoreClass(score, maxScore);
        
        let html = `<h3>${sectionName} <span class="section-score ${scoreClass}">${percentage}%</span></h3>`;
        
        // Add input content
        if (sectionContent && sectionContent.trim()) {
            html += `<div class="section-content">${this.escapeHtml(sectionContent)}</div>`;
        }
        
        // Add feedback
        html += '<div class="feedback">';
        html += `<div class="feedback-label">Evaluation Feedback:</div>`;
        html += `<p><strong>Score:</strong> ${score}/${maxScore}</p>`;
        
        if (feedbackData.message || feedbackData.reason) {
            html += `<p><strong>Assessment:</strong> ${this.escapeHtml(feedbackData.message || feedbackData.reason)}</p>`;
        }
        
        if (feedbackData.evidence) {
            html += `<p><strong>Evidence:</strong> ${this.escapeHtml(feedbackData.evidence)}</p>`;
        }
        
        if (feedbackData.recommendation && feedbackData.recommendation !== 'No recommendation needed as the section meets the criteria of the rubric.' && feedbackData.recommendation !== 'No recommendations, all requirements are met.') {
            html += `<p><strong>Recommendation:</strong> ${this.escapeHtml(feedbackData.recommendation)}</p>`;
        }
        
        // Add detailed criteria feedback for complex sections
        if (feedbackData.details && typeof feedbackData.details === 'object') {
            Object.keys(feedbackData.details).forEach(key => {
                if (key !== 'error' && key !== 'status') {
                    html += `<p><strong>${this.formatCriteriaName(key)}:</strong> ${this.escapeHtml(feedbackData.details[key])}</p>`;
                }
            });
        }
        
        html += '</div>';
        
        return html;
    }

    formatSectionName(section) {
        const nameMap = {
            outcome: 'Outcome',
            trunkProblem: 'Trunk Problem',
            branchProblem: 'Branch Problem',
            rootCause: 'Root Cause',
            supportingData: 'Supporting Data',
            hypothesis: 'Hypothesis',
            prediction: 'Prediction',
            testTitle: 'Test Title',
            shortDescription: 'Short Description',
            learningObjective: 'Learning Objective',
            testType: 'Test Type',
            testVariant: 'Test Variant Description',
            controlVariant: 'Control Variant Description',
            audience: 'Audience',
            duration: 'Duration',
            successCriteria: 'Success Criteria',
            dataRequirements: 'Data Requirements',
            considerations: 'Considerations & Investigation Requirements',
            whatNext: 'What Next'
        };
        return nameMap[section] || section;
    }

    formatCriteriaName(criteria) {
        return criteria.charAt(0).toUpperCase() + criteria.slice(1).replace(/([A-Z])/g, ' $1');
    }

    getMaxScore(section) {
        // Pattern matching sections (not scored)
        if (['testTitle', 'shortDescription', 'testType'].includes(section)) {
            return 0;
        }
        // Binary sections (2 points)
        if (['outcome', 'trunkProblem', 'branchProblem'].includes(section)) {
            return 2;
        }
        // 20-point sections
        if (['rootCause', 'hypothesis'].includes(section)) {
            return 20;
        }
        // 10-point sections
        if (['prediction', 'supportingData'].includes(section)) {
            return 10;
        }
        // 8-point sections
        if (['successCriteria'].includes(section)) {
            return 8;
        }
        // Simple AI sections (2 points)
        return 2;
    }

    getScoreClass(score, maxScore) {
        const percentage = (score / maxScore) * 100;
        if (maxScore === 20) {
            if (percentage >= 80) return 'score-high';
            if (percentage >= 60) return 'score-medium';
            return 'score-low';
        } else if (maxScore === 10) {
            if (percentage >= 80) return 'score-high';
            if (percentage >= 60) return 'score-medium';
            return 'score-low';
        } else if (maxScore === 8) {
            if (percentage >= 75) return 'score-high';
            if (percentage >= 50) return 'score-medium';
            return 'score-low';
        } else if (maxScore === 2) {
            if (percentage === 100) return 'score-high';
            if (percentage >= 50) return 'score-medium';
            return 'score-low';
        } else {
            if (percentage >= 80) return 'score-high';
            if (percentage >= 60) return 'score-medium';
            return 'score-low';
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    }

    downloadAsWordDocument(htmlContent) {
        const fileName = `experiment-evaluation-report-${new Date().toISOString().split('T')[0]}.doc`;
        
        // Create blob with Word-compatible MIME type
        const blob = new Blob([htmlContent], { 
            type: 'application/msword;charset=utf-8' 
        });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
}

// Initialize the export manager
window.exportManager = new ExportManager(); 