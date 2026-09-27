---
title: "Story 12.2: KVKK — Aydınlatma, Kullanım Koşulları ve Hesap Silme"
epic: "Epic 12 — Hukuki Uyum (SPK ve KVKK)"
story_id: "12.2"
status: done
created: 2026-09-28
updated: 2026-09-28
author: Claude (kullanıcının paylaştığı hukuki değerlendirmeye göre, 2026-09-28)
based_on: ["docs/compliance.md", "docs/PRD.md §5.14 (FR-131)"]
depends_on: ["1.2", "1.7"]
---

# Story 12.2: KVKK — Aydınlatma, Kullanım Koşulları ve Hesap Silme

## Kullanıcı Hikayesi

As a **kullanıcı**,
I want hangi kişisel verilerimin neden ve nerede işlendiğini okuyabilmek ve hesabımı tüm verilerimle birlikte kendim silebilmek,
So that verilerim üzerindeki KVKK haklarımı destek beklemeden kullanabileyim.

## Bağlam

Paylaşılan hukuki değerlendirme (bkz. `docs/compliance.md`), hesap oluşturan bir uygulamanın KVKK kapsamında aydınlatma metni, gizlilik politikası, işleme amaçları, saklama süreleri, kullanıcı hakları ve üçüncü taraf aktarımını düzenlemesi gerektiğini belirtiyor. Özellikle portföy ve yatırım davranışı saklanıyorsa bunun baştan mimariye dahil edilmesini öneriyor. Öncesinde yalnızca Google OAuth onay ekranı için yazılmış taslak bir `/privacy` sayfası vardı: silme e-postayla talep ediliyordu, aydınlatma metni ve kullanım koşulları yoktu.

## Kapsam

- **`/kvkk` — Aydınlatma Metni:** veri sorumlusu; işlenen veri kategorileri (kimlik/iletişim, hesap güvenliği, uygulama içi kayıtlar, bildirim anahtarı, işlem güvenliği logları) ve yatırımcı profili verisi toplanmadığı; amaçlar ve m.5/2 hukuki sebepleri; veri işleyenler ve yurt dışı aktarım (Supabase-Frankfurt, Vercel, Render, Resend, Expo); Finnhub/Twelve Data/Gemini'ye kişisel veri gitmediği; toplama yöntemi; saklama; m.11 hakları ve başvuru yolu.
- **`/terms` — Kullanım Koşulları:** hizmetin kapsamı; SPK izni olmadığı ve yatırım danışmanlığı yapılmadığı; kişiye özel öneri üretilmediği; veri doğruluğu garantisi olmadığı; AI ve simülasyonun sınırları; hesap silme; kullanım kuralları (scraping ve verinin ticari yeniden yayımı yasak); uygulanacak hukuk.
- **`/privacy`** güncellendi: tüm hizmet sağlayıcılar listelendi. Önceki "üçüncü taraflarla paylaşılmaz" ifadesi, listelenen sağlayıcılarla çelişiyordu; yerine "satılmaz, reklam için kullanılmaz" yazıldı. Silme artık uygulama içinden.
- **Ortak çerçeve:** `components/legal/legal-page.tsx`; üç sayfa birbirine bağlanıyor. Metinler bilinçli olarak yalnızca Türkçe, çünkü KVKK açısından hukuki sonucu olan metin Türkçesi.
- **Kayıt bilgilendirmesi:** Web `/login` ve mobil `AuthScreen` altında "Kayıt olarak Kullanım Koşulları'nı kabul etmiş ve KVKK Aydınlatma Metni'ni okumuş olursun. Borocean bir yatırım danışmanlığı hizmeti değildir." + bağlantılar. Aydınlatma bir onay değil bilgilendirme olduğundan onay kutusu eklenmedi (açık rıza gerektiren bir işleme yok).
- **Ana sayfa:** uyarı metni + üç hukuki bağlantı.
- **Hesap silme:**
  - **Backend:** `app/account.py::delete_account` + `DELETE /me`. `auth.users` satırını silmek yeterli, çünkü migration 0001–0011'deki tüm kullanıcı tabloları `ON DELETE CASCADE`.
  - **Web ve mobil:** Ayarlar → "Hesabı sil" kartı; "SİL" yazarak onay; başarıda yerel oturum kapatılıyor.
- **Ayarlar:** web ve mobilde "Hukuki metinler" kartı. Mobil, sayfaları tarayıcıda açıyor (`lib/web-links.ts`).

**Kapsam dışı:** Veri taşınabilirliği/dışa aktarım (m.11 kapsamında bilgi talebi e-postayla karşılanıyor); çerez onay banner'ı (yalnızca zorunlu çerez/yerel depolama var, takip çerezi yok).

## Görevler

1. **[Backend]** `DELETE /me` + `app/account.py` + testler. ✅
2. **[Web]** `/kvkk`, `/terms`, `/privacy` sayfaları ve `LegalPage` çerçevesi. ✅
3. **[Web]** Giriş ekranı bilgilendirmesi, ana sayfa bağlantıları, ayarlarda hukuki metinler ve hesap silme. ✅
4. **[Mobil]** `AuthScreen` bilgilendirmesi, ayarlarda hukuki metinler ve hesap silme (`lib/account-client.ts`); ayarlar ekranı kaydırılabilir yapıldı. ✅
5. **[Shared]** `legal.*` ve `settings.deleteAccount*` metinleri (tr/en). ✅

## Kabul Kriterleri

- **Given** giriş yapmamış bir ziyaretçi, **When** `/kvkk`, `/terms` veya `/privacy`'yi açarsa, **Then** sayfa oturum istemeden görüntülenir.
- **Given** kayıt ekranı (web/mobil), **When** görüntülenirse, **Then** koşullar ve aydınlatma metni bilgilendirmesi ile bağlantıları görünür.
- **Given** giriş yapmış bir kullanıcı, **When** Ayarlar'da "SİL" yazıp hesabı silerse, **Then** `auth.users` satırı ve kullanıcıya bağlı tüm satırlar silinir, oturum kapanır ve kullanıcı ana sayfaya döner. Onay kelimesi yazılmadan buton pasiftir.

## Definition of Done

- [x] Backend testleri yeşil (338/338; hesap silme için 5 yeni test), ruff temiz.
- [x] Web ve mobil typecheck + lint temiz; `next build` başarılı (`/kvkk`, `/terms` rotaları); mobil Metro bundle başarılı.
- [x] **Gerçek tarayıcıda uçtan uca doğrulandı** (2026-09-28, Playwright, yerel web + API, dev Supabase):
  - Üç hukuki sayfa ve giriş ekranı bilgilendirmesi görüntülendi.
  - Ayarlarda buton "SİL" yazılmadan pasif; küçük harfle "sil" yazınca aktifleşiyor.
  - Silme sonrası `DELETE /me` → 204 döndü ve kullanıcı ana sayfaya yönlendirildi. `/dashboard` artık `/login`'e yönlendiriyor.
  - Veritabanında `auth.users` ve dokuz kullanıcı tablosunda o kullanıcıya ait satır kalmadığı sorgulandı.
  - İki geçici test kullanıcısı bu akışla silindi, geride kalan yok.
  - Beklenen tek konsol hatası: silinmiş kullanıcı için Supabase `logout?scope=local` isteği 403 dönüyor. supabase-js oturumu yine de temizliyor; koda not düşüldü.
- [ ] Avukat incelemesi; veri sorumlusu posta adresi; yurt dışı aktarım aracı — `docs/compliance.md` §4.
- [ ] Mobil cihaz/simülatör doğrulaması — bu ortamda yok.
