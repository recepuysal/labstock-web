import { UstBar } from '@/components/ust-bar';
import { createClient } from '@/lib/supabase/server';
import { basHarfleri } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EnvanterLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let etiket = user?.email ?? '';
  let resimUrl: string | null = null;
  let saltOkunur = false;
  if (user) {
    const { data: profil } = await supabase
      .from('profiles')
      .select('ad, resim_url, gozlemci_of')
      .eq('id', user.id)
      .maybeSingle();
    if (profil?.ad) etiket = profil.ad;
    resimUrl = profil?.resim_url ?? null;
    saltOkunur = Boolean(profil?.gozlemci_of);

    // Gözlemcisi olan biri buradaysa, kendisini izleyen kişi Ayarlar'da
    // "son görülme" bilgisini görebilsin diye dokunuyoruz.
    await supabase.from('profiles').update({ son_gorulme: new Date().toISOString() }).eq('id', user.id);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <UstBar bas={etiket ? basHarfleri(etiket) : undefined} resimUrl={resimUrl} saltOkunur={saltOkunur} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>{children}</div>
    </div>
  );
}
