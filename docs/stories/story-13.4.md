---
title: "Story 13.4: Portföy Ekranında Gelişmeler"
epic: "Epic 13 — Portföy Gelişme Takibi (Arka Plan AI Taraması)"
story_id: "13.4"
status: done
created: 2026-09-28
updated: 2026-09-28
author: Claude (kullanıcı isteğiyle, 2026-09-28)
based_on: ["docs/PRD.md §5.15 (FR-143, FR-146)"]
depends_on: ["13.1", "13.2", "13.3", "6.1"]
---

# Story 13.4: Portföy Ekranında Gelişmeler

## Kullanıcı Hikayesi

As a **kullanıcı**,
I want portföyümde hangi hissede önemli bir gelişme olduğunu bir bakışta görmek,
So that her hisseyi tek tek açmadan neyin değiştiğini fark edebileyim.

## Kapsam

- **API:**
  - `GET /insights`: kullanıcının tuttuğu sembollerin son 7 günlük gelişmeleri (yenisi önce), okundu bilgisi, `unread_count`, `holds_positions`, bugünkü çalıştırma durumu ve uyarılar.
  - `POST /insights/read`: `{ids}` okundu olarak işaretlenir (en fazla 200).
- **Paylaşılan (`packages/shared/src/insights.ts`):** tipler ve `describeInsightEvent`, yani olayın i18n metnine çevrilmesi (TR/EN). Web ve mobil aynı metni üretir.
- **Web (`/portfolio`):**
  - Pozisyon satırında "Yeni gelişme" rozeti; okunmamışsa vurgulu.
  - Rozete tıklayınca satırın altında gelişme kartı açılır:
    - olaylar
    - AI notu ve etki tonu
    - kilit mesajı (hak yoksa)
    - haber başlıkları, kaynak adı ve yeni sekmede açılan bağlantıyla (`rel="noopener noreferrer nofollow"`)
  - Başlığın altında "Son 7 günün gelişmeleri" şeridi (açılır liste) ve uyarı metni.
  - Açılan gelişme okundu işaretlenir.
  - Ortak bileşenler: `components/insights/insight-card.tsx`, `insight-list.tsx`.
- **Mobil (`PortfolioScreen`):** aynı rozet, satır içi kart, şerit; başlıklar tarayıcıda açılır (`InsightViews.tsx`).
- **i18n:** `insights.*` (tr/en).

## Görevler

1. **[Backend]** `GET /insights`, `POST /insights/read` + testler. ✅
2. **[Shared]** Tipler, `describeInsightEvent`, i18n. ✅
3. **[Web]** Rozet, satır içi kart, şerit. ✅
4. **[Mobil]** Rozet, satır içi kart, şerit. ✅

## Kabul Kriterleri

- **Given** son 7 günde gelişmesi olan bir pozisyon, **When** portföy açılırsa, **Then** rozet görünür; tıklanınca kart açılır ve gelişme okundu olur.
- **And** karttaki metin ne olduğunu anlatır, ne yapılacağını söylemez; haber başlıkları kaynağıyla ve bağlantısıyla gösterilir.

## Definition of Done

- [x] Web/mobil typecheck + lint temiz; `next build` başarılı; testler yeşil.
- [x] **Gerçek tarayıcıda doğrulandı** (2026-09-28, Playwright, yerel web + API, dev Supabase):
  - "Son 7 günün gelişmeleri" şeridinde beş gelişme vardı; okunmuş olan (NKE) noktasız görünüyordu.
  - Beş pozisyonun her birinde rozet vardı. NKE rozetine tıklayınca satır içinde kart açıldı: olay, AI notu, "Veriye etkisi: karışık" ve kaynaklı üç haber başlığı.
  - Konsol ve ağ hatası yok.
- [ ] Mobil cihaz/simülatör doğrulaması; bu ortamda yok. Mobil derleme kontrolü: typecheck + lint.
