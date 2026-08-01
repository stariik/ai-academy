'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { signInAction, type AuthState } from '../actions';
import { useV2Locale } from '@/lib/v2/i18n/context';
import { V2LocaleProvider } from '@/lib/v2/i18n/context';
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

  const credentialsInvalid = state?.error === 'INVALID_CREDENTIALS';

  return (
    <AuthShell
      eyebrow={dict.meta.brandName}
      title={dict.auth.loginTitle}
      subtitle={dict.auth.loginSubtitle}
      footer={
        <AuthSwitch
          prompt={dict.auth.switchToRegister}
          actionLabel={dict.auth.needAccount}
          href={
            redeemCode
              ? `${href('register')}?redeem=${encodeURIComponent(redeemCode)}`
              : href('register')
          }
        />
      }
    >
      {confirmNotice && <AuthNotice title={dict.auth.confirmEmailNotice} />}

      {redeemCode && (
        <AuthNotice tone="success" title={dict.promo.redeemPageSigningIn} code={redeemCode} />
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
          enterKeyHint="next"
          invalid={credentialsInvalid}
          required
        />
        <AuthPasswordInput
          label={dict.auth.passwordLabel}
          name="password"
          placeholder={dict.auth.passwordPlaceholder}
          autoComplete="current-password"
          toggleLabel={{ show: dict.auth.showPassword, hide: dict.auth.hidePassword }}
          invalid={credentialsInvalid}
        />

        {errorMessage && <AuthError message={errorMessage} />}

        <AuthSubmit pending={pending}>
          {pending ? dict.auth.submitLoading : dict.auth.submitLogin}
        </AuthSubmit>
      </form>
    </AuthShell>
  );
}
