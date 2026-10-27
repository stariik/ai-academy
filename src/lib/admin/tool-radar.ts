// ============================================================
// Tool radar — new AI tools found by web search, triaged at /admin/radar.
// Run daily by /api/cron/tool-radar or on demand from the admin page.
// ============================================================

import 'server-only';
import { adminDb } from '@/lib/admin/queries';
import { scanNewTools } from '@/lib/ai/research';

export type RadarRow = {
  id: string;
  name: string;
  field: string;
  summary: string;
  url: string;
  why: string;
  status: 'new' | 'dismissed' | 'course_created';
  found_at: string;
  coveredBy: number;
};

/** Scan the web and insert tools we haven't seen. Returns how many were added. */
export async function runToolRadar(): Promise<number> {
  const db = adminDb();
  const { data: existing, error } = await db.from('tool_radar').select('name');
  if (error) throw new Error(`tool_radar read failed: ${error.message}`);
  const known = (existing ?? []).map((r) => r.name as string);
  const seen = new Set(known.map((n) => n.toLowerCase()));

  const fresh = (await scanNewTools(known)).filter((i) => {
    const key = i.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (fresh.length === 0) return 0;

  const { error: insertError } = await db
    .from('tool_radar')
    .upsert(fresh, { onConflict: 'name', ignoreDuplicates: true });
  if (insertError) throw new Error(`tool_radar insert failed: ${insertError.message}`);
  return fresh.length;
}

/** Radar items in one status, each with how many courses already teach it. */
export async function getRadar(status: RadarRow['status']): Promise<RadarRow[]> {
  const db = adminDb();
  const [itemsRes, coursesRes] = await Promise.all([
    db.from('tool_radar').select('*').eq('status', status).order('found_at', { ascending: false }).limit(200),
    db.from('courses').select('tools'),
  ]);
  if (itemsRes.error) throw new Error(itemsRes.error.message);
  // ponytail: substring match over all courses in JS; fine for hundreds of courses.
  const taught = (coursesRes.data ?? []).flatMap((c) => (c.tools as string[] | null) ?? []).map((t) => t.toLowerCase());
  return (itemsRes.data ?? []).map((r) => {
    const name = (r.name as string).toLowerCase();
    return { ...r, coveredBy: taught.filter((t) => t.includes(name) || name.includes(t)).length } as RadarRow;
  });
}

export async function setRadarStatus(id: string, status: RadarRow['status']): Promise<void> {
  const { error } = await adminDb().from('tool_radar').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}
