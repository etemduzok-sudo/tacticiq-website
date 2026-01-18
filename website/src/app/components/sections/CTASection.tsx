import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDataSafe } from '@/contexts/AdminDataContext';
import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { ArrowRight } from 'lucide-react';
import { waitlistService } from '@/services/adminSupabaseService';
import { toast } from 'sonner';

export function CTASection() {
  const { t, currentLanguage } = useLanguage();
  const adminData = useAdminDataSafe();
  
  // Get section settings
  const sectionSettings = adminData?.sectionSettings?.cta ?? { enabled: true };
  
  // If section is disabled, don't render
  if (!sectionSettings.enabled) {
    return null;
  }
  
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t('waitlist.invalidEmail') || 'Geçerli bir e-posta adresi girin');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await waitlistService.add({
        email: email.toLowerCase().trim(),
        source: 'cta-section'
      });

      if (result) {
        toast.success(t('waitlist.success') || 'Bekleme listesine eklendiniz!');
        setEmail('');
      } else {
        toast.info(t('waitlist.alreadyExists') || 'Bu e-posta adresi zaten bekleme listesinde.');
      }
    } catch (error) {
      toast.error(t('waitlist.error') || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    { key: 'free', text: t('cta.features.free') },
    { key: 'no_card', text: t('cta.features.no_card') },
    { key: 'skill', text: t('cta.features.skill') },
    { key: 'virtual', text: t('cta.features.virtual') },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Content Card */}
          <div className="bg-background/60 backdrop-blur-sm border rounded-3xl p-8 md:p-12 shadow-2xl">
            {/* Title & Subtitle */}
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('cta.title')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('cta.subtitle')}
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {features.map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center gap-3 bg-secondary/10 rounded-xl px-4 py-3"
                >
                  <div className="flex-shrink-0 size-6 rounded-full bg-secondary flex items-center justify-center">
                    <ArrowRight className="size-4 text-secondary-foreground" />
                  </div>
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder={t('cta.email.placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 h-12 text-base"
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="h-12 px-8 bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {t('cta.submit') || 'Processing...'}
                    </span>
                  ) : (
                    t('cta.button')
                  )}
                </Button>
              </div>

              {/* Privacy Note */}
              <p className="text-xs text-center text-muted-foreground">
                🔒 {t('cta.privacy')}
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}