import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { KonumAgaci } from '@/components/konum-agaci';
import { ParcaTablosu } from '@/components/parca-tablosu';
import { ParcaIzgara } from '@/components/parca-izgara';
import { EnvanterFiltreleri } from '@/components/envanter-filtreleri';
import {
  agacKur,
  altAgacIdleri,
  konumToplamSayilari,
  konumTipOzeti,
  paraFormatla,
  saatFormatla,
  sayi,
  type EnvanterSatiri,
  type Konum,
} from '@/lib/types';

export const dynamic = 'force-dynamic';

const LIMIT = 200;

export default async function EnvanterSayfasi({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    konum?: string;
    kategori?: string;
    kilif?: string;
    durum?: string;
    sira?: string;
    gorunum?: string;
  }>;
}) {
  const { q, konum, kategori, kilif, durum, sira, gorunum } = await searchParams;
  const supabase = await createClient();

  const { data: konumVerisi } = await supabase
    .from('locations')
    .select('id, parent_id, ad, kod, tip, aciklama, sira')
    .order('sira', { ascending: true });

  const konumlar = (konumVerisi ?? []) as Konum[];
  const agac = agacKur(konumlar);

  let sorgu = supabase.from('envanter').select('*').limit(LIMIT);

  if (konum) {
    sorgu = sorgu.in('konum_id', altAgacIdleri(konum, konumlar));
  }
  if (q) {
    const desen = `%${q.replace(/[%,]/g, '')}%`;
    sorgu = sorgu.or(`mpn.ilike.${desen},aciklama.ilike.${desen},kategori.ilike.${desen}`);
  }
  if (kategori) sorgu = sorgu.eq('kategori', kategori);
  if (kilif) sorgu = sorgu.eq('kilif', kilif);
  if (durum) sorgu = sorgu.eq('durum', durum);

  switch (sira) {
    case 'eski':
      sorgu = sorgu.order('updated_at', { ascending: true });
      break;
    case 'ad':
      sorgu = sorgu.order('mpn', { ascending: true });
      break;
    case 'adet-azalan':
      sorgu = sorgu.order('adet', { ascending: false });
      break;
    case 'adet-artan':
      sorgu = sorgu.order('adet', { ascending: true });
      break;
    default:
      sorgu = sorgu.order('updated_at', { ascending: false });
  }

  const { data, error } = await sorgu;
  const satirlar = (data ?? []) as EnvanterSatiri[];

  const { data: katalogVerisi } = await supabase.from('parts').select('kategori, kilif');
  const kategoriler = Array.from(
    new Set((katalogVerisi ?? []).map((p) => p.kategori).filter((v): v is string => Boolean(v))),
  ).sort((a, b) => a.localeCompare(b, 'tr'));
  const kiliflar = Array.from(
    new Set((katalogVerisi ?? []).map((p) => p.kilif).filter((v): v is string => Boolean(v))),
  ).sort((a, b) => a.localeCompare(b, 'tr'));

  const { count: toplamCesit } = await supabase
    .from('stock_items')
    .select('id', { count: 'exact', head: true });

  const { data: stokOzetVerisi } = await supabase
    .from('stock_items')
    .select('location_id, adet, alis_fiyati, para_birimi');

  const dogrudanSayilar = new Map<string, number>();
  const depoDegeri = new Map<string, number>();
  for (const row of stokOzetVerisi ?? []) {
    if (row.location_id) {
      dogrudanSayilar.set(row.location_id, (dogrudanSayilar.get(row.location_id) ?? 0) + 1);
    }
    if (row.alis_fiyati != null) {
      const anahtar = row.para_birimi ?? 'TRY';
      depoDegeri.set(anahtar, (depoDegeri.get(anahtar) ?? 0) + Number(row.adet) * Number(row.alis_fiyati));
    }
  }
  const sayilar = Object.fromEntries(konumToplamSayilari(agac, dogrudanSayilar));
  const tipOzeti = konumTipOzeti(konumlar);

  const { data: sonHareket } = await supabase
    .from('stock_movements')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const seciliKonum = konum ? konumlar.find((k) => k.id === konum) : undefined;
  const toplamAdet = satirlar.reduce((t, s) => t + Number(s.adet), 0);
  const kritik = satirlar.filter((s) => s.durum === 'kritik' || s.durum === 'yok').length;
  const az = satirlar.filter((s) => s.durum === 'az').length;

  const bosDepo = konumlar.length === 0 && (toplamCesit ?? 0) === 0;

  return (
    <>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <KonumAgaci
          agac={agac}
          seciliId={konum}
          arama={q}
          toplam={toplamCesit ?? 0}
          sayilar={sayilar}
          tipOzeti={tipOzeti}
        />

        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px 0' }}>
          <div className="mn" style={{ fontSize: 10.5, color: 'var(--muted-2)' }}>
            Depo / {seciliKonum ? seciliKonum.ad : 'Tüm envanter'}
            {q && ` / "${q}"`}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 5 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.5px' }}>
              {seciliKonum ? seciliKonum.ad : 'Tüm envanter'}
            </h1>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {satirlar.length} kayıt · {sayi.format(toplamAdet)} adet
              {satirlar.length === LIMIT && ` (ilk ${LIMIT})`}
            </span>
          </div>

          <div style={{ marginTop: 12 }}>
            <Suspense fallback={<div style={{ height: 28 }} />}>
              <EnvanterFiltreleri kategoriler={kategoriler} kiliflar={kiliflar} />
            </Suspense>
          </div>
        </div>

        <div style={{ flex: 1, padding: '14px 20px 20px', overflowY: 'auto' }}>
          {error && <div className="hata">Liste yüklenemedi: {error.message}</div>}

          {!error && bosDepo && (
            <div className="kart" style={{ padding: 28, maxWidth: 560 }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>Depon henüz boş</h2>
              <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                Önce bir konum oluştur (oda, dolap, çekmece — ne istersen) ya da doğrudan ilk
                parçanı ekleyebilirsin.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href="/envanter/konum-ekle" className="btn btn-birincil">
                  Konum ekle
                </Link>
                <Link href="/envanter/yeni" className="btn">
                  Parça ekle
                </Link>
              </div>
            </div>
          )}

          {!error && !bosDepo && satirlar.length === 0 && (
            <div className="kart" style={{ padding: 24, maxWidth: 480 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
                {q || konum || kategori || kilif || durum
                  ? 'Bu filtreye uyan parça yok.'
                  : 'Bu depoda henüz parça yok — sağ üstten ekleyebilirsin.'}
              </p>
            </div>
          )}

          {!error && satirlar.length > 0 && gorunum === 'izgara' && <ParcaIzgara satirlar={satirlar} />}
          {!error && satirlar.length > 0 && gorunum !== 'izgara' && <ParcaTablosu satirlar={satirlar} />}
        </div>
        </main>
      </div>

      <footer
          style={{
            height: 34,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            padding: '0 20px',
            background: 'var(--surface)',
            borderTop: '1px solid var(--line)',
            fontSize: 11,
            color: 'var(--muted)',
          }}
        >
          <span className="mn">
            {toplamCesit ?? 0} çeşit · {sayi.format(toplamAdet)} adet
          </span>
          {kritik > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{ width: 5, height: 5, borderRadius: 99, background: 'var(--crit-dot)' }}
              />
              {kritik} kritik
            </span>
          )}
          {az > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{ width: 5, height: 5, borderRadius: 99, background: 'var(--warn-dot)' }}
              />
              {az} az kaldı
            </span>
          )}

          <div style={{ flex: 1 }} />

          <span>
            Toplam depo değeri{' '}
            {depoDegeri.size > 0
              ? Array.from(depoDegeri.entries())
                  .map(([birim, tutar]) => paraFormatla(tutar, birim))
                  .join(' · ')
              : '—'}
          </span>

          <Link href="/envanter/aktiviteler" style={{ color: 'inherit' }}>
            Son işlem {sonHareket?.created_at ? saatFormatla(sonHareket.created_at) : '—'}
          </Link>
      </footer>
    </>
  );
}
