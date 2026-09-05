import { Suspense } from 'react';
import Link from 'next/link';
import { Marka } from './marka';
import { AramaKutusu } from './arama-kutusu';
import { HesapMenu } from './hesap-menu';

export function UstBar({ bas }: { bas?: string }) {
  return (
    <header
      style={{
        height: 56,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 20px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <Link href="/envanter" style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Marka />
        <span
          className="mn"
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: 'var(--muted)',
            border: '1px solid var(--line)',
            borderRadius: 4,
            padding: '2px 5px',
          }}
        >
          WEB
        </span>
      </Link>

      <Suspense fallback={<div style={{ flex: 1, maxWidth: 520, height: 34 }} />}>
        <AramaKutusu />
      </Suspense>

      <div style={{ flex: 1 }} />

      <Link href="/envanter/ice-aktar" className="btn">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2v5a1 1 0 0 0 1 1h5" />
          <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
          <path d="M12 11v6" />
          <path d="M9.5 14.5 12 17l2.5-2.5" />
        </svg>
        Excel içe aktar
      </Link>

      <Link href="/envanter/yeni" className="btn btn-birincil">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Parça ekle
      </Link>

      <HesapMenu bas={bas} />
    </header>
  );
}
