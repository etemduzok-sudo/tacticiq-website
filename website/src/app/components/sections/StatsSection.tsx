import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminData } from '@/contexts/AdminDataContext';
import { TrendingUp, Users, Trophy, Globe } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Skeleton } from '@/app/components/ui/skeleton';
import { useState, useEffect } from 'react';

export function StatsSection() {
  const { t } = useLanguage();
  const { stats } = useAdminData();
  const [isLoading, setIsLoading] = useState(true);
  const [animatedValues, setAnimatedValues] = useState<string[]>([]);

  // Loading simulation - context'ten veri geldiğinde false olur
  useEffect(() => {
    if (stats) {
      // Küçük bir gecikme ile loading'i kapat (smooth transition için)
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [stats]);

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
      value: stats.totalPredictions 
        ? stats.totalPredictions >= 1000000 
          ? `${(stats.totalPredictions / 1000000).toFixed(1)}M+`
          : `${(stats.totalPredictions / 1000).toFixed(0)}K+`
        : '1M+',
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

  // Animated value display - sayı artış animasyonu için
  useEffect(() => {
    if (!isLoading && stats) {
      const values = [
        stats.averageRating || '4.9/5',
        stats.totalUsers || '50K+',
        stats.totalPredictions 
          ? stats.totalPredictions >= 1000000 
            ? `${(stats.totalPredictions / 1000000).toFixed(1)}M+`
            : `${(stats.totalPredictions / 1000).toFixed(0)}K+`
          : '1M+',
        stats.totalLeagues ? `${stats.totalLeagues}+` : '25+',
      ];
      setAnimatedValues(values);
    }
  }, [isLoading, stats]);

  // Skeleton Loading State
  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[1, 2, 3, 4].map((index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                  </div>
                  <div className="text-center space-y-2">
                    <Skeleton className="h-10 w-24 mx-auto" />
                    <Skeleton className="h-4 w-32 mx-auto" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .stats-card-animate {
          animation: fadeInUp 0.6s ease-out;
          animation-fill-mode: both;
        }
        .stats-value-animate {
          animation: fadeInUp 0.8s ease-out;
          animation-fill-mode: both;
        }
      `}</style>
      <section className="py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {statsData.map((stat, index) => (
              <Card 
                key={index} 
                className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 stats-card-animate"
                style={{ 
                  animationDelay: `${index * 100}ms`
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div 
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center transition-transform duration-300 hover:scale-110`}
                    >
                      <stat.icon className="size-6 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <div 
                      className="text-3xl md:text-4xl font-bold text-secondary mb-2 transition-all duration-500 stats-value-animate"
                      style={{ 
                        animationDelay: `${(index * 100) + 200}ms`
                      }}
                    >
                      {animatedValues[index] || stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}