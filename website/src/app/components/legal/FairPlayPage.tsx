import { useLanguage } from '@/contexts/LanguageContext';
import { LegalPageLayout } from '@/app/components/legal/LegalPageLayout';
import { Card } from '@/app/components/ui/card';
import { ShieldCheck, Ban, Target, Award } from 'lucide-react';

export function FairPlayPage() {
  const { t } = useLanguage();

  const statements = [
    {
      icon: Ban,
      title: t('fairPlay.noBetting'),
      description: 'TacticIQ does not involve any real money wagering. Users do not place bets or risk any financial capital.',
    },
    {
      icon: Target,
      title: t('fairPlay.skillBased'),
      description: 'All predictions and evaluations are based on user skill, analytical ability, and football knowledge.',
    },
    {
      icon: Award,
      title: t('fairPlay.virtualPoints'),
      description: 'Points, XP, badges, and rankings are entirely virtual rewards with no monetary value or real-world exchange.',
    },
  ];

  return (
    <LegalPageLayout 
      title={t('legal.fairPlay.title')} 
      lastUpdated="January 13, 2026"
    >
      <div className="space-y-8">
        {/* Introduction */}
        <Card className="p-6 border-2 border-secondary/20 bg-secondary/5">
          <div className="flex gap-4">
            <ShieldCheck className="size-8 text-secondary shrink-0" />
            <div>
              <h2 className="text-2xl font-bold mb-4">{t('fairPlay.intro')}</h2>
              <p className="text-lg text-muted-foreground">
                TacticIQ is a professional football intelligence and match analysis platform. 
                This is NOT a betting, gambling, or casino application.
              </p>
            </div>
          </div>
        </Card>

        {/* Key Statements */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Core Principles</h2>
          
          {statements.map((statement, index) => (
            <Card key={index} className="p-6">
              <div className="flex gap-4">
                <div className="p-3 rounded-lg bg-secondary/10 h-fit">
                  <statement.icon className="size-6 text-secondary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{statement.title}</h3>
                  <p className="text-muted-foreground">{statement.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Detailed Explanation */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">What TacticIQ Is</h2>
          <ul className="space-y-3 list-disc list-inside text-muted-foreground">
            <li>A skill-based football analysis and prediction platform</li>
            <li>An educational tool for improving football tactical knowledge</li>
            <li>A competitive ranking system based on analytical accuracy</li>
            <li>A gamified learning experience with virtual rewards</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">What TacticIQ Is NOT</h2>
          <ul className="space-y-3 list-disc list-inside text-muted-foreground">
            <li>NOT a betting or gambling platform</li>
            <li>NOT a real-money wagering service</li>
            <li>NOT a casino or games of chance application</li>
            <li>NOT a platform offering monetary rewards or financial payouts</li>
            <li>NOT a service that displays betting odds or bookmaker information</li>
          </ul>
        </div>

        {/* Legal Compliance */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Legal Compliance</h2>
          <p className="text-muted-foreground">
            TacticIQ is designed to comply with app store guidelines, advertising platform policies, 
            and international regulations regarding skill-based applications. Users do not purchase 
            virtual currency, do not receive monetary compensation, and engage purely for educational 
            and entertainment purposes.
          </p>
        </div>

        {/* Age Restriction */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Age and Eligibility</h2>
          <p className="text-muted-foreground">
            While TacticIQ is not a gambling service, we recommend users be at least 16 years of age 
            to ensure they have the analytical maturity to benefit from tactical analysis features.
          </p>
        </div>
      </div>
    </LegalPageLayout>
  );
}
