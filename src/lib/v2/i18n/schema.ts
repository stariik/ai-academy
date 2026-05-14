/**
 * Shape contract for v2 i18n dictionaries.
 * Both ka.ts and en.ts implement this. Add a key here first, then to each
 * language file — TypeScript flags any missing translations.
 */

export type Dict = {
  meta: {
    siteName: string;
    siteTagline: string;
    brandName: string;
  };
  navbar: {
    categories: string;
    courses: string;
    howItWorks: string;
    pricing: string;
    signIn: string;
    signUp: string;
    menu: string;
    closeMenu: string;
    language: string;
  };
  hero: {
    eyebrow: string;
    titleBefore: string;
    titleHighlight: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    statStudents: string;
    statCategories: string;
    statRating: string;
    audienceFor: string;
    audienceKids: string;
    audienceTeens: string;
    audienceAdults: string;
    chipFoundations: string;
    chipCreative: string;
    chipForKids: string;
  };
  catalog: {
    eyebrow: string;
    titleBefore: string;
    titleHighlight: string;
    description: string;
    emptyState: string;
    coursesUnit: string;
    lessonsUnit: string;
    lessonsUnitShort: string;
    soon: string;
  };
  courseCard: {
    lessonsShort: string;
    hoursShort: string;
    free: string;
  };
  howItWorks: {
    eyebrow: string;
    title: string;
    step1Title: string;
    step1Description: string;
    step2Title: string;
    step2Description: string;
    step3Title: string;
    step3Description: string;
  };
  audience: {
    eyebrow: string;
    title: string;
    description: string;
    mostPopular: string;
    ageBandSuffix: string;
    learnMore: string;
    kids: { title: string; tagline: string; features: string[] };
    teens: { title: string; tagline: string; features: string[] };
    adults: { title: string; tagline: string; features: string[] };
  };
  pricing: {
    eyebrow: string;
    title: string;
    description: string;
    fromSuffix: string;
    soloLabel: string;
    soloPrice: string;
    soloSubtitle: string;
    soloFeatures: string[];
    soloCta: string;
    bundleLabel: string;
    bundlePrice: string;
    bundleOldPrice: string;
    bundleSave: string;
    bundleDiscount: string;
    bundleBadge: string;
    bundleFeatures: string[];
    bundleCta: string;
  };
  ctaBanner: {
    titleBefore: string;
    titleHighlight: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trustMicro: string;
  };
  footer: {
    about: string;
    columnCategories: string;
    columnProduct: string;
    columnCompany: string;
    productCourses: string;
    productPricing: string;
    productParents: string;
    productFreeSample: string;
    companyAbout: string;
    companyContact: string;
    companyPrivacy: string;
    companyTerms: string;
    copyright: string;
    languageKa: string;
    languageEn: string;
  };
  slider: {
    prev: string;
    next: string;
    ariaCategory: string;
    ariaCourses: string;
  };
  level: {
    beginner: string;
    intermediate: string;
    advanced: string;
  };
  audienceTag: {
    everyone: string;
    kids: string;
    teens: string;
    adults: string;
  };
  courseDetail: {
    backToCourses: string;
    levelLabel: string;
    lessonsLabel: string;
    hoursLabel: string;
    studentsLabel: string;
    ratingLabel: string;
    outcomesEyebrow: string;
    outcomesTitle: string;
    curriculumEyebrow: string;
    curriculumTitle: string;
    prerequisitesLabel: string;
    whatsIncludedLabel: string;
    walliEyebrow: string;
    walliTitle: string;
    relatedEyebrow: string;
    relatedTitle: string;
    purchaseTitle: string;
    priceOnly: string;
    enroll: string;
    enrolled: string;
    continueLearning: string;
    bundleHook: string;
    bundleHookCta: string;
    socialProofPart1: string;
    socialProofPart2: string;
    socialProofPart3: string;
    trust24x7: string;
    trustLifetime: string;
    trustCertificate: string;
    mobileBuyBar: string;
    notFoundTitle: string;
    notFoundCta: string;
    free: string;
    freeLessonBadge: string;
    courseFreeBadge: string;
    durationMinutes: string;
  };
  lesson: {
    backToCourse: string;
    lessonOf: string;
    of: string;
    minutes: string;
    start: string;
    continue: string;
    next: string;
    previous: string;
    finish: string;
    completeAndContinue: string;
    completedLabel: string;
    progressLabel: string;
    checkpointTitle: string;
    checkpointSubtitle: string;
    correct: string;
    incorrect: string;
    tryAgain: string;
    showExplanation: string;
    hideExplanation: string;
    finalQuizTitle: string;
    finalQuizSubtitle: string;
    quizScore: string;
    quizPassed: string;
    quizRetry: string;
    completionTitle: string;
    completionSubtitle: string;
    completionNext: string;
    completionBack: string;
    chatPlaceholder: string;
    chatSend: string;
    chatHelp: string;
    chatExplainSimpler: string;
    chatGiveExample: string;
    chatQuiz: string;
    loading: string;
    notFoundTitle: string;
    notFoundBody: string;
    notFoundCta: string;
  };
  common: {
    next: string;
    back: string;
    cancel: string;
    save: string;
    close: string;
    open: string;
    free: string;
    loading: string;
    error: string;
    retry: string;
    yes: string;
    no: string;
  };
};
