---
type: epic
title: "Portföy gelişme takibi (arka plan AI taraması)"
parent: initiative-borocean
covers: [FR-140, FR-141, FR-142, FR-143, FR-144, FR-145, FR-146]
after: []
assignee: ""
status: in-progress
risk: high
---

# Portföy gelişme takibi (arka plan AI taraması)

## Description

Epic 13 — `docs/epics.md` içindeki tanımı ve story'leri bu klasöre taşındı; story'lerin ayrıntılı kabul kriterleri `docs/stories/` altındaki dosyalarda.

## Outcome

Uygulama her sabah portföylerdeki hisseleri tarar; önemli gelişmeleri kısa bir AI notuyla portföyde ve Panelde gösterir, mobilde günde en fazla bir push gönderir.

## Requirements

- FR-140: Sistem, her işlem günü sonunda kullanıcı portföylerindeki tüm farklı sembolleri, kullanıcı etkileşimi olmadan (arka planda) taramalıdır. Tarama idempotent olmalı, veri sağlayıcı kotalarını canlı kullanıcılar için korumalı ve yarıda kalırsa kaldığı yerden devam edebilmelidir.
- FR-141: Sistem, "önemli gelişme"yi deterministik ve açıklanabilir kurallarla tespit etmelidir: sert fiyat hareketi, olağandışı hacim, 52 haftalık zirve/dip, önemli teknik olay, bilanço açıklanması ve beklentiden sapma, yaklaşan bilanço, önemli SEC dosyası, temel metrik değişimi. Her olayın bir önem puanı olmalı; analistlerin al/sat tavsiye verisi kullanılmamalıdır.
- FR-142: Sistem, önemli olay tespit edilen semboller için kamuya açık verilere dayanan kısa bir AI notu üretmelidir ("Ne oldu / Veride neyi değiştiriyor / Riskler"). Not sembol başına bir kez üretilmeli (kullanıcı bazlı değil), FR-130'a uymalı ve günlük bir LLM bütçesiyle sınırlanmalıdır. Bütçe aşılırsa olay, notsuz olarak gösterilmelidir.
- FR-143: Portföy ekranında gelişmesi olan pozisyonlar işaretlenmeli ve gelişme ayrıntısı (olaylar, AI notu, tarih, hisse sayfası bağlantısı) açılabilmelidir; son 7 günün gelişmeleri portföy başında listelenmelidir.
- FR-144: Kullanıcının ana sayfasında (Panel) portföyündeki son gelişmeler, okunmamış sayısıyla birlikte gösterilmelidir; okundu durumu kullanıcı bazlı saklanmalıdır.
- FR-145: Deterministik olay listesi tüm kullanıcılara, AI notu ise AI raporu hakkı olan kullanıcılara (FR-080 – FR-083) açık olmalıdır.
- FR-146: Mobil push tercihi açık kullanıcıya, portföyündeki hisselerde önemli gelişme olan günlerde en fazla bir özet push bildirimi gönderilmelidir. Bu özellik için e-posta bildirimi gönderilmez. Gelişme kartlarında ilgili haber başlıkları kaynak adı ve orijinal habere bağlantıyla gösterilebilir; haber metni kopyalanmaz.

## Done when

1. pg_cron taraması her iş günü 05:30 UTC'de çalışır ve idempotenttir.
2. Gelişmeler portföy, Panel ve hisse sayfasında okundu durumuyla görünür.
3. Mobil push günde en fazla bir kez gider; e-posta gönderilmez.
4. AI notu yönlendirme içermez ve günlük kotayı aşmaz.

## Boundaries

Portföy sembolleri; izleme listesi genişletmesi (13.7) opsiyonel.

## References

- parent — docs/PRD.md, Bölüm 5 (FR'ler)
- source — docs/epics.md, Epic 13
- architecture — docs/initiative-borocean/architecture-borocean/architecture-borocean.md
- constraint — docs/compliance.md (SPK/KVKK; tüm epic'leri bağlar)

## Notes

- Decision: uygulama sırası 13.1 → 13.2 → 13.3 → 13.4 → 13.5 → 13.6, 13.7 sonra (docs/epics.md). Tracer bullet: 13.1 + 13.2 (dedektörler + cron çalıştırıcısı).
- Decision: 2026-10-09 — açık kalan tek entry 13.7; ayrı Refactor sweep eklenmedi.
- Decision: 2026-10-09 — kullanıcı: 13.7 kapsamda (izleme listesi genişletmesi alınsın).
- Decision: 2026-09-28 — kullanıcı sayfası = Panel; önce portföy; bildirim yalnızca mobil push; tarama günde bir kez sabah; haber başlıkları kaynak bağlantısıyla.
- Unknown: Gemini ücretsiz kotası kullanıcı sayısı arttıkça yetmeyebilir.
- Waits on epic 5 because: izleme listesi (13.7) ve push token'ları (5.4).
- Waits on epic 6 because: portföy pozisyonları.
- Waits on epic 8 because: AI notu hakkı (FR-145).
- Waits on epic 9 because: Gemini çağrısı ve PROMPT_VERSION deseni.
- Waits on epic 12 because: yönlendirme yasağı kuralları.
