'use server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createSupabaseAuthClient } from '@/lib/supabase/auth';
export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) redirect('/login?error=empty');
  const supabase = await createSupabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) redirect('/login?error=invalid');
  const { data: member, error: memberError } = await supabase.from('hanan_members')
    .select('display_name').eq('user_id', data.user.id).maybeSingle();
  if (memberError || !member || !['Farhan', 'Anantha'].includes(member.display_name)) {
    await supabase.auth.signOut({ scope: 'local' });
    redirect('/login?error=access');
  }
  (await cookies()).delete('hanan_session');
  revalidatePath('/', 'layout');
  redirect('/');
}
export async function logoutAction() {
  const supabase = await createSupabaseAuthClient();
  await supabase.auth.signOut({ scope: 'local' });
  (await cookies()).delete('hanan_session');
  revalidatePath('/', 'layout');
  redirect('/login');
}
