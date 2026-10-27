// ============================================================
// /admin/radar — new AI tools found by the daily web scan.
// Create course → opens the generator's "From topic" flow prefilled.
// ============================================================

import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { isAdmin } from '@/lib/admin-auth';
import { getRadar, runToolRadar, setRadarStatus, type RadarRow } from '@/lib/admin/tool-radar';

export const dynamic = 'force-dynamic';
// "Scan now" runs the web search inside the server action.
export const maxDuration = 300;

const TABS: { status: RadarRow['status']; label: string }[] = [
  { status: 'new', label: 'New' },
  { status: 'course_created', label: 'Course created' },
  { status: 'dismissed', label: 'Dismissed' },
];

async function scanNow() {
  'use server';
  if (!(await isAdmin())) return;
  await runToolRadar();
  revalidatePath('/admin/radar');
}

async function dismiss(formData: FormData) {
  'use server';
  if (!(await isAdmin())) return;
  await setRadarStatus(String(formData.get('id')), 'dismissed');
  revalidatePath('/admin/radar');
}

export default async function AdminRadarPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const status = TABS.find((t) => t.status === statusParam)?.status ?? 'new';
  const items = await getRadar(status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tool radar</h1>
          <p className="mt-1 text-sm text-gray-500">
            AI tools launched or majorly updated this week. Scanned daily at 06:00 UTC.
          </p>
        </div>
        <form action={scanNow}>
          <button className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light">
            Scan now (1–3 min)
          </button>
        </form>
      </div>

      <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 w-fit">
        {TABS.map((t) => (
          <Link
            key={t.status}
            href={`/admin/radar?status=${t.status}`}
            className={`rounded-md px-3 py-1.5 text-sm ${
              t.status === status ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Nothing here yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-gray-900 hover:underline"
                    >
                      {item.name}
                    </a>
                    {item.field && (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{item.field}</span>
                    )}
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        item.coveredBy ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {item.coveredBy ? `Covered by ${item.coveredBy} course(s)` : 'No course yet'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{item.summary}</p>
                  <p className="text-xs text-gray-500">{item.why}</p>
                  <p className="text-xs text-gray-400">Found {new Date(item.found_at).toLocaleDateString('en-GB')}</p>
                </div>
                {status === 'new' && (
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/admin/generator?${new URLSearchParams({ tool: item.name, field: item.field, radar: item.id })}`}
                      className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-light"
                    >
                      Create course
                    </Link>
                    <form action={dismiss}>
                      <input type="hidden" name="id" value={item.id} />
                      <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                        Dismiss
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
