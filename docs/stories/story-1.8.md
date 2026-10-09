---
title: "Story 1.8: Kullanıcı Adı ve Panelde Üst Menü"
epic: "Epic 1 — Kimlik Doğrulama, Hisse Keşfi ve Temel Altyapı"
story_id: "1.8"
status: done
created: 2026-10-09
updated: 2026-10-09
author: Claude (kullanıcı isteğiyle, 2026-10-09)
based_on: ["kullanıcı isteği 2026-10-09"]
depends_on: ["1.2", "1.7"]
---

# Story 1.8: Kullanıcı Adı ve Panelde Üst Menü

## Kullanıcı Hikayesi

As a **kullanıcı**,
I want kayıt olurken bir kullanıcı adı seçmek ve sitede e-postam yerine bu adı görmek; Panel'de menüye sayfanın en üstünden ulaşmak,
So that e-posta adresim ekranda görünmesin ve sık kullandığım sayfalara aşağı kaydırmadan gideyim.

## Kapsam

- **Kullanıcı adı:**
  - `user_metadata.display_name` alanında saklanır; ayrı bir tablo yok. 2–30 karakter; baştaki/sondaki ve tekrarlanan boşluklar temizlenir.
  - Ortak yardımcılar: `packages/shared/src/auth/display-name.ts`. `displayNameFrom` önce `display_name`'e, sonra Google/Apple'ın `full_name`/`name` alanına bakar.
  - Benzersizlik aranmıyor: sosyal özellik yok, ad yalnızca kişinin kendisine gösteriliyor.
- **Web:**
  - Kayıt formunda "Kullanıcı adı" alanı. Kayıtta zorunlu, girişte yok sayılır; sunucu tarafında doğrulanır.
  - Panelde "Giriş yapıldı: e-posta" yerine "Merhaba, {ad}"; avatar harfi addan.
  - Adı olmayan eski kullanıcılara Panel'de "Bir kullanıcı adı belirle" bağlantısı (ayarlara), bu sırada e-posta gösterilmeye devam eder.
  - Ayarlarda "Kullanıcı adı" kartı: `updateUser` + `refreshSession`.
- **Mobil:** kayıt ekranında ad alanı, ana ekranda selamlama, ayarlarda düzenleme.
- **Panel menüsü (web):**
  - Sayfanın en altındaki "Hızlı erişim" kartları selamlamanın hemen altına taşındı.
  - Üstte yer kaplamaması için kompakt hale getirildi: geniş ekranda tek satır 8 kutu, telefonda 4×2.
- **KVKK/gizlilik:** işlenen verilere "kullanıcı adı" eklendi.

**Kapsam dışı:** Mobil ana ekrandaki menü sırası (istek web içindi).

## Definition of Done

- [x] Web/mobil typecheck + lint temiz, `next build` başarılı, backend testleri yeşil.
- [x] **Gerçek tarayıcıda doğrulandı** (2026-10-09, Playwright, yerel web + API, dev Supabase, geçici kullanıcı):
  - Ad girmeden kayıt reddedildi; hata satırda gösterildi ve e-posta alanı korundu.
  - Adla kayıt sonrası Panel'de "Merhaba, Deneme Kullanıcı" ve avatar "D" görüldü; e-posta sayfada geçmiyor.
  - Menü arama kutusunun üstünde.
  - Ayarlardan ad değiştirildi, Panel hemen yeni adı gösterdi.
  - 390 px'de taşma yok, konsol hatası yok.
  - Test kullanıcısı `DELETE /me` ile silindi.
- [ ] Mobil cihaz doğrulaması — bu ortamda yok.
