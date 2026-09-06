'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AuthDurum = { hata?: string; bilgi?: string; kodBekleniyor?: string };

export async function girisYap(_onceki: AuthDurum, formData: FormData): Promise<AuthDurum> {
  const eposta = String(formData.get('eposta') ?? '').trim();
  const sifre = String(formData.get('sifre') ?? '');
  const devam = String(formData.get('devam') ?? '/envanter');

  if (!eposta || !sifre) return { hata: 'E-posta ve şifre gerekli.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: eposta, password: sifre });

  if (error) {
    if (error.message === 'Email not confirmed') {
      return { kodBekleniyor: eposta };
    }
    return {
      hata:
        error.message === 'Invalid login credentials'
          ? 'E-posta veya şifre hatalı.'
          : error.message,
    };
  }

  revalidatePath('/', 'layout');
  redirect(devam.startsWith('/') ? devam : '/envanter');
}

export async function kayitOl(_onceki: AuthDurum, formData: FormData): Promise<AuthDurum> {
  const ad = String(formData.get('ad') ?? '').trim();
  const eposta = String(formData.get('eposta') ?? '').trim();
  const sifre = String(formData.get('sifre') ?? '');
  const davetKodu = String(formData.get('davet_kodu') ?? '').trim();

  if (!eposta || !sifre) return { hata: 'E-posta ve şifre gerekli.' };
  if (sifre.length < 8) return { hata: 'Şifre en az 8 karakter olmalı.' };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: eposta,
    password: sifre,
    // davet_kodu, handle_new_user() tetikleyicisi tarafından okunup gözlemci
    // bağlantısı kuruluyor — e-posta doğrulaması açık olsa bile (oturum
    // henüz gelmeden) hesap oluşturulur oluşturulmaz bu çalışır.
    options: { data: { ad, davet_kodu: davetKodu || undefined } },
  });

  if (error) return { hata: error.message };

  // E-posta doğrulaması açık: oturum gelmez, 6 haneli kod ekranına geç.
  if (!data.session) {
    return { kodBekleniyor: eposta };
  }

  revalidatePath('/', 'layout');
  redirect('/envanter');
}

/** Kayıt/giriş sırasında e-postaya gönderilen 6 haneli kodu doğrular. */
export async function kodDogrula(_onceki: AuthDurum, formData: FormData): Promise<AuthDurum> {
  const eposta = String(formData.get('eposta') ?? '').trim();
  const kod = String(formData.get('kod') ?? '').trim();

  if (!eposta || !kod) return { hata: 'Kod gerekli.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: eposta, token: kod, type: 'signup' });

  if (error) {
    return {
      hata:
        error.message === 'Token has expired or is invalid'
          ? 'Kod hatalı ya da süresi dolmuş.'
          : error.message,
    };
  }

  revalidatePath('/', 'layout');
  redirect('/envanter');
}

/** Kodun süresi dolduysa ya da e-posta gelmediyse yeniden gönderir. */
export async function kodYenidenGonder(eposta: string): Promise<AuthDurum> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: 'signup', email: eposta });
  if (error) return { hata: error.message };
  return { bilgi: 'Yeni kod gönderildi.' };
}

export async function cikisYap() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/giris');
}
