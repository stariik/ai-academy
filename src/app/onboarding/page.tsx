import type { SearchParams } from "next/dist/server/request/search-params";

interface PageProps {
  searchParams: Promise<SearchParams>;
}

function buildCtaHref(params: SearchParams): string {
  const utmEntries = Object.entries(params).filter(([key]) =>
    key.startsWith("utm_")
  );
  if (utmEntries.length === 0) return "/onboarding/questions";
  const qs = new URLSearchParams(
    utmEntries.map(([k, v]) => [k, String(v)])
  ).toString();
  return `/onboarding/questions?${qs}`;
}

/* ────────────────────────────────────────────────────────── */
/*  Landing Page                                              */
/* ────────────────────────────────────────────────────────── */

export default async function LandingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ctaHref = buildCtaHref(params);

  return (
    <div className="ob-page-bg min-h-screen" style={{ color: "#0f172a" }}>
      {/* Orbs */}
      <div aria-hidden="true" className="ob-orbs">
        <div className="ob-orb ob-orb-1" />
        <div className="ob-orb ob-orb-2" />
        <div className="ob-orb ob-orb-3" />
        <div className="ob-orb ob-orb-4" />
        <div className="ob-orb ob-orb-5" />
      </div>

      {/* ═══ HERO ═══ */}
      <section className="relative z-[1] flex min-h-[100svh] flex-col items-center justify-center px-6 pt-20 pb-12 text-center">
        {/* Trust badge */}
        <div className="fade-up fade-up-d1 mb-6 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-[13px] font-semibold shadow-sm backdrop-blur-sm" style={{ border: "1px solid rgba(11,45,114,0.12)" }}>
          <span className="flex gap-0.5 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            ))}
          </span>
          <span style={{ color: "#334155" }}>Trusted by 12,400+ families</span>
        </div>

        {/* Headline */}
        <h1 className="fade-up fade-up-d2 mx-auto max-w-[540px] text-[clamp(36px,9vw,56px)] font-extrabold leading-[1.05] tracking-tight">
          Learn{" "}
          <span className="ob-gradient-text">AI Skills</span>
          <br />
          That Matter
        </h1>

        {/* Sub */}
        <p className="fade-up fade-up-d3 mx-auto mt-5 max-w-[400px] text-[clamp(16px,4.2vw,19px)] leading-relaxed" style={{ color: "#64748b" }}>
          AI tools, agents, prompt engineering & vibe coding.
          Personalized for <strong style={{ color: "#0f172a" }}>every age</strong>.
        </p>

        {/* CTA */}
        <div className="fade-up fade-up-d4 mt-8">
          <a
            href={ctaHref}
            className="pulse-glow-orange shimmer-btn group relative inline-flex items-center gap-2.5 rounded-2xl px-10 py-4 text-[17px] font-bold text-white no-underline"
            style={{
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              boxShadow: "0 8px 32px rgba(249,115,22,0.35), 0 2px 8px rgba(0,0,0,0.08)",
              touchAction: "manipulation",
              minHeight: 56,
            }}
          >
            Start Learning Free
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-0.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </a>
        </div>

        {/* Trust line */}
        <div className="fade-up fade-up-d5 mt-6 flex flex-wrap items-center justify-center gap-5 text-[13px] font-medium" style={{ color: "#94a3b8" }}>
          {["No credit card", "Free to start", "Cancel anytime"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              {t}
            </span>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-25" aria-hidden="true">
          <svg width="20" height="32" viewBox="0 0 20 32" fill="none"><rect x="1" y="1" width="18" height="30" rx="9" stroke="currentColor" strokeWidth="1.5" /><rect className="float" x="9" y="6" width="2" height="8" rx="1" fill="currentColor" /></svg>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF ═══ */}
      <section className="relative z-[1] px-6 pb-14">
        <div className="ob-glass-card mx-auto max-w-[520px] rounded-3xl p-6">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="flex">
              {["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981"].map((c, i) => (
                <div key={i} className="h-9 w-9 rounded-full border-2 border-white" style={{ background: `linear-gradient(135deg, ${c}, ${c}cc)`, marginLeft: i ? -10 : 0, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
              ))}
            </div>
            <div>
              <div className="text-[15px] font-bold leading-tight">12,400+ families</div>
              <div className="text-[13px]" style={{ color: "#64748b" }}>already learning with AI Academy</div>
            </div>
          </div>

          <div className="mb-3 flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            ))}
            <span className="ml-1.5 text-sm font-semibold">4.9</span>
            <span className="text-[13px]" style={{ color: "#94a3b8" }}>(2,800+ reviews)</span>
          </div>

          <p className="text-[15px] leading-[1.7]">
            <span className="ob-gradient-text mr-0.5 text-2xl font-extrabold leading-none">&ldquo;</span>
            My daughter went from dreading math to asking for extra lessons.
            The AI just <strong>gets her</strong> in a way no teacher could with 30 students.
          </p>
          <p className="mt-2 text-[13px] font-medium" style={{ color: "#64748b" }}>
            &mdash; Maria S., parent of a 9-year-old
          </p>
        </div>
      </section>

      {/* ═══ VALUE PROPS ═══ */}
      <section className="relative z-[1] px-6 pb-14">
        <div className="mx-auto max-w-[520px]">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "#0B2D72" }}>What You&apos;ll Learn</p>
          <h2 className="mb-8 text-center text-[clamp(24px,7vw,34px)] font-extrabold leading-tight tracking-tight">
            The skills that <span className="ob-gradient-text">matter most</span>
          </h2>

          <div className="flex flex-col gap-3">
            {[
              { icon: "M12 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM3 11h18v10H3z", label: "AI Tools & Agents", desc: "Master ChatGPT, Claude & build AI agents that automate real tasks.", color: "#0992C2", bg: "#e6f5fa" },
              { icon: "M16 18l6-6-6-6M8 6l-6 6 6 6M14 4l-4 16", label: "Vibe Coding", desc: "Build full apps by describing what you want. Zero coding experience needed.", color: "#0B2D72", bg: "#fdf8ec" },
              { icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z", label: "Prompt Engineering", desc: "Talk to AI like a pro. Get 10x better results from any AI tool, instantly.", color: "#0891b2", bg: "#cffafe" },
            ].map(({ label, desc, color, bg }, i) => (
              <div key={label} className={`ob-glass-card flex items-start gap-4 rounded-2xl p-5 slide-right slide-right-d${i + 1}`}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: bg, color }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {i === 0 && <><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><circle cx="8" cy="16" r="1" fill="currentColor" /><circle cx="16" cy="16" r="1" fill="currentColor" /></>}
                    {i === 1 && <><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /><line x1="14" y1="4" x2="10" y2="20" /></>}
                    {i === 2 && <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />}
                  </svg>
                </div>
                <div>
                  <h3 className="mb-1 text-[15px] font-bold leading-snug">{label}</h3>
                  <p className="text-[14px] leading-relaxed" style={{ color: "#64748b" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="relative z-[1] px-6 pb-14">
        <div className="mx-auto max-w-[520px]">
          <h2 className="mb-6 text-center text-[clamp(22px,6vw,30px)] font-extrabold leading-tight tracking-tight">
            Real people, <span className="ob-gradient-text">real results</span>
          </h2>

          <div className="flex flex-col gap-3">
            {[
              { name: "David R.", role: "Software developer", q: "I had zero AI experience. After 3 weeks, I built an AI agent that handles my email sorting. The lessons are ridiculously clear." },
              { name: "Sarah K.", role: "Parent of a 14-year-old", q: "My son built his first app using vibe coding in just one weekend. He's now teaching his friends." },
              { name: "Mike T.", role: "Marketing manager", q: "The prompt engineering module alone saved me 10+ hours a week. I write better prompts than most 'AI experts' I know." },
            ].map(({ name, role, q }) => (
              <div key={name} className="ob-glass-card rounded-2xl p-5">
                <div className="mb-2.5 flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  ))}
                </div>
                <p className="mb-3 text-[15px] leading-[1.7]">&ldquo;{q}&rdquo;</p>
                <div className="text-sm font-bold">{name}</div>
                <div className="text-[13px]" style={{ color: "#64748b" }}>{role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BOTTOM CTA ═══ */}
      <section className="relative z-[1] px-6 pb-16">
        <div className="ob-gradient gradient-animated mx-auto max-w-[520px] overflow-hidden rounded-3xl">
          <div className="relative px-6 py-12 text-center text-white">
            <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%)" }} />

            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                Limited free spots
              </div>

              <h2 className="mb-3 text-[clamp(24px,7vw,34px)] font-extrabold leading-[1.1] tracking-tight">
                The AI revolution won&apos;t wait. Will&nbsp;you?
              </h2>
              <p className="mx-auto mb-7 max-w-[340px] text-[15px] leading-relaxed opacity-85">
                Get your personalized learning plan in under 2&nbsp;minutes.
              </p>

              <a
                href={ctaHref}
                className="inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-[17px] font-extrabold no-underline"
                style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", color: "#fff", boxShadow: "0 6px 24px rgba(0,0,0,0.2)", touchAction: "manipulation", minHeight: 52 }}
              >
                Start My Free Plan
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </a>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[13px] font-medium opacity-75">
                {["No credit card", "Free to start"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-[1] border-t border-white/40 bg-white/50 px-6 py-8 text-center backdrop-blur-md">
        <div className="ob-gradient-text mb-1 text-lg font-extrabold tracking-tight">AI Academy</div>
        <p className="text-[13px] leading-relaxed" style={{ color: "#64748b" }}>
          Learn AI tools, agents & vibe coding.<br />
          &copy; {new Date().getFullYear()} AI Academy. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
