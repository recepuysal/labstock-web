'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AuthDurum = { hata?: string; bilgi?: string };

export async function girisYap(_onceki: AuthDurum, formData: FormData): Promise<AuthDurum> {
  const eposta = String(formData.get('eposta') ?? '').trim();
  const sifre = String(formData.get('sifre') ?? '');
  const devam = String(formData.get('devam') ?? '/envanter');

  if (!eposta || !sifre) return { hata: 'E-posta ve şifre gerekli.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: eposta, password: sifre });

  if (error) {
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

  if (!eposta || !sifre) return { hata: 'E-posta ve şifre gerekli.' };
  if (sifre.length < 8) return { hata: 'Şifre en az 8 karakter olmalı.' };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: eposta,
    password: sifre,
    options: { data: { ad } },
  });

  if (error) return { hata: error.message };

  // E-posta doğrulaması açıksa oturum gelmez; kullanıcıyı bekletme.
  if (!data.session) {
    return { bilgi: 'Hesabı doğrulamak için e-postana gönderdiğimiz bağlantıya tıkla.' };
  }

  revalidatePath('/', 'layout');
  redirect('/envanter');
}

export async function cikisYap() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/giris');
}
