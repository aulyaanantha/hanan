import 'server-only';
import { cache } from 'react';
import { createSupabaseAuthClient } from '@/lib/supabase/auth';
export const getAuthenticatedMember = cache(async () => {
  const supabase = await createSupabaseAuthClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: member, error: memberError } = await supabase.from('hanan_members')
    .select('user_id, display_name').eq('user_id', user.id).maybeSingle();
  if (memberError || !member || !['Farhan', 'Anantha'].includes(member.display_name)) return null;
  return { userId: user.id, displayName: member.display_name as 'Farhan' | 'Anantha' };
});
export async function isAuthenticated() { return (await getAuthenticatedMember()) !== null; }
