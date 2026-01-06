import { motion } from "motion/react";
import { ChevronLeft, FileText, Shield } from "lucide-react";
import { Button } from "./ui/button";

interface LegalDocumentScreenProps {
  documentType: string;
  onBack: () => void;
}

// Legal content data
const LEGAL_CONTENT: Record<string, { title: string; content: string }> = {
  terms: {
    title: "Kullanım Koşulları",
    content: `Son Güncelleme: 31 Aralık 2024

1. GENEL HÜKÜMLER
Fan Manager 2026 ("Uygulama") kullanımı aşağıdaki şartlara tabidir. Uygulamayı kullanarak bu koşulları kabul etmiş sayılırsınız.

2. HİZMET TANIMI
Fan Manager 2026, kullanıcılara sanal futbol yönetimi deneyimi sunan bir eğlence platformudur. Tüm tahminler ve sonuçlar simülasyona dayalıdır.

3. KULLANICI SORUMLULUKLARI
• Hesap bilgilerinizin güvenliğinden siz sorumlusunuz
• 18 yaş altı kullanıcılar ebeveyn onayı almalıdır
• Platformu kötüye kullanmamayı kabul edersiniz

4. FİKRİ MÜLKİYET HAKLARI
Uygulamadaki tüm içerik, tasarım ve kodlar telif hakkı ile korunmaktadır.

5. SINIRLAMALAR
Hizmetlerimiz "olduğu gibi" sunulmaktadır. Kesintisiz erişim garantisi verilmemektedir.

6. DEĞİŞİKLİKLER
Bu koşullar bildirimde bulunmaksızın güncellenebilir.

7. İLETİŞİM
Sorularınız için: info@fanmanager2026.com`,
  },
  privacy: {
    title: "Gizlilik Politikası",
    content: `Son Güncelleme: 31 Aralık 2024

1. TOPLANAN BİLGİLER
• E-posta adresi
• Kullanıcı adı
• Oyun içi aktivite verileri
• Cihaz bilgileri

2. BİLGİ KULLANIMI
Topladığımız veriler:
• Hizmet sunumu için
• Kullanıcı deneyimini iyileştirmek için
• İletişim amaçlı
• Güvenlik ve dolandırıcılık önleme için

3. BİLGİ PAYLAŞIMI
Bilgileriniz üçüncü taraflarla satılmaz veya paylaşılmaz. Yalnızca yasal zorunluluk durumunda paylaşılabilir.

4. ÇEREZLER
Uygulama deneyimini iyileştirmek için çerezler kullanılmaktadır.

5. GÜVENLİK
Verileriniz endüstri standardı güvenlik protokolleri ile korunmaktadır.

6. HAKLARINIZ
• Verilerinize erişim hakkı
• Veri silme talebi
• Veri taşınabilirliği

7. İLETİŞİM
privacy@fanmanager2026.com`,
  },
  cookies: {
    title: "Çerez Politikası",
    content: `Son Güncelleme: 31 Aralık 2024

1. ÇEREZ NEDİR?
Çerezler, web sitesini ziyaret ettiğinizde cihazınızda saklanan küçük metin dosyalarıdır.

2. KULLANILAN ÇEREZ TÜRLERİ

a) Zorunlu Çerezler
• Oturum yönetimi
• Güvenlik
• Temel işlevsellik

b) Performans Çerezleri
• Sayfa yükleme süreleri
• Hata analizi
• Kullanım istatistikleri

c) İşlevsel Çerezler
• Dil tercihleri
• Tema seçimleri
• Kullanıcı ayarları

d) Analitik Çerezler
• Kullanıcı davranış analizi
• A/B testleri
• Optimizasyon

3. ÇEREZ YÖNETİMİ
Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz. Ancak bazı çerezleri devre dışı bırakmak site işlevselliğini etkileyebilir.

4. ÜÇÜNCÜ TARAF ÇEREZLERİ
Google Analytics gibi hizmetler kendi çerezlerini kullanabilir.

5. İLETİŞİM
cookies@fanmanager2026.com`,
  },
  kvkk: {
    title: "KVKK Aydınlatma Metni",
    content: `6698 Sayılı Kişisel Verilerin Korunması Kanunu Uyarınca Aydınlatma Metni

1. VERİ SORUMLUSU
Fan Manager 2026
Adres: [Şirket Adresi]
E-posta: kvkk@fanmanager2026.com

2. KİŞİSEL VERİLERİN İŞLENME AMAÇLARI
• Üyelik işlemlerinin yürütülmesi
• Hizmet sunumu ve geliştirme
• İletişim faaliyetleri
• Yasal yükümlülüklerin yerine getirilmesi
• Güvenlik önlemleri

3. İŞLENEN KİŞİSEL VERİLER
• Kimlik bilgileri (ad, soyad)
• İletişim bilgileri (e-posta, telefon)
• Kullanıcı işlem bilgileri
• Konum bilgileri (opsiyonel)

4. VERİLERİN AKTARILMASI
Verileriniz yalnızca:
• Yasal yükümlülük
• Hizmet sağlayıcılar (sunucu, analitik)
• Sizin açık rızanız
durumlarında aktarılır.

5. HAKLARINIZ (KVKK Madde 11)
• Kişisel verilerinizin işlenip işlenmediğini öğrenme
• İşlenmişse buna ilişkin bilgi talep etme
• İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme
• Yurt içi/yurt dışı aktarıldığı 3. kişileri öğrenme
• Eksik/yanlış işlenmişse düzeltilmesini isteme
• Silinmesini veya yok edilmesini isteme
• Düzeltme, silme, yok etme işlemlerinin aktarıldığı 3. kişilere bildirilmesini isteme
• Münhasıran otomatik sistemler ile analiz edilmesine itiraz etme
• Kanuna aykırı işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme

6. BAŞVURU YOLLARI
kvkk@fanmanager2026.com
[Posta Adresi]

Son Güncelleme: 31 Aralık 2024`,
  },
  consent: {
    title: "Açık Rıza Metni",
    content: `AÇIK RIZA METNİ

6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, Fan Manager 2026 tarafından:

AYDINLATMA:
• Kişisel verilerinizin işleneceği konusunda aydınlatıldım
• Verilerimin hangi amaçlarla kullanılacağını biliyorum
• Haklarım hakkında bilgilendirildim

ONAY:
Aşağıdaki kişisel verilerimin işlenmesine ve aktarılmasına AÇIK RIZA gösteriyorum:

✓ Kimlik Bilgilerim (Ad, Soyad, Kullanıcı Adı)
✓ İletişim Bilgilerim (E-posta, Telefon)
✓ Oyun İçi Aktivite Verilerim
✓ Cihaz ve IP Bilgilerim
✓ Konum Bilgilerim (Opsiyonel)
✓ Pazarlama ve Tanıtım İletişimi (Opsiyonel)

İŞLENME AMAÇLARI:
• Üyelik ve hizmet sunumu
• Kullanıcı deneyimi iyileştirme
• İletişim ve bilgilendirme
• Güvenlik ve dolandırıcılık önleme
• Yasal yükümlülüklerin yerine getirilmesi
• Pazarlama ve kampanya bildirimleri

AKTARIM:
Verilerimin yalnızca hizmet kalitesinin artırılması, yasal yükümlülüklerin yerine getirilmesi ve yukarıda belirtilen amaçlarla sınırlı olmak üzere iş ortaklarına, hizmet sağlayıcılarına ve yasal mercilere aktarılabileceğini kabul ediyorum.

HAKLARIM:
Bu rızamı her zaman geri çekebileceğimi, KVKK m.11 kapsamındaki haklarımı kullanabileceğimi biliyorum.

Rıza Tarihi: [Kayıt Tarihi]
Kullanıcı: [Kullanıcı Adı]

İletişim: consent@fanmanager2026.com`,
  },
  sales: {
    title: "Mesafeli Satış Sözleşmesi",
    content: `MESAFELİ SATIŞ SÖZLEŞMESİ

6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği Uyarınca

1. TARAFLAR

SATICI:
Ünvan: Fan Manager 2026
Adres: [Şirket Adresi]
E-posta: sales@fanmanager2026.com
Telefon: [Telefon]

ALICI:
Sözleşmeyi onaylayan kullanıcı

2. SÖZLEŞME KONUSU
İşbu sözleşme, alıcının satıcıdan elektronik ortamda sipariş verdiği aşağıda nitelikleri belirtilen dijital içerik/premium üyelik hizmetinin satış ve teslim şartlarını düzenler.

3. ÜRÜN/HİZMET BİLGİLERİ
• Premium Üyelik Paketi
• Pro Özellikler Erişimi
• Reklamsız Deneyim
• Özel İstatistikler

4. ÖDEME BİLGİLERİ
Toplam ücret uygulama içinde gösterilir ve ödeme anında onaylanır.

5. CAYMA HAKKI
Dijital içerik teslimatı başladığı için cayma hakkı bulunmamaktadır (TKHK m.15/1-ğ).

6. SORUMLULUKLAR
• Satıcı hizmeti kesintisiz sunmayı taahhüt eder
• Alıcı hesap güvenliğinden sorumludur

7. UYUŞMAZLIKLARIN ÇÖZÜMÜ
İşbu sözleşmeden doğan uyuşmazlıklarda Türkiye Cumhuriyeti yasaları uygulanır. Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.

8. YÜRÜRLÜK
Alıcı, ödemeyi tamamladığında bu sözleşmeyi kabul etmiş sayılır.

Tarih: [Satın Alma Tarihi]

İletişim: sales@fanmanager2026.com
Destek: support@fanmanager2026.com`,
  },
};

export function LegalDocumentScreen({ documentType, onBack }: LegalDocumentScreenProps) {
  const doc = LEGAL_CONTENT[documentType];

  if (!doc) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] flex flex-col px-4 py-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto flex flex-col h-full"
      >
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#059669] hover:text-[#047857] transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
            <span>Geri</span>
          </button>
        </div>

        {/* Document Container */}
        <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] border border-[#059669]/30 rounded-2xl shadow-2xl flex-1 flex flex-col overflow-hidden">
          {/* Document Header */}
          <div className="flex items-center gap-3 p-6 border-b border-[#059669]/20">
            <FileText className="w-8 h-8 text-[#F59E0B]" />
            <h1 className="text-2xl text-white">{doc.title}</h1>
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {doc.content}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[#059669]/20 flex justify-between items-center">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Shield className="w-4 h-4 text-[#F59E0B]" />
              <span>Fan Manager 2026</span>
            </div>
            <Button
              onClick={onBack}
              className="bg-[#059669] hover:bg-[#047857] text-white px-8 h-12 rounded-xl transition-all"
            >
              Kapat
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
