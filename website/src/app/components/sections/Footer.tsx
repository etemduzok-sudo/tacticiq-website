import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useAdminDataSafe } from '@/contexts/AdminDataContext';
import { Button } from '@/app/components/ui/button';
import { Logo } from '@/app/components/Logo';
import { Apple, Smartphone, Instagram, Twitter, Linkedin, Facebook, Youtube } from 'lucide-react';
import { useState } from 'react';
import { VisitorCounter } from '@/app/components/ui/visitor-counter';
import { AdminLoginDialog } from '@/app/components/admin/AdminLoginDialog';
import { TermsOfService, PrivacyPolicy, DMCANotice, ContactInfo } from '@/app/components/legal/LegalContent';

type LegalPage = 'terms' | 'privacy' | 'dmca' | 'contact';

export function Footer() {
  const { t } = useLanguage();
  const { isAdmin } = useAdmin();
  const adminData = useAdminDataSafe();
  const [activePage, setActivePage] = useState<LegalPage | null>(null);

  // Admin settings'ten contact bilgilerini al
  const contactEmail = adminData?.settings?.contactEmail || 'support@tacticiq.app';
  const contactPhone = adminData?.settings?.contactPhone;
  const socialLinks = adminData?.settings?.socialLinks || {};
  const sectionSettings = adminData?.sectionSettings;

  const handleLegalClick = (page: LegalPage) => {
    setActivePage(page);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Legal Content Modal */}
      {activePage && (
        <LegalModal page={activePage} onClose={() => setActivePage(null)} />
      )}

      {/* Footer */}
      <footer className="text-white py-12 md:py-16 relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #1F3231 0%, #2B7C73 100%)'
      }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <Logo size="md" showText={true} />
              <p className="text-sm text-white/80">
                {t('footer.tagline')}
              </p>
              
              {/* Social Media Links - Admin kontrollü */}
              {(sectionSettings?.footer?.showSocialLinks ?? true) && (
                <div className="flex gap-3 pt-2">
                  {socialLinks.instagram && (
                    <a
                      href={socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-secondary flex items-center justify-center transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram className="size-4" />
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a
                      href={socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-secondary flex items-center justify-center transition-colors"
                      aria-label="Twitter"
                    >
                      <Twitter className="size-4" />
                    </a>
                  )}
                  {socialLinks.linkedin && (
                    <a
                      href={socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-secondary flex items-center justify-center transition-colors"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="size-4" />
                    </a>
                  )}
                  {socialLinks.facebook && (
                    <a
                      href={socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-secondary flex items-center justify-center transition-colors"
                      aria-label="Facebook"
                    >
                      <Facebook className="size-4" />
                    </a>
                  )}
                </div>
              )}

              {/* App Download Buttons - Admin kontrollü */}
              {(sectionSettings?.footer?.showAppDownloadButtons ?? true) && (
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Apple className="size-4" />
                    App Store
                  </Button>
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Smartphone className="size-4" />
                    Google Play
                  </Button>
                </div>
              )}
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">{t('footer.product.title')}</h4>
              <ul className="space-y-2 text-sm text-white/80">
                {sectionSettings?.features?.enabled && (
                  <li><a href="#features" className="hover:text-secondary transition-colors">{t('footer.product.features')}</a></li>
                )}
                {sectionSettings?.howItWorks?.enabled && (
                  <li><a href="#how-it-works" className="hover:text-secondary transition-colors">{t('footer.product.howItWorks')}</a></li>
                )}
                {sectionSettings?.blog?.enabled && (
                  <li><a href="#blog" className="hover:text-secondary transition-colors">{t('footer.product.blog')}</a></li>
                )}
                {sectionSettings?.pricing?.enabled && (
                  <li><a href="#pricing" className="hover:text-secondary transition-colors">{t('footer.product.pricing')}</a></li>
                )}
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">{t('footer.legal.title')}</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <button 
                    onClick={() => handleLegalClick('terms')}
                    className="hover:text-secondary transition-colors text-left"
                  >
                    {t('footer.legal.terms')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleLegalClick('privacy')}
                    className="hover:text-secondary transition-colors text-left"
                  >
                    {t('footer.legal.privacy')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleLegalClick('dmca')}
                    className="hover:text-secondary transition-colors text-left"
                  >
                    {t('footer.legal.dmca')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleLegalClick('contact')}
                    className="hover:text-secondary transition-colors text-left"
                  >
                    {t('footer.legal.contact')}
                  </button>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">{t('footer.support.title')}</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li><a href={`mailto:${contactEmail}`} className="hover:text-secondary transition-colors">{contactEmail}</a></li>
                {contactPhone && <li className="text-sm">{contactPhone}</li>}
                <li><a href="#faq" className="hover:text-secondary transition-colors">{t('footer.support.faq')}</a></li>
              </ul>
            </div>
          </div>

          {/* Visitor Counter - Admin kontrollü ve sadece admin'e görünür */}
          {isAdmin && (sectionSettings?.footer?.showVisitorCounter ?? true) && (
            <div className="mb-8">
              <VisitorCounter />
            </div>
          )}

          {/* Bottom Bar */}
          <div className="border-t border-white/20 pt-8 space-y-4">
            <p className="text-xs text-white/60 text-center">
              {t('footer.copyright')}
            </p>
            <p className="text-xs text-white/60 text-center">
              {t('footer.disclaimer')}
            </p>
            
            {/* Admin Access - Footer'da görünür */}
            <div className="flex justify-center pt-4">
              <div className="opacity-50 hover:opacity-100 transition-opacity duration-300">
                <AdminLoginDialog />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

// Legal Modal Component
function LegalModal({ page, onClose }: { page: LegalPage; onClose: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 sticky top-0 bg-background/95 backdrop-blur-sm py-4 border-b rounded-lg px-4">
          <h2 className="text-2xl font-bold">
            {page === 'terms' && t('legal.terms.title')}
            {page === 'privacy' && t('legal.privacy.title')}
            {page === 'dmca' && t('legal.dmca.title')}
            {page === 'contact' && t('legal.contact.title')}
          </h2>
          <Button variant="ghost" onClick={onClose}>
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

// Legal Content Components are now imported from LegalContent.tsx