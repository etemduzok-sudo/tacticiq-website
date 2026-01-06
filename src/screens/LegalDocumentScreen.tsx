import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface LegalDocumentScreenProps {
  documentType: string;
  onBack: () => void;
}

// Legal content data
const LEGAL_CONTENT: Record<string, { title: string; content: string }> = {
  terms: {
    title: 'Kullanım Koşulları',
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
    title: 'Gizlilik Politikası',
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
    title: 'Çerez Politikası',
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
    title: 'KVKK Aydınlatma Metni',
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
    title: 'Açık Rıza Metni',
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
    title: 'Mesafeli Satış Sözleşmesi',
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

export const LegalDocumentScreen: React.FC<LegalDocumentScreenProps> = ({
  documentType,
  onBack,
}) => {
  const doc = LEGAL_CONTENT[documentType];

  if (!doc) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#059669" />
            <Text style={styles.backText}>Geri</Text>
          </TouchableOpacity>
        </View>

        {/* Document Container */}
        <Animated.View entering={FadeInDown.delay(0)} style={styles.documentContainer}>
          {/* Document Header */}
          <View style={styles.documentHeader}>
            <Ionicons name="document-text" size={32} color="#F59E0B" />
            <Text style={styles.documentTitle}>{doc.title}</Text>
          </View>

          {/* Document Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.documentText}>{doc.content}</Text>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerBrand}>
              <Ionicons name="shield-checkmark" size={16} color="#F59E0B" />
              <Text style={styles.footerText}>Fan Manager 2026</Text>
            </View>

            <TouchableOpacity onPress={onBack} activeOpacity={0.8}>
              <LinearGradient
                colors={['#059669', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Kapat</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#059669',
  },

  // Document Container
  documentContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },

  // Document Header
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(5, 150, 105, 0.2)',
  },
  documentTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  documentText: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 22,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(5, 150, 105, 0.2)',
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  // Close Button
  closeButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
