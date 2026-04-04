"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type ContactMethod = "email" | "phone";

/* ────────────────────────────────────────────────────────── */
/*  Stepper                                                    */
/* ────────────────────────────────────────────────────────── */

function Stepper() {
  return (
    <div className="mx-auto flex w-full max-w-[220px] items-center">
      {[1, 2, 3].map((step, i) => {
        const last = i === 2;
        return (
          <div key={step} className="flex items-center" style={{ flex: last ? "0 0 auto" : 1 }}>
            <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold" style={{ background: "linear-gradient(135deg, #0992C2, #0AC4E0)", color: "#fff", boxShadow: step === 3 ? "0 0 0 4px rgba(9,146,194,0.13)" : "none" }}>
              {step < 3 ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              ) : step}
            </div>
            {!last && <div className="mx-1 h-[2px] flex-1 rounded-full" style={{ background: "linear-gradient(90deg, #0992C2, #0AC4E0)" }} />}
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Success View                                               */
/* ────────────────────────────────────────────────────────── */

function SuccessView() {
  return (
    <div className="ob-page-bg flex min-h-[100dvh] flex-col" style={{ color: "#0f172a" }}>
      <div aria-hidden="true" className="ob-orbs"><div className="ob-orb ob-orb-1" /><div className="ob-orb ob-orb-2" /><div className="ob-orb ob-orb-3" /></div>

      <div className="relative z-[1] flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        {/* Animated check */}
        <div className="fade-up fade-up-d1 mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg, #0992C2, #0AC4E0)", boxShadow: "0 8px 32px rgba(9,146,194,0.25)" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>

        <h1 className="fade-up fade-up-d2 ob-gradient-text mb-3 text-[clamp(28px,7vw,36px)] font-extrabold tracking-tight">
          You&apos;re all set!
        </h1>
        <p className="fade-up fade-up-d3 mx-auto mb-8 max-w-[300px] text-[16px] leading-relaxed" style={{ color: "#64748b" }}>
          Your personalized learning journey is ready. Start exploring your courses now!
        </p>

        <a
          href="/student"
          className="fade-up fade-up-d4 inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-[17px] font-bold text-white no-underline"
          style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 6px 28px rgba(249,115,22,0.35)", minHeight: 52 }}
        >
          Go to My Courses
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </a>

        <div className="fade-up fade-up-d5 mt-8 flex w-full max-w-[320px] flex-col gap-2.5">
          {[
            { text: "Personalized curriculum built for you", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" },
            { text: "Your information is always private", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
          ].map(({ text, icon }) => (
            <div key={text} className="flex items-center gap-3 rounded-xl bg-teal-50 px-4 py-3" style={{ border: "1px solid rgba(9,146,194,0.1)" }}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100/80">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0992C2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
              </div>
              <span className="text-[13px] font-medium leading-snug" style={{ color: "#0B2D72" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Register Form                                              */
/* ────────────────────────────────────────────────────────── */

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const ageGroup = searchParams.get("age_group");
  const topicsRaw = searchParams.get("topics");
  const utmSource = searchParams.get("utm_source");
  const utmMedium = searchParams.get("utm_medium");
  const utmCampaign = searchParams.get("utm_campaign");
  const utmContent = searchParams.get("utm_content");
  const utmTerm = searchParams.get("utm_term");

  const inputRef = useRef<HTMLInputElement>(null);
  const [method, setMethod] = useState<ContactMethod>("email");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!ageGroup || !topicsRaw) router.replace("/onboarding/questions");
  }, [ageGroup, topicsRaw, router]);

  useEffect(() => {
    if (!submitted) inputRef.current?.focus();
  }, [method, submitted]);

  const validate = (): string | null => {
    const v = value.trim();
    if (!v) return method === "email" ? "Please enter your email." : "Please enter your phone number.";
    if (method === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address.";
    if (method === "phone" && v.replace(/\D/g, "").length < 7) return "Enter a valid phone number.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); inputRef.current?.focus(); return; }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: method === "email" ? value.trim() : null,
          phone: method === "phone" ? value.trim() : null,
          age_group: ageGroup,
          topics: topicsRaw ? topicsRaw.split(",").filter(Boolean) : [],
          utm_source: utmSource, utm_medium: utmMedium,
          utm_campaign: utmCampaign, utm_content: utmContent, utm_term: utmTerm,
        }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  };

  if (submitted) return <SuccessView />;

  return (
    <div className="ob-page-bg flex min-h-[100dvh] flex-col" style={{ color: "#0f172a" }}>
      <div aria-hidden="true" className="ob-orbs">
        <div className="ob-orb ob-orb-1" /><div className="ob-orb ob-orb-2" /><div className="ob-orb ob-orb-3" /><div className="ob-orb ob-orb-5" />
      </div>

      {/* Top bar */}
      <div className="relative z-[1] flex items-center justify-between px-6 pt-5">
        <span className="ob-gradient-text text-base font-extrabold tracking-tight">AI Academy</span>
        <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>Step 3 of 3</span>
      </div>

      {/* Content */}
      <div className="relative z-[1] mx-auto flex w-full max-w-[440px] flex-1 flex-col gap-0 px-6 pt-8 pb-10">
        {/* Progress */}
        <div className="fade-up mb-10"><Stepper /></div>

        {/* Heading */}
        <div className="fade-up fade-up-d1 mb-8">
          <h1 className="mb-2 text-[clamp(26px,7vw,34px)] font-extrabold leading-tight tracking-tight">
            Almost there<span className="ob-gradient-text">.</span>
          </h1>
          <p className="text-base" style={{ color: "#64748b" }}>Where should we send your personalized plan?</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {/* Method toggle */}
          <div className="fade-up fade-up-d2 flex gap-1 rounded-2xl bg-white/60 p-1 backdrop-blur-sm" style={{ border: "1px solid rgba(226,232,240,0.8)" }}>
            {(["email", "phone"] as const).map((m) => {
              const active = method === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMethod(m); setValue(""); setError(null); }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold transition-all duration-200"
                  style={{
                    background: active ? "linear-gradient(135deg, #0992C2, #0AC4E0)" : "transparent",
                    color: active ? "#fff" : "#64748b",
                    boxShadow: active ? "0 2px 12px rgba(9,146,194,0.25)" : "none",
                    minHeight: 44,
                  }}
                >
                  {m === "email" ? (
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke={active ? "#fff" : "currentColor"} strokeWidth="1.3" /><path d="M1.5 5.5L8 9.5L14.5 5.5" stroke={active ? "#fff" : "currentColor"} strokeWidth="1.3" strokeLinecap="round" /></svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="4" y="1" width="8" height="14" rx="2" stroke={active ? "#fff" : "currentColor"} strokeWidth="1.3" /><circle cx="8" cy="12.5" r="0.75" fill={active ? "#fff" : "currentColor"} /></svg>
                  )}
                  {m === "email" ? "Email" : "Phone"}
                </button>
              );
            })}
          </div>

          {/* Input */}
          <div className="fade-up fade-up-d3">
            <label htmlFor="contact" className="mb-1.5 block text-[13px] font-semibold">
              {method === "email" ? "Email address" : "Phone number"}
            </label>
            <div className="rounded-2xl p-[2px] transition-all" style={{ background: focused ? "linear-gradient(135deg, #0992C2, #0AC4E0)" : error ? "#ef4444" : "#e2e8f0", boxShadow: focused ? "0 0 0 4px rgba(9,146,194,0.1)" : error ? "0 0 0 4px rgba(239,68,68,0.08)" : "none" }}>
              <div className="flex items-center rounded-xl bg-white/90 px-4">
                <div className="mr-2.5 shrink-0" style={{ color: focused ? "#0992C2" : error ? "#ef4444" : "#94a3b8" }}>
                  {method === "email" ? (
                    <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M2 6.5L9 10.5L16 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><rect x="5" y="1.5" width="8" height="15" rx="2" stroke="currentColor" strokeWidth="1.4" /><circle cx="9" cy="13.5" r="1" fill="currentColor" /></svg>
                  )}
                </div>
                <input
                  ref={inputRef}
                  id="contact"
                  type={method === "email" ? "email" : "tel"}
                  inputMode={method === "email" ? "email" : "tel"}
                  autoComplete={method === "email" ? "email" : "tel"}
                  placeholder={method === "email" ? "you@example.com" : "+1 (555) 000-0000"}
                  value={value}
                  onChange={(e) => { setValue(e.target.value); setError(null); }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  aria-invalid={!!error}
                  className="h-[54px] flex-1 border-none bg-transparent text-base outline-none"
                  style={{ caretColor: "#0992C2" }}
                />
              </div>
            </div>
            {error && (
              <p className="mt-1.5 flex items-center gap-1 text-[13px] font-medium" style={{ color: "#ef4444" }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" /><path d="M7 4.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="7" cy="9.5" r="0.75" fill="currentColor" /></svg>
                {error}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="fade-up fade-up-d4 flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl text-base font-bold text-white transition-all duration-200 active:scale-[0.98]"
            style={{
              background: loading ? "linear-gradient(135deg, #fdba74, #fb923c)" : "linear-gradient(135deg, #f97316, #ea580c)",
              boxShadow: loading ? "none" : "0 6px 28px rgba(249,115,22,0.35)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <><span className="inline-block h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/30 border-t-white" />Submitting...</>
            ) : (
              <>Get My Learning Plan<svg width="17" height="17" viewBox="0 0 18 18" fill="none"><path d="M3.75 9H14.25M9.75 4.5L14.25 9L9.75 13.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></>
            )}
          </button>

          {/* Privacy */}
          <div className="fade-up fade-up-d5 flex items-start gap-2 rounded-xl bg-white/60 px-3.5 py-3 backdrop-blur-sm" style={{ border: "1px solid rgba(226,232,240,0.7)" }}>
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="mt-0.5 shrink-0"><path d="M7.5 1.5C7.5 1.5 2.5 3.5 2.5 7.5V11L7.5 13.5L12.5 11V7.5C12.5 3.5 7.5 1.5 7.5 1.5Z" stroke="#94a3b8" strokeWidth="1.2" strokeLinejoin="round" /><path d="M5.5 7.5L6.75 8.75L9.5 6" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <p className="text-[12px] leading-snug" style={{ color: "#94a3b8" }}>
              We never share your information with third parties. Unsubscribe anytime.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Page Export                                                */
/* ────────────────────────────────────────────────────────── */

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="ob-page-bg flex min-h-[100dvh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-teal" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
