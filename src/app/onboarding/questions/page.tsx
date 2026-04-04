"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type AgeGroup = "child" | "adult";

interface Course {
  id: string;
  title: string;
  description: string;
  tags: string[];
}

/* ────────────────────────────────────────────────────────── */
/*  Progress Stepper                                          */
/* ────────────────────────────────────────────────────────── */

function Stepper({ current }: { current: number }) {
  const labels = ["Start", "Questions", "Register"];
  return (
    <div className="flex w-full items-center px-6 pt-5 pb-1">
      {labels.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const last = i === labels.length - 1;
        return (
          <div key={label} className="flex items-center" style={{ flex: last ? "0 0 auto" : 1 }}>
            <div className="relative flex flex-col items-center">
              <div
                className="relative flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-500"
                style={{
                  background: done || active ? "linear-gradient(135deg, #0992C2, #0AC4E0)" : "#e2e8f0",
                  color: done || active ? "#fff" : "#94a3b8",
                  boxShadow: active ? "0 0 0 4px rgba(9,146,194,0.13)" : "none",
                }}
              >
                {done ? (
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (
                  i + 1
                )}
                {active && <span className="absolute inset-0 animate-ping rounded-full bg-teal/20" style={{ animationDuration: "2s" }} />}
              </div>
              <span className="absolute top-8 whitespace-nowrap text-[10px] font-medium" style={{ color: done || active ? "#0992C2" : "#94a3b8" }}>
                {label}
              </span>
            </div>
            {!last && (
              <div className="relative mx-1 h-[3px] flex-1 overflow-hidden rounded-full bg-slate-200">
                <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700" style={{ width: done ? "100%" : "0%", background: "linear-gradient(90deg, #0992C2, #0AC4E0)" }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Questions Content                                         */
/* ────────────────────────────────────────────────────────── */

function QuestionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [isContinuing, setIsContinuing] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((d: Course[]) => { setCourses(d); setLoadingCourses(false); })
      .catch(() => setLoadingCourses(false));
  }, []);

  const utmString = searchParams.toString();

  const buildUrl = (base: string, extra?: Record<string, string>) => {
    const p = new URLSearchParams(utmString);
    if (extra) Object.entries(extra).forEach(([k, v]) => p.set(k, v));
    const qs = p.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const toggleCourse = useCallback((id: string) => {
    setSelectedCourses((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  }, []);

  const canContinue = ageGroup !== null && selectedCourses.length > 0;

  const handleContinue = () => {
    if (!canContinue || isContinuing) return;
    setIsContinuing(true);
    const titles = courses.filter((c) => selectedCourses.includes(c.id)).map((c) => c.title);
    router.push(buildUrl("/onboarding/register", { age_group: ageGroup!, topics: titles.join(",") }));
  };

  return (
    <div className="ob-page-bg flex min-h-screen flex-col" style={{ color: "#0f172a" }}>
      <div aria-hidden="true" className="ob-orbs">
        <div className="ob-orb ob-orb-1" /><div className="ob-orb ob-orb-2" /><div className="ob-orb ob-orb-3" /><div className="ob-orb ob-orb-5" />
      </div>

      {/* Header */}
      <header className="relative z-[1] flex items-center justify-between px-4 pt-4 pb-1">
        <Link href={buildUrl("/onboarding")} className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium active:scale-95" style={{ color: "#64748b" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 13.5L6.5 9 11 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Back
        </Link>
        <span className="ob-gradient-text text-sm font-bold tracking-tight">AI Academy</span>
        <div className="w-16" />
      </header>

      {/* Progress */}
      <div className="relative z-[1] mb-8">
        <Stepper current={1} />
        <div className="h-5" />
      </div>

      {/* Content */}
      <main className="relative z-[1] flex-1 space-y-10 px-5 pb-36">

        {/* Q1 — Age group */}
        <section className="fade-up fade-up-d1">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: "#94a3b8" }}>Step 1 of 2</p>
          <h1 className="mb-5 text-2xl font-extrabold tracking-tight">Who is learning?</h1>

          <div className="grid grid-cols-2 gap-3">
            {(["child", "adult"] as const).map((group) => {
              const sel = ageGroup === group;
              return (
                <button
                  key={group}
                  onClick={() => setAgeGroup(group)}
                  aria-pressed={sel}
                  className="relative flex flex-col items-center justify-center gap-3 rounded-2xl p-5 transition-all duration-300 select-none active:scale-[0.97]"
                  style={{
                    minHeight: 140,
                    background: sel ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.7)",
                    backdropFilter: "blur(16px)",
                    border: sel ? "2px solid #0992C2" : "1px solid rgba(226,232,240,0.8)",
                    boxShadow: sel ? "0 8px 28px rgba(9,146,194,0.15)" : "0 2px 12px rgba(0,0,0,0.04)",
                    transform: sel ? "translateY(-2px)" : "none",
                  }}
                >
                  {/* Check */}
                  <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full transition-all" style={{ background: sel ? "linear-gradient(135deg,#0992C2,#0AC4E0)" : "#e2e8f0", opacity: sel ? 1 : 0.4, transform: sel ? "scale(1)" : "scale(0.7)" }}>
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  {/* Icon */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl transition-colors" style={{ background: sel ? "#e6f5fa" : "#f1f5f9", color: sel ? "#0992C2" : "#94a3b8" }}>
                    {group === "child" ? (
                      <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="9" r="5" stroke="currentColor" strokeWidth="2" /><path d="M6 26c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" strokeWidth="2" /><path d="M12 20l1.5 3 2.5-4 2.5 4 1.5-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    ) : (
                      <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="9" r="5" stroke="currentColor" strokeWidth="2" /><path d="M6 26c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" strokeWidth="2" /><path d="M13 18.5h6M16 18.5v5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>
                    )}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: sel ? "#0f172a" : "#64748b" }}>
                    {group === "child" ? "For a Child" : "For an Adult"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Q2 — Courses */}
        <section className="fade-up fade-up-d2 transition-all duration-500" style={{ opacity: ageGroup ? 1 : 0.3, pointerEvents: ageGroup ? "auto" : "none" }}>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: "#94a3b8" }}>Step 2 of 2</p>
          <h2 className="mb-1.5 text-2xl font-extrabold tracking-tight">What interests you?</h2>
          <p className="mb-5 text-sm" style={{ color: "#64748b" }}>Pick the courses you&apos;d like to explore.</p>

          {loadingCourses ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[88px] animate-pulse rounded-2xl bg-white/50" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl bg-white/60 p-6 text-center text-sm" style={{ color: "#94a3b8" }}>
              No courses available yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {courses.map((course) => {
                const sel = selectedCourses.includes(course.id);
                return (
                  <button
                    key={course.id}
                    onClick={() => toggleCourse(course.id)}
                    aria-pressed={sel}
                    className="relative flex flex-col items-center gap-2 rounded-2xl px-3 py-4 transition-all duration-200 select-none active:scale-[0.97]"
                    style={{
                      background: sel ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.65)",
                      backdropFilter: "blur(12px)",
                      border: sel ? "2px solid #0992C2" : "1px solid rgba(226,232,240,0.7)",
                      boxShadow: sel ? "0 4px 20px rgba(9,146,194,0.12)" : "0 1px 6px rgba(0,0,0,0.03)",
                      transform: sel ? "translateY(-1px)" : "none",
                    }}
                  >
                    <div className="absolute top-2 right-2 flex h-[18px] w-[18px] items-center justify-center rounded-full transition-all" style={{ background: sel ? "linear-gradient(135deg,#0992C2,#0AC4E0)" : "transparent", border: sel ? "none" : "1.5px solid #cbd5e1", opacity: sel ? 1 : 0.5 }}>
                      {sel && <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={sel ? "#0992C2" : "#94a3b8"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                    <span className="text-center text-xs font-semibold leading-tight" style={{ color: sel ? "#0f172a" : "#64748b" }}>
                      {course.title}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <p className="mt-3 text-center text-xs font-medium transition-all" style={{ color: selectedCourses.length > 0 ? "#0992C2" : "transparent" }}>
            {selectedCourses.length} course{selectedCourses.length !== 1 ? "s" : ""} selected
          </p>
        </section>
      </main>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-10 px-5 pb-6 pt-4" style={{ background: "linear-gradient(to top, #f4f6fc 60%, transparent)", backdropFilter: "blur(12px)" }}>
        {!canContinue && (
          <p className="mb-2.5 text-center text-xs" style={{ color: "#94a3b8" }}>
            {!ageGroup ? "Select who is learning to continue" : "Select at least one course"}
          </p>
        )}
        <button
          onClick={handleContinue}
          disabled={!canContinue || isContinuing}
          className="relative flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold transition-all duration-300 select-none"
          style={{
            background: canContinue ? "linear-gradient(135deg, #f97316, #ea580c)" : "#e2e8f0",
            color: canContinue ? "#fff" : "#94a3b8",
            boxShadow: canContinue ? "0 6px 28px rgba(249,115,22,0.35)" : "none",
            cursor: canContinue ? "pointer" : "not-allowed",
          }}
        >
          {isContinuing ? (
            <><span className="inline-block h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/30 border-t-white" />Setting up...</>
          ) : (
            <>Continue<svg width="16" height="16" viewBox="0 0 18 18" fill="none" className={canContinue ? "" : "opacity-0"}><path d="M7 4.5L11.5 9 7 13.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg></>
          )}
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Page Export                                                */
/* ────────────────────────────────────────────────────────── */

export default function QuestionsPage() {
  return (
    <Suspense fallback={
      <div className="ob-page-bg flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-teal" />
      </div>
    }>
      <QuestionsContent />
    </Suspense>
  );
}
