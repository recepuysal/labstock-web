import { createClient } from './supabase/server';

/** Bu oturumdaki kullanıcı bir gözlemci mi (başka birinin envanterini salt-okunur izliyor mu). */
export async function saltOkunurMu(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase.from('profiles').select('gozlemci_of').eq('id', user.id).maybeSingle();
  return Boolean(data?.gozlemci_of);
}
