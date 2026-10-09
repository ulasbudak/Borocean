---
type: epic
title: "Kripto para piyasası"
parent: initiative-borocean
covers: [FR-120, FR-121, FR-122, FR-123, FR-124, FR-125, FR-126]
after: []
assignee: ""
risk: high
---

# Kripto para piyasası

## Description

Epic 11 — `docs/epics.md` içindeki tanımı ve story'leri bu klasöre taşındı; story'lerin ayrıntılı kabul kriterleri `docs/stories/` altındaki dosyalarda.

## Outcome

Kullanıcı kripto varlıkları arar, detayını görür ve izleme listesi, alarm, portföy, simülasyon ve taramada hisselerle aynı akışlarla kullanır; gerçek kripto işlemi yoktur.

## Requirements

- FR-120: Sistem, kripto varlıklar için arama, anlık fiyat ve mum (OHLC) verisini hisse verisiyle aynı arayüzden sağlamalıdır. Veri kaynağı, hisse verisinin API kotasını tüketip hisse akışlarını bozmayacak şekilde seçilmeli ve önbelleğe alınmalıdır.
- FR-121: Sistem, bir kripto varlığın detay sayfasında fiyat, 24 saatlik değişim, piyasa değeri, dolaşımdaki arz ve 24 saatlik hacmi göstermelidir; hisseye özgü ve kriptoda anlamı olmayan bölümler (temel analiz, sektör, F/K tabanlı skor) gizlenmeli veya açıkça "geçerli değil" olarak belirtilmelidir.
- FR-122: Sistem, mevcut teknik göstergeleri ve sinyal kurallarını (FR-020 – FR-024) kripto mum serilerine de uygulamalı; sinyal alarmları 7/24 değerlendirilmelidir.
- FR-123: Sistem, kripto varlıkların izleme listesine, fiyat alarmlarına ve portföye eklenmesine izin vermeli; portföyde kesirli miktarları desteklemelidir.
- FR-124: Sistem, simülasyonlarda (FR-110 – FR-112) kripto alım-satımına izin vermeli; emirler o anki gerçek kripto fiyatından yürütülmeli ve kesirli miktar desteklenmelidir.
- FR-125: Sistem, kripto varlıkları piyasa değeri, hacim, fiyat değişimi ve RSI gibi kriptoya uygun kriterlerle taramaya ve karşılaştırmaya izin vermelidir.
- FR-126: AI raporlarının (FR-100, FR-101) kriptoya uygulanıp uygulanmayacağı ayrı bir kararla belirlenmeli; hisse varsayımlarıyla üretilmiş yanıltıcı bir kripto raporu sunulmamalıdır.

## Done when

1. BTC araması CRYPTO rozetiyle sonuç döner ve detay sayfası açılır.
2. Kripto çağrıları hisse sayfalarının veri kotasını tüketmez.
3. İzleme listesi, alarm, portföy (kesirli miktar) ve simülasyon kriptoyla çalışır.
4. Kripto metinleri yatırım tavsiyesi veya alım-satım hizmeti izlenimi vermez.
5. Hepsi canlıda, web ve mobilde.

## Boundaries

Yalnızca veri, analiz ve sanal işlem; cüzdan/borsa bağlantısı yok.

## References

- parent — docs/PRD.md, Bölüm 5 (FR'ler)
- source — docs/epics.md, Epic 11
- architecture — docs/initiative-borocean/architecture-borocean/architecture-borocean.md
- constraint — docs/compliance.md (SPK/KVKK; tüm epic'leri bağlar)

## Notes

- Open question: veri kaynağı ve maliyet (Twelve Data kotası paylaşımı / CoinGecko) — 11.1'de netleşir.
- Open question: yayından önce hukuki görüş alınmalı mı (kripto düzenlemeleri).
- Open question: başlangıç evreni (ilk ~100 varlık, USD pariteleri, stablecoin'ler) ve freemium sınırları.
- Assumption: tracer bullet 11.1 + 11.2 — BTC araması → CRYPTO detay sayfası, API'den web'e tüm katmanlar.
- Assumption: 11.3–11.6 birbirinden bağımsız dört hat; hepsi 11.1 adaptörüne bağlı, 11.4–11.5 ayrıca 11.2 detay sayfasına.
- Waits on epic 3 because: gösterge ve sinyal motoru.
- Waits on epic 4 because: tarama ve karşılaştırma.
- Waits on epic 5 because: izleme listesi ve alarmlar.
- Waits on epic 6 because: portföy.
- Waits on epic 9 because: AI raporları (11.7 kararı için).
- Waits on epic 10 because: simülasyon.
- Waits on epic 12 because: yönlendirme yasağı (compliance.md §4 madde 7).
- Waits on epic 14 because: arka plan alarm çalıştırıcısı (14.2).
