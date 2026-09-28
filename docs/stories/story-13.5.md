---
title: "Story 13.5: Panelde \"Portföyündeki Gelişmeler\" ve Hisse Sayfasında \"Son Gelişmeler\""
epic: "Epic 13 — Portföy Gelişme Takibi (Arka Plan AI Taraması)"
story_id: "13.5"
status: done
created: 2026-09-28
updated: 2026-09-28
author: Claude (kullanıcı isteğiyle, 2026-09-28)
based_on: ["docs/PRD.md §5.15 (FR-144)", "docs/compliance.md §2a"]
depends_on: ["13.4"]
---

# Story 13.5: Panelde "Portföyündeki Gelişmeler" ve Hisse Sayfasında "Son Gelişmeler"

## Kullanıcı Hikayesi

As a **kullanıcı**,
I want uygulamayı açtığımda portföyümdeki yeni gelişmeleri ana sayfada görmek,
So that portföy ekranına gitmeden önemli bir şey olup olmadığını anlayabileyim.

## Bağlam

Kullanıcı 2026-09-28'de "kullanıcı sayfası = Panel" kararını verdi.

## Kapsam

- **Web Panel (`/dashboard`):** Arama kutusunun hemen altında `PortfolioInsights` kartı:
  - okunmamış sayısı rozeti
  - son 5 gelişme (açılır)
  - "Portföye git" ve "Tümünü okundu say"
  - yedek tarama uyarısı ve bilgilendirme metni

  Pozisyonu olmayan kullanıcıya kart gösterilmez (`holds_positions`). Gelişme yoksa "Son 7 günde portföyünde önemli bir gelişme yok" yazar.
- **Mobil ana ekran:** aynı içerikle `PortfolioInsightsCard`; "Portföye git" portföy ekranını açar.
- **Hisse sayfası:**
  - `GET /insights/symbol`: hisse portföyde olmasa da son 30 günün gelişmeleri.
  - Web'de `SymbolInsights` kartı (Genel Bakış sekmesi, kişisel notun altında), mobilde `SymbolInsights`.
  - Gelişme yoksa veya kullanıcı giriş yapmamışsa bölüm görünmez.
- **KVKK:** Aydınlatma metnine yeni işleme amacı ve "Portföy gelişmeleri" veri kategorisi eklendi (okundu durumu ve push günü). `docs/compliance.md` §2a eklendi.

## Görevler

1. **[Web]** Panel kartı, hisse sayfası bölümü. ✅
2. **[Mobil]** Ana ekran kartı, hisse ekranı bölümü. ✅
3. **[Backend]** `GET /insights/symbol`, `holds_positions`. ✅
4. **[Doküman]** KVKK metni, compliance notu. ✅

## Kabul Kriterleri

- **Given** okunmamış gelişmeler, **When** Panel açılırsa, **Then** kart sayıyı ve son gelişmeleri gösterir; açılan gelişme okundu olur.
- **Given** portföyü olmayan kullanıcı, **When** Panel açılırsa, **Then** kart görünmez.
- **Given** bir hisse sayfası, **When** son 30 günde gelişme varsa, **Then** "Son gelişmeler" bölümü listelenir.

## Definition of Done

- [x] Typecheck, lint ve testler temiz.
- [x] **Gerçek tarayıcıda doğrulandı** (2026-09-28, Playwright):
  - Panelde "5 okunmamış" görünüyordu; bir gelişme açılınca "4 okunmamış"a düştü.
  - Açılan AAPL kartında olay, not, ton ve üç başlık kaynak bağlantısıyla gösterildi.
  - 390 px genişlikte yatay taşma yok; konsol hatası yok.
- [x] **Hisse sayfası (AAPL) doğrulandı:** "Son gelişmeler" bölümü açıldı. Üç başlık yeni sekmede açılıyor (`rel="noopener noreferrer nofollow"`), konsol hatası yok. Bağlantılar Finnhub'ın haber adresine gidiyor ve 302 ile orijinal habere yönleniyor (örn. qz.com).
- [ ] Mobil cihaz/simülatör doğrulaması; bu ortamda yok.
