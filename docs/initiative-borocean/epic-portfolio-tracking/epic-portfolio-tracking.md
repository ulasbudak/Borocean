---
type: epic
title: "Portföy takibi"
parent: initiative-borocean
covers: [FR-050, FR-051, FR-052]
after: []
assignee: ""
status: done
risk: low
---

# Portföy takibi

## Description

Epic 6 — `docs/epics.md` içindeki tanımı ve story'leri bu klasöre taşındı; story'lerin ayrıntılı kabul kriterleri `docs/stories/` altındaki dosyalarda.

## Outcome

Kullanıcı sahip olduğu hisseleri birden fazla portföyde izler; anlık değer ve kâr/zarar hesaplanır.

## Requirements

- FR-050: Kullanıcı, sahip olduğu hisseleri manuel olarak (adet + maliyet fiyatı) portföyüne ekleyebilmelidir.
- FR-051: Sistem, portföyün anlık toplam değerini ve pozisyon bazlı kâr/zarar (TL ve % olarak) hesaplamalıdır.
- FR-052: Çoklu portföy (örn. "ABD hisseleri", "BIST uzun vade") desteklenmelidir.

## Done when

1. Pozisyon, sembol otomatik tamamlama ile eklenir; adet ve maliyet doğrulanır.
2. Portföy değeri ve pozisyon bazlı kâr/zarar TL/USD ve % olarak doğru hesaplanır.
3. Birden fazla portföy oluşturulup aralarında geçilir.

## Boundaries

Portföy ekranları ve değerleme; gelişme takibi Epic 13'te.

## References

- parent — docs/PRD.md, Bölüm 5 (FR'ler)
- source — docs/epics.md, Epic 6
- architecture — docs/initiative-borocean/architecture-borocean/architecture-borocean.md
- constraint — docs/compliance.md (SPK/KVKK; tüm epic'leri bağlar)
