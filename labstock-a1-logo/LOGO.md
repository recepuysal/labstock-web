# LabStock — logo (A1 · Izgara)

Bir yapay zekaya verirken en kolay okunan iki dosya: **`svg/labstock-isaret.svg`**
(düz metin, geometrisi okunabilir) ve **`png/isaret-1024.png`** (görsel giriş kabul
eden modeller için). İkisini birlikte ver; aşağıdaki tarifi de prompt'a yapıştır.

---

## Kavram

Bölmeli bir çekmece ünitesi: **2 satır × 3 sütun**, altı göz. Üst satırın **ortadaki
gözü bakır renkte dolu** — "aradığın parça bu bölmede" demek. Elektronik hobisiyle
değil, doğrudan **depo/stok** fikriyle konuşuyor.

## Geometri (48 × 48 birimlik kutu)

| Öğe | Değer |
| --- | --- |
| Dış çerçeve | `x=4, y=7, w=40, h=34`, köşe yarıçapı `4`, çizgi kalınlığı `2.6` |
| Yatay bölme | `y=24`, tam genişlik, kalınlık `2.2` |
| Dikey bölmeler | `x=17.3` ve `x=30.7`, kalınlık `2.2` |
| Dolu göz | üst satır, orta sütun: `x=17.3, y=7, w=13.4, h=17` |
| Çizim sırası | önce dolu göz, sonra çizgiler (çizgiler dolu gözün kenarını kapatır) |

Bütün çizgiler düz; eğri yok, gölge yok, gradyan yok, perspektif yok.

## Renkler

| Rol | Hex | Nerede |
| --- | --- | --- |
| Mürekkep (çizgiler) | `#1F1B16` | sıcak siyah, saf siyah değil |
| Bakır (dolu göz) | `#A3611F` | tek vurgu rengi |
| Krem (zemin) | `#F2EDE3` | PCB fiberglas kremi |
| Koyu zemin | `#17140F` | koyu varyantta arka plan |

Koyu zeminde çizgiler kreme döner, bakır aynı kalır.

## Tipografi

Kelime işareti **Space Grotesk, 600 ağırlık, harf aralığı −0.5**, tek kelime:
`LabStock` (S büyük, araya boşluk girmez). İşaret ile yazı arası boşluk, işaret
yüksekliğinin yaklaşık **%29'u** (48 birimlik işarette 14 birim).
Uygulamada parça numaraları JetBrains Mono ile yazılıyor; logoda kullanılmaz.

## Kurallar

- İşaretin çevresinde en az bir göz genişliği (13 birim) boş alan bırak.
- Döndürme, eğme, gölge ekleme, gradyan uygulama yok.
- Dolu göz her zaman **üst satır, orta sütun**. Yerini değiştirmek işareti bozar.
- 20 px altında çizgileri kalınlaştır (paket içindeki 16/32 px PNG'ler buna göre üretildi).
- Tek renk baskıda dolu göz de mürekkep rengine döner (`labstock-isaret-tekrenk.svg`).

---

## Yapay zekaya verilecek hazır tarif

**Türkçe:**

> Minimal, düz (flat) bir vektör logo işareti: kalın çizgili, yuvarlatılmış köşeli bir
> dikdörtgen çerçeve; içi 2 satır × 3 sütun olacak şekilde bölünmüş — altı eşit göz.
> Üst satırın ortadaki gözü bakır turuncuyla (#A3611F) tamamen dolu; diğer beş göz boş.
> Çizgiler sıcak siyah (#1F1B16), zemin krem (#F2EDE3). Gölge, gradyan, doku, perspektif
> yok. Geometrik ve simetrik. Bir bölmeli çekmece ünitesini temsil ediyor.

**English:**

> A minimal flat vector logo mark: a thick-stroked rounded rectangle divided into
> 2 rows × 3 columns — six equal compartments. The top-middle compartment is filled
> solid copper orange (#A3611F); the other five are empty. Strokes are warm black
> (#1F1B16) on a cream background (#F2EDE3). No shadows, gradients, textures or
> perspective. Geometric and symmetrical. It represents a compartmented storage
> drawer unit.

---

## Paket içeriği

```
svg/
  labstock-isaret.svg           işaret, açık zemin (ana dosya)
  labstock-isaret-koyu.svg      koyu zemin için (krem çizgiler)
  labstock-isaret-tekrenk.svg   tek renk baskı / gravür
  labstock-yatay.svg            işaret + LabStock yazısı (font gömülü)
  labstock-yatay-koyu.svg       aynısı, koyu zemin

png/
  isaret-16 … 1024.png          şeffaf zeminli kare işaret
  isaret-1024-krem.png          krem zeminli
  isaret-1024-koyu.png          koyu zeminli
  isaret-1024-tekrenk.png       tek renk
  yatay-512 / 1024 / 2048.png   yatay kilit, şeffaf
  yatay-2048-koyu.png           yatay kilit, koyu zemin
  favicon.ico                   16/32/64/128 birlikte
```

SVG'lerin tamamı el yazımı; gereksiz grup, maske veya `<image>` yok — bir yapay zeka
da, bir vektör editörü de doğrudan okuyabilir. Yatay kilitteki yazı `<text>` olarak
duruyor ve Space Grotesk 600 dosyası SVG'nin içine gömülü; yazıyı eğriye çevirmen
gerekirse vektör editöründe "create outlines" yeterli.
