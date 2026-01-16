import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Mail, CheckCircle2, TrendingUp, Zap, Target } from 'lucide-react';
import { toast } from 'sonner';

export function NewsletterSection() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t('newsletter.error'));
      return;
    }

    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Newsletter subscription:', email);
    
    setLoading(false);
    setSubscribed(true);
    toast.success(t('newsletter.success'));
    setEmail('');
    
    // Reset after 5 seconds
    setTimeout(() => setSubscribed(false), 5000);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary/95 to-secondary relative overflow-hidden">

      {/* Background Pattern - Blurred circles */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm font-semibold mb-4">
                <Mail className="size-4" />
                {t('newsletter.badge')}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('newsletter.title')}
              </h2>
              <p className="text-white/90 mb-6">
                {t('newsletter.subtitle')}
              </p>

              {/* Benefits */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="size-4 text-accent" />
                  </div>
                  <span className="text-sm text-white/90">{t('newsletter.benefit1')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="size-4 text-accent" />
                  </div>
                  <span className="text-sm text-white/90">{t('newsletter.benefit2')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Target className="size-4 text-accent" />
                  </div>
                  <span className="text-sm text-white/90">{t('newsletter.benefit3')}</span>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              {subscribed ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="size-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-2">
                    {t('newsletter.subscribed.title')}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t('newsletter.subscribed.description')}
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-primary mb-2">
                    {t('newsletter.form.title')}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    {t('newsletter.form.description')}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Input
                        type="email"
                        placeholder={t('newsletter.form.placeholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="h-12"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {t('newsletter.form.subscribing')}
                        </>
                      ) : (
                        <>
                          <Mail className="size-4" />
                          {t('newsletter.form.subscribe')}
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      {t('newsletter.form.privacy')}{' '}
                      <a href="#" className="text-primary hover:underline">{t('newsletter.form.privacyLink')}</a>
                    </p>
                  </form>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">15K+</div>
                      <div className="text-xs text-muted-foreground">{t('newsletter.stats.subscribers')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">2x</div>
                      <div className="text-xs text-muted-foreground">{t('newsletter.stats.weekly')}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}