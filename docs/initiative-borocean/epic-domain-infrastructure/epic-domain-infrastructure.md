---
type: epic
title: "Alan adı sonrası altyapı (borocean.com)"
parent: initiative-borocean
covers: [FR-060, FR-043, FR-070]
after: []
assignee: ""
status: in-progress
risk: medium
---

# Alan adı sonrası altyapı (borocean.com)

## Description

Epic 14 — `docs/epics.md` içindeki tanımı ve story'leri bu klasöre taşındı; story'lerin ayrıntılı kabul kriterleri `docs/stories/` altındaki dosyalarda.

## Outcome

Alan adı olmadığı için ertelenen işler canlıda tamamlanır: e-posta gönderimi, alarm e-postaları, kurumsal adresler, sosyal giriş ve SEO.

## Requirements

- FR-060: Kullanıcılar e-posta veya sosyal hesap (Google/Apple) ile kayıt olup giriş yapabilmelidir. **Bu epic: Google/Apple girişi (14.4, 14.5). E-posta kısmı Epic 1'de.**
- FR-043: Alarm tetiklendiğinde kullanıcıya push bildirim (mobil) ve/veya e-posta ile bilgi verilmelidir. **Bu epic: alan adından e-posta (14.1) ve arka plan alarm değerlendirmesi (14.2).**
- FR-070: Push bildirimleri (mobil) ve e-posta bildirimleri desteklenmelidir. **Bu epic: e-postanın alan adından canlıda gönderilmesi (14.1).**

## Done when

1. Onay, sıfırlama ve alarm e-postaları noreply@borocean.com'dan gider ve spam'e düşmez.
2. Hukuki sayfalardaki iletişim adresi kvkk@borocean.com'dur ve e-postalar ulaşır.
3. Google ile giriş canlıda uçtan uca çalışır.
4. www ve vercel.app adresleri borocean.com'a 308 ile yönlenir; site haritası Search Console'da.

## Boundaries

Panel/DNS işleri kullanıcıda, kod ve doğrulama geliştiricide (epics.md §18 tablosu).

## References

- parent — docs/PRD.md, Bölüm 5 (FR'ler)
- source — docs/epics.md, Epic 14
- architecture — docs/initiative-borocean/architecture-borocean/architecture-borocean.md
- constraint — docs/compliance.md (SPK/KVKK; tüm epic'leri bağlar)

## Notes

- Decision: önerilen sıra 14.1 → 14.2 → 14.3 → 14.4, 14.6 bağımsız, 14.5 karar bekliyor (epics.md §18). Tracer bullet: 14.1 (alan adından e-posta).
- Decision: 2026-10-09 — entry'ler çoğunlukla panel/DNS yapılandırması, birbirinden bağımsız; Refactor sweep eklenmedi.
- Decision: 2026-10-09 — kullanıcı: mobil mağaza yayını ileriki planlarda; şimdilik yapılmayacak. 14.5 (Apple) mağaza yayınına kadar zorunlu değil.
- Waits on epic 1 because: kayıt/giriş akışı (1.9).
- Waits on epic 5 because: alarm ve bildirim kodu (5.4).
- Waits on epic 12 because: KVKK metinleri (12.2).
