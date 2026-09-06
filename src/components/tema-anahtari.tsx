'use client';

import { useEffect, useState } from 'react';

const ANAHTAR = 'labstock-tema';

export function TemaAnahtari() {
  const [koyu, setKoyu] = useState(false);

  useEffect(() => {
    setKoyu(document.documentElement.getAttribute('data-theme') === 'koyu');
  }, []);

  function degistir(e: React.ChangeEvent<HTMLInputElement>) {
    const secili = e.target.checked;
    setKoyu(secili);
    if (secili) {
      document.documentElement.setAttribute('data-theme', 'koyu');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try {
      if (secili) localStorage.setItem(ANAHTAR, 'koyu');
      else localStorage.removeItem(ANAHTAR);
    } catch {}
  }

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        fontSize: 13,
      }}
    >
      <span>Koyu tema</span>
      <input
        type="checkbox"
        checked={koyu}
        onChange={degistir}
        style={{ width: 16, height: 16, accentColor: 'var(--copper)' }}
      />
    </label>
  );
}
