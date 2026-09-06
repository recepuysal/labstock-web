'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { EylemDurum } from '@/app/envanter/actions';

export async function profilGuncelle(_onceki: EylemDurum, formData: FormData): Promise<EylemDurum> {
  const ad = String(formData.get('ad') ?? '').trim();
  const telefon = String(formData.get('telefon') ?? '').trim() || null;
  const sirketAdi = String(formData.get('sirket_adi') ?? '').trim() || null;
  const sirketAdresi = String(formData.get('sirket_adresi') ?? '').trim() || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { hata: 'Oturum bulunamadı.' };

  // update yerine upsert: profiles satırı (tetikleyici çalışmamışsa) hiç
  // olmayabilir — bu durumda update sessizce 0 satır etkiler, upsert ise
  // satırı yoksa oluşturur.
  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      ad: ad || null,
      telefon,
      sirket_adi: sirketAdi,
      sirket_adresi: sirketAdresi,
    },
    { onConflict: 'id' },
  );

  if (error) return { hata: error.message };

  revalidatePath('/', 'layout');
  return { bilgi: 'Kaydedildi.' };
}

const IZINLI_TURLER = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const AZAMI_BOYUT = 2 * 1024 * 1024; // 2 MB

export async function profilResmiYukle(_onceki: EylemDurum, formData: FormData): Promise<EylemDurum> {
  const dosya = formData.get('resim');
  if (!(dosya instanceof File) || dosya.size === 0) return { hata: 'Bir görsel seç.' };
  if (!IZINLI_TURLER.includes(dosya.type)) return { hata: 'Sadece PNG, JPEG, WEBP veya SVG kabul edilir.' };
  if (dosya.size > AZAMI_BOYUT) return { hata: 'Görsel en fazla 2 MB olabilir.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { hata: 'Oturum bulunamadı.' };

  const uzanti = dosya.type.split('/')[1] === 'svg+xml' ? 'svg' : dosya.type.split('/')[1];
  const yol = `${user.id}/profil.${uzanti}`;

  const { error: yuklemeHatasi } = await supabase.storage
    .from('profil-resimleri')
    .upload(yol, dosya, { upsert: true, contentType: dosya.type });
  if (yuklemeHatasi) {
    console.error('[profil-resmi] yukleme hatasi:', yuklemeHatasi);
    return { hata: `Yükleme hatası: ${yuklemeHatasi.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('profil-resimleri').getPublicUrl(yol);

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, resim_url: `${publicUrl}?t=${Date.now()}` }, { onConflict: 'id' });

  if (error) {
    console.error('[profil-resmi] guncelleme hatasi:', error);
    return { hata: `Kayıt hatası: ${error.message}` };
  }

  revalidatePath('/', 'layout');
  return { bilgi: 'Görsel güncellendi.' };
}
