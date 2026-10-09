---
type: epic
title: "Kod inceleme bulgularının düzeltilmesi (2026-10-09)"
parent: initiative-borocean
covers: [FR-001, FR-030, FR-042, FR-043, FR-050, FR-061, FR-100, FR-101, FR-111, FR-112]
after: []
assignee: ""
risk: high
---

# Kod inceleme bulgularının düzeltilmesi (2026-10-09)

## Description

Epic 15 — `docs/epics.md` içindeki tanımı ve story'leri bu klasöre taşındı; story'lerin ayrıntılı kabul kriterleri `docs/stories/` altındaki dosyalarda.

## Outcome

Tüm kod tabanı incelemesinde (docs/initiative-borocean/review-codebase-2026-10-09.md) doğrulanan 10 düzeltme ve AI metinlerinin kullanıcının dilinde üretilmesi canlıya çıkar; kullanıcılar yanlış alarm, eksik tarama sonucu veya donmuş grafik görmez.

## Requirements

- FR-001: Kullanıcı, sembol veya şirket adına göre ABD ve BIST hisselerini arayabilmeli; sonuçlar borsa/piyasa etiketiyle (örn. NASDAQ, BIST) listelenmelidir.
- FR-030: Kullanıcı, temel VE teknik kriterleri (örn. piyasa değeri aralığı, F/K aralığı, RSI aralığı, hacim artışı, sektör, borsa) birlikte kullanarak **çoklu kriter tarama** yapabilmelidir.
- FR-042: Kullanıcı, indikatör/sinyal bazlı alarm kurabilmelidir (örn. "RSI 70 üstüne çıkarsa bildir").
- FR-043: Alarm tetiklendiğinde kullanıcıya push bildirim (mobil) ve/veya e-posta ile bilgi verilmelidir.
- FR-050: Kullanıcı, sahip olduğu hisseleri manuel olarak (adet + maliyet fiyatı) portföyüne ekleyebilmelidir.
- FR-061: Kullanıcı, ilgilendiği sektör/hisseleri işaretleyerek kişisel bir ilgi profili oluşturabilmeli; ana ekranda bu profile göre öne çıkan hisseler/haberler gösterilmelidir (kural bazlı öneri, Faz 1).
- FR-100: Sistem, hisse detay sayfasında, seçilen hisse için **temel analiz odaklı bir AI raporu** üretmelidir. Rapor, uygulamanın kendi hesapladığı temel verilerle (F/K, ROE, borç/özsermaye, sektör kıyaslaması, geçmiş finansal performans — Epic 2 çıktısı) zemine oturtulmalı (RAG); salt LLM eğitim verisine dayanmamalıdır. LLM sağlayıcı: Google Gemini API (2026-09-18'de Anthropic Claude olarak kararlaştırıldı, 2026-09-19'da Gemini'ye geçirildi — bkz. `docs/stories/story-9.1.md` Bağlam). Bu özellik premium katmana bağlıdır (bkz. FR-080-083) ve maliyet kontrolü için sembol başına önbelleğe alınır (kullanıcı bazlı değil).
- FR-101: Sistem, fiyat grafiğinden üretilen bir candlestick görüntüsü üzerinde, **önceden eğitilmiş bir görüntü-tanıma (CV) modeliyle** grafik okuması yapmalıdır (model seçimi ve gerekçesi: `docs/product-brief-epic9-ai.md` §"2026-09-18 Güncellemesi" — MIT lisanslı, hazır ağırlıklı bir YOLOv8 modeli). Çıktı, mevcut sinyal motoruyla (FR-024) aynı hukuki çerçevede, deterministik skordan **ayrı ve açıkça etiketlenmiş bir "modelin okuması"** olarak sunulmalı; "AI trading stratejisi" gibi tavsiye niteliğinde bir dille konumlandırılmamalıdır (bkz. Bölüm 9, yatırım danışmanlığı sınırı). Bu özellik premium katmana bağlıdır ve sembol başına önbelleğe alınır.
- FR-111: Sistem, simülasyon içinde bir sembol için alım/satım emri verildiğinde, emri **kullanıcının girdiği bir fiyattan değil, o anki gerçek piyasa fiyatından** yürütmelidir. Alım emri, emrin maliyeti simülasyonun nakit bakiyesini aşıyorsa reddedilmelidir; satım emri, elde tutulan miktarı aşıyorsa reddedilmelidir. Yalnızca ABD hisseleri desteklenir (BIST için canlı fiyat kaynağı yok, bkz. FR-041).
- FR-112: Sistem, her simülasyon için günlük toplam değer (nakit + pozisyon değeri) ve kâr/zarar geçmişini göstermelidir. Zamanlanmış bir arka plan işi (cron) kurulmadığından (bkz. mimari kısıt, Epic 9/Story 9.3'te de aynı yaklaşım), günün kaydı kullanıcı simülasyonu her açtığında veya her emirden sonra yeniden hesaplanır; geçmiş günlerin kayıtları bir daha değiştirilmez.

## Done when

1. Yeni kurulan bir sinyal alarmı yalnızca kurulduktan sonra oluşan sinyalle tetiklenir.
2. Finnhub çağrıları süreç genelinde sınırlanır; dakikalık sınır aşılınca kullanıcı eksik sonuç yerine açıklayıcı uyarı görür.
3. /auth/confirm açık yönlendirme ve login-CSRF içermez; eşzamanlı emirler nakit veya miktar kaybettirmez.
4. Her düzeltmenin bir regresyon testi vardır; API testleri ve lint CI'da yeşil; hepsi canlıda.

## Boundaries

Yalnızca incelemenin 'patch' bulguları. 'Defer' bulguları: D1 Story 14.4'e bağlandı, D3 QA çalışmasında; D2 (AI metinlerinin dili) entry 11 oldu.

## References

- parent — docs/PRD.md, Bölüm 5 (FR'ler)
- source — docs/epics.md, Epic 15
- architecture — docs/initiative-borocean/architecture-borocean/architecture-borocean.md
- constraint — docs/compliance.md (SPK/KVKK; tüm epic'leri bağlar)

## Notes

- Decision: 2026-10-09 — bulgular bağımsız; ayrı Refactor sweep eklenmedi. Aynı dosyaya dokunanlar after ile sıralandı (H1→L4, H2→M4, L1→L2→M2; M3 (15.5) en başta: QA canlı etkisini ölçtü (Panel açıkken arama ~45 sn bekliyor) ve tüm modüllerin DB erişimine dokunduğu için diğerleri onu bekler).
- Decision: 2026-10-09 — kullanıcı: AI metinleri, kullanıcı sayfayı hangi dilde kullanıyorsa o dilde üretilsin (D2 → entry 11, AD-12).
