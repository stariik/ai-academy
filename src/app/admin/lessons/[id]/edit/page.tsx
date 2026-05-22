// ============================================================
// /admin/lessons/[id]/edit — full lesson editor
// Server entry: gates admin, fetches the lesson, hands off to the client.
// ============================================================

import { notFound, redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase/server';
import { getLesson } from '@/lib/supabase/db';
import LessonEditClient from './_components/LessonEditClient';

export const dynamic = 'force-dynamic';

export default async function LessonEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getAdminUser();
  if (!admin) redirect('/admin');

  const { id } = await params;
  const supabase = await createClient();
  const lesson = await getLesson(supabase, id);
  if (!lesson) notFound();

  return <LessonEditClient initialLesson={lesson} />;
}
