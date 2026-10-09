---
title: "Borocean (Borsa Takip Uygulaması) - Epic ve Story Backlog"
status: active
created: 2026-09-15
updated: 2026-09-28
author: Bob (BMAD Scrum Master)
inputDocuments: ["docs/PRD.md", "docs/architecture.md"]
---

# Borocean — Epic & Story Backlog

*İngilizce versiyon: [`docs/epics.en.md`](epics.en.md).*

## 1. Genel Bakış

Bu doküman, `docs/PRD.md` ve `docs/architecture.md` temel alınarak Faz 1 (MVP) kapsamındaki fonksiyonel gereksinimleri kullanıcı-değeri odaklı epic'lere ve tek bir geliştirici oturumunda tamamlanabilir story'lere ayırır. UX tasarım dokümanı (`bmad-ux`) henüz üretilmediği için bu backlog PRD + Architecture'a dayanır; UX spesifikasyonu hazırlandığında ilgili epiklere UX-DR (UX Design Requirement) satırları eklenmelidir.

## 2. Gereksinim Envanteri

### 2.1 Fonksiyonel Gereksinimler (Faz 1 / MVP kapsamı)

FR-001, FR-002, FR-003, FR-010, FR-011, FR-013, FR-020, FR-021, FR-022, FR-023, FR-024, FR-030, FR-031, FR-032, FR-040, FR-041, FR-042, FR-043, FR-050, FR-051, FR-052, FR-060, FR-061, FR-062, FR-070, FR-080, FR-081, FR-082, FR-083, FR-090, FR-091

*(Tam metinler için bkz. `docs/PRD.md` Bölüm 5.)*

### 2.2 Faz 2 — Bu Backlog Kapsamı Dışında

FR-012 (özelleştirilebilir metrik ağırlıklandırma), FR-025/FR-102 (ML tabanlı sinyal/örüntü tanıma), FR-033 (tarama bildirimi), FR-053 (portföy risk analizi), FR-063 (gelişmiş kişiselleştirme), FR-071 (SMS bildirim). Bu gereksinimler PRD Bölüm 8'e göre Faz 2'ye ertelenmiştir; aşağıdaki Epic 1-8'de ele alınmamıştır.

**İstisna — Epic 9:** FR-100 (AI hisse yorumu) ve FR-101 (deterministik grafik örüntü tanıma), teknik olarak Faz 2 kapsamında olsa da kullanıcı tarafından MVP (Epic 1-8) sonrası **ilk öncelik** olarak işaretlendiği için bu backlog'a Epic 9 olarak dahil edildi (bkz. §13 ve `docs/product-brief-epic9-ai.md`).

### 2.3 Fonksiyonel Olmayan Gereksinimler (ilgili story'lerin kabul kriterlerine yansıtılmıştır)

NFR-1 Performans (arama <1sn, gerçek-zamanlı veri birkaç sn içinde), NFR-2 Güvenilirlik (%99.5+ uptime, sessiz hata yok), NFR-3 Veri Doğruluğu/Sorumluluk Reddi, NFR-4 Güvenlik (şifreli veri, JWT), NFR-5 Ölçeklenebilirlik, NFR-6 Platformlar Arası Tutarlılık, NFR-7 Yasal/Uyumluluk.

### 2.4 Mimariden Gelen Ek Gereksinimler

- Monorepo iskeleti: `apps/web` (Next.js), `apps/mobile` (React Native/Expo), `apps/api` (FastAPI) — bkz. `architecture.md` §12.
- Backend OpenAPI şeması → frontend tip üretimi pipeline'ı (AD-2).
- Supabase Auth entegrasyonu ve JWT doğrulama middleware'i (AD-3).
- Piyasa verisi sağlayıcı adaptör arayüzü (`MarketDataProvider`) — AD-5.
- Redis pub/sub tabanlı WebSocket gateway (AD-4).
- Celery + Redis broker ile zamanlanmış işler (AD-8).
- RevenueCat webhook entegrasyonu, entitlement önbelleği (AD-7).
- TradingView Lightweight Charts entegrasyonu — web native, mobil WebView (AD-9).
- Sentry hata izleme, CI/CD (GitHub Actions → Vercel/Railway/EAS).

## 3. FR Kapsam Haritası

| FR | Epic |
|---|---|
| FR-060, FR-090, FR-091, FR-001, FR-002 | Epic 1 |
| FR-010, FR-011, FR-013 | Epic 2 |
| FR-020, FR-021, FR-022, FR-023, FR-024, FR-003 | Epic 3 |
| FR-030, FR-031, FR-032 | Epic 4 |
| FR-040, FR-041, FR-042, FR-043, FR-070 | Epic 5 |
| FR-050, FR-051, FR-052 | Epic 6 |
| FR-061, FR-062 | Epic 7 |
| FR-080, FR-081, FR-082, FR-083 | Epic 8 |
| FR-100, FR-101 | Epic 9 |
| FR-110, FR-111, FR-112 | Epic 10 |
| FR-120 – FR-126 | Epic 11 |
| FR-130, FR-131 | Epic 12 |
| FR-140 – FR-146 | Epic 13 |
| — (altyapı, mevcut FR-060/FR-043/NFR-7) | Epic 14 |

## 4. Epic Listesi

### Epic 1: Kimlik Doğrulama, Hisse Keşfi ve Temel Altyapı
Kullanıcı kayıt olup giriş yapabilir, tercih ettiği dilde uygulamayı kullanabilir, ABD (NYSE/NASDAQ) ve BIST hisselerini arayıp temel genel bakış bilgilerini görebilir. Bu epic aynı zamanda tüm sonraki epiklerin üzerine kurulacağı teknik temeli (monorepo, backend/frontend iskeleti, auth) kurar.
**FRs covered:** FR-060, FR-090, FR-091, FR-001, FR-002

### Epic 2: Temel Analiz (Fundamental)
Kullanıcı, seçtiği hissenin dünya standardı temel analiz metriklerini ve sektör ortalamasına göre konumunu görebilir.
**FRs covered:** FR-010, FR-011, FR-013

### Epic 3: Teknik Analiz ve Özet Değerlendirme Skoru
Kullanıcı interaktif grafik üzerinde geniş bir indikatör kütüphanesi kullanabilir, kural bazlı otomatik sinyaller görebilir ve hissenin temel+teknik verilerin birleşiminden türetilen özet bir değerlendirme skorunu görebilir.
**FRs covered:** FR-020, FR-021, FR-022, FR-023, FR-024, FR-003

### Epic 4: Tarama (Screener) ve Karşılaştırma
Kullanıcı, temel ve teknik kriterleri birleştirerek hisse taraması yapabilir, taramaları kaydedebilir ve birden fazla hisseyi yan yana karşılaştırabilir.
**FRs covered:** FR-030, FR-031, FR-032

### Epic 5: İzleme Listesi, Alarmlar ve Bildirimler
Kullanıcı hisseleri izleme listesine ekleyebilir, fiyat/indikatör bazlı alarm kurabilir ve tetiklenen alarmlar için push/e-posta bildirimi alabilir.
**FRs covered:** FR-040, FR-041, FR-042, FR-043, FR-070

### Epic 6: Portföy Takibi
Kullanıcı sahip olduğu hisseleri portföyüne ekleyip anlık değer ve kâr/zarar durumunu birden fazla portföy üzerinde takip edebilir.
**FRs covered:** FR-050, FR-051, FR-052

### Epic 7: Kişiselleştirme
Kullanıcı ilgi alanına göre öne çıkan hisseleri görebilir ve izlediği hisselere kişisel not ekleyebilir.
**FRs covered:** FR-061, FR-062

### Epic 8: Abonelik ve Monetizasyon (Freemium)
Kullanıcı ücretsiz katmanın sınırlarını görebilir ve premium katmana yükseltip gerçek zamanlı veri/geniş özellik setine erişebilir.
**FRs covered:** FR-080, FR-081, FR-082, FR-083

### Epic 9: AI Destekli Yorum ve Örüntü Tanıma (Faz 2 — MVP Sonrası İlk Öncelik)
Kullanıcı, hisse detay sayfasında güncel haberlere dayanan serbest formatlı bir AI yorumu okuyabilir ve fiyat grafiğinde otomatik tespit edilmiş trend/destek-direnç/formasyon bulgularını görebilir. Epic 1-8 (Faz 1 MVP) tamamlanmadan başlanmaz.
**FRs covered:** FR-100, FR-101 (FR-102/FR-025 bu epic'in ilerleyen bir alt-fazı, ayrı ele alınacak)

### Epic 10: Alım-Satım Simülasyonu (Paper Trading)
Kullanıcı sanal bir bütçeyle simülasyon oluşturup ABD hisselerini o anki gerçek fiyattan alıp satabilir, simülasyonun günlük değer ve kâr/zarar geçmişini görebilir. Gerçek para veya aracı kurum bağlantısı yoktur (PRD §10).
**FRs covered:** FR-110, FR-111, FR-112

### Epic 11: Kripto Para Piyasası (Backlog — başlamadı)
Kullanıcı kripto varlıkları arayıp detay sayfasında fiyat, grafik ve piyasa bilgilerini görebilir; bunları izleme listesi, alarm, portföy, simülasyon ve taramada hisselerle aynı akışlarla kullanabilir. Yalnızca veri, analiz ve sanal işlem — gerçek kripto alım-satımı veya cüzdan bağlantısı yok.
**FRs covered:** FR-120, FR-121, FR-122, FR-123, FR-124, FR-125, FR-126

### Epic 12: Hukuki Uyum (SPK ve KVKK)
Uygulama, kişiye yönelik al/sat/tut yönlendirmesi üretmeden bir analiz ve bilgilendirme aracı olarak kalır (SPK yatırım danışmanlığı sınırı); kullanıcı kişisel verilerinin nasıl işlendiğini okuyabilir ve hesabını tüm verileriyle kendisi silebilir (KVKK). Kullanıcının 2026-09-28'de paylaştığı hukuki değerlendirmeye dayanır; bkz. `docs/compliance.md`.
**FRs covered:** FR-130, FR-131

### Epic 13: Portföy Gelişme Takibi (Arka Plan AI Taraması) (Tamamlandı, canlıda — 2026-10-04)
Uygulama her gün, kullanıcı hiçbir şey yapmadan, portföylerdeki hisseleri tarar. Önemli bir gelişme yakaladığında (sert fiyat hareketi, bilanço, önemli SEC dosyası vb.) bunu kısa bir AI notuyla portföy ekranında ve Panelde gösterir. Gelişme kartı ne olduğunu anlatır, ne yapılacağını söylemez (Epic 12).
**FRs covered:** FR-140, FR-141, FR-142, FR-143, FR-144, FR-145, FR-146

### Epic 14: Alan Adı Sonrası Altyapı (borocean.com) (Backlog — 2026-10-09)
Alan adı olmadığı için ertelenen işler: alan adından e-posta gönderimi ve Supabase SMTP, alarm e-postaları, kurumsal iletişim adresleri, Google ile giriş, Apple ile giriş kararı, alan adı düzeni ve SEO.
**FRs covered:** yeni FR yok; mevcut FR-060 (sosyal giriş), FR-043/FR-070 (e-posta bildirimi), NFR-7 (KVKK iletişim) gereksinimlerinin canlıda tamamlanması.

**Epic bağımsızlığı notu:** Her epic bir öncekinin çıktısını kullanabilir (örn. Epic 3, Epic 2'nin ürettiği temel veri modelini kullanır) ama hiçbir epic sonraki bir epiğin tamamlanmasını beklemez. Epic 8 (Abonelik), Epic 1-7'de üretilen özellik sınırlarını freemium kapıları arkasına yerleştirir ama bu epiklerin fonksiyonelliğini değiştirmez.

---

## 5. Epic 1: Kimlik Doğrulama, Hisse Keşfi ve Temel Altyapı

### Story 1.1: Proje İskeleti ve Temel Altyapı Kurulumu ✅ Tamamlandı

> Detaylı, geliştirmeye hazır kabul kriterleri için bkz. **`docs/stories/story-1.md`** — bu ilk story, projenin geliştirmeye başlayabilmesi için gereken teknik temeli kurar.

Kısa özet: Monorepo (`apps/web`, `apps/mobile`, `apps/api`), Next.js/FastAPI/Expo iskeletleri, Supabase projesi bağlantısı, temel CI pipeline'ı ve ortam değişkeni yönetimi kurulur.

### Story 1.2: Kullanıcı Kaydı ve Girişi ✅ Tamamlandı

> Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-1.2.md`**. Backend (JWKS tabanlı JWT doğrulama + `/me`), web (`@supabase/ssr` ile e-posta/şifre + Google/Apple OAuth, `/dashboard`) ve mobil (e-posta/şifre ile kayıt/giriş) uygulandı ve doğrulandı. Mobilde native Google/Apple OAuth bilinçli olarak kapsam dışı bırakıldı (bkz. story dosyası — EAS dev-client ve gerçek sağlayıcı kimlik bilgileri gerektiriyor).

As a **yeni kullanıcı**,
I want e-posta veya Google/Apple hesabımla kayıt olup giriş yapabilmek,
So that kişisel izleme listemi, portföyümü ve tercihlerimi kaydedebileyim.

**Acceptance Criteria:**

- **Given** kayıtsız bir ziyaretçi, **When** e-posta ve şifre ile kayıt formunu doldurup gönderirse, **Then** Supabase Auth üzerinde hesap oluşturulur ve kullanıcı oturum açmış olarak yönlendirilir.
- **Given** kayıtlı bir kullanıcı, **When** Google veya Apple ile giriş yaparsa, **Then** OAuth akışı tamamlanır ve mevcut hesabıyla eşleştirilir.
- **Given** geçersiz kimlik bilgileri, **When** kullanıcı giriş yapmaya çalışırsa, **Then** anlaşılır bir hata mesajı gösterilir, hesap kilitlenmez.
- **And** oturum JWT'si her API isteğinde backend middleware'i tarafından doğrulanır (NFR-4); geçersiz/süresi dolmuş token 401 ile reddedilir.

### Story 1.3: Dil Seçimi ve Yerelleştirme Temeli

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-1.3.md`**. Çeviri/biçimlendirme mantığı `packages/shared` altında paylaşılan bir i18n modülüne taşındı; web (`Accept-Language` + cookie + `/settings` sayfası) ve mobil (`expo-localization` + `AsyncStorage` + yeni `SettingsScreen`) uygulandı ve doğrulandı. Dil tercihi, yeni bir backend tablosu eklemeden Supabase `user_metadata` üzerinden kalıcı hale getirildi.

As a **kullanıcı**,
I want uygulama dilini Türkçe veya İngilizce olarak seçebilmek,
So that uygulamayı kendi dilimde rahatça kullanabileyim.

**Acceptance Criteria:**

- **Given** ilk açılış, **When** kullanıcı cihaz/tarayıcı dili Türkçe veya İngilizce ise, **Then** uygulama o dilde açılır; desteklenmeyen bir dilse İngilizce varsayılan olur.
- **Given** ayarlar ekranı, **When** kullanıcı dili değiştirirse, **Then** tüm arayüz metinleri anında seçilen dile döner ve tercih kalıcı olarak kaydedilir (FR-090).
- **And** sayı/para birimi biçimleri (binlik ayraç, TL/USD gösterimi) seçilen dile ve piyasaya göre otomatik uyarlanır (FR-091).

### Story 1.4: Hisse Arama

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-1.4.md`**. Backend (`market_data` modülü: BIST için statik sembol dizini + ABD için Finnhub canlı arama, `GET /symbols/search`), web (`/dashboard` arama kutusu) ve mobil (`HomeScreen` arama) uygulandı ve doğrulandı.

As a **kullanıcı**,
I want sembol veya şirket adına göre ABD ve BIST hisselerini arayabilmek,
So that ilgilendiğim hisseyi hızlıca bulabileyim.

**Acceptance Criteria:**

- **Given** arama kutusu, **When** kullanıcı bir sembol veya şirket adı yazarsa, **Then** eşleşen sonuçlar borsa etiketiyle (NASDAQ/NYSE/BIST) 1 saniyenin altında listelenir (NFR-1).
- **Given** kısmi/hatalı yazım, **When** kullanıcı arama yaparsa, **Then** en yakın eşleşen semboller/şirket adları önerilir.
- **Given** sonuç bulunamaması, **When** arama tamamlanırsa, **Then** kullanıcıya "sonuç bulunamadı" durumu net şekilde gösterilir.

### Story 1.5: Hisse Genel Bakış Kartı

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-1.5.md`**. Backend (`GET /symbols/overview`: ABD için Finnhub `/quote` + `/stock/profile2`, BIST için statik dizin + "veri şu an güncellenemiyor" uyarısı), web (`/stock/[exchange]/[symbol]` sayfası, arama sonuçları bağlandı) ve mobil (`StockOverviewScreen`, arama sonucuna dokunma) uygulandı ve doğrulandı.

As a **kullanıcı**,
I want bir hisseyi açtığımda güncel fiyat, günlük değişim, piyasa değeri ve şirket bilgilerini görmek,
So that hisse hakkında hızlı bir ilk izlenim edinebileyim.

**Acceptance Criteria:**

- **Given** bir hisse detay sayfası, **When** sayfa yüklenirse, **Then** güncel fiyat, günlük değişim (% ve mutlak), piyasa değeri, sektör ve endüstri bilgisi gösterilir.
- **Given** piyasa veri sağlayıcısı geçici olarak erişilemez, **When** veri çekilemezse, **Then** sessiz hata yerine "veri şu an güncellenemiyor" uyarısı gösterilir (NFR-2).
- **And** sayfanın herhangi bir yerinde "yatırım tavsiyesi değildir" ibaresi sabit olarak yer alır (NFR-3, NFR-7).

### Story 1.6: BIST'in Geçici Olarak Devre Dışı Bırakılması

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-1.6.md`**. Kullanıcı isteği (2026-09-26): canlı BIST fiyat kaynağı olmadığından BIST arama/taramadan çıkarıldı, seçim listelerinden gizlendi ve uygulamada "şu an devre dışı" olarak belirtiliyor. Tek bayrakla (`BIST_ENABLED`, API + `@borocean/shared`) geri açılabilir. Aynı çalışmada Finnhub aramasının yabancı kotasyonları (`AAPL.TO`, `GARAN.E.IS`…) "US" diye döndürmesi düzeltildi.

### Story 1.7: Satır İçi Giriş Hataları, E-posta Onay Bildirimi ve Şifre Sıfırlama

- [x] **Tamamlandı (geriye dönük dokümante edildi)** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-1.7.md`**. Kod 2026-09-26'da story dokümanı olmadan `5e29760` commit'iyle yayımlandı. Giriş/kayıt hataları formda satır içi ve çevrilmiş olarak gösterilir (`authErrorKey`, web + mobil); canlıda "Confirm email" açık olduğundan kayıt sonrası "e-postanı doğrula" ekranı gösterilir; web'e `/forgot-password` → `/reset-password` akışı ve tasarlanmış `/error` sayfası eklendi. **Mobil (2026-09-28):** "Şifremi unuttum" bağlantısı web sıfırlama akışını cihaz tarayıcısında açıyor (PKCE doğrulayıcısı tarayıcıda olduğu için); doğrulama bildirimi zaten vardı.

### Story 1.8: Kullanıcı Adı ve Panelde Üst Menü

- [x] **Tamamlandı** — bkz. **`docs/stories/story-1.8.md`**. Kullanıcı isteği (2026-10-09). Kayıtta kullanıcı adı soruluyor (`user_metadata.display_name`). Sitede e-posta yerine ad görünüyor ve ayarlardan değiştirilebiliyor (web + mobil). Panel'deki hızlı erişim menüsü en üste taşındı.

### Story 1.9: Ayrı Giriş ve Kayıt Ekranları, Kayıtta Onay

- [x] **Tamamlandı** — bkz. **`docs/stories/story-1.9.md`**. Kullanıcı isteği (2026-10-09).
  - Giriş ve kayıt ayrı ekranlar (`/login`, `/signup`; mobilde iki mod).
  - Girişte kayıtsız e-posta için "kayıtlı hesap bulunamadı", kayıtlı e-posta için "şifre hatalı" (hız sınırlı API kontrolü).
  - Kayıtta Kullanım Koşulları + KVKK Aydınlatma Metni için zorunlu onay kutusu; onay tarihi ve metin sürümü saklanıyor.

---

## 6. Epic 2: Temel Analiz (Fundamental)

### Story 2.1: Temel Metriklerin Gösterimi

- [x] **Tamamlandı** — Detaylı kabul kriterleri, mimari yaklaşım ve görev tanımı için bkz. **`docs/stories/story-2.1.md`**. Backend (yeni `fundamentals` modülü: ABD için Finnhub `/stock/metric`, BIST için "veri yok" + uyarı; `GET /fundamentals`), web (hisse detay sayfasına "Genel Bakış"/"Temel Analiz" sekmeleri) ve mobil (`StockOverviewScreen`'e aynı sekmeler) uygulandı ve doğrulandı.

As a **kullanıcı**,
I want bir hissenin F/K, PD/DD, ROE, ROA, EPS, temettü verimi, borç/özsermaye, kâr marjı gibi temel metriklerini görmek,
So that hissenin finansal sağlığını değerlendirebileyim.

**Acceptance Criteria:**

- **Given** hisse detay sayfasının "Temel Analiz" sekmesi, **When** kullanıcı sekmeyi açarsa, **Then** PRD FR-010'da listelenen tüm metrikler güncel değerleriyle gösterilir.
- **Given** bir metrik için veri mevcut değilse, **When** sayfa render edilirse, **Then** metrik "veri yok" olarak işaretlenir, sayfa çökmez.
- **And** metrik değerleri, backend `fundamentals` modülünden gelen normalize edilmiş veri modeline göre gösterilir (mimari AD-5 ile uyumlu).

### Story 2.2: Sektör Kıyaslaması

- [x] **Tamamlandı** — Detaylı kabul kriterleri, mimari yaklaşım ve görev tanımı için bkz. **`docs/stories/story-2.2.md`**. Backend (`GET /fundamentals` yanıtına `sector_comparison` eklendi: Finnhub `/stock/peers` ile emsal şirketler, paralel çekilen metriklerin ortalaması ve `%` fark), web ve mobil (Temel Analiz sekmesindeki her metrik satırına sektör ortalaması + fark gösterimi) uygulandı ve doğrulandı.

As a **kullanıcı**,
I want her metriğin sektör/endeks ortalamasıyla karşılaştırmasını görmek,
So that hissenin sektörüne göre ucuz mu pahalı mı olduğunu anlayabileyim.

**Acceptance Criteria:**

- **Given** temel metrik listesi, **When** her metrik gösterilirse, **Then** yanında sektör ortalaması ve hissenin bu ortalamaya göre konumu (üstünde/altında, % fark) gösterilir (FR-011).
- **Given** hissenin sektör bilgisi eksikse, **When** kıyaslama hesaplanamazsa, **Then** kıyaslama alanı "sektör verisi yok" olarak gösterilir.

### Story 2.3: Geçmiş Finansal Performans Grafiği

- [x] **Tamamlandı** — Detaylı kabul kriterleri, mimari yaklaşım ve görev tanımı için bkz. **`docs/stories/story-2.3.md`**. Backend (yeni `GET /fundamentals/history`: Finnhub `/stock/metric` yanıtının `series` bölümünden hisse başına gelir/net kâr/EPS), web ve mobil ("Temel Analiz" sekmesine yıllık/çeyreklik geçişli, bağımlılıksız bar grafiği bölümü) uygulandı ve doğrulandı. Epic 2 (Temel Analiz) bu story ile tamamlandı.

As a **kullanıcı**,
I want şirketin son 5 yıl/20 çeyreklik gelir, net kâr ve EPS grafiğini görmek,
So that şirketin zaman içindeki finansal trendini değerlendirebileyim.

**Acceptance Criteria:**

- **Given** hisse detay sayfasının temel analiz sekmesi, **When** kullanıcı "Geçmiş Performans" bölümüne gelirse, **Then** son 5 yıl (yıllık) ve son 20 çeyrek (çeyreklik) gelir/net kâr/EPS grafik olarak gösterilir (FR-013).
- **And** kullanıcı yıllık/çeyreklik görünüm arasında geçiş yapabilir.

---

## 7. Epic 3: Teknik Analiz ve Özet Değerlendirme Skoru

### Story 3.1: İnteraktif Fiyat Grafiği

- [x] **Tamamlandı** — Detaylı kabul kriterleri, mimari yaklaşım ve görev tanımı için bkz. **`docs/stories/story-3.1.md`**. AD-9 ilk kez hayata geçirildi: Backend (yeni `GET /symbols/candles`: Finnhub `/stock/candle`, `intraday`/`daily`/`weekly`/`monthly` zaman dilimleri), web (`lightweight-charts` v5, native), mobil (`react-native-webview` köprüsü üzerinden aynı grafik motoru) — hisse detay sayfasına "Teknik Analiz" sekmesi eklendi. Uygulandı ve doğrulandı.

As a **kullanıcı**,
I want mum/çizgi/bar grafik türleri arasında geçiş yapıp farklı zaman dilimlerinde fiyat grafiğini incelemek,
So that fiyat hareketini istediğim şekilde analiz edebileyim.

**Acceptance Criteria:**

- **Given** hisse detay sayfasının "Teknik Analiz" sekmesi, **When** kullanıcı sekmeyi açarsa, **Then** TradingView Lightweight Charts ile mum grafiği varsayılan olarak gösterilir (AD-9).
- **Given** grafik araç çubuğu, **When** kullanıcı grafik türünü (mum/çizgi/bar) veya zaman dilimini (gün içi/günlük/haftalık/aylık) değiştirirse, **Then** grafik anında güncellenir (FR-020).
- **And** grafik hem web hem mobilde aynı veri sözleşmesiyle çalışır (mobilde WebView köprüsü üzerinden).

### Story 3.2: Çekirdek İndikatörler

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-3.2.md`**. İndikatör hesaplama mantığı (`packages/shared/src/indicators`) saf TS fonksiyonları olarak eklendi; web ve mobil, `lightweight-charts` v5'in overlay/pane API'siyle SMA/EMA/Bollinger'ı fiyat panelinde, RSI/MACD/Stokastik/Hacim'i ayrı panellerde gösteriyor; her indikatör tek tıkla eklenip kaldırılabiliyor. Uygulandı ve doğrulandı.

As a **kullanıcı**,
I want grafiğe SMA/EMA, RSI, MACD, Bollinger Bantları, Hacim, Stokastik gibi çekirdek indikatörleri ekleyebilmek,
So that temel teknik analiz yapabileyim.

**Acceptance Criteria:**

- **Given** grafik indikatör menüsü, **When** kullanıcı bir çekirdek indikatörü seçerse, **Then** indikatör grafiğe overlay/alt panel olarak eklenir (FR-021).
- **Given** birden fazla indikatör eklenmiş, **When** kullanıcı grafiği görüntülerse, **Then** tüm indikatörler okunabilir şekilde bir arada gösterilir.
- **And** kullanıcı eklediği indikatörü tek tıkla kaldırabilir.

### Story 3.3: Geniş İndikatör Kütüphanesi

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-3.3.md`**. 32 gelişmiş indikatör (`packages/shared/src/indicators/advanced`) + Story 3.2'nin 7 çekirdek indikatörü tek bir `ALL_INDICATORS` kaydında birleştirildi; web ve mobilde aranabilir "Gelişmiş" listesi + periyot özelleştirme + tek tıkla ekleme/kaldırma. Uygulandı ve doğrulandı.

As a **aktif trader**,
I want ADX, Fibonacci Retracement, Ichimoku, ATR, OBV, Parabolic SAR, Williams %R gibi ileri seviye indikatörlere erişmek,
So that daha derinlemesine teknik analiz yapabileyim.

**Acceptance Criteria:**

- **Given** indikatör kütüphanesi menüsü, **When** kullanıcı "Gelişmiş" kategorisini açarsa, **Then** en az 30 indikatör aranabilir bir liste halinde sunulur (FR-022).
- **Given** bir indikatör seçilir, **When** parametreleri (örn. periyot) varsayılan değerlerle eklenirse, **Then** kullanıcı parametreleri özelleştirebilir.

### Story 3.4: Manuel Çizim Araçları

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-3.4.md`**. Trend çizgisi (2 nokta) ve yatay destek/direnç çizgisi, grafik tıklamalarıyla eklenip sembol+borsa bazlı istemci tarafı depolamada (web: `localStorage`, mobil: `AsyncStorage`) kalıcı saklanıyor; aktif çizimler listeden seçilip silinebiliyor. Uygulandı ve doğrulandı.

As a **aktif trader**,
I want grafik üzerine trend çizgisi ve yatay destek/direnç çizgisi çizebilmek,
So that kendi analizimi grafik üzerinde işaretleyebileyim.

**Acceptance Criteria:**

- **Given** grafik çizim araç çubuğu, **When** kullanıcı trend çizgisi aracını seçip grafik üzerinde iki nokta işaretlerse, **Then** çizgi grafiğe eklenir ve kalıcı olarak saklanır (FR-023).
- **Given** yatay çizgi aracı, **When** kullanıcı bir fiyat seviyesine tıklarsa, **Then** o seviyede yatay bir destek/direnç çizgisi eklenir.
- **And** kullanıcı eklediği çizimi seçip silebilir.

### Story 3.5: Kural Bazlı Otomatik Sinyal Üretimi

- [x] **Tamamlandı** — Detaylı kabul kriterleri, mimari yaklaşım ve görev tanımı için bkz. **`docs/stories/story-3.5.md`**. Yeni backend `technical` modülü (RSI/SMA/EMA/MACD Python'a taşındı; 6 kural: RSI aşırı satım/alım, MACD kesişimi, Golden/Death Cross); `GET /symbols/signals` istek-anında geçmiş veri üzerinden sinyal geçmişi üretiyor (Celery/DB olmadan — bkz. story'deki mimari gerekçe). Web ve mobilde Teknik Analiz sekmesine "Sinyaller" listesi eklendi. Uygulandı ve doğrulandı.

As a **aktif trader**,
I want RSI/MACD/hareketli ortalama kesişimi gibi hazır kurallara göre otomatik üretilen sinyalleri görmek,
So that manuel taramaya gerek kalmadan potansiyel fırsatları fark edebileyim.

**Acceptance Criteria:**

- **Given** bir hissenin teknik verisi güncellenir, **When** tanımlı kurallardan biri (örn. "RSI 30 altına düştü") sağlanırsa, **Then** backend `technical` modülü bir sinyal kaydı üretir ve hisse detay sayfasında gösterilir (FR-024).
- **Given** sinyal listesi, **When** kullanıcı bir hissenin sinyal geçmişine bakarsa, **Then** son N sinyal, tetiklenme tarihiyle birlikte listelenir.
- **And** sinyal üretimi kural bazlı/deterministiktir; ML tabanlı skorlama bu story kapsamında değildir (bkz. PRD FR-025, Faz 2).

### Story 3.6: Özet Değerlendirme Skoru

- [x] **Tamamlandı** — Detaylı kabul kriterleri, puanlama modeli ve görev tanımı için bkz. **`docs/stories/story-3.6.md`**. Yeni backend `app/scoring.py`: temel (F/K, ROE, borç/özsermaye, net marj, EPS büyümesi — 50p) + teknik (trend, RSI, son 90 günün sinyal eğilimi — 50p) kural bazlı puanlama; `GET /symbols/score`. Web ve mobilde "Genel Bakış" sekmesine skor rozeti + faktör dökümü (açılır bilgi paneli) eklendi; veri yetersizse "yeterli veri yok". **Epic 3 ve PRD Faz 1/MVP'nin Epic 1-3 kapsamı bu story ile tamamlandı.**
- **Güncelleme (2026-09-28, Story 12.1):** Al/Nötr/Sat etiketi SPK yatırım danışmanlığı sınırı nedeniyle kaldırıldı. Skor artık "Metrik Puanı" adıyla, beş objektif kategoriye (Değerleme, Kârlılık, Borçluluk, Büyüme, Teknik görünüm) ayrılmış olarak gösteriliyor. Aşağıdaki AC'lerdeki etiket ifadesi tarihsel kayıttır.

As a **yeni/amatör yatırımcı**,
I want karmaşık metriklere girmeden hissenin genel durumunu özetleyen basit bir skor/etiket görmek,
So that hızlıca "bu hisseye bakmaya değer mi" sorusuna yanıt alabileyim.

**Acceptance Criteria:**

- **Given** bir hissenin hem temel (Epic 2) hem teknik (Story 3.1-3.5) verisi mevcut, **When** hisse genel bakış kartı yüklenirse, **Then** 1-100 arası bir skor veya Al/Nötr/Sat etiketi gösterilir (FR-003).
- **Given** temel veya teknik veri eksik, **When** skor hesaplanamazsa, **Then** "yeterli veri yok" durumu gösterilir, hatalı/rastgele bir skor gösterilmez.
- **And** skor açıklaması ("bu skor neye dayanıyor") kullanıcıya bir bilgi ipucu (tooltip) ile sunulur.

> **Not:** Puanlama ağırlıkları Story 3.7 ile güncellendi (aşağıya bkz.) — bu AC'ler/DoD hâlâ geçerli, yalnızca faktör bileşimi genişledi.

### Story 3.7: Gelişmiş Al/Sat Önerisi Motoru

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-3.7.md`**. Kullanıcı isteği üzerine Story 3.5/3.6 güçlendirildi (yeni backend altyapısı kurmadan): `app/technical.py`'ye 6 yeni kural (Bollinger kırılımı, Stokastik aşırı bölge kesişimi, SMA20/50 kısa kesişim — toplam 12 kural); `app/scoring.py`'ye 6 göstergenin anlık yönünü ölçen bir "Teknik Konsensüs" faktörü (25/100, skorun en büyük tekil faktörü) ve şablon tabanlı, deterministik bir `rationale` (gerekçe) cümlesi eklendi. Web/mobilde skor rozetine gerekçe metni + konsensüs oranı gösterimi eklendi.
- **Güncelleme (2026-09-28, Story 12.1):** Gerekçe cümlesi artık etiket veya öneri içermiyor; yalnızca en yüksek/en düşük kategoriyi ve yukarı yönlü gösterge sayısını anlatıyor.

As a **kullanıcı**,
I want özet skorun yalnızca bir sayı değil, kaç göstergenin hangi yönde olduğunu ve bunun okunabilir bir gerekçesini de görmek,
So that "al/sat önerisi"ne ne kadar güvenebileceğimi ve neye dayandığını anlayabileyim.

**Acceptance Criteria:**

- **Given** bir hissenin geçmiş teknik verisi, **When** Bollinger kırılımı, Stokastik aşırı bölge kesişimi veya SMA20/50 kesişimi geçmişte gerçekleşmişse, **Then** bu 6 yeni kural türü de sinyal listesinde (Story 3.5) görünür.
- **Given** özet skor hesaplanıyor, **When** skor yanıtı döner, **Then** 6 teknik göstergeden kaçının şu an yükseliş/düşüş/nötr yönde olduğunu gösteren bir konsensüs oranı yer alır.
- **And** skor yanıtı, en güçlü katkı sağlayan faktörü ve konsensüs oranını içeren, "yatırım tavsiyesi değildir" hatırlatmalı deterministik bir gerekçe cümlesi içerir.

---

## 8. Epic 4: Tarama (Screener) ve Karşılaştırma

### Story 4.1: Çoklu Kriter Tarama

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-4.1.md`**. Backend (`GET /screener/run`: temel+teknik kriterleri birleştiren, işlem-içi önbellekli tarama motoru), web (`/screener` sayfası) ve mobil (`ScreenerScreen`) uygulandı ve doğrulandı. Canlı uçtan uca doğrulama 2026-09-18'de gerçek Finnhub/Twelve Data anahtarlarıyla yapıldı.

As a **aktif trader**,
I want piyasa değeri, F/K, RSI, hacim, sektör, borsa gibi kriterleri birleştirerek hisse taraması yapmak,
So that yatırım kriterlerime uyan hisseleri hızlıca bulabileyim.

**Acceptance Criteria:**

- **Given** tarama ekranı, **When** kullanıcı birden fazla temel+teknik kriteri birlikte ayarlarsa, **Then** tüm kriterlere uyan hisseler bir tabloda listelenir (FR-030).
- **Given** hiçbir hisse kriterlere uymuyorsa, **When** tarama çalıştırılırsa, **Then** "sonuç bulunamadı" durumu gösterilir.
- **And** tarama sonuçları hem ABD hem BIST hisselerini borsa filtresine göre kapsar.

### Story 4.2: Kayıtlı Taramalar

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-4.2.md`**. Backend (`saved_screens` tablosu + `GET/POST/PUT/DELETE /saved-screens`, kriterler `jsonb` olarak saklanıyor), web (`/screener` sayfasında kayıt/yükle/yeniden adlandır/sil kartı) ve mobil (`ScreenerScreen`'de aynı işlev, satır-içi yeniden adlandırma) uygulandı ve doğrulandı. Canlı Supabase'e uçtan uca doğrulandı.

As a **aktif trader**,
I want tarama kriter setimi bir isimle kaydedip tekrar çalıştırabilmek,
So that her seferinde kriterleri yeniden girmek zorunda kalmayayım.

**Acceptance Criteria:**

- **Given** oluşturulmuş bir tarama, **When** kullanıcı "Kaydet" deyip bir isim girerse, **Then** kriter seti kullanıcı hesabına bağlı olarak saklanır (FR-031).
- **Given** kayıtlı taramalar listesi, **When** kullanıcı birini seçerse, **Then** kriterler geri yüklenir ve tarama güncel veriyle yeniden çalıştırılır.
- **And** kullanıcı kayıtlı bir taramayı silebilir veya yeniden adlandırabilir.

### Story 4.3: Hisse Karşılaştırma Tablosu

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-4.3.md`**. Backend (`app/comparison.py` + `GET /compare`: 2-4 sembol için paralel fundamentals+teknik+skor birleştirme, BIST için yer tutucu), web (`/compare` sayfası, arama+ekle/çıkar, göreli en iyi/kötü renklendirmesi) ve mobil (`CompareScreen`) uygulandı ve doğrulandı. Gerçek Finnhub/TwelveData verisiyle uçtan uca doğrulandı.

As a **kullanıcı**,
I want en az 4 hisseyi yan yana temel ve teknik metriklerle karşılaştırmak,
So that hangisinin daha iyi bir seçim olduğuna karar verebileyim.

**Acceptance Criteria:**

- **Given** karşılaştırma ekranı, **When** kullanıcı 2-4 arası hisse eklerse, **Then** seçilen hisselerin temel ve teknik metrikleri yan yana bir tabloda gösterilir (FR-032).
- **Given** karşılaştırma tablosu, **When** bir metrikte bir hisse diğerlerinden belirgin şekilde iyi/kötü ise, **Then** bu görsel olarak vurgulanır (örn. renk kodlaması).
- **And** kullanıcı karşılaştırmadan bir hisseyi çıkarabilir.

---

## 9. Epic 5: İzleme Listesi, Alarmlar ve Bildirimler

### Story 5.1: İzleme Listesi Oluşturma ve Yönetimi

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-5.1.md`**. DB (`watchlists`/`watchlist_items` migration'ı canlı Supabase'e uygulandı), backend (`app/watchlists.py` + `/watchlists` uç noktaları — projenin ilk kimlik doğrulamalı yazma işlemleri), web (`/watchlist` sayfası + hisse detayında ekle/çıkar popover'ı) ve mobil (`WatchlistScreen`, `AddToWatchlistButton`) uygulandı ve doğrulandı. Gerçek tarayıcı/cihazda görsel doğrulama kullanıcı tarafında yapılmalı (bu ortamda tarayıcı/simülatör otomasyon aracı yok).

As a **kullanıcı**,
I want takip etmek istediğim hisseleri bir veya birden fazla izleme listesine eklemek,
So that ilgilendiğim hisseleri tek yerden takip edebileyim.

**Acceptance Criteria:**

- **Given** bir hisse detay sayfası, **When** kullanıcı "izleme listesine ekle" butonuna basarsa, **Then** hisse seçilen (veya varsayılan) izleme listesine eklenir (FR-040).
- **Given** birden fazla izleme listesi, **When** kullanıcı yeni bir liste oluşturursa, **Then** listeye istediği ismi verebilir ve hisseleri buna dağıtabilir.
- **And** kullanıcı bir hisseyi izleme listesinden kaldırabilir.

### Story 5.2: Fiyat Alarmı Kurma

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-5.2.md`**. Backend (`app/alerts.py` + `price_alerts` tablosu + `/alerts` uç noktaları — ABD alarmları `GET /alerts` çağrısında Finnhub ile anlık değerlendirilir), web (`/alerts` sayfası + hisse detayında "Fiyat Alarmı Kur" butonu) ve mobil (`AlertsScreen`, `CreatePriceAlertButton`) uygulandı. **Gerçek Supabase + Finnhub ile canlı uçtan uca doğrulandı** (bkz. story dosyası — bir sonraki story'lerden farklı olarak bu kez gerçek kimlik bilgileri mevcuttu). BIST alarmları kurulabiliyor ama canlı BIST fiyat verisi olmadığından tetiklenme durumu "değerlendirilemiyor" olarak açıkça işaretleniyor (sessiz yanlış durum yok).

As a **kullanıcı**,
I want bir hisse için fiyat eşiği bazlı alarm kurmak,
So that fiyat belirlediğim seviyeye ulaştığında haberdar olabileyim.

**Acceptance Criteria:**

- **Given** bir hisse detay sayfası, **When** kullanıcı "fiyat üstüne/altına düşerse bildir" alarmı kurarsa, **Then** alarm backend `alerts` modülünde kaydedilir (FR-041).
- **Given** aktif bir fiyat alarmı, **When** piyasa fiyatı eşiği geçerse, **Then** alarm bir kez tetiklenir ve durumu "tetiklendi" olarak güncellenir.
- **And** kullanıcı aktif alarmlarını listeleyip silebilir.

### Story 5.3: İndikatör/Sinyal Alarmı Kurma

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-5.3.md`**. Backend (`app/technical.py`'ye 12 kuralın kataloğu + `app/signal_alerts.py` + `signal_alerts` tablosu + `/signal-alerts` ve `GET /technical/rules` uç noktaları — Story 3.5'teki sinyal motoru yeniden kullanıldı, değiştirilmedi), web (hisse detayında "Sinyal Alarmı Kur" + `/signal-alerts` sayfası) ve mobil (`SignalAlertsScreen`, `CreateSignalAlertButton`) uygulandı. **Gerçek Supabase + Finnhub ile canlı uçtan uca doğrulandı** (gerçek AAPL günlük mumları üzerinden RSI hesaplanıp kural gerçekten tetiklendi). BIST aynı Story 5.2 gerekçesiyle "değerlendirilemiyor" olarak işaretleniyor.

As a **aktif trader**,
I want RSI/MACD gibi bir indikatör koşuluna göre alarm kurmak,
So that manuel takip etmeden teknik sinyalleri kaçırmayayım.

**Acceptance Criteria:**

- **Given** bir hisse detay sayfası, **When** kullanıcı "RSI 70 üstüne çıkarsa bildir" gibi bir kural seçerse, **Then** alarm kaydedilir (FR-042).
- **Given** aktif bir indikatör alarmı, **When** Story 3.5'teki sinyal motoru ilgili koşulu tetiklerse, **Then** alarm devreye girer.

### Story 5.4: Alarm Bildirimleri — Push ve E-posta

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-5.4.md`**. Backend (`app/notifications.py` + `user_notification_settings` tablosu + `/notification-settings` uç noktaları; alarm tetiklendiği anda `evaluate_and_persist` içinden Expo push/Resend e-posta gönderimi denenir), web (`/settings`'e e-posta bildirim kartı) ve mobil (`SettingsScreen`'e push+e-posta kartı, `expo-notifications` ile izin/token akışı) uygulandı. **Push gönderim isteği seviyesinde canlı doğrulandı**; gerçek cihazda teslimat, Expo Go'nun SDK 53+'ta uzak push desteğini kaldırması nedeniyle bu ortamda test edilemedi (EAS dev-client gerektiriyor — Story 1.2'deki native OAuth kısıtıyla aynı kategoride, gerekçesi story dosyasında). **Epic 5 bu story ile tamamlandı.**

As a **kullanıcı**,
I want bir alarm tetiklendiğinde push bildirimi ve/veya e-posta almak,
So that uygulamayı açık tutmadan haberdar olabileyim.

**Acceptance Criteria:**

- **Given** tetiklenen bir alarm, **When** kullanıcı mobil uygulamayı yüklemişse, **Then** Expo Push ile anlık bildirim gönderilir (FR-043, FR-070).
- **Given** kullanıcı e-posta bildirimini açık bırakmışsa, **When** alarm tetiklenirse, **Then** Resend üzerinden bir e-posta gönderilir.
- **And** kullanıcı bildirim tercihlerini (push/e-posta/ikisi de) ayarlardan değiştirebilir.

---

## 10. Epic 6: Portföy Takibi

### Story 6.1: Portföy Oluşturma ve Pozisyon Ekleme

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-6.1.md`**. Backend (`app/portfolios.py` + `portfolios`/`positions` tabloları — alışta ağırlıklı ortalama maliyet, satışta adet düşürme/yetersiz miktar kontrolü), web (`/portfolio` sayfası, satır-içi işlem formu) ve mobil (`PortfolioScreen`) uygulandı. Canlı Supabase + Finnhub ile uçtan uca doğrulandı (ortalama maliyet 100→150 hesaplaması dahil).

As a **kullanıcı**,
I want sahip olduğum hisseleri adet ve maliyet fiyatıyla portföyüme eklemek,
So that gerçek yatırımlarımı uygulama üzerinden takip edebileyim.

**Acceptance Criteria:**

- **Given** portföy ekranı, **When** kullanıcı bir hisse için adet ve maliyet fiyatı girerse, **Then** pozisyon portföyüne eklenir (FR-050).
- **Given** var olan bir pozisyon, **When** kullanıcı ek alım/satım girerse, **Then** ortalama maliyet yeniden hesaplanır.
- **And** kullanıcı bir pozisyonu silebilir.

### Story 6.2: Portföy Değeri ve Kâr/Zarar Hesaplama

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-6.2.md`**. `value_portfolios()`: sembol-başına önbellekli canlı fiyat (Finnhub), piyasa değeri/gerçekleşmemiş kâr-zarar; fiyatı alınamayan pozisyonlar (BIST veya API hatası) toplamdan hariç tutulur, sıfırmış gibi dahil edilmez. Uygulandı ve canlı doğrulandı.

As a **kullanıcı**,
I want portföyümün anlık toplam değerini ve pozisyon bazlı kâr/zararımı görmek,
So that yatırım performansımı takip edebileyim.

**Acceptance Criteria:**

- **Given** portföy ekranı, **When** güncel fiyatlar değişirse, **Then** toplam portföy değeri ve her pozisyonun kâr/zararı (TL/USD ve %) güncellenir (FR-051).
- **Given** bir pozisyonun güncel fiyatı çekilemezse, **When** hesaplama yapılırsa, **Then** o pozisyon "veri güncellenemiyor" olarak işaretlenir, toplam yanlış gösterilmez.

### Story 6.3: Çoklu Portföy Desteği

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-6.3.md`**. Şema Story 6.1'de baştan çoklu-portföyü destekleyecek şekilde tasarlandı (watchlist'teki "baştan çoğul" kararıyla tutarlı); web/mobil kullanıcının tüm portföylerini kart listesi olarak gösteriyor. **Epic 6 (Portföy Takibi) bu story ile tamamlandı.**

As a **kullanıcı**,
I want birden fazla portföy (örn. "ABD hisseleri", "BIST uzun vade") oluşturmak,
So that farklı yatırım stratejilerimi ayrı ayrı takip edebileyim.

**Acceptance Criteria:**

- **Given** portföy yönetimi ekranı, **When** kullanıcı yeni bir portföy oluşturursa, **Then** istediği isimle ayrı bir portföy açılır (FR-052).
- **Given** birden fazla portföy, **When** kullanıcı portföyler arasında geçiş yaparsa, **Then** her portföyün kendi pozisyonları ve toplamı ayrı gösterilir.

---

## 11. Epic 7: Kişiselleştirme

### Story 7.1: İlgi Profili ve Öne Çıkanlar

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-7.1.md`**. Yeni tablo yok — `interest_sectors` Story 1.3'teki dil tercihi kararıyla aynı desende Supabase `user_metadata`'da saklanıyor (JWT claim'i olarak backend'e ulaşıyor). Backend (`app/highlights.py` + `GET /highlights` — screener'ın iki-aşamalı desenini kullanan "en çok hareket edenler"), web (`/settings` sektör seçici + `/dashboard` "Öne Çıkanlar") ve mobil aynı şekilde uygulandı. Gerçek Finnhub verisiyle canlı doğrulandı.

As a **kullanıcı**,
I want ilgilendiğim sektör/hisseleri işaretlemek,
So that ana ekranda bana uygun öne çıkan hisseleri görebileyim.

**Acceptance Criteria:**

- **Given** profil ayarları, **When** kullanıcı ilgi alanı sektörlerini seçerse, **Then** tercih kaydedilir (FR-061).
- **Given** kayıtlı ilgi profili, **When** kullanıcı ana ekranı açarsa, **Then** seçilen sektörlerden kural bazlı olarak öne çıkan (örn. günün en çok hareket edenleri) hisseler gösterilir.

### Story 7.2: Hisseye Kişisel Not Ekleme

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-7.2.md`**. Backend (`app/notes.py` + `stock_notes` tablosu, tekil `ON CONFLICT DO UPDATE` upsert deseni), web ve mobil (hisse detay sayfasında `StockNoteCard`) uygulandı. Canlı Supabase'e uçtan uca doğrulandı. **Epic 7 (Kişiselleştirme) bu story ile tamamlandı.**

As a **kullanıcı**,
I want izlediğim bir hisseye kendi notumu eklemek,
So that o hisseyle ilgili düşüncelerimi/kararlarımı hatırlayabileyim.

**Acceptance Criteria:**

- **Given** bir hisse detay sayfası, **When** kullanıcı not alanına metin girip kaydederse, **Then** not kullanıcıya özel olarak saklanır (FR-062).
- **Given** daha önce eklenmiş bir not, **When** kullanıcı sayfayı tekrar açarsa, **Then** notu görür ve düzenleyebilir/silebilir.

---

## 12. Epic 8: Abonelik ve Monetizasyon (Freemium)

### Story 8.1: Ücretsiz/Premium Katman Ayrımının Uygulanması

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-8.1.md`**. Yeni `entitlements` tablosu (satır yoksa varsayılan `free`); backend (`app/entitlements.py` + dört `enforce_*_limit` fonksiyonu, `GET /entitlements`, dört oluşturma uç noktasına 403 enforcement), web/mobil ("Planım" kartı `/settings`'te, hisse detayında veri gecikmesi uyarısı, gelişmiş indikatör bölümünde kilit mesajı, 403 mesajlarının UI'da gösterilmesi) uygulandı ve doğrulandı. **Story 8.2 (gerçek satın alma/RevenueCat) kullanıcının kendi ödeme sağlayıcı hesaplarını kurmasını bekliyor, bilinçli olarak kapsam dışı bırakıldı.**
- **Güncelleme (2026-09-21):** Kullanıcı, ödeme altyapısı kurulana kadar kullanıcı tabanı büyütmeyi tercih etti — `app/entitlements.py::ALL_FEATURES_FREE` bayrağıyla bu story'nin yazdığı tüm freemium mekanizması (limitler, `enforce_*`, DB şeması, UI kilitleri) korunarak bypass edildi; herkese "Free Access Period" ("Ücretsiz Erişim Dönemi") rozetiyle her şey açıldı, "Premium" diye yanıltıcı bir etiket kullanılmadı. Tek satırlık bir bayrakla geri alınabilir. Detay için bkz. `docs/stories/story-8.1.md` Teknik Notlar.

As a **ücretsiz kullanıcı**,
I want hangi özelliklerin ücretsiz hangilerinin premium olduğunu net şekilde görmek,
So that yükseltme yapmadan önce ne kazanacağımı bileyim.

**Acceptance Criteria:**

- **Given** ücretsiz katmandaki bir kullanıcı, **When** premium bir özelliğe (örn. gerçek zamanlı veri, geniş indikatör kütüphanesi, sınırsız tarama/alarm) erişmeye çalışırsa, **Then** özellik kilitli gösterilir ve yükseltme teklifiyle karşılaşır (FR-080, FR-081, FR-082).
- **Given** ücretsiz katman, **When** kullanıcı fiyat verisine bakarsa, **Then** verinin gecikmeli/günlük olduğu açıkça belirtilir.
- **And** erişim kontrolü her zaman backend'in önbelleğe aldığı entitlement durumundan çözülür, istemci kendi kendine "premium'um" diyemez (AD-7).

### Story 8.2: Premium Abonelik Satın Alma ve Yönetimi

> **Ertelendi (2026-09-21):** Kullanıcı, ödeme altyapısı kurmadan önce tüm özellikleri ücretsiz açıp kullanıcı tabanı büyütmeyi tercih etti (bkz. Story 8.1'in güncellemesi). Bu story, ödeme sağlayıcı hesapları (RevenueCat + Apple Developer Program + Google Play Console) kurulup gerçek monetizasyona geçilmek istendiğinde ele alınacak; şu an aktif bir plan yok.

As a **kullanıcı**,
I want uygulama içinden premium abone olup aboneliğimi yönetmek,
So that gerçek zamanlı veri ve gelişmiş özelliklere erişebileyim.

**Acceptance Criteria:**

- **Given** yükseltme ekranı, **When** kullanıcı bir plan seçip satın alma işlemini tamamlarsa (App Store/Play Store IAP veya web'de Stripe), **Then** RevenueCat üzerinden entitlement güncellenir ve kullanıcı anında premium özelliklere erişir (FR-083).
- **Given** aktif bir abonelik, **When** kullanıcı iptal ederse, **Then** mevcut dönem sonuna kadar premium erişim devam eder, sonrasında ücretsiz katmana döner.
- **And** abonelik durumu (plan, yenilenme tarihi) ayarlar ekranında görüntülenir.

---

## 13. Epic 9: AI Destekli Yorum ve Örüntü Tanıma

> **Ön koşul:** Epic 1-8 (Faz 1 MVP) tamamlanmış olmalı. Karar gerekçesi, değerlendirilip elenen alternatifler ve açık risk için bkz. `docs/product-brief-epic9-ai.md`.

> **2026-09-18 güncellemesi:** Kullanıcı, Epic 9'un kapsamını somutlaştırdı — hisse detay sayfasında üç ayrı, açıkça etiketlenmiş görüş: (a) Story 9.2'nin CV modeliyle teknik/grafik okuması, (b) Story 9.1'in LLM ile ürettiği temel analiz raporu, (c) mevcut kural bazlı skorun (Story 3.6/3.7, zaten üretimde) Al/Nötr/Sat çıktısı. Gerekçe ve model/sağlayıcı seçimi için bkz. `docs/product-brief-epic9-ai.md` §"2026-09-18 Güncellemesi".

### Story 9.1: Temel Analiz AI Raporu

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-9.1.md`**. Backend (`app/ai_fundamental.py` + `GET /symbols/ai-report/fundamental` — Google Gemini API'sine `httpx` ile çağrı (2026-09-19'da Anthropic Claude'dan geçirildi), Epic 2'nin temel verisiyle RAG, sembol bazlı global önbellek), web/mobil (AI Analiz sekmesinde "Rapor Oluştur" paneli + premium kilidi) uygulandı; testler (mock'lu) yeşil. Ücretsiz katman 403'ü canlı doğrulandı. **Gerçek Gemini API anahtarıyla canlı uçtan uca doğrulandı** (2026-09-20 — AAPL için rapor üretimi + ikinci istekte önbellekten dönme).

As a **kullanıcı (premium)**,
I want hisse detay sayfasında, uygulamanın kendi temel verisine dayanan bir AI temel analiz raporu okumak,
So that sayıları tek tek yorumlamadan hissenin temel görünümünü hızlıca anlayabileyim.

**Acceptance Criteria:**

- **Given** premium bir kullanıcı bir hisse detay sayfasını açar, **When** "Temel Analiz AI Raporu"nu talep ederse, **Then** Google Gemini API'sine, uygulamanın kendi hesapladığı temel verisi (F/K, ROE, borç/özsermaye, sektör kıyaslaması, geçmiş finansal performans) zemine alınarak (RAG) üretilmiş bir rapor gösterilir (FR-100).
- **Given** ücretsiz katmandaki bir kullanıcı, **When** aynı bölüme gelirse, **Then** özellik kilitli gösterilir ve premium yükseltme teklifiyle karşılaşır (FR-080); backend de aynı isteği 403 ile reddeder.
- **Given** ilgili hisse için temel veri yetersizse (örn. BIST — canlı temel veri kaynağı yok), **When** rapor üretilmeye çalışılırsa, **Then** "yeterli veri yok" durumu gösterilir; veri olmadan genel/halüsinasyon riski taşıyan bir rapor üretilmez.
- **And** raporun altında sabit olarak "yatırım tavsiyesi değildir" ibaresi yer alır; rapor sembol+borsa bazlı önbelleğe alınır (kullanıcı bazlı değil), LLM API maliyetini kontrol etmek için.

### Story 9.2: Teknik Analiz AI Raporu — CV Modeli

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-9.2.md`**. PDF karşılaştırma raporundaki 4 adaydan ChartScanAI'nin YOLOv8 modeli seçildi (MIT lisans + mplfinance eğitim verisi uyumu, GitHub API/LICENSE ile canlı doğrulandı); backend (`app/ai_technical.py` — mplfinance ile grafik görüntüsü üretimi, lazy-loaded model, `GET /symbols/ai-report/technical`), web/mobil (AI Analiz sekmesi, mevcut deterministik skorla birlikte üç panel) uygulandı ve doğrulandı. **Gerçek AAPL/MSFT verisiyle canlı uçtan uca doğrulandı** (gerçek model ağırlığı, gerçek mum verisi, önbellek ve ücretsiz katman 403'ü dahil).
- **Güncelleme (2026-09-28, Story 12.1):** Modelin "Buy"/"Sell" sınıfları "yukarı/aşağı yönlü örüntü" olarak sunuluyor; rapor bunun geçmiş grafiğin okuması olduğunu, tahmin olmadığını belirtiyor.

As a **aktif trader**,
I want fiyat grafiğimin bir görüntü-tanıma modeliyle okunduğu bir teknik AI raporu görmek,
So that grafiği manuel yorumlamadan modelin "okumasını" diğer görüşlerle (temel AI, deterministik skor) karşılaştırabileyim.

**Acceptance Criteria:**

- **Given** bir hissenin mum verisi, **When** kullanıcı "Teknik Analiz AI Raporu"nu talep ederse, **Then** candle verisinden üretilen bir grafik görüntüsü, önceden eğitilmiş bir CV modeliyle (ChartScanAI/YOLOv8, MIT lisanslı) okunur ve sonuç, deterministik skordan **ayrı ve açıkça etiketlenmiş** bir "modelin okuması" olarak sunulur (FR-101).
- **Given** bir bulgu gösterilir, **When** kullanıcı bulguya bakarsa, **Then** bulgu "grafik modelinin okuması/bulgusu" dilinde sunulur; "AI trading stratejisi" veya "öneri" ifadesi kullanılmaz; modelin deneysel/gösterge niteliğinde olduğu belirtilir.
- **Given** ücretsiz katmandaki bir kullanıcı, **When** rapor talep ederse, **Then** özellik kilitli gösterilir; backend isteği 403 ile reddeder (CPU maliyeti nedeniyle yalnızca istemci tarafı gizleme yeterli değil).
- **And** rapor sembol+borsa bazlı önbelleğe alınır; gerçek bir eğitim/ML altyapısı (FR-102/FR-025 — kendi verimizle eğitilmiş bir model) bu story'nin kapsamında değildir, ayrı bir gelecek fazda ele alınacaktır.

### Story 9.3: Günlük Sektör Bülteni

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-9.3.md`**. Kullanıcı isteği (2026-09-19): ana ekranda her gün üstüne yeni bir tane eklenen, hiç silinmeyen bir AI sektör bülteni. Zamanlama kararı: proje boyunca hiç kurulmayan bir cron/Celery altyapısı yerine, istek-anında üretim + append-only arşiv (`sector_bulletins` tablosu, `bulletin_date unique`) — kullanıcı bu tercihi bilerek onayladı. Sektör seçimi `day_of_year % 11` deterministik rotasyonla, hisse seçimi mevcut skor motoruyla (Story 3.6/3.7), anlatı Story 9.1'in artık paylaşılan hale getirilmiş (`app/ai_reports.py::call_gemini()`) Gemini entegrasyonuyla. Backend (`app/bulletins.py` + `GET /bulletins`) ve web/mobil (dashboard'da "Bülten" bölümü) uygulandı, testler (290/290) yeşil, ücretsiz katman 403'ü ve sektör-seçim/skorlama boru hattı canlı doğrulandı. **Gerçek Gemini API anahtarıyla tam uçtan uca doğrulandı** (2026-09-20 — günün bülteni üretimi + ikinci istekte aynı `bulletin_date`'in tekrar üretilmediği).
- **Güncelleme (2026-10-09):** Panel'de yalnızca en yeni bülten gösteriliyor, "Tüm bültenler" düğmesi arşiv sayfasına (`/bulletins`) götürüyor.
- **Güncelleme (2026-09-28, Story 12.1):** Bülten artık en yüksek skorlu hisseleri değil, sektörün piyasa değerine göre en büyük 5 şirketini puan/etiket vermeden ele alıyor ("bugün alınabilecek 5 hisse" izlenimini önlemek için). Eski formattaki bültenler listeden gizlendi.

As a **kullanıcı (premium)**,
I want ana ekranda her gün yeni eklenen, geçmişi silinmeyen bir AI sektör bülteni görmek,
So that hangi sektörlerin/hisselerin öne çıktığını zaman içinde takip edebileyim.

**Acceptance Criteria:**

- **Given** bugüne ait bir bülten satırı yoksa, **When** premium bir kullanıcı dashboard'u açarsa, **Then** deterministik rotasyonla seçilmiş bir sektör için, o sektördeki en yüksek skorlu 5 hissenin analiziyle yeni bir bülten üretilip kalıcı olarak eklenir; ertesi gün önceki bülten silinmez/üzerine yazılmaz.
- **Given** ücretsiz katmandaki bir kullanıcı, **When** dashboard'u açarsa, **Then** bülten bölümü kilitli gösterilir; backend isteği 403 ile reddeder.
- **And** her bültenin sonunda "yatırım tavsiyesi değildir" ibaresi yer alır; seçilen sektörde puanlanabilir hisse yoksa o gün için hatalı bir satır kaydedilmez.

### Story 9.4: Birleşik Değerlendirme AI Raporu

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-9.4.md`**. Kod 2026-09-19'da (`8244f9d`, `352bea3`) yazıldı, bu story dosyası 2026-09-20'de retroaktif olarak açıldı. Story 9.1/9.2'nin temel ve teknik raporlarını okuyup uyumlu/çelişkili olduklarını özetleyen üçüncü bir AI raporu (`app/ai_combined.py` + `GET /symbols/ai-report/combined`, mevcut `ai_reports` tablosuna üçüncü bir `report_type` olarak eklendi); web'de AI Analiz sekmesi sırası birleşik → teknik → temel → deterministik skor olarak değişti. Aynı gün AI Analiz kartlarındaki ham ağ hatası mesajları da düzeltildi. Testler (316/316) yeşil, ruff temiz, migration canlı Supabase'e uygulandığı ve ücretsiz katman 403'ü 2026-09-20'de doğrulandı. **Gerçek Gemini API anahtarıyla canlı uçtan uca doğrulandı.** Mobil panel (`AIAnalysisPanel.tsx`) da 2026-09-20'de eklendi — aynı sıralama, aynı ağ-hatası düzeltmesi (mobilin kendi `ReportCard` hata yakalamasındaki eşdeğer bir boş-mesaj hatası da bu sırada düzeltildi).

As a **kullanıcı (premium)**,
I want hisse detay sayfasındaki AI Analiz sekmesinde, temel ve teknik raporların uyumlu mu çelişkili mi olduğunu özetleyen tek bir görüş görmek,
So that iki ayrı raporu kendim karşılaştırmak zorunda kalmadan hızlıca genel tabloyu anlayabileyim.

**Acceptance Criteria:**

- **Given** premium bir kullanıcı, **When** "Ortak Değerlendirme"yi talep ederse, **Then** temel ve teknik raporlar (hazır değillerse önce üretilir) okunarak bir Gemini sentezi gösterilir.
- **Given** ücretsiz katmandaki bir kullanıcı, **When** aynı isteği yaparsa, **Then** backend 403 döner.
- **And** raporun altında "yatırım tavsiyesi değildir" ibaresi yer alır; sentez 5 saatlik TTL ile önbelleğe alınır.
- **And** ağ seviyesi bir hata oluşursa, kullanıcıya tarayıcının ham hata metni değil uygulamanın kendi "veri şu an sağlanamıyor" mesajı gösterilir.

---

## 14. Epic 10: Alım-Satım Simülasyonu (Paper Trading)

> Kullanıcı isteği (2026-09-19) — önceden hiçbir yerde planlanmamış yeni bir kapsam, Epic 9 ile eş zamanlı geliştiriliyor. Gerçek para/aracı kurum bağlantısı yok (bkz. PRD §10); tamamen sanal bütçeyle, gerçek piyasa fiyatlarından yürütülen bir kum havuzu. Mevcut Portföy'den (Epic 6) kasıtlı olarak ayrı: Portföy elle girilen fiyatlarla gerçek sahiplikleri kaydeder, bu özellik bütçe kısıtlı ve emirler gerçek anlık fiyattan otomatik yürütülür.

### Story 10.1: Bütçeli Simülasyon Oluşturma ve Emir Yürütme

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-10.1.md`**. Backend (`app/simulations.py` — Portföy'ün weighted-average/CRUD deseni + bütçe/nakit mekaniği + Story 9.3'ün append-but-upsertable günlük snapshot deseni; `GET/POST /simulations`, `DELETE /simulations/{id}`, `POST /simulations/{id}/orders`, `GET /simulations/{id}/history`), web (`/simulation` sayfası, dashboard nav girişi) ve mobil (`SimulationScreen`) uygulandı; ücretsiz katman 1 simülasyonla sınırlı (Story 8.1 entitlement altyapısı genişletildi: `FREE_SIMULATION_LIMIT`). Testler (311/311) yeşil, ruff temiz, migration canlı Supabase'e uygulandı. **Gerçek AAPL fiyatıyla canlı uçtan uca doğrulandı** (emrin tam gerçek fiyattan yürütüldüğü, bütçe/miktar aşımı reddi, BIST reddi, günlük snapshot upsert, ücretsiz katman 403'ü dahil).

As a **kullanıcı**,
I want gerçek piyasa verisiyle, kendi belirlediğim bir bütçeyle sanal alım-satım yapmak,
So that gerçek para riskine girmeden stratejimi test edip zaman içindeki performansımı görebileyim.

**Acceptance Criteria:**

- **Given** bir kullanıcı bir başlangıç bütçesiyle simülasyon oluşturur, **When** bir sembol için alım/satım emri verirse, **Then** emir kullanıcının girdiği değil **o anki gerçek piyasa fiyatından** yürütülür; nakit bakiyesi buna göre güncellenir.
- **Given** bir alım emrinin maliyeti mevcut nakit bakiyesini aşıyorsa, **When** emir verilirse, **Then** emir reddedilir ve nakit/pozisyon değişmez. Aynı şekilde elde tutulan miktarı aşan bir satım emri de reddedilir.
- **Given** bir simülasyon, **When** kullanıcı zaman içindeki performansına bakarsa, **Then** günlük toplam değer (nakit + pozisyon değeri) ve kâr/zarar geçmişi gösterilir; geçmiş günlerin kayıtları bir daha değişmez, yalnızca bugünün kaydı güncellenir.
- **And** yalnızca ABD hisseleri desteklenir (BIST için canlı fiyat kaynağı yok); ücretsiz katman 1 simülasyonla sınırlıdır, premium sınırsızdır.

### Story 10.2: Simülasyon Emir Formunda Sembol Otomatik Tamamlama

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-10.2.md`**. Kod 2026-09-19'da (`cd19c44`) yazıldı, bu story dosyası 2026-09-20'de retroaktif olarak açıldı. Emir formunun çıplak sembol metin girişine, dashboard/karşılaştırma ekranlarında zaten var olan debounce'lu `/symbols/search` öneri listesi eklendi (web + mobil); bir öneriye tıklamak sembol ve borsayı birlikte doldurur. Backend değişikliği yok — mevcut arama uç noktası yeni bir yüzeyden tüketildi.

As a **kullanıcı**,
I want simülasyon emir formundaki sembol alanına yazarken öneri listesi görmek,
So that tam sembol kodunu ezbere bilmeden doğru sembolü ve borsayı seçebileyim.

**Acceptance Criteria:**

- **Given** emir formundaki sembol alanı, **When** kullanıcı yazmaya başlarsa, **Then** 300ms sonra öneri listesi gösterilir.
- **Given** öneri listesi açık, **When** kullanıcı bir sonuca tıklarsa, **Then** sembol ve borsa alanları birlikte doldurulur.
- **And** yarışan aramalar (`AbortController`) iptal edilir, eski bir sonuç güncel yazıyı ezmez.

### Story 10.3: Hisse Sayfasından Simülasyonda Alım

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-10.3.md`**. Kullanıcı isteği (2026-09-26). Hisse detay sayfasının başlığına "Simülasyonda al" butonu eklendi (web); simülasyon seçimi, kullanılabilir nakit, adet ve anlık fiyattan tahmini tutar gösterilir. Hiç simülasyonu olmayan kullanıcı sayfadan ayrılmadan tek tıkla simülasyon oluşturabilir. Backend değişikliği yok — Story 10.1'in `GET /simulations` ve `POST /simulations/{id}/orders` uç noktaları kullanıldı. **Mobil (2026-09-28):** `SimulateBuyButton` mobil hisse ekranına eklendi; başarıda simülasyon ekranına geçiş.

As a **kullanıcı**,
I want incelediğim bir hisseyi, sayfadan ayrılmadan simülasyonuma almak,
So that bir fikri test etmek için simülasyon ekranına gidip sembolü yeniden aramak zorunda kalmayayım.

**Acceptance Criteria:**

- **Given** bir ABD hissesinin detay sayfası, **When** kullanıcı "Simülasyonda al"a tıklarsa, **Then** simülasyonlarından birini seçip adet girerek alım emri verebilir; emir Story 10.1'deki gibi o anki gerçek fiyattan yürütülür.
- **Given** kullanıcının hiç simülasyonu yok, **When** paneli açarsa, **Then** tek tıkla bir simülasyon oluşturup aynı panelde alıma devam edebilir.
- **Given** emir reddedilirse (yetersiz bakiye, fiyat alınamadı vb.), **When** sonuç dönerse, **Then** API'nin açıklayıcı mesajı panelde gösterilir; başarılı alımdan sonra nakit bakiyesi güncellenir ve simülasyona giden bir bağlantı sunulur.
- **And** buton yalnızca ABD hisselerinde görünür (simülatör yalnızca canlı ABD fiyatlarıyla çalışır).

---

## 15. Epic 11: Kripto Para Piyasası

> Kullanıcı isteği (2026-09-26). PRD §3'te "Faz 2+ — mimari buna kapalı olmayacak şekilde tasarlanmalı" olarak ayrılan kripto varlık sınıfının ilk adımı. Kapsam **yalnızca veri, analiz ve sanal işlem**: gerçek kripto alım-satımı, cüzdan veya borsa hesabı bağlantısı **yok** (PRD §10 — aracı kurum/borsa entegrasyonu kapsam dışı). Kripto, mevcut hisse özelliklerine yeni bir borsa kodu (`CRYPTO`) olarak eklenir; böylece izleme listesi, alarmlar, portföy ve simülasyon mevcut `symbol + exchange` modelini değiştirmeden genişletilir.
>
> **Hisse senedinden farkları (her story'de dikkate alınmalı):** 7/24 işlem (seans/kapanış yok — "günlük" mum UTC gün sınırıyla kapanır); kesirli miktar (0.0025 BTC); temel analiz (F/K, ROE, bilanço) kavramları yok — yerine piyasa değeri, dolaşımdaki arz, 24s hacim; fiyatlar genellikle USD/USDT paritesi olarak (`BTC/USD`) ifade edilir.
>
> **Veri kaynağı — 2026-09-26'da mevcut anahtarlarla canlı denendi:**
>
> | Kaynak | Anlık fiyat | Mum (grafik/indikatör) | Piyasa değeri / arz | Not |
> |---|---|---|---|---|
> | Twelve Data (mevcut) | ✓ (`quote?symbol=ETH/USD`) | ✓ (`time_series?symbol=BTC/USD`) | ✗ | Hisselerle **aynı** dakikada 8 istek kotasını paylaşır — en büyük kısıt |
> | Finnhub (mevcut) | ✓ (`quote?symbol=BINANCE:BTCUSDT`) | ✗ ücretsiz planda kapalı | ✗ | Anlık fiyat için yedek olabilir |
> | CoinGecko (anahtarsız) | ✓ | ✓ (OHLC) | ✓ (sıralama, arz, FDV) | Anahtarsız erişim düşük hız sınırlı; ücretsiz "demo" anahtarı önerilir |
>
> Kesin seçim Story 11.1'in ilk görevi olarak verilir; varsayılan öneri: mumlar ve anlık fiyat için Twelve Data (mevcut adaptör deseni, `get_us_candles` ile aynı), piyasa değeri/arz/sıralama için CoinGecko — agresif önbellekle.

### Story 11.1: Kripto Piyasa Verisi Adaptörü

As a **geliştirici**,
I want kripto varlıklar için arama, anlık fiyat ve mum verisini mevcut piyasa verisi arayüzüyle aynı şekilde sunan bir backend adaptörü,
So that sonraki story'ler kriptoyu yeni bir borsa kodu olarak, hisse akışlarını kopyalamadan kullanabilsin.

**Acceptance Criteria:**

- **Given** tablodaki kaynaklar, **When** story başlarsa, **Then** ilk görev olarak veri kaynağı kesinleştirilir ve gerekçesi (kota, maliyet, lisans/ToS) story dokümanına yazılır (FR-120).
- **Given** desteklenen bir kripto listesi (başlangıçta piyasa değerine göre ilk ~100 varlık, statik JSON — `bist_symbols.json` / `us_universe.json` deseni), **When** `GET /symbols/search` çağrılırsa, **Then** sonuçlar `exchange: "CRYPTO"` etiketiyle (örn. `BTC` — "Bitcoin") döner.
- **Given** bir kripto sembolü, **When** `/symbols/overview` ve `/symbols/candles` çağrılırsa, **Then** mevcut hisse yanıt şekliyle aynı yapıda fiyat, 24 saatlik değişim ve mumlar döner; ek olarak piyasa değeri ve 24s hacim.
- **And** kripto çağrıları hisse çağrılarının Twelve Data kotasını tüketip hisse sayfalarını yavaşlatmamalı: önbellek süreleri ve istek bütçesi tanımlanır, kota aşımında açıklayıcı bir uyarı döner (sessiz hata yok — NFR-2).

### Story 11.2: Kripto Arama ve Detay Sayfası

As a **kullanıcı**,
I want bir kripto parayı arayıp detay sayfasında fiyatını, grafiğini ve temel piyasa bilgilerini görmek,
So that hisseleri takip ettiğim uygulamada kripto varlıklarımı da takip edebileyim.

**Acceptance Criteria:**

- **Given** arama kutusu, **When** kullanıcı "BTC" veya "Bitcoin" yazarsa, **Then** sonuçlarda `CRYPTO` rozetli varlık görünür ve tıklanınca `/stock/CRYPTO/BTC` detay sayfası açılır (FR-121).
- **Given** bir kripto detay sayfası, **When** açılırsa, **Then** fiyat, 24s değişim, piyasa değeri, dolaşımdaki arz ve 24s hacim gösterilir; hisseye özgü olan ve kriptoda anlamı olmayan bölümler (Temel Analiz sekmesi, sektör, F/K skoru) gizlenir veya "kripto için geçerli değil" olarak açıkça belirtilir.
- **Given** fiyat grafiği, **When** zaman dilimi değiştirilirse, **Then** hisselerdeki gibi mum grafiği çizilir; 7/24 işlem nedeniyle seans boşluğu yoktur.
- **And** sayfada kripto varlıkların yüksek oynaklık taşıdığına dair bir not ve mevcut "yatırım tavsiyesi değildir" ibaresi yer alır; web ve mobilde aynı davranış (NFR-6).

### Story 11.3: Kripto Teknik Göstergeler ve Sinyaller

As a **aktif trader**,
I want mevcut teknik gösterge ve sinyal motorunu kripto grafiklerinde de kullanmak,
So that kripto için ayrı bir araca ihtiyaç duymadan RSI, MACD gibi göstergeleri ve otomatik sinyalleri görebileyim.

**Acceptance Criteria:**

- **Given** bir kripto mum serisi, **When** teknik sekmesi açılırsa, **Then** Epic 3'ün göstergeleri ve sinyal kuralları (`app/technical.py`) değişmeden uygulanır (FR-122).
- **Given** bir kripto için sinyal alarmı, **When** koşul oluşursa, **Then** Story 5.3'teki gibi tetiklenir; 7/24 piyasa nedeniyle hafta sonu da değerlendirilir.
- **And** hisselere özgü deterministik özet skor (Story 3.6 — F/K, ROE gibi temel metriklere dayanır) kriptoya uygulanmaz; kripto için skor gösterilmez ya da ayrı bir story'de yeniden tasarlanır.

### Story 11.4: İzleme Listesi, Fiyat Alarmı ve Portföyde Kripto

As a **kullanıcı**,
I want kripto varlıkları izleme listeme ve portföyüme ekleyip onlar için fiyat alarmı kurmak,
So that hisse ve kripto varlıklarımı tek yerden takip edebileyim.

**Acceptance Criteria:**

- **Given** bir kripto detay sayfası, **When** kullanıcı izleme listesine ekler veya fiyat alarmı kurarsa, **Then** Epic 5 akışları `exchange: "CRYPTO"` ile çalışır (FR-123).
- **Given** portföye kripto pozisyonu eklenirken, **When** miktar kesirli girilirse (örn. 0.0025), **Then** kabul edilir ve değer/kâr-zarar hesaplamaları kesirli miktarla doğru yapılır.
- **And** para birimi ve hassasiyet: kripto fiyatları USD olarak ve düşük fiyatlı varlıklar için yeterli ondalıkla (örn. 0,000012 USD) gösterilir.

### Story 11.5: Simülasyonda Kripto Alım-Satım

As a **kullanıcı**,
I want simülasyonlarımda kripto varlık alıp satmak,
So that kripto stratejilerimi de gerçek para riski olmadan deneyebileyim.

**Acceptance Criteria:**

- **Given** bir simülasyon, **When** bir kripto için alım/satım emri verilirse, **Then** emir o anki gerçek kripto fiyatından yürütülür; kesirli miktar desteklenir (FR-124).
- **Given** kripto detay sayfası, **When** kullanıcı "Simülasyonda al"a tıklarsa, **Then** Story 10.3'teki panel kripto için de çalışır.
- **And** simülasyonun günlük kâr/zarar geçmişi (FR-112) kripto pozisyonlarını da içerir; 7/24 piyasa nedeniyle günlük kayıt UTC gün sınırına göre alınır.

### Story 11.6: Kripto Tarama ve Karşılaştırma

As a **kullanıcı**,
I want kripto varlıkları piyasa değeri, hacim ve fiyat değişimine göre tarayıp karşılaştırmak,
So that hangi varlıkların öne çıktığını hızlıca görebileyim.

**Acceptance Criteria:**

- **Given** tarama (screener) ekranı, **When** borsa olarak "Kripto" seçilirse, **Then** hisseye özgü kriterler (F/K, ROE, borç/özsermaye, sektör) gizlenir; piyasa değeri, 24s hacim, 24s/7g değişim ve RSI kriterleri sunulur (FR-125).
- **Given** karşılaştırma ekranı, **When** kripto varlıklar seçilirse, **Then** kriptoya uygun metriklerle yan yana gösterilir.
- **And** Story 4.1'deki iki aşamalı tasarım korunur: önce ücretsiz statik evrende ön filtre, sonra yalnızca daralan küme için canlı veri — API kotası korunur.

### Story 11.7: Kripto için AI Raporları (Kapsam Kararı)

As a **ürün sahibi**,
I want Epic 9'un AI raporlarının kriptoya nasıl uyarlanacağına (veya uyarlanmayacağına) karar vermek,
So that yanlış bağlamda (hisse varsayımlarıyla) üretilmiş yanıltıcı bir kripto raporu sunmayalım.

**Acceptance Criteria:**

- **Given** Story 9.1'in temel analiz raporu hisse temel verisine (RAG) dayanır, **When** kripto için değerlendirilirse, **Then** ya kriptoya özgü girdilerle (piyasa değeri, arz, hacim) yeni bir prompt tasarlanır ya da rapor kripto için "desteklenmiyor" olarak açıkça gösterilir (FR-126).
- **Given** Story 9.2'nin CV modeli (ChartScanAI) hisse grafikleriyle eğitilmiştir, **When** kripto grafiğinde kullanılırsa, **Then** sonuç ancak "deneysel — hisse grafikleriyle eğitilmiş bir modelin okuması" etiketiyle sunulur ya da kripto için kapatılır.
- **And** karar ve gerekçesi story dokümanına yazılır; mevcut "yatırım tavsiyesi değildir" çerçevesi (PRD §9) korunur.

### Epic 11 — Açık Sorular

1. **Veri kaynağı ve maliyet:** Twelve Data'nın dakikada 8 isteklik ücretsiz kotası hisse ve kripto arasında paylaşılacak. Kullanım arttıkça ücretli plana geçiş veya kripto için ayrı bir kaynak (CoinGecko) gerekebilir — Story 11.1'de netleşir.
2. **Regülasyon:** Kripto varlık hizmet sağlayıcılarına yönelik Türkiye düzenlemeleri, bu uygulamanın yalnızca veri/analiz ve sanal işlem sunması nedeniyle doğrudan uygulanmayabilir; ancak pazarlama ve uygulama içi metinler yatırım tavsiyesi veya kripto alım-satım hizmeti izlenimi vermemelidir. Yayından önce hukuki görüş alınması önerilir.
3. **Kapsam:** Başlangıç evreni (ilk ~100 varlık mı, yalnızca USD pariteleri mi, stablecoin'ler dahil mi) ve freemium sınırlarına kriptonun nasıl dahil edileceği (örn. izleme listesi sınırı hisse+kripto ortak mı) kullanıcıyla netleştirilmeli.

---

## 16. Epic 12: Hukuki Uyum (SPK ve KVKK)

> Kullanıcının 2026-09-28'de paylaştığı hukuki değerlendirmeye dayanır. Özeti, ürüne nasıl uygulandığı ve açık maddeler için bkz. **`docs/compliance.md`**. Temel ilke: belirleyici olan AI kullanılması değil, uygulamanın kullanıcıya ne tür hizmet sunduğudur. Kişiye yönelik al/sat/tut yönlendirmesi SPK iznine tabi yatırım danışmanlığıdır ve uyarı metni tek başına faaliyetin niteliğini değiştirmez.

### Story 12.1: Yönlendirici Çıktıların Kaldırılması (SPK — Yatırım Danışmanlığı Sınırı)

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-12.1.md`**. Skorun Al/Nötr/Sat etiketi kaldırıldı ve skor beş objektif kategoriye ayrıldı. Bülten şirketleri piyasa değerine göre, puansız ele alıyor. Tüm AI prompt'larına ortak uyum kuralları eklendi: al/sat/tut, hedef fiyat ve kişisel tavsiye yok, riskler zorunlu. Eski prompt'la üretilmiş raporlar `PROMPT_VERSION` ile yeniden üretiliyor. Grafik modeli "yukarı/aşağı yönlü örüntü" dili kullanıyor. Uyarı metni ve pazarlama dili (giriş alt başlığı, sunum) düzeltildi. Gerçek Gemini/Finnhub verisiyle ve gerçek tarayıcıda doğrulandı.

As a **ürün sahibi**,
I want uygulamanın hiçbir yerde bir hisse için "al/sat/tut" yönlendirmesi, hedef fiyat veya kişiye özel öneri üretmemesini,
So that Borocean, SPK izni gerektiren yatırım danışmanlığı alanına girmeden bir analiz ve bilgilendirme aracı olarak kalsın.

**Acceptance Criteria:**

- **Given** herhangi bir hisse, **When** metrik puanı gösterilirse, **Then** Al/Nötr/Sat gibi bir yönlendirme etiketi yoktur; puan objektif kategorilere ayrılmış olarak gösterilir (FR-130).
- **Given** günlük bülten, **When** şirketler seçilirse, **Then** seçim değerlendirme içermeyen bir ölçüte (piyasa değeri) göre yapılır ve şirketlere puan/etiket verilmez.
- **Given** bir AI raporu, **When** üretilirse, **Then** al/sat/tut yönlendirmesi, hedef fiyat, getiri tahmini ve kişisel tavsiye içermez; riskleri belirtir ve "yatırım tavsiyesi değildir" satırıyla biter.

### Story 12.2: KVKK — Aydınlatma, Kullanım Koşulları ve Hesap Silme

- [x] **Tamamlandı** — Detaylı kabul kriterleri ve görev tanımı için bkz. **`docs/stories/story-12.2.md`**. `/kvkk` (aydınlatma metni), `/terms` (kullanım koşulları; yatırım danışmanlığı olmadığı) ve güncellenmiş `/privacy`; kayıt ekranında (web + mobil) bilgilendirme ve bağlantılar. Ayarlar → "Hesabı sil" (web + mobil): `DELETE /me` `auth.users` satırını siler, tüm kullanıcı tabloları `ON DELETE CASCADE` ile silinir. Gerçek tarayıcıda ve veritabanında doğrulandı. **Açık kalan:** avukat incelemesi, veri sorumlusu posta adresi, yurt dışı aktarım aracı (`docs/compliance.md` §4).

As a **kullanıcı**,
I want hangi kişisel verilerimin neden ve nerede işlendiğini okuyabilmek ve hesabımı tüm verilerimle birlikte kendim silebilmek,
So that verilerim üzerindeki KVKK haklarımı destek beklemeden kullanabileyim.

**Acceptance Criteria:**

- **Given** herhangi bir ziyaretçi, **When** aydınlatma metni, kullanım koşulları veya gizlilik politikası açılırsa, **Then** oturum gerekmeden görüntülenir; kayıt ekranında bu metinlere bağlantı vardır (FR-131).
- **Given** giriş yapmış bir kullanıcı, **When** ayarlardan onay kelimesini yazıp hesabını silerse, **Then** hesabı ve ona bağlı tüm veriler kalıcı olarak silinir ve oturumu kapanır.

---

## 17. Epic 13: Portföy Gelişme Takibi (Arka Plan AI Taraması)

> Kullanıcı isteği (2026-09-28): "Portföydeki hisselerin günlük AI raporları arka planda önemli bir detay yakaladığında portföyde ve kullanıcı sayfasında görünsün." Karar gerekçesi, alternatifler, araştırma sonuçları ve maliyet bütçesi için bkz. **`docs/product-brief-epic13-portfolio-insights.md`**.
>
> **Temel tasarım:**
> - **Önce kural, sonra AI.** Deterministik dedektörler "olay" yakalar; Gemini yalnızca olay olan semboller için açıklama yazar. Böylece "önemli" kararı açıklanabilir, tekrarlanabilir ve ucuz olur.
> - **Arka plan:** Supabase `pg_cron` + `pg_net` her sabah açılışlardan önce (05:30 UTC, TR 08:30) API'yi tetikler. Projedeki ilk zamanlanmış iş budur; GitHub Actions cron'u güvenilmez çıktığı için ve ücretsiz kalmak için seçildi.
> - **Global üretim, kişisel gösterim.** Olaylar ve notlar sembol başına bir kez üretilir. Kullanıcıya pozisyonlarına göre filtrelenip gösterilir, okundu durumu kullanıcı bazlıdır.
> - **Uyum:** `docs/compliance.md` kuralları geçerli. Analist al/sat tavsiye verisi kullanılmaz; haberlerden yalnızca başlık, kaynak ve bağlantı.
>
> **Veri kaynağı — 2026-09-28'de mevcut Finnhub anahtarıyla canlı denendi:** `company-news` ✓ (AAPL için bir haftada 245 haber — gürültülü, doğrudan tetikleyici olamaz), `stock/earnings` ✓ (gerçekleşen/beklenen EPS ve sapma %), `calendar/earnings` ✓, `stock/filings` ✓ (SEC form türüyle), `stock/insider-transactions` ✓, `stock/recommendation` ✓ ama **kullanılmayacak** (analist al/sat sayıları), `press-releases` ✗ (planda yok).

### Story 13.1: Olay Tespit Motoru ve Gelişme Veri Modeli

- [x] **Tamamlandı** — bkz. **`docs/stories/story-13.1.md`**. Deterministik dedektörler, Finnhub kaynakları (başlıklarda alaka ve yönlendirme filtresi) ve migration 0013. Kalibrasyon 117 hisse × 150 günlük gerçek veriyle yapıldı: günlük ortalama %2,7 sembol işaretleniyor (hedef <%10).

As a **geliştirici**,
I want bir sembolün günlük verisinden deterministik olayları ve önem puanlarını üreten, test edilebilir bir motor ile bunları saklayan bir veri modeli,
So that "önemli gelişme" kararı açıklanabilir, tekrarlanabilir ve LLM'den bağımsız olsun.

**Acceptance Criteria:**

- **Given** bir sembolün mum, bilanço, SEC dosyası ve temel veri anlık görüntüsü, **When** `detect_events(symbol, date)` çalışırsa, **Then** karar notundaki tablodaki olay türleri için `{type, severity, facts}` listesi döner. `facts` yalnızca ölçülmüş değerleri içerir (örn. `{"change_pct": -7.2, "threshold_pct": 5.0}`) (FR-141).
- **Given** geçmiş veri, **When** eşikler kalibre edilirse, **Then** sıradan bir işlem gününde evrendeki sembollerin yaklaşık %10'undan azı "önemli" çıkar. Kalibrasyon yöntemi ve sonucu story dokümanına yazılır. Bu story'nin ilk görevidir.
- **Given** tespit sonucu, **When** kaydedilirse, **Then** `symbol_insights` tablosunda (global; `symbol, exchange, insight_date` tekil) olaylar, en yüksek önem, AI notu (boş olabilir), `prompt_version` ve oluşturulma zamanı saklanır. Temel metrik değişimi için önceki anlık görüntü `symbol_fundamentals_snapshots` tablosunda tutulur.
- **And** Finnhub `stock/recommendation` hiçbir yerde okunmaz; dedektörler birim testleriyle (sabit veriyle) doğrulanır.

### Story 13.2: Günlük Arka Plan Çalıştırıcısı (`pg_cron` + `pg_net`)

- [x] **Tamamlandı** — bkz. **`docs/stories/story-13.2.md`**. `POST /internal/insights/run` (sırla korunuyor); idempotent, tempolu ve tavanlı çalıştırıcı; yedek tetikleme; `setup_insights_cron.sql`. Canlı uçtan uca doğrulandı. **Açık kalan:** prod kurulumu (migration, cron betiği, Render'da `CRON_SECRET`).

As a **ürün sahibi**,
I want portföylerdeki sembollerin her sabah, kimse uygulamayı açmadan taranmasını,
So that kullanıcı güne başlarken gelişmeleri hazır bulsun.

**Acceptance Criteria:**

- **Given** Supabase'de `pg_cron` ve `pg_net` etkin, **When** saat 05:30 UTC (TR 08:30, açılışlardan önce) olursa, **Then** `POST /internal/insights/run` çağrılır. Yarım kalan işi tamamlamak için 06:30 ve 07:30 UTC'de tekrar çağrılır (FR-140).
- **Given** uç nokta, **When** `X-Cron-Secret` başlığı eksik veya yanlışsa, **Then** 401 döner. Doğruysa hemen 202 döner ve işi arka planda yürütür.
- **Given** bir çalıştırma, **When** yürütülürse, **Then** tüm portföylerdeki farklı ABD sembolleri, en çok kullanıcının tuttuğu sembollerden başlayarak işlenir. O gün işlenmiş semboller atlanır (idempotent). Twelve Data'ya dakikada en fazla 4 istek atılır ve günlük sembol tavanına uyulur. Her çalıştırma `insight_runs` tablosuna başlangıç, bitiş, işlenen/atlanan/hatalı sayılarıyla yazılır.
- **Given** bugünün çalıştırması hiç başlamamış, **When** bir kullanıcı portföyünü açarsa, **Then** çalıştırma tetiklenir ve kullanıcıya "bugünün taraması hazırlanıyor" bilgisi gösterilir. Sessiz eksiklik olmaz (NFR-2).
- **And** kararın `docs/architecture.md`'ye yeni bir mimari karar olarak işlenmesi (AD-8'in yerini alır) ve prod Supabase'de eklentilerin ve cron kaydının kurulum adımlarının dokümante edilmesi.

### Story 13.3: Gelişmeler için AI Notu

- [x] **Tamamlandı** — bkz. **`docs/stories/story-13.3.md`**. Uyum kurallı Gemini notu (Ne oldu / Veride neyi değiştiriyor / Riskler + etki tonu), günlük 50 not tavanı, tempolu yeniden deneme, AI notuna hak kontrolü.

As a **kullanıcı (AI raporu hakkı olan)**,
I want tespit edilen gelişmenin kısa, anlaşılır bir açıklamasını okumak,
So that sayıların ne anlama gelebileceğini hisse sayfasına gitmeden anlayabileyim.

**Acceptance Criteria:**

- **Given** önemli olayı olan bir sembol, **When** çalıştırma onu işlerse, **Then** Gemini'ye yalnızca olayların `facts` alanı ve sembolün temel verisi verilir. Not "Ne oldu / Veride neyi değiştiriyor / Dikkat edilebilecek riskler" yapısında üretilir ve olayın etkisi olumlu/olumsuz/nötr olarak sınıflandırılır (FR-142).
- **Given** `COMPLIANCE_RULES`, **When** not üretilirse, **Then** al/sat/tut, "pozisyonunu gözden geçir", "fırsat", hedef fiyat veya kişisel tavsiye içermez. Not `DISCLAIMER_LINE` ile biter ve `PROMPT_VERSION` ile saklanır.
- **Given** günlük LLM tavanı (başlangıç: 50 not), **When** aşılırsa, **Then** kalan olaylar notsuz kaydedilir ve arayüzde yalnızca olay listesiyle gösterilir.
- **And** AI notu `Entitlement.ai_reports` gerektirir, deterministik olay listesi herkese açıktır (FR-145).

### Story 13.4: Portföy Ekranında Gelişmeler

- [x] **Tamamlandı** — bkz. **`docs/stories/story-13.4.md`**. Portföyde "Yeni gelişme" rozeti, satır içi kart, 7 günlük şerit (web + mobil); okundu durumu.

As a **kullanıcı**,
I want portföyümde hangi hissede önemli bir gelişme olduğunu bir bakışta görmek,
So that her hisseyi tek tek açmadan neyin değiştiğini fark edebileyim.

**Acceptance Criteria:**

- **Given** portföyünde son 7 günde gelişmesi olan bir pozisyon, **When** kullanıcı portföy ekranını açarsa (web + mobil), **Then** o pozisyon satırında "Yeni gelişme" rozeti görünür. Rozete tıklayınca olaylar, AI notu (varsa), tarih ve hisse sayfası bağlantısını içeren kart açılır (FR-143).
- **Given** birden fazla gelişme, **When** portföy açılırsa, **Then** başlığın altında son 7 günün gelişmeleri tarih sırasıyla bir şeritte listelenir.
- **Given** kullanıcı bir gelişmeyi açar, **When** kart görüntülenirse, **Then** `insight_reads` tablosuna okundu kaydı düşer ve rozet "yeni" vurgusunu kaybeder. `insight_reads` `auth.users` üzerinden `ON DELETE CASCADE` bağlıdır.
- **And** `GET /insights?scope=portfolio` yalnızca kullanıcının pozisyonlarındaki sembollerin gelişmelerini döner; karttaki metinler "ne yapılacağını" söylemez.

### Story 13.5: Panelde "Portföyündeki Gelişmeler" ve Hisse Sayfasında "Son Gelişmeler"

- [x] **Tamamlandı** — bkz. **`docs/stories/story-13.5.md`**. Panelde "Portföyündeki Gelişmeler" kartı (okunmamış sayısı), hisse sayfasında "Son gelişmeler" (web + mobil); KVKK metni güncellendi.

As a **kullanıcı**,
I want uygulamayı açtığımda portföyümdeki yeni gelişmeleri ana sayfada görmek,
So that portföy ekranına gitmeden önemli bir şey olup olmadığını anlayabileyim.

**Acceptance Criteria:**

- **Given** okunmamış gelişmeler, **When** kullanıcı Paneli açarsa (web `/dashboard`, mobil `HomeScreen`), **Then** "Portföyündeki Gelişmeler" kartı okunmamış sayısını ve en son 3–5 gelişmeyi gösterir; karttan portföy ekranına ve hisse sayfasına gidilebilir (FR-144).
- **Given** hiç gelişme yok, **When** Panel açılırsa, **Then** kart "Son 7 günde portföyünde önemli bir gelişme yok" der. Portföyü olmayan kullanıcıya kart gösterilmez.
- **Given** bir hisse detay sayfası, **When** o sembol için son 30 günde gelişme varsa, **Then** "Son gelişmeler" bölümü listelenir (portföyde olmasa da).
- **And** `docs/compliance.md` ve KVKK aydınlatma metni güncellenir: yeni işleme amacı ("portföyünüzdeki hisselere ait gelişmeleri göstermek") ve okundu verisi.

### Story 13.6: Portföy Gelişmesi Mobil Bildirimi (Push)

- [x] **Tamamlandı** — bkz. **`docs/stories/story-13.6.md`**. Günde en fazla bir özet mobil push; dokununca portföy ekranı açılıyor; e-posta yok. Cihazda teslim EAS development build bekliyor.

As a **mobil kullanıcı**,
I want portföyümdeki bir hissede önemli gelişme olduğunda telefonuma bildirim gelmesini,
So that uygulamayı açmasam da haberdar olayım.

**Acceptance Criteria:**

- **Given** Story 5.4'teki push tercihi açık ve cihaz anahtarı kayıtlı, **When** sabah taraması kullanıcının tuttuğu hisselerde önemli gelişme kaydederse, **Then** kullanıcıya günde en fazla bir özet push gönderilir. Metin yalnızca olayları söyler ("Portföyünde 2 gelişme: AAPL bilanço açıkladı, MSFT günlük %-6,1") (FR-146).
- **And** e-posta gönderilmez (kullanıcı kararı, 2026-09-28). Gerçek cihazda teslim, Story 5.4'teki gibi EAS development build bekliyor.

### Story 13.7: İzleme Listesindeki Hisselere Genişletme — Opsiyonel

As a **kullanıcı**,
I want izleme listemdeki hisseler için de gelişmeleri görmek,
So that henüz almadığım ama takip ettiğim şirketlerdeki önemli olayları da kaçırmayayım.

**Acceptance Criteria:**

- **Given** izleme listesindeki semboller, **When** tarama evreni hesaplanırsa, **Then** portföy sembollerinden sonra (daha düşük öncelikle) eklenir ve günlük tavan korunur.
- **And** gelişmeler izleme listesi ekranında ve Paneldeki kartta ayrı bir etiketle gösterilir.

### Epic 13 — Kararlar (2026-09-28, kullanıcı)

1. **Kullanıcı sayfası = Panel** (web `/dashboard`, mobil `HomeScreen`).
2. **Önce portföy**; izleme listesi Story 13.7 (sonra).
3. **Bildirim: yalnızca mobil push** (Story 13.6 ilk sürümde), e-posta yok.
4. **Tarama: günde bir kez, sabah açılıştan önce** — 05:30 UTC (TR 08:30), 06:30/07:30 UTC yeniden tetikleme.
5. **Haber başlıkları gösterilecek**, kaynak adı ve bağlantıyla. Yalnızca başlık gösterilir; olayı olan hisselerin kartında son 48 saatten en fazla 3 başlık yer alır.

**Uygulama sırası:** 13.1 → 13.2 → 13.3 → 13.4 → 13.5 → 13.6; 13.7 sonra.

---

## 18. Epic 14: Alan Adı Sonrası Altyapı (borocean.com)

> Kullanıcı 2026-10-09'da `borocean.com` alan adını aldı. Alan adı Vercel'e bağlandı; API CORS ayarı ve Supabase Site URL/yönlendirme ayarı güncellendi, hepsi canlıda doğrulandı. Bu epic, alan adı olmadığı için ertelenmiş işleri toplar. Kaynaklar: `docs/stories/story-1.2.md`, `story-1.7.md`, `story-5.4.md`, `docs/compliance.md` §4.
>
> **Canlıda bulunan sorun (aynı gün düzeltildi):** Giriş sayfasındaki "Google ile devam et" / "Apple ile devam et" düğmeleri, iki sağlayıcı da Supabase'de kapalı olduğu için kullanıcıyı ham bir JSON hata sayfasına ("provider is not enabled") götürüyordu. Artık giriş sayfası Supabase'in açık `/auth/v1/settings` yanıtını okuyor ve yalnızca açık sağlayıcıların düğmesini gösteriyor (`apps/web/src/lib/auth-providers.ts`, 5 dakika önbellek). Bir sağlayıcı açılınca düğmesi deploy gerekmeden görünür.
>
> **Durum tespiti (2026-10-09):** `borocean.com` için MX kaydı yok; SPF kaydı `v=spf1 -all` ("bu alan adından e-posta gönderilmez"; Squarespace'in varsayılanı). E-posta kurulurken bu kayıt değiştirilmeli.

### Story 14.1: Alan Adından E-posta Gönderimi (Resend) ve Supabase SMTP

- [x] **Tamamlandı (2026-10-09).** Resend'de `borocean.com` doğrulandı (bölge eu-west-1; DKIM `resend._domainkey`, gönderim kayıtları `send` alt alan adında). Squarespace'in "e-posta gönderilmez" ayar seti kaldırıldı; `_dmarc` değeri `p=none`. Supabase prod SMTP: `smtp.resend.com:465`, gönderen `Borocean <noreply@borocean.com>`; e-posta sınırı saatte 2'den 30'a çıkarıldı. Türkçe şablonlar: `docs/email-templates/`. **Canlıda uçtan uca doğrulandı:** kayıt → Türkçe onay e-postası → Panel; şifre sıfırlama → Türkçe e-posta → yeni şifreyle giriş; test hesabı silindi. Not: kaydedilen şablonların uygulanması birkaç dakika sürdü.

As a **ürün sahibi**,
I want kayıt onayı, şifre sıfırlama ve alarm e-postalarının `noreply@borocean.com` adresinden, saatlik 2 e-posta sınırına takılmadan gitmesini,
So that kullanıcılar kayıt olurken "Çok fazla deneme" hatası almasın ve e-postalar spam'e düşmesin.

**Karar önerisi:** Tek sağlayıcı olarak **Resend**. Kod zaten Resend kullanıyor (Story 5.4); Resend, Supabase için SMTP de sunuyor (`smtp.resend.com`). Böylece tek DNS doğrulaması ve tek panel yeterli. Ücretsiz plan: ayda 3.000, günde 100 e-posta. Önceki not Brevo'yu öneriyordu (günde 300); günlük kayıt+alarm hacmi 100'ü aşmaya başlarsa Brevo ya da Resend'in ücretli planı değerlendirilir.

**Acceptance Criteria:**

- **Given** Resend hesabı, **When** `borocean.com` eklenip DKIM/SPF/MX(bounce) kayıtları Squarespace DNS'ine girilirse, **Then** alan adı Resend'de "Verified" olur. Resend'in SPF ve bounce (MX) kayıtları `send.borocean.com` alt alan adına girildiği için kök alan adındaki `v=spf1 -all` kaydının değiştirilmesi gerekmez. Ek olarak `_dmarc` kaydı (`p=none` ile başlayarak) eklenir.
- **Given** Supabase prod → Authentication → SMTP Settings, **When** Resend SMTP bilgileri (gönderen `Borocean <noreply@borocean.com>`) girilirse, **Then** onay ve sıfırlama e-postaları bu adresten gider; Rate Limits → e-posta gönderim sınırı saatte 2'den makul bir değere (örn. 30) çıkarılır.
- **And** Supabase e-posta şablonları (onay, şifre sıfırlama) Türkçe ve Borocean markalı hale getirilir.
- **And** gerçek bir kayıt ve şifre sıfırlama, prod'da bir test adresiyle uçtan uca denenir; e-postanın spam'e düşmediği (Gmail'de "SPF/DKIM PASS") kontrol edilir.

### Story 14.2: Alarm E-posta Bildirimlerinin Canlıda Açılması

- [x] **Kod tamamlandı (2026-10-09); canlı kurulum kullanıcıda.**
  - **Bulgu:** Alarmlar yalnızca Alarmlar sayfası açıldığında değerlendiriliyordu, bu yüzden bildirim kullanıcı zaten ekrandayken gidiyordu.
  - **Arka plan değerlendirmesi:** `app/alert_runner.py` + `POST /internal/alerts/run?kind=price|signal` (cron sırrıyla korumalı). Fiyat alarmları hafta içi ABD seansında 15 dakikada bir, sinyal alarmları günde bir kez (05:15 UTC). Kurulum: `scripts/setup_alerts_cron.sql`.
  - Her sembol bir çalıştırmada bir kez çekiliyor.
  - `_mark_triggered` artık yalnızca aktif alarmı güncelliyor, böylece sayfa ve zamanlayıcı aynı anda çalışsa da tek bildirim gidiyor.
  - E-posta ve push metni kullanıcının dilinde; e-posta HTML, alarm ve ayar bağlantıları ile "yatırım tavsiyesi değildir" ibaresi içeriyor.
  - **Doğrulama:** 381 test yeşil. Dev'de gerçek alarmlarla denendi: eşiği geçen AAPL fiyat alarmı ve AAPL sinyal alarmı tetiklendi, MSFT aktif kaldı.
  - **Kullanıcı işi:** Render'a `RESEND_API_KEY` + `NOTIFICATION_FROM_EMAIL`, prod'da `setup_alerts_cron.sql`.

As a **kullanıcı**,
I want fiyat ve sinyal alarmlarım tetiklendiğinde e-posta almak,
So that ayarlardaki "E-posta bildirimleri" seçeneği gerçekten çalışsın.

**Acceptance Criteria:**

- **Given** Story 14.1'de doğrulanmış alan adı, **When** Render'a `RESEND_API_KEY` ve `NOTIFICATION_FROM_EMAIL=Borocean <noreply@borocean.com>` girilirse, **Then** tetiklenen alarmlar için e-posta gönderilir (Story 5.4'ün kodu değişmeden).
- **And** e-posta metni Türkçe/İngilizce kullanıcı diline göre ve "yatırım tavsiyesi değildir" ibaresiyle gider; altta bildirim ayarlarına bağlantı bulunur.
- **And** portföy gelişmeleri için e-posta gönderilmez (Epic 13 kararı, yalnızca mobil push).

### Story 14.3: Kurumsal İletişim Adresleri (KVKK ve Destek)

As a **ürün sahibi**,
I want KVKK başvuruları ve destek için `@borocean.com` adresleri kullanmak,
So that kişisel Gmail adresim hukuki metinlerde ve sitede yayımlanmasın.

**Acceptance Criteria:**

- **Given** Squarespace Domains'in e-posta yönlendirme özelliği (ya da başka bir posta kutusu), **When** `kvkk@borocean.com` ve `destek@borocean.com` kişisel adrese yönlendirilirse, **Then** gelen e-postalar ulaşır (MX kayıtları Story 14.1'deki Resend bounce kaydıyla çakışmayacak şekilde kurulur).
- **And** `/kvkk`, `/privacy`, `/terms` sayfalarındaki iletişim adresi `kvkk@borocean.com` ile değiştirilir (`components/legal/legal-page.tsx` → `CONTACT_EMAIL`).

### Story 14.4: Google ile Giriş (Web)

As a **kullanıcı**,
I want Google hesabımla tek tıkla kayıt olup giriş yapmak,
So that ayrı bir şifre oluşturmak zorunda kalmayayım.

**Acceptance Criteria:**

- **Given** Google Cloud'da bir proje, **When** OAuth onay ekranı (uygulama adı Borocean, yetkili alan adı `borocean.com`, gizlilik ve koşullar bağlantıları, yalnızca `email`/`profile` kapsamları) ve bir Web OAuth istemcisi (yönlendirme adresi `https://ztchiibpegvmtdafyhxa.supabase.co/auth/v1/callback`) oluşturulup uygulama "In production"a alınırsa, **Then** Google, test kullanıcısı listesi olmadan herkes için girişe izin verir. Yalnızca temel kapsamlar kullanıldığı için Google'ın ayrıntılı doğrulaması gerekmez; marka doğrulaması için alan adının Search Console'da doğrulanması gerekebilir.
- **Given** Supabase → Authentication → Providers → Google, **When** istemci kimliği ve sırrı girilirse, **Then** giriş sayfasında "Google ile devam et" düğmesi kendiliğinden görünür (yukarıdaki düzeltme) ve giriş prod'da uçtan uca çalışır.
- **And** Google'dan gelen ad, kullanıcı adı olarak kullanılır (`displayNameFrom` zaten `full_name`'e bakıyor); kullanıcı ayarlardan değiştirebilir.
- **And** KVKK aydınlatma metnindeki "sosyal hesapla giriş" maddesi ve aktarılan taraflar listesi Google'ı içerecek şekilde güncellenir.

### Story 14.5: Apple ile Giriş — Karar Bekliyor

As a **ürün sahibi**,
I want Apple ile girişi açıp açmamaya karar vermek,
So that yıllık maliyeti olan bir özelliği ihtiyaç olduğunda açalım.

**Acceptance Criteria:**

- **Given** Apple Developer Program üyeliği (yıllık 99 USD), **When** bir Services ID (`borocean.com` alan adı ve Supabase callback adresi) ve Sign in with Apple anahtarı oluşturulup Supabase'e girilirse, **Then** "Apple ile devam et" düğmesi kendiliğinden görünür.
- **And** not: iOS uygulaması App Store'a çıkarken başka bir sosyal giriş (Google) sunuluyorsa Apple ile giriş de zorunlu olur; bu story o noktada zorunlu hale gelir. Mobil yayın şu an kapsam dışı.

### Story 14.6: Alan Adı Düzeni ve Temel SEO

As a **ürün sahibi**,
I want sitenin tek bir adreste (`borocean.com`) görünmesini ve arama motorlarında düzgün listelenmesini,
So that `www`, `vercel.app` ve `onrender.com` adresleri dağınık görünmesin.

**Acceptance Criteria:**

- **Given** Vercel alan adı ayarları, **When** `www.borocean.com` ve `web-three-kappa-87.vercel.app` istekleri gelirse, **Then** kalıcı (308) yönlendirmeyle `https://borocean.com`'a gider. Şu an `www` yönlendirmeden 200 dönüyor.
- **And** Next.js `metadata` ile başlık, açıklama, Open Graph görseli ve `metadataBase`; `robots.txt` ve `sitemap.xml` (yalnızca herkese açık sayfalar: ana sayfa, giriş, hukuki metinler) eklenir.
- **And** opsiyonel: API için `api.borocean.com` (Render ücretsiz planı özel alan adı destekliyor). Değiştirilirse `NEXT_PUBLIC_API_URL`, mobil `EXPO_PUBLIC_API_URL` ve Supabase'deki `trigger_insights_run()` adresi birlikte güncellenmeli.

### Epic 14 — Önerilen Sıra ve Kimin Yapacağı

| Sıra | Story | Sende (panel/DNS işleri) | Bende (kod/doğrulama) |
|---|---|---|---|
| 1 | 14.1 E-posta | Resend hesabı, DNS kayıtları, Supabase SMTP ve rate limit | Kayıt kontrolü, şablon metinleri, prod'da uçtan uca deneme |
| 2 | 14.2 Alarm e-postası | Render'a iki ortam değişkeni | E-posta metni (dil, uyarı ibaresi, ayar bağlantısı), deneme |
| 3 | 14.3 İletişim adresleri | Squarespace e-posta yönlendirme | Hukuki sayfalardaki adres |
| 4 | 14.4 Google ile giriş | Google Cloud onay ekranı + istemci, Supabase provider | KVKK metni, prod'da uçtan uca deneme |
| 5 | 14.6 Alan adı düzeni/SEO | Vercel'de `www` yönlendirmesi | metadata, robots, sitemap |
| — | 14.5 Apple | 99 USD/yıl kararı | — |

14.1 en acil olanı: prod'da e-posta gönderimi saatte ~2 ile sınırlı, bu da aynı saatte üçüncü kayıt olmaya çalışan kişinin hata alması demek.

---

## 19. Sonraki Adımlar

*(2026-09-28'de güncellendi.)*

**Durum:** Epic 1–7, 9, 10 ve 12 tamamlandı; Story 8.1 tamamlandı. Mobil eşitlik açıkları kapandı: mobil şifre sıfırlama ve "Simülasyonda al". Web ve API 2026-09-21'den beri canlıda. Story 8.2 bilinçli olarak ertelendi (`ALL_FEATURES_FREE`). Backlog'da iki epic bekliyor: Epic 11 (kripto) ve Epic 13 (portföy gelişme takibi). Hangisinin önce yapılacağına kullanıcı karar vermeli.

**Epic 13:** 2026-09-28'de 13.1–13.6 tamamlandı (13.7 sonra). Canlıya almak için sırasıyla:
- Migration `0013_portfolio_insights.sql` prod Supabase'e uygulanmalı.
- Render'a `CRON_SECRET` girilmeli.
- `apps/api/scripts/setup_insights_cron.sql` prod SQL editöründe çalıştırılmalı.
- İlk sabahın sonucu `insight_runs`'tan kontrol edilmeli.
- **Gemini kota riski:** bkz. Story 13.3 DoD.

Aşağıdaki maddeler Epic 11 ve genel işler içindir.


1. **Epic 11'e başlamadan önce §15'teki açık sorular kullanıcıyla netleştirilmeli:** veri kaynağı (Twelve Data kotası mı, CoinGecko mu), başlangıç evreni (ilk ~100 varlık, USD pariteleri, stablecoin'ler) ve freemium sınırlarının hisse+kripto için ortak olup olmadığı. Epic 11 story'leri `docs/compliance.md`'deki kurallara uymalı (kripto için de al/sat yönlendirmesi yok).
2. **Önerilen Epic 11 sırası:** Sprint 1 — 11.1 (veri adaptörü) + 11.2 (arama ve detay); Sprint 2 — 11.3 (göstergeler/sinyaller) + 11.4 (izleme listesi, alarm, portföy; kesirli miktar); Sprint 3 — 11.5 (simülasyon) + 11.6 (tarama/karşılaştırma) + 11.7 (AI raporları kapsam kararı).
3. **Hukuki açık maddeler** (`docs/compliance.md` §4): avukat incelemesi, veri sorumlusu posta adresi, KVKK m.9 yurt dışı aktarım aracı, veri sağlayıcılarının ticari/yeniden dağıtım lisansları (ücretli katman açılmadan önce).
4. **Özel alan adı alındı (2026-10-09) — bu maddeler Epic 14'e (§18) taşındı:** Google OAuth (consent ekranı `vercel.app`'i kabul etmiyor), Apple Sign-In (ayrıca Apple Developer Program üyeliği gerekiyor), Supabase özel SMTP'si (Brevo) ve e-posta alarm bildirimleri için Render'da `RESEND_API_KEY`/`NOTIFICATION_FROM_EMAIL`.
5. **Mobil cihaz doğrulaması:** Çoğu story'nin DoD'sinde açık kalan "mobil cihaz/simülatör doğrulaması" maddeleri bu geliştirme ortamında yapılamıyor; kullanıcının gerçek cihazda (veya EAS development build ile) toplu bir tur yapması gerekiyor. Cihazda push bildirimi (Story 5.4) de `eas init` + development build bekliyor.
