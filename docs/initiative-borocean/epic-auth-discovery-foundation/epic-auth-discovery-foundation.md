---
type: epic
title: "Kimlik doğrulama, hisse keşfi ve temel altyapı"
parent: initiative-borocean
covers: [FR-060, FR-090, FR-091, FR-001, FR-002]
after: []
assignee: ""
status: done
risk: medium
---

# Kimlik doğrulama, hisse keşfi ve temel altyapı

## Description

Epic 1 — `docs/epics.md` içindeki tanımı ve story'leri bu klasöre taşındı; story'lerin ayrıntılı kabul kriterleri `docs/stories/` altındaki dosyalarda.

## Outcome

Bir ziyaretçi kayıt olup kendi dilinde giriş yapar, ABD hisselerini arar ve bir hissenin genel bakış kartını görür; tüm sonraki epic'ler bu iskeletin üzerine kurulur.

## Requirements

- FR-060: Kullanıcılar e-posta veya sosyal hesap (Google/Apple) ile kayıt olup giriş yapabilmelidir. **Bu epic: e-posta ile kayıt/giriş. Google/Apple kısmı Epic 14'te.**
- FR-090: Uygulama arayüzü Türkçe ve İngilizce olarak sunulmalı, kullanıcı dil tercihini değiştirebilmelidir.
- FR-091: Sayı/para birimi biçimleri (binlik ayraç, ondalık, TL/USD gösterimi) seçilen dile ve piyasaya göre otomatik uyarlanmalıdır.
- FR-001: Kullanıcı, sembol veya şirket adına göre ABD ve BIST hisselerini arayabilmeli; sonuçlar borsa/piyasa etiketiyle (örn. NASDAQ, BIST) listelenmelidir.
- FR-002: Her hisse için bir "Genel Bakış" kartı: güncel fiyat, günlük değişim, piyasa değeri, temel şirket bilgisi (sektör, endüstri) gösterilmelidir.

## Done when

1. E-posta ile kayıt, onay e-postası, giriş, şifre sıfırlama ve hesap silme canlıda çalışır (web + mobil).
2. Arayüz Türkçe/İngilizce; sayı ve para biçimleri dile göre değişir.
3. Hisse araması 1 saniyenin altında sonuç döner ve sonuçtan genel bakış kartı açılır.
4. Monorepo (web, mobil, API, shared) CI'da yeşil; web Vercel'de, API Render'da yayında.

## Boundaries

Kimlik, yerelleştirme ve hisse keşfi. Google/Apple girişi Epic 14'te (14.4, 14.5).

## References

- parent — docs/PRD.md, Bölüm 5 (FR'ler)
- source — docs/epics.md, Epic 1
- architecture — docs/initiative-borocean/architecture-borocean/architecture-borocean.md
- constraint — docs/compliance.md (SPK/KVKK; tüm epic'leri bağlar)
