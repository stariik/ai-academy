// ============================================================
// /admin layout — server-side gate + shared shell.
//
// Every admin page (and nothing else) lives under this layout, so the
// ADMIN_EMAILS allowlist check runs on the server for every admin view.
// Non-admins are redirected home without rendering anything.
// ============================================================

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/admin-auth';
import AdminShell from './_components/AdminShell';

export const metadata: Metadata = {
  title: 'Admin — Walle Academy',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();
  if (!admin) redirect('/');

  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
