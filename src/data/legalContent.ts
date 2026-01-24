/**
 * Legal Content for TacticIQ Mobile App
 * Web sitesi ile uyumlu yasal metinler
 * Tüm bölgeler için (GDPR, KVKK, CCPA)
 * Admin'den eklenen içerikler API'den çekilir
 */

import { legalDocumentsApi, LegalDocument as ApiLegalDocument } from '../services/api';

export interface LegalDocument {
  id: string;
  icon: string;
  titleKey: string;
  descriptionKey: string;
}

// Türkçe başlıklar ve açıklamalar - doğrudan kullanılacak
export const LEGAL_DOCUMENT_TITLES: Record<string, { title: string; description: string }> = {
  terms: { title: 'Kullanım Koşulları', description: 'Hizmet kullanım şartları' },
  privacy: { title: 'Gizlilik Politikası', description: 'Veri gizliliği bilgileri' },
  cookies: { title: 'Çerez Politikası', description: 'Çerez kullanımı hakkında' },
  kvkk: { title: 'KVKK Aydınlatma', description: 'Kişisel veri koruma' },
  consent: { title: 'Açık Rıza Metni', description: 'Veri işleme onayı' },
  sales: { title: 'Mesafeli Satış', description: 'Satış sözleşmesi' },
  copyright: { title: 'Telif Hakları', description: 'DMCA ve telif bilgisi' },
};

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: 'terms',
    icon: '📋',
    titleKey: 'Kullanım Koşulları',
    descriptionKey: 'Hizmet kullanım şartları',
  },
  {
    id: 'privacy',
    icon: '🔒',
    titleKey: 'Gizlilik Politikası',
    descriptionKey: 'Veri gizliliği bilgileri',
  },
  {
    id: 'cookies',
    icon: '🍪',
    titleKey: 'Çerez Politikası',
    descriptionKey: 'Çerez kullanımı hakkında',
  },
  {
    id: 'kvkk',
    icon: '⚖️',
    titleKey: 'KVKK Aydınlatma',
    descriptionKey: 'Kişisel veri koruma',
  },
  {
    id: 'consent',
    icon: '✅',
    titleKey: 'Açık Rıza Metni',
    descriptionKey: 'Veri işleme onayı',
  },
  {
    id: 'sales',
    icon: '💳',
    titleKey: 'Mesafeli Satış',
    descriptionKey: 'Satış sözleşmesi',
  },
  {
    id: 'copyright',
    icon: '©️',
    titleKey: 'Telif Hakları',
    descriptionKey: 'DMCA ve telif bilgisi',
  },
];

// Cache for admin legal documents
let adminDocumentsCache: Record<string, Record<string, { title: string; content: string }>> = {};
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

/**
 * Yasal metinlerin tam içeriği
 * Öncelik sırası:
 * 1. Admin'den eklenen içerikler (API'den)
 * 2. Çeviri dosyaları
 * 3. Fallback içerik
 */
export const getLegalContent = async (
  documentId: string, 
  t: (key: string) => string,
  language: string = 'tr'
): Promise<{ title: string; content: string } | null> => {
  // Check cache first
  const now = Date.now();
  if (now - cacheTimestamp > CACHE_DURATION) {
    adminDocumentsCache = {};
  }

  // Try to get from admin documents (API)
  try {
    if (!adminDocumentsCache[language] || !adminDocumentsCache[language][documentId]) {
      const adminDocs = await legalDocumentsApi.getAll(language);
      if (!adminDocumentsCache[language]) {
        adminDocumentsCache[language] = {};
      }
      adminDocs.forEach(doc => {
        if (doc.enabled && doc.document_id === documentId) {
          adminDocumentsCache[language][documentId] = {
            title: doc.title,
            content: doc.content,
          };
        }
      });
      cacheTimestamp = now;
    }

    if (adminDocumentsCache[language][documentId]) {
      return adminDocumentsCache[language][documentId];
    }
  } catch (error) {
    console.warn('Failed to load admin legal documents, using fallback', error);
  }

  // Try translations
  const contentKey = `legal.${documentId}.fullContent`;
  const titleKey = `legal.${documentId}.title`;
  
  const content = t(contentKey);
  const title = t(titleKey);
  
  // Check if translation exists (not just the key)
  if (content !== contentKey && title !== titleKey && content && title) {
    return {
      title,
      content,
    };
  }
  
  // Fallback to static content
  return FALLBACK_LEGAL_CONTENT[documentId] || null;
};

/**
 * Synchronous version for backward compatibility
 * Uses cached data if available, otherwise returns fallback
 */
export const getLegalContentSync = (documentId: string, t: (key: string) => string, language: string = 'tr'): { title: string; content: string } | null => {
  // Check cache first
  if (adminDocumentsCache[language] && adminDocumentsCache[language][documentId]) {
    return adminDocumentsCache[language][documentId];
  }

  // Try translations
  const contentKey = `legal.${documentId}.fullContent`;
  const titleKey = `legal.${documentId}.title`;
  
  const content = t(contentKey);
  const title = t(titleKey);
  
  if (content !== contentKey && title !== titleKey && content && title) {
    return {
      title,
      content,
    };
  }
  
  // Fallback
  return FALLBACK_LEGAL_CONTENT[documentId] || null;
};

/**
 * Fallback legal content (web sitesinden)
 */
const FALLBACK_LEGAL_CONTENT: Record<string, { title: string; content: string }> = {
  terms: {
    title: 'Kullanım Koşulları (EULA)',
    content: `Son Güncelleme: 1 Ocak 2026

1. GİRİŞ VE KABUL
İşbu Kullanım Koşulları ("Koşullar"), TacticIQ ("Şirket") ile sizin ("Kullanıcı") arasında, TacticIQ web platformu ve mobil uygulaması ("Hizmet") kullanımıyla ilgili yasal bir sözleşmedir. Platformu kullanarak bu koşulları kabul etmiş sayılırsınız.

2. SANAL ÖĞELER VE PARA BİRİMİ
Hizmet, "Puan", "XP" veya diğer sanal varlıkları ("Sanal Öğeler") içerebilir.

Mülkiyet Yoktur: Sanal Öğeler üzerindeki hiçbir mülkiyet hakkına sahip değilsiniz. Şirket, size yalnızca bu öğeleri platform içinde kullanmanız için sınırlı, geri alınabilir, devredilemez bir lisans verir.

Nakit Değeri Yoktur: Sanal Öğeler gerçek paraya çevrilemez, iade edilemez veya Şirket dışında satılamaz.

3. FİKRİ MÜLKİYET VE TELİF HAKKI
Hizmetin tüm hakları, unvanı ve menfaatleri (kodlar, grafikler, sesler, karakterler) Şirket'e aittir.

4. CAYMA HAKKI
Dijital içerik teslimatı başladığı için cayma hakkı bulunmamaktadır (TKHK m.15/1-ğ).

5. HESAP KAPATMA
Şirket, hile yapılması, bot kullanımı, nefret söylemi veya bu Koşulların ihlali durumunda hesabınızı önceden bildirimde bulunmaksızın kapatma hakkını saklı tutar.

6. İLETİŞİM
Sorularınız için: legal@tacticiq.app
Destek: support@tacticiq.app`,
  },
  privacy: {
    title: 'Küresel Gizlilik Politikası',
    content: `Son Güncelleme: 1 Ocak 2026

1. VERİ TOPLAMA VE KULLANIM
Cihaz kimliği, IP adresi, genel konum verisi ve platform içi aktivitelerinizi; platformu geliştirmek, hileleri önlemek ve (onayınız varsa) size özel reklamlar sunmak için işliyoruz.

2. BÖLGESEL GİZLİLİK HAKLARI

A. TÜRKİYE (KVKK)
Veri Sorumlusu: TacticIQ
E-posta: kvkk@tacticiq.app

Açık Rıza: Pazarlama ve yurt dışına veri aktarımı için ayrıca onayınız gerekmektedir.
Başvuru Hakları: KVKK m.11 kapsamındaki haklarınızı kvkk@tacticiq.app adresine başvurarak kullanabilirsiniz.

B. AVRUPA (GDPR)
Veri İşleme Temeli: Gerekli veriler "Sözleşmenin İfası", analitik veriler "Meşru Menfaat" ve reklamlar "Açık Rıza" temelinde işlenir.
Haklarınız: Verilerinizi silme, taşıma ve işlemeyi kısıtlama hakkına sahipsiniz.

C. ABD (CCPA/COPPA)
Çocuklar (COPPA): 13 yaşından küçükseniz, ebeveyninizin doğrulanmış izni olmadan kişisel verilerinizi toplamayız.
Veri Satışı: Kaliforniya sakinleri, kişisel bilgilerinin satılmamasını talep edebilir.

3. ULUSLARARASI VERİ AKTARIMI
Verileriniz küresel sunucularda saklanabilir. Türkiye kullanıcıları için açık rıza gereklidir.

4. İLETİŞİM
Sorularınız için: privacy@tacticiq.app`,
  },
  cookies: {
    title: 'Çerez Politikası',
    content: `Son Güncelleme: 1 Ocak 2026

1. ÇEREZ KULLANIMI
Platformumuz, deneyiminizi geliştirmek için çerezler kullanmaktadır.

2. ÇEREZ TÜRLERİ

a) Zorunlu Çerezler
• Oturum yönetimi
• Güvenlik
• Temel işlevsellik

b) İşlevsel Çerezler
• Dil tercihleri
• Tema seçimleri
• Kullanıcı ayarları

c) Analitik Çerezler
• Kullanıcı davranış analizi
• Platform optimizasyonu

d) Pazarlama Çerezleri
• Kişiselleştirilmiş reklamlar
• Kampanya bildirimleri

3. ÇEREZ YÖNETİMİ
Ayarlar menüsünden çerez tercihlerinizi yönetebilirsiniz.

4. İLETİŞİM
Sorularınız için: cookies@tacticiq.app`,
  },
  kvkk: {
    title: 'KVKK Aydınlatma Metni',
    content: `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında:

VERİ SORUMLUSU: TacticIQ
E-posta: kvkk@tacticiq.app

İŞLENEN VERİLER:
- Kimlik Bilgileri (Ad, Soyad, E-posta)
- İletişim Bilgileri
- Platform İçi Aktivite Verileri
- Cihaz ve IP Bilgileri

İŞLENME AMAÇLARI:
- Üyelik ve hizmet sunumu (KVKK m.5/2-c)
- Kullanıcı deneyimi iyileştirme (KVKK m.5/2-f)
- Güvenlik ve dolandırıcılık önleme (KVKK m.5/2-f)

YURT DIŞINA AKTARIM:
KVKK m.9/1 uyarınca AÇIK RIZANIZA istinaden verileriniz yurt dışına aktarılabilir.

HAKLARINIZ (KVKK m.11):
- Verilerinizin işlenip işlenmediğini öğrenme
- İşlenmişse bilgi talep etme
- İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme
- Yurt içinde/dışında aktarıldığı 3. kişileri bilme
- Eksik/yanlış işlenmişse düzeltilmesini isteme
- İşlenmesini gerektiren sebeplerin ortadan kalkması halinde silme
- Bu haklarınızın kullanılmasından kaynaklanan işlemlerin aktarıldığı 3. kişilere bildirilmesini isteme
- Münhasıran otomatik sistemler ile analiz edilmesi suretiyle aleyhinize bir sonuç doğması halinde itiraz etme
- Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme

BAŞVURU:
kvkk@tacticiq.app adresine başvurabilirsiniz.`,
  },
  consent: {
    title: 'Açık Rıza Metni',
    content: `KVKK kapsamında, TacticIQ tarafından:

AYDINLATMA:
• Kişisel verilerinizin işleneceği konusunda aydınlatıldım
• Verilerimin hangi amaçlarla kullanılacağını biliyorum
• Haklarım hakkında bilgilendirildim

ONAY:
Aşağıdaki kişisel verilerimin işlenmesine ve aktarılmasına AÇIK RIZA gösteriyorum:
✓ Kimlik Bilgilerim (Ad, Soyad, E-posta)
✓ İletişim Bilgilerim
✓ Platform İçi Aktivite Verilerim (Tahminler, Puanlar)
✓ Cihaz ve IP Bilgilerim

YURT DIŞINA AKTARIM:
Küresel hizmet sunabilmemiz için verilerimin yurt dışı sunuculara aktarılmasına rıza gösteriyorum.

PAZARLAMA:
Kampanya, promosyon ve yeni özellik bildirimlerinin gönderilmesine rıza gösteriyorum.

HAKLARIM:
Bu rızamı her zaman geri çekebileceğimi, KVKK m.11 kapsamındaki haklarımı kullanabileceğimi biliyorum.

İLETİŞİM:
kvkk@tacticiq.app`,
  },
  sales: {
    title: 'Mesafeli Satış Sözleşmesi',
    content: `6502 Sayılı Tüketicinin Korunması Hakkında Kanun Uyarınca

1. TARAFLAR
SATICI: TacticIQ
E-posta: sales@tacticiq.app

ALICI: Platform kullanıcısı

2. SÖZLEŞME KONUSU
Premium üyelik paketi ve dijital içerik satışı.

ÜRÜN/HİZMET: TacticIQ Pro Üyelik
FİYAT: Uygulama içinde gösterilmektedir
ÖDE ME: App Store veya Google Play üzerinden

3. CAYMA HAKKI
Tüketicinin Korunması Hakkında Kanun'un 15. maddesi 1. fıkrasının (ğ) bendi uyarınca, "Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallar" cayma hakkı kapsamı dışındadır.

Dijital içerik teslimatı başladığı anda cayma hakkınız sona erer.

4. GENEL HÜKÜMLER
• İade yapılmaz
• Dijital ürünler değiştirilemez
• Satın alma işlemi Store üzerinden gerçekleşir

5. İLETİŞİM
sales@tacticiq.app`,
  },
  copyright: {
    title: 'Telif Hakkı Bildirimi (DMCA)',
    content: `TacticIQ platformunun tüm içeriği telif hakkı ile korunmaktadır.

© 2026 TacticIQ. Tüm hakları saklıdır.

FİKRİ MÜLKİYET:
- Platform kaynak kodları
- Tasarım ve kullanıcı arayüzü
- Marka, logo ve görsel kimlik
- İçerik, metin ve multimedya

KULLANIM KISITLAMALARI:
Platform içeriğini kopyalamak, değiştirmek, dağıtmak, tersine mühendislik yapmak veya ticari amaçla kullanmak yasaktır.

DMCA (Digital Millennium Copyright Act) BİLDİRİMİ:
Telif hakkı ihlali bildirimi için:
E-posta: copyright@tacticiq.app

Bildiriminizde:
• Telif hakkı sahibinin bilgileri
• İhlal edilen eserin açıklaması
• İhlal eden içeriğin konumu (URL/ekran görüntüsü)
• İletişim bilgileriniz
• İyi niyetli olduğunuza dair beyan

KULLANICI İÇERİĞİ:
Platforma yüklediğiniz içeriklerin telif hakkına uygun olmasından siz sorumlusunuz.

İLETİŞİM:
copyright@tacticiq.app`,
  },
};
