---
name: Borocean
status: final
updated: 2026-10-09
sources:
  - ../../PRD.md
  - ../../compliance.md
  - ../../stories/story-ui-ux.md
  - ../initiative-borocean.md
---

# Borocean — Experience Spine

Bu belge, canlıdaki ürünün nasıl davrandığını kayda geçirir (brownfield). Görsel kimlik [`DESIGN.md`](DESIGN.md)'dedir; bu belge davranışı anlatır ve token'lara `{colors.accent}` biçiminde atıf yapar. Bu belge ile bir mock ya da ekran görüntüsü çeliştiğinde bu belge geçerlidir. `[ASSUMPTION]` etiketli satırlar kullanıcı onayı bekler.

## Foundation

- **Yüzeyler:** Duyarlı web (borocean.com, Next.js App Router) ve mobil uygulama (Expo, iOS/Android; mağaza yayını ileriki planlarda).
- **UI sistemi:** Web'de Tailwind v4 ve kendi primitifleri (`apps/web/src/components/ui`); mobilde `useTheme()` + `makeStyles(colors)`.
- **Paylaşılan kaynaklar:** Metinler, indikatör hesapları ve token'lar `@borocean/shared`'dadır. İki platform aynı metni ve aynı sayıyı gösterir (AD-2, AD-16).
- **Kullanıcı:** Türkçe konuşan bireysel yatırımcı. Amatörden aktif trader'a kadar; ABD hisseleri (BIST geçici olarak kapalı).
- **Düzenleyici çerçeve:** SPK yatırım danışmanlığı sınırı ve KVKK. Ürün hiçbir yerde yönlendirme yapmaz (docs/compliance.md).

## Information Architecture

| Yüzey | Web | Mobil | Nereden ulaşılır | Amaç |
|---|---|---|---|---|
| Karşılama | `/` | — | Arama motoru, paylaşım | Ürünü tanıtır; Giriş ve Kayıt düğmeleri |
| Giriş / Kayıt | `/login`, `/signup` | AuthScreen (iki mod) | Karşılama, oturum yok | Ayrı ekranlar; kayıtta ad ve onay kutusu (Story 1.9) |
| Şifre sıfırlama | `/forgot-password` → `/reset-password` | Web akışını tarayıcıda açar | Giriş | E-postayla sıfırlama |
| Panel (ana sayfa) | `/dashboard` | HomeScreen | Giriş sonrası | Selamlama, hızlı erişim, arama, gelişmeler, öne çıkanlar, son bülten |
| Hisse sayfası | `/stock/[exchange]/[symbol]` | StockOverviewScreen | Arama, listeler, kartlar | Sekmeler: Genel Bakış / Temel / Teknik / AI |
| İzleme listesi | `/watchlist` | WatchlistScreen | Hızlı erişim | Birden çok liste, hisse ekle/çıkar |
| Portföy | `/portfolio` | PortfolioScreen | Hızlı erişim, push | Çoklu portföy, pozisyonlar, kâr/zarar, gelişmeler |
| Fiyat alarmları | `/alerts` | AlertsScreen | Hızlı erişim, e-posta/push | Eşik alarmı kur/sil |
| Sinyal alarmları | `/signal-alerts` | SignalAlertsScreen | Hızlı erişim | Kural bazlı alarm |
| Tarama | `/screener` | ScreenerScreen | Hızlı erişim | Kriterle tarama, kayıtlı taramalar |
| Karşılaştırma | `/compare` | CompareScreen | Hızlı erişim | 2–4 hisse yan yana |
| Simülasyon | `/simulation` | SimulationScreen | Hızlı erişim, hisse sayfası | Sanal bütçeyle alım-satım |
| Bültenler | `/bulletins` | BulletinsScreen | Paneldeki "Tüm bültenler" | Günlük sektör bülteni arşivi |
| Ayarlar | `/settings` | SettingsScreen | Hızlı erişim | Kullanıcı adı, dil, tema (yalnızca web), ilgi alanları, bildirimler, hesap silme |
| Hukuki | `/terms`, `/kvkk`, `/privacy` | Web bağlantısı | Kayıt, alt bilgi | Koşullar, aydınlatma, gizlilik |

- **Web gezinme:** Panel'in en üstündeki 8 karoluk hızlı erişim ızgarası birincil gezinmedir. Alt sayfalar `PageHeader` ile Panel'e geri döner. Kalıcı bir üst menü ya da yan menü yoktur.
- **Mobil gezinme:** HomeScreen, alt ekranları durum bayraklarıyla tam ekran açar; her ekranın bir "geri" düğmesi vardır. Gezinme kütüphanesi yoktur. `[ASSUMPTION]` Android donanım geri tuşu ve derin bağlantılar alt ekranları hedefleyemiyor; push bildirimi yalnızca portföy ekranını açar.

Görsel referans: [`mockups/key-panel.html`](mockups/key-panel.html), [`mockups/key-stock.html`](mockups/key-stock.html), [`mockups/key-mobile-portfolio.html`](mockups/key-mobile-portfolio.html). Çelişkide bu belge geçerlidir.

## Voice and Tone

Mikro metin kuralları. Marka duruşu `DESIGN.md` › Brand & Style'dadır.

| Do | Don't |
|---|---|
| "Merhaba, Ayşe" (sen diliyle, adla) | "Sayın kullanıcımız" |
| "Kayıtlı hesap bulunamadı." / "Şifre hatalı." | "Bir hata oluştu, lütfen tekrar deneyin." (sebep vermeden) |
| "Apple (AAPL) 180 seviyesinin üstüne yükseldi." | "AAPL'yi şimdi al!" / "Satış fırsatı" |
| "Metrik Puanı 72 / 100 — Bu puan neye dayanıyor?" | "Güçlü Al", "Sat sinyali", hedef fiyat |
| "Ne oldu / Veride neyi değiştiriyor / Dikkat edilebilecek riskler" | "Ne yapmalısın" |
| Kullanıcının kendi sanal işlemi için eylem etiketi: "Simülasyonda al" | Bir hisse için öneri anlamına gelen "Al" / "Sat" etiketi |
| "Henüz bir fiyat alarmın yok." | Boş ekranda açıklamasız beyazlık |
| "Veri şu an güncellenemiyor." | Sessizce eski veya boş değer göstermek |
| Her analiz yüzeyinde: "Bu içerik yatırım tavsiyesi değildir…" | İbareyi gizlemek ya da yalnızca bir kez göstermek |

Varsayılan dil Türkçedir, İngilizce tam karşılıktır. Sunucudan gelen e-posta ve push metinleri kullanıcının dilindedir (AD-13). AI metinleri de kullanıcının arayüz dilinde üretilir; bugün yalnızca Türkçe üretiliyor ve Story 15.11 bunu kapatır.

## Component Patterns

Davranış kuralları. Görsel tanımlar `DESIGN.md` › Components'tadır.

| Bileşen | Nerede | Davranış |
|---|---|---|
| Hisse arama (`SearchBox`) | Panel, karşılaştırma | Yazdıkça sonuç; sonuçta borsa etiketi; tıklayınca hisse sayfası. "Sonuç bulunamadı." durumu |
| Sembol otomatik tamamlama | Portföy, simülasyon, alarm formları | Aynı arama; seçim yapılmadan form gönderilemez |
| Hızlı erişim karosu | Panel üstü | Tek dokunuşla alt sayfa; hover'da yükselir (web) |
| Metrik Puanı | Hisse › Genel Bakış | Sayı + gerekçe; "Bu puan neye dayanıyor?" açılır kırılım. Renk nötr |
| Sinyal listesi | Hisse › Teknik | En yeni üstte; her satır yön, kural ve tarih |
| Grafik | Hisse › Teknik | Zaman dilimi chip'leri, indikatör ekle/çıkar, trend ve yatay çizgi çizimi (kaydedilir) |
| AI raporu | Hisse › AI | İstek üzerine; üretilirken iskelet; altında model ve uyarı ibaresi; çıktı önbellekten gelebilir |
| Gelişme kartı | Panel, portföy, hisse sayfası | Okunmamış rozeti; açınca okundu sayılır; haber başlıkları kaynak bağlantısıyla yeni sekmede açılır |
| İzleme listesine ekle / Alarm kur / Simülasyonda al | Hisse sayfası başlığı | Satır içi panel veya form; başarıda kısa onay metni |
| Değişim değeri | Her yer | İşaret + yüzde; yeşil/kırmızı yalnızca yön için. `[ASSUMPTION]` Yüzde Türkçede de noktalı yazılıyor (`formatChange`, "+1.00%"); 16.7 düzeltir |
| Tema değiştirici | Web › Ayarlar | Sistem / koyu / açık; tercih tarayıcıda saklanır; ilk boyamadan önce uygulanır |
| Hesabı sil | Ayarlar | "SİL" yazmadan düğme etkinleşmez; başarıda karşılama sayfasına döner |

## State Patterns

| Durum | Yüzey | Davranış |
|---|---|---|
| İlk yükleme | Kart içerikleri | `Skeleton` blokları beklenen düzeni taklit eder |
| Boş liste | İzleme, alarm, portföy, simülasyon, bülten | Tek cümlelik boş durum metni (i18n `emptyList` vb.) ve mümkünse birincil aksiyon |
| Veri sağlayıcı hatası | Hisse sayfası, tarama | "Veri şu an güncellenemiyor." uyarısı; sessiz boşluk yok (NFR-2) `[ASSUMPTION]` tarama ve öne çıkanlarda Finnhub sınırı aşılınca uyarı gösterilmiyor (CR H2) |
| Gecikmeli veri | Hisse sayfası | `DataDelayDisclosure` notu |
| Yetersiz veri | Metrik Puanı | "Yeterli veri yok" |
| BIST | Arama, seçimler | Gizli; uygulamada "şu an devre dışı" notu |
| Oturum yok | Korumalı sayfalar | `/login`'e yönlenir |
| E-posta doğrulanmamış | Kayıt sonrası | "E-postanı doğrula" ekranı |
| Form hatası | Giriş, kayıt, formlar | Alanın altında satır içi, çevrilmiş mesaj |
| AI üretiliyor | Hisse › AI | Düğme devre dışı, iskelet; hata olursa yeniden dene |
| Okunmamış gelişme | Panel kartı, portföy satırı | Sayılı rozet; okununca kalkar |

## Interaction Primitives

- Dokunma veya tıklama ile hareket; sürükle-bırak yok (grafik çizimi hariç).
- Web'de klavye: formlar Enter ile gönderilir, sekmeler ve chip'ler odaklanabilir düğmelerdir. Kısayol tuşu yok.
- Uzun listelerde sayfa yerine tam liste gösterilir (veri küçük); sonsuz kaydırma yok.
- İyimser güncelleme yok: sunucu onaylayınca liste yenilenir `[ASSUMPTION]`.
- Yasak: modal üstüne modal, yalnızca hover ile görünen aksiyon (mobil genişlikte), otomatik oynatılan bildirim sesleri.

## Accessibility Floor

`[ASSUMPTION]` Hedef WCAG 2.2 AA; resmi bir denetim yapılmadı.

- Kontrast: normal metin en az 4.5:1. **Bilinen açık (ölçüldü 2026-10-09):** `text-tertiary` (koyu 3.82, açık 2.56), koyu birincil düğme metni (3.38), açık `positive` (3.30) ve `warning` (3.19) bu sınırın altında. Story 16.1 kapatır; o zamana kadar uyarı ibaresi gibi zorunlu metinler `text-secondary` ile yazılmalıdır.
- Yön bilgisi yalnızca renkle verilmez: değişim değeri işaret (+/−) taşır, sinyal satırı yön etiketi taşır.
- Hızlı erişim `nav` öğesi `aria-label` taşır. Sekmeler ve chip'ler `role="group"` içinde gerçek düğmelerdir.
- Grafik tek başına bilgi taşımaz: aynı veri sinyal listesinde ve metrik satırlarında metin olarak vardır.
- Mobilde dokunma hedefleri en az 44pt `[ASSUMPTION]`.

## Responsive & Platform

| Genişlik | Davranış |
|---|---|
| `< sm` | Hızlı erişim 4 sütun; tablolar yatay kaydırılır |
| `≥ sm` | Hızlı erişim 8 sütun; içerik `max-w-3xl` ortada |
| Mobil uygulama | Aynı bölümler tek sütun; grafik WebView'da; tema sistem tercihine uyar (manuel seçim yok) |

## Compliance in the UI

Ürüne özgü bölüm. Kurallar `docs/compliance.md`'dedir; burada nasıl göründükleri yazılıdır.

- Hiçbir yüzeyde al/sat/tut etiketi, hedef fiyat, getiri tahmini veya "fırsat" dili yoktur.
- Analiz gösteren her kartta (skor, sinyal, AI, gelişme, bülten) ve her bildirimde uyarı ibaresi bulunur.
- Kayıtta Kullanım Koşulları ve KVKK Aydınlatma Metni için zorunlu onay kutusu vardır; onay zamanı ve metin sürümü saklanır. `[ASSUMPTION]` Sosyal girişte de aynı onay alınmalı (CR D1; Story 14.4'ün ön şartı).
- Hesap silme Ayarlar'dadır ve geri alınamaz olduğu açıkça yazar.

## Key Flows

### Flow 1 — Sabah kontrolü (Ayşe, 34, muhasebeci; 08:40, işe giderken metroda, telefonda)

1. Ayşe telefonuna gelen "Portföyünde 2 gelişme" bildirimine dokunur.
2. Uygulama portföy ekranını açar; iki pozisyonda "Yeni gelişme" rozeti vardır.
3. NVDA satırını açar: olay listesi (bilanço açıklandı, sert fiyat hareketi), kısa AI notu ve kaynak bağlantılı iki haber başlığı.
4. Bir başlığa dokunur; haber tarayıcıda açılır, geri gelince portföy aynı yerdedir.
5. **Doruk:** Rozetler kalkar. Ayşe, ne yapması gerektiğini değil, ne olduğunu üç dakikada öğrenmiş olur ve kendi kararını vermek üzere telefonu cebine koyar. Uygulama ona bir şey satmaya çalışmamıştır.

Hata: AI notu üretilememişse olay listesi yine görünür, notun yerinde "Not şu an hazır değil." yazar.

### Flow 2 — Bir hisseyi incelemek (Mert, 27, yazılımcı; akşam, masaüstünde)

1. Mert Panel'deki aramaya "micro" yazar, Microsoft'u seçer.
2. Hisse sayfası Genel Bakış'la açılır: fiyat, günlük değişim, Metrik Puanı 68 / 100 ve gerekçesi.
3. Temel sekmesinde F/K'nın sektör ortalamasının altında olduğunu, Teknik sekmesinde RSI'ın 70'e yaklaştığını görür.
4. "Sinyal alarmı kur"a basar ve "RSI 70 üstüne çıkarsa" kuralını seçer.
5. **Doruk:** Ertesi gün öğleden sonra e-postasına "Borocean Sinyal Alarmı" gelir. Bağlantıdan alarmlar sayfasına gelir; alarm "tetiklendi" durumundadır. Takibi uygulama yapmıştır, karar yine Mert'indir.

Hata: Veri sağlayıcı yanıt vermezse sayfa "Veri şu an güncellenemiyor." der, alarm formu yine çalışır.

### Flow 3 — İlk kayıt (Zeynep, 22, öğrenci; Google'dan gelir)

1. Zeynep "hisse analizi uygulaması" araması sonucunda borocean.com'a gelir; başlığı ve özellik listesini okur.
2. "Kayıt Ol"a basar; ad, e-posta, şifre girer ve koşulları onaylar.
3. "E-postanı doğrula" ekranını görür; Türkçe onay e-postasındaki bağlantıya dokunur.
4. **Doruk:** Panel "Merhaba, Zeynep" diye açılır. Hızlı erişim en üstte, arama hemen altındadır; ilk hissesini bulması bir dakika sürmez.

Hata: Aynı e-postayla tekrar kayıt olmaya çalışırsa "Bu e-postayla bir hesap zaten var." mesajını ve Giriş bağlantısını görür.
