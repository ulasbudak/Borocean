---
title: "Epic 13 — Portföy Gelişme Takibi (Arka Plan AI Taraması): Karar Notu"
status: draft
created: 2026-09-28
updated: 2026-09-28
author: Bob (BMAD Scrum Master) — kullanıcı isteğiyle, 2026-09-28
relatedDocs: ["docs/PRD.md §5.15", "docs/epics.md §17 (Epic 13)", "docs/compliance.md", "docs/architecture.md AD-8"]
---

# Epic 13 — Portföy Gelişme Takibi (Arka Plan AI Taraması): Karar Notu

*İngilizce versiyon: [`docs/product-brief-epic13-portfolio-insights.en.md`](product-brief-epic13-portfolio-insights.en.md).*

## İstek

Kullanıcı (2026-09-28): "Portföydeki hisselerin günlük AI raporları arka planda önemli bir detay yakaladığında, bu portföyde ve kullanıcı sayfasında görünsün."

Bugün AI raporları (Epic 9) yalnızca kullanıcı hisse sayfasında "Rapor Oluştur"a bastığında üretiliyor. Portföyündeki bir şirket bilanço açıkladığında, sert bir fiyat hareketi yaşadığında veya önemli bir SEC dosyası yayımladığında kullanıcının bunu fark etmesi için her hisseyi tek tek açması gerekiyor. İstenen, uygulamanın bunu **kendiliğinden, her gün** yapması ve yalnızca **önemli** bir şey olduğunda kullanıcının önüne getirmesi.

## Temel kararlar

### 1. "Önemli detay"ı kim belirliyor? — Önce kural, sonra AI

- **Seçenekler:** (a) her gün her hisse için tam bir AI raporu üretip önemli olup olmadığına LLM'in karar vermesi; (b) deterministik kuralların "olay" yakalaması, LLM'in yalnızca olay olan hisseler için açıklama yazması.
- **Karar: (b).**
  - (a) her gün `sembol sayısı × 3` LLM çağrısı demek; Gemini'nin ücretsiz kotası ve maliyet bunu taşımaz.
  - (a)'da "önemli" kararı açıklanamaz ve tekrarlanamaz olur. Aynı veriye bir gün "önemli", ertesi gün "önemsiz" diyebilir.
  - (a) SPK açısından da daha riskli: bir modelin "şu hissede dikkat!" demesi, kuralın "günlük değişim %-7,2" demesinden daha yönlendiricidir.
  - (b) mevcut felsefeyle aynı: Story 3.5'in sinyal motoru deterministik, AI yalnızca açıklama katmanı.
- **Olay türleri (ilk sürüm önerisi):**

| Olay | Kaynak | Varsayılan eşik (Story 13.1'de kalibre edilecek) |
|---|---|---|
| Sert fiyat hareketi | günlük mum (mevcut `get_us_candles`) | \|günlük değişim\| ≥ max(%5, son 60 günün günlük oynaklığının 2,5 katı) |
| Olağandışı hacim | günlük mum | hacim ≥ 20 günlük ortalamanın 3 katı |
| 52 haftalık zirve/dip | günlük mum | kapanış 52 haftanın en yükseği/en düşüğü |
| Önemli teknik olay | Story 3.5 `evaluate_signals` | yalnızca bugün tetiklenen Golden/Death Cross ve Bollinger kırılımları |
| Bilanço açıklandı | Finnhub `stock/earnings` | yeni bir dönem göründüğünde; beklentiden sapma yüzdesiyle |
| Yaklaşan bilanço | Finnhub `calendar/earnings` | 3 gün içinde (bilgi amaçlı, düşük önem) |
| Önemli SEC dosyası | Finnhub `stock/filings` | yeni 8-K (önemli olay bildirimi), 10-Q/10-K |
| Temel metrik değişimi | mevcut `get_us_fundamentals` | önceki kayda göre F/K, borç/özsermaye, net marj veya EPS büyümesinde eşik üstü değişim |
| İçeriden işlem yoğunluğu | Finnhub `stock/insider-transactions` | **ikinci faz**: gürültülü, eşik kalibrasyonu gerekiyor |

- Her olayın deterministik bir **önem puanı** var. Günün "önemli" sayılması, puanı eşiği geçen en az bir olay olmasına bağlı. **Hedef:** sıradan bir günde portföy hisselerinin yaklaşık %10'undan azı işaretlenmeli, yoksa kartlar gürültüye dönüşür. Eşikler Story 13.1'de geçmiş veriyle kalibre edilecek.

### 2. Arka planda kim çalıştırıyor? — Supabase `pg_cron` + `pg_net`

Projede bugüne kadar zamanlanmış iş yok. AD-8 (Celery + Redis) hiç kurulmadı; her şey istek anında hesaplanıyor. Bu epic gerçek bir zamanlayıcı gerektiren ilk özellik.

| Seçenek | Maliyet | Güvenilirlik | Not |
|---|---|---|---|
| GitHub Actions cron | 0 | **Kötü** | `keep-api-warm.yml` ile denendi: 10 dakikada bir yerine ~14 saatte 3 kez çalıştı, 2026-09-26'da kaldırıldı |
| Render Cron Job | ücretli | İyi | Ücretsiz planda yok; kullanıcı $0 maliyeti tercih etti |
| Celery + Redis (AD-8) | Redis + worker instance | İyi | Ücretsiz Render'da ayrı worker yok; aşırı altyapı |
| İstek anında (portföy açılınca) | 0 | — | "Arka planda" isteğini karşılamaz; ilk açılışta 10+ saniye bekletir |
| **Supabase `pg_cron` + `pg_net`** | **0** | İyi | İki eklenti de dev projesinde mevcut (kurulu değil, 2026-09-28'de doğrulandı). Veritabanının kendi zamanlayıcısı API'ye HTTP isteği atar |

- **Karar: `pg_cron` + `pg_net`.** Her gün ABD seansı kapandıktan sonra (22:30 UTC, TR 01:30) `pg_net.http_post` ile API'nin `POST /internal/insights/run` uç noktası çağrılır.
- **Uç nokta:**
  - Paylaşılan bir sır başlığıyla (`X-Cron-Secret`) korunur.
  - Hemen `202` döner ve işi arka planda (`BackgroundTasks`) yürütür.
  - **İdempotenttir:** o gün işlenmiş sembolleri atlar. Bu yüzden aynı gece 23:30 ve 00:30'da tekrar tetiklemek yarım kalan işi tamamlar (Render yeniden başlarsa veya kota dolarsa).
- **Güvenlik ağı:** Kullanıcı portföyünü açtığında bugünün çalışması hiç başlamamışsa, uyarı gösterilir ve çalıştırma tetiklenir.
- Bu karar `docs/architecture.md`'ye AD-8'i fiilen değiştiren yeni bir karar olarak işlenmeli (Story 13.2).

### 3. Maliyet ve kota bütçesi

- **Evren:** tüm kullanıcıların portföylerindeki **farklı** ABD sembolleri (BIST şu an kapalı). Rapor sembol başına bir kez üretilir ve o hisseyi tutan herkese gösterilir (Story 9.1'in global önbellek deseni). Kullanıcı sayısı değil, sembol sayısı maliyeti belirler.
- **Twelve Data (mum):** ücretsiz plan dakikada 8, günde 800 istek; canlı kullanıcılarla paylaşılıyor. Gece çalışması dakikada en fazla 4 istek kullanır ve günlük bir tavanla sınırlanır (başlangıç önerisi: 300 sembol). Tavan aşılırsa sıralama önceliklidir: en çok kullanıcının tuttuğu semboller önce.
- **Finnhub (bilanço, dosya, temel veri):** dakikada 60 istek; sembol başına 3–4 çağrı. 300 sembol ≈ 20 dakika, sorun değil.
- **Gemini:** yalnızca olay olan semboller için çağrılır. Günlük tavan var (başlangıç: 50 özet). Tavanı aşan olaylar özetsiz, yalnızca deterministik olay listesiyle gösterilir.

### 4. Nerede görünüyor?

- **Portföy sayfası (web + mobil):** Gelişmesi olan pozisyon satırında bir rozet ("Yeni gelişme"). Tıklayınca gelişme kartı açılır: olaylar, AI notu, tarih, hisse sayfasına bağlantı. Portföy başlığının altında son 7 günün gelişmelerini gösteren bir şerit.
- **Kullanıcı sayfası:** Panelde (web `/dashboard`, mobil `HomeScreen`) "Portföyündeki Gelişmeler" kartı; okunmamış sayısı ve son gelişmeler. *Varsayım:* "kullanıcı sayfası" giriş sonrası ana sayfa, yani Panel. Açık soru 1'e bakın.
- **Hisse detay sayfası:** "Son gelişmeler" bölümü (aynı veri; ücretsiz ek yüzey).
- **Okundu durumu:** kullanıcı bazlı. Okunmamış gelişmeler rozetle vurgulanır, görüldükten sonra rozet kalkar.

### 5. Uyum (Epic 12 / `docs/compliance.md`)

- Gelişme kartı **ne olduğunu** anlatır, **ne yapılacağını** söylemez. "Pozisyonunu gözden geçir", "satmayı düşün", "fırsat" gibi ifadeler yasak. AI notu `COMPLIANCE_RULES` ile üretilir ve yapısı şöyledir: "Ne oldu / Veride neyi değiştiriyor / Dikkat edilebilecek riskler".
- Olay etkisi "olumlu / olumsuz / nötr" olarak sınıflandırılabilir. Bu, paylaşılan değerlendirmede KAP analizi için örnek verilen türden bir analizdir. Ancak "olumsuz" etiketi bir satış çağrısına dönüşmemeli.
- **Kullanılmayacak veri:** Finnhub `stock/recommendation` (analistlerin güçlü al/al/tut/sat sayıları). Başkasının al/sat tavsiyesini aktarmak da yönlendirmedir.
- **Haberler:** yalnızca başlık, kaynak ve bağlantı; metin kopyalanmaz (telif). Finnhub ücretsiz planının ticari kullanım koşulu `docs/compliance.md` §4'te zaten açık madde.
- **Portföye göre gösterim:** Hangi gelişmelerin gösterileceğinin kullanıcının pozisyonlarına göre seçilmesi, kişiye özel yatırım önerisi değil, kişiselleştirilmiş bilgilendirmedir. Yine de bu ayrım avukat incelemesine eklenmeli (compliance §4, madde 1).
- **KVKK:** Yeni kişisel veri yalnızca okundu durumu. Aydınlatma metnindeki amaç listesine "portföyünüzdeki hisselere ait gelişmeleri göstermek" eklenmeli. Okundu tablosu `auth.users` üzerinden `ON DELETE CASCADE` olmalı (hesap silme ile uyum).

### 6. Freemium

Şu an `ALL_FEATURES_FREE` açık. Mekanizma yine de baştan kurulur (Story 8.1 deseni):
- Deterministik olay listesi herkese açık.
- AI notu `Entitlement.ai_reports` gerektirir.

Bayrak kapatıldığında ücretsiz kullanıcı gelişmeyi görür ama AI açıklamasını göremez. Bu, doğal bir yükseltme gerekçesi olur.

## Kararlar (2026-09-28, kullanıcı)

1. **Kullanıcı sayfası = Panel** (web `/dashboard`, mobil `HomeScreen`).
2. **Kapsam: önce portföy.** İzleme listesi ileride (Story 13.7).
3. **Bildirim:** hisse gelişmeleri için **mobil push olacak, e-posta olmayacak**. Story 13.6 ilk sürüme alındı; günde en fazla bir özet push.
4. **Tarama sıklığı: günde bir kez, sabah açılıştan önce.**
   - Zaman: **05:30 UTC (TR 08:30)**. Bu saat önceki ABD seansı kapanmış, BIST (TR 10:00) ve ABD (TR 16:30) açılışlarından önce; kullanıcı güne başlarken gelişmeler hazır olur.
   - Yarım kalan iş için 06:30 ve 07:30 UTC'de yeniden tetiklenir.
   - Bedeli: ABD'de seans öncesi açıklanan bilançolar ertesi sabahki taramada yakalanır.
   - Bu karar §2'deki 22:30 UTC önerisinin yerini alır.
5. **Haber başlıkları gösterilecek**, kaynak adı ve orijinal habere bağlantıyla. Yalnızca başlık gösterilir, metin kopyalanmaz. Başlıklar olay tetiklemez; olayı olan hisselerin kartına bağlam olarak eklenir (son 48 saatten en fazla 3 başlık).

## Sonraki adım

`docs/stories/story-13.1.md` açılır. İlk görevi, eşiklerin geçmiş veriyle kalibrasyonu ve "sıradan günde portföy hisselerinin <%10'u" hedefinin doğrulanmasıdır.
