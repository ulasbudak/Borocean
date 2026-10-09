---
type: epic
title: "Temel analiz"
parent: initiative-borocean
covers: [FR-010, FR-011, FR-013]
after: []
assignee: ""
status: done
risk: low
---

# Temel analiz

## Description

Epic 2 — `docs/epics.md` içindeki tanımı ve story'leri bu klasöre taşındı; story'lerin ayrıntılı kabul kriterleri `docs/stories/` altındaki dosyalarda.

## Outcome

Kullanıcı bir hissenin temel metriklerini, sektör ortalamasına göre konumunu ve 5 yıllık finansal geçmişini görür.

## Requirements

- FR-010: Sistem, dünyada en yaygın kullanılan temel analiz metriklerini göstermelidir: F/K (P/E), PD/DD (P/B), ROE, ROA, EPS ve EPS büyüme oranı, temettü verimi, borç/özsermaye oranı, brüt/net kâr marjı, piyasa değeri, FAVÖK (EBITDA) marjı, serbest nakit akışı.
- FR-011: Her metrik, hissenin **sektör/endeks ortalamasına** göre karşılaştırmalı olarak gösterilmelidir (örn. "Sektör ortalaması F/K: 18.2, bu hisse: 14.5").
- FR-013: Şirketin geçmiş finansal verileri (gelir, net kâr, EPS) en az son 5 yıl/20 çeyrek için grafik olarak sunulmalıdır.

## Done when

1. Hisse sayfasında FR-010 metrikleri sektör ortalamasıyla yan yana görünür.
2. Gelir, net kâr ve EPS en az 5 yıl/20 çeyrek grafikle gösterilir.
3. Veri alınamazsa sessiz hata yerine açıklayıcı uyarı çıkar.

## Boundaries

Hisse sayfasının temel analiz sekmesi; skor Epic 3'te.

## References

- parent — docs/PRD.md, Bölüm 5 (FR'ler)
- source — docs/epics.md, Epic 2
- architecture — docs/initiative-borocean/architecture-borocean/architecture-borocean.md
- constraint — docs/compliance.md (SPK/KVKK; tüm epic'leri bağlar)
