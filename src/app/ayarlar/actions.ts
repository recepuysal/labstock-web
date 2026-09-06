'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { EylemDurum } from '@/app/envanter/actions';
import type { EnvanterSatiri } from '@/lib/types';

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

export type DisaAktarSonuc = { hata?: string; csv?: string };

function csvHucre(deger: string | number | null | undefined): string {
  const s = deger === null || deger === undefined ? '' : String(deger);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const DURUM_METNI: Record<string, string> = {
  yeterli: 'Yeterli',
  az: 'Az kaldı',
  kritik: 'Kritik',
  yok: 'Yok',
};

/** Tüm envanteri CSV metni olarak döndürür — indirme işlemi tarayıcı tarafında yapılır. */
export async function envanterDisaAktar(): Promise<DisaAktarSonuc> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { hata: 'Oturum bulunamadı.' };

  const { data, error } = await supabase.from('envanter').select('*').order('mpn', { ascending: true });
  if (error) return { hata: error.message };
  const satirlar = (data ?? []) as EnvanterSatiri[];

  const { data: etiketVerisi } = await supabase.from('stock_item_tags').select('stock_item_id, tags(ad)');
  const etiketHaritasi = new Map<string, string[]>();
  for (const row of etiketVerisi ?? []) {
    const ad = (row.tags as unknown as { ad: string } | null)?.ad;
    if (!ad) continue;
    const liste = etiketHaritasi.get(row.stock_item_id) ?? [];
    liste.push(ad);
    etiketHaritasi.set(row.stock_item_id, liste);
  }

  const basliklar = [
    'MPN',
    'Üretici',
    'Açıklama',
    'Kategori',
    'Kılıf',
    'RoHS',
    'Konum',
    'Adet',
    'Min. Adet',
    'Durum',
    'Tedarikçi',
    'Tedarikçi Kodu',
    'Alış Fiyatı',
    'Para Birimi',
    'Datasheet URL',
    'Etiketler',
    'Son Güncelleme',
  ];

  const satirMetinleri = satirlar.map((s) =>
    [
      s.mpn,
      s.uretici,
      s.aciklama,
      s.kategori,
      s.kilif,
      s.rohs === true ? 'Evet' : s.rohs === false ? 'Hayır' : '',
      s.konum_adi,
      s.adet,
      s.min_adet,
      DURUM_METNI[s.durum] ?? s.durum,
      s.tedarikci,
      s.tedarikci_kodu,
      s.alis_fiyati,
      s.para_birimi,
      s.datasheet_url,
      (etiketHaritasi.get(s.stok_id) ?? []).join('; '),
      s.updated_at ? new Date(s.updated_at).toLocaleString('tr-TR') : '',
    ]
      .map(csvHucre)
      .join(','),
  );

  const csv = [basliklar.join(','), ...satirMetinleri].join('\r\n');
  return { csv };
}
