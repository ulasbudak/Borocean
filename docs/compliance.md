---
title: "Borocean — Hukuki Uyum Notu (SPK ve KVKK)"
status: active
created: 2026-09-28
updated: 2026-09-28
author: Claude (kullanıcının paylaştığı hukuki değerlendirmeye göre, 2026-09-28)
relatedDocs: ["docs/PRD.md §5.14, §9", "docs/epics.md §16 (Epic 12)", "docs/stories/story-12.1.md", "docs/stories/story-12.2.md"]
---

# Borocean — Hukuki Uyum Notu (SPK ve KVKK)

> Bu not bir hukuki görüş değildir. Kullanıcının 2026-09-28'de paylaştığı değerlendirmenin ürüne nasıl uygulandığını ve açık kalan maddeleri kayıt altına alır. Yayından ve yatırımcı sunumundan önce bir avukatın incelemesi hâlâ gerekli (bkz. §4).

## 1. Temel ilke

Belirleyici olan AI kullanılması değil, uygulamanın kullanıcıya **ne tür bir hizmet sunduğudur**. SPK'nın güncel rehberinde yatırım danışmanlığı, izne tabi yatırım hizmet ve faaliyetleri arasında sayılır. Kişiye yönelik "bu hisseyi al/sat/tut" yönlendirmesi, kişisel duruma (risk profili, gelir, yaş) göre öneri ve portföy dağılımı önermek bu alana girer. Şirket finansallarını analiz etmek, oran hesaplamak, geçmiş fiyat hareketini göstermek ve seçilen hisseleri karşılaştırmak ise danışmanlıktan uzak durur. **Sayfaya uyarı metni koymak, faaliyetin hukuki niteliğini tek başına değiştirmez; uygulamanın gerçekte ne yaptığına bakılır.**

## 2. Ürüne uygulanan değişiklikler (2026-09-28)

| Risk | Önceki durum | Yapılan değişiklik | Yer |
|---|---|---|---|
| Skorun yanında AL/SAT etiketi | 0-100 skor + **Al/Nötr/Sat** etiketi; gerekçe cümlesi etiketi tekrarlıyordu | Etiket tamamen kaldırıldı. Skor, objektif metriklerden türeyen **kategorilere** ayrıldı: Değerleme, Kârlılık, Borçluluk, Büyüme, Teknik görünüm (her biri 0-100). Gerekçe yalnızca ne ölçüldüğünü anlatıyor. Kart altında "al/sat önerisi değildir, kişisel durumunu dikkate almaz" notu | `app/scoring.py`, web/mobil `ScoreBadge` |
| "Bana bugün alabileceğim 5 hisse" | Günlük bülten, sektörün **en yüksek skorlu 5 hissesini** Al/Nötr/Sat etiketleriyle listeliyordu | Şirketler artık **piyasa değerine** göre (objektif, değerlendirme içermeyen ölçüt) seçiliyor; puan/etiket gösterilmiyor. Prompt sektörün metrik görünümünü ve risklerini anlatıyor, şirketleri çekiciliğe göre sıralamıyor. Eski formattaki bültenler listeden gizlendi | `app/bulletins.py` |
| AI'ın yönlendirici dil üretmesi | Prompt'larda yasak yoktu; birleşik rapor "hüküm" veriyordu | Tüm prompt'lara ortak `COMPLIANCE_RULES`: al/sat/tut/biriktir yok, hedef fiyat ve getiri tahmini yok, kişisel duruma göre tavsiye ve portföy dağılımı yok, "garanti/kesin kazanç" yok, riskler zorunlu. Temel analiz raporu önerilen yapıda: **Finansal durum → Analiz → Riskler → uyarı** | `app/ai_reports.py`, `ai_fundamental.py`, `ai_combined.py` |
| Grafik modelinin "Al/Sat" sınıfları | Rapor "3 Al ve 1 Sat örüntüsü" diyordu | Sınıflar "yukarı yönlü / aşağı yönlü örüntü" olarak adlandırıldı; raporda bunun geçmiş grafik okuması olduğu, tahmin olmadığı açıkça yazıyor | `app/ai_technical.py` |
| Eski raporların sunulmaya devam etmesi | Önbellek 5-24 saat eski metinleri döndürürdü | `PROMPT_VERSION` ile eski sürümde üretilmiş raporlar önbellek ıskası sayılıyor ve yeniden üretiliyor | `app/ai_reports.py` |
| Uyarı metni | "Bu sayfadaki bilgiler yatırım tavsiyesi değildir." | "Bu içerik yatırım tavsiyesi değildir; yalnızca kamuya açık verilerin analizi ve bilgilendirme amacı taşır." Model unutursa `ensure_disclaimer` ekliyor | i18n `common.disclaimer`, AI raporları |
| Pazarlama dili | Giriş alt başlığı: "sinyalleri yakala, bir adım önde ol"; sunumda "Al/Nötr/Sat etiketi", "Günün Skoru" fikri | "Hisseleri kamuya açık verilerle analiz et, karşılaştır, takip et." Sunumda 5, 7, 10 ve 13. slaytlar düzeltildi | i18n `auth.subtitle`, `docs/marketing/Borocean-Sunum.pptx` |
| KVKK aydınlatma | Yalnızca taslak bir gizlilik politikası vardı | `/kvkk` (veri sorumlusu, işlenen veriler, amaçlar ve m.5 hukuki sebepleri, aktarım ve yurt dışı sağlayıcılar, toplama yöntemi, saklama, m.11 hakları), `/terms` (yatırım danışmanlığı olmadığı, veri doğruluğu, AI ve simülasyon sınırları), güncellenmiş `/privacy`. Kayıt ekranında (web + mobil) bilgilendirme ve bağlantılar | `apps/web/src/app/{kvkk,terms,privacy}` |
| Silme hakkı | Silme e-postayla talep ediliyordu | Ayarlar → **Hesabı sil** (web + mobil): `DELETE /me`, `auth.users` satırını siler; tüm kullanıcı tabloları `ON DELETE CASCADE` olduğu için tüm veriler tek sorguda silinir | `app/account.py` |

Uygulama zaten doğru tarafta olan konular: yaş/gelir/risk profili **toplanmıyor**, yerindelik testi veya kişiye özel portföy önerisi yok, gerçek emir iletilmiyor (simülasyon tamamen sanal), portföy verisi öneri üretmek için kullanılmıyor.

## 2a. Epic 13 — portföy gelişmeleri (2026-09-28)

- Gelişmeler deterministik kurallarla tespit edilir (`app/insight_detectors.py`); AI yalnızca açıklar. Kart ne olduğunu anlatır, ne yapılacağını söylemez. AI notu `COMPLIANCE_RULES` ile üretilir ve modele okurun hisseyi tuttuğunu varsaymaması söylenir.
- Finnhub `stock/recommendation` (analistlerin al/sat sayıları) kullanılmaz. Haber başlıkları kaynak adı ve bağlantıyla gösterilir, metin kopyalanmaz. "Stock to buy", "should you sell" gibi yönlendirici başlıklar filtrelenir (`app/insight_sources.py`).
- Push metni yalnızca olayı söyler ("AAPL: günlük değişim %-6,1").
- KVKK aydınlatma metnine yeni amaç ve okundu verisi eklendi. `insight_reads` ve `insight_push_log` tabloları `auth.users` üzerinden `ON DELETE CASCADE` bağlı, hesap silmeyle birlikte silinir.
- Avukat incelemesine eklenecek soru: gelişmelerin kullanıcının pozisyonlarına göre seçilip gösterilmesi "kişiselleştirilmiş bilgilendirme" sayılır mı?

## 3. Pazarlama için kurallar

- "Garanti kazanç", "yükselecek hisseyi biliyoruz", "%X getiri" gibi ifadeler kullanılmaz.
- Belirli bir hisseyi öne çıkarıp "alınır/kaçırma" çağrısı yapılmaz; sosyal medyada "günün hissesi/skoru" paylaşımı yapılmaz. Sektör veya metrik bazlı, objektif veri paylaşımı yapılabilir.
- AI "analist", "danışman" veya "strateji üretici" olarak değil, **analiz ve özetleme aracı** olarak anlatılır.

## 4. Açık maddeler (kullanıcının karar/işlem yapması gerekiyor)

1. **Avukat incelemesi:** `/terms`, `/kvkk`, `/privacy` metinleri iyi niyetli taslaklardır; avukat onayından geçmedi. Yayından ve yatırımcı sunumundan önce SPK ve KVKK konusunda bir hukukçuya gösterilmeli.
2. **Veri sorumlusu kimliği ve adresi:** KVKK m.10 veri sorumlusunun kimliğini ister. Metinde şimdilik ad ve e-posta var; posta adresi (veya şirket kurulursa unvan ve MERSİS no) eklenmeli.
3. **Yurt dışına aktarım (KVKK m.9, 2024 değişikliği):** Supabase, Vercel, Render, Resend ve Expo yurt dışı sağlayıcılardır. Hangi aktarım aracının kullanılacağı (ör. standart sözleşme imzalanıp 5 iş günü içinde Kurul'a bildirilmesi) avukatla netleştirilmeli.
4. **VERBİS:** Yıllık çalışan sayısı 50'den ve yıllık mali bilanço toplamı 100 milyon TL'den az olan ve ana faaliyeti özel nitelikli veri işlemek olmayan veri sorumluları kayıttan muaf. Şirketleşme veya büyüme olursa yeniden değerlendirilmeli.
5. **Veri lisansları:** Finnhub ve Twelve Data **ücretsiz planları** kullanılıyor. Bu planların koşulları genellikle ticari kullanımı ve verinin son kullanıcıya yeniden dağıtımını kısıtlar. Ücretli katman açılmadan (veya ticari yayın büyümeden) önce sağlayıcıların ticari/yeniden dağıtım lisansı alınmalı. BIST verisi için Borsa İstanbul veri dağıtım lisansı gerekir (BIST şu an kapalı).
5a. **Hesap varlığı açıklaması (2026-10-09, Story 1.9):** Giriş ekranı, kullanıcı isteğiyle kayıtsız e-postalar için "kayıtlı hesap bulunamadı" diyor. Bu, bir e-postanın Borocean'a kayıtlı olduğunu herkese söyler. Hız sınırıyla azaltıldı; avukata sorulacaklar listesine eklenmeli.
6. **Sosyal giriş:** Google/Apple ile giriş etkinleştirildiğinde aydınlatma metnindeki "sosyal hesapla giriş" maddesi geçerli hale gelir; sağlayıcı listesine eklenmesi gerekir.
7. **Kripto (Epic 11):** Aynı ilkeler kripto için de geçerli; kripto varlık hizmet sağlayıcısı izlenimi verilmemeli. Epic 11 story'leri bu nota uymalı.
