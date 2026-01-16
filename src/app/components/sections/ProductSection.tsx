import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDataSafe } from '@/contexts/AdminDataContext';
import { Card } from '@/app/components/ui/card';
import { AlertCircle, Users, Target, Star, Dumbbell, UserCheck, BarChart3 } from 'lucide-react';

export function ProductSection() {
  const { t } = useLanguage();
  const adminData = useAdminDataSafe();
  
  // Get section settings
  const sectionSettings = adminData?.sectionSettings?.product ?? { enabled: true };
  
  // If section is disabled, don't render
  if (!sectionSettings.enabled) {
    return null;
  }

  const features = [
    {
      icon: Users,
      title: t('product.features.squad.title'),
      description: t('product.features.squad.desc'),
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      icon: Target,
      title: t('product.features.predictions.title'),
      description: t('product.features.predictions.desc'),
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      icon: Star,
      title: t('product.features.focus.title'),
      description: t('product.features.focus.desc'),
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      icon: Dumbbell,
      title: t('product.features.training.title'),
      description: t('product.features.training.desc'),
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      icon: UserCheck,
      title: t('product.features.players.title'),
      description: t('product.features.players.desc'),
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      icon: BarChart3,
      title: t('product.features.analysis.title'),
      description: t('product.features.analysis.desc'),
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              {t('product.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t('product.subtitle')}
            </p>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              {t('product.description')}
            </p>
          </div>

          {/* Non-Gambling Statement */}
          <Card className="p-6 md:p-8 border-2 border-secondary/20 bg-secondary/5">
            <div className="flex gap-4">
              <AlertCircle className="size-6 text-secondary shrink-0 mt-1" />
              <div className="space-y-3">
                <p className="font-semibold text-xl">
                  {t('product.notGambling')}
                </p>
                <p className="text-muted-foreground">
                  {t('product.notGamblingDesc')}
                </p>
              </div>
            </div>
          </Card>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="p-6 hover:shadow-lg transition-shadow border-2 border-border/50"
              >
                <div className="space-y-4">
                  <div className={`inline-flex p-3 rounded-lg ${feature.bgColor} ${feature.color}`}>
                    <feature.icon className="size-6" />
                  </div>
                  <h3 className="text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}