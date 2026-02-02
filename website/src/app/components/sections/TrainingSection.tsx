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
      cardBg: 'bg-[#2A3642]',
      borderColor: 'border-[#4C7C9E]',
      iconColor: 'text-blue-400',
      pillBg: 'bg-[#4C7C9E]',
    },
    {
      icon: Swords,
      key: 'attack',
      cardBg: 'bg-[#412F34]',
      borderColor: 'border-[#7B3F4A]',
      iconColor: 'text-red-400',
      pillBg: 'bg-[#7B3F4A]',
    },
    {
      icon: Target,
      key: 'midfield',
      cardBg: 'bg-[#3D304D]',
      borderColor: 'border-[#6B4B8A]',
      iconColor: 'text-purple-400',
      pillBg: 'bg-[#6B4B8A]',
    },
    {
      icon: Activity,
      key: 'physical',
      cardBg: 'bg-[#314736]',
      borderColor: 'border-[#528A5B]',
      iconColor: 'text-green-400',
      pillBg: 'bg-[#528A5B]',
    },
    {
      icon: Layers,
      key: 'tactical',
      cardBg: 'bg-[#3C3F2B]',
      borderColor: 'border-[#8D7A4D]',
      iconColor: 'text-amber-400',
      pillBg: 'bg-[#8D7A4D]',
    },
    {
      icon: Brain,
      key: 'player',
      cardBg: 'bg-[#4C392D]',
      borderColor: 'border-[#9E6B3F]',
      iconColor: 'text-orange-400',
      pillBg: 'bg-[#9E6B3F]',
    },
  ];

  return (
    <section id="analysis-focus" className="py-16 md:py-24 bg-[#0F2A24]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            {t('analysisFocus.title')}
          </h2>
          <p className="text-lg text-slate-200 max-w-2xl mx-auto">
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
                className={`p-6 hover:shadow-lg transition-all border-2 ${training.cardBg} ${training.borderColor} text-white`}
              >
                <div className="space-y-4">
                  {/* Icon */}
                  <div className={training.iconColor}>
                    <Icon className="size-8" />
                  </div>
                  
                  {/* Name */}
                  <h3 className="font-semibold text-base text-white">
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
                  <p className="text-sm text-slate-200">
                    {t(`analysisFocus.types.${training.key}.desc`)}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Example Note */}
        <div className="text-center">
          <Card className="inline-block p-4 border-2 border-amber-500/30 bg-amber-500/10">
            <p className="text-sm text-amber-100 max-w-3xl">
              💡 {t('analysisFocus.example')}
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}