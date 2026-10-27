'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { requestPasswordResetAction, updatePasswordAction, type AuthState } from '../actions';
import { useV2Locale, V2LocaleProvider } from '@/lib/v2/i18n/context';
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

function errorText(dict: Dict, code?: string) {
  if (!code) return null;
  if (code === 'EMPTY_FIELDS') return dict.auth.errorEmptyFields;
  if (code === 'PASSWORD_TOO_SHORT') return dict.auth.errorPasswordTooShort;
  if (code === 'RATE_LIMITED') return dict.auth.errorRateLimited;
  return dict.auth.errorGeneric;
}

function BackToLogin() {
  const { dict, href } = useV2Locale();
  return (
    <AuthSwitch prompt={dict.auth.switchToLogin} actionLabel={dict.auth.haveAccount} href={href('login')} />
  );
}

export function ForgotPasswordForm({ dict, locale }: { dict: Dict; locale: Locale }) {
  return (
    <V2LocaleProvider locale={locale} dict={dict}>
      <ForgotInner />
    </V2LocaleProvider>
  );
}

function ForgotInner() {
  const { dict, locale } = useV2Locale();
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    requestPasswordResetAction,
    null,
  );
  const errorMessage = errorText(dict, state?.error);

  return (
    <AuthShell
      eyebrow={dict.meta.brandName}
      title={dict.auth.forgotTitle}
      subtitle={dict.auth.forgotSubtitle}
      footer={<BackToLogin />}
    >
      {state?.sent ? (
        <AuthNotice tone="success" title={dict.auth.forgotSentNotice} />
      ) : (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <AuthInput
            label={dict.auth.emailLabel}
            name="email"
            type="email"
            placeholder={dict.auth.emailPlaceholder}
            autoComplete="email"
            required
          />
          {errorMessage && <AuthError message={errorMessage} />}
          <AuthSubmit pending={pending}>
            {pending ? dict.auth.submitLoading : dict.auth.submitForgot}
          </AuthSubmit>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetPasswordForm({
  dict,
  locale,
  linkValid,
}: {
  dict: Dict;
  locale: Locale;
  linkValid: boolean;
}) {
  return (
    <V2LocaleProvider locale={locale} dict={dict}>
      <ResetInner linkValid={linkValid} />
    </V2LocaleProvider>
  );
}

function ResetInner({ linkValid }: { linkValid: boolean }) {
  const { dict, locale, href } = useV2Locale();
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    updatePasswordAction,
    null,
  );
  const errorMessage = errorText(dict, state?.error);

  return (
    <AuthShell eyebrow={dict.meta.brandName} title={dict.auth.resetTitle} footer={<BackToLogin />}>
      {!linkValid ? (
        <>
          <AuthError message={dict.auth.resetLinkExpired} />
          <a
            href={href('forgot-password')}
            className="mt-4 block text-center text-sm font-bold text-pulse hover:underline"
          >
            {dict.auth.forgotTitle}
          </a>
        </>
      ) : (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <AuthPasswordInput
            label={dict.auth.newPasswordLabel}
            name="password"
            placeholder={dict.auth.passwordPlaceholder}
            hint={dict.auth.passwordHint}
            minLength={8}
            autoComplete="new-password"
            toggleLabel={{ show: dict.auth.showPassword, hide: dict.auth.hidePassword }}
            invalid={state?.error === 'PASSWORD_TOO_SHORT'}
          />
          {errorMessage && <AuthError message={errorMessage} />}
          <AuthSubmit pending={pending}>
            {pending ? dict.auth.submitLoading : dict.auth.submitReset}
          </AuthSubmit>
        </form>
      )}
    </AuthShell>
  );
}
