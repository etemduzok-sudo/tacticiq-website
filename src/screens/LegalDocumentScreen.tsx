import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from '../hooks/useTranslation';

interface LegalDocumentScreenProps {
  documentType: string;
  onBack: () => void;
}

// Legal content data - Updated according to comprehensive legal documentation
const LEGAL_CONTENT: Record<string, { title: string; content: string }> = {
  terms: {
    title: 'Kullanım Koşulları (EULA)',
    content: `Son Güncelleme: 1 Ocak 2026

1. GİRİŞ VE KABUL
İşbu Kullanım Koşulları ("Koşullar"), TacticIQ ("Şirket") ile sizin ("Kullanıcı") arasında, TacticIQ mobil uygulaması ("Hizmet") kullanımıyla ilgili yasal bir sözleşmedir. Oyunu indirerek, kurarak veya kullanarak bu koşulları kabul etmiş sayılırsınız.

2. SANAL ÖĞELER VE PARA BİRİMİ
Hizmet, "Altın", "Elmas" veya diğer sanal varlıkları ("Sanal Öğeler") içerebilir.

Mülkiyet Yoktur: Sanal Öğeler üzerindeki hiçbir mülkiyet hakkına sahip değilsiniz. Şirket, size yalnızca bu öğeleri oyun içinde kullanmanız için sınırlı, geri alınabilir, devredilemez bir lisans verir.

Nakit Değeri Yoktur: Sanal Öğeler gerçek paraya çevrilemez, iade edilemez veya Şirket dışında satılamaz.

Loot Box (Ganimet Kutusu) Şeffaflığı: Oyun içindeki şans bazlı kutuların (Loot Boxes) içerik düşme oranları (Drop Rates), satın alma ekranında erişilebilir durumdadır. Belçika ve Hollanda kullanıcıları için loot box satın alma özelliği yasaklanmıştır.

3. FİKRİ MÜLKİYET VE TELİF HAKKI
Hizmetin tüm hakları, unvanı ve menfaatleri (kodlar, grafikler, sesler, karakterler) Şirket'e aittir.

Kullanıcı İçeriği (UGC): Oyuna yüklediğiniz veya oluşturduğunuz içeriklerin telif hakkı ihlali içermediğini beyan edersiniz. Şirket, DMCA kapsamında telif hakkı ihlali bildirimi aldığında içeriği kaldırma hakkını saklı tutar.

Tersine Mühendislik: Oyunun kaynak kodunu çözmek, kopyalamak veya "modlu" (hileli) versiyonlarını dağıtmak kesinlikle yasaktır ve yasal işlem sebebidir.

4. CAYMA HAKKI - BÖLGESEL KURALLAR

Avrupa Birliği ve Fransa Kullanıcıları İçin:
Dijital içerik (sanal öğeler) satın aldığınızda, içeriğin ifasının (teslimatının) hemen başladığını kabul edersiniz. Bu nedenle, satın alma işlemi tamamlandığında 14 günlük cayma hakkınızdan feragat ettiğinizi açıkça beyan edersiniz.

Türkiye Kullanıcıları İçin:
Mesafeli Sözleşmeler Yönetmeliği Madde 15/ğ uyarınca, elektronik ortamda anında ifa edilen hizmetler ve tüketiciye anında teslim edilen gayrimaddi mallar (sanal para/öğe) cayma hakkı kapsamı dışındadır. İade yapılmaz.

Güney Kore Kullanıcıları İçin:
Kullanıcı sanal parayı satın aldı ancak hiç harcamadıysa, 7 gün içinde koşulsuz iade hakkı vardır.

5. HESAP KAPATMA (TERMINATION)
Şirket, hile yapılması (cheating), bot kullanımı, nefret söylemi veya bu Koşulların ihlali durumunda hesabınızı önceden bildirimde bulunmaksızın kapatma hakkını saklı tutar. Kapatılan hesaplardaki Sanal Öğeler için iade yapılmaz.

6. SINIRLAMALAR VE SORUMLULUK REDDİ
Hizmetlerimiz "olduğu gibi" sunulmaktadır. Kesintisiz erişim garantisi verilmemektedir. Şirket, uygulamadan kaynaklanan dolaylı, arızi, özel veya sonuç zararlarından sorumlu tutulamaz.

7. DEĞİŞİKLİKLER
Bu koşullar bildirimde bulunmaksızın güncellenebilir. Güncel versiyon her zaman uygulama içinde erişilebilir durumdadır.

8. İLETİŞİM
Sorularınız için: legal@tacticiq.app
Destek: support@tacticiq.app`,
  },
  privacy: {
    title: 'Küresel Gizlilik Politikası',
    content: `Son Güncelleme: 1 Ocak 2026

1. VERİ TOPLAMA VE KULLANIM
Cihaz kimliği (Device ID), IP adresi, genel konum verisi ve oyun içi aktivitelerinizi; oyunu geliştirmek, hileleri önlemek ve (onayınız varsa) size özel reklamlar sunmak için işliyoruz.

2. BÖLGESEL GİZLİLİK HAKLARI

A. TÜRKİYE (KVKK - Kişisel Verilerin Korunması Kanunu)
Türkiye Cumhuriyeti sınırları içindeki kullanıcılar için:

Veri Sorumlusu: TacticIQ
Adres: [Şirket Adresi]
E-posta: kvkk@tacticiq.app

Açık Rıza (Explicit Consent): Pazarlama ve yurt dışına veri aktarımı faaliyetleri için "Açık Rıza Metni"ni oyunun açılışında ayrıca onaylamanız gerekmektedir. KVKK 5. ve 9. maddeleri uyarınca verileriniz işlenmektedir.

Başvuru Hakları: KVKK Madde 11 kapsamındaki haklarınızı kullanmak için kvkk@tacticiq.app adresine başvurabilirsiniz.

İYS (İleti Yönetim Sistemi): Size gönderilen ticari elektronik iletileri (Push Bildirim, SMS) İYS üzerinden yönetebilirsiniz.

B. AVRUPA (GDPR) & FRANSA
Veri İşleme Temeli: Oyunun çalışması için gerekli veriler "Sözleşmenin İfası" (Art 6.1.b), analitik veriler "Meşru Menfaat" (Art 6.1.f) ve reklamlar "Açık Rıza" (Art 6.1.a) temelinde işlenir.

Haklarınız: Verilerinizi silme (Unutulma Hakkı), taşıma ve işlemeyi kısıtlama hakkına sahipsiniz.

C. ABD (CCPA/CPRA & COPPA)
Çocuklar (COPPA): 13 yaşından küçükseniz, ebeveyninizin doğrulanmış izni olmadan kişisel verilerinizi toplamayız. Oyunumuzda yaş doğrulama (Age Gate) sistemi mevcuttur.

Veri Satışı (Do Not Sell): Kaliforniya sakinleri, "Kişisel Bilgilerimi Satma veya Paylaşma" (Do Not Sell or Share My Personal Information) hakkına sahiptir. Bu hakkı Ayarlar menüsünden kullanabilirsiniz.

D. ÇİN (PIPL)
Çinli kullanıcıların verileri, Çin anakarasındaki sunucularda saklanır ve sınır dışına çıkarılmaz. Gerçek İsim Doğrulama (Real Name Verification) sistemi zorunludur.

E. BREZİLYA (LGPD) ve NİJERYA (NDPA)
Brezilya ve Nijerya kullanıcıları için atanmış Veri Koruma Görevlisi (DPO) İletişim: dpo@tacticiq.app

3. ULUSLARARASI VERİ AKTARIMI
Küresel ölçekte hizmet verebilmemiz için verileriniz yurt dışındaki sunuculara aktarılabilir. Avrupa Ekonomik Alanı (EEA) dışına aktarım için Standart Sözleşme Maddeleri (SCC) kullanılmaktadır. Türkiye kullanıcıları için açık rıza gereklidir.

4. ÇOCUK GİZLİLİĞİ
Hizmetimiz çocukların kullanımına izin verir ancak katı koşullar altında. Eğer bir ebeveynseniz ve çocuğunuzun verilerinin doğrulanmadan toplandığına inanıyorsanız, lütfen bizimle iletişime geçin.

5. ÇEREZLER VE İZLEME
Uygulama deneyimini iyileştirmek için çerezler ve benzeri teknolojiler kullanılmaktadır. Çerez tercihlerinizi Ayarlar menüsünden yönetebilirsiniz.

6. GÜVENLİK
Verileriniz endüstri standardı güvenlik protokolleri (SSL/TLS şifreleme) ile korunmaktadır.

7. İLETİŞİM
Gizlilik ile ilgili sorularınız için: privacy@tacticiq.app`,
  },
  cookies: {
    title: 'Çerez Politikası',
    content: `Son Güncelleme: 1 Ocak 2026

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

e) Pazarlama Çerezleri
• Kişiselleştirilmiş reklamlar
• Reklam performans ölçümü
• Çapraz site takibi

3. ÇEREZ YÖNETİMİ
Tarayıcı ayarlarınızdan veya uygulama içi Ayarlar menüsünden çerezleri yönetebilirsiniz. Ancak bazı çerezleri devre dışı bırakmak site işlevselliğini etkileyebilir.

4. ÜÇÜNCÜ TARAF ÇEREZLERİ
Google Analytics, Facebook Pixel gibi hizmetler kendi çerezlerini kullanabilir. Bu çerezlerin kullanımı için ilgili hizmetlerin gizlilik politikalarına bakınız.

5. İLETİŞİM
Çerezler ile ilgili sorularınız için: cookies@tacticiq.app`,
  },
  kvkk: {
    title: 'KVKK Aydınlatma Metni',
    content: `6698 Sayılı Kişisel Verilerin Korunması Kanunu Uyarınca Aydınlatma Metni

Son Güncelleme: 1 Ocak 2026

1. VERİ SORUMLUSU
Veri Sorumlusu: TacticIQ
Adres: [Şirket Adresi]
E-posta: kvkk@tacticiq.app

6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca; oyun deneyiminizi sağlamak, hesap güvenliğinizi temin etmek ve hizmetlerimizi geliştirmek amacıyla kişisel verilerinizi işlemekteyiz.

2. İŞLENEN KİŞİSEL VERİLERİNİZ

Kimlik ve İletişim Bilgileri: Kullanıcı adı (Nickname), e-posta adresi (hesap bağlamanız halinde), sosyal medya ID'si.

İşlem Güvenliği Bilgileri: IP adresi, cihaz kimliği (Device ID), giriş-çıkış logları.

Oyun İçi Veriler: Seviye bilgisi, envanter, satın alma geçmişi, tahmin geçmişi, puanlar.

3. VERİ İŞLEME AMAÇLARI VE HUKUKİ SEBEPLER
Verileriniz, KVKK m. 5/2-c bendi uyarınca "Sözleşmenin kurulması ve ifası" (oyunun oynatılması) ve m. 5/2-f bendi uyarınca "Veri sorumlusunun meşru menfaati" (hile tespiti, güvenlik) hukuki sebeplerine dayalı olarak işlenmektedir.

4. YURT DIŞINA AKTARIM
Oyun sunucularımızın küresel ölçekte hizmet verebilmesi adına konumlu veri merkezlerinde barındırılması sebebiyle, kişisel verileriniz KVKK m. 9/1 uyarınca AÇIK RIZANIZA istinaden yurt dışına aktarılmaktadır. (Rıza vermemeniz halinde oyun hizmeti sunulamayabilir).

5. VERİLERİN AKTARILDIĞI TARAFLAR
Verileriniz yalnızca:
• Yasal yükümlülük durumunda yasal mercilere
• Hizmet sağlayıcılarına (sunucu, analitik, ödeme işlemcileri)
• Sizin açık rızanızla pazarlama ortaklarına
aktarılır.

6. HAKLARINIZ (KVKK Madde 11)
• Kişisel verilerinizin işlenip işlenmediğini öğrenme
• İşlenmişse buna ilişkin bilgi talep etme
• İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme
• Yurt içi/yurt dışı aktarıldığı 3. kişileri öğrenme
• Eksik/yanlış işlenmişse düzeltilmesini isteme
• Silinmesini veya yok edilmesini isteme
• Düzeltme, silme, yok etme işlemlerinin aktarıldığı 3. kişilere bildirilmesini isteme
• Münhasıran otomatik sistemler ile analiz edilmesine itiraz etme
• Kanuna aykırı işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme

7. BAŞVURU YOLLARI
KVKK kapsamındaki haklarınızı kullanmak için:
E-posta: kvkk@tacticiq.app
Posta: [Posta Adresi]

Ayrıca Kişisel Verileri Koruma Kurulu'na şikayette bulunabilirsiniz.`,
  },
  consent: {
    title: 'KVKK Açık Rıza Beyanı',
    content: `AÇIK RIZA METNİ

6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, TacticIQ tarafından:

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
• Yurt dışına veri aktarımı (sunucu altyapısı için)

AKTARIM:
Verilerimin yalnızca hizmet kalitesinin artırılması, yasal yükümlülüklerin yerine getirilmesi ve yukarıda belirtilen amaçlarla sınırlı olmak üzere iş ortaklarına, hizmet sağlayıcılarına ve yasal mercilere aktarılabileceğini kabul ediyorum.

HAKLARIM:
Bu rızamı her zaman geri çekebileceğimi, KVKK m.11 kapsamındaki haklarımı kullanabileceğimi biliyorum. Rızamı geri çekmem durumunda bazı hizmetlerden faydalanamayabileceğimi kabul ediyorum.

Rıza Tarihi: [Kayıt Tarihi]
Kullanıcı: [Kullanıcı Adı]

İletişim: consent@tacticiq.app`,
  },
  sales: {
    title: 'Mesafeli Satış Sözleşmesi',
    content: `MESAFELİ SATIŞ SÖZLEŞMESİ

6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği Uyarınca

Son Güncelleme: 1 Ocak 2026

1. TARAFLAR

SATICI:
Ünvan: TacticIQ
Adres: [Şirket Adresi]
E-posta: sales@tacticiq.app
Telefon: [Telefon]
Mersis No: [Varsa Mersis No]

ALICI:
Sözleşmeyi onaylayan kullanıcı

2. SÖZLEŞME KONUSU
İşbu sözleşme, alıcının satıcıdan elektronik ortamda sipariş verdiği aşağıda nitelikleri belirtilen dijital içerik/premium üyelik hizmetinin satış ve teslim şartlarını düzenler.

3. ÜRÜN/HİZMET BİLGİLERİ
• Premium Üyelik Paketi (Aylık/Yıllık)
• Pro Özellikler Erişimi
• Reklamsız Deneyim
• Özel İstatistikler ve Analizler
• Öncelikli Destek

4. ÖDEME BİLGİLERİ
Toplam ücret uygulama içinde gösterilir ve ödeme anında onaylanır. Ödeme, App Store veya Google Play üzerinden gerçekleştirilir.

5. CAYMA HAKKI
Dijital içerik teslimatı başladığı için cayma hakkı bulunmamaktadır (TKHK m.15/1-ğ). Ancak, Güney Kore kullanıcıları için harcanmamış sanal para bakiyesi 7 gün içinde iade edilebilir.

6. SORUMLULUKLAR
• Satıcı hizmeti kesintisiz sunmayı taahhüt eder
• Alıcı hesap güvenliğinden sorumludur
• Satıcı, teknik sorunlar nedeniyle hizmet kesintilerinden sorumlu tutulamaz

7. UYUŞMAZLIKLARIN ÇÖZÜMÜ
İşbu sözleşmeden doğan uyuşmazlıklarda Türkiye Cumhuriyeti yasaları uygulanır. Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.

8. YÜRÜRLÜK
Alıcı, ödemeyi tamamladığında bu sözleşmeyi kabul etmiş sayılır.

Tarih: [Satın Alma Tarihi]

İletişim: sales@tacticiq.app
Destek: support@tacticiq.app`,
  },
  copyright: {
    title: 'Telif Hakkı Bildirimi',
    content: `TELİF HAKKI BİLDİRİMİ

Copyright © 2026 TacticIQ. Tüm Hakları Saklıdır / All Rights Reserved.

TacticIQ is a trademark of TacticIQ.

Bu uygulama ve içeriği (kodlar, grafikler, sesler, karakterler, tasarımlar) telif hakkı yasaları ile korunmaktadır. İzinsiz kopyalama, dağıtma veya kullanım yasaktır.

DMCA BİLDİRİMİ:
Fikri mülkiyet haklarınıza saygı duyuyoruz. Eğer bu uygulamada telif hakkınızı ihlal eden bir içerik olduğuna inanıyorsanız, lütfen aşağıdaki bilgilerle bizimle iletişime geçin:

• İhlal edildiğini düşündüğünüz içeriğin tanımı
• Telif hakkı sahibinin bilgileri
• İletişim bilgileriniz
• İyi niyet beyanı

İletişim: legal@tacticiq.app

Tersine mühendislik, kod çözme veya uygulamanın modlu/hileli versiyonlarını oluşturma kesinlikle yasaktır ve yasal işlem sebebidir.`,
  },
  china: {
    title: 'Sağlıklı Oyun Tavsiyesi (Çin)',
    content: `健康游戏忠告

抵制不良游戏，拒绝盗版游戏。
注意自我保护，谨防受骗上当。
适度游戏益脑，沉迷游戏伤身。
合理安排时间，享受健康生活。

---

SAĞLIKSIZ OYUNLARI BOYKOT ET, KORSANI REDDET.
KENDİNİ KORU, DOLANDIRICILARA DİKKAT ET.
ÖLÇÜLÜ OYUN ZEKAYI GELİŞTİRİR, AŞIRI BAĞIMLILIK VÜCUDA ZARAR VERİR.
ZAMANINI AKILLICA YÖNET, SAĞLIKLI BİR YAŞAM SÜR.

---

Bu mesaj, Çin Halk Cumhuriyeti Devlet Basın ve Yayın İdaresi (NPPA) gereklilikleri uyarınca gösterilmektedir.

18 yaş altı kullanıcılar için oyun süresi kısıtlamaları geçerlidir:
• Sadece Cuma, Cumartesi, Pazar ve resmi tatillerde
• 20:00 - 21:00 saatleri arasında
• Maksimum 1 saat oyun süresi

Harcama limitleri:
• 8-16 yaş: Tek seferde 50 RMB, aylık 200 RMB
• 16-18 yaş: Tek seferde 100 RMB, aylık 400 RMB`,
  },
};

export const LegalDocumentScreen: React.FC<LegalDocumentScreenProps> = ({
  documentType,
  onBack,
}) => {
  const { t } = useTranslation();
  const doc = LEGAL_CONTENT[documentType];

  if (!doc) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Grid Pattern Background */}
        <View style={styles.gridPattern} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#059669" />
            <Text style={styles.backText}>{t('common.back') || 'Geri'}</Text>
          </TouchableOpacity>
        </View>

        {/* Document Container */}
        <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(0)} style={styles.documentContainer}>
          {/* Document Header */}
          <View style={styles.documentHeader}>
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
              <Image
                source={require('../../assets/logo.png')}
                style={styles.footerLogo}
                resizeMode="contain"
              />
            </View>

            <TouchableOpacity onPress={onBack} activeOpacity={0.8}>
              <LinearGradient
                colors={['#059669', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>{t('common.close') || 'Kapat'}</Text>
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
    position: 'relative',
  },
  gridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
    zIndex: 0,
    ...Platform.select({
      web: {
        backgroundImage: `
          linear-gradient(to right, rgba(31, 162, 166, 0.15) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(31, 162, 166, 0.15) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
      },
      default: {
        backgroundColor: 'transparent',
      },
    }),
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
    zIndex: 1,
  },

  // Document Header
  documentHeader: {
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
  footerLogo: {
    width: 24,
    height: 24,
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
