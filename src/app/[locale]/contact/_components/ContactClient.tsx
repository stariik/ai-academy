'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Headphones,
  BookOpen,
  Handshake,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Mail,
} from 'lucide-react';
import type { Category } from '@/lib/v2/data';
import type { AuthUser } from '@/lib/auth';
import { V2LocaleProvider, useV2Locale } from '@/lib/v2/i18n/context';
import type { Dict, Locale } from '@/lib/v2/i18n';
import { Walli } from '@/components/walli/Walli';
import { Navbar, Footer } from '../../_components/LandingClient';

const CONTACT_EMAIL = 'walle.academy.2026@gmail.com';
const TOPIC_ICONS = [Headphones, BookOpen, Handshake, Lightbulb];

export default function ContactClient({
  dict,
  locale,
  authUser,
  categories,
}: {
  dict: Dict;
  locale: Locale;
  authUser: AuthUser | null;
  categories: Category[];
}) {
  return (
    <V2LocaleProvider locale={locale} dict={dict}>
      <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
        <Navbar authUser={authUser} homeAnchors={false} />
        <main>
          <ContactSections />
        </main>
        <Footer categories={categories} />
      </div>
    </V2LocaleProvider>
  );
}

/* ─── motion helpers ─── */
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.22em] text-pulse font-bold inline-flex items-center gap-2">
      <span className="h-1 w-6 rounded-full bg-pulse" />
      {children}
    </p>
  );
}

/* ─── Field component ─── */
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-foreground">{label}</label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            className="text-xs text-red-500 flex items-center gap-1"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <AlertCircle className="w-3 h-3 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-pulse/60 focus:ring-2 focus:ring-pulse/15 hover:border-pulse/30';

/* ─── Contact form ─── */
function ContactForm() {
  const { dict, locale } = useV2Locale();
  const c = dict.contact;

  const [form, setForm] = React.useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = React.useState('');

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = c.errorRequired;
    if (!form.email.trim()) {
      next.email = c.errorRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = c.errorEmail;
    }
    if (!form.subject.trim()) next.subject = c.errorRequired;
    if (!form.message.trim()) next.message = c.errorRequired;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus('sending');
    setServerError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || c.errorGeneric);
        setStatus('error');
      } else {
        setStatus('success');
      }
    } catch {
      setServerError(c.errorGeneric);
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <motion.div
        className="flex flex-col items-center justify-center gap-5 py-16 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-pulse/20 blur-2xl scale-150" aria-hidden />
          <CheckCircle2 className="relative w-16 h-16 text-pulse" strokeWidth={1.5} />
        </div>
        <h3
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {c.successTitle}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{c.successBody}</p>
        <button
          onClick={() => {
            setStatus('idle');
            setForm({ name: '', email: '', subject: '', message: '' });
          }}
          className="mt-2 text-sm font-semibold text-pulse underline underline-offset-2 hover:opacity-70 transition-opacity"
        >
          {c.successAgain}
        </button>
      </motion.div>
    );
  }

  const isKa = locale === 'ka';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={c.fieldName} error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder={c.fieldNamePlaceholder}
            className={inputCls}
            disabled={status === 'sending'}
          />
        </Field>
        <Field label={c.fieldEmail} error={errors.email}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder={c.fieldEmailPlaceholder}
            className={inputCls}
            disabled={status === 'sending'}
          />
        </Field>
      </div>

      <Field label={c.fieldSubject} error={errors.subject}>
        <input
          type="text"
          value={form.subject}
          onChange={(e) => set('subject', e.target.value)}
          placeholder={c.fieldSubjectPlaceholder}
          className={inputCls}
          disabled={status === 'sending'}
        />
      </Field>

      <Field label={c.fieldMessage} error={errors.message}>
        <textarea
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder={c.fieldMessagePlaceholder}
          rows={5}
          className={`${inputCls} resize-none`}
          disabled={status === 'sending'}
        />
      </Field>

      <AnimatePresence>
        {status === 'error' && (
          <motion.div
            className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-sm text-red-500"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {serverError}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-4 pt-1">
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
          {c.formNote}
        </p>
        <button
          type="submit"
          disabled={status === 'sending'}
          className="inline-flex items-center gap-2 rounded-full bg-pulse text-primary-foreground px-6 py-3 text-sm font-bold shadow-[0_8px_28px_var(--pulse-glow)] hover:-translate-y-0.5 hover:shadow-[0_14px_36px_var(--pulse-glow)] transition-all disabled:opacity-60 disabled:translate-y-0 disabled:shadow-none shrink-0"
        >
          {status === 'sending' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {c.sending}
            </>
          ) : (
            <>
              {c.send}
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/* ─── main sections ─── */
function ContactSections() {
  const { dict, href } = useV2Locale();
  const c = dict.contact;

  return (
    <>
      {/* ─── Hero + Form ─── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[900px] max-w-[120vw] rounded-full bg-pulse/15 blur-[120px]"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-20 sm:pt-20 sm:pb-28">
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">

            {/* left — headline + info */}
            <div className="space-y-8 lg:pt-4">
              <div className="space-y-5">
                <Reveal>
                  <Eyebrow>{c.heroEyebrow}</Eyebrow>
                </Reveal>
                <Reveal delay={0.05}>
                  <h1
                    className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {c.heroTitle}{' '}
                    <span className="bg-gradient-to-r from-pulse via-pulse-soft to-pulse bg-clip-text text-transparent">
                      {c.heroTitleHighlight}
                    </span>
                  </h1>
                </Reveal>
                <Reveal delay={0.1}>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                    {c.heroSubtitle}
                  </p>
                </Reveal>
              </div>

              {/* topic chips */}
              <Reveal delay={0.15}>
                <div className="grid grid-cols-2 gap-3">
                  {c.topics.map((topic, i) => {
                    const Icon = TOPIC_ICONS[i % TOPIC_ICONS.length];
                    return (
                      <div
                        key={topic.title}
                        className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 hover:border-pulse/35 transition-colors"
                      >
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-pulse/12 text-pulse shrink-0 mt-0.5">
                          <Icon className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold leading-tight">{topic.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {topic.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Reveal>

              {/* direct email */}
              <Reveal delay={0.2}>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex items-center gap-2.5 text-sm text-muted-foreground hover:text-pulse transition-colors group"
                >
                  <Mail className="w-4 h-4 text-pulse" />
                  <span className="font-medium group-hover:underline underline-offset-2">
                    {CONTACT_EMAIL}
                  </span>
                </a>
              </Reveal>

              {/* Walli — desktop only */}
              <Reveal delay={0.18} className="hidden lg:block pt-2">
                <div className="relative w-fit">
                  <div
                    aria-hidden
                    className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-pulse/15 to-transparent blur-2xl scale-125"
                  />
                  <Walli size={140} state="wave" />
                </div>
              </Reveal>
            </div>

            {/* right — form card */}
            <Reveal delay={0.12}>
              <div className="relative overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_32px_80px_-20px_rgba(0,0,0,0.12)] p-7 sm:p-9">
                {/* decorative glow inside card */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-pulse/10 blur-3xl"
                />
                <div className="relative">
                  <div className="mb-6 space-y-1">
                    <h2
                      className="text-xl font-bold tracking-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {c.formTitle}
                    </h2>
                    <p className="text-sm text-muted-foreground">{c.formSubtitle}</p>
                  </div>
                  <ContactForm />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── CTA banner ─── */}
      <section className="py-16 sm:py-24 border-t border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-[28px] border border-pulse/25 bg-gradient-to-br from-pulse/12 via-card to-card px-6 py-10 sm:px-12 sm:py-14 text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-20 -right-10 h-56 w-56 rounded-full bg-pulse/20 blur-3xl"
              />
              <div className="relative space-y-4">
                <Sparkles className="w-5 h-5 text-pulse mx-auto" />
                <h2
                  className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {c.ctaTitle}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  {c.ctaSubtitle}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <a
                    href={href('register')}
                    className="inline-flex items-center gap-2 rounded-full bg-pulse text-primary-foreground px-6 py-3 text-sm font-bold shadow-[0_8px_28px_var(--pulse-glow)] hover:-translate-y-0.5 hover:shadow-[0_14px_36px_var(--pulse-glow)] transition-all"
                  >
                    {c.ctaPrimary}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href={`${href()}#courses`}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-bold hover:border-pulse/40 hover:text-pulse transition-colors"
                  >
                    {c.ctaSecondary}
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
