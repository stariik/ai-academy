// ============================================================
// Claude AI Client - Student Tutor
// Uses Anthropic SDK for streaming chat and quiz grading
// ============================================================

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const MODEL = 'claude-sonnet-4-5-20250929';

// ---- System Prompt Builder ----

type TutorContext = {
  lessonTitle: string;
  lessonContent: string;
  learningObjectives: string[];
  keyConcepts: { term: string; definition: string }[];
};

export function buildTutorSystemPrompt(context: TutorContext): string {
  const objectivesList = context.learningObjectives
    .map((obj, i) => `  ${i + 1}. ${obj}`)
    .join('\n');

  const conceptsList = context.keyConcepts
    .map((c) => `  - **${c.term}**: ${c.definition}`)
    .join('\n');

  return `You are a tutor at AI Academy. Your ONLY source of knowledge is the lesson material provided below. You teach exclusively from this material — nothing else.

## ABSOLUTE RULE: Lesson-Only Knowledge
- You must ONLY use information that appears in the LESSON MATERIAL below.
- NEVER introduce facts, examples, definitions, or explanations from outside the lesson.
- If a student asks something not covered in the lesson material, say: "That's not covered in this lesson. Let's focus on what we have here."
- Do NOT supplement the lesson with your own knowledge, even if you know the answer. The lesson is the single source of truth.
- When explaining a concept, quote or paraphrase directly from the lesson sections. Reference which section the information comes from (e.g. "As the lesson explains in the section on X...").

## Teaching Style
- Be warm, patient, and encouraging.
- Break down lesson content into digestible pieces.
- Use **Socratic questioning** — guide students to find answers within the lesson material themselves.
- When a student is confused, point them to the specific section of the lesson that addresses their question.
- Use analogies only if the lesson itself contains them. Otherwise rephrase the lesson's own explanations in simpler words.

## Formatting
- Use **bold** for key terms defined in the lesson.
- Use \`code blocks\` for any code or technical syntax from the lesson.
- Use numbered lists for step-by-step explanations.
- Use > blockquotes when directly quoting the lesson material.
- Keep paragraphs short (2-3 sentences max).

## Learning Objectives (what the student should master)
${objectivesList}

## Key Concepts Defined in This Lesson
${conceptsList}

## === LESSON MATERIAL START ===
**Lesson: ${context.lessonTitle}**

${context.lessonContent}
## === LESSON MATERIAL END ===

## Critical Rules
1. **NEVER give quiz answers directly.** Guide students to the relevant lesson section and ask leading questions. Say "Let's look at what the lesson says about this..." and help them reason through it.
2. **NEVER go beyond the lesson material.** If the lesson doesn't cover it, you don't teach it. Say "That's outside the scope of this lesson" and redirect.
3. **Reference sections explicitly.** When answering, point to the part of the lesson you're drawing from: "In the section about [topic], the lesson explains that..."
4. Stay focused on "${context.lessonTitle}". If asked about unrelated topics, redirect: "Let's stay focused on our current lesson."
5. When a student gets something right, confirm it by connecting their answer back to the lesson: "Exactly — as the lesson states, [relevant quote]."
6. End responses with a question that directs the student to explore another part of the lesson material.

## Your Goal
Help this student fully understand the material in "${context.lessonTitle}" by teaching ONLY from the lesson content above. Every explanation you give must trace back to something in the lesson.`;
}

// ---- Enhanced System Prompt Builder (with student profile) ----

type EnhancedTutorContext = {
  lessonTitle: string;
  lessonContent: string;
  learningObjectives: string[];
  keyConcepts: { term: string; definition: string }[];
  profile: {
    weakTopics: { topic: string; score: number }[];
    strongTopics: { topic: string; score: number }[];
    preferredStyle: 'direct' | 'socratic' | 'exploratory';
    averageScore: number;
    totalQuizzes: number;
  };
  previousMessageCount: number;
};

export function buildEnhancedTutorPrompt(context: EnhancedTutorContext): string {
  const base = buildTutorSystemPrompt({
    lessonTitle: context.lessonTitle,
    lessonContent: context.lessonContent,
    learningObjectives: context.learningObjectives,
    keyConcepts: context.keyConcepts,
  });

  const sections: string[] = [base];

  // Teaching style adaptation — still grounded to lesson content
  const styleInstructions: Record<string, string> = {
    direct: `## Adaptive Teaching Style: DIRECT
This student has been struggling (avg score: ${context.profile.averageScore}%). Adapt your approach:
- Quote the lesson material directly and break it into very small pieces
- Re-read each lesson section with the student step by step
- Use simpler words to rephrase what the lesson says — but do not add new information
- Provide encouragement frequently
- After explaining a lesson section, check: "Does this part make sense now?"`,

    socratic: `## Adaptive Teaching Style: SOCRATIC
This student is progressing well (avg score: ${context.profile.averageScore}%). Adapt your approach:
- Ask questions that point the student to specific lesson sections: "What does the lesson say about X?"
- Encourage them to connect different parts of the lesson together
- When they make a connection, confirm it with a lesson quote`,

    exploratory: `## Adaptive Teaching Style: EXPLORATORY
This student is excelling (avg score: ${context.profile.averageScore}%). Adapt your approach:
- Ask the student to synthesize multiple sections of the lesson
- Challenge them to explain lesson concepts in their own words
- Point to the more advanced or nuanced parts of the lesson material
- Ask "what if" questions that can be answered using the lesson content`,
  };

  sections.push(styleInstructions[context.profile.preferredStyle] ?? styleInstructions.socratic);

  // Weak topics awareness
  if (context.profile.weakTopics.length > 0) {
    const topics = context.profile.weakTopics.map((t) => t.topic).join(', ');
    sections.push(`## Weak Topics Awareness
The student has struggled with: **${topics}**.
If these topics appear in the lesson material, spend extra time on those sections. Re-read and rephrase the lesson's explanation of those topics. Do NOT introduce external explanations — only use what the lesson provides.`);
  }

  // Strong topics as scaffolding
  if (context.profile.strongTopics.length > 0) {
    const topics = context.profile.strongTopics.map((t) => t.topic).join(', ');
    sections.push(`## Strong Topics (Use as Scaffolding)
The student understands well: **${topics}**.
If the lesson mentions these topics, use them as stepping stones to explain harder parts of the lesson.`);
  }

  // Session continuity
  if (context.previousMessageCount > 0) {
    sections.push(`## Session Continuity
This is a returning student with ${context.previousMessageCount} previous messages in this lesson's chat. They may reference earlier parts of the conversation.`);
  }

  // Post-quiz context
  if (context.profile.totalQuizzes > 0 && context.profile.averageScore < 70) {
    sections.push(`## Post-Quiz Support
This student has taken ${context.profile.totalQuizzes} quiz(zes) with an average of ${context.profile.averageScore}%. Proactively point them to the lesson sections that cover the topics they got wrong. Walk through those sections together.`);
  }

  // Reinforce the grounding rule at the end
  sections.push(`## REMINDER: You must ONLY teach from the lesson material above. Never supplement with outside knowledge. Every claim you make must come from the lesson content.`);

  return sections.join('\n\n');
}

// ---- Page-Scoped Tutor Prompt Builder ----

type PageTutorContext = {
  lessonTitle: string;
  pageTitle: string;
  pageNumber: number;
  totalPages: number;
  pageContent: string;
  pageKeyConcepts: { term: string; definition: string }[];
  previousPageTitles: string[];
  learningObjectives: string[];
  isFirstVisit: boolean;
};

export function buildPageTutorPrompt(context: PageTutorContext): string {
  const conceptsList = context.pageKeyConcepts
    .map((c) => `  - **${c.term}**: ${c.definition}`)
    .join('\n');

  const prevPages = context.previousPageTitles.length > 0
    ? context.previousPageTitles.map((t, i) => `  ${i + 1}. ${t}`).join('\n')
    : '  (This is the first page)';

  let prompt = `You are a tutor at AI Academy teaching the lesson "${context.lessonTitle}". You are currently on **Page ${context.pageNumber} of ${context.totalPages}: "${context.pageTitle}"**.

Your ONLY source of knowledge is the page material provided below. You teach exclusively from this material.

## ABSOLUTE RULE: Page-Only Knowledge
- You must ONLY use information from the PAGE MATERIAL below.
- NEVER introduce facts, examples, or definitions from outside this page or lesson.
- If asked something not on this page, say: "That's not covered on this page. Let's focus on what we have here."
- Reference the page content explicitly when explaining.

## Previous Pages Covered
${prevPages}

## Key Concepts on This Page
${conceptsList}

## === PAGE MATERIAL START ===
**Page ${context.pageNumber}: ${context.pageTitle}**

${context.pageContent}
## === PAGE MATERIAL END ===

## Teaching Style
- Be warm, patient, encouraging.
- Break the page content into digestible pieces.
- Use Socratic questioning to guide understanding.
- When a student is confused, point them to the specific part of this page.

## Formatting
- Use **bold** for key terms.
- Use \`code blocks\` for code or technical syntax.
- Use > blockquotes when quoting the page material.
- Keep paragraphs short (2-3 sentences).

## Check Questions
This page has check questions the student must answer correctly before moving to the next page.
- Do NOT reveal the answers to check questions.
- If the student struggles, guide them to the relevant part of this page.
- Encourage them: "Try the check questions when you feel ready!"

## Critical Rules
1. **NEVER give check question or quiz answers directly.**
2. **NEVER go beyond this page's material.**
3. Reference this page explicitly when answering.
4. Stay focused on "${context.pageTitle}".
5. End responses with a question about this page's content.`;

  if (context.isFirstVisit) {
    prompt += `

## FIRST VISIT - START TEACHING
The student just arrived at this page. You must:
1. ${context.previousPageTitles.length > 0 ? `Briefly connect to what they learned previously (pages: ${context.previousPageTitles.join(', ')})` : 'Welcome them to the lesson'}
2. Introduce the main topic of this page: "${context.pageTitle}"
3. Walk through the key ideas on this page step by step
4. After your introduction, ask if they have questions about the material
Do NOT wait for the student to ask first. Start teaching immediately.`;
  }

  if (context.pageNumber === context.totalPages) {
    prompt += `

## FINAL PAGE
This is the last content page. After this, the student takes a comprehensive final quiz. When the student finishes this page, encourage them: "Great job completing all the pages! When you're ready, take the final quiz to test everything you've learned."`;
  }

  return prompt;
}

// ---- Enhanced Page Tutor Prompt (with student profile) ----

type EnhancedPageTutorContext = PageTutorContext & {
  profile: {
    weakTopics: { topic: string; score: number }[];
    strongTopics: { topic: string; score: number }[];
    preferredStyle: 'direct' | 'socratic' | 'exploratory';
    averageScore: number;
    totalQuizzes: number;
  };
  previousMessageCount: number;
};

export function buildEnhancedPageTutorPrompt(context: EnhancedPageTutorContext): string {
  const base = buildPageTutorPrompt(context);
  const sections: string[] = [base];

  const styleInstructions: Record<string, string> = {
    direct: `## Adaptive Style: DIRECT (avg ${context.profile.averageScore}%)
- Quote the page material directly, break into small pieces
- Use simpler words — but do not add new information
- Check understanding after each point`,
    socratic: `## Adaptive Style: SOCRATIC (avg ${context.profile.averageScore}%)
- Ask questions pointing to specific parts of this page
- Encourage connections between concepts on this page`,
    exploratory: `## Adaptive Style: EXPLORATORY (avg ${context.profile.averageScore}%)
- Challenge the student to explain page concepts in their own words
- Point to nuanced parts of the page material`,
  };

  sections.push(styleInstructions[context.profile.preferredStyle] ?? styleInstructions.socratic);

  if (context.profile.weakTopics.length > 0) {
    const topics = context.profile.weakTopics.map((t) => t.topic).join(', ');
    sections.push(`## Weak Topics: ${topics}
If these appear on this page, spend extra time on them.`);
  }

  if (context.previousMessageCount > 0) {
    sections.push(`## Session: ${context.previousMessageCount} previous messages on this page.`);
  }

  sections.push(`## REMINDER: Teach ONLY from this page's material.`);

  return sections.join('\n\n');
}

// ---- Streaming Chat ----

export async function* streamChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemPrompt: string
): AsyncGenerator<string, void, unknown> {
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages,
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}

// ---- Quiz Grading with AI ----

type QuizQuestion = {
  id: string;
  type: 'mcq' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
};

type QuizAnswer = {
  questionId: string;
  answer: string;
};

type GradingResult = {
  questionId: string;
  isCorrect: boolean;
  feedback: string;
  points: number;
  maxPoints: number;
};

export async function gradeQuizWithAI(
  questions: QuizQuestion[],
  answers: QuizAnswer[],
  lessonContext: { title: string; summary: string }
): Promise<GradingResult[]> {
  // Build a grading prompt
  const questionsWithAnswers = questions.map((q) => {
    const studentAnswer = answers.find((a) => a.questionId === q.id);
    return {
      id: q.id,
      question: q.question,
      type: q.type,
      correctAnswer: q.correctAnswer,
      studentAnswer: studentAnswer?.answer ?? '(no answer)',
      explanation: q.explanation,
      points: q.points,
      options: q.options,
    };
  });

  const gradingPrompt = `You are grading a quiz for the lesson "${lessonContext.title}".

For each question, determine if the student's answer is correct and provide personalized, encouraging feedback.

For multiple choice and true/false questions: the answer must match exactly (case-insensitive).
For short answer questions: judge if the student's answer captures the key idea, even if worded differently. Be reasonably generous - if they demonstrate understanding, mark it correct.

Here are the questions and student answers:

${JSON.stringify(questionsWithAnswers, null, 2)}

Respond with a JSON array (and ONLY the JSON array, no other text) where each element has:
{
  "questionId": "string",
  "isCorrect": boolean,
  "feedback": "string - personalized, encouraging feedback for this specific answer. If wrong, explain WHY and help them understand. If right, reinforce what they understood well.",
  "points": number (full points if correct, 0 if wrong, partial for short answers that show partial understanding),
  "maxPoints": number
}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: gradingPrompt }],
  });

  // Extract text from response
  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude for grading');
  }

  try {
    // Parse the JSON response - handle potential markdown code fences
    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    const results: GradingResult[] = JSON.parse(jsonText);
    return results;
  } catch {
    // Fallback: do simple grading without AI feedback
    return questions.map((q) => {
      const studentAnswer = answers.find((a) => a.questionId === q.id);
      const isCorrect =
        (studentAnswer?.answer ?? '').toLowerCase().trim() ===
        q.correctAnswer.toLowerCase().trim();
      return {
        questionId: q.id,
        isCorrect,
        feedback: isCorrect
          ? `Correct! ${q.explanation}`
          : `Not quite. The correct answer is: ${q.correctAnswer}. ${q.explanation}`,
        points: isCorrect ? q.points : 0,
        maxPoints: q.points,
      };
    });
  }
}
