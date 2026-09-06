'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DURUM_ETIKET } from '@/lib/types';

const SIRALAMALAR = [
  { deger: 'yeni', etiket: 'En son güncellenen' },
  { deger: 'eski', etiket: 'En eski güncellenen' },
  { deger: 'ad', etiket: 'Ada göre (A-Z)' },
  { deger: 'adet-azalan', etiket: 'Adet (çoktan aza)' },
  { deger: 'adet-artan', etiket: 'Adet (azdan çoka)' },
] as const;

export function EnvanterFiltreleri({
  kategoriler,
  kiliflar,
  etiketler,
}: {
  kategoriler: string[];
  kiliflar: string[];
  etiketler: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const kategori = searchParams.get('kategori') ?? '';
  const kilif = searchParams.get('kilif') ?? '';
  const durum = searchParams.get('durum') ?? '';
  const etiket = searchParams.get('etiket') ?? '';
  const sira = searchParams.get('sira') ?? 'yeni';
  const gorunum = searchParams.get('gorunum') ?? 'liste';

  function guncelle(anahtar: string, deger: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (deger) p.set(anahtar, deger);
    else p.delete(anahtar);
    router.replace(`${pathname}?${p.toString()}`);
  }

  const filtreliyiz = Boolean(kategori || kilif || durum || etiket);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
      <select
        className="filtre"
        value={kategori}
        onChange={(e) => guncelle('kategori', e.target.value)}
      >
        <option value="">Tüm kategoriler</option>
        {kategoriler.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>

      <select className="filtre" value={kilif} onChange={(e) => guncelle('kilif', e.target.value)}>
        <option value="">Tüm kılıflar</option>
        {kiliflar.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>

      <select className="filtre" value={durum} onChange={(e) => guncelle('durum', e.target.value)}>
        <option value="">Tüm durumlar</option>
        {Object.entries(DURUM_ETIKET).map(([deger, metin]) => (
          <option key={deger} value={deger}>
            {metin}
          </option>
        ))}
      </select>

      {etiketler.length > 0 && (
        <select className="filtre" value={etiket} onChange={(e) => guncelle('etiket', e.target.value)}>
          <option value="">Tüm etiketler</option>
          {etiketler.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      )}

      {filtreliyiz && (
        <button
          type="button"
          className="filtre"
          style={{ color: 'var(--muted)', cursor: 'pointer' }}
          onClick={() => {
            const p = new URLSearchParams(searchParams.toString());
            p.delete('kategori');
            p.delete('kilif');
            p.delete('durum');
            p.delete('etiket');
            router.replace(`${pathname}?${p.toString()}`);
          }}
        >
          Filtreleri temizle ✕
        </button>
      )}

      <span style={{ width: 1, height: 16, background: 'var(--line)', margin: '0 2px' }} />

      <select className="filtre" value={sira} onChange={(e) => guncelle('sira', e.target.value)}>
        {SIRALAMALAR.map((s) => (
          <option key={s.deger} value={s.deger}>
            {s.etiket}
          </option>
        ))}
      </select>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
        <button
          type="button"
          onClick={() => guncelle('gorunum', '')}
          aria-label="Liste görünümü"
          aria-pressed={gorunum === 'liste'}
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-sm)',
            background: gorunum === 'liste' ? 'var(--copper-soft)' : 'var(--surface)',
            color: gorunum === 'liste' ? 'var(--copper)' : 'var(--muted)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => guncelle('gorunum', 'izgara')}
          aria-label="Izgara görünümü"
          aria-pressed={gorunum === 'izgara'}
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-sm)',
            background: gorunum === 'izgara' ? 'var(--copper-soft)' : 'var(--surface)',
            color: gorunum === 'izgara' ? 'var(--copper)' : 'var(--muted)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="4" y="4" width="7" height="7" rx="1" />
            <rect x="13" y="4" width="7" height="7" rx="1" />
            <rect x="4" y="13" width="7" height="7" rx="1" />
            <rect x="13" y="13" width="7" height="7" rx="1" />
          </svg>
        </button>
      </div>
    </div>
  );
}
