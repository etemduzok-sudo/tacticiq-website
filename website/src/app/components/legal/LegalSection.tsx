import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/app/components/ui/button';
import { X, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

type LegalPage = 'terms' | 'privacy' | 'dmca' | 'contact' | null;

export function LegalSection() {
  const { t } = useLanguage();
  const [activePage, setActivePage] = useState<LegalPage>(null);

  if (!activePage) return null;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 sticky top-0 bg-background/95 backdrop-blur-sm py-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActivePage(null)}
          >
            <ChevronLeft className="size-4 mr-2" />
            {t('legal.back')}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActivePage(null)}
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          {activePage === 'terms' && <TermsOfService />}
          {activePage === 'privacy' && <PrivacyPolicy />}
          {activePage === 'dmca' && <DMCANotice />}
          {activePage === 'contact' && <ContactInfo />}
        </div>
      </div>
    </div>
  );
}

function TermsOfService() {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('legal.terms.title')}</h1>
      <p className="text-sm text-muted-foreground">{t('legal.lastUpdated')}: {t('legal.updateDate')}</p>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">{t('legal.terms.section1.title')}</h2>
        <p>{t('legal.terms.section1.content')}</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">{t('legal.terms.section2.title')}</h2>
        <p>{t('legal.terms.section2.intro')}</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>{t('legal.terms.section2.ownership.title')}:</strong> {t('legal.terms.section2.ownership.content')}</li>
          <li><strong>{t('legal.terms.section2.cashValue.title')}:</strong> {t('legal.terms.section2.cashValue.content')}</li>
          <li><strong>{t('legal.terms.section2.lootBox.title')}:</strong> {t('legal.terms.section2.lootBox.content')}</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">{t('legal.terms.section3.title')}</h2>
        <p>{t('legal.terms.section3.intro')}</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>{t('legal.terms.section3.ugc.title')}:</strong> {t('legal.terms.section3.ugc.content')}</li>
          <li><strong>{t('legal.terms.section3.reverse.title')}:</strong> {t('legal.terms.section3.reverse.content')}</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">{t('legal.terms.section4.title')}</h2>
        <p><strong>{t('legal.terms.section4.eu.title')}:</strong> {t('legal.terms.section4.eu.content')}</p>
        <p className="italic text-sm">{t('legal.terms.section4.eu.confirmation')}</p>
        <p><strong>{t('legal.terms.section4.turkey.title')}:</strong> {t('legal.terms.section4.turkey.content')}</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">{t('legal.terms.section5.title')}</h2>
        <p>{t('legal.terms.section5.content')}</p>
      </section>
    </div>
  );
}

function PrivacyPolicy() {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('legal.privacy.title')}</h1>
      <p className="text-sm text-muted-foreground">{t('legal.lastUpdated')}: {t('legal.updateDate')}</p>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">{t('legal.privacy.section1.title')}</h2>
        <p>{t('legal.privacy.section1.content')}</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">{t('legal.privacy.section2.title')}</h2>
        
        <div className="space-y-3">
          <h3 className="text-xl font-semibold">{t('legal.privacy.section2.turkey.title')}</h3>
          <p>{t('legal.privacy.section2.turkey.responsible')}</p>
          <p><strong>{t('legal.privacy.section2.turkey.consent.title')}:</strong> {t('legal.privacy.section2.turkey.consent.content')}</p>
          <p><strong>{t('legal.privacy.section2.turkey.rights.title')}:</strong> {t('legal.privacy.section2.turkey.rights.content')}</p>
          <p><strong>{t('legal.privacy.section2.turkey.iys.title')}:</strong> {t('legal.privacy.section2.turkey.iys.content')}</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold">{t('legal.privacy.section2.eu.title')}</h3>
          <p><strong>{t('legal.privacy.section2.eu.basis.title')}:</strong> {t('legal.privacy.section2.eu.basis.content')}</p>
          <p><strong>{t('legal.privacy.section2.eu.rights.title')}:</strong> {t('legal.privacy.section2.eu.rights.content')}</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold">{t('legal.privacy.section2.usa.title')}</h3>
          <p><strong>{t('legal.privacy.section2.usa.coppa.title')}:</strong> {t('legal.privacy.section2.usa.coppa.content')}</p>
          <p><strong>{t('legal.privacy.section2.usa.ccpa.title')}:</strong> {t('legal.privacy.section2.usa.ccpa.content')}</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold">{t('legal.privacy.section2.china.title')}</h3>
          <p>{t('legal.privacy.section2.china.content')}</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold">{t('legal.privacy.section2.brazil.title')}</h3>
          <p>{t('legal.privacy.section2.brazil.content')}</p>
        </div>
      </section>
    </div>
  );
}

function DMCANotice() {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('legal.dmca.title')}</h1>
      
      <section className="space-y-4">
        <p>{t('legal.dmca.content')}</p>
        <div className="bg-muted/30 p-4 rounded-lg">
          <p className="text-sm">{t('legal.dmca.copyright')}</p>
        </div>
      </section>

      {/* China Mandatory Text */}
      <section className="space-y-4 border-t pt-6">
        <h2 className="text-2xl font-semibold">{t('legal.china.title')}</h2>
        <div className="bg-accent/10 p-6 rounded-lg text-center space-y-2">
          <p className="font-semibold text-lg">{t('legal.china.mandate')}</p>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p>{t('legal.china.line1')}</p>
            <p>{t('legal.china.line2')}</p>
            <p>{t('legal.china.line3')}</p>
            <p>{t('legal.china.line4')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactInfo() {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('legal.contact.title')}</h1>
      
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">{t('legal.contact.company.title')}</h2>
        <div className="bg-muted/30 p-6 rounded-lg space-y-2">
          <p><strong>{t('legal.contact.company.name')}:</strong> TacticIQ</p>
          <p><strong>{t('legal.contact.company.email')}:</strong> info@tacticiq.app</p>
          <p><strong>{t('legal.contact.company.support')}:</strong> support@tacticiq.app</p>
          <p><strong>{t('legal.contact.company.legal')}:</strong> legal@tacticiq.app</p>
          <p><strong>{t('legal.contact.company.kvkk')}:</strong> kvkk@tacticiq.app</p>
          <p><strong>{t('legal.contact.company.dpo')}:</strong> dpo@tacticiq.app</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">{t('legal.contact.platforms.title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-muted/30 p-4 rounded-lg">
            <p className="font-semibold mb-2">App Store</p>
            <p className="text-sm text-muted-foreground">{t('legal.contact.platforms.ios')}</p>
          </div>
          <div className="bg-muted/30 p-4 rounded-lg">
            <p className="font-semibold mb-2">Google Play</p>
            <p className="text-sm text-muted-foreground">{t('legal.contact.platforms.android')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

// Export hook for opening legal pages
export function useLegal() {
  const [activePage, setActivePage] = useState<LegalPage>(null);
  
  return {
    openTerms: () => setActivePage('terms'),
    openPrivacy: () => setActivePage('privacy'),
    openDMCA: () => setActivePage('dmca'),
    openContact: () => setActivePage('contact'),
    close: () => setActivePage(null),
    activePage,
    LegalModal: () => <LegalSection />,
  };
}
