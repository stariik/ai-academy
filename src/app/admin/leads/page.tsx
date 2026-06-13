// ============================================================
// /admin/leads — onboarding-funnel leads captured from Meta ads.
// (See the `leads` table + /api/leads.)
// ============================================================

import { listLeads } from '@/lib/admin/queries';
import LeadsTable from './_components/LeadsTable';

export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  const leads = await listLeads();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <p className="mt-1 text-sm text-gray-500">
          {leads.length} {leads.length === 1 ? 'lead' : 'leads'} captured from the onboarding funnel.
          Filter, then export to CSV for outreach.
        </p>
      </div>
      <LeadsTable leads={leads} />
    </div>
  );
}
