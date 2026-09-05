'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { konumEkle, type EylemDurum } from '@/app/envanter/actions';
import { KONUM_TIPLERI } from '@/lib/types';

export function KonumFormu({ ustler }: { ustler: { id: string; etiket: string }[] }) {
  const [durum, gonder, bekliyor] = useActionState<EylemDurum, FormData>(konumEkle, {});

  return (
    <form action={gonder} className="kart" style={{ padding: 22 }}>
      {durum.hata && (
        <div className="hata" style={{ marginBottom: 16 }}>
          {durum.hata}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label className="etiket" htmlFor="ad">
          Ad *
        </label>
        <input className="alan" id="ad" name="ad" required autoFocus placeholder="Dolap A" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <div>
          <label className="etiket" htmlFor="kod">
            Kod
          </label>
          <input className="alan mn" id="kod" name="kod" placeholder="A" />
        </div>
        <div>
          <label className="etiket" htmlFor="tip">
            Tip
          </label>
          <select className="alan" id="tip" name="tip" defaultValue="">
            <option value="">seçilmedi</option>
            {KONUM_TIPLERI.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="etiket" htmlFor="parent_id">
          Üst konum
        </label>
        <select className="alan" id="parent_id" name="parent_id" defaultValue="">
          <option value="">yok (en üst seviye)</option>
          {ustler.map((u) => (
            <option key={u.id} value={u.id}>
              {u.etiket}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 22 }}>
        <label className="etiket" htmlFor="aciklama">
          Açıklama
        </label>
        <input className="alan" id="aciklama" name="aciklama" placeholder="SMD pasif" />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-birincil" type="submit" disabled={bekliyor}>
          {bekliyor ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        <Link href="/envanter" className="btn">
          Vazgeç
        </Link>
      </div>
    </form>
  );
}
