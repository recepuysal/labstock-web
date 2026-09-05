'use client';

import { useActionState, useState } from 'react';
import { projeyeEkle } from '@/app/envanter/actions';
import type { EylemDurum } from '@/app/envanter/actions';

const YENI_PROJE = '__yeni__';

export function ProjeEkleFormu({
  partId,
  projeler,
  donus,
}: {
  partId: string;
  projeler: { id: string; ad: string }[];
  donus: string;
}) {
  const [acik, setAcik] = useState(false);
  const [secim, setSecim] = useState(projeler.length ? projeler[0].id : YENI_PROJE);
  const [durum, gonder, bekliyor] = useActionState<EylemDurum, FormData>(projeyeEkle, {});

  if (!acik) {
    return (
      <button
        type="button"
        onClick={() => setAcik(true)}
        style={{
          fontSize: 11.5,
          color: 'var(--copper)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        + Projeye ekle
      </button>
    );
  }

  return (
    <form action={gonder} style={{ marginTop: 4 }}>
      <input type="hidden" name="part_id" value={partId} />
      <input type="hidden" name="donus" value={donus} />

      {durum.hata && (
        <div className="hata" style={{ marginBottom: 8, fontSize: 11.5, padding: '6px 9px' }}>
          {durum.hata}
        </div>
      )}

      <select
        className="alan"
        style={{ height: 32, fontSize: 12, marginBottom: 8 }}
        value={secim}
        onChange={(e) => setSecim(e.target.value)}
      >
        {projeler.map((p) => (
          <option key={p.id} value={p.id}>
            {p.ad}
          </option>
        ))}
        <option value={YENI_PROJE}>+ Yeni proje…</option>
      </select>
      <input type="hidden" name="proje_id" value={secim === YENI_PROJE ? '' : secim} />

      {secim === YENI_PROJE && (
        <input
          className="alan"
          style={{ height: 32, fontSize: 12, marginBottom: 8 }}
          name="yeni_proje_adi"
          placeholder="Proje adı"
          required
        />
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          className="alan mn"
          style={{ height: 32, fontSize: 12 }}
          name="adet"
          type="number"
          min={0.001}
          step="any"
          defaultValue={1}
          placeholder="Adet"
        />
        <input
          className="alan"
          style={{ height: 32, fontSize: 12 }}
          name="referans"
          placeholder="Referans (R12, C4…)"
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-birincil" style={{ height: 30, fontSize: 12 }} type="submit" disabled={bekliyor}>
          {bekliyor ? 'Ekleniyor…' : 'Ekle'}
        </button>
        <button
          type="button"
          className="btn"
          style={{ height: 30, fontSize: 12 }}
          onClick={() => setAcik(false)}
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}
