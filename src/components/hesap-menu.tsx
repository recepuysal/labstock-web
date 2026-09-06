'use client';

import { useEffect, useRef, useState } from 'react';
import { cikisYap } from '@/app/auth-actions';

export function HesapMenu({ bas }: { bas?: string }) {
  const [acik, setAcik] = useState(false);
  const kutuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!acik) return;
    function disaTikla(e: MouseEvent) {
      if (kutuRef.current && !kutuRef.current.contains(e.target as Node)) setAcik(false);
    }
    document.addEventListener('mousedown', disaTikla);
    return () => document.removeEventListener('mousedown', disaTikla);
  }, [acik]);

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
    color: 'var(--ink-2)',
  };

  return (
    <div ref={kutuRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setAcik((a) => !a)}
        title={bas ? `${bas} — hesap menüsü` : 'Hesap menüsü'}
        aria-haspopup="menu"
        aria-expanded={acik}
        className="mn"
        style={{
          width: 32,
          height: 32,
          borderRadius: 99,
          background: 'var(--ink)',
          color: 'var(--bg)',
          border: 'none',
          fontSize: 11,
          fontWeight: 500,
        }}
      >
        {bas ?? '··'}
      </button>

      {acik && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            right: 0,
            top: 40,
            zIndex: 10,
            minWidth: 150,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-sm)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.14)',
            overflow: 'hidden',
          }}
        >
          <form action={cikisYap}>
            <button type="submit" role="menuitem" style={menuOge}>
              Çıkış yap
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
