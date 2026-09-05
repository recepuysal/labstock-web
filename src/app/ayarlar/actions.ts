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

  const { error } = await supabase
    .from('profiles')
    .update({
      ad: ad || null,
      telefon,
      sirket_adi: sirketAdi,
      sirket_adresi: sirketAdresi,
    })
    .eq('id', user.id);

  if (error) return { hata: error.message };

  revalidatePath('/', 'layout');
  return { bilgi: 'Kaydedildi.' };
}
