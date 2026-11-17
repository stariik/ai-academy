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

const FALLBACK_QUESTIONS: Record<OnboardingLocale, OnboardingQuestion[]> = {
  en: [
    {
      id: 'age_band',
      text: 'How old are you?',
      helper: 'It helps me pitch examples and pace at the right level.',
      kind: 'single',
      options: [
        { id: 'under_18', label: 'Under 18' },
        { id: '18_24', label: '18–24' },
        { id: '25_34', label: '25–34' },
        { id: '35_44', label: '35–44' },
        { id: '45_54', label: '45–54' },
        { id: '55_plus', label: '55+' },
      ],
    },
    {
      // ponytail: id kept as progress_goal — homepage + /api/recommended-course read it.
      id: 'progress_goal',
      text: 'What do you want to create?',
      helper: 'Pick up to two — this decides where your path starts.',
      kind: 'multi',
      minSelections: 1,
      maxSelections: 2,
      placeholder: 'Or describe it in your own words…',
      options: [
        { id: 'design', label: 'Designs', description: 'Logos, posters, social graphics', emoji: '🎨' },
        { id: 'video', label: 'Videos', description: 'Editing, reels, AI-generated video', emoji: '🎬' },
        { id: 'audio', label: 'Music & audio', description: 'Songs, voiceovers, podcasts', emoji: '🎵' },
        { id: 'social', label: 'Social content', description: 'Posts and reels that grow an audience', emoji: '📱' },
        { id: 'copy', label: 'Words that sell', description: 'Ads, product copy, emails', emoji: '✍️' },
        { id: 'web', label: 'Websites & apps', description: 'Sites, landing pages, simple apps', emoji: '💻' },
        { id: 'automation', label: 'Automations', description: 'AI agents and workflows that do the work', emoji: '⚙️' },
        { id: 'data', label: 'Data & reports', description: 'Spreadsheets, dashboards, insights', emoji: '📊' },
        { id: 'unsure', label: 'Not sure yet', description: 'Show me the options', emoji: '🧭' },
      ],
    },
    {
      id: 'experience_level',
      text: 'Where are you starting from today?',
      helper: 'No judgment — I’ll use this to choose the right pace and vocabulary.',
      kind: 'multi',
      minSelections: 1,
      maxSelections: 3,
      options: [
        { id: 'new', label: 'Brand new', description: 'I’m curious but haven’t really used AI', emoji: '🌱' },
        { id: 'exploring', label: 'I’ve experimented', description: 'A few chats or tools, nothing consistent yet', emoji: '👀' },
        { id: 'regular', label: 'I use AI regularly', description: 'I want stronger methods and better results', emoji: '⚙️' },
        { id: 'advanced', label: 'I’m already building', description: 'I want advanced workflows and deeper skills', emoji: '🧠' },
      ],
    },
    {
      id: 'success_picture',
      text: 'What should AI get you?',
      helper: 'Pick the one that matters most.',
      kind: 'single',
      options: [
        { id: 'freelance', label: 'Freelance clients', description: 'Get paid for projects', emoji: '💼' },
        { id: 'job', label: 'A new job', description: 'Switch into a new role', emoji: '🚀' },
        { id: 'business', label: 'Grow my business', description: 'More customers, less busywork', emoji: '📈' },
        { id: 'faster', label: 'Do my job faster', description: 'Save hours every week', emoji: '⚡' },
        { id: 'curious', label: 'Just curious', description: 'See what AI can do', emoji: '👀' },
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
      id: 'age_band',
      text: 'რამდენი წლის ხარ?',
      helper: 'ასაკი დამეხმარება მაგალითებისა და ტემპის მორგებაში.',
      kind: 'single',
      options: [
        { id: 'under_18', label: '18-მდე' },
        { id: '18_24', label: '18–24' },
        { id: '25_34', label: '25–34' },
        { id: '35_44', label: '35–44' },
        { id: '45_54', label: '45–54' },
        { id: '55_plus', label: '55+' },
      ],
    },
    {
      id: 'progress_goal',
      text: 'რისი შექმნა გინდა?',
      helper: 'აირჩიე მაქსიმუმ ორი — აქედან დაიწყება შენი გზა.',
      kind: 'multi',
      minSelections: 1,
      maxSelections: 2,
      placeholder: 'ან შენი სიტყვებით მომიყევი…',
      options: [
        { id: 'design', label: 'დიზაინი', description: 'ლოგოები, პოსტერები, სოციალური გრაფიკა', emoji: '🎨' },
        { id: 'video', label: 'ვიდეო', description: 'მონტაჟი, რილსები, AI ვიდეო', emoji: '🎬' },
        { id: 'audio', label: 'მუსიკა და აუდიო', description: 'სიმღერები, გახმოვანება, პოდკასტები', emoji: '🎵' },
        { id: 'social', label: 'სოციალური მედიის კონტენტი', description: 'პოსტები და რილსები აუდიტორიის გასაზრდელად', emoji: '📱' },
        { id: 'copy', label: 'გამყიდველი ტექსტები', description: 'რეკლამა, პროდუქტის აღწერა, იმეილები', emoji: '✍️' },
        { id: 'web', label: 'საიტები და აპები', description: 'ვებსაიტები, ლენდინგები, მარტივი აპები', emoji: '💻' },
        { id: 'automation', label: 'ავტომატიზაცია', description: 'AI აგენტები და პროცესები, რომლებიც საქმეს შენ ნაცვლად აკეთებენ', emoji: '⚙️' },
        { id: 'data', label: 'მონაცემები და რეპორტები', description: 'ცხრილები, დაშბორდები, ანალიზი', emoji: '📊' },
        { id: 'unsure', label: 'ჯერ არ ვიცი', description: 'მაჩვენე ვარიანტები', emoji: '🧭' },
      ],
    },
    {
      id: 'experience_level',
      text: 'დღეს რა ეტაპიდან იწყებ?',
      helper: 'შეფასება არ არსებობს — პასუხით ტემპსა და ახსნის ენას მოგარგებ.',
      kind: 'multi',
      minSelections: 1,
      maxSelections: 3,
      options: [
        { id: 'new', label: 'სრულიად ახალი ვარ', description: 'მაინტერესებს, მაგრამ AI თითქმის არ გამომიყენებია', emoji: '🌱' },
        { id: 'exploring', label: 'ცოტა გამომიცდია', description: 'რამდენიმე ჩატი ან ხელსაწყო, ჯერ სისტემის გარეშე', emoji: '👀' },
        { id: 'regular', label: 'AI-ს ხშირად ვიყენებ', description: 'უკეთესი მეთოდები და შედეგები მინდა', emoji: '⚙️' },
        { id: 'advanced', label: 'უკვე ვაშენებ', description: 'მოწინავე პროცესები და ღრმა უნარები მინდა', emoji: '🧠' },
      ],
    },
    {
      id: 'success_picture',
      text: 'AI-მ რა უნდა მოგცეს?',
      helper: 'აირჩიე ყველაზე მნიშვნელოვანი.',
      kind: 'single',
      options: [
        { id: 'freelance', label: 'ფრილანს კლიენტები', description: 'ანაზღაურება პროექტებისთვის', emoji: '💼' },
        { id: 'job', label: 'ახალი სამსახური', description: 'ახალ როლზე გადასვლა', emoji: '🚀' },
        { id: 'business', label: 'ჩემი ბიზნესის გაზრდა', description: 'მეტი კლიენტი, ნაკლები რუტინა', emoji: '📈' },
        { id: 'faster', label: 'სამუშაოს უფრო სწრაფად კეთება', description: 'ყოველკვირა საათების დაზოგვა', emoji: '⚡' },
        { id: 'curious', label: 'უბრალოდ მაინტერესებს', description: 'მინდა ვნახო, რა შეუძლია AI-ს', emoji: '👀' },
      ],
    },
    {
      id: 'commitment',
      text: 'როგორი ტემპი იქნება რეალისტური?',
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
  const questions = FALLBACK_QUESTIONS[locale];
  if (!questions) return null;
  return questions[answerCount] ?? null;
}
