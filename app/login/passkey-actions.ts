'use server';

import { revalidatePath } from 'next/cache';
import type { VerifyPasskeyAuthenticationParams, VerifyPasskeyRegistrationParams } from '@supabase/supabase-js';
import { createSupabaseAuthClient } from '@/lib/supabase/auth';
import { getAuthenticatedMember } from '@/lib/session/server';

const unavailable = 'Passkey belum tersedia. Gunakan email/password atau coba lagi nanti.';

export async function startPasskeyLogin() {
  const client = await createSupabaseAuthClient();
  const { data, error } = await client.auth.passkey.startAuthentication();
  if (error || !data) return { error: unavailable };
  return { data };
}

export async function finishPasskeyLogin(params: VerifyPasskeyAuthenticationParams) {
  const client = await createSupabaseAuthClient();
  const { data, error } = await client.auth.passkey.verifyAuthentication(params);
  if (error || !data?.user || !data.session) return { error: 'Verifikasi passkey gagal. Coba lagi atau gunakan email/password.' };
  // A valid Supabase credential alone must never grant HANAN membership.
  const { data: member, error: memberError } = await client.from('hanan_members')
    .select('display_name').eq('user_id', data.user.id).maybeSingle();
  if (memberError || !member || !['Farhan', 'Anantha'].includes(member.display_name)) {
    await client.auth.signOut({ scope: 'local' });
    return { error: 'Akun ini belum terdaftar sebagai anggota HANAN.' };
  }
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function startPasskeyRegistration() {
  if (!(await getAuthenticatedMember())) return { error: 'Silakan login kembali.' };
  const client = await createSupabaseAuthClient();
  const { data, error } = await client.auth.passkey.startRegistration();
  if (error || !data) return { error: unavailable };
  return { data };
}

export async function finishPasskeyRegistration(params: VerifyPasskeyRegistrationParams) {
  if (!(await getAuthenticatedMember())) return { error: 'Silakan login kembali.' };
  const client = await createSupabaseAuthClient();
  const { error } = await client.auth.passkey.verifyRegistration(params);
  return error ? { error: 'Passkey gagal disimpan. Periksa pengaturan passkey atau coba lagi.' } : { success: true };
}

export async function listPasskeys() {
  if (!(await getAuthenticatedMember())) return { error: 'Silakan login kembali.' };
  const client = await createSupabaseAuthClient();
  const { data, error } = await client.auth.passkey.list();
  return error ? { error: unavailable } : { data: data ?? [] };
}

export async function deletePasskey(passkeyId: string) {
  if (!(await getAuthenticatedMember())) return { error: 'Silakan login kembali.' };
  if (typeof passkeyId !== 'string' || !/^[0-9a-f-]{36}$/i.test(passkeyId)) return { error: 'Passkey tidak valid.' };
  const client = await createSupabaseAuthClient();
  // User-scoped API: Supabase checks ownership; never use the service role here.
  const { error } = await client.auth.passkey.delete({ passkeyId });
  return error ? { error: 'Passkey gagal dihapus. Coba lagi.' } : { success: true };
}
