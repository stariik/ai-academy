/**
 * Localized chrome for the lesson material panel (ContentSheet +
 * ContentRenderer). The *lesson content itself* is translated separately
 * (on-the-fly, cached); these are just the static UI labels.
 *
 * Keyed by the teacher/material locale — which follows the in-panel KA/EN
 * toggle, so it can differ from the site route locale. That's why we use a
 * local table here instead of the route-bound v2 i18n dict.
 */

export type MaterialLocale = 'ka' | 'en';

export type MaterialStrings = {
  // sub-view badges
  subMaterial: string;
  subCheck: string;
  // material sections
  bridge: string;
  keyConcepts: string;
  commonMistakes: string;
  realWorld: string;
  reflect: string;
  // advance CTA
  pageComplete: string;
  reviewAnswers: string;
  checkLocked: string;
  nextLocked: string;
  lockedHint: string;
  backToChat: string;
  checkUnderstanding: string;
  gotItNext: string;
  // checks view
  backToMaterial: string;
  // aria
  prevPage: string;
  nextPage: string;
  close: string;
  dialogLabel: string;
  // difficulty levels
  diffFoundational: string;
  diffIntermediate: string;
  diffAdvanced: string;
  diffSynthesis: string;
  // ContentRenderer callout labels
  tip: string;
  note: string;
  caution: string;
  definition: string;
  keyConcept: string;
  example: string;
  analogy: string;
  stepByStep: string;
  list: string;
  inShort: string;
  diagram: string;
};

export const MATERIAL_STRINGS: Record<MaterialLocale, MaterialStrings> = {
  ka: {
    subMaterial: '1 · მასალა',
    subCheck: '2 · შემოწმე',
    bridge: 'გავაგრძელოთ',
    keyConcepts: 'ძირითადი ცნებები',
    commonMistakes: 'ხშირი შეცდომები',
    realWorld: 'რეალურ ცხოვრებაში',
    reflect: 'დაფიქრდი',
    pageComplete: '✓ გვერდი დასრულდა',
    reviewAnswers: 'გადახედე პასუხებს',
    checkLocked: 'შემოწმე გაგება ჩაკეტილია',
    nextLocked: 'შემდეგი გვერდი ჩაკეტილია',
    lockedHint: 'ისაუბრე Walli-სთან მასალაზე — როცა მზად იქნები, ის გახსნის შემდეგ ეტაპს.',
    backToChat: 'დაუბრუნდი ჩატს',
    checkUnderstanding: 'შემოწმე გაგება',
    gotItNext: 'გავიგე — შემდეგი',
    backToMaterial: 'მასალაზე დაბრუნება',
    prevPage: 'წინა გვერდი',
    nextPage: 'შემდეგი გვერდი',
    close: 'დახურე',
    dialogLabel: 'გაკვეთილის კონტენტი',
    diffFoundational: 'საფუძვლები',
    diffIntermediate: 'საშუალო',
    diffAdvanced: 'მაღალი',
    diffSynthesis: 'სინთეზი',
    tip: 'რჩევა',
    note: 'შენიშვნა',
    caution: 'ყურადღება',
    definition: 'განმარტება',
    keyConcept: 'ძირითადი ცნება',
    example: 'მაგალითი',
    analogy: 'ანალოგია',
    stepByStep: 'ნაბიჯ-ნაბიჯ',
    list: 'სია',
    inShort: 'მოკლედ',
    diagram: 'დიაგრამა',
  },
  en: {
    subMaterial: '1 · Material',
    subCheck: '2 · Check',
    bridge: "Let's continue",
    keyConcepts: 'Key concepts',
    commonMistakes: 'Common mistakes',
    realWorld: 'In real life',
    reflect: 'Reflect',
    pageComplete: '✓ Page complete',
    reviewAnswers: 'Review your answers',
    checkLocked: 'Understanding check is locked',
    nextLocked: 'Next page is locked',
    lockedHint: "Talk through the material with Walli — when you're ready, it'll unlock the next step.",
    backToChat: 'Back to chat',
    checkUnderstanding: 'Check understanding',
    gotItNext: 'Got it — next',
    backToMaterial: 'Back to material',
    prevPage: 'Previous page',
    nextPage: 'Next page',
    close: 'Close',
    dialogLabel: 'Lesson content',
    diffFoundational: 'Foundational',
    diffIntermediate: 'Intermediate',
    diffAdvanced: 'Advanced',
    diffSynthesis: 'Synthesis',
    tip: 'Tip',
    note: 'Note',
    caution: 'Caution',
    definition: 'Definition',
    keyConcept: 'Key concept',
    example: 'Example',
    analogy: 'Analogy',
    stepByStep: 'Step by step',
    list: 'List',
    inShort: 'In short',
    diagram: 'Diagram',
  },
};
