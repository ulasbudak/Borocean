import Link from "next/link";
import { CONTACT_EMAIL, LegalPage } from "@/components/legal/legal-page";

export const metadata = {
  title: "Kullanım Koşulları",
  alternates: { canonical: "/terms" },
};

// Story 12.1/12.2. Section 2 is the SPK-facing core: what the app does and deliberately
// does not do. Keep it in sync with the product (docs/compliance.md).
export default function TermsPage() {
  return (
    <LegalPage title="Kullanım Koşulları" updated="28 Eylül 2026">
      <p>
        Bu koşullar, Borocean web ve mobil uygulamasının (&quot;Uygulama&quot;) kullanımını
        düzenler. Uygulamaya kayıt olarak bu koşulları kabul etmiş olursunuz.
      </p>

      <h2>1. Hizmetin kapsamı</h2>
      <p>
        Borocean, kamuya açık piyasa ve finansal verileri gösteren, bu veriler üzerinde oran
        hesaplayan, grafik ve karşılaştırma araçları sunan ve bu verileri yapay zeka yardımıyla
        özetleyen bir <strong>bilgilendirme ve analiz aracıdır</strong>. Uygulama; izleme
        listesi, fiyat/gösterge alarmı, kişisel portföy takibi ve tamamen sanal bir bütçeyle
        çalışan alım-satım simülasyonu gibi araçlar içerir.
      </p>

      <h2>2. Yatırım danışmanlığı değildir</h2>
      <ul>
        <li>
          Borocean bir aracı kurum veya yatırım danışmanlığı şirketi değildir; Sermaye Piyasası
          Kurulu&apos;ndan (SPK) yatırım hizmet ve faaliyetleri için alınmış bir izni yoktur ve bu
          tür bir hizmet sunmaz.
        </li>
        <li>
          Uygulamadaki hiçbir içerik — metrik puanları, teknik gösterge ve örüntü bulguları, yapay
          zeka raporları, sektör bültenleri — belirli bir sermaye piyasası aracının alınması,
          satılması veya elde tutulması yönünde bir öneri değildir.
        </li>
        <li>
          Uygulama; yaşınız, geliriniz, risk toleransınız veya mali durumunuz gibi bilgileri
          toplamaz ve size özel bir yatırım önerisi ya da portföy dağılımı üretmez. İçerikler
          herkese aynı şekilde, genel bilgilendirme amacıyla sunulur.
        </li>
        <li>
          Yatırım kararlarınızı kendi değerlendirmenizle ve gerektiğinde yetkili bir yatırım
          danışmanından destek alarak verirsiniz; bu kararların sonuçlarından siz sorumlusunuz.
        </li>
      </ul>

      <h2>3. Verilerin doğruluğu</h2>
      <p>
        Fiyat ve finansal veriler üçüncü taraf sağlayıcılardan (Finnhub, Twelve Data) alınır;
        gecikmeli, eksik veya hatalı olabilir. Ücretsiz katmanda fiyat verisi gecikmeli veya
        günlük olabilir. Borocean verilerin doğruluğunu, güncelliğini veya kesintisiz
        sunulacağını garanti etmez.
      </p>

      <h2>4. Yapay zeka içerikleri</h2>
      <p>
        Yapay zeka raporları, Uygulamanın hesapladığı kamuya açık verilerden otomatik olarak
        üretilir ve hata içerebilir. Teknik analiz raporundaki grafik modeli üçüncü taraf, deneysel
        bir modeldir; bulguları geçmiş fiyat grafiği üzerindeki bir okumadır, gelecekteki fiyat
        hareketine dair bir tahmin değildir.
      </p>

      <h2>5. Simülasyon</h2>
      <p>
        Alım-satım simülasyonu tamamen sanal bir bütçeyle çalışır. Hiçbir emir hiçbir aracı
        kuruma veya borsaya iletilmez; simülasyon sonuçları gerçek bir yatırımın sonucunu
        göstermez.
      </p>

      <h2>6. Hesabınız</h2>
      <p>
        Hesap bilgilerinizin güvenliğinden siz sorumlusunuz. Hesabınızı istediğiniz zaman{" "}
        <strong>Ayarlar → Hesabı sil</strong> adımıyla kalıcı olarak silebilirsiniz. Kişisel
        verilerinizin işlenmesi hakkında bilgi için <Link href="/kvkk">KVKK Aydınlatma
        Metni</Link>&apos;ne bakın.
      </p>

      <h2>7. Kullanım kuralları</h2>
      <p>
        Uygulamayı yasalara aykırı amaçlarla, otomatik veri toplama (scraping) için veya
        başkalarını yanıltacak şekilde kullanamaz; Uygulamadaki verileri ticari amaçla yeniden
        yayımlayamazsınız.
      </p>

      <h2>8. Değişiklikler ve iletişim</h2>
      <p>
        Bu koşullar güncellenebilir; güncel metin her zaman bu sayfada yer alır. Sorularınız
        için: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Bu koşullara Türkiye
        Cumhuriyeti hukuku uygulanır.
      </p>
    </LegalPage>
  );
}
