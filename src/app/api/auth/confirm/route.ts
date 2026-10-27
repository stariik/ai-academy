import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

// Landing point for Supabase email links (password recovery). Handles both the
// PKCE `?code=` link (default template) and the `?token_hash=&type=` link
// (works across devices if the email template is switched to it). Either way
// it establishes a session, then forwards to `next`.
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const rawNext = url.searchParams.get('next') ?? '/';
  // Only same-site relative paths — no open redirect.
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';

  const supabase = await createClient();
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) console.error('[auth.confirm] code exchange failed', error.message);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) console.error('[auth.confirm] verifyOtp failed', error.message);
  }

  // On failure the target page sees no session and shows "link expired".
  return NextResponse.redirect(new URL(next, url.origin));
}
