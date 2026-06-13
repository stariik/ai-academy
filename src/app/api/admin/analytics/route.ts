// ============================================================
// GET /api/admin/analytics — admin dashboard (Task 14)
// ============================================================

import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase/server';
import {
  getLessonPassRates,
  getPageDropOff,
  getCourseCompletionStats,
} from '@/lib/supabase/db';

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  try {
    const supabase = await createClient();
    const [passRates, dropOff, courseStats] = await Promise.all([
      getLessonPassRates(supabase, 50),
      getPageDropOff(supabase, 20),
      getCourseCompletionStats(supabase),
    ]);
    return NextResponse.json({ passRates, dropOff, courseStats });
  } catch (err) {
    console.error('Admin analytics error:', err);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
