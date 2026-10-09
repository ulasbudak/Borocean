---
name: Borocean
description: Türkçe konuşan bireysel yatırımcılar için karanlık mod öncelikli hisse analiz ve takip aracı. Web'de Tailwind v4 + kendi bileşenleri, mobilde React Native StyleSheet; tek token kaynağı packages/shared/src/theme/tokens.ts.
status: final
updated: 2026-10-09
colors:
  # Dark (varsayılan). Kaynak: packages/shared/src/theme/tokens.ts — bu dosya o dosyayı yansıtır, değer değişikliği önce orada yapılır.
  canvas: '#0A0B0D'
  surface: '#121417'
  surface-hover: '#1A1D21'
  surface-elevated: '#1E2126'
  border-subtle: '#23262B'
  border-default: '#2E3239'
  text-primary: '#F4F5F7'
  text-secondary: '#9CA3AF'
  text-tertiary: '#848C98'
  text-disabled: '#4B5563'
  accent: '#3B82F6'
  accent-text: '#0A0B0D'
  positive: '#34D399'
  negative: '#F87171'
  warning: '#F59E0B'
  info: '#38BDF8'
  # Light (tam destekli ikincil mod)
  canvas-light: '#F8FAFC'
  surface-light: '#FFFFFF'
  surface-hover-light: '#F1F5F9'
  surface-elevated-light: '#FFFFFF'
  border-subtle-light: '#E5E7EB'
  border-default-light: '#D1D5DB'
  text-primary-light: '#0F172A'
  text-secondary-light: '#475569'
  text-tertiary-light: '#5F6E82'
  text-disabled-light: '#CBD5E1'
  accent-light: '#2563EB'
  accent-text-light: '#FFFFFF'
  positive-light: '#15803D'
  negative-light: '#B91C1C'
  warning-light: '#B45309'
  info-light: '#0284C7'
typography:
  display:
    fontFamily: 'Geist Sans (web) · system (mobil)'
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  h1:
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  h2:
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  h3:
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body:
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-strong:
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  caption:
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label:
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  numeric:
    fontFamily: 'Geist Sans, tabular-nums · Geist Mono kod/sembol için'
    note: 'Fiyat, yüzde ve oran gösteren her sayı tabular-nums'
rounded:
  sm: 6px
  md: 10px
  lg: 14px
  full: 9999px
spacing:
  '0': 0px
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 24px
  '8': 32px
  '10': 40px
  '12': 48px
  '16': 64px
  content-max: 768px
components:
  card:
    background: '{colors.surface}'
    border: '1px {colors.border-subtle}'
    radius: '{rounded.lg}'
    padding: '{spacing.4}'
  button-primary:
    background: '{colors.accent}'
    foreground: '{colors.accent-text}'
    radius: '{rounded.md}'
  input:
    background: '{colors.surface-elevated}'
    border: '1px {colors.border-default}'
    radius: '{rounded.md}'
  change-value:
    up: '{colors.positive}'
    down: '{colors.negative}'
    zero: '{colors.text-secondary}'
  quick-access-tile:
    background: '{colors.surface}'
    border: '1px {colors.border-subtle}'
    icon-well: '{colors.surface-hover}'
    hover-border: '{colors.accent} %50'
    radius: '{rounded.lg}'
  section-label:
    typography: '{typography.label}'
    color: '{colors.text-tertiary}'
    transform: 'uppercase, tracking-wide'
  score-value:
    typography: '{typography.display}'
    color: '{colors.text-primary}'
  chart:
    up-candle: '{colors.positive}'
    down-candle: '{colors.negative}'
    indicator: '{colors.accent}'
    drawing: '{colors.warning}'
    grid: '{colors.border-subtle}'
    axis-text: '{colors.text-secondary}'
  disclaimer:
    typography: '{typography.caption}'
    color: '{colors.text-tertiary}'
---

## Brand & Style

Borocean sakin ve güvenilir bir analiz aracıdır; bir alım-satım platformu ya da heyecan pazarlayan bir uygulama değildir. Ekranlar uzun süre açık kalan, grafik ve sayı yoğun yüzeyler olduğu için karanlık mod varsayılandır. Görsel dil "veri önde, süs geride" der: tek bir mavi vurgu, kazanç ve kayıp için yalnızca yeşil ve kırmızı, geri kalan her şey nötr gri tonlarındadır.

Marka, SPK sınırını görsel olarak da taşır. Hiçbir renk, rozet ya da ikon bir hisse için "al", "sat" veya "tut" anlamına gelmez. Yeşil ve kırmızı yalnızca işaretli bir değişimi (fiyat, kâr/zarar, fark) gösterir; bir öneriyi asla göstermez.

Logo `apps/web/src/components/ui/logo.tsx` ve `docs/marketing/brand/` altındadır; sekme ikonu, Apple ikonu ve paylaşım görseli aynı markadan türetilir (Story 14.6).

## Colors

- **Canvas / Surface / Surface-elevated:** Üç katmanlı nötr zemin: sayfa, kart, girdi ve açılır pencere. Açık modda canvas hafif gri, kartlar beyazdır.
- **Accent (`{colors.accent}`):** Birincil aksiyon, aktif sekme ve chip, bağlantı, nötr grafik çubuğu ve indikatör çizgisi. Bir hissenin "iyi" olduğunu göstermek için kullanılmaz.
- **Positive / Negative:** Yalnızca işaretli sayılar (`ChangeValue`, `signColor()`) ve mum yönü. Skor, AI raporu, gelişme kartı veya sinyal yönü için öneri rengi olarak kullanılmaz. Sinyal listesindeki boğa/ayı ikon zemini istisnadır: bu, öneriyi değil göstergenin yönünü anlatır.
- **Warning:** Uyarı metni, veri gecikmesi bildirimi ve grafikteki çizim araçları.
- **Info:** Rezerve; şu an kullanılmıyor.
- **Text tertiary:** Meta bilgi, yer tutucu, bölüm etiketi ve "yatırım tavsiyesi değildir" ibaresi.

Kontrast: tüm metin çiftleri her iki modda da canvas, surface, surface-hover ve surface-elevated üzerinde normal metin için WCAG AA'yı (en az 4.5:1) karşılar (Story 16.1, 2026-10-09). Koyu modda birincil düğme metni koyudur (`{colors.accent-text}`), çünkü mavi zemin üzerinde açık metin AA'yı geçmiyordu.

Kural: bileşenlerde hex kodu yazılmaz. Web, `--tk-*` CSS değişkenlerine bağlı Tailwind utility'lerini (`bg-canvas`, `text-accent`) kullanır. Mobil `useTheme()` → `makeStyles(colors)` desenini kullanır. Tek istisna, mobil grafik WebView'ının gömülü HTML'idir; token değerleri oraya JS ile enjekte edilir.

## Typography

Web, `next/font` ile Geist Sans ve Geist Mono kullanır; mobil sistem yazı tipini kullanır. Ölçek `display` (32) → `caption` (12) arasındadır. Fiyat, yüzde, oran ve skor gösteren her sayı `tabular-nums` ile basılır ki sütunlar hizalı kalsın. Bölüm başlıkları küçük, büyük harf ve geniş aralıklı etiketlerdir (`{components.section-label}`); sayfa başlıkları `h1`/`h2`'dir. Metrik Puanı büyük ve nötr renkli bir sayıdır (`{components.score-value}`).

## Layout & Spacing

4px tabanlı ölçek kullanılır. Web'de içerik tek sütundur ve `max-w-3xl` (768px) ile ortalanır. Panel, hisse sayfası ve listeler bu genişliktedir; karşılaştırma tablosu gibi geniş tablolar yatay kaydırılır. Bölümler arası boşluk `{spacing.8}`, kart içi `{spacing.4}`. Mobilde hedef ekran kenar boşluğu `{spacing.4}`'tür; `PortfolioScreen` gibi bazı ekranlarda yatay boşluk yok (16.6 denetiminde kapanır).

Panel'in hızlı erişim ızgarası mobil genişlikte 4, `sm` ve üstünde 8 sütundur ve sayfanın en üstündedir (Story 1.8).

## Elevation & Depth

Derinlik gölgeyle değil, zemin tonuyla verilir: canvas → surface → surface-elevated. Gölge yalnızca vurgulanan arama kartında ve hover durumunda kullanılır (`shadow-lg shadow-black/20`). Hover'da kart 2px yukarı kalkar ve kenarlığı accent'e döner.

## Shapes

Girdi ve chip'ler `{rounded.sm}`/`{rounded.md}`, kartlar ve hızlı erişim karoları `{rounded.lg}`, avatar ve durum rozetleri `{rounded.full}`. Keskin köşe kullanılmaz.

## Components

Web primitifleri `apps/web/src/components/ui/` altındadır: `Button`, `Card`/`CardHeader`/`CardTitle`, `Input`/`Select`/`Label`/`Field`, `ChangeValue`/`Badge`, `ToggleChip`, `PageHeader`, `Skeleton`, `StatTable`, `ProgressBar`, `ProseText`, `Logo` ve `ThemeToggle`. Mobilde bunların eşdeğerleri her ekranın `makeStyles(colors)` fonksiyonundadır. Ortak bir mobil bileşen kütüphanesi yoktur.

- **Kart:** `{components.card}`. Her içerik bloğu bir karttır.
- **Değişim değeri (`ChangeValue`):** Ok ya da işaret, yüzde ve `{components.change-value}` renkleri. Sıfır nötr renktedir.
- **Metrik Puanı:** Nötr renkte `NN / 100`, altında gerekçe metni ve kategori kırılımı. Al/Sat/Nötr rozeti yoktur (Story 12.1). Kategori çubukları (`ProgressBar`) değere göre positive/warning/negative renklenir (kullanıcı kararı 2026-10-09: böyle kalıyor).
- **Sinyal listesi:** Yuvarlak ikon rozeti (boğa positive/15, ayı negative/15), kural adı ve sağda tarih. Satırlar `border-subtle` ile ayrılır.
- **Grafik:** `{components.chart}`. Web'de doğrudan, mobilde WebView içinde lightweight-charts kullanılır.
- **Gelişme kartı (Epic 13):** Olay listesi, AI notu (Ne oldu / Veride neyi değiştiriyor / Dikkat edilebilecek riskler) ve etki tonu, kaynak bağlantılı haber başlıkları, okunmamış rozeti. Yönlendirme dili kullanılmaz.
- **Uyarı ibaresi:** `{components.disclaimer}`. Analiz gösteren her kartın veya sayfanın altında yer alır.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Renkleri token'dan al (`bg-surface`, `colors.surface`) | Bileşene hex kodu yazmak |
| Yeşil/kırmızıyı yalnızca işaretli değişim için kullan | Bir skoru, AI raporunu veya hisseyi yeşil/kırmızıyla "iyi/kötü" göstermek |
| Sayılarda `tabular-nums` | Orantılı rakamlarla tablo |
| Her analiz yüzeyinde uyarı ibaresi | İbareyi yalnızca sayfa altına bir kez koymak |
| Karanlık ve açık modu aynı değişiklikte test etmek | Bir ekranı yarı temalandırılmış bırakmak |
| Tek sütun, `max-w-3xl` | Panelde çok sütunlu yoğun düzen |
