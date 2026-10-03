---
title: "Story 13.2: Günlük Arka Plan Çalıştırıcısı (pg_cron + pg_net)"
epic: "Epic 13 — Portföy Gelişme Takibi (Arka Plan AI Taraması)"
story_id: "13.2"
status: done
created: 2026-09-28
updated: 2026-09-28
author: Claude (kullanıcı isteğiyle, 2026-09-28)
based_on: ["docs/product-brief-epic13-portfolio-insights.md §2, §3", "docs/PRD.md §5.15 (FR-140)", "docs/architecture.md AD-8"]
depends_on: ["13.1"]
---

# Story 13.2: Günlük Arka Plan Çalıştırıcısı (pg_cron + pg_net)

## Kullanıcı Hikayesi

As a **ürün sahibi**,
I want portföylerdeki sembollerin her sabah, kimse uygulamayı açmadan taranmasını,
So that kullanıcı güne başlarken gelişmeleri hazır bulsun.

## Bağlam

Bu, projedeki ilk zamanlanmış iş. AD-8 (Celery + Redis) hiç kurulmadı ve ücretsiz Render planında ayrı bir worker süreci yok; GitHub Actions cron'u ise güvenilmez çıkmıştı (`keep-api-warm.yml`). Kullanıcı 2026-09-28'de "günde bir kez, sabah açılıştan önce" kararını verdi. Seçilen yöntem Supabase `pg_cron` + `pg_net`: 05:30 UTC (TR 08:30), yarım kalan iş için 06:30 ve 07:30 UTC'de tekrar.

## Kapsam

- **`POST /internal/insights/run`:**
  - `X-Cron-Secret` başlığını `CRON_SECRET` ortam değişkeniyle sabit zamanlı karşılaştırır: yanlışsa 401, ayar yoksa 503.
  - Hemen 202 döner; taramayı aynı süreçte arka plan görevi olarak başlatır.
- **`app/insight_runner.py::run_daily_scan`:**
  - **Evren:** tüm portföylerdeki farklı ABD sembolleri, en çok kullanıcının tuttuğu önce. Günlük tavan 300 sembol.
  - **İdempotentlik:** bugün taranmış sembol atlanır; bu yüzden tekrar tetikleme yalnızca yarım kalanı yapar.
  - **Tek çalıştırma:** aynı gün canlı bir çalıştırma varsa yenisi başlamaz (`pg_advisory_xact_lock` + süreç içi kontrol). 2 saatten eski "running" kayıtları ölü sayılır.
  - **Kota:** sembol başına 15 saniye tempo, yani Twelve Data'ya dakikada en fazla 4 istek; canlı kullanıcılara dakikada 4 istek kalır.
  - **Tamamlanmış seans:** tarama tarihinde ya da sonrasında tarihli mumlar kullanılmaz. Seans içi yedek çalıştırmada yarım gün sayılmaz ve ertesi sabah o gün atlanmaz.
  - **Hafta sonu:** yeni bir işlem günü mumu gelmediyse mum dedektörleri çalışmaz (`last_candle_date`), yani cuma mumu pazar günü tekrar sayılmaz.
  - **İlk tarama:** bir sembolün ilk taraması yalnızca başlangıç noktasını kaydeder (bilanço dönemi, metrikler, son mum).
  - **Kayıt:** her çalıştırma `insight_runs`'a yazılır: evren, işlenen, atlanan, önemli, hatalı, not ve push sayıları.
- **Yedek tetikleme:** 05:45 UTC'den sonra bugün hiç çalıştırma yoksa, pozisyonu olan bir kullanıcının `GET /insights` isteği taramayı başlatır ve yanıta "Bugünün taraması hazırlanıyor" uyarısı eklenir (NFR-2).
- **Canlı kurulum:** `apps/api/scripts/setup_insights_cron.sql` (Vault'ta sır, `trigger_insights_run()` fonksiyonu, üç cron kaydı).
- **Mimari:** `docs/architecture.md` AD-8'e "değişiklik önerildi" notu düşüldü.

## Görevler

1. **[Backend]** Uç nokta, çalıştırıcı, tempo/tavan/idempotentlik, yedek tetikleme + testler. ✅
2. **[Ops]** `setup_insights_cron.sql` (prod kurulum betiği). Dev veritabanında geri alınan bir işlem içinde denendi: üç cron kaydı ve Vault sırrı oluştu, geri alma sonrası iz kalmadı. ✅
3. **[Ops]** Prod'da migration 0013 + `setup_insights_cron.sql` + Render'da `CRON_SECRET`. ✅ (kullanıcı tarafından, 2026-10-04; canlı API doğru sırla 202, yanlış sırla 401 dönüyor, ilk tarama elle tetiklendi)

## Kabul Kriterleri

- **Given** doğru sır, **When** uç nokta çağrılırsa, **Then** 202 döner ve tarama arka planda yürür; yanlış sırda 401 döner.
- **Given** yarım kalmış bir çalıştırma, **When** tekrar tetiklenirse, **Then** yalnızca taranmamış semboller işlenir.
- **Given** bugünün çalıştırması hiç başlamamış, **When** kullanıcı portföyünü açarsa, **Then** tarama başlar ve kullanıcı bilgilendirilir.

## Definition of Done

- [x] Testler yeşil (375/375; çalıştırıcı ve uç nokta için 18 test), ruff temiz.
- [x] **Canlı uçtan uca doğrulandı** (2026-09-28, yerel API + dev Supabase, gerçek Twelve Data/Finnhub/Gemini, geçici test kullanıcısı, portföy: NKE, COST, XOM, WFC, AAPL):
  - **Yedek tetikleme kendiliğinden devreye girdi:** Dev'de bugün tarama yoktu ve saat 05:45 UTC'yi geçmişti; `/insights` isteği taramayı başlattı ve uyarıyı döndürdü.
  - **Cron uç noktası:** yanlış sırla 401, doğru sırla 202.
  - **Başlangıç noktası:** 21 Eylül'de taranmış gibi (öncesindeki son mum 24 Eylül) yazıldı.
  - **Yakalanan gerçek olaylar:** AAPL 52 haftalık zirve (25 Eylül), NKE bugün bilanço, COST/WFC/XOM 24–25 Eylül tarihli 8-K'lar. Evren 5, işlenen 5, önemli 5, hata 0.
  - **Tekrar tetikleme:** sembollerin hepsi atlandı; yalnızca eksik notlar yeniden denendi.
- [x] **Canlı çalıştırmanın bulduğu ve düzeltilen hatalar:**
  - **Yarım mum:** seans içinde bugünün yarım mumu işleniyordu; artık yalnızca tamamlanmış seanslar kullanılıyor.
  - **Başlık alakası:** alakasız başlıklar (başka şirketlerin haberleri) filtreleniyor.
  - **Başlık uyumu:** analist hedef fiyatı ve not değişikliği içeren başlıklar notlara sızıyordu; artık filtreleniyor.
- [x] Prod kurulumu (Görev 3), 2026-10-04.
- [ ] İlk gerçek sabah çalıştırmasının `insight_runs`'tan kontrolü.
