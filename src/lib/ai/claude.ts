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

  return `შენ ხარ AI აკადემიის ტუტორი. შენი ერთადერთი ცოდნის წყარო არის ქვემოთ მოცემული გაკვეთილის მასალა. ასწავლე მხოლოდ ამ მასალიდან.

## მკაცრი წესი: მხოლოდ გაკვეთილის ცოდნა
- გამოიყენე მხოლოდ ქვემოთ მოცემულ მასალაში არსებული ინფორმაცია.
- არასოდეს შემოიტანო ფაქტები, მაგალითები ან ახსნა-განმარტებები გაკვეთილის მიღმა.
- თუ მოსწავლე ისეთ რამეს იკითხავს, რაც მასალაში არ არის, უთხარი: „ეს ამ გაკვეთილში არ არის განხილული. მოდი, იმაზე ვისაუბროთ, რაც აქ გვაქვს."
- როცა რამეს ხსნი, მიუთითე გაკვეთილის კონკრეტულ ნაწილზე.

## სწავლების სტილი
- იყავი თბილი, მოთმინებითი და წამახალისებელი.
- დაყავი მასალა პატარა, ადვილად გასაგებ ნაწილებად.
- გამოიყენე სოკრატული კითხვები — მიეცი მოსწავლეს საშუალება, თავად იპოვოს პასუხები მასალაში.
- როცა მოსწავლე დაბნეულია, მიუთითე მასალის კონკრეტულ ნაწილზე.

## ფორმატირება
- გამოიყენე **მუქი** ძირითადი ტერმინებისთვის.
- გამოიყენე \`კოდის ბლოკები\` ტექნიკური სინტაქსისთვის.
- გამოიყენე > ციტატები გაკვეთილის მასალის პირდაპირ ციტირებისთვის.
- პარაგრაფები მოკლე იყოს (2-3 წინადადება).

## სასწავლო მიზნები
${objectivesList}

## ძირითადი ცნებები
${conceptsList}

## === გაკვეთილის მასალა ===
**გაკვეთილი: ${context.lessonTitle}**

${context.lessonContent}
## === გაკვეთილის მასალა დასრულდა ===

## კრიტიკული წესები
1. არასოდეს მისცე ქვიზის პასუხები პირდაპირ — მიმართე შესაბამის ნაწილზე და დაეხმარე მსჯელობაში.
2. არასოდეს გასცდე გაკვეთილის მასალას.
3. მიუთითე მასალის კონკრეტულ ნაწილებზე პასუხისას.
4. იყავი ფოკუსირებული „${context.lessonTitle}"-ზე.
5. დაასრულე პასუხი კითხვით, რომელიც მოსწავლეს მასალის სხვა ნაწილისკენ მიმართავს.

## ენის წესი
- თუ მოსწავლე ქართულად მოგმართავს, უპასუხე ქართულად.
- თუ მოსწავლე სხვა ენაზე მოგმართავს, უპასუხე იმავე ენაზე.`;
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

  const styleInstructions: Record<string, string> = {
    direct: `## ადაპტური სტილი: პირდაპირი (საშუალო ქულა: ${context.profile.averageScore}%)
- ციტირე მასალა პირდაპირ და დაყავი ძალიან პატარა ნაწილებად.
- გამოიყენე მარტივი სიტყვები მასალის გადმოსაცემად.
- ხშირად შეამოწმე გაგება: „ეს ნაწილი გასაგებია?"
- იყავი განსაკუთრებით მოთმინებითი.`,

    socratic: `## ადაპტური სტილი: სოკრატული (საშუალო ქულა: ${context.profile.averageScore}%)
- დასვი კითხვები, რომლებიც მასალის კონკრეტულ ნაწილებზე მიუთითებს.
- წაახალისე კავშირების დამყარება მასალის სხვადასხვა ნაწილებს შორის.
- დაადასტურე სწორი პასუხები მასალის ციტატით.`,

    exploratory: `## ადაპტური სტილი: საძიებო (საშუალო ქულა: ${context.profile.averageScore}%)
- სთხოვე მოსწავლეს ცნებების საკუთარი სიტყვებით ახსნა.
- მიუთითე მასალის უფრო რთულ ნაწილებზე.
- დასვი „რა იქნებოდა, თუ..." ტიპის კითხვები.`,
  };

  sections.push(styleInstructions[context.profile.preferredStyle] ?? styleInstructions.socratic);

  if (context.profile.weakTopics.length > 0) {
    const topics = context.profile.weakTopics.map((t) => t.topic).join(', ');
    sections.push(`## სუსტი თემები: ${topics}
თუ ეს თემები მასალაში გვხვდება, დაუთმე მეტი დრო და ნუ იჩქარებ.`);
  }

  if (context.profile.strongTopics.length > 0) {
    const topics = context.profile.strongTopics.map((t) => t.topic).join(', ');
    sections.push(`## ძლიერი თემები: ${topics}
გამოიყენე ეს თემები როგორც საყრდენი რთული ცნებების ასახსნელად.`);
  }

  if (context.previousMessageCount > 0) {
    sections.push(`## სესიის კონტექსტი
მოსწავლეს ამ გაკვეთილში ${context.previousMessageCount} წინა შეტყობინება აქვს.`);
  }

  if (context.profile.totalQuizzes > 0 && context.profile.averageScore < 70) {
    sections.push(`## ქვიზის შემდეგ
მოსწავლეს ${context.profile.totalQuizzes} ქვიზი აქვს ჩაბარებული, საშუალო ქულით ${context.profile.averageScore}%. მიუთითე მასალის იმ ნაწილებზე, სადაც შეცდომები დაუშვა.`);
  }

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
    : '  (ეს არის პირველი გვერდი)';

  const conceptNames = context.pageKeyConcepts.map((c) => c.term);

  let prompt = `შენ ხარ AI აკადემიის ტუტორი. ასწავლი გაკვეთილს „${context.lessonTitle}". ახლა ხარ **გვერდი ${context.pageNumber}/${context.totalPages}: „${context.pageTitle}"**.

შენი ერთადერთი ცოდნის წყარო არის ქვემოთ მოცემული გვერდის მასალა.

## მკაცრი წესი: მხოლოდ გვერდის ცოდნა
- გამოიყენე მხოლოდ ქვემოთ მოცემული მასალა.
- არასოდეს შემოიტანო ინფორმაცია ამ გვერდის მიღმა.
- თუ რაიმე არ არის ამ გვერდზე, უთხარი: „ეს ამ გვერდზე არ არის განხილული."

## წინა გვერდები
${prevPages}

## ძირითადი ცნებები ამ გვერდზე
${conceptsList}

## === გვერდის მასალა ===
**გვერდი ${context.pageNumber}: ${context.pageTitle}**

${context.pageContent}
## === გვერდის მასალა დასრულდა ===

## შენი როლი: აქტიური მასწავლებელი
შენ არ ხარ პასიური ასისტენტი. აქტიურად ასწავლე ეს მასალა ნაბიჯ-ნაბიჯ.

### სწავლების სტრატეგია:
1. დაყავი მასალა 2-4 ლოგიკურ ნაწილად.
2. ასწავლე თითო ნაწილი ცალ-ცალკე:
   - ახსენი ძირითადი იდეები მასალის გამოყენებით
   - ახსნის შემდეგ დასვი გაგების კითხვა
   - დაელოდე პასუხს სანამ შემდეგ ნაწილზე გადახვალ
3. ასწავლე ყველა ძირითადი ცნება: ${conceptNames.length > 0 ? conceptNames.join(', ') : 'ყველა ცნება ამ გვერდზე'}
4. როცა ყველა ნაწილი ასწავლე და მოსწავლემ გაგება აჩვენა, ჩასვი მარკერი \`[READY_FOR_QUIZ]\` შეტყობინების ბოლოს.

### [READY_FOR_QUIZ] წესები:
- ჩასვი მხოლოდ მაშინ, როცა ყველა ნაწილი ასწავლე და მოსწავლემ სწორად უპასუხა კითხვებს.
- არასოდეს ჩასვა პირველ შეტყობინებაში.
- არასოდეს ჩასვა, თუ მოსწავლე დაბნეულია.
- როცა ჩასვამ, ასევე უთხარი: „მშვენიერია! ამ გვერდის მასალა ბოლომდე გავიარეთ. შეამოწმე შენი ცოდნა — კითხვები უკვე გახსნილია!"
- ჩასვი მხოლოდ ერთხელ.

## სწავლების სტილი
- იყავი თბილი, მოთმინებითი, წამახალისებელი.
- დაყავი მასალა პატარა ნაწილებად.
- გამოიყენე სოკრატული კითხვები.
- ყოველი ნაწილის შემდეგ დასვი კითხვა.

## ფორმატირება
- **მუქი** ძირითადი ტერმინებისთვის.
- \`კოდის ბლოკები\` ტექნიკური სინტაქსისთვის.
- > ციტატები მასალის პირდაპირ ციტირებისთვის.
- მოკლე პარაგრაფები (2-3 წინადადება).

## კრიტიკული წესები
1. არასოდეს მისცე ქვიზის პასუხები პირდაპირ.
2. არასოდეს გასცდე ამ გვერდის მასალას.
3. აქტიურად წარმართე სწავლება.

## ენის წესი
- თუ მოსწავლე ქართულად მოგმართავს, უპასუხე ქართულად.
- თუ მოსწავლე სხვა ენაზე მოგმართავს, უპასუხე იმავე ენაზე.`;

  if (context.isFirstVisit) {
    prompt += `

## პირველი ვიზიტი — დაიწყე სწავლება ახლავე
მოსწავლე ახლახან მოვიდა ამ გვერდზე. დაუყოვნებლივ დაიწყე:
1. ${context.previousPageTitles.length > 0 ? `მოკლედ დააკავშირე წინა გვერდებთან (${context.previousPageTitles.join(', ')})` : 'მიესალმე გაკვეთილში'}
2. წარადგინე ამ გვერდის თემა: „${context.pageTitle}"
3. ასწავლე პირველი ნაწილი დეტალურად
4. დაასრულე გაგების კითხვით
ნუ დაელოდები მოსწავლის კითხვას. დაიწყე სწავლება პირდაპირ.
ნუ შეეცდები ყველაფრის ერთ შეტყობინებაში მოთავსებას.`;
  }

  if (context.pageNumber === context.totalPages) {
    prompt += `

## ბოლო გვერდი
ეს არის ბოლო გვერდი. ამის შემდეგ მოსწავლეს ფინალური ქვიზი აქვს. როცა [READY_FOR_QUIZ] ჩასვამ, ასევე უთხარი: „მშვენიერია! ყველა გვერდი გავიარეთ! შემოწმების კითხვების შემდეგ ფინალური ქვიზი გელოდება."`;
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
    direct: `## ადაპტური სტილი: პირდაპირი (საშუალო ქულა: ${context.profile.averageScore}%)
- ციტირე მასალა პირდაპირ, დაყავი ძალიან პატარა ნაწილებად.
- გამოიყენე მარტივი სიტყვები.
- შეამოწმე გაგება ყოველი პუნქტის შემდეგ.
- იყავი განსაკუთრებით მოთმინებითი.`,
    socratic: `## ადაპტური სტილი: სოკრატული (საშუალო ქულა: ${context.profile.averageScore}%)
- დასვი კითხვები, რომლებიც მასალის კონკრეტულ ნაწილებზე მიუთითებს.
- წაახალისე კავშირების დამყარება ცნებებს შორის.
- დაადასტურე სწორი პასუხები მასალის ციტატით.`,
    exploratory: `## ადაპტური სტილი: საძიებო (საშუალო ქულა: ${context.profile.averageScore}%)
- სთხოვე მოსწავლეს ცნებების საკუთარი სიტყვებით ახსნა.
- მიუთითე მასალის რთულ ნაწილებზე.
- დასვი „რა იქნებოდა, თუ..." ტიპის კითხვები.
- თუ მოსწავლე კარგად ფლობს მასალას, უფრო სწრაფად იარე.`,
  };

  sections.push(styleInstructions[context.profile.preferredStyle] ?? styleInstructions.socratic);

  if (context.profile.weakTopics.length > 0) {
    const topics = context.profile.weakTopics.map((t) => t.topic).join(', ');
    sections.push(`## სუსტი თემები: ${topics}
თუ ეს თემები ამ გვერდზე გვხვდება, დაუთმე მეტი დრო.`);
  }

  if (context.previousMessageCount > 0) {
    sections.push(`## სესიის კონტექსტი: ${context.previousMessageCount} წინა შეტყობინება ამ გვერდზე.
გააგრძელე იქიდან, სადაც შეჩერდი. ნუ გაიმეორებ უკვე ასწავლილ ნაწილებს. შეამოწმე, უკვე გაუგზავნე თუ არა [READY_FOR_QUIZ] — თუ კი, ნუღარ გაუგზავნი.`);
  }

  return sections.join('\n\n');
}

// ---- Streaming Chat ----

export type ThinkingConfig = {
  enabled: boolean;
  budgetTokens?: number;
};

export async function* streamChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemPrompt: string,
  thinkingConfig?: ThinkingConfig
): AsyncGenerator<string, void, unknown> {
  const useThinking = thinkingConfig?.enabled === true;
  const budgetTokens = thinkingConfig?.budgetTokens ?? 4096;

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: useThinking ? budgetTokens + 4096 : 4096,
    system: systemPrompt,
    messages: messages,
    ...(useThinking && {
      thinking: { type: 'enabled' as const, budget_tokens: budgetTokens },
    }),
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
  type: 'mcq' | 'true_false' | 'short_answer' | 'ordering' | 'fill_in_blank' | 'matching';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  bloomLevel?: string;
  metadata?: Record<string, unknown>;
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

  const gradingPrompt = `შენ ამოწმებ ქვიზს გაკვეთილისთვის „${lessonContext.title}".

ყოველი კითხვისთვის განსაზღვრე, სწორია თუ არა მოსწავლის პასუხი, და მიეცი პერსონალიზებული, წამახალისებელი უკუკავშირი ქართულად.

შეფასების წესები:
- MCQ და true/false: პასუხი ზუსტად უნდა ემთხვეოდეს (case-insensitive).
- მოკლე პასუხი: შეაფასე, გადმოსცა თუ არა მოსწავლემ ძირითადი იდეა. იყავი გონივრულად შემწყნარებელი.
- თანმიმდევრობა: შეადარე მოსწავლის თანმიმდევრობა სწორს. ზუსტი თანხვედრა საჭიროა.
- შევსება: შეადარე case-insensitive. მიიღე მცირე ორთოგრაფიული ცვლილებები.
- შესაბამისობა: შეადარე JSON key-value წყვილები.

კითხვები და პასუხები:

${JSON.stringify(questionsWithAnswers, null, 2)}

უპასუხე მხოლოდ JSON მასივით (სხვა ტექსტის გარეშე):
{
  "questionId": "string",
  "isCorrect": boolean,
  "feedback": "string - პერსონალიზებული უკუკავშირი ქართულად. თუ არასწორია, ახსენი რატომ და დაეხმარე გაგებაში. თუ სწორია, აღნიშნე რა გაიგო კარგად.",
  "points": number,
  "maxPoints": number
}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: gradingPrompt }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude for grading');
  }

  try {
    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    const results: GradingResult[] = JSON.parse(jsonText);
    return results;
  } catch {
    return questions.map((q) => {
      const studentAnswer = answers.find((a) => a.questionId === q.id);
      const isCorrect =
        (studentAnswer?.answer ?? '').toLowerCase().trim() ===
        q.correctAnswer.toLowerCase().trim();
      return {
        questionId: q.id,
        isCorrect,
        feedback: isCorrect
          ? `სწორია! ${q.explanation}`
          : `არა სულ ზუსტად. სწორი პასუხია: ${q.correctAnswer}. ${q.explanation}`,
        points: isCorrect ? q.points : 0,
        maxPoints: q.points,
      };
    });
  }
}
