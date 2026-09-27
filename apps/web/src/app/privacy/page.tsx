import Link from "next/link";
import { CONTACT_EMAIL, LegalPage } from "@/components/legal/legal-page";

export const metadata = {
  title: "Gizlilik Politikası — Borocean",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Gizlilik Politikası" updated="28 Eylül 2026">
      <p>
        Borocean (&quot;biz&quot;), hisse senedi ve portföy analiz hizmeti sunan bir web ve mobil
        uygulamasıdır. Bu sayfa, hizmeti kullanırken hangi verileri topladığımızı, neden
        topladığımızı ve nasıl kullandığımızı özetler. KVKK kapsamındaki ayrıntılı bilgilendirme
        için <Link href="/kvkk">KVKK Aydınlatma Metni</Link>&apos;ne bakın.
      </p>

      <h2>Topladığımız veriler</h2>
      <ul>
        <li>
          Hesap bilgileri: e-posta adresi ve şifre (Supabase Auth üzerinden güvenli şekilde
          saklanır, biz düz metin şifreyi hiçbir zaman görmeyiz)
        </li>
        <li>
          Google veya Apple ile giriş etkinleştirildiğinde: bu sağlayıcıların paylaştığı ad ve
          e-posta bilgisi
        </li>
        <li>
          Uygulama içi kayıtlar: izleme listeleri, portföy pozisyonları, alım-satım
          simülasyonları, fiyat/sinyal alarmları, kayıtlı taramalar, hisse notları, dil ve ilgi
          sektörü tercihleri
        </li>
        <li>Bildirim tercihleri ve mobil cihazın anlık bildirim anahtarı</li>
        <li>
          Teknik veriler: IP adresi ve sunucu kayıtları; oturum ve tercihler için gerekli
          çerezler/yerel depolama kayıtları (örn. dil ve tema tercihi)
        </li>
      </ul>
      <p>
        Yaş, gelir veya risk toleransı gibi yatırımcı profili bilgisi toplamayız; reklam veya
        analitik amaçlı üçüncü taraf takip çerezi kullanmayız.
      </p>

      <h2>Verileri nasıl kullanıyoruz</h2>
      <p>
        Topladığımız veriler yalnızca Borocean hizmetini sağlamak için kullanılır: hesabınıza
        giriş yapmanızı sağlamak, izleme listelerinizi ve portföyünüzü göstermek, fiyat/sinyal
        alarmlarını göndermek ve hizmetin güvenliğini sağlamak. Verileriniz satılmaz ve reklam
        amacıyla kullanılmaz.
      </p>

      <h2>Hizmet sağlayıcılarımız</h2>
      <ul>
        <li>
          <strong>Supabase</strong> — kimlik doğrulama ve veritabanı altyapısı
        </li>
        <li>
          <strong>Vercel, Render</strong> — web uygulaması ve API barındırma
        </li>
        <li>
          <strong>Resend</strong> — e-posta bildirimlerinin gönderimi
        </li>
        <li>
          <strong>Expo</strong> — mobil anlık bildirimlerin iletimi
        </li>
        <li>
          <strong>Google Gemini</strong> — AI analiz raporlarının üretimi (yalnızca hisse
          sembolü ve kamuya açık piyasa verisi gönderilir, kişisel veriniz gönderilmez)
        </li>
        <li>
          <strong>Finnhub, Twelve Data</strong> — piyasa/fiyat verisi sağlayıcıları (kişisel
          veriniz gönderilmez)
        </li>
      </ul>

      <h2>Veri saklama ve silme</h2>
      <p>
        Verileriniz hesabınız açık olduğu sürece saklanır. Hesabınızı ve ilişkili tüm
        verilerinizi <strong>Ayarlar → Hesabı sil</strong> adımıyla kendiniz, anında ve kalıcı
        olarak silebilirsiniz.
      </p>

      <h2>İletişim</h2>
      <p>
        Gizlilikle ilgili sorularınız için: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
