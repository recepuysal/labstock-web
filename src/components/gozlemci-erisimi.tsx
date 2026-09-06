'use client';

import { useState } from 'react';
import { davetKoduOlustur } from '@/app/ayarlar/actions';

export function GozlemciErisimi({ mevcutKod }: { mevcutKod: string | null }) {
  const [kod, setKod] = useState(mevcutKod);
  const [calisiyor, setCalisiyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [kopyalandi, setKopyalandi] = useState(false);

  async function olustur() {
    setCalisiyor(true);
    setHata(null);
    try {
      const sonuc = await davetKoduOlustur();
      if (sonuc.hata) setHata(sonuc.hata);
      else setKod(sonuc.kod ?? null);
    } finally {
      setCalisiyor(false);
    }
  }

  async function kopyala() {
    if (!kod) return;
    try {
      await navigator.clipboard.writeText(kod);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 1500);
    } catch {
      // pano izni yoksa sessizce yoksay — kod zaten ekranda okunabilir
    }
  }

  return (
    <div className="kart" style={{ padding: 20, marginTop: 16 }}>
      <div
        className="mn"
        style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--muted-2)', marginBottom: 12 }}
      >
        GÖZLEMCİ ERİŞİMİ
      </div>
      <p style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>
        Bu kodu paylaştığın kişiler envanterini salt-okunur görebilir — düzenleyemez, silemez.
      </p>

      {kod ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span
            className="mn"
            style={{
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: '0.1em',
              padding: '7px 14px',
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r)',
            }}
          >
            {kod}
          </span>
          <button type="button" className="btn" style={{ height: 32, fontSize: 12.5 }} onClick={kopyala}>
            {kopyalandi ? 'Kopyalandı' : 'Kopyala'}
          </button>
        </div>
      ) : (
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--muted)' }}>Henüz kod oluşturulmadı.</p>
      )}

      <button
        type="button"
        className="btn"
        style={{ height: 32, fontSize: 12.5 }}
        onClick={olustur}
        disabled={calisiyor}
      >
        {calisiyor ? '…' : kod ? 'Yeniden oluştur' : 'Kod oluştur'}
      </button>
      {kod && (
        <p style={{ margin: '8px 0 0', fontSize: 10.5, color: 'var(--muted-2)' }}>
          Yeniden oluşturmak eski kodu geçersiz kılar — o kodu daha önce kullanmış olanları etkilemez.
        </p>
      )}
      {hata && (
        <div className="hata" style={{ marginTop: 10 }}>
          {hata}
        </div>
      )}
    </div>
  );
}
