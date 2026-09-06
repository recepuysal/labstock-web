'use client';

import { useState } from 'react';
import { envanterDisaAktar } from '@/app/ayarlar/actions';

export function DisaAktarButonu() {
  const [calisiyor, setCalisiyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function disaAktar() {
    setCalisiyor(true);
    setHata(null);
    try {
      const sonuc = await envanterDisaAktar();
      if (sonuc.hata || !sonuc.csv) {
        setHata(sonuc.hata ?? 'Dışa aktarılamadı.');
        return;
      }

      const bom = '﻿';
      const blob = new Blob([bom + sonuc.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const tarih = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `labstock-envanter-${tarih}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setCalisiyor(false);
    }
  }

  return (
    <div className="kart" style={{ padding: 20, marginTop: 16 }}>
      <div
        className="mn"
        style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--muted-2)', marginBottom: 12 }}
      >
        DIŞA AKTARMA
      </div>
      <p style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>
        Tüm envanteri (parça, stok, konum ve etiket bilgileriyle) CSV dosyası olarak indir.
      </p>
      <button type="button" className="btn" style={{ height: 32, fontSize: 12.5 }} onClick={disaAktar} disabled={calisiyor}>
        {calisiyor ? 'Hazırlanıyor…' : 'CSV olarak indir'}
      </button>
      {hata && (
        <div className="hata" style={{ marginTop: 10 }}>
          {hata}
        </div>
      )}
    </div>
  );
}
