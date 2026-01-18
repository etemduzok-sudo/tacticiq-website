import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminData } from '@/contexts/AdminDataContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Play, ArrowRight, TrendingUp, Users, Trophy, Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';
import { waitlistService } from '@/services/adminSupabaseService';

export function HeroSection() {
  const { t } = useLanguage();
  const { stats, sectionSettings } = useAdminData();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin panelinden section ayarları
  const heroSettings = sectionSettings.hero;

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t('waitlist.invalidEmail') || 'Geçerli bir e-posta adresi girin');
      return;
    }

    setLoading(true);
    
    try {
      const result = await waitlistService.add({
        email: email.toLowerCase().trim(),
        source: 'hero-section'
      });
      
      if (result) {
        toast.success(t('waitlist.success') || 'Bekleme listesine eklendiniz! Gelişmelerden ilk siz haberdar olacaksınız.');
        setEmail('');
      } else {
        // Email zaten kayıtlı olabilir
        toast.info(t('waitlist.alreadyExists') || 'Bu e-posta adresi zaten bekleme listesinde.');
      }
    } catch (error) {
      console.error('Waitlist submit error:', error);
      toast.error(t('waitlist.error') || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayGame = () => {
    // Game section'a scroll et
    const gameSection = document.getElementById('game');
    if (gameSection) {
      gameSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Eğer game section yoksa toast göster
      toast.info(t('game.comingSoon') || 'Yakında! / Coming Soon! 🎮', {
        description: t('game.comingSoonDesc') || 'Oyun özelliği çok yakında yayınlanacak. / Game feature will be released very soon.',
      });
    }
  };

  return (
    <section id="hero" className="relative min-h-[90vh] flex justify-center overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      {/* Kare Grid Pattern Background - Light/Dark Mode - En alta z-index 0 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Light Mode: Primary renk tonunda kare grid */}
        <div 
          className="absolute inset-0 dark:hidden"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(15, 42, 36, 0.12) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(15, 42, 36, 0.12) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        {/* Dark Mode: Secondary renk tonunda kare grid */}
        <div 
          className="absolute inset-0 hidden dark:block"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(31, 162, 166, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(31, 162, 166, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Background Pattern - Glow effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Content - z-10 ile grid pattern üstünde */}
      <div className="container mx-auto px-4 pt-11 md:pt-14 pb-14 md:pb-20 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Merkezi Büyük Logo - SVG Bire Bir */}
          <div className="mb-[22.4px] animate-fade-in">
            <div className="flex flex-col justify-center items-center mb-[14px]">
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 blur-3xl bg-secondary/30 dark:bg-secondary/20 rounded-full -z-10" style={{ width: '320px', height: '320px', transform: 'translate(-50%, -50%)', left: '50%', top: '50%' }} />
                {/* SVG Logo - Şeffaf Arka Plan, Dikdörtgen Yapı Yok */}
                <div className="relative mx-auto mb-2 flex items-center justify-center">
                  <img 
                    src="/logo.svg" 
                    alt="TacticIQ Logo" 
                    className="w-[315px] h-[315px] md:w-[420px] md:h-[420px] object-contain"
                    style={{ 
                      backgroundColor: 'transparent',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      boxShadow: 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary dark:bg-accent/20 dark:text-accent rounded-full text-sm font-semibold mb-6 animate-fade-in-up animation-delay-100">
            <Trophy className="size-4" />
            {t('hero.badge')}
          </div>

          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-fade-in-up animation-delay-200">
            {t('hero.title')}
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 animate-fade-in-up animation-delay-300">
            {t('hero.subtitle')}
          </p>

          {/* Description */}
          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in-up animation-delay-400">
            {t('hero.description')}
          </p>

          {/* Email Signup Form - Admin kontrollü */}
          {heroSettings.showEmailSignup && (
            <form 
              onSubmit={handleWaitlistSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-12 animate-fade-in-up animation-delay-500"
            >
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-12 text-base"
                disabled={loading}
              />
              <Button type="submit" size="lg" className="gap-2 h-12" disabled={loading}>
                {loading ? t('hero.cta.loading') : t('hero.cta.primary')}
                <ArrowRight className="size-5" />
              </Button>
            </form>
          )}

          {/* Oyun Oyna Butonu - Admin kontrollü */}
          {heroSettings.showPlayButton && (
            <div className="flex justify-center mb-12 animate-fade-in-up animation-delay-500">
              <Button
                onClick={handlePlayGame}
                size="lg"
                className="bg-gradient-to-r from-[#1FA2A6] to-[#C9A44C] hover:opacity-90 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all gap-2"
              >
                <Gamepad2 className="w-6 h-6" />
                {t('game.playNow') || 'Oyun Oyna'}
              </Button>
            </div>
          )}

          {/* Not Betting Notice */}
          <p className="text-sm text-muted-foreground mb-12 animate-fade-in-up animation-delay-600">
            {t('hero.notBetting')}
          </p>
        </div>
      </div>
    </section>
  );
}