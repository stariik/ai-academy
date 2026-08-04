'use client';

// ============================================================
// Admin shell — fixed sidebar (desktop) / slide-over (mobile).
// Pure layout: auth is enforced by the server layout above this.
// ============================================================

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Shapes,
  TicketPercent,
  CreditCard,
  Inbox,
  MessagesSquare,
  Cpu,
  BarChart3,
  UploadCloud,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/students', label: 'Students', icon: Users },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/lessons', label: 'Lessons', icon: FileText },
  { href: '/admin/categories', label: 'Categories', icon: Shapes },
  { href: '/admin/promo-codes', label: 'Promo codes', icon: TicketPercent },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/leads', label: 'Leads', icon: Inbox },
  { href: '/admin/onboarding', label: 'User insights', icon: MessagesSquare },
  { href: '/admin/ai-usage', label: 'AI usage', icon: Cpu },
  { href: '/admin/analytics', label: 'Learning analytics', icon: BarChart3 },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const generatorActive =
    pathname === '/admin/generator' || pathname.startsWith('/admin/generator/');

  return (
    <nav className="flex flex-1 flex-col gap-0.5 px-3">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}

      <div className="my-3 border-t border-white/10" />

      <Link
        href="/admin/generator"
        onClick={onNavigate}
        className={`flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${
          generatorActive ? 'bg-teal text-white' : 'bg-teal/20 text-teal-100 hover:bg-teal/30'
        }`}
      >
        <UploadCloud className="h-4 w-4 shrink-0" strokeWidth={2} />
        Course generator
      </Link>
    </nav>
  );
}

function SidebarContent({ email, onNavigate }: { email: string | null; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-teal text-base font-black text-white">
          W
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-white">Walle Academy</p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">
            Admin panel
          </p>
        </div>
      </div>

      <NavLinks onNavigate={onNavigate} />

      <div className="mt-auto space-y-2 px-3 pb-5 pt-4">
        <Link
          href="/"
          target="_blank"
          className="flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={2} />
          View site
        </Link>
        {email && (
          <p className="truncate px-3 text-[11px] text-white/35" title={email}>
            {email}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminShell({
  email,
  children,
}: {
  email: string | null;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 bg-navy lg:block">
        <SidebarContent email={email} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-navy px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-teal text-sm font-black text-white">
            W
          </div>
          <p className="text-sm font-bold text-white">Admin panel</p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile slide-over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-navy shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 inline-flex h-11 w-11 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent email={email} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Content */}
      <main className="px-4 py-6 sm:px-6 lg:ml-60 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
