// Language Constants for TacticIQ
// Supports Turkish (tr) and English (en)

export type Language = 'tr' | 'en';

export const LANGUAGES = {
  tr: {
    // Common
    common: {
      loading: 'Yükleniyor...',
      error: 'Hata',
      save: 'Kaydet',
      cancel: 'İptal',
      close: 'Kapat',
      delete: 'Sil',
      edit: 'Düzenle',
      back: 'Geri',
      next: 'İleri',
      done: 'Tamam',
      continue: 'Devam Et',
      info: 'Bilgi',
    },
    
    // Dashboard
    dashboard: {
      title: 'Analist Kontrol Paneli',
      analyst: 'Analist',
      streak: 'Seri',
      upcomingMatches: 'Yaklaşan & Canlı Maçlar',
      liveMatch: 'CANLI',
      liveTracking: 'Canlı Takip',
      predictButton: 'Analizini Gir',
      strategicFocus: 'Analiz Odağı Seç',
      strategicFocusSubtitle: 'Seçtiğin odak x1.25 puan çarpanı kazandırır',
      recentPerformance: 'Son Performansın',
      viewAllBadges: 'Tüm Rozetlerimi Gör',
      noUpcomingMatches: '24 saat içinde maç yok',
      noMatchHistory: 'Henüz maç geçmişin yok',
      points: 'Puan',
      accuracy: 'Doğruluk',
    },

    // Strategic Focus
    strategicFocus: {
      tempo: {
        name: 'Tempo Analizi',
        description: 'Maçın hızına odaklan',
        advice: 'Hızlı tempolu maç bekleniyor!',
      },
      discipline: {
        name: 'Disiplin Analizi',
        description: 'Sert geçişleri öngör',
        advice: 'Bu hakem kart sever, odağın isabetli!',
      },
      fitness: {
        name: 'Kondisyon Analizi',
        description: 'Fiziksel durumu değerlendir',
        advice: 'Uzun sezonda kondisyon kritik!',
      },
      star: {
        name: 'Yıldız Analizi',
        description: 'Yıldız oyuncuları takip et',
        advice: 'Yıldız oyuncular sahada olacak!',
      },
    },

    // Badges
    badges: {
      title: 'Rozetler',
      earned: 'Kazanıldı',
      locked: 'Kilitli',
      howToEarn: 'Nasıl Kazanılır',
      progress: 'İlerleme',
      progressHint: 'maç daha kazanman gerekiyor!',
      earnedDate: 'Kazanıldı:',
      tiers: {
        rookie: 'Çaylak',
        amateur: 'Amatör',
        pro: 'Profesyonel',
        expert: 'Uzman',
        legend: 'Efsane',
      },
    },

    // Profile
    profile: {
      title: 'Profil',
      level: 'Seviye',
      points: 'Puan',
      rank: 'Sıralama',
      settings: 'Ayarlar',
      logout: 'Çıkış Yap',
      favoriteTeams: 'Favori Takımlar',
      statistics: 'İstatistikler',
      achievements: 'Başarılar',
    },

    // Matches
    matches: {
      title: 'Maçlar',
      past: 'Geçmiş',
      live: 'Canlı',
      upcoming: 'Gelecek',
      allMatches: 'Tüm Maçlar',
      noMatches: 'Maç bulunamadı',
      minute: 'Dakika',
      vs: 'VS',
    },

    // Leaderboard
    leaderboard: {
      title: 'Sıralama',
      overall: 'Genel',
      weekly: 'Haftalık',
      monthly: 'Aylık',
      rank: 'Sıra',
      user: 'Kullanıcı',
      points: 'Puan',
    },

    // Scoring
    scoring: {
      bonusApplied: 'Bonus Uygulandı!',
      strategicBonus: 'Stratejik Odak Bonusu',
      totalPoints: 'Toplam Puan',
      breakdown: 'Puan Dağılımı',
    },

    // Notifications
    notifications: {
      title: 'Bildirimler',
      noNotifications: 'Bildirim yok',
      matchStartingSoon: 'Maç yakında başlıyor!',
      predictionReminder: 'Tahmin yapmayı unutma!',
      badgeEarned: 'Yeni rozet kazandın!',
    },

    // Errors
    errors: {
      networkError: 'Bağlantı hatası',
      serverError: 'Sunucu hatası',
      notFound: 'Bulunamadı',
      unauthorized: 'Yetkisiz erişim',
      tryAgain: 'Tekrar dene',
    },

    // Age Gate
    ageGate: {
      title: 'Yaş Doğrulama',
      subtitle: 'Lütfen doğum tarihinizi giriniz',
      year: 'Yıl',
      month: 'Ay',
      day: 'Gün',
      yearPlaceholder: 'YYYY',
      monthPlaceholder: 'MM',
      dayPlaceholder: 'DD',
      info: 'Bu bilgi güvenliğiniz ve yasal uyumluluk için gereklidir.',
      pleaseEnterDate: 'Lütfen doğum tarihinizi giriniz',
      invalidDate: 'Geçersiz doğum tarihi',
    },

    // Consent
    consent: {
      title: 'Gizlilik Tercihleri',
      subtitle: 'Verilerinizin nasıl kullanılacağını seçin',
      kvkkInfo: 'KVKK (6698 sayılı Kanun) kapsamında kişisel verilerinizin korunması için tercihlerinizi belirleyin.',
      gdprInfo: 'GDPR kapsamında verilerinizin korunması için tercihlerinizi belirleyin.',
      ccpaInfo: 'CCPA kapsamında verilerinizin korunması için tercihlerinizi belirleyin.',
      defaultInfo: 'Verilerinizi korumak için tercihlerinizi belirleyin.',
      essential: 'Zorunlu Çerezler',
      essentialDesc: 'Uygulamanın çalışması için gerekli',
      analytics: 'Analitik',
      analyticsDesc: 'Uygulama performansını analiz etmek için',
      marketing: 'Pazarlama',
      marketingDesc: 'Kampanya ve bildirimler için',
      personalizedAds: 'Kişiselleştirilmiş Reklamlar',
      personalizedAdsDesc: 'İlgi alanlarınıza göre reklamlar',
      dataTransfer: 'Yurt Dışına Veri Aktarımı',
      dataTransferDesc: 'KVKK kapsamında açık rıza gereklidir',
      rejectAll: 'Tümünü Reddet',
      acceptAll: 'Tümünü Kabul Et',
      save: 'Kaydet ve Devam Et',
      privacyPolicyLink: 'Detaylı bilgi için Gizlilik Politikası',
      childModeRestriction: 'Çocuk modunda bu özellikler devre dışıdır',
      saveError: 'Tercihler kaydedilemedi',
    },

  },

  en: {
    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      continue: 'Continue',
      info: 'Info',
    },
    
    // Dashboard
    dashboard: {
      title: 'Analyst Control Panel',
      analyst: 'Analyst',
      streak: 'Streak',
      upcomingMatches: 'Upcoming & Live Matches',
      liveMatch: 'LIVE',
      liveTracking: 'Live Tracking',
      predictButton: 'Enter Analysis',
      strategicFocus: 'Choose Analysis Focus',
      strategicFocusSubtitle: 'Selected focus gives x1.25 point multiplier',
      recentPerformance: 'Recent Performance',
      viewAllBadges: 'View All Badges',
      noUpcomingMatches: 'No matches in next 24 hours',
      noMatchHistory: 'No match history yet',
      points: 'Points',
      accuracy: 'Accuracy',
    },

    // Strategic Focus
    strategicFocus: {
      tempo: {
        name: 'Tempo Analysis',
        description: 'Focus on match pace',
        advice: 'Fast-paced match expected!',
      },
      discipline: {
        name: 'Discipline Analysis',
        description: 'Predict rough plays',
        advice: 'This referee loves cards, great focus!',
      },
      fitness: {
        name: 'Fitness Analysis',
        description: 'Evaluate physical condition',
        advice: 'Fitness is critical in long season!',
      },
      star: {
        name: 'Star Analysis',
        description: 'Track star players',
        advice: 'Star players will be on the field!',
      },
    },

    // Badges
    badges: {
      title: 'Badges',
      earned: 'Earned',
      locked: 'Locked',
      howToEarn: 'How to Earn',
      progress: 'Progress',
      progressHint: 'more matches needed!',
      earnedDate: 'Earned:',
      tiers: {
        rookie: 'Rookie',
        amateur: 'Amateur',
        pro: 'Professional',
        expert: 'Expert',
        legend: 'Legend',
      },
    },

    // Profile
    profile: {
      title: 'Profile',
      level: 'Level',
      points: 'Points',
      rank: 'Rank',
      settings: 'Settings',
      logout: 'Logout',
      favoriteTeams: 'Favorite Teams',
      statistics: 'Statistics',
      achievements: 'Achievements',
    },

    // Matches
    matches: {
      title: 'Matches',
      past: 'Past',
      live: 'Live',
      upcoming: 'Upcoming',
      allMatches: 'All Matches',
      noMatches: 'No matches found',
      minute: 'Minute',
      vs: 'VS',
    },

    // Leaderboard
    leaderboard: {
      title: 'Leaderboard',
      overall: 'Overall',
      weekly: 'Weekly',
      monthly: 'Monthly',
      rank: 'Rank',
      user: 'User',
      points: 'Points',
    },

    // Scoring
    scoring: {
      bonusApplied: 'Bonus Applied!',
      strategicBonus: 'Strategic Focus Bonus',
      totalPoints: 'Total Points',
      breakdown: 'Points Breakdown',
    },

    // Notifications
    notifications: {
      title: 'Notifications',
      noNotifications: 'No notifications',
      matchStartingSoon: 'Match starting soon!',
      predictionReminder: "Don't forget to predict!",
      badgeEarned: 'New badge earned!',
    },

    // Errors
    errors: {
      networkError: 'Network error',
      serverError: 'Server error',
      notFound: 'Not found',
      unauthorized: 'Unauthorized access',
      tryAgain: 'Try again',
    },

    // Age Gate
    ageGate: {
      title: 'Age Verification',
      subtitle: 'Please enter your date of birth',
      year: 'Year',
      month: 'Month',
      day: 'Day',
      yearPlaceholder: 'YYYY',
      monthPlaceholder: 'MM',
      dayPlaceholder: 'DD',
      info: 'This information is required for your security and legal compliance.',
      pleaseEnterDate: 'Please enter your date of birth',
      invalidDate: 'Invalid date of birth',
    },

    // Consent
    consent: {
      title: 'Privacy Preferences',
      subtitle: 'Choose how your data will be used',
      kvkkInfo: 'Under KVKK (Law No. 6698), set your preferences to protect your personal data.',
      gdprInfo: 'Under GDPR, set your preferences to protect your data.',
      ccpaInfo: 'Under CCPA, set your preferences to protect your data.',
      defaultInfo: 'Set your preferences to protect your data.',
      essential: 'Essential Cookies',
      essentialDesc: 'Required for the app to function',
      analytics: 'Analytics',
      analyticsDesc: 'To analyze app performance',
      marketing: 'Marketing',
      marketingDesc: 'For campaigns and notifications',
      personalizedAds: 'Personalized Ads',
      personalizedAdsDesc: 'Ads based on your interests',
      dataTransfer: 'Data Transfer Abroad',
      dataTransferDesc: 'Explicit consent required under KVKK',
      rejectAll: 'Reject All',
      acceptAll: 'Accept All',
      save: 'Save and Continue',
      privacyPolicyLink: 'Privacy Policy for detailed information',
      childModeRestriction: 'These features are disabled in child mode',
      saveError: 'Preferences could not be saved',
    },

  },
};

// Helper function to get text by language
export const getText = (language: Language, key: string): string => {
  const keys = key.split('.');
  let value: any = LANGUAGES[language];
  
  for (const k of keys) {
    value = value[k];
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  
  return value;
};

// Default language
export const DEFAULT_LANGUAGE: Language = 'tr';
