// Badge System Constants
// 40 Progressive Badges – 10 satır x 4 sütun

export interface BadgeDefinition {
  id: string;
  name: string;
  shortName?: string; // Tek kelime kısa isim (opsiyonel)
  description: string;
  howToEarn: string;
  emoji: string;
  tier: 1 | 2 | 3 | 4 | 5;
  tierName: 'Çaylak' | 'Amatör' | 'Profesyonel' | 'Uzman' | 'Efsane';
  color: string;
  category: 'Tempo' | 'Disiplin' | 'Kondisyon' | 'Yıldız' | 'Genel';
}

export const ALL_BADGES: BadgeDefinition[] = [
  // 🟢 Seviye 1: Çaylak (Kolay - Başlangıç için)
  {
    id: 'first-analysis',
    name: 'İlk Analiz',
    description: 'İlk maç tahminini tamamladın',
    howToEarn: 'İlk maç tahminini tamamla',
    emoji: '🎯',
    tier: 1,
    tierName: 'Çaylak',
    color: '#10B981',
    category: 'Genel',
  },
  {
    id: 'warm-up',
    name: 'Isınma Turu',
    description: '100 puan barajını geçtin',
    howToEarn: 'İlk kez 100 puan barajını geç',
    emoji: '🔥',
    tier: 1,
    tierName: 'Çaylak',
    color: '#10B981',
    category: 'Genel',
  },
  {
    id: 'strategist',
    name: 'Stratejist',
    description: 'Analiz Odağı seçerek maç tamamladın',
    howToEarn: "İlk kez bir 'Analiz Odağı' seçerek maç tamamla",
    emoji: '🧠',
    tier: 1,
    tierName: 'Çaylak',
    color: '#10B981',
    category: 'Tempo',
  },
  {
    id: 'punctual',
    name: 'Dakik',
    description: 'Gol dakikasını ±5 dakika sapmayla bildin',
    howToEarn: 'İlk kez bir gol dakikasını ±5 dakika sapmayla bil',
    emoji: '⏱️',
    tier: 1,
    tierName: 'Çaylak',
    color: '#10B981',
    category: 'Tempo',
  },

  // 🟡 Seviye 2: Amatör (Biraz Çaba Gerektiren)
  {
    id: 'streak-starter',
    name: 'Seri Başı',
    description: 'Üst üste 3 maçta puan kazandın',
    howToEarn: 'Üst üste 3 maçta puan kazan',
    emoji: '🔗',
    tier: 2,
    tierName: 'Amatör',
    color: '#F59E0B',
    category: 'Disiplin',
  },
  {
    id: 'card-master',
    name: 'Kart Hamili',
    description: '10 kez kart tahminini doğru yaptın',
    howToEarn: 'Toplamda 10 kez sarı/kırmızı kart tahminini doğru yap',
    emoji: '🟨',
    tier: 2,
    tierName: 'Amatör',
    color: '#F59E0B',
    category: 'Disiplin',
  },
  {
    id: 'squad-engineer',
    name: 'Kadro Mühendisi',
    description: '5 kez oyuncu değişikliği tahmininde başarılı oldun',
    howToEarn: '5 kez oyuncu değişikliği tahmininde başarılı ol',
    emoji: '🔄',
    tier: 2,
    tierName: 'Amatör',
    color: '#F59E0B',
    category: 'Kondisyon',
  },
  {
    id: 'local-hero',
    name: 'Yerel Kahraman',
    description: 'Favori takımını %70 isabetle analiz ettin',
    howToEarn: 'Kendi seçtiğin favori takımın bir maçını %70 isabetle analiz et',
    emoji: '🏠',
    tier: 2,
    tierName: 'Amatör',
    color: '#F59E0B',
    category: 'Yıldız',
  },

  // 🟠 Seviye 3: Profesyonel (Zorlayıcı)
  {
    id: 'tempo-master',
    name: 'Tempo Ustası',
    description: 'Tempo Analizi modunda 5 kez %80 başarı yakaladın',
    howToEarn: "'Tempo Analizi' modunda 5 kez üst üste %80 başarı yakala",
    emoji: '⚡',
    tier: 3,
    tierName: 'Profesyonel',
    color: '#EF4444',
    category: 'Tempo',
  },
  {
    id: 'var-referee',
    name: 'VAR Hakemi',
    description: '3 farklı maçta penaltı kararlarını doğru tahmin ettin',
    howToEarn: '3 farklı maçta penaltı kararlarını doğru tahmin et',
    emoji: '📹',
    tier: 3,
    tierName: 'Profesyonel',
    color: '#EF4444',
    category: 'Disiplin',
  },
  {
    id: 'super-sub',
    name: 'Süper Yedek',
    description: 'Oyuna sonradan giren oyuncunun golünü tahmin ettin',
    howToEarn: 'Oyuna sonradan giren bir oyuncunun gol atacağını tahmin et',
    emoji: '🎭',
    tier: 3,
    tierName: 'Profesyonel',
    color: '#EF4444',
    category: 'Kondisyon',
  },
  {
    id: 'star-hunter',
    name: 'Yıldız Avcısı',
    description: "10 farklı maçta 'Maçın Adamı'nı doğru bildin",
    howToEarn: "10 farklı maçta 'Maçın Adamı'nı doğru bil",
    emoji: '⭐',
    tier: 3,
    tierName: 'Profesyonel',
    color: '#EF4444',
    category: 'Yıldız',
  },

  // 🔴 Seviye 4: Uzman (Çok Zor)
  {
    id: 'unbreakable-streak',
    name: 'Yıkılmaz Seri',
    description: 'Üst üste 10 maçta 300+ puan topladın',
    howToEarn: 'Üst üste 10 maçta 300+ puan topla',
    emoji: '🛡️',
    tier: 4,
    tierName: 'Uzman',
    color: '#8B5CF6',
    category: 'Disiplin',
  },
  {
    id: 'doctor',
    name: 'Doktor',
    description: 'Sakatlık tahminlerinde %90 isabet oranına ulaştın',
    howToEarn: 'Sakatlık tahminlerinde %90 isabet oranına ulaş (Minimum 5 maç)',
    emoji: '🩺',
    tier: 4,
    tierName: 'Uzman',
    color: '#8B5CF6',
    category: 'Kondisyon',
  },
  {
    id: 'ninety-plus',
    name: '90+',
    description: 'Uzatma dakikasındaki golü tam vaktinde tahmin ettin',
    howToEarn: 'Maçın uzatma dakikalarında gelecek bir golü tam vaktinde tahmin et',
    emoji: '⏰',
    tier: 4,
    tierName: 'Uzman',
    color: '#8B5CF6',
    category: 'Tempo',
  },
  {
    id: 'global-analyst',
    name: 'Global Analist',
    description: '5 farklı ligde rozet kazandın',
    howToEarn: '5 farklı ligde (Premier Lig, La Liga vb.) en az birer rozet kazan',
    emoji: '🌍',
    tier: 4,
    tierName: 'Uzman',
    color: '#8B5CF6',
    category: 'Genel',
  },

  // 💎 Seviye 5: Efsane (Neredeyse İmkansız)
  {
    id: 'perfect-analysis',
    name: 'Kusursuz Analiz',
    description: 'Bir maçtaki tüm tahminleri %100 doğru yaptın',
    howToEarn: 'Bir maçtaki tüm tahmin kategorilerini (kart, gol, sakatlık vb.) %100 doğru bil',
    emoji: '💯',
    tier: 5,
    tierName: 'Efsane',
    color: '#06B6D4',
    category: 'Genel',
  },
  {
    id: 'diamond-focus',
    name: 'Elmas Odak',
    description: 'Analiz Odağı çarpanıyla tek maçta 1000+ puan aldın',
    howToEarn: "Seçtiğin 'Analiz Odağı' çarpanıyla tek maçta 1000+ puan al",
    emoji: '💎',
    tier: 5,
    tierName: 'Efsane',
    color: '#06B6D4',
    category: 'Tempo',
  },
  {
    id: 'league-king',
    name: 'Ligin Kralı',
    description: "Global Leaderboard'da ilk 10 içine girdin",
    howToEarn: "Global Leaderboard'da ilk 10 içine gir",
    emoji: '👑',
    tier: 5,
    tierName: 'Efsane',
    color: '#06B6D4',
    category: 'Yıldız',
  },
  {
    id: 'tacticiq-master',
    name: 'TacticIQ Master',
    description: 'Tüm rozetleri topladın - Efsane oldun!',
    howToEarn: 'Diğer 24 rozetin tamamını topla (Büyük ödül)',
    emoji: '🏆',
    tier: 5,
    tierName: 'Efsane',
    color: '#FFD700',
    category: 'Genel',
  },
  
  // 🟢 Seviye 1: Çaylak (Ekstra rozet)
  {
    id: 'quick-learner',
    name: 'Hızlı Öğrenen',
    description: 'İlk 3 maçta %60+ başarı oranı yakaladın',
    howToEarn: 'İlk 3 maçta %60 veya daha yüksek başarı oranı yakala',
    emoji: '📚',
    tier: 1,
    tierName: 'Çaylak',
    color: '#10B981',
    category: 'Genel',
  },
  
  // 🟡 Seviye 2: Amatör (Ekstra rozet)
  {
    id: 'team-supporter',
    name: 'Takım Destekçisi',
    description: 'Aynı takımın 5 maçını analiz ettin',
    howToEarn: 'Aynı takımın 5 farklı maçını analiz et',
    emoji: '👥',
    tier: 2,
    tierName: 'Amatör',
    color: '#F59E0B',
    category: 'Yıldız',
  },
  
  // 🟠 Seviye 3: Profesyonel (Ekstra rozet)
  {
    id: 'prediction-wizard',
    name: 'Tahmin Büyücüsü',
    description: 'Tek maçta 500+ puan topladın',
    howToEarn: 'Tek bir maçta 500 veya daha fazla puan topla',
    emoji: '🧙',
    tier: 3,
    tierName: 'Profesyonel',
    color: '#EF4444',
    category: 'Genel',
  },
  
  // 🔴 Seviye 4: Uzman (Ekstra rozet)
  {
    id: 'consistency-champion',
    name: 'Tutarlılık Şampiyonu',
    description: '10 maçta üst üste %70+ başarı oranı',
    howToEarn: '10 maçta üst üste %70 veya daha yüksek başarı oranı yakala',
    emoji: '🎖️',
    tier: 4,
    tierName: 'Uzman',
    color: '#8B5CF6',
    category: 'Disiplin',
  },
  
  // 💎 Seviye 5: Efsane (Ekstra rozet)
  {
    id: 'legendary-analyst',
    name: 'Efsanevi Analist',
    description: 'Toplam 1000+ maç analiz ettin',
    howToEarn: 'Toplamda 1000 veya daha fazla maç analiz et',
    emoji: '🌟',
    tier: 5,
    tierName: 'Efsane',
    color: '#06B6D4',
    category: 'Genel',
  },

  // Ek 5 rozet (toplam 30 – 5 satır x 6 sütun)
  {
    id: 'early-bird',
    name: 'Erken Kuş',
    description: 'Maç başlamadan 1 saat önce tahmin yaptın',
    howToEarn: 'Maç başlamadan en az 1 saat önce tahminini tamamla',
    emoji: '🐦',
    tier: 1,
    tierName: 'Çaylak',
    color: '#10B981',
    category: 'Genel',
  },
  {
    id: 'corner-king',
    name: 'Korner Kralı',
    description: 'Korner tahminlerinde 5 doğru yaptın',
    howToEarn: 'Tek maçta korner sayısı tahmininde 5 doğru yap',
    emoji: '🚩',
    tier: 2,
    tierName: 'Amatör',
    color: '#F59E0B',
    category: 'Tempo',
  },
  {
    id: 'possession-master',
    name: 'Top Hakimiyeti',
    description: 'Possesyon tahminini 3 maç üst üste doğru yaptın',
    howToEarn: 'Possesyon yüzdesi tahminini 3 maç üst üste doğru yap',
    emoji: '⚽',
    tier: 2,
    tierName: 'Amatör',
    color: '#F59E0B',
    category: 'Tempo',
  },
  {
    id: 'hat-trick-hero',
    name: 'Hat-Trick Kahramanı',
    description: 'Bir maçta skor, toplam gol ve ilk gol dakikasını doğru tahmin ettin',
    howToEarn: 'Aynı maçta skor, toplam gol ve ilk gol dakikasını doğru tahmin et',
    emoji: '⚡',
    tier: 3,
    tierName: 'Profesyonel',
    color: '#EF4444',
    category: 'Yıldız',
  },
  {
    id: 'season-veteran',
    name: 'Sezon Veteranı',
    description: 'Bir sezonda 50 maç tahminini tamamladın',
    howToEarn: 'Tek sezonda 50 maç tahminini tamamla',
    emoji: '📅',
    tier: 4,
    tierName: 'Uzman',
    color: '#8B5CF6',
    category: 'Disiplin',
  },

  // Ek 10 rozet (toplam 40 – 10 satır x 4 sütun)
  { id: 'momentum-builder', name: 'Momentum', shortName: 'Momentum', description: '5 maç üst üste puan kazandın', howToEarn: 'Üst üste 5 maçta puan kazan', emoji: '📈', tier: 2, tierName: 'Amatör', color: '#F59E0B', category: 'Disiplin' },
  { id: 'clean-sheet', name: 'Temiz Sayfa', shortName: 'Temiz', description: 'Skor tahmininde 3 maç üst üste doğru yaptın', howToEarn: 'Skor tahmininde 3 maç üst üste doğru bil', emoji: '🛡️', tier: 2, tierName: 'Amatör', color: '#F59E0B', category: 'Genel' },
  { id: 'goalscorer', name: 'Gol Ustası', shortName: 'Gol', description: 'Toplam gol tahmininde 10 doğru yaptın', howToEarn: 'Toplam gol tahmininde 10 doğru yap', emoji: '⚽', tier: 2, tierName: 'Amatör', color: '#F59E0B', category: 'Tempo' },
  { id: 'form-guide', name: 'Form Rehberi', shortName: 'Form', description: 'Takım formu analiziyle 5 doğru tahmin yaptın', howToEarn: 'Form analizi ile 5 doğru tahmin yap', emoji: '📊', tier: 3, tierName: 'Profesyonel', color: '#EF4444', category: 'Yıldız' },
  { id: 'derby-master', name: 'Derbi Ustası', shortName: 'Derbi', description: 'Derbi maçında doğru tahmin yaptın', howToEarn: 'Bir derbi maçında doğru tahmin yap', emoji: '🏟️', tier: 3, tierName: 'Profesyonel', color: '#EF4444', category: 'Genel' },
  { id: 'underdog', name: 'Sürpriz Avcı', shortName: 'Sürpriz', description: 'Favori dışı sonuçta doğru tahmin yaptın', howToEarn: 'Favori olmayan takım kazandığında doğru tahmin et', emoji: '🎲', tier: 3, tierName: 'Profesyonel', color: '#EF4444', category: 'Yıldız' },
  { id: 'consistency-king', name: 'Tutarlılık Kralı', shortName: 'Tutarlı', description: '10 maçta %80+ doğruluk oranı tuttun', howToEarn: '10 maçta ortalama %80+ doğruluk oranı tut', emoji: '🎯', tier: 4, tierName: 'Uzman', color: '#8B5CF6', category: 'Disiplin' },
  { id: 'predictor-pro', name: 'Tahmin Profesörü', shortName: 'Profesör', description: '100 maç tahminini tamamladın', howToEarn: 'Toplamda 100 maç tahminini tamamla', emoji: '🎓', tier: 4, tierName: 'Uzman', color: '#8B5CF6', category: 'Genel' },
  { id: 'champion-mind', name: 'Şampiyon Zihni', shortName: 'Şampiyon', description: 'Lig şampiyonunu sezon başında doğru tahmin ettin', howToEarn: 'Lig şampiyonunu sezon başında doğru tahmin et', emoji: '👑', tier: 5, tierName: 'Efsane', color: '#06B6D4', category: 'Yıldız' },
  { id: 'tacticiq-legend', name: 'TacticIQ Efsanesi', shortName: 'Efsane', description: 'Tüm rozetlerin %50\'sinden fazlasını kazandın', howToEarn: '40 rozetin 20\'sinden fazlasını kazan', emoji: '💎', tier: 5, tierName: 'Efsane', color: '#06B6D4', category: 'Genel' },
];

// Helper functions
export const getBadgesByTier = (tier: 1 | 2 | 3 | 4 | 5) => {
  return ALL_BADGES.filter((badge) => badge.tier === tier);
};

export const getBadgesByCategory = (category: BadgeDefinition['category']) => {
  return ALL_BADGES.filter((badge) => badge.category === category);
};

export const getBadgeById = (id: string) => {
  return ALL_BADGES.find((badge) => badge.id === id);
};

export const getTierColor = (tier: 1 | 2 | 3 | 4 | 5) => {
  const colors = {
    1: '#10B981', // Green
    2: '#F59E0B', // Yellow
    3: '#EF4444', // Orange/Red
    4: '#8B5CF6', // Purple
    5: '#06B6D4', // Cyan/Diamond
  };
  return colors[tier];
};

export const getTierName = (tier: 1 | 2 | 3 | 4 | 5) => {
  const names = {
    1: 'Çaylak',
    2: 'Amatör',
    3: 'Profesyonel',
    4: 'Uzman',
    5: 'Efsane',
  };
  return names[tier];
};
