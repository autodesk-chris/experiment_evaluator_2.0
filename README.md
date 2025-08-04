# Experiment Evaluator

A web-based tool that helps users improve their experiment documentation by scoring it against a defined rubric and suggesting improvements.

## Features

- Document upload (.txt and .docx support)
- Section detection and evaluation
- AI-enhanced feedback using GPT-4
- Detailed scoring per section
- Exportable evaluation results

## Technical Stack

- Frontend: HTML, CSS, and Vanilla JavaScript
- Backend: Netlify Functions
- AI: OpenAI GPT-4 API
- Deployment: Static web app on Netlify

## Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm start
```

3. Run tests:
```bash
npm test
```

## Project Structure

```
experiment-evaluator/
├── src/
│   ├── js/
│   │   ├── documentHandler.js    # File upload and parsing
│   │   ├── evaluator.js         # Core evaluation logic
│   │   ├── displayManager.js    # UI management
│   │   └── exportManager.js     # Export functionality
│   ├── css/
│   │   └── styles.css          # Main stylesheet
│   └── functions/              # Netlify Functions
│       └── evaluateSection.js  # OpenAI API proxy
├── public/
│   ├── index.html             # Main HTML file
│   └── assets/               # Static assets
└── tests/                    # Test files
```

## License

MIT 