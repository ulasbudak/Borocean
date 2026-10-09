---
type: epic
title: "Tarama ve karşılaştırma"
parent: initiative-borocean
covers: [FR-030, FR-031, FR-032]
after: []
assignee: ""
status: done
risk: low
---

# Tarama ve karşılaştırma

## Description

Epic 4 — `docs/epics.md` içindeki tanımı ve story'leri bu klasöre taşındı; story'lerin ayrıntılı kabul kriterleri `docs/stories/` altındaki dosyalarda.

## Outcome

Kullanıcı temel ve teknik kriterleri birleştirerek tarar, taramalarını kaydeder ve en az 4 hisseyi yan yana karşılaştırır.

## Requirements

- FR-030: Kullanıcı, temel VE teknik kriterleri (örn. piyasa değeri aralığı, F/K aralığı, RSI aralığı, hacim artışı, sektör, borsa) birlikte kullanarak **çoklu kriter tarama** yapabilmelidir.
- FR-031: Tarama kriterleri kaydedilebilmeli ve kayıtlı taramalar tek tıkla tekrar çalıştırılabilmelidir.
- FR-032: Kullanıcı, birden fazla hisseyi (en az 4) yan yana **karşılaştırma tablosunda** temel ve teknik metriklerle kıyaslayabilmelidir.

## Done when

1. Çoklu kriter taraması API kotasını aşmadan sonuç döner.
2. Kayıtlı tarama tek tıkla yeniden çalışır.
3. Karşılaştırma tablosu en az 4 hisseyi temel ve teknik metriklerle gösterir.

## Boundaries

Tarama ve karşılaştırma ekranları; kripto taraması Epic 11'de (11.6).

## References

- parent — docs/PRD.md, Bölüm 5 (FR'ler)
- source — docs/epics.md, Epic 4
- architecture — docs/initiative-borocean/architecture-borocean/architecture-borocean.md
- constraint — docs/compliance.md (SPK/KVKK; tüm epic'leri bağlar)
