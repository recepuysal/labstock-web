'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { stokSil } from '@/app/envanter/actions';

export function SatirMenu({ stokId, mpn }: { stokId: string; mpn: string }) {
  const [acik, setAcik] = useState(false);
  const [bekliyor, basla] = useTransition();
  const kutuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!acik) return;
    function disaTikla(e: MouseEvent) {
      if (kutuRef.current && !kutuRef.current.contains(e.target as Node)) setAcik(false);
    }
    document.addEventListener('mousedown', disaTikla);
    return () => document.removeEventListener('mousedown', disaTikla);
  }, [acik]);

  function sil() {
    setAcik(false);
    if (!window.confirm(`"${mpn}" stoktan tamamen silinsin mi? Bu işlem geri alınamaz.`)) return;
    basla(async () => {
      await stokSil(stokId);
    });
  }

  const menuOge: React.CSSProperties = {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '8px 12px',
    fontSize: 12.5,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
  };

  return (
    <div ref={kutuRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setAcik((a) => !a)}
        disabled={bekliyor}
        aria-label="İşlemler"
        aria-haspopup="menu"
        aria-expanded={acik}
        style={{
          width: 22,
          height: 22,
          border: '1px solid var(--line)',
          borderRadius: 'var(--r-sm)',
          background: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted)',
          padding: 0,
          marginLeft: 'auto',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2.2" />
          <circle cx="12" cy="12" r="2.2" />
          <circle cx="12" cy="19" r="2.2" />
        </svg>
      </button>

      {acik && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            right: 0,
            top: 26,
            zIndex: 10,
            minWidth: 130,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-sm)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.14)',
            overflow: 'hidden',
          }}
        >
          <Link
            href={`/envanter/${stokId}/duzenle`}
            role="menuitem"
            onClick={() => setAcik(false)}
            style={{ ...menuOge, color: 'var(--ink-2)' }}
          >
            Düzenle
          </Link>
          <button type="button" role="menuitem" onClick={sil} style={{ ...menuOge, color: 'var(--crit)', borderTop: '1px solid var(--line-soft)' }}>
            Sil
          </button>
        </div>
      )}
    </div>
  );
}
