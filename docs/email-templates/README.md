# Supabase e-posta şablonları (Story 14.1)

Supabase prod → **Authentication → Emails → Templates** altına elle yapıştırılır; repoda yalnızca kaynak olarak duruyor. Değiştirince buradaki dosyayı da güncelle.

| Supabase şablonu | Konu (Subject) | Dosya |
|---|---|---|
| Confirm signup | `Borocean: E-posta adresini doğrula` | `confirm-signup.html` |
| Reset password | `Borocean: Şifre sıfırlama` | `reset-password.html` |

`{{ .ConfirmationURL }}` Supabase'in doldurduğu bağlantıdır. Bağlantı, uygulamanın gönderdiği `redirectTo` adresine (`/auth/oauth`) döner; bunu değiştirme.
