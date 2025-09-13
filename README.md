# 🎯 Cursor Experiment Evaluator

**Ultra-simple experiment quality evaluation using Cursor AI**

Your team writes experiments in Loop → Copy to Cursor → Get instant quality feedback → Improve back in Loop

## 🚀 How It Works

1. **Write** your experiment in Loop (or anywhere)
2. **Open** this project in Cursor (`.cursorrules` auto-loads)
3. **Ask** Cursor to evaluate your experiment
4. **Get** detailed feedback and scoring
5. **Improve** until you hit 32+/40 points (80% quality)

---

## 💬 Simple Evaluation

Just ask Cursor any of these questions with your experiment text:

### **Quick Evaluation**

```
Evaluate this experiment against the project quality standards:

[PASTE YOUR EXPERIMENT HERE]
```

### **Section-by-Section**

```
Evaluate this root cause statement:
[PASTE ROOT CAUSE HERE]
```

```
Evaluate this hypothesis:
[PASTE HYPOTHESIS HERE]
```

### **Complete Analysis**

```
Score this experiment out of 40 points and suggest improvements:

[PASTE COMPLETE EXPERIMENT HERE]
```

---

## 🎯 Quality Standards

**Target Score:** 32+/40 points (80% quality)

### **Root Cause (10 pts)**

- Format: "[problem] because [reason]"
- Focus: User problems only (not business/solutions)
- Length: 1-2 sentences max

### **Supporting Data (10 pts)**

- Include specific sources
- Use bullet points
- Support the root cause directly

### **Hypothesis (10 pts)**

- Present-tense belief statement
- Include clear rationale
- Must be testable/falsifiable

### **Prediction (10 pts)**

- "If...then..." format
- Measurable outcomes
- No implementation details

---

## 🔄 Workflow

### **Individual Process:**

1. Write experiment in Loop
2. Open this project in Cursor
3. Ask Cursor to evaluate your experiment
4. Improve based on feedback
5. Repeat until 32+/40 points

### **Team Process:**

1. **Quality Gate**: 32+/40 before team review
2. **Business Review**: Focus on strategy (quality automated)
3. **Launch**: High-confidence experiments

---

## 🎓 Quick Training (5 minutes)

1. **Read** the quality standards above
2. **Try** one evaluation prompt with an existing experiment
3. **Practice** improving based on feedback
4. **Establish** 32+/40 quality gate for your team

---

## 🔧 Troubleshooting

**Q: Cursor gives generic responses?**
A: Make sure `.cursorrules` file is in your project. Restart Cursor if needed.

**Q: Scores seem inconsistent?**
A: Make sure you're in this project folder when asking Cursor to evaluate.

**Q: What if I get 40+/40?**
A: Great! Your experiment is ready. Focus on business review.

**Q: Cursor won't evaluate?**
A: Check that you pasted both the prompt AND your experiment text.

---

## 📊 Quick Reference

| Section         | Points | Key Rule                     |
| --------------- | ------ | ---------------------------- |
| Root Cause      | 10     | "[problem] because [reason]" |
| Supporting Data | 10     | Include sources              |
| Hypothesis      | 10     | Present-tense belief         |
| Prediction      | 10     | "If...then..." format        |
| **Total**       | **40** | **Target: 32+**              |

---

**🚀 That's it! Simple, effective experiment evaluation with Cursor.**
