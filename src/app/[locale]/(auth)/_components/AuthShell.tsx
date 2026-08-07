'use client';

import * as React from 'react';
import { ArrowLeft, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Walle } from '@/components/walle/Walle';
import { useV2Locale } from '@/lib/v2/i18n/context';
import { cn } from '@/lib/utils';

// Mobile-first auth shell. Phones get a single scrollable column sized to the
// visual viewport (100dvh, so the browser chrome doesn't cut off the submit);
// lg+ splits into a brand panel and the form.

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
    <div className="min-h-[100dvh] bg-background text-foreground lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel — desktop only. Phones get the compact hero below instead. */}
      <aside className="relative hidden overflow-hidden bg-card lg:flex lg:flex-col lg:justify-center lg:px-14 xl:px-20">
        <div className="absolute inset-0 bg-starfield opacity-40" aria-hidden />
        <div
          className="absolute -left-32 top-1/4 h-[460px] w-[460px] rounded-full bg-pulse/12 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -right-24 bottom-0 h-[340px] w-[340px] rounded-full bg-heart/10 blur-3xl"
          aria-hidden
        />

        <div className="relative max-w-md">
          <Walle size={132} state="wave" noShadow />
          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.22em] text-pulse">
            {dict.meta.siteName}
          </p>
          <p
            className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {dict.meta.siteTagline}
          </p>
          {subtitle && (
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </aside>

      {/* overflow-x-clip, not overflow-hidden: hidden would make this a scroll
          container and kill the sticky header. */}
      <div className="relative flex min-h-[100dvh] flex-col overflow-x-clip">
        <div className="absolute inset-0 -z-10 bg-starfield opacity-30 lg:hidden" aria-hidden />
        <div
          className="absolute -left-24 top-16 -z-10 h-[320px] w-[320px] rounded-full bg-pulse/12 blur-3xl lg:hidden"
          aria-hidden
        />

        <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-md items-center px-2 sm:h-16 sm:px-4">
            <a
              href={href()}
              className="-ml-1 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold tracking-tight transition-colors hover:bg-muted active:bg-muted"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              {dict.meta.brandName}
            </a>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-7 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-10">
          <div className="mb-6 text-center sm:mb-7">
            <div className="inline-block lg:hidden">
              <Walle size={76} state="wave" noShadow />
            </div>
            {eyebrow && (
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-pulse lg:hidden">
                {eyebrow}
              </p>
            )}
            <h1
              className="mt-2 text-[28px] font-bold leading-[1.12] tracking-tight sm:text-4xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base lg:hidden">
                {subtitle}
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.18)] sm:p-7">
            {children}
          </div>

          {footer && <div className="mt-5">{footer}</div>}
        </main>
      </div>
    </div>
  );
}

const FIELD_CLASS =
  // text-base is deliberate: anything under 16px makes iOS Safari zoom the
  // whole page in on focus, which is the single worst mobile form bug.
  'w-full rounded-xl border border-border bg-background px-4 text-base font-medium h-12 ' +
  'placeholder:font-normal placeholder:text-muted-foreground/70 ' +
  'focus:outline-none focus:ring-2 focus:ring-pulse/40 focus:border-pulse/40 transition-colors ' +
  'aria-[invalid=true]:border-heart/50';

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-bold text-foreground">
      {children}
    </label>
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
  invalid,
  enterKeyHint,
}: {
  label: string;
  name: string;
  type?: 'text' | 'email';
  placeholder?: string;
  hint?: string;
  defaultValue?: string;
  autoComplete?: string;
  required?: boolean;
  invalid?: boolean;
  enterKeyHint?: 'next' | 'go' | 'done';
}) {
  const id = React.useId();
  const email = type === 'email';

  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        type={type}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={hint ? `${id}-hint` : undefined}
        enterKeyHint={enterKeyHint}
        inputMode={email ? 'email' : undefined}
        autoCapitalize={email ? 'none' : undefined}
        autoCorrect={email ? 'off' : undefined}
        spellCheck={email ? false : undefined}
        className={FIELD_CLASS}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

export function AuthPasswordInput({
  label,
  name,
  placeholder,
  hint,
  minLength,
  autoComplete,
  toggleLabel,
  invalid,
  enterKeyHint = 'go',
}: {
  label: string;
  name: string;
  placeholder?: string;
  hint?: string;
  /** When set, `hint` doubles as a live checklist item that ticks at this length. */
  minLength?: number;
  autoComplete?: string;
  toggleLabel: { show: string; hide: string };
  invalid?: boolean;
  enterKeyHint?: 'next' | 'go' | 'done';
}) {
  const id = React.useId();
  const [visible, setVisible] = React.useState(false);
  // Length only, never the value — an uncontrolled input keeps password
  // managers and browser autofill working.
  const [length, setLength] = React.useState(0);
  const met = minLength !== undefined && length >= minLength;

  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          name={name}
          placeholder={placeholder}
          onChange={(e) => setLength(e.target.value.length)}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          aria-invalid={invalid || undefined}
          aria-describedby={hint ? `${id}-hint` : undefined}
          enterKeyHint={enterKeyHint}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={cn(FIELD_CLASS, 'pr-12')}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? toggleLabel.hide : toggleLabel.show}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground active:text-foreground"
        >
          {visible ? (
            <EyeOff className="h-5 w-5" aria-hidden />
          ) : (
            <Eye className="h-5 w-5" aria-hidden />
          )}
        </button>
      </div>
      {hint && (
        <p
          id={`${id}-hint`}
          className={cn(
            'mt-1.5 flex items-center gap-1.5 text-xs transition-colors',
            met ? 'font-semibold text-pulse' : 'text-muted-foreground',
          )}
        >
          {minLength !== undefined && (
            <Check
              className={cn('h-3.5 w-3.5 shrink-0 transition-opacity', met ? 'opacity-100' : 'opacity-30')}
              aria-hidden
            />
          )}
          {hint}
        </p>
      )}
    </div>
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
      aria-busy={pending}
      className={cn(
        'group inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-pulse px-5 py-3.5 text-base font-bold text-primary-foreground transition-all',
        'shadow-[0_8px_24px_var(--pulse-glow)] hover:shadow-[0_12px_36px_var(--pulse-glow)] sm:hover:-translate-y-0.5 active:scale-[0.99]',
        'disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_24px_var(--pulse-glow)] disabled:cursor-not-allowed',
      )}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      <span>{children}</span>
      {!pending && (
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
          →
        </span>
      )}
    </button>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-heart/40 bg-heart/5 px-4 py-3 text-sm font-semibold text-heart"
    >
      {message}
    </div>
  );
}

/** Inline notice above the form — email-confirmation prompt, redeem code, etc. */
export function AuthNotice({
  tone = 'pulse',
  title,
  code,
}: {
  tone?: 'pulse' | 'success';
  title: string;
  code?: string;
}) {
  return (
    <div
      className={cn(
        'mb-4 rounded-xl border px-4 py-3',
        tone === 'success'
          ? 'border-green-300 bg-green-50 text-green-800'
          : 'border-pulse/40 bg-pulse/5 text-pulse',
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      {code && (
        <p className="mt-1 break-all font-mono text-base font-bold tracking-wider text-green-900">
          {code}
        </p>
      )}
    </div>
  );
}

/** Big tap-target row for the login ↔ register switch. */
export function AuthSwitch({
  prompt,
  actionLabel,
  href,
}: {
  prompt: string;
  actionLabel: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-full border border-border px-5 text-sm font-semibold text-muted-foreground transition-colors hover:border-pulse/40 hover:text-foreground active:bg-muted"
    >
      {prompt}
      <span className="font-bold text-pulse">{actionLabel}</span>
    </a>
  );
}
