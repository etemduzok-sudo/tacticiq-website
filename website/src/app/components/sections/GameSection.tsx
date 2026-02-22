/**
 * Game Section Component
 * Oyunun nasıl çalıştığını anlatan tanıtım bölümü
 * Admin panelinden açılıp kapatılabilir (settings.gameEnabled)
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDataSafe } from '@/contexts/AdminDataContext';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Gamepad2, Trophy, TrendingUp, Shield, Target, Users, BarChart3, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';

export function GameSection() {
  const { t } = useLanguage();
  const adminData = useAdminDataSafe();
  const sectionSettings = adminData?.sectionSettings?.game ?? { enabled: false };

  if (!sectionSettings.enabled) {
    return null;
  }

  const features = [
    {
      icon: Target,
      title: t('game.features.predictions') || 'Maç Tahmini',
      description: t('game.features.predictionsDesc') || 'Skor, ilk gol, kartlar, kornerler - tüm detayları tahmin et',
      color: 'text-[#1FA2A6]',
    },
    {
      icon: Users,
      title: t('game.features.leaderboard') || 'Kadro Tahmini',
      description: t('game.features.leaderboardDesc') || 'İlk 11 ve formasyon tahminleriyle puan kazan',
      color: 'text-[#C9A44C]',
    },
    {
      icon: BarChart3,
      title: t('game.features.skills') || 'Analiz & Puanlama',
      description: t('game.features.skillsDesc') || '1000 puan sistemi, cluster analizi ve stratejik odak bonusları',
      color: 'text-[#1FA2A6]',
    },
    {
      icon: Trophy,
      title: t('game.features.fairPlay') || 'Sıralama & Rozetler',
      description: t('game.features.fairPlayDesc') || 'Haftalık/aylık sıralama, seviye sistemi ve başarı rozetleri',
      color: 'text-[#C9A44C]',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Maç Seç',
      description: 'Canlı veya yaklaşan maçlardan birini seç. 50+ lig desteklenir.',
    },
    {
      number: '02',
      title: 'Tahmin Yap',
      description: 'Skor, ilk gol, kartlar, kornerler ve kadro tahmini yap. Stratejik odak seç.',
    },
    {
      number: '03',
      title: 'Puan Kazan',
      description: 'Maç bitince tahminlerin otomatik puanlanır. 1000 tam puan üzerinden.',
    },
    {
      number: '04',
      title: 'Sıralamada Yüksel',
      description: 'Topluluk içinde sıralamanda yüksel, rozetler kazan, seviye atla.',
    },
  ];

  return (
    <section id="game" className="py-24 bg-gradient-to-b from-white to-gray-50 dark:from-[#0F2A24] dark:to-[#0a1f1a]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-[#1FA2A6] text-white hover:bg-[#1FA2A6]/90">
            {t('game.badge') || 'Beceri Bazlı Tahmin Oyunu'}
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#0F2A24] dark:text-white">
            {t('game.title') || 'Futbol Bilgini Göster'}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t('game.description') || 'Şans değil, bilgi ve analiz. Maç skorundan kadro tahminine kadar her detayı analiz et ve becerini kanıtla.'}
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow dark:bg-[#0F2A24]/80 dark:border-[#1FA2A6]/30">
                <CardHeader>
                  <feature.icon className={`w-12 h-12 ${feature.color} mb-4`} />
                  <CardTitle className="text-lg dark:text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="dark:text-gray-300">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <h3 className="text-3xl font-bold text-center mb-12 text-[#0F2A24] dark:text-white">
            Nasıl Çalışır?
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#1FA2A6] to-[#C9A44C] flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{step.number}</span>
                </div>
                <h4 className="text-xl font-semibold mb-2 text-[#0F2A24] dark:text-white">{step.title}</h4>
                <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 3 Saha Sistemi Tanıtımı */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <Card className="bg-gradient-to-r from-[#0F2A24] to-[#1a3d35] text-white border-[#1FA2A6]/40 overflow-hidden">
            <CardContent className="pt-8 pb-8">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[#1FA2A6]/20 flex items-center justify-center">
                    <Target className="w-7 h-7 text-[#1FA2A6]" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Benim Tahminim</h4>
                  <p className="text-sm text-gray-300">Kadro, formasyon ve oyuncu tahminlerini yap</p>
                </div>
                <div>
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[#C9A44C]/20 flex items-center justify-center">
                    <Users className="w-7 h-7 text-[#C9A44C]" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Topluluk</h4>
                  <p className="text-sm text-gray-300">Diğer kullanıcıların tahminlerini karşılaştır</p>
                </div>
                <div>
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <BarChart3 className="w-7 h-7 text-green-400" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Gerçek</h4>
                  <p className="text-sm text-gray-300">API'den gelen gerçek kadro ve canlı veriler</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-[#1FA2A6] to-[#C9A44C] hover:opacity-90 text-white px-12 py-6 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all"
          >
            <Smartphone className="w-6 h-6 mr-2" />
            Uygulamayı İndir
          </Button>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {t('game.notBetting') || 'Bu bir bahis uygulaması değildir. Tamamen beceri bazlı tahmin oyunudur.'}
          </p>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 max-w-2xl mx-auto"
        >
          <Card className="bg-[#0F2A24] text-white border-[#1FA2A6]">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-[#C9A44C] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">{t('game.security.title') || 'Güvenli & Adil Oyun'}</h3>
                  <p className="text-sm text-gray-300">
                    {t('game.security.description') || 'TacticIQ tamamen beceri bazlıdır. Şans faktörü yoktur. Tüm puanlamalar algoritma ile hesaplanır. Bahis veya para ödülü içermez.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
