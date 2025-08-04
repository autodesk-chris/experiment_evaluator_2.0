class ExportManager {
    constructor() {
        this.currentResults = null;
    }

    exportResults(results) {
        if (!results) {
            console.error('No results to export');
            return;
        }

        const exportData = this.formatResultsForExport(results);
        this.downloadAsJSON(exportData);
    }

    formatResultsForExport(results) {
        const { scores, feedback, totalScore } = results;
        
        const formattedResults = {
            evaluationDate: new Date().toISOString(),
            totalScore,
            sections: {}
        };

        // Combine scores and feedback for each section
        Object.keys(feedback).forEach(section => {
            formattedResults.sections[section] = {
                score: scores[section] || 0,
                feedback: feedback[section].message,
                details: feedback[section].details || {},
                recommendation: feedback[section].recommendation
            };
        });

        return formattedResults;
    }

    downloadAsJSON(data) {
        const fileName = `experiment-evaluation-${new Date().toISOString().split('T')[0]}.json`;
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        
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