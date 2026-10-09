---
type: epic
title: "Teknik analiz ve özet değerlendirme skoru"
parent: initiative-borocean
covers: [FR-020, FR-021, FR-022, FR-023, FR-024, FR-003]
after: []
assignee: ""
status: done
risk: medium
---

# Teknik analiz ve özet değerlendirme skoru

## Description

Epic 3 — `docs/epics.md` içindeki tanımı ve story'leri bu klasöre taşındı; story'lerin ayrıntılı kabul kriterleri `docs/stories/` altındaki dosyalarda.

## Outcome

Kullanıcı interaktif grafikte 30+ indikatör ve çizim araçlarıyla çalışır, kural bazlı sinyalleri ve temel+teknik özet skoru görür.

## Requirements

- FR-020: İnteraktif fiyat grafiği: mum (candlestick), çizgi ve bar grafik türleri; gün içi, günlük, haftalık, aylık zaman dilimleri desteklenmelidir.
- FR-021: Çekirdek indikatör seti grafiğe eklenebilmelidir: Basit/Üssel Hareketli Ortalamalar (SMA/EMA), RSI, MACD, Bollinger Bantları, Hacim, Stokastik Osilatör.
- FR-022: Geniş indikatör kütüphanesi (30+ indikatör: ADX, Fibonacci Retracement, Ichimoku, ATR, OBV, Parabolic SAR, Williams %R, vb.) desteklenmelidir.
- FR-023: Kullanıcı grafik üzerine trend çizgisi, yatay destek/direnç çizgisi gibi manuel çizim araçları ekleyebilmelidir.
- FR-024: **Kural bazlı otomatik sinyal üretimi**: sistem, kullanıcı tanımlı veya hazır kural setlerine göre (örn. "RSI 30 altına düştü", "MACD altın kesişim yaptı", "fiyat 50 günlük ortalamayı yukarı kesti") sinyal üretip listeleyebilmelidir. *(Not: Faz 1'de kural tabanlı/deterministik sinyal motoru hedeflenir; ML tabanlı öngörü modelleri Faz 2 kapsamındadır — bkz. FR-025.)*
- FR-003: Sistem, sade bir **özet skor/derecelendirme** üretmelidir (temel + teknik sinyallerin birleşiminden türetilen, amatör kullanıcı için anlaşılır bir gösterge — örn. 1-100 skoru veya Al/Nötr/Sat etiketi).

## Done when

1. Mum/çizgi/bar grafik ve 4 zaman dilimi web ve mobilde çalışır.
2. Çekirdek ve 30+ gelişmiş indikatör grafiğe eklenip kaldırılabilir; trend ve destek/direnç çizilebilir.
3. Kural bazlı sinyaller ve özet skor, al/sat yönlendirmesi içermeden (Epic 12) gösterilir.

## Boundaries

Grafik, indikatörler, sinyal motoru ve skor. AI grafik okuması Epic 9'da.

## References

- parent — docs/PRD.md, Bölüm 5 (FR'ler)
- source — docs/epics.md, Epic 3
- architecture — docs/initiative-borocean/architecture-borocean/architecture-borocean.md
- constraint — docs/compliance.md (SPK/KVKK; tüm epic'leri bağlar)

## Notes

- Decision: 2026-09-28 — Story 12.1, Story 3.7'nin al/sat etiketlerini kaldırdı; motor yalnızca yönlendirme içermeyen sinyal ve skor üretir (docs/compliance.md).
