'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { signUpAction, type AuthState } from '../actions';
import { V2LocaleProvider, useV2Locale } from '@/lib/v2/i18n/context';
import type { Dict, Locale } from '@/lib/v2/i18n';
import { AuthShell, AuthInput, AuthSubmit, AuthError } from './AuthShell';

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

  return (
    <AuthShell
      eyebrow={dict.meta.brandName}
      title={dict.auth.registerTitle}
      subtitle={dict.auth.registerSubtitle}
      footer={
        <>
          <span>{dict.auth.switchToLogin}</span>{' '}
          <a
            href={
              redeemCode
                ? `${href('login')}?redeem=${encodeURIComponent(redeemCode)}`
                : href('login')
            }
            className="font-bold text-pulse hover:underline"
          >
            {dict.auth.haveAccount}
          </a>
        </>
      }
    >
      {redeemCode && (
        <div className="mb-4 rounded-xl border border-green-300 bg-green-50 px-3.5 py-3">
          <p className="text-xs font-semibold text-green-800">{dict.promo.redeemPageSigningIn}</p>
          <p className="mt-1 font-mono text-sm font-bold tracking-wider text-green-900 break-all">
            {redeemCode}
          </p>
        </div>
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
          required
        />
        <AuthInput
          label={dict.auth.emailLabel}
          name="email"
          type="email"
          placeholder={dict.auth.emailPlaceholder}
          autoComplete="email"
          required
        />
        <AuthInput
          label={dict.auth.passwordLabel}
          name="password"
          type="password"
          placeholder={dict.auth.passwordPlaceholder}
          hint={dict.auth.passwordHint}
          autoComplete="new-password"
          required
        />

        {errorMessage && <AuthError message={errorMessage} />}

        <AuthSubmit pending={pending}>
          {pending ? dict.auth.submitLoading : dict.auth.submitRegister}
        </AuthSubmit>
      </form>
    </AuthShell>
  );
}
