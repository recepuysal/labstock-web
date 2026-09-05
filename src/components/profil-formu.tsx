'use client';

import { useActionState } from 'react';
import { profilGuncelle } from '@/app/ayarlar/actions';
import type { EylemDurum } from '@/app/envanter/actions';

type Baslangic = {
  eposta: string;
  ad: string | null;
  telefon: string | null;
  sirket_adi: string | null;
  sirket_adresi: string | null;
};

export function ProfilFormu({ baslangic }: { baslangic: Baslangic }) {
  const [durum, gonder, bekliyor] = useActionState<EylemDurum, FormData>(profilGuncelle, {});

  return (
    <form action={gonder} className="kart" style={{ padding: 22 }}>
      {durum.hata && (
        <div className="hata" style={{ marginBottom: 16 }}>
          {durum.hata}
        </div>
      )}
      {durum.bilgi && (
        <div
          style={{
            background: 'var(--ok-bg)',
            color: 'var(--ok)',
            borderRadius: 'var(--r)',
            padding: '9px 12px',
            fontSize: 12.5,
            marginBottom: 16,
          }}
        >
          {durum.bilgi}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label className="etiket">E-posta</label>
        <div className="alan" style={{ display: 'flex', alignItems: 'center', color: 'var(--muted)' }}>
          {baslangic.eposta}
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <label className="etiket" htmlFor="ad">
          Ad
        </label>
        <input
          className="alan"
          id="ad"
          name="ad"
          defaultValue={baslangic.ad ?? undefined}
          placeholder="Recep Uysal"
        />
      </div>

      <div
        style={{
          margin: '0 0 16px',
          paddingTop: 16,
          borderTop: '1px solid var(--line-soft)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          color: 'var(--muted)',
          textTransform: 'uppercase',
        }}
      >
        Şirket bilgileri
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="etiket" htmlFor="sirket_adi">
          Şirket adı
        </label>
        <input
          className="alan"
          id="sirket_adi"
          name="sirket_adi"
          defaultValue={baslangic.sirket_adi ?? undefined}
          placeholder="Atölye Elektronik Ltd. Şti."
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="etiket" htmlFor="sirket_adresi">
          Şirket adresi
        </label>
        <input
          className="alan"
          id="sirket_adresi"
          name="sirket_adresi"
          defaultValue={baslangic.sirket_adresi ?? undefined}
          placeholder="Adres"
        />
      </div>

      <div style={{ marginBottom: 22 }}>
        <label className="etiket" htmlFor="telefon">
          Telefon
        </label>
        <input
          className="alan mn"
          id="telefon"
          name="telefon"
          defaultValue={baslangic.telefon ?? undefined}
          placeholder="+90 5xx xxx xx xx"
        />
      </div>

      <button className="btn btn-birincil" type="submit" disabled={bekliyor}>
        {bekliyor ? 'Kaydediliyor…' : 'Kaydet'}
      </button>
    </form>
  );
}
