---
title: "Story 1.9: Ayrı Giriş ve Kayıt Ekranları, Kayıtta Onay"
epic: "Epic 1 — Kimlik Doğrulama, Hisse Keşfi ve Temel Altyapı"
story_id: "1.9"
status: done
created: 2026-10-09
updated: 2026-10-09
author: Claude (kullanıcı isteğiyle, 2026-10-09)
based_on: ["kullanıcı isteği 2026-10-09", "docs/stories/story-1.7.md", "docs/stories/story-1.8.md", "docs/stories/story-12.2.md"]
depends_on: ["1.7", "1.8", "12.2"]
---

# Story 1.9: Ayrı Giriş ve Kayıt Ekranları, Kayıtta Onay

## Kullanıcı Hikayesi

As a **kullanıcı**,
I want giriş ekranında bilgilerimi girip Enter'a ya da "Giriş Yap"a bastığımda hesabım varsa giriş yapmak, yoksa "kayıt bulunamadı" mesajı görmek; kayıt olmak için ayrı bir ekranda bilgilerimi girip metinleri onaylamak,
So that giriş ve kayıt birbirine karışmasın ve neyi kabul ettiğimi bilerek kayıt olayım.

## Bağlam

Önceden tek bir form vardı: kullanıcı adı, e-posta, şifre ve yan yana "Giriş Yap" / "Kayıt Ol" düğmeleri. Kullanıcı bu çalışma şeklini beğenmedi.

## Kapsam

- **Giriş (`/login`):**
  - Yalnızca e-posta ve şifre; Enter ya da "Giriş Yap" giriş yapar.
  - Supabase "yanlış bilgi" döndürürse e-postanın kayıtlı olup olmadığı API'den sorulur. Kayıtlı değilse "Bu e-posta adresiyle kayıtlı bir hesap bulunamadı." + "Kayıt ol" bağlantısı; kayıtlıysa "Şifre hatalı."
  - Altta "Hesabın yok mu? Kayıt ol".
- **Kayıt (`/signup`):**
  - Alanlar: kullanıcı adı, e-posta, şifre.
  - Zorunlu onay kutusu: "Kullanım Koşulları'nı okudum ve kabul ediyorum; KVKK Aydınlatma Metni'ni okudum. Borocean'ın bir yatırım danışmanlığı hizmeti olmadığını biliyorum." (metinlere bağlantılı, yeni sekmede açılır).
  - Onay sunucuda da kontrol edilir ve `user_metadata.legal_accepted_at` + `legal_version` (`LEGAL_VERSION`, `packages/shared/src/legal.ts`) olarak saklanır.
  - Kayıtlı bir e-postayla kayıt denenirse "Bu e-posta adresiyle zaten bir hesap var" + "Giriş yap". Önceden Supabase bu durumda da "e-postanı doğrula" diyordu ve hiç gelmeyecek bir e-posta bekletiliyordu.
- **Ana sayfa:** "Giriş Yap" ve "Kayıt Ol" ayrı düğmeler.
- **Mobil:** `AuthScreen` iki modlu (giriş / kayıt), aynı davranış ve onay kutusuyla. Klavyede "go" tuşu giriş yapar.
- **API:** `POST /auth/account-exists` (`app/account.py`).

**Not — açık bir ödünleşim:** "Kayıt bulunamadı" demek, bir e-postanın kayıtlı olup olmadığını herkese söylemek demektir. Supabase bunu bilerek yapmaz (hesap avcılığını zorlaştırmak için). Kullanıcı isteği üzerine açıldı, ancak toplu sorguya karşı iki önlem var:
- e-posta başına 10 dakikada 5 kontrol, toplamda dakikada 120 kontrol (sınır aşılınca cevap verilmez, ekran genel mesaja döner);
- arayüz yalnızca başarısız bir girişten sonra sorar.

`docs/compliance.md` avukat incelemesi listesine eklenebilir.

**KVKK notu:** Aydınlatma bir bilgilendirmedir, açık rıza değildir. Onay kutusu koşulların kabulünü ve aydınlatma metninin okunduğunu kaydeder. Açık rıza gerektiren bir işleme (bkz. compliance §4, yurt dışı aktarım) netleşirse ayrı ve isteğe bağlı bir onay olarak eklenmeli.

## Definition of Done

- [x] Backend testleri yeşil (377/377; hesap kontrolü ve hız sınırı testleri dahil), web/mobil typecheck + lint temiz, `next build` başarılı.
- [x] **Gerçek tarayıcıda doğrulandı** (2026-10-09, Playwright, yerel web + API, dev Supabase):
  - Giriş sayfasında kayıt düğmesi yok.
  - Kayıtsız e-posta + Enter → "kayıtlı hesap bulunamadı" + Kayıt ol bağlantısı.
  - Kayıt sayfasında onay işaretlenmeden gönderim engelleniyor.
  - Onayla kayıt → Panel ("Merhaba, Kayıt Test").
  - Çıkış → yanlış şifre → "Şifre hatalı." → doğru şifre → Panel.
  - Aynı e-postayla tekrar kayıt → "zaten bir hesap var".
  - Konsol hatası yok; test kullanıcısı silindi.
- [ ] Mobil cihaz doğrulaması — bu ortamda yok.
