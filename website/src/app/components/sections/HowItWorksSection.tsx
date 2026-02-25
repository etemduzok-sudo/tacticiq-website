import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDataSafe } from '@/contexts/AdminDataContext';
import { Card } from '@/app/components/ui/card';
import { Calculator } from 'lucide-react';

export function HowItWorksSection() {
  const { t } = useLanguage();
  const adminData = useAdminDataSafe();
  
  // Get section settings
  const sectionSettings = adminData?.sectionSettings?.howItWorks ?? { enabled: true };
  
  // If section is disabled, don't render
  if (!sectionSettings.enabled) {
    return null;
  }

  const steps = [
    {
      number: '01',
      title: t('howItWorks.steps.step1.title'),
      description: t('howItWorks.steps.step1.desc'),
    },
    {
      number: '02',
      title: t('howItWorks.steps.step2.title'),
      description: t('howItWorks.steps.step2.desc'),
    },
    {
      number: '03',
      title: t('howItWorks.steps.step3.title'),
      description: t('howItWorks.steps.step3.desc'),
    },
    {
      number: '04',
      title: t('howItWorks.steps.step4.title'),
      description: t('howItWorks.steps.step4.desc'),
    },
    {
      number: '05',
      title: t('howItWorks.steps.step5.title'),
      description: t('howItWorks.steps.step5.desc'),
    },
    {
      number: '06',
      title: t('howItWorks.steps.step6.title'),
      description: t('howItWorks.steps.step6.desc'),
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-muted/50 dark:bg-[#0a1916]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {t('howItWorks.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {steps.map((step, index) => (
            <Card 
              key={index} 
              className="p-6 relative overflow-hidden group hover:shadow-lg transition-all bg-card/80 dark:bg-[#1a3d35]/40 border-secondary/20 backdrop-blur-sm hover:border-accent/40"
            >
              {/* Step Number Background */}
              <div className="absolute -top-4 -right-4 text-8xl font-bold text-accent/5 group-hover:text-accent/10 transition-colors">
                {step.number}
              </div>
              
              <div className="relative space-y-3">
                {/* Step Badge */}
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent text-accent-foreground font-bold shadow-lg">
                  {step.number}
                </div>
                
                <h3 className="text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Formula Card */}
        <div className="max-w-3xl mx-auto">
          <Card className="p-6 md:p-8 border-2 border-accent/30 bg-card/80 dark:bg-[#1a3d35]/40 backdrop-blur-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-3 justify-center">
                <Calculator className="size-6 text-accent" />
                <h3 className="text-xl font-bold text-foreground">{t('howItWorks.formula.title')}</h3>
              </div>
              
              <div className="bg-primary/5 dark:bg-primary/30 rounded-lg p-4 border-2 border-secondary/20">
                <p className="text-center font-mono font-semibold text-lg text-accent">
                  {t('howItWorks.formula.desc')}
                </p>
              </div>

              <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/30">
                <p className="text-sm text-muted-foreground text-center">
                  {t('howItWorks.formula.example')}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}