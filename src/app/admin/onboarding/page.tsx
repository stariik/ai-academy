import { listOnboardingInsights } from '@/lib/admin/queries';
import OnboardingInsightsClient from './_components/OnboardingInsightsClient';

export const dynamic = 'force-dynamic';

export default async function AdminOnboardingPage() {
  const data = await listOnboardingInsights();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">
          Voice of the customer
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">User insights</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-gray-500">
          What new learners say they want, what may stop them, and how they prefer to learn.
          Segments below describe stated goals only — they are not hidden personality or sensitive
          trait inferences.
        </p>
      </div>

      {!data.available ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Onboarding research storage is not active yet. Run{' '}
          <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">
            migrations/2026-07-28-onboarding-interviews.sql
          </code>{' '}
          in the Supabase SQL editor.
        </div>
      ) : (
        <OnboardingInsightsClient data={data} generatedAt={new Date().toISOString()} />
      )}
    </div>
  );
}
