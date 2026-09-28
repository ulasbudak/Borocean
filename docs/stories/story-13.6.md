---
title: "Story 13.6: Portföy Gelişmesi Mobil Bildirimi (Push)"
epic: "Epic 13 — Portföy Gelişme Takibi (Arka Plan AI Taraması)"
story_id: "13.6"
status: done
created: 2026-09-28
updated: 2026-09-28
author: Claude (kullanıcı isteğiyle, 2026-09-28)
based_on: ["docs/PRD.md §5.15 (FR-146)", "docs/stories/story-5.4.md"]
depends_on: ["13.2", "5.4"]
---

# Story 13.6: Portföy Gelişmesi Mobil Bildirimi (Push)

## Kullanıcı Hikayesi

As a **mobil kullanıcı**,
I want portföyümdeki bir hissede önemli gelişme olduğunda telefonuma bildirim gelmesini,
So that uygulamayı açmasam da haberdar olayım.

## Bağlam

Kullanıcı kararı (2026-09-28): bu özellik için mobil push olacak, e-posta olmayacak.

## Kapsam

- **Gönderim:** Sabah taramasının sonunda `send_daily_pushes`, push tercihi açık ve cihaz anahtarı kayıtlı kullanıcılar arasından o gün gelişmesi olan hisseleri tutanlara tek bir özet push gönderir.
- **Günde en fazla bir push:** `insight_push_log`'da `(user_id, push_date)` birincil anahtar. Gün önce "sahiplenilir", sonra gönderilir; eşzamanlı iki çalıştırma aynı kişiye iki kez göndermez.
- **Metin:** kullanıcının diline göre (`user_metadata.locale`), yalnızca olayları söyler, en fazla 3 sembol. Örnek: başlık "Portföyünde 2 gelişme", gövde "AAPL: günlük değişim %-9, MSFT: 52 haftanın en düşük kapanışı".
- **Bildirime dokunma:** Push `data: {type: "portfolio_insights"}` taşır; mobil `HomeScreen` dokunulduğunda portföy ekranını açar (`addNotificationResponseReceivedListener`).
- **E-posta yok.**

## Görevler

1. **[Backend]** Alıcı sorgusu, günlük tekillik, metin (TR/EN), push verisi + testler. ✅
2. **[Mobil]** Bildirime dokununca portföy ekranı. ✅

## Kabul Kriterleri

- **Given** push tercihi açık bir kullanıcı ve o gün tuttuğu hisselerde gelişme, **When** tarama biterse, **Then** kullanıcı günde en fazla bir özet push alır ve metin yalnızca olayları söyler.
- **And** e-posta gönderilmez.

## Definition of Done

- [x] Testler yeşil: kullanıcı başına tek push, günlük tekillik, metin biçimi, push verisi.
- [x] **Gönderim yolu canlı doğrulandı** (2026-09-28): Test kullanıcısına sahte bir Expo anahtarı kaydedildi. Tarama sonunda Expo push API'sine bir istek gitti (`pushes_sent: 1`) ve `insight_push_log`'a kayıt düştü; aynı gün yapılan tekrar tetiklemede ikinci push gitmedi.
- [ ] Gerçek cihazda teslim ve bildirime dokunma: Story 5.4'teki gibi `eas init` + EAS development build bekliyor.
