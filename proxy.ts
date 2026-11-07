import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAuthConfig } from '@/lib/supabase/auth-config';
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // Route handlers verify their own session and can refresh cookies themselves.
  // Avoid a second Auth round trip before every API save/read.
  if (path.startsWith('/api/')) {
    const apiResponse = NextResponse.next();
    apiResponse.headers.set('Cache-Control', 'private, no-store');
    return apiResponse;
  }
  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseAuthConfig();
  const supabase = createServerClient(url, key, {
    cookieOptions: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values, headers) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        if (headers) Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });
  await supabase.auth.getUser();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|images/|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
