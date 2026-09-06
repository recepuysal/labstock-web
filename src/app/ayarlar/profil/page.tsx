import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfilFormu } from '@/components/profil-formu';
import { ProfilResmiFormu } from '@/components/profil-resmi-formu';
import { cikisYap } from '@/app/auth-actions';
import { basHarfleri } from '@/lib/types';
import { GozlemcilikKarti } from '@/components/gozlemcilik-karti';

export const dynamic = 'force-dynamic';

export default async function ProfilSayfasi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/giris');

  const { data: profil } = await supabase
    .from('profiles')
    .select('ad, telefon, sirket_adi, sirket_adresi, resim_url, gozlemci_of')
    .eq('id', user.id)
    .maybeSingle();

  let hedefAdi: string | null = null;
  if (profil?.gozlemci_of) {
    const { data } = await supabase.rpc('gozlemci_hedef_adi');
    hedefAdi = (data as string | null) ?? 'bağlı hesap';
  }

  const etiket = profil?.ad || user.email || '';

  return (
    <main style={{ minHeight: '100vh', overflowY: 'auto', padding: '24px 20px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <Link
          href="/envanter"
          className="mn"
          style={{ fontSize: 12, color: 'var(--muted)', display: 'inline-block', marginBottom: 14 }}
        >
          ← Envantere dön
        </Link>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600, letterSpacing: '-0.5px' }}>
          Profil
        </h1>
        <p style={{ margin: '0 0 20px', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>
          Kişisel ve şirket bilgilerin — ileride etiket/rapor gibi çıktılarda kullanılacak.
        </p>

        <div className="kart" style={{ padding: 20, marginBottom: 16 }}>
          <ProfilResmiFormu mevcutResim={profil?.resim_url ?? null} bas={basHarfleri(etiket || '··')} />
        </div>

        <ProfilFormu
          baslangic={{
            eposta: user.email ?? '',
            ad: profil?.ad ?? null,
            telefon: profil?.telefon ?? null,
            sirket_adi: profil?.sirket_adi ?? null,
            sirket_adresi: profil?.sirket_adresi ?? null,
          }}
        />

        <GozlemcilikKarti hedefAdi={hedefAdi} />

        <form action={cikisYap} style={{ marginTop: 16 }}>
          <button type="submit" className="btn" style={{ width: '100%' }}>
            Çıkış yap
          </button>
        </form>
      </div>
    </main>
  );
}
