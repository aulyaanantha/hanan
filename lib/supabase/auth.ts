import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseAuthConfig } from './auth-config';
export async function createSupabaseAuthClient() {
  const store = await cookies();
  const { url, key } = getSupabaseAuthConfig();
  return createServerClient(url, key, {
    auth: { experimental: { passkey: true } },
    cookieOptions: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' },
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try { values.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* Server Components cannot write cookies; proxy refreshes them. */ }
      },
    },
  });
}
