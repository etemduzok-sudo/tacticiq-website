import { ScrollArea } from "./ui/scroll-area";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "./ui/drawer";

interface LegalDocumentsProps {
  open: boolean;
  onClose: () => void;
  documentType: "terms" | "privacy" | "kvkk" | "cookies" | "consent" | "sales" | null;
}

const documents = {
  terms: {
    title: "Kullanım Koşulları",
    content: `
# Kullanım Koşulları

Son Güncelleme: 31 Aralık 2025

## 1. Genel Hükümler

Fan Manager 2026 ("Uygulama") kullanarak aşağıdaki şartları kabul etmiş sayılırsınız.

### 1.1 Hizmet Kapsamı
- Uygulama, futbol maçları hakkında tahmin yapmanızı sağlar
- Tahminler sadece eğlence amaçlıdır
- Gerçek para kazancı veya bahis içermez

### 1.2 Kullanıcı Sorumlulukları
- 18 yaşından büyük olmalısınız
- Hesap bilgilerinizi güvenli tutmaktan siz sorumlusunuz
- Başkalarının hesaplarını kullanamaz veya paylaşamazsınız

## 2. Hesap Güvenliği

### 2.1 Şifre Güvenliği
- Güçlü bir şifre oluşturunuz
- Şifrenizi kimseyle paylaşmayınız
- Şüpheli aktivite durumunda hemen bildirin

### 2.2 Hesap Askıya Alma
Aşağıdaki durumlarda hesabınız askıya alınabilir:
- Hileli işlemler
- Spam veya taciz
- Kullanım koşullarını ihlal

## 3. İçerik ve Fikri Mülkiyet

### 3.1 Telif Hakları
- Tüm içerik Fan Manager 2026'ya aittir
- İzinsiz kopyalama yasaktır
- Logolar ve markalar ilgili sahiplerine aittir

### 3.2 Kullanıcı İçeriği
- Yüklediğiniz içerikten siz sorumlusunuz
- Uygunsuz içerik kaldırılır
- İçeriğinizi kullanmamıza izin verirsiniz

## 4. Gizlilik ve Veri Koruma

Kişisel verileriniz Gizlilik Politikası kapsamında korunur.

## 5. Sorumluluk Sınırlaması

### 5.1 Hizmet Kesintileri
- Geçici kesintiler olabilir
- Bakım çalışmaları önceden bildirilebilir
- Garanti verilmez

### 5.2 Tahminler
- Tahminler sadece eğlence amaçlıdır
- Sonuçlar garantilenmez
- Mali sorumluluk kabul edilmez

## 6. Değişiklikler

Bu koşullar herhangi bir zamanda değiştirilebilir. Değişiklikler uygulama içinde duyurulur.

## 7. İletişim

Sorularınız için: support@fanmanager2026.com

---

Bu koşulları kabul ederek Fan Manager 2026'yı kullanmayı kabul etmiş olursunuz.
    `,
  },
  privacy: {
    title: "Gizlilik Politikası",
    content: `
# Gizlilik Politikası

Son Güncelleme: 31 Aralık 2025

## 1. Toplanan Veriler

### 1.1 Kişisel Bilgiler
- İsim ve soyisim
- E-posta adresi
- Kullanıcı adı
- Profil fotoğrafı (isteğe bağlı)

### 1.2 Kullanım Verileri
- Tahmin geçmişi
- Uygulama kullanım istatistikleri
- Favori takımlar
- Başarılar ve rozetler

### 1.3 Teknik Veriler
- IP adresi
- Cihaz bilgileri
- Tarayıcı türü
- İşletim sistemi

## 2. Verilerin Kullanımı

### 2.1 Hizmet Sunumu
- Hesap oluşturma ve yönetme
- Tahmin sistemi
- İstatistik hesaplama
- Sıralama tabloları

### 2.2 İyileştirme
- Uygulama performansı
- Kullanıcı deneyimi
- Yeni özellikler geliştirme

### 2.3 İletişim
- Önemli duyurular
- Güvenlik bildirimleri
- Pazarlama (onay ile)

## 3. Veri Paylaşımı

### 3.1 Üçüncü Taraflar
Verileriniz aşağıdaki durumlarda paylaşılabilir:
- Yasal zorunluluklar
- Güvenlik tehditleri
- Hizmet sağlayıcılar (şifrelenmiş)

### 3.2 Paylaşılmayan Bilgiler
- E-posta adresiniz satılmaz
- Şifreniz hiçbir zaman paylaşılmaz
- Tahmin geçmişiniz gizlidir

## 4. Veri Güvenliği

### 4.1 Koruma Önlemleri
- SSL/TLS şifreleme
- Güvenli veri tabanları
- Düzenli güvenlik testleri
- İki faktörlü kimlik doğrulama

### 4.2 Veri Saklama
- Aktif hesaplar: Süresiz
- Silinmiş hesaplar: 30 gün içinde tamamen silinir
- Yedekler: 90 gün

## 5. Kullanıcı Hakları

### 5.1 GDPR Hakları
- Verilere erişim hakkı
- Düzeltme hakkı
- Silme hakkı ("unutulma hakkı")
- Veri taşınabilirliği
- İtiraz hakkı

### 5.2 Tercihler
- Bildirim ayarları
- Pazarlama onayı
- Veri paylaşımı tercihleri

## 6. Çerezler

Detaylı bilgi için Çerez Politikası'na bakınız.

## 7. Çocukların Gizliliği

18 yaş altı kullanıcılardan bilerek veri toplamayız.

## 8. Değişiklikler

Gizlilik politikası değişiklikleri e-posta ve uygulama içi bildirimle duyurulur.

## 9. İletişim

Gizlilik sorularınız için: privacy@fanmanager2026.com

---

Bu politika GDPR ve KVKK uyumludur.
    `,
  },
  kvkk: {
    title: "KVKK Aydınlatma Metni",
    content: `
# KVKK Aydınlatma Metni

6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca hazırlanmıştır.

## 1. Veri Sorumlusu

**Fan Manager 2026**
İletişim: kvkk@fanmanager2026.com

## 2. İşlenen Kişisel Veriler

### 2.1 Kimlik Bilgileri
- İsim, soyisim
- Doğum tarihi (isteğe bağlı)

### 2.2 İletişim Bilgileri
- E-posta adresi
- Telefon numarası (isteğe bağlı)

### 2.3 Müşteri İşlem Bilgileri
- Tahmin geçmişi
- Skor tahminleri
- Kadro oluşturma verileri

### 2.4 İşlem Güvenliği Bilgileri
- IP adresi
- Cihaz kimliği
- Çerez bilgileri

## 3. Kişisel Verilerin İşlenme Amaçları

- Hizmet sunumu
- Hesap yönetimi
- İstatistik ve analiz
- Güvenlik
- Yasal yükümlülükler

## 4. Kişisel Verilerin Aktarılması

### 4.1 Yurt İçi Aktarım
- Bulut hizmet sağlayıcıları
- Ödeme sistemleri (PRO üyelik için)
- Analiz platformları

### 4.2 Yurt Dışı Aktarım
GDPR uyumlu ülkelere aktarım yapılabilir.

## 5. Kişisel Veri Toplamanın Yöntemi

- Kayıt formu
- Sosyal medya girişi
- Uygulama kullanımı
- Çerezler

## 6. KVKK Hakları

### 6.1 Haklarınız
a) Kişisel verinizin işlenip işlenmediğini öğrenme
b) İşlenmişse bilgi talep etme
c) İşlenme amacını öğrenme
d) Yurt içi/dışı aktarım bilgisi
e) Düzeltme talep etme
f) Silme veya yok etme talep etme
g) Otomatik sistemlere itiraz
h) Zararın tazminini talep etme

### 6.2 Başvuru Yöntemi
E-posta: kvkk@fanmanager2026.com
Konu: "KVKK Başvurusu"
Yanıt süresi: 30 gün

## 7. Veri Saklama Süreleri

- Aktif hesap: Süresiz
- Pasif hesap (1 yıl): Bildirim sonrası silme
- Silinen hesap: 30 gün içinde imha
- Finansal kayıtlar: 10 yıl (yasal zorunluluk)

## 8. Güvenlik Tedbirleri

- Şifreleme (AES-256)
- Erişim kontrolleri
- Güvenlik duvarları
- Düzenli denetim

## 9. İletişim

KVKK ile ilgili sorularınız:
- E-posta: kvkk@fanmanager2026.com
- Web: www.fanmanager2026.com/kvkk

---

Bu metin KVKK m.10 uyarınca hazırlanmıştır.
    `,
  },
  cookies: {
    title: "Çerez Politikası",
    content: `
# Çerez Politikası

## 1. Çerez Nedir?

Çerezler, web sitelerinin cihazınızda sakladığı küçük metin dosyalarıdır.

## 2. Kullanılan Çerez Türleri

### 2.1 Zorunlu Çerezler
- Oturum yönetimi
- Güvenlik
- Kimlik doğrulama

Bu çerezler devre dışı bırakılamaz.

### 2.2 Performans Çerezleri
- Sayfa yükleme hızı
- Hata tespiti
- Trafik analizi

### 2.3 İşlevsellik Çerezleri
- Dil tercihi
- Tema (koyu/açık mod)
- Özelleştirilmiş içerik

### 2.4 Hedefleme/Reklam Çerezleri
- İlgi alanlarına göre içerik
- Pazarlama kampanyaları
- Sosyal medya entegrasyonu

## 3. Kullanılan Çerezler

| Çerez Adı | Tür | Süre | Amaç |
|-----------|-----|------|------|
| session_id | Zorunlu | Oturum | Kimlik doğrulama |
| theme | İşlevsellik | 1 yıl | Tema tercihi |
| lang | İşlevsellik | 1 yıl | Dil tercihi |
| analytics | Performans | 2 yıl | Kullanım analizi |
| marketing | Hedefleme | 1 yıl | Pazarlama |

## 4. Üçüncü Taraf Çerezleri

### 4.1 Google Analytics
- Ziyaretçi istatistikleri
- Sayfa görüntüleme
- Kullanıcı davranışı

### 4.2 Sosyal Medya
- Facebook Pixel
- Twitter Analytics
- LinkedIn Insight

## 5. Çerez Yönetimi

### 5.1 Tarayıcı Ayarları
Chrome:
Ayarlar > Gizlilik ve Güvenlik > Çerezler

Firefox:
Tercihler > Gizlilik ve Güvenlik

Safari:
Tercihler > Gizlilik

### 5.2 Uygulama İçi Ayarlar
Profil > Ayarlar > Gizlilik > Çerez Tercihleri

## 6. Çerez Reddi Sonuçları

Çerezleri reddederseniz:
- Bazı özellikler çalışmayabilir
- Tercihleriniz kaydedilmez
- Oturum açma zorlaşabilir

## 7. Değişiklikler

Çerez politikası güncellendiğinde bilgilendirileceksiniz.

## 8. İletişim

Çerez sorularınız için: cookies@fanmanager2026.com

---

Son Güncelleme: 31 Aralık 2025
    `,
  },
  consent: {
    title: "Açık Rıza Metni",
    content: `
# Açık Rıza Metni

KVKK m.5 uyarınca hazırlanmıştır.

## 1. Açık Rıza Beyanı

Fan Manager 2026 kullanıcısı olarak:

### 1.1 Genel Rıza
Kişisel verilerimin aşağıdaki amaçlarla işlenmesine açık rıza gösteriyorum:

✓ Hesap oluşturma ve yönetme
✓ Tahmin sistemi kullanımı
✓ İstatistik ve sıralama hesaplamaları
✓ Uygulama geliştirme ve iyileştirme
✓ Güvenlik ve dolandırıcılık önleme

### 1.2 İletişim Rızası
☐ E-posta bildirimleri almak istiyorum
☐ SMS bildirimleri almak istiyorum (opsiyonel)
☐ Push bildirimleri almak istiyorum

### 1.3 Pazarlama Rızası
☐ Promosyon ve kampanya bilgileri
☐ Yeni özellik duyuruları
☐ Özel teklifler

### 1.4 Veri Paylaşım Rızası
☐ Kullanıcı istatistiklerimin anonim olarak paylaşılması
☐ Başarılarımın liderlik tablosunda görünmesi
☐ Profil bilgilerimin diğer kullanıcılara görünmesi

## 2. Özel Nitelikli Veriler

Aşağıdaki özel nitelikli kişisel verilerimin işlenmesine açık rıza gösteriyorum:

☐ Biyometrik veriler (Yüz tanıma profil fotoğrafı için - opsiyonel)
☐ Konum verileri (Yakındaki maçlar için - opsiyonel)

## 3. Rızanın Kapsamı

### 3.1 İşleme Yöntemleri
- Elektronik ortamda
- Otomatik sistemlerle
- Manuel süreçlerle

### 3.2 Saklama Süreleri
- Aktif hesap: Süresiz
- Pasif hesap: 1 yıl sonra bildirim
- Silinen hesap: 30 gün içinde imha

## 4. Yurt Dışı Aktarım

Verilerimin GDPR uyumlu ülkelere aktarılmasına rıza gösteriyorum:
☐ AB ülkeleri
☐ Yeterli koruma sağlayan ülkeler

## 5. Rızanın Geri Alınması

### 5.1 Geri Alma Yöntemleri
- Uygulama içi: Profil > Ayarlar > Gizlilik
- E-posta: consent@fanmanager2026.com
- Web: www.fanmanager2026.com/consent

### 5.2 Geri Alma Sonuçları
Rızanızı geri aldığınızda:
- Hesabınız kapatılabilir
- Bazı hizmetlerden yararlanamazsınız
- Verileriniz silinir (yasal zorunluluklar hariç)

## 6. Haklar

KVKK m.11 kapsamında haklarınız:
- Bilgi talep etme
- Düzeltme talep etme
- Silme talep etme
- İtiraz etme
- Veri taşınabilirliği

## 7. İletişim

Rıza ile ilgili sorularınız:
- E-posta: consent@fanmanager2026.com
- Telefon: +90 xxx xxx xx xx
- Adres: [Adres bilgisi]

## 8. Onay

☐ KVKK Aydınlatma Metnini okudum ve anladım
☐ Açık Rıza Metni kapsamını kabul ediyorum
☐ Verilerimin işlenmesine gönüllü olarak rıza gösteriyorum

---

Tarih: ___/___/______
İmza: _________________

Bu rıza metni elektronik ortamda kabul edilmiştir.
    `,
  },
  sales: {
    title: "Mesafeli Satış Sözleşmesi",
    content: `
# Mesafeli Satış Sözleşmesi

6502 sayılı Tüketicinin Korunması Hakkında Kanun uyarınca düzenlenmiştir.

## 1. Taraflar

### 1.1 SATICI
**Ünvanı:** Fan Manager 2026 Ltd. Şti.
**Adres:** [Adres]
**Telefon:** +90 xxx xxx xx xx
**E-posta:** sales@fanmanager2026.com
**Mersis No:** [Numara]

### 1.2 ALICI
Uygulama içinde kayıtlı bilgiler geçerlidir.

## 2. Sözleşme Konusu

Bu sözleşme, ALICI'nın SATICI'dan satın aldığı dijital hizmetlerin (PRO üyelik) satışı ve teslimi ile ilgili tarafların hak ve yükümlülüklerini düzenler.

## 3. Hizmet Bilgileri

### 3.1 PRO Üyelik
**Hizmet Adı:** Fan Manager 2026 PRO
**Açıklama:** Premium üyelik paketi
**Süre:** 
- Aylık: 1 ay
- Yıllık: 12 ay
**Fiyat:** 
- Aylık: 49,90 TL
- Yıllık: 499,90 TL (2 ay bedava)

### 3.2 Özellikler
- 3 kulüp takibi
- Gelişmiş istatistikler
- Özel rozetler
- Öncelikli destek
- Reklamsız deneyim

## 4. Ödeme ve Teslimat

### 4.1 Ödeme Yöntemleri
- Kredi kartı
- Banka kartı
- Dijital cüzdanlar (Apple Pay, Google Pay)

### 4.2 Teslimat
Ödeme onayı sonrası anında aktif edilir.

### 4.3 Fiyatlar
Tüm fiyatlar KDV dahildir.

## 5. Cayma Hakkı

### 5.1 Cayma Süresi
14 gün içinde cayma hakkınız vardır.

### 5.2 Cayma Hakkı İstisnası
Dijital içerik teslimatı başladığında cayma hakkı sona erer.

### 5.3 Cayma Bildirimi
E-posta: support@fanmanager2026.com
Form: www.fanmanager2026.com/cayma

## 6. İade ve İptal

### 6.1 İade Koşulları
- Hizmet kullanılmamışsa
- 14 gün içinde
- Geçerli sebep

### 6.2 İade Süreci
1. İade talebi
2. Onay (3 iş günü)
3. İade (14 iş günü)

### 6.3 İptal
Abonelik her zaman iptal edilebilir.
İptal sonrası: Dönem sonuna kadar aktif kalır.

## 7. Otomatik Yenileme

### 7.1 Abonelik Yenileme
PRO üyelik otomatik yenilenir.

### 7.2 Yenileme İptali
Profil > Ayarlar > Abonelik > İptal

### 7.3 Bildirim
Yenileme 3 gün önceden bildirilir.

## 8. Sorumluluk

### 8.1 SATICI Sorumlulukları
- Hizmet kesintisiz sunumu
- Veri güvenliği
- Müşteri desteği

### 8.2 ALICI Sorumlulukları
- Doğru bilgi verme
- Ödeme yapma
- Kullanım koşullarına uyma

## 9. Uyuşmazlık Çözümü

### 9.1 Şikayet ve İtiraz
**Tüketici Hakem Heyeti:**
- 2024 yılı için: 35.260 TL'ye kadar
**Tüketici Mahkemeleri:**
- Parasal limitin üstü

### 9.2 Tahkim
İstanbul Tüketici Hakem Heyeti yetkilidir.

## 10. Yürürlük

Bu sözleşme ALICI tarafından elektronik ortamda onaylandığı tarihte yürürlüğe girer.

## 11. Ekleri

- Ön Bilgilendirme Formu
- Fatura
- Teslimat Bilgisi

---

**ALICI Onayı:**
☐ Mesafeli Satış Sözleşmesini okudum ve kabul ediyorum
☐ Ön Bilgilendirme Formunu aldım
☐ Cayma hakkı şartlarını öğrendim

Tarih: 31 Aralık 2025
Platform: Fan Manager 2026 Mobil Uygulama

---

İletişim: sales@fanmanager2026.com
    `,
  },
};

export function LegalDocuments({ open, onClose, documentType }: LegalDocumentsProps) {
  if (!documentType) return null;

  const document = documents[documentType];

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>{document.title}</DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="p-6 h-[70vh]">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
              {document.content}
            </div>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
