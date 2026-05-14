'use client';

import * as React from 'react';
import { Walli } from '@/components/walli/Walli';
import { useV2Locale } from '@/lib/v2/i18n/context';
import { cn } from '@/lib/utils';

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { dict, href } = useV2Locale();

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 bg-starfield opacity-30" aria-hidden />
      <div className="absolute top-1/4 -left-24 w-[420px] h-[420px] rounded-full bg-pulse/12 blur-3xl -z-10" aria-hidden />
      <div className="absolute bottom-0 -right-20 w-[320px] h-[320px] rounded-full bg-heart/10 blur-3xl -z-10" aria-hidden />

      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border">
        <div className="mx-auto max-w-md px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <a href={href()} className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            ← {dict.meta.brandName}
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 sm:px-6 pt-10 sm:pt-14 pb-12 flex flex-col items-center">
        <div className="text-center space-y-4 mb-6 sm:mb-8">
          <div className="inline-block">
            <Walli size={96} state="wave" noShadow />
          </div>
          {eyebrow && (
            <p className="text-[10px] uppercase tracking-[0.22em] text-pulse font-bold">{eyebrow}</p>
          )}
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.08]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        <div className="w-full rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.18)]">
          {children}
        </div>

        {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
      </main>
    </div>
  );
}

export function AuthInput({
  label,
  name,
  type = 'text',
  placeholder,
  hint,
  defaultValue,
  autoComplete,
  required,
}: {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  hint?: string;
  defaultValue?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5">
        {label}
      </span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        required={required}
        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pulse/40 focus:border-pulse/40 transition-colors"
      />
      {hint && <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>}
    </label>
  );
}

export function AuthSubmit({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'group inline-flex items-center justify-center gap-2 w-full rounded-full bg-pulse text-primary-foreground px-5 py-3 text-sm font-bold transition-all',
        'shadow-[0_8px_24px_var(--pulse-glow)] hover:shadow-[0_12px_36px_var(--pulse-glow)] hover:-translate-y-0.5',
        'disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_24px_var(--pulse-glow)] disabled:cursor-not-allowed',
      )}
    >
      <span>{children}</span>
      <span aria-hidden className="group-hover:translate-x-0.5 transition-transform">
        →
      </span>
    </button>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-heart/40 bg-heart/5 px-3.5 py-2.5 text-xs font-semibold text-heart">
      {message}
    </div>
  );
}
