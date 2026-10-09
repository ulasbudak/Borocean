---
type: epic
title: "Kişiselleştirme"
parent: initiative-borocean
covers: [FR-061, FR-062]
after: []
assignee: ""
status: done
risk: low
---

# Kişiselleştirme

## Description

Epic 7 — `docs/epics.md` içindeki tanımı ve story'leri bu klasöre taşındı; story'lerin ayrıntılı kabul kriterleri `docs/stories/` altındaki dosyalarda.

## Outcome

Kullanıcı ilgi profiline göre öne çıkan hisseleri görür ve hisselere kişisel not ekler.

## Requirements

- FR-061: Kullanıcı, ilgilendiği sektör/hisseleri işaretleyerek kişisel bir ilgi profili oluşturabilmeli; ana ekranda bu profile göre öne çıkan hisseler/haberler gösterilmelidir (kural bazlı öneri, Faz 1).
- FR-062: Kullanıcı, izlediği hisselere kişisel not ekleyebilmelidir.

## Done when

1. İlgi sektörleri seçilir ve Panelde buna göre öne çıkanlar gösterilir.
2. Hisse sayfasında kişisel not eklenir, düzenlenir ve silinir.

## Boundaries

Panel öne çıkanları ve kişisel notlar. Ortak arayüz tasarım sistemi (UI.1) de bu epic'te kayıtlı.

## References

- parent — docs/PRD.md, Bölüm 5 (FR'ler)
- source — docs/epics.md, Epic 7
- architecture — docs/initiative-borocean/architecture-borocean/architecture-borocean.md
- constraint — docs/compliance.md (SPK/KVKK; tüm epic'leri bağlar)
