'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

type Method = 'email' | 'phone';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [method, setMethod] = useState<Method>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    const v = identifier.trim();
    if (!v) return method === 'email' ? 'შეიყვანე ელფოსტა.' : 'შეიყვანე ტელეფონის ნომერი.';
    if (method === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'შეიყვანე სწორი ელფოსტა.';
    if (method === 'phone' && v.replace(/\D/g, '').length < 7) return 'შეიყვანე სწორი ნომერი.';
    if (!password) return 'შეიყვანე პაროლი.';
    if (password.length < 6) return 'პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო.';
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    setError(null);

    // TODO: wire to Supabase Auth. Frontend-only stub for now.
    await new Promise((r) => setTimeout(r, 400));
    signIn({
      id: crypto.randomUUID(),
      email: method === 'email' ? identifier.trim() : null,
      phone: method === 'phone' ? identifier.trim() : null,
      displayName: method === 'email' ? identifier.trim().split('@')[0] : identifier.trim(),
    });
    router.push('/');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-cream-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl shadow-navy/10 border border-cyan-50 p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-navy to-teal items-center justify-center text-cream font-black text-xl shadow-lg mb-4">
              AI
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
              კეთილი იყოს დაბრუნება
            </h1>
            <p className="text-sm text-navy-100 mt-1.5">
              შედი შენს ანგარიშში და განაგრძე სწავლა
            </p>
          </div>

          {/* Method toggle */}
          <div className="flex gap-1 rounded-2xl bg-cyan-50 p-1 mb-5">
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

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
                  autoComplete="current-password"
                  placeholder="••••••••"
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

            <div className="flex justify-end -mt-1">
              <Link href="/login" className="text-xs font-bold text-teal hover:text-navy transition">
                დაგავიწყდა პაროლი?
              </Link>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-teal to-cyan text-white font-bold py-3.5 text-sm shadow-lg shadow-teal/20 hover:shadow-xl hover:shadow-teal/30 hover:-translate-y-0.5 transition disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? 'დაცდა…' : 'შესვლა'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-navy-100">
            არ გაქვს ანგარიში?{' '}
            <Link href="/register" className="font-bold text-teal hover:text-navy transition">
              დარეგისტრირდი
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
