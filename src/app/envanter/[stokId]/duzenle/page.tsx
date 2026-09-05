import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ParcaFormu, type ParcaBaslangic } from '@/components/parca-formu';
import { agacKur, konumSecenekleri, type EnvanterSatiri, type Konum } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ParcaDuzenleSayfasi({
  params,
  searchParams,
}: {
  params: Promise<{ stokId: string }>;
  searchParams: Promise<{ donus?: string }>;
}) {
  const { stokId } = await params;
  const { donus } = await searchParams;
  const supabase = await createClient();

  const { data: satir } = await supabase
    .from('envanter')
    .select('*')
    .eq('stok_id', stokId)
    .maybeSingle();

  if (!satir) notFound();

  const s = satir as EnvanterSatiri;

  const { data: konumVerisi } = await supabase
    .from('locations')
    .select('id, parent_id, ad, kod, tip, aciklama, sira')
    .order('sira', { ascending: true });

  const konumlar = konumSecenekleri(agacKur((konumVerisi ?? []) as Konum[]));

  const baslangic: ParcaBaslangic = {
    stok_id: s.stok_id,
    part_id: s.part_id,
    mpn: s.mpn,
    uretici: s.uretici,
    aciklama: s.aciklama,
    kategori: s.kategori,
    kilif: s.kilif,
    rohs: s.rohs,
    konum_id: s.konum_id,
    min_adet: s.min_adet,
    adet: s.adet,
    tedarikci: s.tedarikci,
    tedarikci_kodu: s.tedarikci_kodu,
    alis_fiyati: s.alis_fiyati,
    para_birimi: s.para_birimi,
    datasheet_url: s.datasheet_url,
    parametreler: s.parametreler,
  };

  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600, letterSpacing: '-0.5px' }}>
          Parçayı düzenle
        </h1>
        <p style={{ margin: '0 0 20px', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>
          {s.mpn} — katalog ve stok bilgilerini güncelle.
        </p>
        <ParcaFormu konumlar={konumlar} mod="duzenle" baslangic={baslangic} donus={donus} />
      </div>
    </main>
  );
}
