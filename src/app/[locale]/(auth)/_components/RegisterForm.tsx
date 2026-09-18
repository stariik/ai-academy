'use client';

import * as React from 'react';
import { useActionState, startTransition } from 'react';
import { signUpAction, type AuthState } from '../actions';
import { V2LocaleProvider, useV2Locale } from '@/lib/v2/i18n/context';
import type { Dict, Locale } from '@/lib/v2/i18n';
import {
  AuthShell,
  AuthInput,
  AuthPasswordInput,
  AuthSubmit,
  AuthError,
  AuthNotice,
  AuthSwitch,
} from './AuthShell';
import { getFallbackQuestion, type OnboardingAnswer } from '@/lib/onboarding';
import { cn } from '@/lib/utils';

export default function RegisterForm({
  dict,
  locale,
  redeemCode,
}: {
  dict: Dict;
  locale: Locale;
  redeemCode?: string;
}) {
  return (
    <V2LocaleProvider locale={locale} dict={dict}>
      <Inner redeemCode={redeemCode} />
    </V2LocaleProvider>
  );
}

function Inner({ redeemCode }: { redeemCode?: string }) {
  const { dict, locale, href } = useV2Locale();
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signUpAction,
    null,
  );
  const [step, setStep] = React.useState(0);
  const [onboardingAnswers, setOnboardingAnswers] = React.useState<OnboardingAnswer[]>([]);
  const [displayName, setDisplayName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [currentLocale, setCurrentLocale] = React.useState<Locale>(locale);

  // Get current question based on step
  const currentQuestion = React.useMemo(() => {
    if (step === 0) return null;
    return getFallbackQuestion(step - 1, currentLocale);
  }, [step, currentLocale]);

  const totalQuestions = 6;

  const errorMessage = state?.error
    ? state.error === 'EMPTY_FIELDS'
      ? dict.auth.errorEmptyFields
      : state.error === 'PASSWORD_TOO_SHORT'
      ? dict.auth.errorPasswordTooShort
      : state.error === 'EMAIL_TAKEN'
      ? dict.auth.errorEmailTaken
      : state.error === 'RATE_LIMITED'
      ? dict.auth.errorRateLimited
      : dict.auth.errorGeneric
    : null;

  const emailInvalid = state?.error === 'EMAIL_TAKEN';
  const passwordInvalid = state?.error === 'PASSWORD_TOO_SHORT';

  // Reset to step 0 if there's an authentication error
  React.useEffect(() => {
    if (state?.error && step > 0) {
      setStep(0);
    }
  }, [state?.error, step]);

  const handleBasicInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    setDisplayName(formData.get('displayName') as string);
    setEmail(formData.get('email') as string);
    setPassword(formData.get('password') as string);
    setStep(1);
  };

  const handleQuestionAnswer = (answer: OnboardingAnswer) => {
    setOnboardingAnswers([...onboardingAnswers, answer]);
    if (step < totalQuestions) {
      setStep(step + 1);
    } else {
      // Final step - submit the form
      submitRegistration();
    }
  };

  const submitRegistration = () => {
    const form = document.createElement('form');
    form.style.display = 'none';
    document.body.appendChild(form);

    const fields = {
      locale,
      displayName,
      email,
      password,
      onboarding: JSON.stringify(onboardingAnswers),
      ...(redeemCode ? { redeem: redeemCode } : {}),
    };

    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });

    const formData = new FormData(form);

    // Wrap formAction in startTransition to fix React warning
    startTransition(() => {
      formAction(formData);
    });

    // Clean up form after a short delay to allow form submission
    setTimeout(() => {
      if (document.body.contains(form)) {
        document.body.removeChild(form);
      }
    }, 100);
  };

  // Step 0: Basic registration info
  if (step === 0) {
    return (
      <AuthShell
        eyebrow={dict.meta.brandName}
        title={dict.auth.registerTitle}
        subtitle={dict.auth.registerSubtitle}
        footer={
          <AuthSwitch
            prompt={dict.auth.switchToLogin}
            actionLabel={dict.auth.haveAccount}
            href={
              redeemCode
                ? `${href('login')}?redeem=${encodeURIComponent(redeemCode)}`
                : href('login')
            }
          />
        }
      >
        {redeemCode && (
          <AuthNotice tone="success" title={dict.promo.redeemPageSigningIn} code={redeemCode} />
        )}

        <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
          <AuthInput
            label={dict.auth.displayNameLabel}
            name="displayName"
            type="text"
            placeholder={dict.auth.displayNamePlaceholder}
            autoComplete="nickname"
            enterKeyHint="next"
            required
          />
          <AuthInput
            label={dict.auth.emailLabel}
            name="email"
            type="email"
            placeholder={dict.auth.emailPlaceholder}
            autoComplete="email"
            enterKeyHint="next"
            invalid={emailInvalid}
            required
          />
          <AuthPasswordInput
            label={dict.auth.passwordLabel}
            name="password"
            placeholder={dict.auth.passwordPlaceholder}
            hint={dict.auth.passwordHint}
            minLength={8}
            autoComplete="new-password"
            toggleLabel={{ show: dict.auth.showPassword, hide: dict.auth.hidePassword }}
            invalid={passwordInvalid}
          />

          {errorMessage && <AuthError message={errorMessage} />}

          <AuthSubmit pending={false}>
            {locale === 'ka' ? 'გაგრძელება' : 'Continue'}
          </AuthSubmit>
        </form>
      </AuthShell>
    );
  }

  // Steps 1-7: Onboarding questions
  if (currentQuestion) {
    return (
      <OnboardingStep
        question={currentQuestion}
        questionNumber={step}
        totalQuestions={totalQuestions}
        onAnswer={handleQuestionAnswer}
        onBack={() => setStep(step - 1)}
        locale={currentLocale}
        onLocaleChange={setCurrentLocale}
      />
    );
  }

  return null;
}

function OnboardingStep({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  onBack,
  locale,
  onLocaleChange,
}: {
  question: NonNullable<ReturnType<typeof getFallbackQuestion>>;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: OnboardingAnswer) => void;
  onBack: () => void;
  locale: Locale;
  onLocaleChange: (newLocale: Locale) => void;
}) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [freeText, setFreeText] = React.useState('');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // Reset state when question changes
    setSelectedIds([]);
    setFreeText('');
    setMounted(false);

    const timer = setTimeout(() => {
      setMounted(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [questionNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const labels = selectedIds
      .map((id) => question.options.find((opt) => opt.id === id)?.label)
      .filter((label): label is string => Boolean(label));

    const displayText = [...labels, freeText.trim()].filter(Boolean).join(' · ');
    if (!displayText) return;

    const answer: OnboardingAnswer = {
      questionId: question.id,
      question: question.text,
      kind: question.kind,
      selectedOptionIds: selectedIds,
      selectedLabels: labels,
      freeText: freeText.trim(),
      displayText,
      answeredAt: new Date().toISOString(),
    };

    onAnswer(answer);
  };

  const handleSkip = () => {
    const answer: OnboardingAnswer = {
      questionId: question.id,
      question: question.text,
      kind: question.kind,
      selectedOptionIds: [],
      selectedLabels: [],
      freeText: '',
      displayText: locale === 'ka' ? 'გამოტოვებული' : 'Skipped',
      answeredAt: new Date().toISOString(),
    };

    onAnswer(answer);
  };

  const handleOptionClick = (optionId: string) => {
    if (question.kind === 'single') {
      setSelectedIds([optionId]);
      const labels = [question.options.find((opt) => opt.id === optionId)?.label].filter(
        (label): label is string => Boolean(label)
      );
      const answer: OnboardingAnswer = {
        questionId: question.id,
        question: question.text,
        kind: question.kind,
        selectedOptionIds: [optionId],
        selectedLabels: labels,
        freeText: '',
        displayText: labels[0] || '',
        answeredAt: new Date().toISOString(),
      };
      setTimeout(() => onAnswer(answer), 200);
    } else if (question.kind === 'multi') {
      setSelectedIds((prev) => {
        const isSelected = prev.includes(optionId);
        if (isSelected) {
          return prev.filter((id) => id !== optionId);
        }
        // Check max selections limit
        const maxSelections = question.maxSelections || Infinity;
        if (prev.length >= maxSelections) {
          return prev;
        }
        return [...prev, optionId];
      });
    }
  };

  const canSubmit =
    question.kind === 'text'
      ? freeText.trim().length > 0
      : selectedIds.length >= (question.minSelections || 1);

  const progress = (questionNumber / totalQuestions) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Fixed Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div
          className="h-1 bg-foreground transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            ← {locale === 'ka' ? 'უკან' : 'Back'}
          </button>

          <div className="text-sm text-muted-foreground">
            {questionNumber} / {totalQuestions}
          </div>

          <div className="flex gap-1">
            {(['en', 'ka'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => onLocaleChange(lang)}
                className={cn(
                  'px-2 py-1 text-xs uppercase transition-colors duration-200',
                  locale === lang ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-24 pb-12">
        <div
          className={cn(
            'w-full max-w-2xl transition-all duration-500 ease-out',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          {/* Question */}
          <div className="mb-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
              {question.text}
            </h1>
            {question.helper && (
              <p className="text-base text-muted-foreground leading-relaxed">{question.helper}</p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {question.kind === 'text' ? (
              <div className="space-y-6">
                <textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder={question.placeholder}
                  rows={4}
                  autoFocus
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all duration-200 resize-none"
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={cn(
                      'flex-1 px-6 py-3 bg-foreground text-background rounded-lg text-sm font-medium transition-all duration-200',
                      canSubmit
                        ? 'hover:opacity-90 active:scale-[0.98]'
                        : 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    {locale === 'ka' ? 'გაგრძელება' : 'Continue'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="px-6 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {locale === 'ka' ? 'გამოტოვება' : 'Skip'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {question.options.map((option) => {
                    const isSelected = selectedIds.includes(option.id);
                    const maxReached = question.kind === 'multi' &&
                      !!question.maxSelections &&
                      selectedIds.length >= question.maxSelections &&
                      !isSelected;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleOptionClick(option.id)}
                        disabled={maxReached}
                        className={cn(
                          'w-full px-5 py-4 rounded-lg border text-left transition-all duration-200',
                          maxReached
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:border-foreground/40',
                          isSelected
                            ? 'border-foreground bg-foreground/5'
                            : 'border-border bg-background'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {option.emoji && (
                            <span className="text-xl flex-shrink-0 mt-0.5">{option.emoji}</span>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground mb-0.5">{option.label}</div>
                            {option.description && (
                              <div className="text-xs text-muted-foreground">
                                {option.description}
                              </div>
                            )}
                          </div>
                          {isSelected && question.kind === 'multi' && (
                            <svg
                              className="w-5 h-5 text-foreground flex-shrink-0 mt-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  {question.kind === 'multi' && question.maxSelections && (
                    <p className="text-xs text-muted-foreground pt-1">
                      {locale === 'ka'
                        ? `აირჩიე მაქსიმუმ ${question.maxSelections} (არჩეულია ${selectedIds.length})`
                        : `Select up to ${question.maxSelections} (${selectedIds.length} selected)`
                      }
                    </p>
                  )}
                </div>

                {question.kind !== 'single' && (
                  <div className="flex gap-3 pt-3">
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className={cn(
                        'flex-1 px-6 py-3 bg-foreground text-background rounded-lg text-sm font-medium transition-all duration-200',
                        canSubmit
                          ? 'hover:opacity-90 active:scale-[0.98]'
                          : 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      {locale === 'ka' ? 'გაგრძელება' : 'Continue'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="px-6 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {locale === 'ka' ? 'გამოტოვება' : 'Skip'}
                    </button>
                  </div>
                )}
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
