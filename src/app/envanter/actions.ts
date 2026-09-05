'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { metinToParametreler } from '@/lib/types';

export type EylemDurum = { hata?: string; bilgi?: string };

function rohsDegerinden(ham: FormDataEntryValue | null): boolean | null {
  const deger = String(ham ?? '');
  if (deger === 'evet') return true;
  if (deger === 'hayir') return false;
  return null;
}

/** Hızlı +/- : stok_hareket() RPC'si adet güncellemesi ile hareket kaydını birlikte yapar. */
export async function stokHareket(stokId: string, delta: number): Promise<EylemDurum> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('stok_hareket', {
    p_stok_id: stokId,
    p_delta: delta,
    p_sebep: 'manuel',
  });

  if (error) return { hata: error.message };

  revalidatePath('/envanter');
  return {};
}

/** Stok kalemini siler (parça, ortak katalogda diğer kullanıcılar için kalır). */
export async function stokSil(stokId: string): Promise<EylemDurum> {
  const supabase = await createClient();
  const { error } = await supabase.from('stock_items').delete().eq('id', stokId);
  if (error) return { hata: error.message };

  revalidatePath('/envanter');
  return {};
}

export async function konumEkle(_onceki: EylemDurum, formData: FormData): Promise<EylemDurum> {
  const ad = String(formData.get('ad') ?? '').trim();
  if (!ad) return { hata: 'Ad zorunlu.' };

  const kod = String(formData.get('kod') ?? '').trim() || null;
  const tip = String(formData.get('tip') ?? '').trim() || null;
  const aciklama = String(formData.get('aciklama') ?? '').trim() || null;
  const parentId = String(formData.get('parent_id') ?? '') || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { hata: 'Oturum bulunamadı.' };

  const { error } = await supabase.from('locations').insert({
    user_id: user.id,
    ad,
    kod,
    tip,
    aciklama,
    parent_id: parentId,
  });

  if (error) return { hata: error.message };

  revalidatePath('/envanter');
  redirect('/envanter');
}

export async function parcaEkle(_onceki: EylemDurum, formData: FormData): Promise<EylemDurum> {
  const mpn = String(formData.get('mpn') ?? '').trim();
  if (!mpn) return { hata: 'MPN (parça numarası) zorunlu.' };

  const uretici = String(formData.get('uretici') ?? '').trim() || null;
  const aciklama = String(formData.get('aciklama') ?? '').trim() || null;
  const kategori = String(formData.get('kategori') ?? '').trim() || null;
  const kilif = String(formData.get('kilif') ?? '').trim() || null;
  const konumId = String(formData.get('konum_id') ?? '') || null;
  const adet = Number(formData.get('adet') ?? 0);
  const minAdet = Number(formData.get('min_adet') ?? 0);
  const tedarikci = String(formData.get('tedarikci') ?? '').trim() || null;
  const tedarikciKodu = String(formData.get('tedarikci_kodu') ?? '').trim() || null;
  const alisFiyatiHam = String(formData.get('alis_fiyati') ?? '').trim();
  const alisFiyati = alisFiyatiHam ? Number(alisFiyatiHam) : null;
  const paraBirimi = String(formData.get('para_birimi') ?? 'TRY').trim() || 'TRY';
  const datasheetUrl = String(formData.get('datasheet_url') ?? '').trim() || null;
  const parametreler = metinToParametreler(String(formData.get('parametreler') ?? ''));

  if (!Number.isFinite(adet) || adet < 0) return { hata: 'Adet geçersiz.' };
  if (!Number.isFinite(minAdet) || minAdet < 0) return { hata: 'Minimum seviye geçersiz.' };
  if (alisFiyati !== null && (!Number.isFinite(alisFiyati) || alisFiyati < 0)) {
    return { hata: 'Alım fiyatı geçersiz.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { hata: 'Oturum bulunamadı.' };

  // 1) Ortak katalogda parça var mı? Yoksa ekle.
  const { data: mevcut, error: aramaHatasi } = await supabase
    .from('parts')
    .select('id')
    .ilike('mpn', mpn)
    .limit(1)
    .maybeSingle();

  if (aramaHatasi) return { hata: aramaHatasi.message };

  let partId = mevcut?.id as string | undefined;

  if (!partId) {
    const { data: yeni, error: ekleHatasi } = await supabase
      .from('parts')
      .insert({
        mpn,
        uretici,
        aciklama,
        kategori,
        kilif,
        datasheet_url: datasheetUrl,
        parametreler,
        olusturan: user.id,
      })
      .select('id')
      .single();

    if (ekleHatasi) return { hata: ekleHatasi.message };
    partId = yeni.id;
  }

  // 2) Bu parça bu konumda zaten var mı?
  let sorgu = supabase
    .from('stock_items')
    .select('id, adet')
    .eq('part_id', partId)
    .limit(1);
  sorgu = konumId ? sorgu.eq('location_id', konumId) : sorgu.is('location_id', null);

  const { data: stok, error: stokHatasi } = await sorgu.maybeSingle();
  if (stokHatasi) return { hata: stokHatasi.message };

  if (stok) {
    if (adet > 0) {
      const { error } = await supabase.rpc('stok_hareket', {
        p_stok_id: stok.id,
        p_delta: adet,
        p_sebep: 'giris',
        p_aciklama: 'elle giriş',
      });
      if (error) return { hata: error.message };
    }
  } else {
    const { data: yeniStok, error } = await supabase
      .from('stock_items')
      .insert({
        part_id: partId,
        location_id: konumId,
        adet: 0,
        min_adet: minAdet,
        tedarikci,
        tedarikci_kodu: tedarikciKodu,
        alis_fiyati: alisFiyati,
        para_birimi: paraBirimi,
        user_id: user.id,
      })
      .select('id')
      .single();

    if (error) return { hata: error.message };

    if (adet > 0) {
      const { error: hareketHatasi } = await supabase.rpc('stok_hareket', {
        p_stok_id: yeniStok.id,
        p_delta: adet,
        p_sebep: 'giris',
        p_aciklama: 'ilk giriş',
      });
      if (hareketHatasi) return { hata: hareketHatasi.message };
    }
  }

  revalidatePath('/envanter');
  redirect('/envanter');
}

export async function parcaGuncelle(_onceki: EylemDurum, formData: FormData): Promise<EylemDurum> {
  const stokId = String(formData.get('stok_id') ?? '');
  const partId = String(formData.get('part_id') ?? '');
  if (!stokId || !partId) return { hata: 'Geçersiz kayıt.' };

  const mpn = String(formData.get('mpn') ?? '').trim();
  if (!mpn) return { hata: 'MPN (parça numarası) zorunlu.' };

  const uretici = String(formData.get('uretici') ?? '').trim() || null;
  const aciklama = String(formData.get('aciklama') ?? '').trim() || null;
  const kategori = String(formData.get('kategori') ?? '').trim() || null;
  const kilif = String(formData.get('kilif') ?? '').trim() || null;
  const konumId = String(formData.get('konum_id') ?? '') || null;
  const minAdet = Number(formData.get('min_adet') ?? 0);
  const tedarikci = String(formData.get('tedarikci') ?? '').trim() || null;
  const tedarikciKodu = String(formData.get('tedarikci_kodu') ?? '').trim() || null;
  const alisFiyatiHam = String(formData.get('alis_fiyati') ?? '').trim();
  const alisFiyati = alisFiyatiHam ? Number(alisFiyatiHam) : null;
  const paraBirimi = String(formData.get('para_birimi') ?? 'TRY').trim() || 'TRY';
  const datasheetUrl = String(formData.get('datasheet_url') ?? '').trim() || null;
  const parametreler = metinToParametreler(String(formData.get('parametreler') ?? ''));

  if (!Number.isFinite(minAdet) || minAdet < 0) return { hata: 'Minimum seviye geçersiz.' };
  if (alisFiyati !== null && (!Number.isFinite(alisFiyati) || alisFiyati < 0)) {
    return { hata: 'Alım fiyatı geçersiz.' };
  }

  const supabase = await createClient();

  // Katalog alanları (mpn/üretici/açıklama/kategori/kılıf/datasheet/parametreler) sadece
  // parçayı ekleyen kullanıcı tarafından güncellenebilir (parts_update_own RLS politikası)
  // — bu ortak bir katalog satırı olduğu için. Başkasının eklediği bir parçaysa bu
  // güncelleme RLS tarafından sessizce hiçbir satırı etkilemeden geçer; stok
  // tarafındaki (konum/min. seviye) güncelleme yine de uygulanır.
  const { error: parcaHatasi } = await supabase
    .from('parts')
    .update({ mpn, uretici, aciklama, kategori, kilif, datasheet_url: datasheetUrl, parametreler })
    .eq('id', partId);

  if (parcaHatasi) return { hata: parcaHatasi.message };

  const { error: stokHatasi } = await supabase
    .from('stock_items')
    .update({
      location_id: konumId,
      min_adet: minAdet,
      tedarikci,
      tedarikci_kodu: tedarikciKodu,
      alis_fiyati: alisFiyati,
      para_birimi: paraBirimi,
    })
    .eq('id', stokId);

  if (stokHatasi) return { hata: stokHatasi.message };

  const donus = String(formData.get('donus') ?? '') || '/envanter';
  revalidatePath('/envanter');
  revalidatePath(donus);
  redirect(donus);
}

/** Parçayı bir projenin BOM'una ekler/günceller; proje yeni ise önce oluşturur. */
export async function projeyeEkle(_onceki: EylemDurum, formData: FormData): Promise<EylemDurum> {
  const partId = String(formData.get('part_id') ?? '');
  if (!partId) return { hata: 'Geçersiz parça.' };

  const projeId = String(formData.get('proje_id') ?? '') || null;
  const yeniProjeAdi = String(formData.get('yeni_proje_adi') ?? '').trim();
  const adet = Number(formData.get('adet') ?? 1);
  const referans = String(formData.get('referans') ?? '').trim() || null;
  const donus = String(formData.get('donus') ?? '') || '/envanter';

  if (!projeId && !yeniProjeAdi) return { hata: 'Bir proje seç ya da yeni proje adı gir.' };
  if (!Number.isFinite(adet) || adet <= 0) return { hata: 'Adet geçersiz.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { hata: 'Oturum bulunamadı.' };

  let hedefProjeId = projeId;

  if (!hedefProjeId) {
    const { data: yeniProje, error } = await supabase
      .from('projects')
      .insert({ ad: yeniProjeAdi, user_id: user.id })
      .select('id')
      .single();
    if (error) return { hata: error.message };
    hedefProjeId = yeniProje.id;
  }

  const { error } = await supabase
    .from('project_bom')
    .upsert(
      { proje_id: hedefProjeId, part_id: partId, adet, referans, user_id: user.id },
      { onConflict: 'proje_id,part_id' },
    );

  if (error) return { hata: error.message };

  revalidatePath(donus);
  return {};
}

/** Bir BOM satırını (parça-proje ilişkisini) kaldırır. */
export async function projedenCikar(bomId: string, donus: string): Promise<EylemDurum> {
  const supabase = await createClient();
  const { error } = await supabase.from('project_bom').delete().eq('id', bomId);
  if (error) return { hata: error.message };

  revalidatePath(donus);
  return {};
}
