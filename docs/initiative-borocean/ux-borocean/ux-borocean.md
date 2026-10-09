---
type: ux
title: "Borocean UX"
status: final
updated: 2026-10-09
spines: [DESIGN.md, EXPERIENCE.md]
---

# Borocean UX

- [`DESIGN.md`](DESIGN.md): görsel kimlik (token'lar, bileşen görünümü, kurallar).
- [`EXPERIENCE.md`](EXPERIENCE.md): davranış (bilgi mimarisi, durumlar, etkileşim, erişilebilirlik, akışlar).
- [`mockups/`](mockups/): ana ekranların HTML taslakları. Görsel referanstır; çelişkide spine'lar geçerlidir.

## UX tasarım planı (2026-10-09)

Canlıdaki arayüzün incelenmesinden çıkan iyileştirmeler, öncelik sırasıyla. Her madde ticket ağacında **Epic 16 — UX iyileştirmeleri** altında bir story'dir (`docs/initiative-borocean/epic-ux-improvements/`).

| # | İyileştirme | Neden | Etki | Bağlı |
|---|---|---|---|---|
| 16.1 | **Kontrastı WCAG AA'ya çıkarmak** | Ölçüldü (aşağıdaki tablo): `text-tertiary` her iki modda AA altında. Bu renk "yatırım tavsiyesi değildir" ibaresini taşıyor, yani okunamayan bir hukuki metin. Koyu moddaki birincil düğme metni ve açık moddaki yeşil ve turuncu da AA altında. | Yüksek | — |
| 16.2 | **Mobilde gerçek gezinme** | Ekranlar durum bayraklarıyla açılıyor. Android geri tuşu uygulamadan çıkıyor, push yalnızca portföyü açabiliyor, derin bağlantı yok. | Yüksek | Mağaza yayını ileride; geri tuşu ve derin bağlantı yine gerekli |
| 16.3 | **Web'de kalıcı gezinme** | Alt sayfalardan başka bir alt sayfaya ancak Panel'e dönerek gidiliyor; geri tuşuna bağımlı. | Orta | — |
| 16.4 | **İlk kullanım rehberi** | Yeni kullanıcının Paneli boş (ilgi alanı yok, portföy yok, gelişme yok). İlk girişte ilgi alanı seçimi ve ilk hisse araması önerilmeli. `[ASSUMPTION]` | Orta | — |
| 16.5 | **Mobilde manuel tema seçimi** | Web'de sistem/koyu/açık seçimi var, mobil yalnızca sistem temasına uyuyor (AD-16 eşitlik). | Düşük | — |
| 16.7 | **Yüzde biçimini dile uydurmak** | `formatChange` yüzdeyi `toFixed(2)` ile yazıyor: Türkçede "+1.00%" çıkıyor, fiyat ise "$4,08". Aynı satırda iki ayrı ondalık işareti var. | Düşük | — |
| 16.6 | **Erişilebilirlik denetimi** | Resmi denetim yok. Web için otomatik denetim (axe) ve ekran okuyucu turu, mobil için VoiceOver/TalkBack turu. | Orta | 16.1 sonrası |

**Karar (2026-10-09):** Metrik Puanı'nın kategori çubuklarındaki değere göre renklendirme (yeşil/sarı/kırmızı) olduğu gibi kalıyor.

Başka epic'lerde zaten olan UX işleri (burada tekrar edilmedi):
- **Sosyal girişte onay ekranı:** Story 14.4.
- **Veri sınırı aşılınca açıklayıcı uyarı:** Story 15.2.
- **AI metinlerinin kullanıcının dilinde üretilmesi:** Story 15.11.
- **Push'ta uyarı ibaresi:** Gerekmiyor; ibare açılan ekranda (AD-11, karar 2026-10-09).

### Ölçülen kontrast (WCAG 2.2, normal metin için en az 4.5:1)

| Token çifti | Koyu | Açık | Kullanım |
|---|---|---|---|
| `text-tertiary` / `surface` | **3.82** ✗ | **2.56** ✗ | Uyarı ibaresi, meta metin, bölüm etiketi, yer tutucu |
| `accent-text` / `accent` | **3.38** ✗ | 5.17 ✓ | Birincil düğme metni |
| `positive` / `surface` | 9.60 ✓ | **3.30** ✗ | Yükseliş yüzdesi |
| `warning` / `surface` | 8.59 ✓ | **3.19** ✗ | Uyarı metni, gecikme notu |
| `negative` / `surface` | 6.67 ✓ | 4.83 ✓ | Düşüş yüzdesi |
| `accent` / `surface` | 5.02 ✓ | 5.17 ✓ | Bağlantı |
| `text-secondary` / `surface` | 7.27 ✓ | 7.58 ✓ | Etiket |

**16.1 sonrası (2026-10-09):** `text-tertiary` koyu `#848C98` (4.76–5.80), açık `#5F6E82` (4.75–5.20); koyu düğme metni `#0A0B0D` (5.35); açık `positive` `#15803D` (4.58–5.02), `warning` `#B45309` (4.58–5.02), `negative` `#B91C1C` (5.91–6.47). Aralıklar canvas, surface, surface-hover ve surface-elevated üzerindedir.
