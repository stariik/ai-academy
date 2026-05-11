'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORIES as INTERESTS } from '@/lib/constants/categories';

type Method = 'email' | 'phone';

const AGE_GROUPS = [
  { value: '13-17', label: '13–17 წელი' },
  { value: '18-24', label: '18–24 წელი' },
  { value: '25-34', label: '25–34 წელი' },
  { value: '35-44', label: '35–44 წელი' },
  { value: '45+', label: '45+ წელი' },
];

const GENDERS = [
  { value: 'female', label: 'ქალი' },
  { value: 'male', label: 'კაცი' },
  { value: 'other', label: 'სხვა' },
  { value: 'prefer_not_say', label: 'არ მინდა ვთქვა' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [method, setMethod] = useState<Method>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Step 2
  const [ageGroup, setAgeGroup] = useState('');
  const [gender, setGender] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateStep1 = (): string | null => {
    const v = identifier.trim();
    if (!v) return method === 'email' ? 'შეიყვანე ელფოსტა.' : 'შეიყვანე ტელეფონის ნომერი.';
    if (method === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'შეიყვანე სწორი ელფოსტა.';
    if (method === 'phone' && v.replace(/\D/g, '').length < 7) return 'შეიყვანე სწორი ნომერი.';
    if (!password) return 'შეიყვანე პაროლი.';
    if (password.length < 6) return 'პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო.';
    if (password !== confirmPw) return 'პაროლები არ ემთხვევა.';
    return null;
  };

  const validateStep2 = (): string | null => {
    if (!ageGroup) return 'აირჩიე ასაკი.';
    if (!gender) return 'აირჩიე სქესი.';
    if (interests.length === 0) return 'აირჩიე მინიმუმ ერთი ინტერესი.';
    return null;
  };

  const goNext = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep(2);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep2();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    setError(null);

    // TODO: wire to Supabase Auth + /api/leads. Frontend-only stub.
    await new Promise((r) => setTimeout(r, 500));
    signIn({
      id: crypto.randomUUID(),
      email: method === 'email' ? identifier.trim() : null,
      phone: method === 'phone' ? identifier.trim() : null,
      displayName: method === 'email' ? identifier.trim().split('@')[0] : identifier.trim(),
      ageGroup,
      gender,
      interests,
    });
    router.push('/');
  };

  const toggleInterest = (i: string) => {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-cream-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-2xl shadow-navy/10 border border-cyan-50 p-8 sm:p-10">
          {/* Header + stepper */}
          <div className="text-center mb-6">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-navy to-teal items-center justify-center text-cream font-black text-xl shadow-lg mb-4">
              AI
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
              {step === 1 ? 'შექმენი ანგარიში' : 'გვითხარი შენზე'}
            </h1>
            <p className="text-sm text-navy-100 mt-1.5">
              {step === 1
                ? 'დაიწყე სწავლა AI Academy-ში'
                : 'ამ ინფორმაციით გირჩევთ შენთვის შესაფერის კურსებს'}
            </p>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-7">
            <div className="flex-1 h-1.5 rounded-full bg-cyan-50 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal to-cyan transition-all"
                style={{ width: step === 1 ? '50%' : '100%' }}
              />
            </div>
            <span className="text-[11px] font-bold text-teal">{step}/2</span>
          </div>

          {step === 1 ? (
            <form onSubmit={goNext} noValidate className="space-y-4">
              {/* Method toggle */}
              <div className="flex gap-1 rounded-2xl bg-cyan-50 p-1">
                {(['email', 'phone'] as const).map((m) => {
                  const active = method === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMethod(m);
                        setIdentifier('');
                        setError(null);
                      }}
                      className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
                        active ? 'bg-white text-teal shadow-md' : 'text-navy-100 hover:text-navy'
                      }`}
                    >
                      {m === 'email' ? 'ელფოსტა' : 'ტელეფონი'}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">
                  {method === 'email' ? 'ელფოსტა' : 'ტელეფონი'}
                </label>
                <input
                  type={method === 'email' ? 'email' : 'tel'}
                  inputMode={method === 'email' ? 'email' : 'tel'}
                  autoComplete={method === 'email' ? 'email' : 'tel'}
                  placeholder={method === 'email' ? 'you@example.com' : '+995 555 000 000'}
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setError(null);
                  }}
                  className="w-full rounded-xl border border-cyan-50 bg-cream-50/50 text-navy placeholder:text-navy-100 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-cyan/20 focus:border-cyan focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">
                  პაროლი
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="მინიმუმ 6 სიმბოლო"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    className="w-full rounded-xl border border-cyan-50 bg-cream-50/50 text-navy placeholder:text-navy-100 px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-4 focus:ring-cyan/20 focus:border-cyan focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-teal hover:text-navy transition"
                    aria-label={showPw ? 'დაფარე პაროლი' : 'აჩვენე პაროლი'}
                  >
                    {showPw ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">
                  გაიმეორე პაროლი
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPw}
                  onChange={(e) => {
                    setConfirmPw(e.target.value);
                    setError(null);
                  }}
                  className="w-full rounded-xl border border-cyan-50 bg-cream-50/50 text-navy placeholder:text-navy-100 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-cyan/20 focus:border-cyan focus:bg-white transition"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs font-medium text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-teal to-cyan text-white font-bold py-3.5 text-sm shadow-lg shadow-teal/20 hover:shadow-xl hover:shadow-teal/30 hover:-translate-y-0.5 transition"
              >
                გაგრძელება
              </button>

              <div className="text-center text-sm text-navy-100">
                უკვე გაქვს ანგარიში?{' '}
                <Link href="/login" className="font-bold text-teal hover:text-navy transition">
                  შედი
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-5">
              {/* Age */}
              <div>
                <label className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">
                  ასაკი
                </label>
                <select
                  value={ageGroup}
                  onChange={(e) => {
                    setAgeGroup(e.target.value);
                    setError(null);
                  }}
                  className="w-full rounded-xl border border-cyan-50 bg-cream-50/50 text-navy px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-cyan/20 focus:border-cyan focus:bg-white transition appearance-none bg-no-repeat bg-right pr-10"
                  style={{
                    backgroundImage:
                      'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' fill=\'none\' stroke=\'%230992C2\' stroke-width=\'2\' viewBox=\'0 0 24 24\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")',
                    backgroundPosition: 'right 1rem center',
                  }}
                >
                  <option value="">აირჩიე</option>
                  {AGE_GROUPS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">
                  სქესი
                </label>
                <select
                  value={gender}
                  onChange={(e) => {
                    setGender(e.target.value);
                    setError(null);
                  }}
                  className="w-full rounded-xl border border-cyan-50 bg-cream-50/50 text-navy px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-cyan/20 focus:border-cyan focus:bg-white transition appearance-none bg-no-repeat pr-10"
                  style={{
                    backgroundImage:
                      'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' fill=\'none\' stroke=\'%230992C2\' stroke-width=\'2\' viewBox=\'0 0 24 24\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")',
                    backgroundPosition: 'right 1rem center',
                  }}
                >
                  <option value="">აირჩიე</option>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Interests */}
              <div>
                <label className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">
                  ინტერესები (აირჩიე რამდენიმე)
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((i) => {
                    const active = interests.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleInterest(i)}
                        className={`px-3.5 py-2 rounded-full text-xs font-bold border-2 transition ${
                          active
                            ? 'bg-teal text-white border-teal shadow-md'
                            : 'bg-white text-navy border-cyan-50 hover:border-cyan hover:text-teal'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs font-medium text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                  className="flex-1 rounded-xl border-2 border-cyan-50 text-navy font-bold py-3.5 text-sm hover:border-cyan hover:text-teal transition"
                >
                  უკან
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] rounded-xl bg-gradient-to-r from-teal to-cyan text-white font-bold py-3.5 text-sm shadow-lg shadow-teal/20 hover:shadow-xl hover:shadow-teal/30 hover:-translate-y-0.5 transition disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? 'იქმნება…' : 'ანგარიშის შექმნა'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
