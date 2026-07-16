import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Middleware refreshes Supabase auth cookies on every request so that
// access tokens don't expire mid-session. We only call `getUser()` —
// `getSession()` reads the cookie blindly and isn't safe in middleware.

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Anonymous visitor (no Supabase auth cookie) → no token to refresh, so skip
  // the network round-trip to the auth server. This is the per-navigation cost
  // that made every page (login, register, browsing) slow while logged out.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'));
  if (!hasAuthCookie) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: this call refreshes the auth token. Without it the
  // server components downstream see a stale or expired token.
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  // ---- account-sharing guard (see migrations/2026-07-09-user-ip-limit.sql) --
  // Warn from the 5th distinct IP in 30 days; block NEW IPs past 7.
  // The `ip_seen` cookie throttles the RPC to once per user+IP per hour.
  if (user) {
    const ip = (
      request.headers.get('x-forwarded-for')?.split(',')[0] ??
      request.headers.get('x-real-ip') ??
      ''
    ).trim();
    const { pathname } = request.nextUrl;

    if (ip && pathname !== '/ip-limit') {
      const seenKey = `${user.id.slice(0, 8)}:${ip}`;
      if (request.cookies.get('ip_seen')?.value !== seenKey) {
        const { data: rpcData } = await supabase.rpc('register_user_ip', { p_ip: ip });
        const row = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as
          | { status: string; ip_count: number }
          | undefined;

        if (row?.status === 'blocked') {
          if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'ip_limit_exceeded' }, { status: 403 });
          }
          return NextResponse.redirect(new URL('/ip-limit', request.url));
        }

        response.cookies.set('ip_seen', seenKey, {
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 3600,
          path: '/',
        });
        if (row?.status === 'warn') {
          // Readable by the client banner (not httpOnly on purpose).
          response.cookies.set('ip_warn', String(row.ip_count), {
            sameSite: 'lax',
            maxAge: 3600,
            path: '/',
          });
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on every request except static assets and Next internals.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
