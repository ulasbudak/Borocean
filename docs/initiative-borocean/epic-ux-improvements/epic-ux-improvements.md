---
type: epic
title: "UX iyileştirmeleri (2026-10-09 UX planı)"
parent: initiative-borocean
covers: []
after: []
assignee: ""
risk: medium
---

# UX iyileştirmeleri (2026-10-09 UX planı)

## Description

Epic 16 — `docs/epics.md` içindeki tanımı ve story'leri bu klasöre taşındı; story'lerin ayrıntılı kabul kriterleri `docs/stories/` altındaki dosyalarda.

## Outcome

Arayüz WCAG AA kontrastına ulaşır, mobil gerçek gezinmeye kavuşur ve yeni kullanıcı ilk girişte boş bir Panelle karşılaşmaz.

## Requirements

PRD FR'si yok; kaynak docs/initiative-borocean/ux-borocean/ux-borocean.md › UX tasarım planı tablosu (16.1–16.7) ve EXPERIENCE.md › Accessibility Floor (NFR-6 platformlar arası tutarlılık).

## Done when

1. Tüm token çiftleri normal metinde en az 4.5:1 (ölçüm betiğiyle).
2. Android geri tuşu bir önceki ekrana döner; push ve derin bağlantı istenen ekranı açar.
3. Web alt sayfalarında Panel'e dönmeden başka bölüme geçilebilir.
4. Erişilebilirlik denetiminde kritik bulgu kalmaz; hepsi canlıda, web ve mobilde.

## Boundaries

Yalnızca docs/initiative-borocean/ux-borocean/ux-borocean.md planındaki maddeler. Sosyal giriş onay ekranı 14.4'te, veri sınırı uyarısı 15.2'de.

## References

- parent — docs/PRD.md, Bölüm 5 (FR'ler)
- source — docs/epics.md, Epic 16
- architecture — docs/initiative-borocean/architecture-borocean/architecture-borocean.md
- constraint — docs/compliance.md (SPK/KVKK; tüm epic'leri bağlar)

## Notes

- Decision: 2026-10-09 — maddeler birbirinden bağımsız; ayrı Refactor sweep eklenmedi. 16.6 (denetim) 16.1'den sonra.
- Open question: 16.2 için gezinme kütüphanesi (expo-router / React Navigation) seçimi; mobil mağaza yayını kararına bağlı.
