// ============================================================
// /admin/courses — every course with lesson/enrollment/price stats.
// Server component; the client table handles filter + delete.
// ============================================================

import Link from 'next/link';
import { listCoursesWithStats } from '@/lib/admin/queries';
import CoursesTable from './_components/CoursesTable';

export const dynamic = 'force-dynamic';

export default async function AdminCoursesPage() {
  const courses = await listCoursesWithStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="mt-1 text-sm text-gray-500">
            {courses.length} {courses.length === 1 ? 'course' : 'courses'} — lessons, enrollments,
            and pricing. Click one to manage lessons, prices, and translations.
          </p>
        </div>
        <Link
          href="/admin/generator"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
        >
          + Generate course
        </Link>
      </div>

      <CoursesTable courses={courses} />
    </div>
  );
}
