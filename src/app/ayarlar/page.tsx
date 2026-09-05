import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfilFormu } from '@/components/profil-formu';

export const dynamic = 'force-dynamic';

export default async function AyarlarSayfasi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/giris');

  const { data: profil } = await supabase
    .from('profiles')
    .select('ad, telefon, sirket_adi, sirket_adresi')
    .eq('id', user.id)
    .maybeSingle();

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
          Ayarlar
        </h1>
        <p style={{ margin: '0 0 20px', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>
          Kişisel ve şirket bilgilerin — ileride etiket/rapor gibi çıktılarda kullanılacak.
        </p>
        <ProfilFormu
          baslangic={{
            eposta: user.email ?? '',
            ad: profil?.ad ?? null,
            telefon: profil?.telefon ?? null,
            sirket_adi: profil?.sirket_adi ?? null,
            sirket_adresi: profil?.sirket_adresi ?? null,
          }}
        />
      </div>
    </main>
  );
}
