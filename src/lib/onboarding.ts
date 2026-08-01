export type OnboardingLocale = 'ka' | 'en';

export type OnboardingQuestionKind = 'single' | 'multi' | 'text';

export type OnboardingOption = {
  id: string;
  label: string;
  description?: string;
  emoji?: string;
};

export type OnboardingQuestion = {
  id: string;
  text: string;
  helper?: string;
  kind: OnboardingQuestionKind;
  options: OnboardingOption[];
  placeholder?: string;
  minSelections?: number;
  maxSelections?: number;
};

export type OnboardingAnswer = {
  questionId: string;
  question: string;
  kind: OnboardingQuestionKind;
  selectedOptionIds: string[];
  selectedLabels: string[];
  freeText: string;
  displayText: string;
  answeredAt: string;
};

export type OnboardingTranscriptMessage = {
  role: 'assistant' | 'user';
  content: string;
  at: string;
};

export type OnboardingProfileSignals = {
  interests: string[];
  primaryGoal: string;
  desiredOutcome: string;
  experienceLevel: string;
  learningPreferences: string[];
  weeklyCommitment: string;
  barriers: string[];
  motivation: string;
  summary: string;
  segmentLabel: string;
  opportunitySignals: string[];
  verbatimQuote: string;
};

const FALLBACK_QUESTIONS: Record<OnboardingLocale, OnboardingQuestion[]> = {
  en: [
    {
      id: 'progress_goal',
      text: 'What kind of progress would feel most valuable to you right now?',
      helper: 'Pick up to two — this helps me shape your starting path.',
      kind: 'multi',
      minSelections: 1,
      maxSelections: 2,
      placeholder: 'Or tell me what you have in mind…',
      options: [
        { id: 'work_smarter', label: 'Work smarter', description: 'Save time and automate repetitive work', emoji: '⚡' },
        { id: 'grow_business', label: 'Grow a business', description: 'Marketing, sales, operations, or strategy', emoji: '📈' },
        { id: 'create', label: 'Create better', description: 'Content, design, video, or ideas', emoji: '✨' },
        { id: 'build', label: 'Build with AI', description: 'Apps, agents, workflows, or no-code tools', emoji: '🛠️' },
        { id: 'career', label: 'Move my career forward', description: 'Build skills, switch roles, or stand out', emoji: '🚀' },
        { id: 'confidence', label: 'Understand AI confidently', description: 'Know what matters without the noise', emoji: '🧭' },
      ],
    },
    {
      id: 'success_picture',
      text: 'Imagine it’s 30 days from now and learning AI has genuinely paid off. What can you do then that you can’t do today?',
      helper: 'A real task or small win is more useful than a perfect answer.',
      kind: 'text',
      options: [],
      placeholder: 'For example: “I can create a week of content in one afternoon”…',
    },
    {
      id: 'experience_level',
      text: 'Where are you starting from today?',
      helper: 'No judgment — I’ll use this to choose the right pace and vocabulary.',
      kind: 'single',
      options: [
        { id: 'new', label: 'Brand new', description: 'I’m curious but haven’t really used AI', emoji: '🌱' },
        { id: 'exploring', label: 'I’ve experimented', description: 'A few chats or tools, nothing consistent yet', emoji: '👀' },
        { id: 'regular', label: 'I use AI regularly', description: 'I want stronger methods and better results', emoji: '⚙️' },
        { id: 'advanced', label: 'I’m already building', description: 'I want advanced workflows and deeper skills', emoji: '🧠' },
      ],
    },
    {
      id: 'learning_style',
      text: 'When something new finally “clicks” for you, what usually made the difference?',
      helper: 'Choose up to two. WALL‑E will adapt explanations inside lessons.',
      kind: 'multi',
      minSelections: 1,
      maxSelections: 2,
      options: [
        { id: 'projects', label: 'Building a real project', emoji: '🔧' },
        { id: 'examples', label: 'Seeing concrete examples', emoji: '💡' },
        { id: 'steps', label: 'Clear step-by-step guidance', emoji: '🪜' },
        { id: 'concepts', label: 'Understanding the big picture', emoji: '🗺️' },
        { id: 'challenge', label: 'Trying, failing, and getting feedback', emoji: '🎯' },
      ],
    },
    {
      id: 'commitment',
      text: 'What pace would feel realistic in a normal week — not an ideal week?',
      helper: 'A plan you can keep beats an ambitious plan you abandon.',
      kind: 'single',
      options: [
        { id: 'tiny', label: '10 minutes at a time', description: 'Small, frequent wins', emoji: '☕' },
        { id: 'steady', label: '30 minutes, 2–3 times', description: 'A steady weekly rhythm', emoji: '🗓️' },
        { id: 'deep', label: '1–2 focused hours', description: 'A deeper weekly session', emoji: '🎧' },
        { id: 'sprint', label: 'I’m ready for a sprint', description: 'Several hours while motivation is high', emoji: '🔥' },
      ],
    },
    {
      id: 'barriers',
      text: 'What is most likely to get in your way?',
      helper: 'Pick up to two. This tells us what support the academy should design better.',
      kind: 'multi',
      minSelections: 1,
      maxSelections: 2,
      placeholder: 'Something else?',
      options: [
        { id: 'time', label: 'Not enough time', emoji: '⏳' },
        { id: 'start', label: 'I don’t know where to start', emoji: '🧭' },
        { id: 'technical', label: 'It gets too technical', emoji: '🧩' },
        { id: 'overwhelm', label: 'Too many tools and opinions', emoji: '🌪️' },
        { id: 'mistakes', label: 'I worry about doing it wrong', emoji: '🫣' },
        { id: 'none', label: 'Nothing obvious — I’m ready', emoji: '✅' },
      ],
    },
  ],
  ka: [
    {
      id: 'progress_goal',
      text: 'ამ ეტაპზე როგორი პროგრესი იქნებოდა შენთვის ყველაზე ღირებული?',
      helper: 'აირჩიე მაქსიმუმ ორი — ასე შენთვის სწორ საწყის გზას შევადგენ.',
      kind: 'multi',
      minSelections: 1,
      maxSelections: 2,
      placeholder: 'ან შენი სიტყვებით მომიყევი…',
      options: [
        { id: 'work_smarter', label: 'უფრო ჭკვიანურად მუშაობა', description: 'დროის დაზოგვა და რუტინის ავტომატიზაცია', emoji: '⚡' },
        { id: 'grow_business', label: 'ბიზნესის გაზრდა', description: 'მარკეტინგი, გაყიდვები, ოპერაციები ან სტრატეგია', emoji: '📈' },
        { id: 'create', label: 'უკეთესი კონტენტის შექმნა', description: 'ტექსტი, დიზაინი, ვიდეო ან იდეები', emoji: '✨' },
        { id: 'build', label: 'AI-ით რაღაცის აშენება', description: 'აპები, აგენტები, პროცესები ან no-code', emoji: '🛠️' },
        { id: 'career', label: 'კარიერული წინსვლა', description: 'ახალი უნარი, როლის შეცვლა ან გამორჩევა', emoji: '🚀' },
        { id: 'confidence', label: 'AI-ის თავდაჯერებით გაგება', description: 'მთავარის დანახვა ზედმეტი ხმაურის გარეშე', emoji: '🧭' },
      ],
    },
    {
      id: 'success_picture',
      text: 'წარმოიდგინე, რომ 30 დღე გავიდა და AI-ის სწავლამ ნამდვილად გაამართლა. რას აკეთებ უკვე ისეთს, რასაც დღეს ვერ აკეთებ?',
      helper: 'რეალური ამოცანა ან პატარა გამარჯვება იდეალურ პასუხზე ბევრად სასარგებლოა.',
      kind: 'text',
      options: [],
      placeholder: 'მაგალითად: „ერთ კვირის კონტენტს ერთ შუადღეში ვქმნი“…',
    },
    {
      id: 'experience_level',
      text: 'დღეს რა ეტაპიდან იწყებ?',
      helper: 'შეფასება არ არსებობს — პასუხით ტემპსა და ახსნის ენას მოგარგებ.',
      kind: 'single',
      options: [
        { id: 'new', label: 'სრულიად ახალი ვარ', description: 'მაინტერესებს, მაგრამ AI თითქმის არ გამომიყენებია', emoji: '🌱' },
        { id: 'exploring', label: 'ცოტა გამომიცდია', description: 'რამდენიმე ჩატი ან ხელსაწყო, ჯერ სისტემის გარეშე', emoji: '👀' },
        { id: 'regular', label: 'AI-ს ხშირად ვიყენებ', description: 'უკეთესი მეთოდები და შედეგები მინდა', emoji: '⚙️' },
        { id: 'advanced', label: 'უკვე ვაშენებ', description: 'მოწინავე პროცესები და ღრმა უნარები მინდა', emoji: '🧠' },
      ],
    },
    {
      id: 'learning_style',
      text: 'როცა ახალი თემა ბოლოს და ბოლოს „გილაგდება“, ჩვეულებრივ რა გეხმარება ყველაზე მეტად?',
      helper: 'აირჩიე მაქსიმუმ ორი. WALL‑E გაკვეთილებში ახსნის სტილს მოგარგებს.',
      kind: 'multi',
      minSelections: 1,
      maxSelections: 2,
      options: [
        { id: 'projects', label: 'რეალური პროექტის აწყობა', emoji: '🔧' },
        { id: 'examples', label: 'კონკრეტული მაგალითების ნახვა', emoji: '💡' },
        { id: 'steps', label: 'ნაბიჯ-ნაბიჯ მკაფიო ინსტრუქცია', emoji: '🪜' },
        { id: 'concepts', label: 'დიდი სურათის გაგება', emoji: '🗺️' },
        { id: 'challenge', label: 'ცდა, შეცდომა და უკუკავშირი', emoji: '🎯' },
      ],
    },
    {
      id: 'commitment',
      text: 'ჩვეულებრივ კვირაში — არა იდეალურ კვირაში — როგორი ტემპი იქნება რეალისტური?',
      helper: 'მცირე გეგმა, რომელსაც შეასრულებ, სჯობს დიდ გეგმას, რომელსაც მიატოვებ.',
      kind: 'single',
      options: [
        { id: 'tiny', label: 'ერთ ჯერზე 10 წუთი', description: 'პატარა და ხშირი გამარჯვებები', emoji: '☕' },
        { id: 'steady', label: '30 წუთი, კვირაში 2–3-ჯერ', description: 'სტაბილური ყოველკვირეული რიტმი', emoji: '🗓️' },
        { id: 'deep', label: '1–2 კონცენტრირებული საათი', description: 'ერთი ღრმა სესია კვირაში', emoji: '🎧' },
        { id: 'sprint', label: 'ინტენსიური სტარტისთვის მზად ვარ', description: 'რამდენიმე საათი, სანამ მოტივაცია მაღალია', emoji: '🔥' },
      ],
    },
    {
      id: 'barriers',
      text: 'ყველაზე მეტად რამ შეიძლება შეგიშალოს ხელი?',
      helper: 'აირჩიე მაქსიმუმ ორი. ეს გვაჩვენებს, როგორი მხარდაჭერა უნდა შევქმნათ უკეთ.',
      kind: 'multi',
      minSelections: 1,
      maxSelections: 2,
      placeholder: 'სხვა რამ?',
      options: [
        { id: 'time', label: 'დრო არ მყოფნის', emoji: '⏳' },
        { id: 'start', label: 'არ ვიცი, საიდან დავიწყო', emoji: '🧭' },
        { id: 'technical', label: 'ზედმეტად ტექნიკური ხდება', emoji: '🧩' },
        { id: 'overwhelm', label: 'ძალიან ბევრი ხელსაწყო და აზრია', emoji: '🌪️' },
        { id: 'mistakes', label: 'მეშინია, არასწორად არ გავაკეთო', emoji: '🫣' },
        { id: 'none', label: 'აშკარა დაბრკოლება არ მაქვს', emoji: '✅' },
      ],
    },
  ],
};

export function getFallbackQuestion(
  answerCount: number,
  locale: OnboardingLocale,
): OnboardingQuestion | null {
  return FALLBACK_QUESTIONS[locale][answerCount] ?? null;
}

function answerFor(answers: OnboardingAnswer[], id: string): OnboardingAnswer | undefined {
  return answers.find((answer) => answer.questionId === id);
}

function answerValue(answer: OnboardingAnswer | undefined): string {
  if (!answer) return '';
  return answer.freeText.trim() || answer.selectedLabels.join(', ') || answer.displayText;
}

export function buildFallbackProfile(
  answers: OnboardingAnswer[],
  locale: OnboardingLocale,
): OnboardingProfileSignals {
  // Position fallbacks also support a partially AI-generated interview whose
  // question IDs differ from the guided safety-net IDs.
  const goal = answerFor(answers, 'progress_goal') ?? answers[0];
  const outcome = answerFor(answers, 'success_picture') ?? answers[1];
  const experience = answerFor(answers, 'experience_level') ?? answers[2];
  const style = answerFor(answers, 'learning_style') ?? answers[3];
  const commitment = answerFor(answers, 'commitment') ?? answers[4];
  const barriers = answerFor(answers, 'barriers') ?? answers[5];
  const interests = goal?.selectedLabels.length
    ? goal.selectedLabels
    : [answerValue(goal)].filter(Boolean);
  const desiredOutcome = answerValue(outcome);
  const primaryGoal = interests[0] ?? (locale === 'ka' ? 'AI-ის პრაქტიკულად სწავლა' : 'Learn AI practically');
  const barrierValues = barriers?.selectedLabels.length
    ? barriers.selectedLabels
    : [answerValue(barriers)].filter(Boolean);
  const segmentByGoal: Record<string, [string, string]> = {
    work_smarter: ['Workflow optimizer', 'პროცესების გამარტივება'],
    grow_business: ['Business builder', 'ბიზნესის განვითარება'],
    create: ['Creative maker', 'კრეატიული შემქმნელი'],
    build: ['AI builder', 'AI შემქმნელი'],
    career: ['Career accelerator', 'კარიერული წინსვლა'],
    confidence: ['Confident explorer', 'თავდაჯერებული მკვლევარი'],
  };
  const segment =
    segmentByGoal[goal?.selectedOptionIds[0] ?? '']?.[locale === 'ka' ? 1 : 0] ??
    (locale === 'ka' ? 'პრაქტიკული მკვლევარი' : 'Practical explorer');
  const summary = locale === 'ka'
    ? `${primaryGoal} არის მთავარი მიმართულება. სასურველი შედეგია: ${desiredOutcome || 'AI-ის პრაქტიკულ ამოცანებში თავდაჯერებით გამოყენება'}.`
    : `${primaryGoal} is the main direction. The desired result is: ${desiredOutcome || 'using AI confidently for practical tasks'}.`;

  return {
    interests,
    primaryGoal,
    desiredOutcome,
    experienceLevel: answerValue(experience),
    learningPreferences: style?.selectedLabels ?? [],
    weeklyCommitment: answerValue(commitment),
    barriers: barrierValues,
    motivation: desiredOutcome || primaryGoal,
    summary,
    segmentLabel: segment,
    opportunitySignals: barrierValues.filter((value) => !/nothing|არ მაქვს/i.test(value)),
    verbatimQuote: desiredOutcome.slice(0, 220),
  };
}
