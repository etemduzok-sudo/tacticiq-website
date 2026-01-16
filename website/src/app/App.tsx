import React from 'react';
import { AdminPanel } from '@/app/components/admin/AdminPanel';
import { AdminDataProvider, useAdminDataSafe } from '@/contexts/AdminDataContext';
import { DiscountPopup } from '@/app/components/marketing/DiscountPopup';
import { AdPopup } from '@/app/components/modals/AdPopup';
import { AdBanner } from '@/app/components/modals/AdBanner';
import { AdSidebar } from '@/app/components/modals/AdSidebar';
import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/sections/Footer';
import { HeroSection } from '@/app/components/sections/HeroSection';
import { ProductSection } from '@/app/components/sections/ProductSection';
import { FeaturesSection } from '@/app/components/sections/FeaturesSection';
import { PlayerPredictionSection } from '@/app/components/sections/PlayerPredictionSection';
import { TrainingSection } from '@/app/components/sections/TrainingSection';
import { HowItWorksSection } from '@/app/components/sections/HowItWorksSection';
import { PricingSection } from '@/app/components/sections/PricingSection';
import { AppDownloadSection } from '@/app/components/sections/AppDownloadSection';
import { BlogSection } from '@/app/components/sections/BlogSection';
import { CTASection } from '@/app/components/sections/CTASection';
import { GameSection } from '@/app/components/sections/GameSection';
import { FAQSection } from '@/app/components/sections/FAQSection';
import { ContactSection } from '@/app/components/sections/ContactSection';
import { TestimonialsSection } from '@/app/components/sections/TestimonialsSection';
import { NewsletterSection } from '@/app/components/sections/NewsletterSection';
import { AboutSection } from '@/app/components/sections/AboutSection';
import { PartnersSection } from '@/app/components/sections/PartnersSection';
import { PressSection } from '@/app/components/sections/PressSection';
import { StatsSection } from '@/app/components/sections/StatsSection';
import { SEOHead } from '@/app/components/seo/SEOHead';
import { Analytics } from '@/app/components/analytics/Analytics';
import { CookieConsent } from '@/app/components/legal/CookieConsent';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { PaymentProvider } from '@/contexts/PaymentContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { AdminDataBackendProvider } from '@/contexts/AdminDataBackendContext';
import { Toaster } from 'sonner';
import '@/i18n/config';

function AppContent() {
  const adminData = useAdminDataSafe();
  
  // Sayfa yüklendiğinde ve her 1 dakikada bir en üste scroll
  React.useEffect(() => {
    // İlk yüklemede scroll
    window.scrollTo(0, 0);
    
    // Her 1 dakikada bir scroll (60000 ms)
    const scrollInterval = setInterval(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 60000);
    
    return () => clearInterval(scrollInterval);
  }, []);
  
  // Safety check - AdminDataContext yüklenene kadar loading göster
  if (!adminData || !adminData.sectionSettings) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  const { sectionSettings } = adminData;

  const handleNavigate = (section: string) => {
    setTimeout(() => {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else if (section === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleDiscountClaim = () => {
    setTimeout(() => {
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* SEO Meta Tags */}
      <SEOHead />
      
      {/* Analytics */}
      <Analytics />
      
      <Header onNavigate={handleNavigate} />
      
      <main className="flex-1">
        {/* Hero Section - Admin kontrollü */}
        {sectionSettings.hero.enabled && <HeroSection />}
        
        {/* Stats Section - Admin kontrollü (hero.showStats ile) */}
        {sectionSettings.hero.showStats && <StatsSection />}
        
        {/* Product Section - Admin kontrollü */}
        {sectionSettings.product.enabled && <ProductSection />}
        
        {/* Features Section - Admin kontrollü */}
        {sectionSettings.features.enabled && <FeaturesSection />}
        
        {/* Player Prediction Section - Admin kontrollü */}
        {sectionSettings.playerPrediction.enabled && <PlayerPredictionSection />}
        
        {/* Training Section - Admin kontrollü */}
        {sectionSettings.training.enabled && <TrainingSection />}
        
        {/* How It Works Section - Admin kontrollü */}
        {sectionSettings.howItWorks.enabled && <HowItWorksSection />}
        
        {/* Pricing Section - Admin kontrollü */}
        {sectionSettings.pricing.enabled && <PricingSection />}
        
        {/* App Download Section - Admin kontrollü */}
        {sectionSettings.appDownload.enabled && <AppDownloadSection />}
        
        {/* Blog Section - Admin kontrollü */}
        {sectionSettings.blog.enabled && <BlogSection />}
        
        {/* Newsletter Section - Her zaman göster */}
        <NewsletterSection />
        
        {/* CTA Section - Admin kontrollü */}
        {sectionSettings.cta.enabled && <CTASection />}
        
        {/* Game Section - Admin kontrollü */}
        {sectionSettings.game.enabled && <GameSection />}
        
        {/* Testimonials Section - Admin kontrollü - EN ALTA TAŞINDI */}
        {sectionSettings.testimonials.enabled && <TestimonialsSection />}
        
        {/* About Section - Admin kontrollü - EN ALTA TAŞINDI */}
        {sectionSettings.about.enabled && <AboutSection />}
        
        {/* Partners Section - Admin kontrollü - EN ALTA TAŞINDI */}
        {sectionSettings.partners.enabled && <PartnersSection />}
        
        {/* Press Section - Admin kontrollü - EN ALTA TAŞINDI */}
        {sectionSettings.press.enabled && <PressSection />}
        
        {/* FAQ Section - Admin kontrollü - EN ALTA TAŞINDI */}
        {sectionSettings.faq.enabled && <FAQSection />}
        
        {/* Contact Section - Admin kontrollü - EN ALTA TAŞINDI */}
        {sectionSettings.contact.enabled && <ContactSection />}
      </main>

      <Footer />
      
      {/* Admin Panel - Only visible when logged in as admin */}
      <AdminPanel />
      
      {/* Discount Popup - 5 saniye sonra otomatik açılır */}
      <DiscountPopup onSelectPlan={handleDiscountClaim} />
      
      <AdPopup />
      <AdBanner />
      <AdSidebar />
      
      {/* Cookie Consent Banner - GDPR/KVKK Compliant */}
      <CookieConsent />
      
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <PaymentProvider>
        <AdminProvider>
          <AdminDataProvider>
            <AdminDataBackendProvider enableBackend={false}>
              <AppContent />
            </AdminDataBackendProvider>
          </AdminDataProvider>
        </AdminProvider>
      </PaymentProvider>
    </LanguageProvider>
  );
}