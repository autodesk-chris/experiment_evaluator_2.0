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

        // Section header mappings with variations
        const sectionMappings = {
            outcome: ['outcome'],
            trunkProblem: ['trunk problem'],
            branchProblem: ['branch problem'],
            rootCause: ['root cause statement', 'root cause', 'root cause problem statement'],
            supportingData: ['supporting data', 'why'],
            hypothesis: ['hypothesis statement', 'hypothesis'],
            prediction: ['prediction'],
            testTitle: ['test title'],
            shortDescription: ['short description'],
            learningObjective: ['test learning objective', 'learning objective'],
            testType: ['test type'],
            testVariant: ['test variant description'],
            controlVariant: ['control variant description'],
            audience: ['audience'],
            duration: ['duration'],
            successCriteria: ['success criteria'],
            dataRequirements: ['data requirements'],
            considerations: ['consideration or investigative requirements', 'considerations and investigation requirements', 'considerations'],
            whatNext: ['what next']
        };

        // Split content into lines
        const lines = content.split('\n');
        let currentSection = null;
        let debugLog = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Remove bullet points, normalize whitespace, and convert to lowercase
            const normalizedLine = line.replace(/^[•\-\*]\s*/, '')
                                     .replace(/[:\.]\s*$/, '')
                                     .trim()
                                     .toLowerCase();

            // Skip empty lines
            if (!normalizedLine) continue;

            // Check for section headers
            let foundSection = false;
            for (const [sectionKey, headerVariations] of Object.entries(sectionMappings)) {
                if (headerVariations.some(header => normalizedLine === header)) {
                    currentSection = sectionKey;
                    foundSection = true;
                    debugLog.push(`Found section: ${sectionKey} at line ${i + 1}`);
                    break;
                }
            }

            // If this line wasn't a section header and we have a current section, append content
            if (!foundSection && currentSection && normalizedLine) {
                sections[currentSection] += (sections[currentSection] ? '\n' : '') + line.trim();
            }
        }

        // Log debug information
        console.log('Section Detection Results:', debugLog);
        console.log('Parsed Sections:', Object.entries(sections).map(([key, value]) => ({
            section: key,
            hasContent: Boolean(value),
            contentPreview: value ? value.substring(0, 50) + '...' : 'empty'
        })));

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