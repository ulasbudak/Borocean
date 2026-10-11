# Validation Report — Borocean, Karşılama Sayfası (/)

- **EXPERIENCE.md:** `docs/initiative-borocean/ux-borocean/EXPERIENCE.md`
- **Run at:** 2026-10-10

## Overall verdict

Yalnızca erişilebilirlik merceği çalıştırıldı (rubrik yürüyüşü atlandı). Temel renk/kontrast kararları sağlam: hero CTA renk çifti ≈5.35:1, "Üretimde" rozetleri ≈6.2:1, üç kart renkten değil başlık metninden ayrışıyor. Beş bulgu (1 yüksek, 3 orta, 1 düşük) çıktı — hepsi spec/mock hassasiyet boşluğuydu, görsel tasarım hatası değil — ve hepsi bu oturumda düzeltildi.

## Reviewer picked

- Accessibility (ad-hoc lens) — kullanıcı seçimi 2026-10-10. Rubrik yürüyüşü ve diğer mercekler atlandı.

## Findings by severity

### High (1)
**Accessibility** — "Giriş Yap" bağlantısının tıklama alanı tanımsız/küçük (WCAG 2.2 SC 2.5.8) (EXPERIENCE.md satır 55; key-landing.html `.loginlink`)
Mevcut 44pt dokunma kuralı yalnızca mobili kapsıyor; web'deki 13px dolgusuz bağlantı AA'nın 24×24px alt sınırının altındaydı.
**Fixed:** EXPERIENCE.md'ye 24×24px kuralı + Accessibility Floor'a genel web kuralı eklendi; mock'ta dolgu/min-height eklendi.

### Medium (3)
**Accessibility** — Kullanılmayan `.tag.soon` kuralı düşük-kontrast rozet desenini yeniden kuruyordu (key-landing.html)
%15 opaklıklı accent metin ≈3.6:1 — Ayarlar'da zaten düzeltilen hatanın aynısı, ölü ama tehlikeli kod.
**Fixed:** Kural silindi, açıklayıcı yorum eklendi.

**Accessibility** — Hero'nun tek sütuna dönüşü yalnızca mock'ta vardı, spine'da taahhüt edilmemişti (WCAG 1.4.10) (EXPERIENCE.md)
Spine "çelişince spine geçerlidir" dediği için metne yazılmayan davranış kaybolma riski taşıyordu.
**Fixed:** EXPERIENCE.md'ye `< sm` kırılımında tek sütuna dönme taahhüdü eklendi; mock'ın kırılım noktası mevcut `sm` standardına (640px) hizalandı.

**Accessibility** — Başlık hiyerarşisi h1→h3 atlıyordu, bölüm başlıkları hiç başlık değildi (key-landing.html)
Ekran okuyucu başlık gezinmesi "Araştır/Takip Et/Karar Desteği" ve "Aynı hisseye üç ayrı görüş"e ulaşamıyordu.
**Fixed:** Dört öğe gerçek `<h2>`'ye çevrildi; EXPERIENCE.md'ye not edildi.

### Low (1)
**Accessibility** — Dekoratif SVG'ler `aria-hidden` taşımıyordu (key-landing.html)
Floor'da mobil ikon-buton kuralı vardı, web dekoratif ikon eşdeğeri yoktu — floor boşluğu.
**Fixed:** Dört SVG'ye `aria-hidden="true"` eklendi; Accessibility Floor'a genel web kuralı eklendi.

## Mechanical notes
- Rubrik yürüyüşü kullanıcı tarafından atlandı; bu rapor yalnızca erişilebilirlik merceğini kapsar.
- Tüm düzeltmeler EXPERIENCE.md (taahhüt) ve mockups/key-landing.html (kanıt) ile tutarlı.

## Reviewer files
- `review-accessibility.md`
