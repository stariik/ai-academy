'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { signInAction, type AuthState } from '../actions';
import { useV2Locale } from '@/lib/v2/i18n/context';
import { V2LocaleProvider } from '@/lib/v2/i18n/context';
import type { Dict, Locale } from '@/lib/v2/i18n';
import { AuthShell, AuthInput, AuthSubmit, AuthError } from './AuthShell';

export default function LoginForm({
  dict,
  locale,
  confirmNotice,
  redeemCode,
}: {
  dict: Dict;
  locale: Locale;
  confirmNotice?: boolean;
  redeemCode?: string;
}) {
  return (
    <V2LocaleProvider locale={locale} dict={dict}>
      <Inner confirmNotice={confirmNotice} redeemCode={redeemCode} />
    </V2LocaleProvider>
  );
}

function Inner({ confirmNotice, redeemCode }: { confirmNotice?: boolean; redeemCode?: string }) {
  const { dict, locale, href } = useV2Locale();
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signInAction,
    null,
  );

  const errorMessage = state?.error
    ? state.error === 'EMPTY_FIELDS'
      ? dict.auth.errorEmptyFields
      : state.error === 'INVALID_CREDENTIALS'
      ? dict.auth.errorInvalidCredentials
      : dict.auth.errorGeneric
    : null;

  return (
    <AuthShell
      eyebrow={dict.meta.brandName}
      title={dict.auth.loginTitle}
      subtitle={dict.auth.loginSubtitle}
      footer={
        <>
          <span>{dict.auth.switchToRegister}</span>{' '}
          <a
            href={
              redeemCode
                ? `${href('register')}?redeem=${encodeURIComponent(redeemCode)}`
                : href('register')
            }
            className="font-bold text-pulse hover:underline"
          >
            {dict.auth.needAccount}
          </a>
        </>
      }
    >
      {confirmNotice && (
        <div className="mb-4 rounded-xl border border-pulse/40 bg-pulse/5 px-3.5 py-2.5 text-xs font-semibold text-pulse">
          {dict.auth.confirmEmailNotice}
        </div>
      )}

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
          autoComplete="current-password"
          required
        />

        {errorMessage && <AuthError message={errorMessage} />}

        <AuthSubmit pending={pending}>
          {pending ? dict.auth.submitLoading : dict.auth.submitLogin}
        </AuthSubmit>
      </form>
    </AuthShell>
  );
}
