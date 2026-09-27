import { CONTACT_EMAIL, LegalPage } from "@/components/legal/legal-page";

export const metadata = {
  title: "KVKK Aydınlatma Metni — Borocean",
};

// Story 12.2. The data inventory below mirrors what the app actually stores
// (apps/api/migrations, Supabase user_metadata, cookies/localStorage) — update it together
// with any new table or third-party service.
export default function KvkkPage() {
  return (
    <LegalPage title="KVKK Aydınlatma Metni" updated="28 Eylül 2026">
      <p>
        Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) m.10
        uyarınca, Borocean web ve mobil uygulamasını (&quot;Uygulama&quot;) kullanırken kişisel
        verilerinizin nasıl işlendiği hakkında sizi bilgilendirmek için hazırlanmıştır.
      </p>

      <h2>1. Veri sorumlusu</h2>
      <p>
        Veri sorumlusu, Uygulamayı geliştiren ve işleten Serdar Ulaş Budak&apos;tır (&quot;Borocean&quot;).
        Başvuru ve sorularınız için: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>

      <h2>2. İşlenen kişisel veriler</h2>
      <ul>
        <li>
          <strong>Kimlik ve iletişim:</strong> e-posta adresi; sosyal hesapla giriş etkinse
          sağlayıcının paylaştığı ad ve e-posta.
        </li>
        <li>
          <strong>Hesap güvenliği:</strong> şifrenin tek yönlü özeti (şifrenizi düz metin olarak
          hiçbir zaman görmeyiz), oturum anahtarları.
        </li>
        <li>
          <strong>Uygulama içi kayıtlar:</strong> izleme listeleri, fiyat ve sinyal alarmları,
          portföy pozisyonları (adet, maliyet), alım-satım simülasyonları, hisse notları, kayıtlı
          taramalar, dil tercihi ve seçtiğiniz ilgi sektörleri.
        </li>
        <li>
          <strong>Bildirim:</strong> e-posta bildirim tercihi ve mobil cihazınızın anlık
          bildirim (push) anahtarı.
        </li>
        <li>
          <strong>İşlem güvenliği:</strong> IP adresi, tarayıcı/cihaz bilgisi, giriş zamanları ve
          sunucu kayıtları (log).
        </li>
      </ul>
      <p>
        Uygulama; yaş, gelir, risk toleransı gibi yatırımcı profili bilgisi <strong>toplamaz</strong>{" "}
        ve özel nitelikli kişisel veri işlemez. Portföy ve simülasyon kayıtlarınız size kişisel
        yatırım önerisi üretmek için kullanılmaz.
      </p>

      <h2>3. İşleme amaçları ve hukuki sebepler</h2>
      <ul>
        <li>
          Hesabınızı oluşturmak, giriş yapmanızı sağlamak ve Uygulamanın özelliklerini (izleme
          listesi, alarm, portföy, simülasyon, not, tarama) sunmak —{" "}
          <em>sözleşmenin kurulması ve ifası</em> (KVKK m.5/2-c).
        </li>
        <li>
          Talep ettiğiniz alarm bildirimlerini e-posta veya anlık bildirim olarak göndermek —{" "}
          <em>sözleşmenin ifası</em> (m.5/2-c).
        </li>
        <li>
          Hizmetin güvenliğini sağlamak, kötüye kullanımı ve hataları tespit etmek —{" "}
          <em>meşru menfaat</em> (m.5/2-f).
        </li>
        <li>
          Yasal yükümlülükleri yerine getirmek ve olası uyuşmazlıklarda hakların tesisi —{" "}
          <em>hukuki yükümlülük; bir hakkın tesisi, kullanılması veya korunması</em> (m.5/2-ç, e).
        </li>
      </ul>
      <p>Verileriniz reklam, profilleme veya satış amacıyla kullanılmaz.</p>

      <h2>4. Aktarım</h2>
      <p>
        Kişisel verileriniz yalnızca hizmeti sunmak için çalıştığımız veri işleyen hizmet
        sağlayıcılarına, bu amaçla sınırlı olarak aktarılır. Bu sağlayıcıların sunucuları yurt
        dışındadır; aktarım KVKK m.9 çerçevesinde yapılır.
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — kimlik doğrulama ve veritabanı (sunucular Frankfurt,
          Almanya).
        </li>
        <li>
          <strong>Vercel</strong> ve <strong>Render</strong> — web uygulaması ve API barındırma
          (sunucu kayıtları dahil).
        </li>
        <li>
          <strong>Resend</strong> — e-posta bildirimlerinin gönderimi (e-posta adresi).
        </li>
        <li>
          <strong>Expo</strong> — mobil anlık bildirimlerin iletimi (bildirim anahtarı).
        </li>
      </ul>
      <p>
        Piyasa verisi sağlayıcılarına (Finnhub, Twelve Data) ve AI raporları için kullanılan
        Google Gemini&apos;ye kişisel veriniz gönderilmez; bu hizmetlere yalnızca hisse sembolü ve
        kamuya açık finansal veri iletilir.
      </p>

      <h2>5. Toplama yöntemi</h2>
      <p>
        Verileriniz; kayıt ve giriş formları, Uygulama içindeki işlemleriniz ve Uygulamanın
        çalışması için zorunlu çerezler/yerel depolama kayıtları aracılığıyla elektronik ortamda
        toplanır.
      </p>

      <h2>6. Saklama süresi</h2>
      <p>
        Verileriniz hesabınız açık olduğu sürece saklanır. Hesabınızı <strong>Ayarlar → Hesabı
        sil</strong> adımıyla sildiğinizde, hesabınız ve ona bağlı tüm kayıtlar (izleme listeleri,
        alarmlar, portföyler, simülasyonlar, notlar, kayıtlı taramalar, bildirim ayarları) derhal
        ve kalıcı olarak silinir. Hizmet sağlayıcıların güvenlik ve yedekleme kayıtları, kendi
        saklama süreleri sonunda silinir.
      </p>

      <h2>7. Haklarınız</h2>
      <p>KVKK m.11 uyarınca;</p>
      <ul>
        <li>kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme,</li>
        <li>işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
        <li>yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
        <li>eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
        <li>KVKK m.7 çerçevesinde silinmesini veya yok edilmesini isteme,</li>
        <li>düzeltme ve silme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
        <li>
          münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonuç çıkmasına
          itiraz etme,
        </li>
        <li>kanuna aykırı işleme nedeniyle zarara uğrarsanız zararın giderilmesini talep etme</li>
      </ul>
      <p>
        haklarına sahipsiniz. Taleplerinizi{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> adresine, kayıtlı e-posta
        adresinizden iletebilirsiniz. Başvurular en geç 30 gün içinde ücretsiz olarak
        sonuçlandırılır.
      </p>
    </LegalPage>
  );
}
