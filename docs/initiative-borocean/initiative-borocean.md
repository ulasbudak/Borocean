---
type: initiative
title: "Borocean"
parent: none
covers: [FR-001, FR-002, FR-003, FR-010, FR-011, FR-013, FR-020, FR-021, FR-022, FR-023, FR-024, FR-030, FR-031, FR-032, FR-040, FR-041, FR-042, FR-043, FR-050, FR-051, FR-052, FR-060, FR-061, FR-062, FR-070, FR-080, FR-081, FR-082, FR-083, FR-090, FR-091, FR-100, FR-101, FR-110, FR-111, FR-112, FR-120, FR-121, FR-122, FR-123, FR-124, FR-125, FR-126, FR-130, FR-131, FR-140, FR-141, FR-142, FR-143, FR-144, FR-145, FR-146]
after: []
assignee: ""
status: in-progress
risk: high
---

# Borocean

## Description

Borocean, Türkçe konuşan bireysel yatırımcılar için ABD hisselerini (BIST geçici olarak kapalı) tek yerde analiz eden, web ve mobilde çalışan bir bilgilendirme ve analiz aracıdır: temel ve teknik analiz, tarama, karşılaştırma, izleme listesi ve alarmlar, portföy takibi, sanal alım-satım simülasyonu ve yönlendirme içermeyen AI raporları. Gereksinimler `docs/PRD.md` Bölüm 5'te; bu initiative tüm ürünü kapsar.

## Outcome

Bir yatırımcı, al/sat yönlendirmesi almadan, bir hisse hakkında karar vermek için ihtiyaç duyduğu veriyi ve takibi tek uygulamada bulur; sinyal: kayıtlı kullanıcıların haftalık geri dönüşü ve portföy/alarmların aktif kullanımı (PRD §2).

## Requirements

`docs/PRD.md` Bölüm 5'teki FR'ler; epic'lerin Requirements bölümleri her FR'nin metnini taşır. Faz 2'ye ertelenenler (FR-012, FR-025/FR-102, FR-033, FR-053, FR-063, FR-071) bu initiative'in dışında.

## Done when

1. FR'lerin tamamı canlıda (borocean.com; mobil uygulama mağaza yayını hariç) hiçbir yerde al/sat yönlendirmesi olmadan çalışır.
2. Kayıt, onay e-postası, giriş, şifre sıfırlama ve hesap silme canlıda uçtan uca çalışır.
3. Arka plan işleri (portföy taraması, alarm değerlendirmesi, bülten) her gün kendiliğinden çalışır ve bildirim gönderir.
4. KVKK aydınlatma metni, koşullar ve gizlilik politikası yayında; hesap silme ve kayıtta onay her kayıt yolunda çalışır.

## Boundaries

Ürün sınırı: yalnızca veri, analiz ve sanal işlem; aracı kurum/borsa bağlantısı, gerçek emir ve kişiye özel yatırım tavsiyesi yok (PRD §10, docs/compliance.md). Tracer path: kayıt → hisse arama → hisse sayfası (Epic 1–3).

- Touch point: Supabase (Auth, Postgres, pg_cron, Vault) — şema ve cron kurulumu; owner: her epic kendi migration'ı
- Touch point: Finnhub / Twelve Data — piyasa verisi sağlayıcıları, yapılandırma; owner: epic-auth-discovery-foundation (adaptör)
- Touch point: Gemini — AI raporları ve notlar; owner: epic-ai-commentary-patterns
- Touch point: Resend, Squarespace DNS, Vercel, Render — e-posta ve yayın; owner: epic-domain-infrastructure
- Touch point: Google Cloud OAuth, Apple Developer, Google Search Console — sosyal giriş ve arama kaydı; owner: epic-domain-infrastructure
- Touch point: Expo Push — mobil bildirim; owner: epic-watchlist-alerts-notifications
- Touch point: RevenueCat, App Store, Play Store — ödeme (ertelendi); owner: epic-freemium-monetization
- Touch point: Finnhub haber/SEC kaynakları — gelişme tespiti; owner: epic-portfolio-insights
- Touch point: kripto veri kaynağı (Twelve Data / CoinGecko) — owner: epic-crypto-market

## References

- prd — docs/PRD.md, Bölüm 5
- source — docs/epics.md (ticket ağacına taşınmadan önceki backlog)
- architecture — docs/initiative-borocean/architecture-borocean/architecture-borocean.md
- ux — docs/initiative-borocean/ux-borocean/
- constraint — docs/compliance.md (SPK/KVKK)

## Notes

- Decision: 2026-10-09 — kullanıcı ticket ağacının tüm projeyi kapsamasını istedi. Epic ve story numaraları `docs/epics.md` ile aynı tutuldu (Epic 11, build sırasında en sonda). Tamamlanan story'ler `done` olarak işaretlendi; ayrıntılı kabul kriterleri `docs/stories/` altında kaldı.
- Decision: 2026-10-09 — tamamlanmış epic'lere geriye dönük "Refactor sweep" story'si eklenmedi; tarihçe olduğu gibi aktarıldı. Açık Epic 11'e eklendi.
- Decision: platform temeli ayrı bir epic değil; Epic 1'in ilk story'si (1.1 Proje iskeleti) olarak zaten tamamlandı.
- Decision: 2026-09-21 — monetizasyon (Story 8.2) ertelendi; tüm özellikler ücretsiz.
- Open question: Epic 11 açık soruları (veri kaynağı, hukuki görüş, kapsam) — epic-crypto-market Notes.
- Decision: 2026-10-09 — kullanıcı: açık hukuki maddeler (avukat incelemesi, veri sorumlusu adresi, yurt dışı aktarım; docs/compliance.md) ileriki bir plana; Done when 4'ten çıkarıldı.
- Parked: açık hukuki maddeler (docs/compliance.md §4) — ileriki plan.
- Decision: 2026-10-09 — kullanıcı: mobil mağaza yayını ileriki planlarda; bu initiative'de yok.
- Decision: 2026-10-09 — kullanıcı: ABD veri lisansı konusu sonra ele alınacak, şimdilik ertelendi.
- Decision: 2026-10-09 — kullanıcı: Gemini ücretli katmanına ileride geçilecek.
- Decision: 2026-10-09 — tüm kod tabanı incelemesinin düzeltmeleri Epic 15 olarak eklendi (epic-codebase-review-fixes).
