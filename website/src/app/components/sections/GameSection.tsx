/**
 * Game Section Component
 * Oyun bölümü - Kullanıcıların web üzerinden oyun oynayabileceği alan
 * Admin panelinden açılıp kapatılabilir (settings.gameEnabled)
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDataSafe } from '@/contexts/AdminDataContext';
import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Gamepad2, Trophy, TrendingUp, Shield } from 'lucide-react';
import { GameModal } from '@/app/components/game/GameModal';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export function GameSection() {
  const { t } = useLanguage();
  
  // Safely get admin data with fallback
  const adminData = useAdminDataSafe();
  
  // Get section settings - Admin panel kontrolü
  const sectionSettings = adminData?.sectionSettings?.game ?? { enabled: false };
  const isGameEnabled = sectionSettings.enabled; // Admin panelinden açık/kapalı kontrolü
  
  const [isGameOpen, setIsGameOpen] = useState(false);

  if (!isGameEnabled) {
    return null;
  }

  const handlePlayGame = () => {
    // Show "Coming Soon" notification instead of opening game
    toast.info(t('game.comingSoon') || 'Yakında! / Coming Soon! 🎮', {
      description: t('game.comingSoonDesc') || 'Oyun özelliği çok yakında yayınlanacak. / Game feature will be released very soon.',
    });
  };

  const features = [
    {
      icon: Gamepad2,
      title: t('game.features.predictions'),
      description: t('game.features.predictionsDesc'),
      color: 'text-[#1FA2A6]',
    },
    {
      icon: Trophy,
      title: t('game.features.leaderboard'),
      description: t('game.features.leaderboardDesc'),
      color: 'text-[#C9A44C]',
    },
    {
      icon: TrendingUp,
      title: t('game.features.skills'),
      description: t('game.features.skillsDesc'),
      color: 'text-[#1FA2A6]',
    },
    {
      icon: Shield,
      title: t('game.features.fairPlay'),
      description: t('game.features.fairPlayDesc'),
      color: 'text-[#C9A44C]',
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
            {t('game.badge')}
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#0F2A24] dark:text-white">
            {t('game.title')}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t('game.description')}
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className={`w-12 h-12 ${feature.color} mb-4`} />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Button
            onClick={handlePlayGame}
            size="lg"
            className="bg-gradient-to-r from-[#1FA2A6] to-[#C9A44C] hover:opacity-90 text-white px-12 py-6 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all"
          >
            <Gamepad2 className="w-6 h-6 mr-2" />
            {t('game.playNow')}
          </Button>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {t('game.notBetting')}
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
                  <h3 className="font-semibold mb-2">{t('game.security.title')}</h3>
                  <p className="text-sm text-gray-300">{t('game.security.description')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}