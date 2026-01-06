import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../types';
import { BRAND, STADIUM_GRADIENT, DARK_MODE } from '../theme/theme';
import { AUTH_GRADIENT, PRIMARY_BUTTON_GRADIENT } from '../theme/gradients';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LegalDocument'>;
type LegalDocumentRouteProp = RouteProp<RootStackParamList, 'LegalDocument'>;

// KULLANIM KOŞULLARI İÇERİĞİ
const TERMS_CONTENT = `
1. GENEL HÜKÜMLER

Fan Manager 2026 ("Uygulama"), futbol taraftarlarına özel tasarlanmış bir dijital deneyim platformudur. Bu Kullanım Koşulları, Uygulamayı kullanarak kabul etmiş sayıldığınız şartları içermektedir.

2. HİZMET TANIMI

Uygulama, kullanıcılarına şu özellikleri sunar:
• Canlı maç takibi ve sonuçlar
• Tahmin ve istatistik sistemleri
• Kullanıcı profili ve kişiselleştirme
• Sosyal etkileşim özellikleri

3. KULLANICI SORUMLULUKLARI

Kullanıcılar olarak:
• Doğru ve güncel bilgiler vermeyi,
• Hesap güvenliğinizi korumayı,
• Platformu kötüye kullanmamayı,
• Diğer kullanıcılara saygılı davranmayı taahhüt edersiniz.

4. FİKRİ MÜLKİYET HAKLARI

Uygulamadaki tüm içerik, tasarım, logo ve yazılım Fan Manager 2026'nın mülkiyetindedir. İzinsiz kullanım yasaktır.

5. GİZLİLİK VE VERİ KORUMA

Kişisel verileriniz KVKK ve GDPR kapsamında korunmaktadır. Detaylı bilgi için Gizlilik Politikamızı inceleyiniz.

6. HESAP DONDURMA VE İPTAL

Platform kurallarını ihlal eden kullanıcıların hesapları uyarı yapılmaksızın askıya alınabilir veya silinebilir.

7. ÖDEME VE ABONELIK

Premium özellikler için yapılan ödemeler iade edilmez. Abonelik otomatik olarak yenilenir.

8. SORUMLULUK SINIRLAMASI

Uygulama "olduğu gibi" sunulmaktadır. Teknik aksaklıklardan veya veri kayıplarından sorumluluk kabul edilmez.

9. DEĞİŞİKLİKLER

Bu koşullar herhangi bir zamanda değiştirilebilir. Kullanmaya devam etmeniz değişiklikleri kabul ettiğiniz anlamına gelir.

10. İLETİŞİM

Sorularınız için: legal@fanmanager2026.com

Son Güncelleme: 1 Ocak 2026
`;

// GİZLİLİK POLİTİKASI İÇERİĞİ
const PRIVACY_CONTENT = `
1. VERİ SORUMLUSU

Fan Manager 2026 olarak kişisel verilerinizin güvenliği ve gizliliği önceliğimizdir.

2. TOPLANAN VERİLER

Aşağıdaki kişisel verilerinizi işliyoruz:
• Kimlik Bilgileri (Ad, Soyad, E-posta)
• İletişim Bilgileri (Telefon, Adres)
• Kullanım Verileri (IP adresi, cihaz bilgisi)
• Tercihleri ve İlgi Alanları

3. VERİLERİN KULLANIM AMAÇLARI

Verileriniz şu amaçlarla kullanılır:
• Hizmet sunumu ve iyileştirme
• Kullanıcı deneyimini kişiselleştirme
• İstatistik ve analiz çalışmaları
• Pazarlama ve bilgilendirme (onayınız dahilinde)

4. VERİ PAYLAŞIMI

Verileriniz yalnızca:
• Yasal zorunluluk halinde,
• Hizmet sağlayıcılarımız ile,
• Açık rızanız dahilinde paylaşılır.

5. VERİ GÜVENLİĞİ

Verileriniz:
• Şifreli olarak saklanır,
• Güvenli sunucularda barındırılır,
• Düzenli olarak yedeklenir,
• Yetkisiz erişime karşı korunur.

6. KULLANICI HAKLARI

Verilerinizle ilgili:
• Erişim ve öğrenme,
• Düzeltme ve güncelleme,
• Silme (unutulma hakkı),
• İtiraz etme haklarınız vardır.

7. ÇEREZLER (COOKIES)

Uygulamamız analitik ve fonksiyonel çerezler kullanır. Çerez ayarlarınızı kontrol edebilirsiniz.

8. ÇOCUKLARIN GİZLİLİĞİ

13 yaş altı kullanıcılardan bilerek veri toplamıyoruz. Ebeveyn onayı gereklidir.

9. ULUSLARARASI AKTARIM

Verileriniz AB ve Türkiye standartlarına uygun şekilde işlenir. Yurt dışı aktarımlarda ek güvenlik önlemleri alınır.

10. POLİTİKA DEĞİŞİKLİKLERİ

Bu politika güncellendiğinde e-posta ile bilgilendirilirsiniz.

İletişim: privacy@fanmanager2026.com
`;

// ÇEREZ POLİTİKASI
const COOKIES_CONTENT = `
1. ÇEREZ NEDİR?

Çerezler, web siteleri tarafından cihazınıza kaydedilen küçük metin dosyalarıdır.

2. KULLANDIĞIMIZ ÇEREZ TÜRLERİ

• Zorunlu Çerezler: Uygulamanın çalışması için gerekli
• Analitik Çerezler: Kullanım istatistikleri için
• Fonksiyonel Çerezler: Tercihlerinizi hatırlamak için
• Pazarlama Çerezleri: İlgili içerik göstermek için

3. ÇEREZ YÖNETİMİ

Çerez tercihlerinizi ayarlardan yönetebilirsiniz.

4. ÜÇÜNCÜ TARAF ÇEREZLERİ

Google Analytics, Firebase gibi hizmetler kendi çerezlerini kullanır.

İletişim: cookies@fanmanager2026.com
`;

// KVKK AYDINLATMA METNİ
const KVKK_CONTENT = `
6698 SAYILI KİŞİSEL VERİLERİN KORUNMASI KANUNU 
AYDINLATMA METNİ

1. VERİ SORUMLUSU

Fan Manager 2026

2. KİŞİSEL VERİLERİN İŞLENME AMACI

Verileriniz hizmet sunumu, sözleşme yükümlülükleri ve yasal düzenlemeler çerçevesinde işlenmektedir.

3. VERİLERİN AKTARILDIĞI TARAFLAR

• İş ortaklarımız
• Hizmet sağlayıcılarımız
• Yasal merciler

4. VERİ TOPLAMA YÖNTEMİ

• Uygulama üzerinden
• E-posta iletişiminden
• Otomatik sistemlerden

5. YASAL DAYANAK

• Kanuni yükümlülük
• Sözleşme gereklilik
• Meşru menfaat
• Açık rıza

6. HAKLARINIZ

KVKK md. 11 uyarınca haklarınız:
• Kişisel veri işlenip işlenmediğini öğrenme
• İşlenmişse bilgi talep etme
• Amaç ve kullanıma uygunluğunu öğrenme
• Yurt içi/dışı aktarım bilgisi
• Düzeltme ve silme talep etme
• İtiraz etme
• Zarar durumunda tazminat talep etme

7. BAŞVURU YÖNTEMİ

Haklarınızı kullanmak için:
kvkk@fanmanager2026.com

Başvurularınız 30 gün içinde yanıtlanır.
`;

export default function LegalDocumentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<LegalDocumentRouteProp>();
  
  const { documentId, title } = route.params;

  const getContent = () => {
    switch (documentId) {
      case 'terms':
        return TERMS_CONTENT;
      case 'privacy':
        return PRIVACY_CONTENT;
      case 'cookies':
        return COOKIES_CONTENT;
      case 'kvkk':
        return KVKK_CONTENT;
      default:
        return 'İçerik bulunamadı.';
    }
  };

  const content = getContent();
  const sections = content.trim().split('\n\n');

  return (
    <LinearGradient
      {...AUTH_GRADIENT} // Design System compliant
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentCard}>
            {sections.map((section, index) => {
              const isHeading = section.match(/^\d+\./);
              const isImportant = section.includes('GENEL') || 
                                 section.includes('VERİ SORUMLUSU') ||
                                 section.includes('HAKLARINIZ');
              
              return (
                <View
                  key={index}
                  style={[
                    styles.section,
                    isImportant && styles.sectionImportant,
                  ]}
                >
                  <Text
                    style={[
                      styles.text,
                      isHeading && styles.heading,
                    ]}
                  >
                    {section.trim()}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Accept Button */}
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.acceptButtonText}>Anladım</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footer}>
            © 2026 Fan Manager. Tüm hakları saklıdır.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: BRAND.emerald,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  headerSpacer: {
    width: 60,
  },
  
  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  contentCard: {
    backgroundColor: DARK_MODE.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  
  // Sections
  section: {
    marginBottom: 20,
  },
  sectionImportant: {
    borderLeftWidth: 4,
    borderLeftColor: BRAND.emerald,
    paddingLeft: 16,
    backgroundColor: 'rgba(5, 150, 105, 0.05)',
    paddingVertical: 12,
    borderRadius: 8,
  },
  
  // Text
  text: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  heading: {
    color: BRAND.gold,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  
  // Accept Button
  acceptButton: {
    backgroundColor: BRAND.emerald,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  acceptButtonText: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Footer
  footer: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
});
