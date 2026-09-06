'use client';

import { useEffect, useState } from 'react';
import type { GuncellemeDurumu } from './guncelleme-bildirimi';

export function Hakkinda() {
  const [surum, setSurum] = useState<string | null>(null);
  const [masaustu, setMasaustu] = useState(false);
  const [guncellemeDurumu, setGuncellemeDurumu] = useState<GuncellemeDurumu | null>(null);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    setMasaustu(true);
    api.surumAl().then(setSurum);
    return api.guncellemeDurumuDinle(setGuncellemeDurumu);
  }, []);

  return (
    <div className="kart" style={{ padding: 20, marginTop: 16 }}>
      <div
        className="mn"
        style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--muted-2)', marginBottom: 12 }}
      >
        HAKKINDA
      </div>

      <div style={{ fontSize: 13.5, fontWeight: 500 }}>
        LabStock
        {masaustu && surum && (
          <span className="mn" style={{ color: 'var(--muted)', fontWeight: 400 }}>
            {' '}
            · v{surum}
          </span>
        )}
      </div>

      {!masaustu && (
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>Tarayıcıda çalışıyor.</p>
      )}

      {masaustu && guncellemeDurumu?.tip === 'mevcut' && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--copper)' }}>
          Yeni sürüm var: v{guncellemeDurumu.versiyon}
        </p>
      )}
      {masaustu && guncellemeDurumu?.tip === 'hazir' && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--copper)' }}>
          v{guncellemeDurumu.versiyon} indirildi — yeniden başlatınca kurulacak.
        </p>
      )}

      {masaustu && (
        <button
          type="button"
          className="btn"
          style={{ marginTop: 12, height: 32, fontSize: 12.5 }}
          onClick={() => window.electronAPI?.guncellemeleriKontrolEt()}
        >
          Güncellemeleri kontrol et
        </button>
      )}

      <p style={{ margin: '14px 0 0', fontSize: 12 }}>
        <a href="https://github.com/recepuysal/labstock" target="_blank" rel="noopener noreferrer">
          GitHub&apos;da görüntüle
        </a>
      </p>
    </div>
  );
}
