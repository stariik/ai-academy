// ============================================================
// /admin/promo-codes/[id] — detail + redemption log
// ============================================================

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getAdminUser } from '@/lib/admin-auth';
import { getPromoCode, listRedemptions, statusOf } from '@/lib/promo-codes';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function PromoCodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getAdminUser();
  if (!admin) redirect('/admin');

  const { id } = await params;
  const code = await getPromoCode(id);
  if (!code) notFound();

  const redemptions = await listRedemptions(id);
  const supabase = await createClient();

  // Resolve course title (admin already authed; reading via user client is fine).
  let courseTitle = 'Any course';
  if (code.courseId) {
    const { data } = await supabase.from('courses').select('title').eq('id', code.courseId).maybeSingle();
    courseTitle = data?.title ?? '(unknown)';
  }

  // Resolve redeemer emails — needs auth.admin which uses service role.
  // For now, surface user ids; deferring auth.admin until needed.

  const status = statusOf(code);
  const redemptionLabel =
    code.maxRedemptions == null
      ? `${code.redemptionCount} / ∞`
      : `${code.redemptionCount} / ${code.maxRedemptions}`;

  return (
    <div>
      <div className="max-w-3xl">
        <div className="mb-6">
          <Link
            href="/admin/promo-codes"
            className="text-xs font-semibold text-teal hover:text-navy"
          >
            ← All promo codes
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-medium">Code</p>
              <h1 className="font-mono text-2xl font-bold text-navy tracking-wider">
                {code.code}
              </h1>
              {code.notes && (
                <p className="text-sm text-gray-500 mt-2">{code.notes}</p>
              )}
            </div>
            <StatusPill status={status} />
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mt-6 text-sm">
            <DataRow label="Type" value={code.type === 'unlock' ? 'Unlock' : code.type === 'percent_off' ? `${code.percentOff}% off` : `₾${(code.amountOffCents ?? 0) / 100} off`} />
            <DataRow label="Course" value={courseTitle} />
            <DataRow label="Redemptions" value={redemptionLabel} />
            <DataRow label="Per-user limit" value={String(code.perUserLimit)} />
            <DataRow label="Expires" value={code.expiresAt ? new Date(code.expiresAt).toLocaleString() : 'No expiry'} />
            <DataRow label="Created" value={new Date(code.createdAt).toLocaleString()} />
          </dl>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Redemptions ({redemptions.length})
          </h2>
          {redemptions.length === 0 ? (
            <p className="text-sm text-gray-500">No redemptions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-2 py-2 font-medium">User</th>
                    <th className="px-2 py-2 font-medium">Course</th>
                    <th className="px-2 py-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {redemptions.map((r) => (
                    <tr key={r.id}>
                      <td className="px-2 py-2 font-mono text-xs text-gray-700">{r.userId.slice(0, 8)}…</td>
                      <td className="px-2 py-2 text-xs text-gray-500">{r.courseId?.slice(0, 8) ?? '—'}…</td>
                      <td className="px-2 py-2 text-xs text-gray-500">{new Date(r.redeemedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</dt>
      <dd className="text-sm text-gray-900 mt-0.5">{value}</dd>
    </div>
  );
}

function StatusPill({ status }: { status: 'active' | 'inactive' | 'expired' | 'exhausted' }) {
  const styles = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    expired: 'bg-amber-100 text-amber-700',
    exhausted: 'bg-blue-100 text-blue-700',
  }[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${styles}`}>
      {status}
    </span>
  );
}
