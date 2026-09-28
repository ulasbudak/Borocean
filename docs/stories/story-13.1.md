---
title: "Story 13.1: Olay Tespit Motoru ve Gelişme Veri Modeli"
epic: "Epic 13 — Portföy Gelişme Takibi (Arka Plan AI Taraması)"
story_id: "13.1"
status: done
created: 2026-09-28
updated: 2026-09-28
author: Claude (kullanıcı isteğiyle, 2026-09-28)
based_on: ["docs/product-brief-epic13-portfolio-insights.md", "docs/PRD.md §5.15 (FR-140, FR-141)"]
depends_on: ["3.5", "6.1", "12.1"]
---

# Story 13.1: Olay Tespit Motoru ve Gelişme Veri Modeli

## Kullanıcı Hikayesi

As a **geliştirici**,
I want bir sembolün günlük verisinden deterministik olayları ve önem puanlarını üreten, test edilebilir bir motor ile bunları saklayan bir veri modeli,
So that "önemli gelişme" kararı açıklanabilir, tekrarlanabilir ve LLM'den bağımsız olsun.

## Bağlam

Epic 13'ün temel kararı "önce kural, sonra AI"dır (bkz. `docs/product-brief-epic13-portfolio-insights.md` §1). Bu story kural katmanını ve veri modelini kurar. AI notu Story 13.3'ün, zamanlayıcı Story 13.2'nin işidir.

## Kapsam

- **`app/insight_detectors.py`** saf fonksiyonlardan oluşur; ağ ya da veritabanı erişimi yok. Olay türleri:

  | Olay | Kural | Önem |
  |---|---|---|
  | Sert fiyat hareketi | \|günlük değişim\| ≥ max(%5, son 60 günün oynaklığının 2,5 katı) | 2; eşiğin 2 katıysa 3 |
  | Olağandışı hacim | 20 günlük ortalamanın ≥3 katı | 1 (bilgi); ≥6 katıysa 2 |
  | 52 haftalık zirve/dip | kapanış 252 günün uç değeri; aynı yönde son 20 günde uç değer yoksa (seri başına bir kez) | 2 |
  | Teknik | yalnızca bugün tetiklenen Golden/Death Cross | 2 |
  | Bilanço açıklandı | Finnhub `stock/earnings`'te yeni dönem; ilk taramada yalnızca başlangıç noktası | 2; \|sapma\| ≥%10 ise 3 |
  | Bugün bilanço | Finnhub `calendar/earnings`, açıklama günü sabahı (tek sefer) | 2 |
  | Önemli SEC dosyası | son taramadan sonra dosyalanan 8-K, 10-Q, 10-K | 2 |
  | Temel metrik değişimi | net marj ±3 puan, ROE ±5 puan, borç/özsermaye ±0,25; EPS büyümesinin işaret değiştirmesi | 2 |

  Önem puanı 2 ve üstü olan günler "önemli" sayılır. `facts` alanı yalnızca ölçülmüş değerleri içerir.
- **Hariç tutulanlar ve gerekçeleri:**
  - F/K ve PD/DD: fiyatla her gün değişir, fiyat hareketini ikinci kez sayar.
  - Finnhub `stock/recommendation`: analist al/sat sayıları (Story 12.1).
- **`app/insight_sources.py`:** Finnhub'dan bilanço, bilanço takvimi, SEC dosyaları ve haber başlıklarını çeker. Her kaynak hata durumunda sessizce boş liste döner; bu, yalnızca o olay türünü o gün için eksiltir. Haber başlıkları için iki filtre var:
  - **Alaka:** başlık sembolü ya da şirket adını içermeli.
  - **Yönlendirme:** al/sat, hedef fiyat, analist, not değişikliği, "rally/bullish/breakout", "can double" gibi başlıklar elenir.
  - Kart başına son 48 saatten en fazla 3 başlık alınır.
- **`app/insight_text.py`:** olayları TR/EN kısa cümleye çevirir; AI prompt'u ve push metni için kullanılır.
- **Migration `0013_portfolio_insights.sql`:**
  - `symbol_scan_state`: idempotentlik; son mum tarihi, son bilanço dönemi, temel metrikler.
  - `symbol_insights`: global, sembol + gün başına bir satır.
  - `insight_runs`
  - `insight_reads` ve `insight_push_log`: `auth.users` üzerinden `ON DELETE CASCADE`.
- **`app/insights.py`:** veri katmanı.

## Görevler

1. **[Kalibrasyon]** Eşiklerin gerçek veriyle ayarlanması (ilk görev). ✅
2. **[Backend]** Dedektörler, kaynaklar, metin modülü + birim testleri. ✅
3. **[DB]** Migration 0013 + veri katmanı; dev Supabase'e uygulandı. ✅

## Kalibrasyon (2026-09-28)

**Yöntem:** Evrendeki 117 ABD hissesinin (`us_universe.json`) gerçek günlük mumları Twelve Data'dan çekildi. Mum tabanlı dedektörler son 150 işlem gününde gün gün geriye dönük çalıştırıldı. Her gün için sembollerin yüzde kaçının "önemli" işaretlendiği ölçüldü. Hedef: sıradan bir günde <%10.

| | Ortalama | Medyan | p90 | En kötü gün |
|---|---|---|---|---|
| İlk eşikler | %12,6 | %12,1 | %19,8 | %36,3 |
| **Son eşikler** | **%2,7** | **%1,7** | **%5,1** | **%12** |

- **İlk ölçümde gürültünün iki kaynağı:** Bollinger kırılımları (150 günde 836 kez; ±2σ bantları yapısı gereği sık aşılıyor) ve yükselen hisselerin her gün yeniden işaretlenen 52 haftalık zirveleri (647 kez).
- **Değişiklikler:** Bollinger kırılımları önemli teknik olaylardan çıkarıldı; 52 haftalık uç değer seri başına bir kez sayılıyor.
- **Son olay dağılımı:** fiyat hareketi 253, 52 haftalık zirve 109, dip 74, Golden Cross 26, Death Cross 16, aşırı hacim 13.
- **En kötü günler** (%12) piyasa geneline yayılan sert günlerdir; bunlar gerçekten haber değeri taşıyor.
- **Geriye dönük test edilemeyenler:** bilanço, SEC dosyası ve metrik değişimi. "Bugün bilanço" olayı, 3 günlük pencerede her sabah tekrar tetiklenmemesi için açıklama gününe indirildi.

## Kabul Kriterleri

- **Given** bir sembolün verisi, **When** dedektörler çalışırsa, **Then** `{type, severity, facts}` listesi döner ve `facts` yalnızca ölçülmüş değerlerdir.
- **Given** geçmiş veri, **When** eşikler uygulanırsa, **Then** sıradan günde sembollerin <%10'u işaretlenir (ölçülen: ortalama %2,7).
- **And** analist tavsiye verisi hiçbir yerde okunmaz; yönlendirici ve alakasız haber başlıkları elenir.

## Definition of Done

- [x] Backend testleri yeşil (tüm suite 375/375), ruff temiz.
- [x] Kalibrasyon gerçek veriyle yapıldı, sonuç yukarıda.
- [x] Migration dev Supabase'e uygulandı.
- [x] **Canlı uçtan uca doğrulandı** (Story 13.2 DoD'sine bakın).
- [ ] Migration prod Supabase'e uygulanacak (kullanıcı işlemi; bkz. Story 13.2).
