import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Separator } from '@/app/components/ui/separator';
import { FileText, Lock, Cookie, Scale, CheckCircle, CreditCard, Copyright } from 'lucide-react';
import { legalDocumentsService } from '@/services/adminSupabaseService';

interface LegalDocumentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId?: string;
}

type LegalDoc = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

// Legal documents list
const LEGAL_DOCUMENTS: LegalDoc[] = [
  {
    id: 'terms',
    title: 'Kullanım Koşulları (EULA)',
    description: 'Hizmet şartları, sanal öğeler ve kullanıcı sorumlulukları',
    icon: <FileText className="size-5" />,
  },
  {
    id: 'privacy',
    title: 'Küresel Gizlilik Politikası',
    description: 'GDPR, CCPA, KVKK uyumlu gizlilik politikası',
    icon: <Lock className="size-5" />,
  },
  {
    id: 'cookies',
    title: 'Çerez Politikası',
    description: 'Çerezlerin kullanımı ve yönetimi',
    icon: <Cookie className="size-5" />,
  },
  {
    id: 'kvkk',
    title: 'KVKK Aydınlatma Metni',
    description: 'Kişisel Verilerin Korunması Kanunu bilgilendirmesi',
    icon: <Scale className="size-5" />,
  },
  {
    id: 'consent',
    title: 'Açık Rıza Metni',
    description: 'KVKK kapsamında açık rıza beyanı',
    icon: <CheckCircle className="size-5" />,
  },
  {
    id: 'sales',
    title: 'Mesafeli Satış Sözleşmesi',
    description: 'Dijital içerik satış şartları ve cayma hakkı',
    icon: <CreditCard className="size-5" />,
  },
  {
    id: 'copyright',
    title: 'Telif Hakkı Bildirimi',
    description: 'Fikri mülkiyet hakları ve DMCA bildirimi',
    icon: <Copyright className="size-5" />,
  },
];

// Legal documents mapping to translation keys
const LEGAL_DOC_KEYS: Record<string, { titleKey: string; contentKey: string }> = {
  terms: {
    titleKey: 'legal.terms.title',
    contentKey: 'legal.terms.fullContent',
  },
  privacy: {
    titleKey: 'legal.privacy.title',
    contentKey: 'legal.privacy.fullContent',
  },
  cookies: {
    titleKey: 'legal.cookies.title',
    contentKey: 'legal.cookies.fullContent',
  },
  kvkk: {
    titleKey: 'legal.kvkk.title',
    contentKey: 'legal.kvkk.fullContent',
  },
  consent: {
    titleKey: 'legal.consent.title',
    contentKey: 'legal.consent.fullContent',
  },
  sales: {
    titleKey: 'legal.sales.title',
    contentKey: 'legal.sales.fullContent',
  },
  copyright: {
    titleKey: 'legal.dmca.title',
    contentKey: 'legal.dmca.fullContent',
  },
};

// Legacy content - will be removed after translations are complete
const LEGAL_CONTENT: Record<string, { title: string; content: string }> = {
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

B. AVRUPA (GDPR)
Verilerinizi silme, taşıma ve işlemeyi kısıtlama hakkına sahipsiniz.

C. ABD (CCPA/CPRA)
13 yaşından küçükseniz, ebeveyninizin doğrulanmış izni olmadan kişisel verilerinizi toplamayız.

3. İLETİŞİM
Sorularınız için: privacy@tacticiq.app`,
  },
  cookies: {
    title: 'Çerez Politikası',
    content: `Son Güncelleme: 1 Ocak 2026

1. ÇEREZ KULLANIMI
Platformumuz, deneyiminizi geliştirmek için çerezler kullanmaktadır.

2. ÇEREZ TÜRLERİ
- Gerekli Çerezler: Platformun çalışması için zorunludur
- İşlevsel Çerezler: Dil tercihiniz, tema seçiminiz gibi ayarları hatırlar
- Analitik Çerezler: Platform kullanımını anlamamıza yardımcı olur
- Pazarlama Çerezleri: İlginizi çekebilecek içerikleri gösterir

3. ÇEREZ YÖNETİMİ
Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz.`,
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
- Üyelik ve hizmet sunumu
- Kullanıcı deneyimi iyileştirme
- Güvenlik ve dolandırıcılık önleme

HAKLARINIZ:
KVKK m.11 kapsamındaki haklarınızı kullanmak için kvkk@tacticiq.app adresine başvurabilirsiniz.`,
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
✓ Kimlik Bilgilerim
✓ İletişim Bilgilerim
✓ Platform İçi Aktivite Verilerim
✓ Cihaz ve IP Bilgilerim

HAKLARIM:
Bu rızamı her zaman geri çekebileceğimi, KVKK m.11 kapsamındaki haklarımı kullanabileceğimi biliyorum.`,
  },
  sales: {
    title: 'Mesafeli Satış Sözleşmesi',
    content: `6502 Sayılı Tüketicinin Korunması Hakkında Kanun Uyarınca

1. TARAFLAR
SATICI: TacticIQ
E-posta: sales@tacticiq.app

2. SÖZLEŞME KONUSU
Premium üyelik paketi ve dijital içerik satışı.

3. ÖDEME
Ödeme, App Store veya Google Play üzerinden gerçekleştirilir.

4. CAYMA HAKKI
Dijital içerik teslimatı başladığı için cayma hakkı bulunmamaktadır (TKHK m.15/1-ğ).

5. İLETİŞİM
sales@tacticiq.app`,
  },
  copyright: {
    title: 'Telif Hakkı Bildirimi',
    content: `TacticIQ platformunun tüm içeriği telif hakkı ile korunmaktadır.

FİKRİ MÜLKİYET:
- Platform kodları
- Tasarım ve grafikler
- Marka ve logo
- İçerik ve metinler

KULLANIM:
Platform içeriğini kopyalamak, dağıtmak veya ticari amaçla kullanmak yasaktır.

DMCA BİLDİRİMİ:
Telif hakkı ihlali bildirimi için: copyright@tacticiq.app`,
  },
};

export function LegalDocumentsModal({ open, onOpenChange, documentId }: LegalDocumentsModalProps) {
  const { t, language } = useLanguage();
  const [selectedDoc, setSelectedDoc] = useState<string | null>(documentId || null);
  const [adminDocuments, setAdminDocuments] = useState<Record<string, { title: string; content: string }>>({});
  const [loading, setLoading] = useState(false);

  // Load legal documents from admin (Supabase)
  useEffect(() => {
    if (open) {
      const loadAdminDocuments = async () => {
        setLoading(true);
        try {
          const documents = await legalDocumentsService.getByLanguage(language || 'tr');
          const docsMap: Record<string, { title: string; content: string }> = {};
          documents.forEach(doc => {
            if (doc.enabled) {
              docsMap[doc.document_id] = {
                title: doc.title,
                content: doc.content,
              };
            }
          });
          setAdminDocuments(docsMap);
        } catch (error) {
          console.error('Failed to load admin legal documents:', error);
        } finally {
          setLoading(false);
        }
      };
      loadAdminDocuments();
    }
  }, [open, language]);

  useEffect(() => {
    if (documentId && open) {
      setSelectedDoc(documentId);
    }
  }, [documentId, open]);

  // Get document: First try admin documents, then translations, then legacy content
  const currentDocKey = selectedDoc ? LEGAL_DOC_KEYS[selectedDoc] : null;
  let currentDoc = null;
  
  if (selectedDoc) {
    // 1. Try admin documents first
    if (adminDocuments[selectedDoc]) {
      currentDoc = adminDocuments[selectedDoc];
    }
    // 2. Try translations
    else if (currentDocKey) {
      const translatedTitle = t(currentDocKey.titleKey);
      const translatedContent = t(currentDocKey.contentKey);
      // Check if translation exists (not just the key)
      if (translatedTitle !== currentDocKey.titleKey && translatedContent !== currentDocKey.contentKey) {
        currentDoc = {
          title: translatedTitle,
          content: translatedContent,
        };
      }
    }
    // 3. Fallback to legacy content
    if (!currentDoc && LEGAL_CONTENT[selectedDoc]) {
      currentDoc = LEGAL_CONTENT[selectedDoc];
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t('legal.title') || 'Yasal Belgeler'}</DialogTitle>
          <DialogDescription>
            {t('legal.description') || 'Platform kullanım koşulları ve yasal bilgilendirmeler'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[200px_6fr] gap-6 flex-1 min-h-0 overflow-hidden">
          {/* Document List */}
          <div className="flex flex-col min-h-0 overflow-hidden">
            <ScrollArea className="flex-1 pr-2" style={{ height: 'calc(90vh - 180px)' }}>
              <div className="space-y-2 pb-4">
                {LEGAL_DOCUMENTS.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedDoc === doc.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-primary">{doc.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {LEGAL_DOC_KEYS[doc.id] 
                            ? (t(LEGAL_DOC_KEYS[doc.id].titleKey) !== LEGAL_DOC_KEYS[doc.id].titleKey
                                ? t(LEGAL_DOC_KEYS[doc.id].titleKey)
                                : doc.title)
                            : doc.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Document Content */}
          <div className="flex flex-col min-h-0 border rounded-lg bg-muted/20 overflow-hidden">
            <ScrollArea className="flex-1" style={{ height: 'calc(90vh - 180px)' }}>
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="animate-spin size-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p>Yükleniyor...</p>
                  </div>
                ) : currentDoc ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <h2 className="text-xl font-bold mb-4 text-foreground">{currentDoc.title}</h2>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                      {currentDoc.content}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="size-12 mx-auto mb-4 opacity-50" />
                    <p>{t('legal.select') || 'Bir belge seçin'}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 flex-shrink-0 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('legal.close') || t('common.close') || 'Kapat'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
