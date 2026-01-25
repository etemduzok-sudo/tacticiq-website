import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDataSafe } from '@/contexts/AdminDataContext';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Star } from 'lucide-react';

// Varsayılan kategoriler (admin panelde kategori yoksa kullanılır)
const defaultCategories = [
  { id: '1', key: 'halftime_score', title: 'İlk Yarı Skor Tahmini', description: 'İlk yarı için tam skor tahmini yapın (örn: 1-0, 2-1)', emoji: '⚽', featured: true, enabled: true, order: 1 },
  { id: '2', key: 'halftime_extra', title: 'İlk Yarı Ek Tahminler', description: 'Alt/Üst gol, karşılıklı gol, handikap tahminleri', emoji: '⏱️', featured: false, enabled: true, order: 2 },
  { id: '3', key: 'fulltime_score', title: 'Maç Sonu Skor Tahmini', description: 'Normal süre sonunda tam skor tahmini yapın', emoji: '⚽', featured: true, enabled: true, order: 3 },
  { id: '4', key: 'fulltime_extra', title: 'Maç Sonu Ek Tahminler', description: 'Gol yok, tek taraflı gol, farklı galip tahminleri', emoji: '⏱️', featured: false, enabled: true, order: 4 },
  { id: '5', key: 'yellow_cards', title: 'Sarı Kart Sayısı', description: 'Toplam sarı kart sayısını tahmin edin (0-8+)', emoji: '🟨', featured: false, enabled: true, order: 5 },
  { id: '6', key: 'red_cards', title: 'Kırmızı Kart', description: 'Kırmızı kart görülüp görülmeyeceğini tahmin edin', emoji: '🟥', featured: false, enabled: true, order: 6 },
  { id: '7', key: 'total_shots', title: 'Toplam Şut Sayısı', description: 'Her iki takımın toplam şut sayısını tahmin edin', emoji: '🎯', featured: false, enabled: true, order: 7 },
  { id: '8', key: 'shots_on_target', title: 'İsabetli Şut Sayısı', description: 'Kaleye giden şut sayısını tahmin edin', emoji: '🎯', featured: false, enabled: true, order: 8 },
  { id: '9', key: 'tempo', title: 'Maç Temposu', description: 'Maçın hızlı, dengeli veya yavaş geçeceğini tahmin edin', emoji: '🏃‍♂️', featured: false, enabled: true, order: 9 },
  { id: '10', key: 'scenario', title: 'Maç Senaryosu', description: 'Maçın nasıl gelişeceğini tahmin edin (baskılı başlangıç, geç gol vb.)', emoji: '🧠', featured: true, enabled: true, order: 10 },
  { id: '11', key: 'total_goals', title: 'Toplam Gol Sayısı', description: 'Maçta atılacak toplam gol sayısını tahmin edin (0-5+)', emoji: '🧮', featured: true, enabled: true, order: 11 },
  { id: '12', key: 'first_goal', title: 'İlk Gol Zamanı', description: 'İlk golün hangi dakika aralığında atılacağını tahmin edin', emoji: '⏰', featured: true, enabled: true, order: 12 },
  { id: '13', key: 'possession', title: 'Top Hakimiyeti', description: 'Hangi takımın daha fazla top hakimiyetine sahip olacağını tahmin edin', emoji: '📊', featured: false, enabled: true, order: 13 },
  { id: '14', key: 'corners', title: 'Korner Sayısı', description: 'Toplam korner sayısını tahmin edin (0-15+)', emoji: '🚩', featured: false, enabled: true, order: 14 },
  { id: '15', key: 'goal_expectation', title: 'Gol Beklentisi (xG)', description: 'Her iki takımın beklenen gol değerini (Expected Goals) tahmin edin', emoji: '⚡', featured: true, enabled: true, order: 15 },
];

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

  // Admin panelden gelen kategorileri al, yoksa varsayılanları kullan
  const adminCategories = adminData?.featureCategories;
  const categories = (adminCategories && adminCategories.length > 0)
    ? adminCategories
        .filter(c => c.enabled)
        .sort((a, b) => a.order - b.order)
    : defaultCategories.filter(c => c.enabled);

  // Aktif kategori sayısı
  const activeCount = categories.length;

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
          {categories.map((category) => {
            // Çeviri sisteminden başlık ve açıklama al, yoksa veritabanı değerini kullan
            const translatedTitle = t(`features.categories.${category.key}.title`) || category.title;
            const translatedDesc = t(`features.categories.${category.key}.desc`) || category.description;
            
            return (
              <Card 
                key={category.id} 
                className={`p-4 hover:shadow-lg transition-all border-2 ${
                  category.featured 
                    ? 'border-accent/30 bg-accent/5' 
                    : 'border-border/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{category.emoji}</div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm">
                        {translatedTitle}
                      </h3>
                      {category.featured && (
                        <Star className="size-4 text-accent fill-accent shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {translatedDesc}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
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
