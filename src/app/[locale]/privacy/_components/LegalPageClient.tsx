'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import type { Category } from '@/lib/v2/data';
import type { AuthUser } from '@/lib/auth';
import type { LegalDoc } from '@/lib/legal/types';
import { V2LocaleProvider, useV2Locale } from '@/lib/v2/i18n/context';
import type { Dict, Locale } from '@/lib/v2/i18n';
import { Navbar, Footer } from '../../_components/LandingClient';

export default function LegalPageClient({
  doc,
  dict,
  locale,
  authUser,
  categories,
}: {
  doc: LegalDoc;
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
          <LegalContent doc={doc} />
        </main>
        <Footer categories={categories} />
      </div>
    </V2LocaleProvider>
  );
}

function LegalContent({ doc }: { doc: LegalDoc }) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-14 sm:py-20">
      {/* Header */}
      <motion.div
        className="mb-10 sm:mb-14 space-y-3 pb-8 border-b border-border"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-xs uppercase tracking-[0.22em] text-pulse font-bold inline-flex items-center gap-2">
          <span className="h-1 w-6 rounded-full bg-pulse" />
          {doc.eyebrow}
        </p>
        <h1
          className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {doc.title}
        </h1>
        <p className="text-xs text-muted-foreground">{doc.lastUpdated}</p>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed pt-1">
          {doc.intro}
        </p>
      </motion.div>

      {/* Sections */}
      <div className="space-y-10">
        {doc.sections.map((section, i) => (
          <motion.section
            key={section.heading}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.03 * i }}
          >
            <h2
              className="text-base sm:text-lg font-bold tracking-tight mb-3 text-foreground"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {section.heading}
            </h2>
            <ul className="space-y-2.5">
              {section.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                  <span className="mt-2 shrink-0 w-1 h-1 rounded-full bg-pulse/60" />
                  <span>
                    {typeof item === 'string' ? item : (
                      <>
                        <strong className="text-foreground font-semibold">{item.sub}</strong>
                        {' '}
                        {item.text}
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </motion.section>
        ))}
      </div>

      {/* Contact note */}
      <motion.div
        className="mt-14 flex items-start gap-3 rounded-2xl border border-pulse/25 bg-gradient-to-br from-pulse/8 via-card to-card p-5"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-pulse/12 text-pulse shrink-0">
          <Mail className="w-4 h-4" />
        </span>
        <p className="text-sm text-muted-foreground leading-relaxed">{doc.contactNote}</p>
      </motion.div>
    </div>
  );
}
