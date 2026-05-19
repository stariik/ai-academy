// ============================================================
// /admin/promo-codes — list + create + bulk generate
// Server entry: gates admin, hands off to the client island.
// ============================================================

import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/admin-auth';
import PromoCodesClient from './_components/PromoCodesClient';

export const dynamic = 'force-dynamic';

export default async function AdminPromoCodesPage() {
  const admin = await getAdminUser();
  if (!admin) redirect('/admin');
  return <PromoCodesClient />;
}
