import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDataSafe } from '@/contexts/AdminDataContext';
import { useUserAuthSafe } from '@/contexts/UserAuthContext';
import { Button } from '@/app/components/ui/button';
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import { AuthModal } from '@/app/components/auth/AuthModal';
import { UserMenu } from '@/app/components/UserMenu';
import { Logo } from '@/app/components/Logo';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  onNavigate?: (section: string) => void;
}

export function Header({ onNavigate }: HeaderProps) {
  const { t, isRTL } = useLanguage();
  // useAdminDataSafe kullanarak context değişikliklerinde re-render garantile
  const adminData = useAdminDataSafe();
  // Gerçek auth durumu - UserAuthContext'ten
  const userAuth = useUserAuthSafe();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // Auth durumu UserAuthContext'ten
  const isLoggedIn = userAuth?.isAuthenticated ?? false;
  
  // Get user data from profile or user object
  const userProfile = userAuth?.profile;
  const userEmail = userProfile?.email || userAuth?.user?.email || '';
  const userName = userProfile?.name || 
                   userAuth?.user?.user_metadata?.name || 
                   userAuth?.user?.user_metadata?.full_name ||
                   userEmail.split('@')[0] || 
                   'User';
  
  const user = {
    email: userEmail,
    name: userName,
  };

  // Build nav items based on admin section settings - context değişince güncellenecek
  const sectionSettings = adminData?.sectionSettings;
  
  // Dinamik olarak admin ayarlarına göre nav items oluştur
  // Her section için: admin panelinde enabled ise göster, değilse gizle
  const navItems = [
    { key: 'home', label: t('nav.home'), href: '#', enabled: true },
    { key: 'features', label: t('nav.features'), href: '#features', enabled: sectionSettings?.features?.enabled ?? true },
    { key: 'product', label: t('nav.product') || 'Ürün', href: '#product', enabled: sectionSettings?.product?.enabled ?? false },
    { key: 'how-it-works', label: t('nav.how_it_works'), href: '#how-it-works', enabled: sectionSettings?.howItWorks?.enabled ?? true },
    { key: 'pricing', label: t('nav.pricing'), href: '#pricing', enabled: sectionSettings?.pricing?.enabled ?? true },
    { key: 'testimonials', label: t('nav.testimonials') || 'Yorumlar', href: '#testimonials', enabled: sectionSettings?.testimonials?.enabled ?? false },
    { key: 'blog', label: t('nav.blog'), href: '#blog', enabled: sectionSettings?.blog?.enabled ?? true },
    { key: 'game', label: t('nav.game') || 'Oyun', href: '#game', enabled: sectionSettings?.game?.enabled ?? false },
    { key: 'partners', label: t('nav.partners') || 'Ortaklar', href: '#partners', enabled: sectionSettings?.partners?.enabled ?? false },
    { key: 'faq', label: t('nav.faq') || 'SSS', href: '#faq', enabled: sectionSettings?.faq?.enabled ?? false },
    { key: 'contact', label: t('nav.contact') || 'İletişim', href: '#contact', enabled: sectionSettings?.contact?.enabled ?? false },
    { key: 'about', label: t('nav.about') || 'Hakkımızda', href: '#about', enabled: sectionSettings?.about?.enabled ?? false },
  ].filter(item => item.enabled);

  const handleNavClick = (key: string, href: string) => {
    // Scroll to section
    if (href === '#') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(href.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    
    // Also call onNavigate if provided
    if (onNavigate) {
      onNavigate(key);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <Logo size="md" showText={true} />
        </a>

        {/* Desktop Navigation - Admin ayarlarına göre dinamik */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleNavClick(item.key, item.href)}
              className="text-sm text-foreground/80 hover:text-foreground transition-colors"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          {isLoggedIn ? (
            <UserMenu user={user} />
          ) : (
            <Button 
              className="flex"
              onClick={() => setAuthModalOpen(true)}
            >
              {t('nav.signin') || 'Giriş Yap'}
            </Button>
          )}
          
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container mx-auto flex flex-col py-4 px-4 space-y-3">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key, item.href)}
                className="text-left py-2 text-foreground/80 hover:text-foreground transition-colors"
              >
                {item.label}
              </button>
            ))}
            {!isLoggedIn && (
              <Button 
                className="w-full mt-2"
                onClick={() => {
                  setAuthModalOpen(true);
                  setMobileMenuOpen(false);
                }}
              >
                {t('nav.signin') || 'Giriş Yap'}
              </Button>
            )}
          </nav>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
      />
    </header>
  );
}