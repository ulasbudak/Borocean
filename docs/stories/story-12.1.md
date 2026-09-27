---
title: "Story 12.1: Yönlendirici Çıktıların Kaldırılması (SPK — Yatırım Danışmanlığı Sınırı)"
epic: "Epic 12 — Hukuki Uyum (SPK ve KVKK)"
story_id: "12.1"
status: done
created: 2026-09-28
updated: 2026-09-28
author: Claude (kullanıcının paylaştığı hukuki değerlendirmeye göre, 2026-09-28)
based_on: ["docs/compliance.md", "docs/PRD.md §5.14 (FR-130)", "docs/stories/story-3.6.md", "docs/stories/story-3.7.md", "docs/stories/story-9.1.md", "docs/stories/story-9.2.md", "docs/stories/story-9.3.md", "docs/stories/story-9.4.md"]
depends_on: ["3.6", "3.7", "9.1", "9.2", "9.3", "9.4"]
---

# Story 12.1: Yönlendirici Çıktıların Kaldırılması (SPK — Yatırım Danışmanlığı Sınırı)

## Kullanıcı Hikayesi

As a **ürün sahibi**,
I want uygulamanın hiçbir yerde bir hisse için "al/sat/tut" yönlendirmesi, hedef fiyat veya kişiye özel öneri üretmemesini,
So that Borocean, SPK izni gerektiren yatırım danışmanlığı alanına girmeden bir analiz ve bilgilendirme aracı olarak kalsın.

## Bağlam

Kullanıcı 2026-09-28'de bir hukuki değerlendirme paylaştı (özeti: `docs/compliance.md`). Bu değerlendirmeye göre yatırım danışmanlığı SPK iznine tabi ve belirleyici olan uygulamanın gerçekte ne yaptığı; uyarı metni tek başına yeterli değil. En riskli örnekler: "THYAO %92 al" gibi etiketli öneriler, "bugün alabileceğin 5 hisse" listesi ve "87 → Güçlü AL" gibi skor+yönlendirme birleşimi. Önerilen güvenli tasarım ise skoru objektif alt kategorilere ayırmak ve AI çıktısını "finansal durum / analiz / riskler" çerçevesinde tutmak.

Uygulamada bu riskleri taşıyan dört yer vardı: Story 3.6/3.7'nin skor rozetindeki **Al/Nötr/Sat** etiketi, Story 9.3'ün bülteninde en yüksek skorlu **5 hissenin etiketleriyle** listelenmesi, Story 9.2 grafik modelinin "**Al/Sat örüntüsü**" dili ve Story 9.1/9.4 prompt'larında yönlendirmeyi yasaklayan bir kuralın olmaması.

## Kapsam

- **Skor (`app/scoring.py`):** `label` alanı ve `_label_for` kaldırıldı. Yerine `categories`: Değerleme (F/K), Kârlılık (ROE + net marj), Borçluluk (borç/özsermaye), Büyüme (EPS büyümesi), Teknik görünüm (trend + RSI + teknik göstergeler). Her kategori 0-100'e normalize edilir. Gerekçe cümlesi artık yalnızca en yüksek/en düşük kategoriyi ve yukarı yönlü gösterge sayısını anlatıyor. Toplam puan ve faktör dökümü korundu.
- **Web/mobil `ScoreBadge`:** Renkli etiket rozeti kaldırıldı; kategori çubukları ve "al/sat önerisi değildir, kişisel durumunu dikkate almaz" notu eklendi. Başlık "Özet Değerlendirme Skoru" → "Metrik Puanı", AI sekmesinde "Deterministik Skor" → "Kural Bazlı Metrik Puanı".
- **Bülten (`app/bulletins.py`):** Şirketler en yüksek skora göre değil, **piyasa değerine göre** seçiliyor (sektörün en büyük 5 şirketi). Prompt'a skor/etiket değil, temel metrikler (piyasa değeri, F/K, ROE, net marj, borç/özsermaye, EPS büyümesi) veriliyor. `Pick` artık `symbol, name, market_cap`. Eski formattaki bültenler (`picks` içinde `label` olanlar) listeden gizleniyor; bugünün bülteni eski formattaysa yerinde yeniden üretiliyor. Arşiv satırları silinmedi.
- **AI prompt'ları (`app/ai_reports.py`):** Ortak `COMPLIANCE_RULES`: al/sat/tut/biriktir/ekle/azalt ve "fırsat, güçlü al" gibi ifadeler yok; hedef fiyat, fiyat tahmini ve getiri beklentisi yok; kişisel durum veya risk profiline göre tavsiye ve portföy dağılımı yok; "garanti/kesin/risksiz" yok; yalnızca verilen veri; riskler zorunlu. Temel analiz raporu "Finansal durum / Analiz / Riskler" başlıklarıyla; birleşik rapor hüküm cümlesi kurmuyor. `DISCLAIMER_LINE` modele son satır olarak yazdırılıyor, eksikse `ensure_disclaimer` ekliyor.
- **Önbellek:** `PROMPT_VERSION = 2`; `save_report` sürümü içeriğe yazıyor, `get_cached_report` eski sürümleri ıska sayıyor. Böylece eski prompt'la üretilmiş raporlar TTL dolmadan da artık gösterilmiyor.
- **Grafik modeli (`app/ai_technical.py`):** ChartScanAI'nin "Buy"/"Sell" sınıfları `upward`/`downward` olarak dışa açılıyor. Rapor metni "yukarı/aşağı yönlü örüntü" diyor ve bulgunun geçmiş grafiğin okuması olduğunu, tahmin olmadığını belirtiyor.
- **Metinler (i18n):** Genel uyarı "Bu içerik yatırım tavsiyesi değildir; yalnızca kamuya açık verilerin analizi ve bilgilendirme amacı taşır." Giriş alt başlığı "sinyalleri yakala, bir adım önde ol" → "Hisseleri kamuya açık verilerle analiz et, karşılaştır, takip et." Tarama ekranındaki "önerilen değerler" → "örnek / varsayılan değerler".
- **Pazarlama sunumu:** 5. slayt (Al/Nötr/Sat etiketi → metrik puanı + kategori dökümü), 7. slayt ("fırsatları taramak" → "hisseleri taramak"), 10. slayt ("Günün Skoru: hisse skoru paylaşımı" → sektör bazlı metrik özeti), 13. slayt (açık madde → uyum durumu).

**Kapsam dışı:** Sinyal listesindeki "Yükseliş/Düşüş" etiketleri ve "Öne Çıkanlar"daki günün en çok hareket edenleri objektif, geçmiş fiyat olaylarıdır ve değiştirilmedi. Karşılaştırma tablosundaki en iyi/en kötü renklendirmesi yalnızca metrik değerini karşılaştırır ve değiştirilmedi.

## Görevler

1. **[Backend]** Skor: etiketi kaldır, kategorileri ekle, gerekçeyi objektifleştir + testler. ✅
2. **[Backend]** Bülten: piyasa değerine göre seçim, yeni prompt, eski format gizleme/yeniden üretme + testler. ✅
3. **[Backend]** Ortak uyum kuralları, uyarı satırı, `PROMPT_VERSION` önbellek ıskası + testler. ✅
4. **[Backend]** Grafik modeli sınıf adları ve rapor metni + testler. ✅
5. **[Web/Mobil]** `ScoreBadge` kategori görünümü, bülten satırından puan/etiketin kaldırılması. ✅
6. **[Shared]** i18n metinleri (tr/en). ✅
7. **[Doküman]** `docs/compliance.md`, sunum düzeltmeleri. ✅

## Kabul Kriterleri

- **Given** herhangi bir hisse, **When** `/symbols/score` çağrılırsa, **Then** yanıtta `label` yoktur; `categories` beş objektif kategoriyi 0-100 olarak içerir ve gerekçede "Al/Sat/Nötr" geçmez.
- **Given** günün bülteni üretilirken, **When** şirketler seçilirse, **Then** seçim piyasa değerine göredir; bültende şirketlere puan/etiket verilmez ve metin yönlendirme içermez.
- **Given** bir AI raporu üretilirken, **When** prompt modele gider, **Then** al/sat/tut yönlendirmesini, hedef fiyatı ve kişisel tavsiyeyi yasaklayan kurallar prompt'tadır ve rapor uyarı satırıyla biter.
- **Given** eski prompt'la üretilmiş, TTL'i dolmamış bir rapor, **When** istenirse, **Then** yeniden üretilir.

## Definition of Done

- [x] Backend testleri yeşil (338/338), ruff temiz.
- [x] Web ve mobil typecheck + lint temiz; `next build` ve mobil Metro bundle (`expo export --platform ios`) başarılı.
- [x] **Canlı doğrulama** (2026-09-28, yerel API + web, dev Supabase, gerçek Finnhub/Twelve Data/Gemini): AAPL skoru `label` içermiyor, kategoriler 20/100/50/100/65; üç AI raporu yeni prompt'larla yeniden üretildi (eski önbellek `prompt_version` içermiyordu, beklendiği gibi ıska sayıldı). Temel rapor "Finansal durum / Analiz / Riskler" yapısında, al/sat/tut veya hedef fiyat içermiyor, uyarı satırıyla bitiyor. Teknik rapor "3 yukarı yönlü ve 1 aşağı yönlü örüntü" diyor. Günün bülteni (Temel Malzemeler) LIN, NEM, FCX, SHW ve ECL için piyasa değerine göre üretildi; puan/etiket yok, dört eski formattaki bülten listeden gizli.
- [x] **Gerçek tarayıcıda doğrulandı** (Playwright): hisse sayfasında etiket rozeti yok, kategori çubukları ve not görünüyor; AI sekmesi başlığı "Kural Bazlı Metrik Puanı"; panoda bülten ve "Bültende incelenen şirketler (piyasa değerine göre)" satırı; konsol hatası yok.
- [ ] Hukukçu incelemesi — `docs/compliance.md` §4.
- [ ] Mobil cihaz/simülatör doğrulaması — bu ortamda yok.
