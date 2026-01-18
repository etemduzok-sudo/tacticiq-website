import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminData, CURRENCY_SYMBOLS, LANGUAGE_CURRENCY_MAP, convertCurrency } from '@/contexts/AdminDataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Check, Crown, Zap } from 'lucide-react';
import { usePayment } from '@/contexts/PaymentContext';

export function PricingSection() {
  const { t, language } = useLanguage();
  const { sectionSettings, priceSettings, discountSettings } = useAdminData();
  const { selectPlan, openPaymentModal } = usePayment();

  // Admin panelinden section ayarları
  const pricingSettings = sectionSettings.pricing;

  const handleSelectPlan = (planId: string) => {
    selectPlan(planId as 'free' | 'pro');
    if (planId === 'pro') {
      openPaymentModal();
    }
  };

  // Dile göre para birimi belirleme
  const targetCurrency = LANGUAGE_CURRENCY_MAP[language] || 'TRY';
  const currencySymbol = CURRENCY_SYMBOLS[targetCurrency];

  // Fiyatı priceSettings'den al ve kullanıcının diline göre çevir
  const basePrice = priceSettings.proPrice || 99.99;
  const baseCurrency = priceSettings.baseCurrency || 'TRY';
  const billingPeriod = priceSettings.billingPeriod || 'yearly';
  
  // Fiyatı hedef para birimine çevir
  const convertedOriginalPrice = convertCurrency(basePrice, baseCurrency, targetCurrency);

  // İndirim yüzdesi (Section ayarlarından discountEnabled kontrol edilir)
  // pricingSettings.discountEnabled: Pricing section'da indirim gösterilsin mi?
  // discountSettings.discountPercent: İndirim popup'ındaki indirim oranı
  const discountPercent = discountSettings.discountPercent || 0;
  const proPrice = pricingSettings.discountEnabled && discountPercent > 0
    ? convertedOriginalPrice * (1 - discountPercent / 100)
    : convertedOriginalPrice;

  // Fatura dönemi metni
  const periodText = billingPeriod === 'monthly' 
    ? t('pricing.period.monthly') || '/ aylık'
    : t('pricing.period.yearly') || '/ yıllık';

  return (
    <section id="pricing" className="py-20 md:py-28 bg-gradient-to-b from-muted/20 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t('pricing.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* Free Plan - Admin kontrollü */}
          {pricingSettings.showFreeOption && (
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {t('pricing.free.name')}
                </CardTitle>
                <CardDescription>
                  {t('pricing.free.desc')}
                </CardDescription>
                <div className="mt-4">
                  <div className="text-4xl font-bold">{t('pricing.free.price')}</div>
                  <div className="text-sm text-muted-foreground">{t('pricing.free.period')}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleSelectPlan('free')}
                  variant="outline" 
                  className="w-full"
                  size="lg"
                >
                  {t('pricing.free.cta')}
                </Button>

                <div className="space-y-3">
                  {[
                    t('pricing.free.features.predictions'),
                    t('pricing.free.features.teams'),
                    t('pricing.free.features.categories'),
                    t('pricing.free.features.focus'),
                    t('pricing.free.features.training'),
                    t('pricing.free.features.stats'),
                    t('pricing.free.features.leaderboard'),
                    t('pricing.free.features.badges'),
                    t('pricing.free.features.ads'),
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="size-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pro Plan */}
          <Card className="relative border-2 border-secondary shadow-xl">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-secondary text-white rounded-full text-xs font-bold">
              {t('pricing.pro.popular')}
            </div>

            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Crown className="size-6 text-accent" />
                {t('pricing.pro.name')}
              </CardTitle>
              <CardDescription>
                {t('pricing.pro.desc')}
              </CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <div className="text-4xl font-bold">{currencySymbol}{proPrice.toFixed(2)}</div>
                  {pricingSettings.discountEnabled && (
                    <div className="text-lg text-muted-foreground line-through">
                      {currencySymbol}{convertedOriginalPrice.toFixed(2)}
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{periodText}</div>
                {pricingSettings.discountEnabled && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold mt-2">
                    <Zap className="size-3" />
                    {discountPercent}% {t('pricing.discount_label')}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => handleSelectPlan('pro')}
                className="w-full gap-2"
                size="lg"
              >
                <Crown className="size-5" />
                {t('pricing.pro.cta')}
              </Button>

              <div className="space-y-3">
                {[
                  t('pricing.pro.features.predictions'),
                  t('pricing.pro.features.teams'),
                  t('pricing.pro.features.categories'),
                  t('pricing.pro.features.focus'),
                  t('pricing.pro.features.training'),
                  t('pricing.pro.features.stats'),
                  t('pricing.pro.features.leaderboard'),
                  t('pricing.pro.features.badges'),
                  t('pricing.pro.features.ads'),
                  t('pricing.pro.features.priority'),
                  t('pricing.pro.features.early'),
                  t('pricing.pro.features.analysis'),
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="size-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            {t('pricing.comparison.note')}
          </p>
        </div>
      </div>
    </section>
  );
}