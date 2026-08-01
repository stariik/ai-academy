'use client';

import * as React from 'react';
import { useActionState } from 'react';
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

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        {redeemCode && <input type="hidden" name="redeem" value={redeemCode} />}

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

        <AuthSubmit pending={pending}>
          {pending ? dict.auth.submitLoading : dict.auth.submitRegister}
        </AuthSubmit>
      </form>
    </AuthShell>
  );
}
