import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/app/components/ui/button';
import { TermsOfService, PrivacyPolicy, DMCANotice, ContactInfo } from './LegalContent';

type LegalPageType = 'terms' | 'privacy' | 'dmca' | 'contact';

export function LegalPage() {
  const { t } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const page = (urlParams.get('legal') || 'terms') as LegalPageType;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 sticky top-0 bg-background/95 backdrop-blur-sm py-4 border-b rounded-lg px-4 z-10">
          <h1 className="text-3xl font-bold">
            {page === 'terms' && t('legal.terms.title')}
            {page === 'privacy' && t('legal.privacy.title')}
            {page === 'dmca' && t('legal.dmca.title')}
            {page === 'contact' && t('legal.contact.title')}
          </h1>
          <Button variant="ghost" onClick={() => window.location.href = '/'}>
            {t('legal.close')}
          </Button>
        </div>

        {/* Content */}
        <div className="bg-background rounded-lg p-6 md:p-8 prose prose-invert max-w-none">
          {page === 'terms' && <TermsOfService />}
          {page === 'privacy' && <PrivacyPolicy />}
          {page === 'dmca' && <DMCANotice />}
          {page === 'contact' && <ContactInfo />}
        </div>
      </div>
    </div>
  );
}
