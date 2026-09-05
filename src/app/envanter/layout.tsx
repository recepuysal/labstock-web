import { UstBar } from '@/components/ust-bar';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function basHarfleri(kaynak: string) {
  const parcalar = kaynak.trim().split(/[\s.@_-]+/).filter(Boolean);
  const harfler = parcalar.slice(0, 2).map((p) => p[0]);
  return harfler.join('').toLocaleUpperCase('tr-TR') || '··';
}

export default async function EnvanterLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let etiket = user?.email ?? '';
  if (user) {
    const { data: profil } = await supabase
      .from('profiles')
      .select('ad')
      .eq('id', user.id)
      .maybeSingle();
    if (profil?.ad) etiket = profil.ad;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <UstBar bas={etiket ? basHarfleri(etiket) : undefined} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>{children}</div>
    </div>
  );
}
