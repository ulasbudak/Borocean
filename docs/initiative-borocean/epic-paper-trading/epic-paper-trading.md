---
type: epic
title: "Alım-satım simülasyonu"
parent: initiative-borocean
covers: [FR-110, FR-111, FR-112]
after: []
assignee: ""
status: done
risk: low
---

# Alım-satım simülasyonu

## Description

Epic 10 — `docs/epics.md` içindeki tanımı ve story'leri bu klasöre taşındı; story'lerin ayrıntılı kabul kriterleri `docs/stories/` altındaki dosyalarda.

## Outcome

Kullanıcı sanal bütçeyle simülasyon kurar, gerçek fiyattan alıp satar ve günlük değer geçmişini görür.

## Requirements

- FR-110: Sistem, kullanıcının bir başlangıç bütçesi (sanal nakit) belirleyerek bir alım-satım simülasyonu oluşturmasına izin vermelidir. Bu özellik, mevcut freemium sınırlamasıyla aynı desende (bkz. FR-080-083) ücretsiz katmanda sınırlı (1 simülasyon), premium katmanda sınırsızdır.
- FR-111: Sistem, simülasyon içinde bir sembol için alım/satım emri verildiğinde, emri **kullanıcının girdiği bir fiyattan değil, o anki gerçek piyasa fiyatından** yürütmelidir. Alım emri, emrin maliyeti simülasyonun nakit bakiyesini aşıyorsa reddedilmelidir; satım emri, elde tutulan miktarı aşıyorsa reddedilmelidir. Yalnızca ABD hisseleri desteklenir (BIST için canlı fiyat kaynağı yok, bkz. FR-041).
- FR-112: Sistem, her simülasyon için günlük toplam değer (nakit + pozisyon değeri) ve kâr/zarar geçmişini göstermelidir. Zamanlanmış bir arka plan işi (cron) kurulmadığından (bkz. mimari kısıt, Epic 9/Story 9.3'te de aynı yaklaşım), günün kaydı kullanıcı simülasyonu her açtığında veya her emirden sonra yeniden hesaplanır; geçmiş günlerin kayıtları bir daha değiştirilmez.

## Done when

1. Emir, kullanıcının girdiği değil o anki gerçek fiyattan yürür; bakiye ve pozisyon doğrulanır.
2. Hisse sayfasından 'Simülasyonda al' paneli çalışır.
3. Günlük değer ve kâr/zarar geçmişi gösterilir.

## Boundaries

Yalnızca sanal işlem; aracı kurum bağlantısı yok (PRD §10).

## References

- parent — docs/PRD.md, Bölüm 5 (FR'ler)
- source — docs/epics.md, Epic 10
- architecture — docs/initiative-borocean/architecture-borocean/architecture-borocean.md
- constraint — docs/compliance.md (SPK/KVKK; tüm epic'leri bağlar)
