---
title: "Story 13.3: Gelişmeler için AI Notu"
epic: "Epic 13 — Portföy Gelişme Takibi (Arka Plan AI Taraması)"
story_id: "13.3"
status: done
created: 2026-09-28
updated: 2026-09-28
author: Claude (kullanıcı isteğiyle, 2026-09-28)
based_on: ["docs/product-brief-epic13-portfolio-insights.md §3, §5, §6", "docs/PRD.md §5.15 (FR-142, FR-145)", "docs/compliance.md"]
depends_on: ["13.1", "13.2", "12.1"]
---

# Story 13.3: Gelişmeler için AI Notu

## Kullanıcı Hikayesi

As a **kullanıcı (AI raporu hakkı olan)**,
I want tespit edilen gelişmenin kısa, anlaşılır bir açıklamasını okumak,
So that sayıların ne anlama gelebileceğini hisse sayfasına gitmeden anlayabileyim.

## Kapsam

- **`generate_note` (`app/insight_runner.py`):** Gemini'ye yalnızca şunlar verilir: olayların kısa metinleri, sembolün temel metrikleri, filtrelenmiş haber başlıkları. Notun yapısı: "Ne oldu: / Veride neyi değiştiriyor: / Dikkat edilebilecek riskler:"; düz metin, markdown yok. Son satırdaki "ETKİ: olumlu|olumsuz|nötr|karışık" ayrıştırılıp `note_tone`'a yazılır.
- **Uyum (Story 12.1):**
  - `COMPLIANCE_RULES` prompt'a dahil.
  - Ek kurallar: başlıklarda geçse bile analist hedef fiyatlarını ve not değişikliklerini aktarma; okurun hisseyi tuttuğunu varsayma; portföyüne dair bir şey söyleme.
  - `ensure_disclaimer` uyarı satırını garanti eder; `PROMPT_VERSION` ile saklanır.
- **Bütçe:** günlük 50 not (`DAILY_NOTE_CAP`). Tavan dolarsa gelişme notsuz, yalnızca olay listesiyle gösterilir.
- **Yeniden deneme:** Geçici Gemini hatasıyla notsuz kalan gelişmeler, çalıştırma sonunda yeniden denenir. Denemeler arasında 10 saniye beklenir, çünkü art arda çağrılar ücretsiz katmanda 429 veriyordu. 06:30 ve 07:30 tetiklemeleri de aynı yolu kullanır.
- **Freemium (FR-145):** `GET /insights` notu yalnızca `Entitlement.ai_reports` olanlara döndürür; diğerlerine `note_locked: true` gider. Olay listesi herkese açık. (Şu an `ALL_FEATURES_FREE` açık.)

## Görevler

1. **[Backend]** Not prompt'u, ton ayrıştırma, markdown temizliği, bütçe, yeniden deneme, hak kontrolü + testler. ✅

## Kabul Kriterleri

- **Given** önemli olayı olan bir sembol, **When** not üretilirse, **Then** üç başlıklı düz metin not, ton ve uyarı satırı saklanır; al/sat/tut, hedef fiyat veya kişisel tavsiye içermez.
- **Given** günlük tavan doldu, **When** yeni olay kaydedilirse, **Then** notsuz gösterilir.
- **Given** AI raporu hakkı olmayan kullanıcı, **When** gelişmeleri açarsa, **Then** olayları görür, not yerine kilit mesajını görür.

## Definition of Done

- [x] Testler yeşil (tüm suite 375/375), ruff temiz.
- [x] **Gerçek Gemini ile doğrulandı** (2026-09-28): beş gelişmenin beşi için not üretildi; hiçbirinde al/sat/tut ya da kişisel tavsiye yok. İlk sürümdeki sorunlar ve çözümleri:
  - **NKE notu analistlerin hedef fiyat indirimlerini aktarıyordu:** başlık filtresi ve prompt kuralı eklendi.
  - **Başlıklar ham `**markdown**` olarak görünüyordu:** prompt düz metin istiyor, `parse_note` temizliyor. Sonraki notlarda markdown yok.
- [x] **Yeniden deneme doğrulandı:** COST notu ilk çalıştırmada Gemini 503 ile üretilemedi; yeniden deneme yolu eklendi. Yoğun test günü sonunda bir yeniden deneme turu 429 ile kısmen kaldı; bu, aşağıdaki kota riskinin gerçek bir örneği.
- [ ] **Kota riski (canlı izlenmeli):** Epic 9'un isteğe bağlı raporları ve bu notlar aynı ücretsiz Gemini anahtarını paylaşıyor. 50 notluk tavan, kullanıcıların gün içindeki rapor isteklerine kota bırakmayabilir. İlk haftanın `insight_runs.notes_generated` ve 429 loglarına bakılıp tavan düşürülmeli ya da ücretli katmana geçilmeli.
