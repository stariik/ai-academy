# Claude Prompt Template for Creating Course Outlines

Copy this prompt into Claude and replace the parts in [brackets].

---

## The Prompt:

```
I'm creating an online course for AI Academy — a paid AI learning platform for adults. I need you to create a detailed course outline that will be used as source input for our AI lesson generator.

COURSE TOPIC: [e.g., "Prompt Engineering for Business Professionals"]

TARGET AUDIENCE: [e.g., "Marketing managers and business owners with no technical background"]

COURSE GOAL: [e.g., "Students should be able to write effective prompts for any AI tool and apply them in their daily work"]

LANGUAGE FOR THE OUTLINE: [English / Georgian / etc.]

REQUIREMENTS:
- Create 5-6 lessons (each will become a ~15 minute learning session)
- Each lesson needs 4-5 detailed key points
- Each key point MUST include specific details after a colon — frameworks, tool names, techniques, examples, or angles. NOT just topic labels.

FORMAT — follow this EXACT structure:

Lesson 1: [Clear, specific lesson title]
- [Key point]: [specific details — what exactly to teach, which tools/frameworks/examples to use]
- [Key point]: [specific details]
- [Key point]: [specific details]
- [Key point]: [specific details]
- [Key point]: [specific details]

Lesson 2: [Title]
- ...

QUALITY RULES:
1. Key points are NOT just topic labels. BAD: "Common mistakes". GOOD: "Common mistakes: being vague, no context, asking multiple things at once, not specifying output format"
2. Include specific tool names where relevant (ChatGPT, Claude, Midjourney, Make.com, etc.)
3. Include specific frameworks/methods by name (AIDA, RCTF, OODA, etc.)
4. Each lesson should build on the previous one — progressive difficulty
5. The last lesson should be practical application / putting it all together
6. Include practice exercises or hands-on activities in key points where appropriate
7. Be specific enough that someone reading ONLY the outline knows exactly what each lesson covers

EXAMPLE of what good key points look like:

Lesson 3: Advanced Prompting Techniques
- Chain-of-thought prompting: making AI reason step by step, when to use it (complex math, logic, analysis), example: "Let's think step by step about..."
- Few-shot prompting: teaching AI by giving 2-3 examples in your prompt, format: input→output pairs, best for consistent formatting tasks
- Role-based prompting: assigning AI a specific expert persona, how it changes output quality, practice: compare outputs with and without role assignment
- Temperature and creativity control: what temperature means (0=deterministic, 1=creative), when to use low vs high, platform-specific settings
- Building reusable prompt templates: creating a personal prompt library for daily tasks, organizing by category (email, analysis, writing, coding)

Now create the full course outline.
```

---

## Tips:

- After Claude generates the outline, review it and add/edit any key points based on your domain knowledge
- If a lesson has 6+ key points, our system will automatically split it into multiple 15-min lessons
- Save the output as a PDF or DOCX and upload it to AI Academy admin → "Upload Course Outline"
- The outline language should match the language you select in admin when generating
