import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDataSafe } from '@/contexts/AdminDataContext';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Shield, Swords, Target, Activity, Layers } from 'lucide-react';

export function TrainingSection() {
  const { t } = useLanguage();
  const adminData = useAdminDataSafe();
  
  // Get section settings
  const sectionSettings = adminData?.sectionSettings?.training ?? { enabled: true };
  
  // If section is disabled, don't render
  if (!sectionSettings.enabled) {
    return null;
  }

  const trainingTypes = [
    {
      icon: Shield,
      key: 'defense',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    {
      icon: Swords,
      key: 'attack',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    },
    {
      icon: Target,
      key: 'midfield',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
    },
    {
      icon: Activity,
      key: 'physical',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
    },
    {
      icon: Layers,
      key: 'tactical',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/30',
    },
  ];

  return (
    <section id="analysis-focus" className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">
            {t('analysisFocus.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('analysisFocus.subtitle')}
          </p>
        </div>

        {/* Training Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-7xl mx-auto mb-8">
          {trainingTypes.map((training, index) => {
            const Icon = training.icon;
            return (
              <Card 
                key={index} 
                className={`p-6 hover:shadow-lg transition-all border-2 ${training.borderColor} ${training.bgColor}`}
              >
                <div className="space-y-4">
                  {/* Icon */}
                  <div className={`${training.color}`}>
                    <Icon className="size-8" />
                  </div>
                  
                  {/* Name */}
                  <h3 className="font-semibold text-base">
                    {t(`analysisFocus.types.${training.key}.name`)}
                  </h3>
                  
                  {/* Bonus Badge */}
                  <Badge 
                    variant="secondary" 
                    className={`${training.bgColor} ${training.color} border ${training.borderColor}`}
                  >
                    {t(`analysisFocus.types.${training.key}.bonus`)}
                  </Badge>
                  
                  {/* Description */}
                  <p className="text-sm text-muted-foreground">
                    {t(`analysisFocus.types.${training.key}.desc`)}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Example Note */}
        <div className="text-center">
          <Card className="inline-block p-4 border-2 border-border/50 bg-muted/50">
            <p className="text-sm text-muted-foreground max-w-3xl">
              {t('analysisFocus.example')}
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}