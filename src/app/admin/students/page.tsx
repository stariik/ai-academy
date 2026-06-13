// ============================================================
// /admin/students — every student session with profile + activity
// stats. Search/sort happens client-side in StudentsTable.
// ============================================================

import { listStudents } from '@/lib/admin/queries';
import StudentsTable from './_components/StudentsTable';

export const dynamic = 'force-dynamic';

export default async function AdminStudentsPage() {
  const students = await listStudents();

  return (
    <div className="space-y-6">
      {(() => {
        const active = students.filter((s) => s.hasActivity).length;
        const registered = students.filter((s) => s.email).length;
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            <p className="mt-1 text-sm text-gray-500">
              {active} engaged · {registered} registered · {students.length} sessions total. A guest
              session is minted on any lesson-page visit, so most rows never engaged — the list
              defaults to <span className="font-medium">Active</span>.
            </p>
          </div>
        );
      })()}

      <StudentsTable students={students} />
    </div>
  );
}
