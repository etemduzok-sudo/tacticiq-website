import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminData } from '@/contexts/AdminDataContext';
import { TrendingUp, Users, Trophy, Globe } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';

export function StatsSection() {
  const { t } = useLanguage();
  const { stats } = useAdminData();

  // Hero altı istatistikleri - Admin panelinden yönetilebilir
  const statsData = [
    {
      icon: Trophy,
      value: stats.averageRating || '4.9/5',
      label: t('testimonials.stats.rating') || 'Ortalama Değerlendirme',
      color: 'from-yellow-500 to-amber-500',
    },
    {
      icon: Users,
      value: stats.totalUsers || '50K+',
      label: t('testimonials.stats.users') || 'Aktif Kullanıcı',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: TrendingUp,
      value: stats.totalPredictions ? `${(stats.totalPredictions / 1000000).toFixed(1)}M+` : '1M+',
      label: t('testimonials.stats.predictions') || 'Yapılan Tahmin',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Globe,
      value: stats.totalLeagues ? `${stats.totalLeagues}+` : '25+',
      label: t('testimonials.stats.leagues') || 'Kapsanan Lig',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {statsData.map((stat, index) => (
            <Card key={index} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="size-6 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-secondary mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}