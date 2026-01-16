import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDataSafe } from '@/contexts/AdminDataContext';
import { Card } from '@/app/components/ui/card';
import { UserCheck } from 'lucide-react';

export function PlayerPredictionSection() {
  const { t } = useLanguage();
  const adminData = useAdminDataSafe();
  
  // Get section settings
  const sectionSettings = adminData?.sectionSettings?.playerPrediction ?? { enabled: true };
  
  // If section is disabled, don't render
  if (!sectionSettings.enabled) {
    return null;
  }

  const predictions = [
    { emoji: '⚽', key: 'goal' },
    { emoji: '🅰️', key: 'assist' },
    { emoji: '🟨', key: 'yellow' },
    { emoji: '🟨🟥', key: 'second_yellow' },
    { emoji: '🟥', key: 'red' },
    { emoji: '🔄', key: 'substituted' },
    { emoji: '🚑', key: 'injured' },
    { emoji: '🏆', key: 'mvp' },
  ];

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-full">
            <UserCheck className="size-5 text-secondary" />
            <span className="font-semibold text-secondary">{t('player.title')}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            {t('player.subtitle')}
          </h2>
        </div>

        {/* Prediction Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mb-8">
          {predictions.map((prediction, index) => (
            <Card 
              key={index} 
              className="p-6 hover:shadow-lg transition-all border-2 border-border/50"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{prediction.emoji}</div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-sm">
                    {t(`player.predictions.${prediction.key}.title`)}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t(`player.predictions.${prediction.key}.options`)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Note Card */}
        <div className="max-w-3xl mx-auto">
          <Card className="p-4 border-2 border-secondary/20 bg-secondary/5">
            <p className="text-center text-sm text-muted-foreground">
              💡 {t('player.note')}
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}