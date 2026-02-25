import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDataSafe } from '@/contexts/AdminDataContext';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Shield, Swords, Target, Activity, Layers, Brain } from 'lucide-react';

export function TrainingSection() {
  const { t } = useLanguage();
  const adminData = useAdminDataSafe();
  
  // Get section settings
  const sectionSettings = adminData?.sectionSettings?.training ?? { enabled: true };
  
  // If section is disabled, don't render
  if (!sectionSettings.enabled) {
    return null;
  }

  // Mobil ile aynı renk paleti (web görseli)
  const trainingTypes = [
    {
      icon: Shield,
      key: 'defense',
      cardBg: 'bg-blue-50 dark:bg-[#2A3642]',
      borderColor: 'border-blue-300 dark:border-[#4C7C9E]',
      iconColor: 'text-blue-500 dark:text-blue-400',
      pillBg: 'bg-blue-500 dark:bg-[#4C7C9E]',
    },
    {
      icon: Swords,
      key: 'attack',
      cardBg: 'bg-red-50 dark:bg-[#412F34]',
      borderColor: 'border-red-300 dark:border-[#7B3F4A]',
      iconColor: 'text-red-500 dark:text-red-400',
      pillBg: 'bg-red-500 dark:bg-[#7B3F4A]',
    },
    {
      icon: Target,
      key: 'midfield',
      cardBg: 'bg-purple-50 dark:bg-[#3D304D]',
      borderColor: 'border-purple-300 dark:border-[#6B4B8A]',
      iconColor: 'text-purple-500 dark:text-purple-400',
      pillBg: 'bg-purple-500 dark:bg-[#6B4B8A]',
    },
    {
      icon: Activity,
      key: 'physical',
      cardBg: 'bg-green-50 dark:bg-[#314736]',
      borderColor: 'border-green-300 dark:border-[#528A5B]',
      iconColor: 'text-green-500 dark:text-green-400',
      pillBg: 'bg-green-500 dark:bg-[#528A5B]',
    },
    {
      icon: Layers,
      key: 'tactical',
      cardBg: 'bg-amber-50 dark:bg-[#3C3F2B]',
      borderColor: 'border-amber-300 dark:border-[#8D7A4D]',
      iconColor: 'text-amber-500 dark:text-amber-400',
      pillBg: 'bg-amber-500 dark:bg-[#8D7A4D]',
    },
    {
      icon: Brain,
      key: 'player',
      cardBg: 'bg-orange-50 dark:bg-[#4C392D]',
      borderColor: 'border-orange-300 dark:border-[#9E6B3F]',
      iconColor: 'text-orange-500 dark:text-orange-400',
      pillBg: 'bg-orange-500 dark:bg-[#9E6B3F]',
    },
  ];

  return (
    <section id="analysis-focus" className="py-16 md:py-24 bg-muted/50 dark:bg-[#0F2A24]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {t('analysisFocus.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('analysisFocus.subtitle')}
          </p>
        </div>

        {/* Training Types Grid - 3 columns x 2 rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
          {trainingTypes.map((training, index) => {
            const Icon = training.icon;
            return (
              <Card 
                key={index} 
                className={`p-6 hover:shadow-lg transition-all border-2 ${training.cardBg} ${training.borderColor}`}
              >
                <div className="space-y-4">
                  {/* Icon */}
                  <div className={training.iconColor}>
                    <Icon className="size-8" />
                  </div>
                  
                  {/* Name */}
                  <h3 className="font-semibold text-base text-foreground dark:text-white">
                    {t(`analysisFocus.types.${training.key}.name`)}
                  </h3>
                  
                  {/* Bonus Badge */}
                  <Badge 
                    variant="secondary" 
                    className={`${training.pillBg} text-white border-0`}
                  >
                    {t(`analysisFocus.types.${training.key}.bonus`)}
                  </Badge>
                  
                  {/* Description */}
                  <p className="text-sm text-muted-foreground dark:text-slate-200">
                    {t(`analysisFocus.types.${training.key}.desc`)}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Example Note */}
        <div className="text-center">
          <Card className="inline-block p-4 border-2 border-amber-500/30 bg-amber-100/50 dark:bg-amber-500/10">
            <p className="text-sm text-amber-800 dark:text-amber-100 max-w-3xl">
              💡 {t('analysisFocus.example')}
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}