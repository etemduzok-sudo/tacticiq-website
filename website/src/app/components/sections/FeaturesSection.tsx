import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDataSafe } from '@/contexts/AdminDataContext';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Star } from 'lucide-react';

export function FeaturesSection() {
  const { t } = useLanguage();
  const adminData = useAdminDataSafe();
  
  // Get section settings
  const sectionSettings = adminData?.sectionSettings?.features ?? {
    enabled: true,
    maxFeatures: 5,
  };
  
  // If section is disabled, don't render
  if (!sectionSettings.enabled) {
    return null;
  }

  const categories = [
    {
      emoji: '⚽',
      key: 'halftime_score',
      focusable: true,
    },
    {
      emoji: '⏱️',
      key: 'halftime_extra',
      focusable: false,
    },
    {
      emoji: '⚽',
      key: 'fulltime_score',
      focusable: true,
    },
    {
      emoji: '⏱️',
      key: 'fulltime_extra',
      focusable: false,
    },
    {
      emoji: '🟨',
      key: 'yellow_cards',
      focusable: false,
    },
    {
      emoji: '🟥',
      key: 'red_cards',
      focusable: false,
    },
    {
      emoji: '🎯',
      key: 'total_shots',
      focusable: false,
    },
    {
      emoji: '🎯',
      key: 'shots_on_target',
      focusable: false,
    },
    {
      emoji: '🏃‍♂️',
      key: 'tempo',
      focusable: false,
    },
    {
      emoji: '🧠',
      key: 'scenario',
      focusable: true,
    },
    {
      emoji: '🧮',
      key: 'total_goals',
      focusable: true,
    },
    {
      emoji: '⏰',
      key: 'first_goal',
      focusable: true,
    },
    {
      emoji: '📊',
      key: 'possession',
      focusable: false,
    },
    {
      emoji: '🚩',
      key: 'corners',
      focusable: false,
    },
    {
      emoji: '⚡',
      key: 'goal_expectation',
      focusable: true,
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">
            {t('features.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
          <Badge variant="secondary" className="px-4 py-2 text-base">
            {t('features.totalCategories')}
          </Badge>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto mb-8">
          {categories.map((category, index) => (
            <Card 
              key={index} 
              className={`p-4 hover:shadow-lg transition-all border-2 ${
                category.focusable 
                  ? 'border-accent/30 bg-accent/5' 
                  : 'border-border/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{category.emoji}</div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm">
                      {t(`features.categories.${category.key}.title`)}
                    </h3>
                    {category.focusable && (
                      <Star className="size-4 text-accent fill-accent shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t(`features.categories.${category.key}.desc`)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Focus Note */}
        <div className="text-center">
          <Card className="inline-block p-4 border-2 border-accent/20 bg-accent/5">
            <p className="text-sm font-medium flex items-center gap-2">
              <Star className="size-4 text-accent fill-accent" />
              {t('features.focusNote')}
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}