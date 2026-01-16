import { useEffect, useState } from 'react';
import { Users, TrendingUp, Calendar, Activity } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function VisitorCounter() {
  const { t } = useLanguage();
  const [visitors, setVisitors] = useState({
    total: 0,
    online: 0,
    today: 0,
    month: 0,
  });

  useEffect(() => {
    // Real visitor tracking - starts from 0
    // Will be replaced with actual analytics data (Google Analytics, Netlify Analytics, etc.)
    const targetValues = {
      total: 0,
      online: 0,
      today: 0,
      month: 0,
    };

    setVisitors(targetValues);
  }, []);

  const stats = [
    {
      icon: Users,
      label: t('visitor.total'),
      value: visitors.total.toLocaleString(),
      color: 'text-secondary',
    },
    {
      icon: Activity,
      label: t('visitor.online'),
      value: visitors.online.toLocaleString(),
      color: 'text-green-500',
      pulse: true,
    },
    {
      icon: TrendingUp,
      label: t('visitor.today'),
      value: visitors.today.toLocaleString(),
      color: 'text-accent',
    },
    {
      icon: Calendar,
      label: t('visitor.month'),
      value: visitors.month.toLocaleString(),
      color: 'text-blue-400',
    },
  ];

  return (
    <div className="bg-muted/30 rounded-lg p-4 md:p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm transition-all hover:bg-background/70"
            >
              <div className={`relative ${stat.color}`}>
                <Icon className="size-5" />
                {stat.pulse && (
                  <span className="absolute inset-0 animate-ping">
                    <Icon className="size-5 opacity-75" />
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {stat.label}
                </span>
                <span className="text-sm md:text-base font-semibold">
                  {stat.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
