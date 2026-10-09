---
type: epic
title: "İzleme listesi, alarmlar ve bildirimler"
parent: initiative-borocean
covers: [FR-040, FR-041, FR-042, FR-043, FR-070]
after: []
assignee: ""
status: done
risk: medium
---

# İzleme listesi, alarmlar ve bildirimler

## Description

Epic 5 — `docs/epics.md` içindeki tanımı ve story'leri bu klasöre taşındı; story'lerin ayrıntılı kabul kriterleri `docs/stories/` altındaki dosyalarda.

## Outcome

Kullanıcı hisseleri izleme listelerinde toplar, fiyat ve sinyal alarmı kurar ve alarm tetiklenince push ve e-posta alır.

## Requirements

- FR-040: Kullanıcı sınırsız sayıda hisseyi bir veya birden fazla izleme listesine (watchlist) ekleyebilmelidir.
- FR-041: Kullanıcı, fiyat eşiği (üstüne/altına düşünce) bazlı alarm kurabilmelidir.
- FR-042: Kullanıcı, indikatör/sinyal bazlı alarm kurabilmelidir (örn. "RSI 70 üstüne çıkarsa bildir").
- FR-043: Alarm tetiklendiğinde kullanıcıya push bildirim (mobil) ve/veya e-posta ile bilgi verilmelidir. **Bu epic: push ve e-posta kodu. Alan adından gönderim ve arka plan değerlendirmesi Epic 14'te.**
- FR-070: Push bildirimleri (mobil) ve e-posta bildirimleri desteklenmelidir. **Bu epic: push ve e-posta kanalları. Alan adından gönderim Epic 14'te.**

## Done when

1. İzleme listeleri oluşturulur, düzenlenir, silinir (web + mobil).
2. Fiyat ve sinyal alarmları arka planda değerlendirilir ve tek bildirim gönderir.
3. Mobil push ve e-posta bildirimleri kullanıcı tercihine göre gider (canlıda doğrulandı, Story 14.2).

## Boundaries

İzleme listesi, alarmlar ve bildirim kanalları. Alarm e-postasının canlıya alınması Epic 14'te (14.2).

## References

- parent — docs/PRD.md, Bölüm 5 (FR'ler)
- source — docs/epics.md, Epic 5
- architecture — docs/initiative-borocean/architecture-borocean/architecture-borocean.md
- constraint — docs/compliance.md (SPK/KVKK; tüm epic'leri bağlar)
