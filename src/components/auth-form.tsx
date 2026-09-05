'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Marka } from './marka';
import type { AuthDurum } from '@/app/auth-actions';

type Props = {
  mod: 'giris' | 'kayit';
  eylem: (onceki: AuthDurum, formData: FormData) => Promise<AuthDurum>;
  devam?: string;
};

export function AuthForm({ mod, eylem, devam = '/envanter' }: Props) {
  const [durum, gonder, bekliyor] = useActionState<AuthDurum, FormData>(eylem, {});
  const kayit = mod === 'kayit';

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <Marka boyut={32} />
        </div>

        <form action={gonder} className="kart" style={{ padding: 22 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 19, fontWeight: 600, letterSpacing: '-0.4px' }}>
            {kayit ? 'Hesap oluştur' : 'Giriş yap'}
          </h1>
          <p style={{ margin: '0 0 20px', fontSize: 12.5, color: 'var(--muted)' }}>
            {kayit
              ? 'Kendi deponu kur, parçalarını ve konumlarını yönet.'
              : 'Depona devam etmek için giriş yap.'}
          </p>

          {durum.hata && (
            <div className="hata" style={{ marginBottom: 14 }}>
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
                marginBottom: 14,
              }}
            >
              {durum.bilgi}
            </div>
          )}

          {kayit && (
            <div style={{ marginBottom: 14 }}>
              <label className="etiket" htmlFor="ad">
                Ad
              </label>
              <input className="alan" id="ad" name="ad" autoComplete="name" placeholder="Recep" />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label className="etiket" htmlFor="eposta">
              E-posta
            </label>
            <input
              className="alan"
              id="eposta"
              name="eposta"
              type="email"
              required
              autoComplete="email"
              placeholder="ornek@eposta.com"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="etiket" htmlFor="sifre">
              Şifre
            </label>
            <input
              className="alan"
              id="sifre"
              name="sifre"
              type="password"
              required
              minLength={kayit ? 8 : undefined}
              autoComplete={kayit ? 'new-password' : 'current-password'}
              placeholder={kayit ? 'en az 8 karakter' : '••••••••'}
            />
          </div>

          <input type="hidden" name="devam" value={devam} />

          <button
            className="btn btn-birincil"
            type="submit"
            disabled={bekliyor}
            style={{ width: '100%', height: 40 }}
          >
            {bekliyor ? 'Bekle…' : kayit ? 'Hesap oluştur' : 'Giriş yap'}
          </button>

          <p
            style={{
              margin: '18px 0 0',
              fontSize: 12.5,
              color: 'var(--muted)',
              textAlign: 'center',
            }}
          >
            {kayit ? (
              <>
                Hesabın var mı? <Link href="/giris">Giriş yap</Link>
              </>
            ) : (
              <>
                Hesabın yok mu? <Link href="/kayit">Hesap oluştur</Link>
              </>
            )}
          </p>
        </form>
      </div>
    </main>
  );
}
