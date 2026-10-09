---
type: epic
title: "Abonelik ve monetizasyon (freemium)"
parent: initiative-borocean
covers: [FR-080, FR-081, FR-082, FR-083]
after: []
assignee: ""
status: in-progress
risk: high
---

# Abonelik ve monetizasyon (freemium)

## Description

Epic 8 — `docs/epics.md` içindeki tanımı ve story'leri bu klasöre taşındı; story'lerin ayrıntılı kabul kriterleri `docs/stories/` altındaki dosyalarda.

## Outcome

Ücretsiz ve premium katmanlar net ayrılır; kullanıcı premium'a yükseltip aboneliğini yönetebilir.

## Requirements

- FR-080: Uygulama **freemium** modelde çalışmalıdır: ücretsiz katman ile premium katman arasında net bir özellik ayrımı olmalıdır (bkz. Bölüm 7 — Açık Sorular, kesin sınır netleştirilecek).
- FR-081: Ücretsiz katmanda: gecikmeli/günlük fiyat verisi, temel metrikler, sınırlı sayıda izleme listesi öğesi ve temel indikatörler sunulmalıdır.
- FR-082: Premium katmanda: gerçek zamanlı veri, geniş indikatör kütüphanesi, sınırsız tarama/alarm, gelişmiş karşılaştırma sunulmalıdır.
- FR-083: Kullanıcı uygulama içinden abonelik satın alıp yönetebilmeli (yükseltme/iptal), ödeme sağlayıcı entegrasyonu (App Store/Play Store içi satın alma + web için kart ödemesi) desteklenmelidir.

## Done when

1. Özellik kapıları `entitlements` tablosundan okunur ve tek bayrakla (ALL_FEATURES_FREE) açılabilir.
2. Premium satın alma, iptal ve yenileme web ve mobilde uçtan uca çalışır.
3. Abonelik durumu RevenueCat webhook'u ile güncel tutulur.
4. Hepsi canlıda, web ve mobilde.

## Boundaries

Katman ayrımı ve ödeme. Şu an tüm özellikler ücretsiz (ALL_FEATURES_FREE=True).

## References

- parent — docs/PRD.md, Bölüm 5 (FR'ler)
- source — docs/epics.md, Epic 8
- architecture — docs/initiative-borocean/architecture-borocean/architecture-borocean.md
- constraint — docs/compliance.md (SPK/KVKK; tüm epic'leri bağlar)

## Notes

- Decision: 2026-09-21 — kullanıcı ödeme altyapısını erteledi; tüm özellikler ücretsiz. Story 8.2 kullanıcı açmadan önerilmez.
- Decision: 2026-10-09 — kullanıcı: Epic 8 açık kalsın (8.2 ertelemesi sürüyor).
- Parked: FR-082'nin gerçek zamanlı veri kısmı 8.2 ile birlikte ertelendi; ücretli katmandan önce veri yeniden dağıtım lisansları gerekir (compliance.md §4 madde 5).
