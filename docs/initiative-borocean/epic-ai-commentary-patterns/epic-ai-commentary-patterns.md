---
type: epic
title: "AI destekli yorum ve örüntü tanıma"
parent: initiative-borocean
covers: [FR-100, FR-101]
after: []
assignee: ""
status: done
risk: high
---

# AI destekli yorum ve örüntü tanıma

## Description

Epic 9 — `docs/epics.md` içindeki tanımı ve story'leri bu klasöre taşındı; story'lerin ayrıntılı kabul kriterleri `docs/stories/` altındaki dosyalarda.

## Outcome

Kullanıcı hisse sayfasında temel analiz AI raporu, grafik okuması, birleşik değerlendirme ve günlük sektör bülteni okur; hiçbiri yönlendirme içermez.

## Requirements

- FR-100: Sistem, hisse detay sayfasında, seçilen hisse için **temel analiz odaklı bir AI raporu** üretmelidir. Rapor, uygulamanın kendi hesapladığı temel verilerle (F/K, ROE, borç/özsermaye, sektör kıyaslaması, geçmiş finansal performans — Epic 2 çıktısı) zemine oturtulmalı (RAG); salt LLM eğitim verisine dayanmamalıdır. LLM sağlayıcı: Google Gemini API (2026-09-18'de Anthropic Claude olarak kararlaştırıldı, 2026-09-19'da Gemini'ye geçirildi — bkz. `docs/stories/story-9.1.md` Bağlam). Bu özellik premium katmana bağlıdır (bkz. FR-080-083) ve maliyet kontrolü için sembol başına önbelleğe alınır (kullanıcı bazlı değil).
- FR-101: Sistem, fiyat grafiğinden üretilen bir candlestick görüntüsü üzerinde, **önceden eğitilmiş bir görüntü-tanıma (CV) modeliyle** grafik okuması yapmalıdır (model seçimi ve gerekçesi: `docs/product-brief-epic9-ai.md` §"2026-09-18 Güncellemesi" — MIT lisanslı, hazır ağırlıklı bir YOLOv8 modeli). Çıktı, mevcut sinyal motoruyla (FR-024) aynı hukuki çerçevede, deterministik skordan **ayrı ve açıkça etiketlenmiş bir "modelin okuması"** olarak sunulmalı; "AI trading stratejisi" gibi tavsiye niteliğinde bir dille konumlandırılmamalıdır (bkz. Bölüm 9, yatırım danışmanlığı sınırı). Bu özellik premium katmana bağlıdır ve sembol başına önbelleğe alınır.

## Done when

1. AI raporları uyum kurallarıyla (PROMPT_VERSION, COMPLIANCE_RULES) üretilir ve önbelleklenir.
2. CV modeli grafik okuması 'deneysel' etiketiyle gösterilir.
3. Günlük sektör bülteni Panelde en son sayısıyla, arşivi /bulletins sayfasında görünür.

## Boundaries

AI raporları ve bülten. Gemini kotası paylaşılır (Epic 13 ile).

## References

- parent — docs/PRD.md, Bölüm 5 (FR'ler)
- source — docs/epics.md, Epic 9
- architecture — docs/initiative-borocean/architecture-borocean/architecture-borocean.md
- constraint — docs/compliance.md (SPK/KVKK; tüm epic'leri bağlar)
