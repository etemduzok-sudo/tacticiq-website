// Badge System Constants
// 20 Progressive Badges across 5 difficulty tiers

export interface BadgeDefinition {
  id: string;
  name: string;
  shortName: string; // Tek kelime kısa isim
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
    howToEarn: 'Diğer 19 rozetin tamamını topla (Büyük ödül)',
    emoji: '🏆',
    tier: 5,
    tierName: 'Efsane',
    color: '#FFD700',
    category: 'Genel',
  },
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
