# Experiment Evaluator Documentation

## Overview

The Experiment Evaluator is a web-based tool that automatically analyzes and scores experiment briefs using AI-powered evaluation. It provides detailed feedback on 13 different sections of an experiment, helping teams improve their experimental design before execution.

**Live Demo**: Upload a `.txt` or `.docx` experiment file and receive instant scoring with actionable feedback.

---

## Architecture

### System Components

```
Frontend (Port 3000)          Backend (Port 3001)         AI Service
┌─────────────────┐          ┌─────────────────┐         ┌──────────────┐
│  React/Vanilla  │  ────►   │  Express.js     │  ────►  │  OpenAI API  │
│  JavaScript     │          │  API Server     │         │  GPT-4       │
│                 │          │                 │         │              │
│  • File Upload  │          │  • AI Prompts   │         │  • Scoring   │
│  • Results UI   │          │  • Validation   │         │  • Feedback  │
│  • Export       │          │  • Error Handle │         │  • Analysis  │
└─────────────────┘          └─────────────────┘         └──────────────┘
```

### Core Files

| Component | File | Purpose |
|-----------|------|---------|
| **Frontend** | `public/index.html` | Main UI structure |
| | `src/css/styles.css` | Modern responsive styling |
| | `src/js/documentHandler.js` | File upload & parsing |
| | `src/js/displayManager.js` | Results rendering |
| | `src/js/evaluator.js` | Evaluation orchestration |
| | `src/js/exportManager.js` | Word document export |
| **Backend** | `src/api/server.js` | Express API server |
| **Config** | `webpack.config.js` | Build configuration |
| | `package.json` | Dependencies & scripts |

---

## How It Works

### 1. File Upload & Parsing
- **Supported formats**: `.txt`, `.docx`
- **Parser**: Automatically extracts 13 experiment sections using keyword mapping
- **Sections identified**: Outcome, Problems, Hypothesis, Prediction, Test details, Success criteria, etc.

### 2. AI Evaluation Process
- **AI Model**: OpenAI GPT-4 with specialized prompts for each section
- **Scoring**: Each section receives a score (0-10 or 0-2 points) based on specific criteria
- **Total Score**: Converted to percentage out of 70 total possible points

### 3. Results Display
- **Modern UI**: Circular overall score with Problem Space and Solution Space organization
- **Color-coded feedback**: Green (excellent), Orange (good), Red (needs improvement)
- **Expandable details**: Click to view detailed AI feedback and recommendations

### 4. Export Functionality
- **Word-compatible export**: Generates `.doc` file with all content and expanded feedback
- **Professional format**: Structured report suitable for sharing with stakeholders

---

## Evaluation Criteria

### Problem Space Sections (60 points total)

  #### 1. Outcome (4 points)
  **Binary Check**: Does it describe a desired business or user outcome?
  - ✅ **Pass (4 pts)**: Content exists
  - ❌ **Fail (0 pts)**: Missing, vague, or describes features instead of outcomes
  
  #### 2. Trunk Problem (4 points)
  **Binary Check**: Is there a high-level problem statement?
  - ✅ **Pass (4 pts)**: Content exists
  - ❌ **Fail (0 pts)**: Missing or unclear problem statement
  
  #### 3. Branch Problem (4 points)
  **Binary Check**: Is there a specific sub-problem?
  - ✅ **Pass (4 pts)**: Content exists
  - ❌ **Fail (0 pts)**: Missing or too vague

#### 4. Root Cause (10 points)
**AI Evaluation** - Detailed scoring across 4 criteria:
- **Length (1 pt)**: Two sentences or fewer, less than 50 words
- **Format (1 pt)**: Uses causal structure (e.g., "[problem] because [reason]")
- **Focus (4 pts)**: Describes user problems without referencing solutions
- **Clarity (4 pts)**: Logically explains WHY the problem exists

#### 5. Supporting Data (10 points)
**AI Evaluation** - Comprehensive data assessment:
- **Structure & Format (2 pts)**: Clear bullet points or organized presentation
- **Relevance (3 pts)**: Directly supports the root cause
- **Clarity & Specificity (3 pts)**: Clear, specific evidence
- **Source Attribution (2 pts)**: Clear data sources mentioned

#### 6. Hypothesis (10 points)
**AI Evaluation** - Tests hypothesis quality:
- **Belief Statement (2 pts)**: Present-tense belief statement
- **Reason (2 pts)**: Clear rationale provided
- **Falsifiability (3 pts)**: Testable and measurable
- **Reflects Insights (3 pts)**: Aligns with root cause findings

### Solution Space Sections (28 points total)

#### 7. Prediction (10 points)
**AI Evaluation** - Prediction quality assessment:
- **Clarity (3 pts)**: Clear expected outcome
- **Specificity (3 pts)**: Specific, measurable predictions
- **Logic (2 pts)**: Logical connection to hypothesis
- **Testability (2 pts)**: Can be validated through testing

#### 8. Test Title (Pattern Match)
**Non-scored**: Identifies if test title exists (for context only)

#### 9. Short Description (Pattern Match)
**Non-scored**: Identifies if description exists (for context only)

#### 10. Learning Objective (2 points)
**AI Evaluation**:
- **2 pts**: Clear, concise, learning-focused with specific learning goal and user behavior
- **1 pt**: Somewhat clear but missing key elements
- **0 pts**: Unclear, missing, or not learning-focused

#### 11. Test Type (Pattern Match)
**Non-scored**: Identifies test type (A/B, multivariate, etc.)

#### 12. Test Variant Description (2 points)
**AI Evaluation**:
- **2 pts**: Clear explanation of variant experience and user interaction expectations
- **1 pt**: Somewhat clear but missing implementation details
- **0 pts**: Vague or not clearly different from control

#### 13. Control Variant Description (2 points)
**AI Evaluation**:
- **2 pts**: Clearly states and describes current baseline experience
- **1 pt**: Mostly clear but lacks detail for understanding
- **0 pts**: Unclear or overlaps too much with variant

#### 14. Audience (2 points)
**AI Evaluation**:
- **2 pts**: Specific targeting criteria and clear split methodology
- **1 pt**: Reasonable definition but vague on timing or assignment
- **0 pts**: Missing, poorly defined, or likely to introduce bias

#### 15. Duration (2 points)
**AI Evaluation**:
- **2 pts**: Duration clearly stated with rationale (user volume, statistical power, etc.)
- **1 pt**: Duration stated but no rationale provided
- **0 pts**: Missing, vague, or lacks justification

#### 16. Success Criteria (2 points)
**AI Evaluation**:
- **2 pts**: Clear quantitative thresholds and/or statistical significance criteria
- **1 pt**: Success stated but lacks specificity
- **0 pts**: No clear threshold or ambiguous criteria

#### 17. Data Requirements (2 points)
**AI Evaluation**:
- **2 pts**: Metrics listed, aligned with success criteria, clear collection method
- **1 pt**: Some metrics listed but alignment unclear or collection method vague
- **0 pts**: Metrics missing/unclear, no explanation of data collection

#### 18. Considerations & Investigation Requirements (2 points)
**AI Evaluation**:
- **2 pts**: Multiple considerations with specific risks, dependencies, or exploration areas
- **1 pt**: Some considerations but lacks depth or specificity
- **0 pts**: Missing or too vague to be useful

#### 19. What Next (2 points)
**AI Evaluation**:
- **2 pts**: Clear actions for both success and failure scenarios
- **1 pt**: Some next steps but incomplete coverage of scenarios
- **0 pts**: Missing or unclear follow-up actions

---

## Scoring System

### Total Points: 70
- **Problem Space**: 42 points (3 × 4pt + 3 × 10pt sections)
- **Solution Space**: 28 points (4 × 10pt + 9 × 2pt sections)

### Score Conversion
Final score = (Total Points Earned / 70) × 100

### Color Coding
- 🟢 **Green**: 80%+ (or 2/2 for simple sections)
- 🟠 **Orange**: 60-79% (or 1/2 for simple sections)  
- 🔴 **Red**: Below 60% (or 0/2 for simple sections)

---

## Usage Instructions

### Getting Started
1. **Start servers**: `npm start`
2. **Access**: Navigate to `http://localhost:3000`
3. **Upload**: Drag & drop or select your experiment file
4. **Wait**: Watch the flask animation while AI analyzes your experiment
5. **Review**: Examine scores and detailed feedback
6. **Export**: Download Word document with full evaluation

### File Format Requirements
Your experiment document should include these sections (keywords):
- Outcome, Problem, Root Cause, Supporting Data, Hypothesis
- Prediction, Test Title, Description, Learning Objective
- Test Variant, Control Variant, Audience, Duration
- Success Criteria, Data Requirements, Considerations, What Next

### Best Practices
- **Be specific**: Vague statements receive lower scores
- **Include data**: Supporting evidence improves scores significantly
- **Define clearly**: Ambiguous criteria hurt evaluation scores
- **Think user-first**: Focus on user problems, not just business metrics

---

## Technical Setup

### Prerequisites
- Node.js 14+
- OpenAI API key

### Installation
```bash
git clone <repository>
cd experiment_evaluator_2.0
npm install
```

### Environment Setup
Create `.env` file:
```
OPENAI_API_KEY=your_api_key_here
```

### Development
```bash
npm start          # Start both frontend and backend
npm run build      # Build for production
```

### Architecture Notes
- **Frontend**: Vanilla JavaScript with Webpack bundling
- **Backend**: Express.js API server
- **AI**: OpenAI GPT-4 with specialized prompts
- **Export**: HTML-to-Word document generation
- **Styling**: Modern CSS with responsive design

---

## Troubleshooting

### Common Issues
1. **Port conflicts**: Use `lsof -i :3000,3001` to check running processes
2. **API key errors**: Verify `.env` file exists and contains valid OpenAI key
3. **File parsing issues**: Ensure document contains recognizable section headers
4. **Loading stuck**: Check browser console for JavaScript errors

### Support
For technical issues or evaluation criteria questions, refer to the codebase or create an issue in the repository.
