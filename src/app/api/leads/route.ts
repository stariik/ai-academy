import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const leadSchema = z.object({
  email: z.string().email().nullable().optional(),
  phone: z.string().min(7).nullable().optional(),
  age_group: z.enum(['child', 'adult']),
  topics: z.array(z.string()).min(1),
  utm_source: z.string().nullable().optional(),
  utm_medium: z.string().nullable().optional(),
  utm_campaign: z.string().nullable().optional(),
  utm_content: z.string().nullable().optional(),
  utm_term: z.string().nullable().optional(),
}).refine(data => data.email || data.phone, {
  message: 'Either email or phone is required',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = leadSchema.parse(body);

    const supabase = await createClient();
    const { error } = await supabase.from('leads').insert({
      email: parsed.email ?? null,
      phone: parsed.phone ?? null,
      age_group: parsed.age_group,
      topics: parsed.topics,
      utm_source: parsed.utm_source ?? null,
      utm_medium: parsed.utm_medium ?? null,
      utm_campaign: parsed.utm_campaign ?? null,
      utm_content: parsed.utm_content ?? null,
      utm_term: parsed.utm_term ?? null,
    });

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error('Lead creation error:', err);
    return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 });
  }
}
