class DocumentHandler {
    constructor() {
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.uploadBtn = document.querySelector('.upload-btn');
        this.progressBar = document.getElementById('upload-progress');
        this.errorMessage = document.getElementById('upload-error');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Drag and drop events
        this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));

        // Click to upload
        this.uploadBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    async processFile(file) {
        // Validate file type
        if (!this.validateFileType(file)) {
            this.showError('Please upload a .txt or .docx file');
            return;
        }

        this.showProgress();
        try {
            const content = await this.readFile(file);
            const sections = this.parseContent(content);
            
            // Hide upload section and show results
            document.getElementById('upload-section').hidden = true;
            document.getElementById('results-section').hidden = false;

            // Trigger evaluation
            window.evaluator.evaluate(sections);
        } catch (error) {
            this.showError('Error processing file: ' + error.message);
        } finally {
            this.hideProgress();
        }
    }

    validateFileType(file) {
        const validTypes = ['.txt', '.docx'];
        const fileName = file.name.toLowerCase();
        return validTypes.some(type => fileName.endsWith(type));
    }

    async readFile(file) {
        if (file.name.endsWith('.txt')) {
            return await this.readTextFile(file);
        } else {
            return await this.readDocxFile(file);
        }
    }

    readTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Error reading file'));
            reader.readAsText(file);
        });
    }

    async readDocxFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        } catch (error) {
            throw new Error('Error reading DOCX file');
        }
    }

    parseContent(content) {
        const sections = {
            outcome: '',
            trunkProblem: '',
            branchProblem: '',
            rootCause: '',
            supportingData: '',
            hypothesis: '',
            prediction: '',
            testTitle: '',
            shortDescription: '',
            learningObjective: '',
            testType: '',
            testVariant: '',
            controlVariant: '',
            audience: '',
            duration: '',
            successCriteria: '',
            dataRequirements: '',
            considerations: '',
            whatNext: ''
        };

        // Split content into sections based on headers
        const lines = content.split('\n');
        let currentSection = null;

        for (const line of lines) {
            const trimmedLine = line.trim().toLowerCase();
            
            // Check for section headers
            if (trimmedLine === 'outcome') currentSection = 'outcome';
            else if (trimmedLine === 'trunk problem') currentSection = 'trunkProblem';
            else if (trimmedLine === 'branch problem') currentSection = 'branchProblem';
            else if (trimmedLine === 'root cause statement') currentSection = 'rootCause';
            else if (trimmedLine === 'supporting data') currentSection = 'supportingData';
            else if (trimmedLine === 'hypothesis statement') currentSection = 'hypothesis';
            else if (trimmedLine === 'prediction') currentSection = 'prediction';
            else if (trimmedLine === 'test title') currentSection = 'testTitle';
            else if (trimmedLine === 'short description') currentSection = 'shortDescription';
            else if (trimmedLine === 'test learning objective') currentSection = 'learningObjective';
            else if (trimmedLine === 'test type') currentSection = 'testType';
            else if (trimmedLine === 'test variant description') currentSection = 'testVariant';
            else if (trimmedLine === 'control variant description') currentSection = 'controlVariant';
            else if (trimmedLine === 'audience') currentSection = 'audience';
            else if (trimmedLine === 'duration') currentSection = 'duration';
            else if (trimmedLine === 'success criteria') currentSection = 'successCriteria';
            else if (trimmedLine === 'data requirements') currentSection = 'dataRequirements';
            else if (trimmedLine === 'considerations and investigation requirements') currentSection = 'considerations';
            else if (trimmedLine === 'what next') currentSection = 'whatNext';
            else if (currentSection && line.trim()) {
                // Append content to current section
                sections[currentSection] += (sections[currentSection] ? '\n' : '') + line.trim();
            }
        }

        return sections;
    }

    showProgress() {
        this.progressBar.hidden = false;
        this.progressBar.querySelector('.progress-fill').style.width = '100%';
    }

    hideProgress() {
        this.progressBar.hidden = true;
        this.progressBar.querySelector('.progress-fill').style.width = '0';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.hidden = false;
        setTimeout(() => {
            this.errorMessage.hidden = true;
        }, 5000);
    }
}

// Initialize the document handler
window.documentHandler = new DocumentHandler(); 