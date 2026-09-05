# LabStock Web

Elektronik komponent deposu için çok kullanıcılı stok takip uygulaması.
Next.js 16 (App Router) + Supabase (Postgres, Auth, RLS).

## Kurulum

### 1. Supabase projesi

1. [supabase.com](https://supabase.com) üzerinde yeni bir proje aç.
2. **SQL Editor**'ü aç, `supabase/migrations/0001_init.sql` dosyasının tamamını
   yapıştır ve çalıştır. (Şema, RLS politikaları, `stok_hareket()` fonksiyonu ve
   `envanter` view'ı bir kerede kurulur.)
3. **Authentication → Sign In / Providers → Email**: geliştirme sırasında
   "Confirm email" kapalıysa kayıt olur olmaz giriş yapabilirsin.
4. **Project Settings → API** ekranından `Project URL` ve `anon public` anahtarını al.

### 2. Uygulama

```bash
cp .env.example .env.local     # Windows: copy .env.example .env.local
# .env.local içine Supabase URL ve anon key'i yaz

npm install
npm run dev
```

`http://localhost:3000` → `/kayit` ile hesap aç, ardından envanter ekranı açılır.
Depo boşsa "Konum ekle" ile ilk konumunu (oda, dolap, çekmece — ne istersen) kendin kurarsın;
otomatik/hazır bir konum ağacı gelmez.

## Veri modeli

Kritik tasarım kararı: **parça tanımı ile stok ayrı**.

| Tablo | Ne tutar |
| --- | --- |
| `parts` | Ortak katalog — MPN, üretici, kategori, kılıf, parametreler. Kullanıcıdan bağımsız; herkes ekledikçe büyür. |
| `locations` | Kullanıcıya ait hiyerarşik konum ağacı (oda › dolap › çekmece › bölme). |
| `stock_items` | Kullanıcının elindeki stok: parça × konum, adet, min. seviye, tedarikçi. |
| `stock_movements` | Hareket defteri — her +/- işlem, sebebi ve sonraki adet. |
| `projects`, `project_bom` | Proje ve malzeme listesi. Şemada hazır, arayüzü henüz yok. |

Adet doğrudan yazılmaz: `stok_hareket()` RPC'si `stock_items.adet` güncellemesi ile
hareket kaydını birlikte yapar. Proje bazlı düşüm, "nereye gitti bu 50 direnç" ve
geri alma bunun üstüne oturacak.

### Çok kullanıcılı izolasyon

Her kullanıcı tablosunda `user_id = auth.uid()` RLS politikası var; izolasyon
uygulama katmanında değil **veritabanı seviyesinde**. `envanter` view'ı
`security_invoker = true` ile tanımlı, yani view bir yetki kaçağı oluşturmaz.

## Şu an ne var

- E-posta + şifre ile kayıt / giriş, oturum yenileme (`src/proxy.ts`)
- Konum ağacı, alt ağaca göre filtreleme
- Parça listesi: arama (MPN / açıklama / kategori), durum rozetleri, satır içi ± stok hareketi
- Parça ekleme — MPN katalogda varsa ona bağlanır, yoksa katalog kaydı açılır
- ⌘K / Ctrl+K aramaya odaklanır (komut paletinin ilk adımı)

## Sırada

- Parça detay sayfası: parametreler, hareket geçmişi, konum haritası
- Excel / CSV içe aktarma (LabStock masaüstündeki sınıflandırma mantığı taşınacak)
- Gerçek ⌘K komut paleti: `10k 0805 −20` gibi tek satırlık stok hareketi
- Mobil "tara & düş" ekranı, QR etiket üretimi
- Proje / BOM ekranları, tedarikçi fiyat karşılaştırma

## Notlar

- Fontlar `<link>` ile Google Fonts'tan geliyor (`src/app/layout.tsx`). Ağı kısıtlı
  bir ortamda build alacaksan `next/font` yerine bu yöntem kırılmaz; tamamen
  offline istersen fontları `public/` altına alıp `@font-face` ile tanımla.
- Arayüz teması `src/app/globals.css` içindeki CSS değişkenlerinde: PCB fiberglas
  krem zemin, bakır `#A3611F` aksan, Space Grotesk + JetBrains Mono.
