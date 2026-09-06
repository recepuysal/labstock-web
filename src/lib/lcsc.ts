// LCSC ürün sayfasındaki schema.org JSON-LD bloğunu okuyup parça bilgilerine
// çeviriyor. Resmi API değil, ama normal bir sayfa isteği — LCSC sayfasında
// arama motorları için zaten yayınladığı yapılandırılmış veriyi okuyoruz.

const KATEGORI_ANAHTAR: [string, string][] = [
  ['resistor', 'Direnç'],
  ['capacitor', 'Kondansatör'],
  ['inductor', 'Bobin'],
  ['diode', 'Diyot'],
  ['transistor', 'Transistör'],
  ['mosfet', 'Transistör'],
  ['regulator', 'Regülatör'],
  ['led', 'Optoelektronik'],
  ['opto', 'Optoelektronik'],
  ['photo', 'Optoelektronik'],
  ['connector', 'Konnektör'],
  ['header', 'Konnektör'],
  ['crystal', 'Kristal / Osilatör'],
  ['oscillator', 'Kristal / Osilatör'],
  ['resonator', 'Kristal / Osilatör'],
  ['module', 'Modül'],
  ['fuse', 'Koruma'],
  ['tvs', 'Koruma'],
  ['esd', 'Koruma'],
  ['protection', 'Koruma'],
  ['switch', 'Mekanik'],
  ['screw', 'Mekanik'],
  ['standoff', 'Mekanik'],
  ['enclosure', 'Mekanik'],
  ['circuit', 'Entegre'],
  ['ic ', 'Entegre'],
  ['microcontroller', 'Entegre'],
  ['amplifier', 'Entegre'],
  ['logic', 'Entegre'],
];

function kategoriTahminEt(metin: string): string {
  const kucuk = metin.toLowerCase();
  for (const [anahtar, kategori] of KATEGORI_ANAHTAR) {
    if (kucuk.includes(anahtar)) return kategori;
  }
  return 'Diğer';
}

export type LcscVerisi = {
  uretici: string | null;
  aciklama: string | null;
  kategori: string | null;
  kilif: string | null;
  datasheetUrl: string | null;
  resimUrl: string | null;
  parametreler: Record<string, string>;
  fiyat: number | null;
  paraBirimi: string;
};

type LdProduct = {
  '@type'?: string;
  brand?: { name?: string };
  description?: string;
  category?: string;
  image?: string | string[];
  additionalProperty?: { name?: string; value?: string | number }[];
  subjectOf?: { url?: string };
  offers?: { price?: number; priceCurrency?: string };
};

export async function lcscKoduGetir(kod: string): Promise<LcscVerisi> {
  const temizKod = kod.trim().toUpperCase();
  const url = `https://www.lcsc.com/product-detail/_${encodeURIComponent(temizKod)}.html`;

  const yanit = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    },
  });
  if (!yanit.ok) throw new Error(`LCSC sayfası alınamadı (HTTP ${yanit.status}).`);
  const html = await yanit.text();

  let urun: LdProduct | null = null;
  for (const esleme of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const veri = JSON.parse(esleme[1]);
      if (veri['@type'] === 'Product') {
        urun = veri;
        break;
      }
    } catch {
      continue;
    }
  }
  if (!urun) throw new Error(`"${temizKod}" için LCSC'de ürün bilgisi bulunamadı.`);

  const parametreler: Record<string, string> = {};
  for (const ozellik of urun.additionalProperty ?? []) {
    if (ozellik?.name && ozellik?.value != null) parametreler[ozellik.name] = String(ozellik.value);
  }

  const kategoriMetni = [urun.category, urun.description].filter(Boolean).join(' ');
  const resimler = Array.isArray(urun.image) ? urun.image : urun.image ? [urun.image] : [];

  return {
    uretici: urun.brand?.name ?? null,
    aciklama: urun.description ?? null,
    kategori: kategoriMetni ? kategoriTahminEt(kategoriMetni) : null,
    kilif: parametreler['Package'] ?? parametreler['Package/Case'] ?? null,
    datasheetUrl: urun.subjectOf?.url ?? null,
    resimUrl: resimler[0] ?? null,
    parametreler,
    fiyat: typeof urun.offers?.price === 'number' ? urun.offers.price : null,
    paraBirimi: urun.offers?.priceCurrency ?? 'USD',
  };
}
