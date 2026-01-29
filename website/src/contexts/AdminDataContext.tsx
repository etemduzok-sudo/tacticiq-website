import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
// Supabase entegrasyonu AKTİF - tüm veriler Supabase'den okunur ve yazılır
import { 
  configService, 
  partnersService, 
  teamMembersService, 
  advertisementsService,
  featureCategoriesService,
  sectionMediaService,
  gamesService,
  pressReleasesService,
  pressKitFilesService,
  logsService,
  syncService,
  legalDocumentsService,
  type Partner as SupabasePartner,
  type TeamMember as SupabaseTeamMember,
  type Advertisement as SupabaseAdvertisement,
  type FeatureCategory as SupabaseFeatureCategory,
  type SectionMedia as SupabaseSectionMedia,
  type Game as SupabaseGame,
  type PressRelease as SupabasePressRelease,
  type PressKitFile as SupabasePressKitFile,
} from '../services/adminSupabaseService';

// Import AdminUsersContext for users, activities, and logs management
import { AdminUsersProvider, useAdminUsers } from './admin/AdminUsersContext';

// Import extracted types and constants
import type {
  AdminStats,
  User,
  Content,
  Activity,
  LogEntry,
  Advertisement,
  AdSettings,
  SectionMediaItem,
  PressKitFile,
  EmailAutoReplySettings,
  TeamMember,
  Partner,
  PressRelease,
  Game,
  FeatureCategory,
  ChangeLogEntry,
  LegalDocument,
  AdminNotificationSettings,
  PriceSettings,
  DiscountSettings,
  ProfilePromoSettings,
  SiteSettings,
  SectionSettings,
  GameSettings,
  GameData,
  GamePrediction,
  LeaderboardEntry,
  WebsiteSection,
  WebsiteContent,
  AdminDataContextType
} from './admin/AdminDataTypes';

import {
  EXCHANGE_RATES,
  LANGUAGE_CODE_TO_NAME,
  LANGUAGE_CURRENCY_MAP,
  CURRENCY_SYMBOLS,
  convertCurrency,
  formatPrice
} from './admin/AdminDataConstants';

// Re-export for backward compatibility
export {
  EXCHANGE_RATES,
  LANGUAGE_CODE_TO_NAME,
  LANGUAGE_CURRENCY_MAP,
  CURRENCY_SYMBOLS,
  convertCurrency,
  formatPrice
};

// Re-export all types for backward compatibility
export type {
  AdminStats,
  User,
  Content,
  Activity,
  LogEntry,
  Advertisement,
  AdSettings,
  SectionMediaItem,
  PressKitFile,
  EmailAutoReplySettings,
  TeamMember,
  Partner,
  PressRelease,
  Game,
  FeatureCategory,
  ChangeLogEntry,
  LegalDocument,
  AdminNotificationSettings,
  PriceSettings,
  DiscountSettings,
  ProfilePromoSettings,
  SiteSettings,
  SectionSettings,
  GameSettings,
  GameData,
  GamePrediction,
  LeaderboardEntry,
  WebsiteSection,
  WebsiteContent,
  AdminDataContextType
};

// Types are now imported from AdminDataTypes.ts (see imports above)
// All types are re-exported for backward compatibility


export const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

// Internal provider component that uses AdminUsersContext
function AdminDataProviderInternal({ children }: { children: ReactNode }) {
  // Get users, activities, and logs from AdminUsersContext
  const usersContext = useAdminUsers();
  // Stats - Gerçek veriler localStorage'dan yüklenecek veya API'den gelecek
  // Varsayılan Analytics verileri (sıfır değerler - canlı verilerle doldurulacak)
  const defaultGeoDistribution = [
    { country: '', percentage: 0 },
    { country: '', percentage: 0 },
    { country: '', percentage: 0 },
    { country: '', percentage: 0 },
    { country: '', percentage: 0 },
  ];

  const defaultVisitHours = [
    { timeRange: '00:00 - 06:00', percentage: 0 },
    { timeRange: '06:00 - 12:00', percentage: 0 },
    { timeRange: '12:00 - 18:00', percentage: 0 },
    { timeRange: '18:00 - 00:00', percentage: 0 },
  ];

  const defaultUserSegments = [
    { segment: 'Free Users', percentage: 0 },
    { segment: 'Premium Monthly', percentage: 0 },
    { segment: 'Premium Yearly', percentage: 0 },
  ];

  const defaultGrowthMetrics = [
    { label: 'Yeni Kayıtlar', value: '0', change: '0%' },
    { label: 'Aktif Kullanıcılar', value: '0', change: '0%' },
    { label: 'Churn Rate', value: '0%', change: '0%' },
    { label: 'LTV', value: '€0', change: '0%' },
  ];

  const [stats, setStats] = useState<AdminStats>(() => {
    const savedStats = localStorage.getItem('admin_stats');
    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      // Eski verilerde yeni alanlar yoksa varsayılan değerleri ekle
      return {
        totalVisitors: parsed.totalVisitors || 0,
        activeUsers: parsed.activeUsers || 0,
        monthlyRevenue: parsed.monthlyRevenue || 0,
        conversionRate: parsed.conversionRate || 0,
        visitorChange: parsed.visitorChange || 0,
        userChange: parsed.userChange || 0,
        revenueChange: parsed.revenueChange || 0,
        conversionChange: parsed.conversionChange || 0,
        // About Section Stats - varsayılan değerler veya kaydedilmiş değerler
        foundedYear: parsed.foundedYear ?? 2026,
        totalUsers: parsed.totalUsers || '0.0K+',
        totalLeagues: parsed.totalLeagues ?? 25,
        totalLanguages: parsed.totalLanguages ?? 8,
        totalCountries: parsed.totalCountries || '150+',
        // Stats Section - varsayılan değerler (sıfır - canlı verilerle doldurulacak)
        averageRating: parsed.averageRating || '0.0/5',
        totalPredictions: parsed.totalPredictions ?? 0,
        // Analytics verileri
        geoDistribution: parsed.geoDistribution || defaultGeoDistribution,
        visitHours: parsed.visitHours || defaultVisitHours,
        userSegments: parsed.userSegments || defaultUserSegments,
        growthMetrics: parsed.growthMetrics || defaultGrowthMetrics,
      };
    }
    // Başlangıç değerleri - gerçek veriler API'den gelecek
    return {
      totalVisitors: 0,
      activeUsers: 0,
      monthlyRevenue: 0,
      conversionRate: 0,
      visitorChange: 0,
      userChange: 0,
      revenueChange: 0,
      conversionChange: 0,
      // About Section Stats - varsayılan değerler
      foundedYear: 2026,
      totalUsers: '0.0K+',
      totalLeagues: 25,
      totalLanguages: 8,
      totalCountries: '150+',
      // Stats Section - varsayılan değerler (sıfır - canlı verilerle doldurulacak)
      averageRating: '0.0/5',
      totalPredictions: 0,
      // Analytics verileri - varsayılan değerler
      geoDistribution: defaultGeoDistribution,
      visitHours: defaultVisitHours,
      userSegments: defaultUserSegments,
      growthMetrics: defaultGrowthMetrics,
    };
  });

  // Get users, activities, and logs from AdminUsersContext
  const { users, activities, logs, addUser, updateUser, deleteUser, filterLogs, _addLog } = usersContext;

  // Contents - Gerçek veriler localStorage'dan yüklenecek veya API'den gelecek
  const [contents, setContents] = useState<Content[]>(() => {
    const savedContents = localStorage.getItem('admin_contents');
    return savedContents ? JSON.parse(savedContents) : [];
  });

  // Advertisements - Gerçek veriler localStorage'dan yüklenecek veya API'den gelecek
  const [advertisements, setAdvertisements] = useState<Advertisement[]>(() => {
    const savedAds = localStorage.getItem('admin_advertisements');
    return savedAds ? JSON.parse(savedAds) : [];
  });

  // Ad Settings - localStorage'dan yükle
  const [adSettings, setAdSettings] = useState<AdSettings>(() => {
    const savedSettings = localStorage.getItem('admin_ad_settings');
    const defaultSettings: AdSettings = {
      systemEnabled: false,
      popupEnabled: false,
      bannerEnabled: false,
      sidebarEnabled: false,
      adminEmail: 'admin@tacticiq.app',
    };
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        return { ...defaultSettings, ...parsed };
      } catch (e) {
        console.error('Error parsing ad settings:', e);
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Price Settings - Fiyat ayarları (indirimden bağımsız)
  const [priceSettings, setPriceSettings] = useState<PriceSettings>(() => {
    const savedSettings = localStorage.getItem('admin_price_settings');
    const defaultSettings: PriceSettings = {
      proPrice: 479, // TL cinsinden yıllık fiyat
      baseCurrency: 'TRY',
      freeTrialDays: 7,
      monthlyPrice: 49,
      yearlyPrice: 479,
      billingPeriod: 'yearly', // Varsayılan: yıllık fiyat gösterilir
    };
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      return { ...defaultSettings, ...parsed };
    }
    return defaultSettings;
  });

  // Discount Settings - İndirim popup ayarları (fiyattan bağımsız)
  const [discountSettings, setDiscountSettings] = useState<DiscountSettings>(() => {
    const savedSettings = localStorage.getItem('admin_discount_settings');
    const defaultSettings: DiscountSettings = {
      enabled: false,
      discountPercent: 20,
      showDiscountOnWeb: true, // Varsayılan: İndirimli fiyat web'de gösterilir
      showDiscountViaPopup: false, // Varsayılan: Popup ile indirim kapalı
      dailyShowLimit: 3,
      showDelay: 5000,
      timerDuration: 600,
      maxShowsPerUser: 5,
      cooldownAfterClose: 3600, // 1 saat
      showOnEveryPage: false,
      popupTitle: 'Özel Teklif!',
      popupDescription: 'Sınırlı süre için özel indirim fırsatı',
      ctaButtonText: 'Hemen Al',
    };
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      return { ...defaultSettings, ...parsed };
    }
    return defaultSettings;
  });

  // Profile Promo Settings - Profil sayfası promosyon ayarları
  const [profilePromoSettings, setProfilePromoSettings] = useState<ProfilePromoSettings>(() => {
    const savedSettings = localStorage.getItem('admin_profile_promo_settings');
    const defaultSettings: ProfilePromoSettings = {
      enabled: true,
      discountPercent: 30,
      dailyShowLimit: 3,
      showDuration: 0, // 0 = süresiz
      promoTitle: 'Şimdi Üye Ol!',
      promoDescription: 'Sınırlı süre için özel indirim fırsatı',
      ctaButtonText: 'İndirimli Satın Al',
      showTimer: true,
      timerDuration: 600, // 10 dakika
      showOriginalPrice: true,
      badgeText: 'Özel Teklif',
      backgroundColor: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      textColor: '#ffffff',
    };
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      return { ...defaultSettings, ...parsed };
    }
    return defaultSettings;
  });

  // Press Kit Files - Gerçek veriler localStorage'dan yüklenecek veya API'den gelecek
  const [pressKitFiles, setPressKitFiles] = useState<PressKitFile[]>(() => {
    const savedFiles = localStorage.getItem('admin_pressKitFiles');
    return savedFiles ? JSON.parse(savedFiles) : [];
  });

  // Email Auto-Reply Settings
  const [emailAutoReply, setEmailAutoReply] = useState<EmailAutoReplySettings>({
    enabled: true,
    supportEmail: 'support@tacticiq.app',
    replySubject: 'TacticIQ Destek Cevabı',
    replyMessage: 'Teşekkürler, mesajınızı aldık. En kısa sürede yanıtlayacağız.',
    replyDelay: 5000,
    signature: 'TacticIQ Ekibi',
    businessHours: true,
    businessHoursStart: '09:00',
    businessHoursEnd: '17:00',
    outOfOfficeMessage: 'Mesai dışı olduğumuz için yanıtlayamıyoruz. En kısa sürede geri dönüş yapacağız.',
  });

  // Team Members - localStorage'dan yükle
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('admin_team_members');
    return saved ? JSON.parse(saved) : [];
  });

  // Press Releases - Başlangıçta boş
  const [pressReleases, setPressReleases] = useState<PressRelease[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [partners, setPartners] = useState<Partner[]>(() => {
    const saved = localStorage.getItem('admin_partners');
    return saved ? JSON.parse(saved) : [];
  });

  // Section Media - Her bölüm için metin ve görsel yönetimi
  const [sectionMedia, setSectionMedia] = useState<SectionMediaItem[]>(() => {
    const saved = localStorage.getItem('admin_section_media');
    return saved ? JSON.parse(saved) : [];
  });

  // Feature Categories - 15 Tahmin Kategorisi
  const defaultFeatureCategories: FeatureCategory[] = [
    { id: '1', key: 'halftime_score', title: 'İlk Yarı Skor Tahmini', description: 'İlk yarı için tam skor tahmini yapın (örn: 1-0, 2-1)', emoji: '⚽', featured: true, enabled: true, order: 1, createdAt: '', updatedAt: '' },
    { id: '2', key: 'halftime_extra', title: 'İlk Yarı Ek Tahminler', description: 'Alt/Üst gol, karşılıklı gol, handikap tahminleri', emoji: '⏱️', featured: false, enabled: true, order: 2, createdAt: '', updatedAt: '' },
    { id: '3', key: 'fulltime_score', title: 'Maç Sonu Skor Tahmini', description: 'Normal süre sonunda tam skor tahmini yapın', emoji: '⚽', featured: true, enabled: true, order: 3, createdAt: '', updatedAt: '' },
    { id: '4', key: 'fulltime_extra', title: 'Maç Sonu Ek Tahminler', description: 'Gol yok, tek taraflı gol, farklı galip tahminleri', emoji: '⏱️', featured: false, enabled: true, order: 4, createdAt: '', updatedAt: '' },
    { id: '5', key: 'yellow_cards', title: 'Sarı Kart Sayısı', description: 'Toplam sarı kart sayısını tahmin edin (0-8+)', emoji: '🟨', featured: false, enabled: true, order: 5, createdAt: '', updatedAt: '' },
    { id: '6', key: 'red_cards', title: 'Kırmızı Kart', description: 'Kırmızı kart görülüp görülmeyeceğini tahmin edin', emoji: '🟥', featured: false, enabled: true, order: 6, createdAt: '', updatedAt: '' },
    { id: '7', key: 'total_shots', title: 'Toplam Şut Sayısı', description: 'Her iki takımın toplam şut sayısını tahmin edin', emoji: '🎯', featured: false, enabled: true, order: 7, createdAt: '', updatedAt: '' },
    { id: '8', key: 'shots_on_target', title: 'İsabetli Şut Sayısı', description: 'Kaleye giden şut sayısını tahmin edin', emoji: '🎯', featured: false, enabled: true, order: 8, createdAt: '', updatedAt: '' },
    { id: '9', key: 'tempo', title: 'Maç Temposu', description: 'Maçın hızlı, dengeli veya yavaş geçeceğini tahmin edin', emoji: '🏃‍♂️', featured: false, enabled: true, order: 9, createdAt: '', updatedAt: '' },
    { id: '10', key: 'scenario', title: 'Maç Senaryosu', description: 'Maçın nasıl gelişeceğini tahmin edin (baskılı başlangıç, geç gol vb.)', emoji: '🧠', featured: true, enabled: true, order: 10, createdAt: '', updatedAt: '' },
    { id: '11', key: 'total_goals', title: 'Toplam Gol Sayısı', description: 'Maçta atılacak toplam gol sayısını tahmin edin (0-5+)', emoji: '🧮', featured: true, enabled: true, order: 11, createdAt: '', updatedAt: '' },
    { id: '12', key: 'first_goal', title: 'İlk Gol Zamanı', description: 'İlk golün hangi dakika aralığında atılacağını tahmin edin', emoji: '⏰', featured: true, enabled: true, order: 12, createdAt: '', updatedAt: '' },
    { id: '13', key: 'possession', title: 'Top Hakimiyeti', description: 'Hangi takımın daha fazla top hakimiyetine sahip olacağını tahmin edin', emoji: '📊', featured: false, enabled: true, order: 13, createdAt: '', updatedAt: '' },
    { id: '14', key: 'corners', title: 'Korner Sayısı', description: 'Toplam korner sayısını tahmin edin (0-15+)', emoji: '🚩', featured: false, enabled: true, order: 14, createdAt: '', updatedAt: '' },
    { id: '15', key: 'goal_expectation', title: 'Gol Beklentisi (xG)', description: 'Her iki takımın beklenen gol değerini (Expected Goals) tahmin edin', emoji: '⚡', featured: true, enabled: true, order: 15, createdAt: '', updatedAt: '' },
  ];

  // Legal Documents - Yasal Belgeler
  const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>([]);

  const [featureCategories, setFeatureCategories] = useState<FeatureCategory[]>(() => {
    const saved = localStorage.getItem('admin_feature_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing feature categories:', e);
        return defaultFeatureCategories;
      }
    }
    return defaultFeatureCategories;
  });

  // Session Changes - Oturumdaki değişiklikleri takip et
  const [sessionChanges, setSessionChanges] = useState<ChangeLogEntry[]>([]);

  // Admin Notification Settings - Bildirim ayarları
  const [notificationSettings, setNotificationSettings] = useState<AdminNotificationSettings>(() => {
    const saved = localStorage.getItem('admin_notification_settings');
    const defaultSettings: AdminNotificationSettings = {
      notificationEmail: 'etemduzok@gmail.com',
      sendOnExit: true,
      sendOnImportantChanges: true,
    };
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Error parsing notification settings:', e);
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Settings - Gerçek ayarlar
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'TacticIQ',
    siteUrl: 'https://tacticiq.app',
    defaultLanguage: 'Türkçe',
    timezone: 'Europe/Istanbul',
    smtpServer: 'smtp.tacticiq.app',
    senderEmail: 'noreply@tacticiq.app',
    emailLimit: 10000,
    newUserNotifications: true,
    premiumSaleNotifications: true,
    errorNotifications: true,
    dailyReport: true,
    // Currency settings
    autoUpdateCurrency: true,
    lastCurrencyUpdate: new Date().toISOString().split('T')[0],
    defaultCurrency: 'TRY',
    // Mobile App QR Codes - Gerçek QR kod URL'leri buraya eklenecek
    googlePlayQRCode: '',
    appStoreQRCode: '',
    // Game System
    gameEnabled: true,
    // Admin Security
    adminPassword: 'hashed_password_here',
    loginAttempts: 0,
    lastLoginAttempt: undefined,
    lockoutUntil: undefined,
    // Contact Information
    contactEmail: 'support@tacticiq.app',
    contactPhone: '', // Boş - Admin panelden düzenlenebilir
    contactAddress: 'Istanbul, Turkey',
    socialLinks: {
      twitter: 'https://twitter.com/tacticiq',
      linkedin: 'https://linkedin.com/company/tacticiq',
      facebook: 'https://facebook.com/tacticiq',
      instagram: 'https://instagram.com/tacticiq',
    },
  });

  // Section Settings - localStorage'dan yükle
  const defaultSectionSettings: SectionSettings = {
    hero: {
      enabled: true,
      showStats: true,
      showEmailSignup: true,
      showPlayButton: true,
    },
    features: {
      enabled: true,
      maxFeatures: 5,
    },
    howItWorks: {
      enabled: true,
    },
    product: {
      enabled: true,
    },
    playerPrediction: {
      enabled: false,
    },
    training: {
      enabled: false,
    },
    pricing: {
      enabled: true,
      showFreeOption: true,
      discountEnabled: true,
    },
    blog: {
      enabled: true,
      maxPosts: 5,
    },
    appDownload: {
      enabled: false,
      showQRCodes: false,
    },
    cta: {
      enabled: true,
    },
    game: {
      enabled: false,
    },
    testimonials: {
      enabled: true,
      showStats: true,
    },
    about: {
      enabled: true,
      showTeam: true,
      showMission: true,
    },
    partners: {
      enabled: false,
    },
    press: {
      enabled: false,
    },
    faq: {
      enabled: true,
    },
    contact: {
      enabled: true,
      emailAddress: 'info@tacticiq.app',
      officeAddress: 'İstanbul, Türkiye',
      workingHours: '09:00 - 17:00',
      workingDays: 'Pzt - Cmt',
      responseTime: '24 saat içinde',
    },
    // Newsletter Ayarları
    newsletter: {
      enabled: true,
    },
    // Footer Ayarları
    footer: {
      enabled: true,
      showVisitorCounter: true,
      showSocialLinks: true,
      showAppDownloadButtons: true,
    },
    // Kayıt/Giriş Ayarları
    auth: {
      enabled: true,
      requireAgeVerification: true,
      minimumAge: 18,
      enableGoogleAuth: true,
      enableAppleAuth: false, // Apple henüz aktif değil
      enableEmailAuth: true,
      requireEmailConfirmation: true,
      requireTermsAcceptance: true,
      requirePrivacyAcceptance: true,
    },
  };

  const [sectionSettings, setSectionSettings] = useState<SectionSettings>(() => {
    const saved = localStorage.getItem('admin_section_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Deep merge with defaults to ensure all properties exist
        return {
          ...defaultSectionSettings,
          ...parsed,
          hero: { ...defaultSectionSettings.hero, ...(parsed.hero || {}) },
          features: { ...defaultSectionSettings.features, ...(parsed.features || {}) },
          howItWorks: { ...defaultSectionSettings.howItWorks, ...(parsed.howItWorks || {}) },
          product: { ...defaultSectionSettings.product, ...(parsed.product || {}) },
          playerPrediction: { ...defaultSectionSettings.playerPrediction, ...(parsed.playerPrediction || {}) },
          training: { ...defaultSectionSettings.training, ...(parsed.training || {}) },
          pricing: { ...defaultSectionSettings.pricing, ...(parsed.pricing || {}) },
          blog: { ...defaultSectionSettings.blog, ...(parsed.blog || {}) },
          appDownload: { ...defaultSectionSettings.appDownload, ...(parsed.appDownload || {}) },
          cta: { ...defaultSectionSettings.cta, ...(parsed.cta || {}) },
          game: { ...defaultSectionSettings.game, ...(parsed.game || {}) },
          testimonials: { ...defaultSectionSettings.testimonials, ...(parsed.testimonials || {}) },
          about: { ...defaultSectionSettings.about, ...(parsed.about || {}) },
          partners: { ...defaultSectionSettings.partners, ...(parsed.partners || {}) },
          press: { ...defaultSectionSettings.press, ...(parsed.press || {}) },
          faq: { ...defaultSectionSettings.faq, ...(parsed.faq || {}) },
          contact: { ...defaultSectionSettings.contact, ...(parsed.contact || {}) },
          newsletter: { ...defaultSectionSettings.newsletter, ...(parsed.newsletter || {}) },
          footer: { ...defaultSectionSettings.footer, ...(parsed.footer || {}) },
          auth: { ...defaultSectionSettings.auth, ...(parsed.auth || {}) },
        };
      } catch (e) {
        console.error('Error parsing section settings:', e);
        return defaultSectionSettings;
      }
    }
    return defaultSectionSettings;
  });

  // Website Content
  const [websiteContent, setWebsiteContent] = useState<WebsiteContent>({
    hero: {
      title: 'TacticIQ: Futbol Analiz ve Taktikleri',
      subtitle: 'Futbol analizlerini ve taktiklerini kolayca yönetin.',
      buttonText: 'Başla',
    },
    features: {
      title: 'Özellikler',
      description: 'TacticIQ\'in sunduğu özellikler.',
      items: [
        {
          id: '1',
          title: 'Taktiksel Analiz',
          description: 'Futbol maçlarını analiz edin ve taktiklerinizi geliştirin.',
        },
        {
          id: '2',
          title: 'Oyuncu Performans Metrikleri',
          description: 'Oyuncuların performansını izleyin ve analiz edin.',
        },
        {
          id: '3',
          title: 'Maç Analizleri',
          description: 'Haftalık maç analizleri ve raporları.',
        },
      ],
    },
    pricing: {
      title: 'Fiyatlandırma',
      description: 'TacticIQ\'in fiyatlandırma seçenekleri.',
      plans: [
        {
          id: '1',
          name: 'Free',
          price: 'Ücretsiz',
          description: 'Temel özellikler.',
          features: ['Taktiksel Analiz', 'Oyuncu Performans Metrikleri'],
        },
        {
          id: '2',
          name: 'Premium',
          price: '€9.99 / Ay',
          description: 'Tüm özellikler.',
          features: ['Taktiksel Analiz', 'Oyuncu Performans Metrikleri', 'Maç Analizleri'],
        },
      ],
    },
    blog: {
      title: 'Blog',
      description: 'Futbol analizleri ve taktikleri hakkında blog yazıları.',
    },
    cta: {
      title: 'TacticIQ\'i Şimdi Deneyin!',
      description: 'Futbol analizlerini ve taktiklerini kolayca yönetin.',
      buttonText: 'Başla',
    },
  });

  // User CRUD functions are now from AdminUsersContext (addUser, updateUser, deleteUser)

  // Content CRUD
  const addContent = (content: Omit<Content, 'id' | 'date'>) => {
    const newContent: Content = {
      ...content,
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
    };
    setContents([newContent, ...contents]);

    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'content',
      title: 'Yeni İçerik Eklendi',
      description: content.title,
      time: 'Az önce',
    };
    setActivities([newActivity, ...activities]);

    _addLog({
      type: 'success',
      message: `Yeni ${content.type} eklendi: ${content.title}`,
      user: content.author,
    });
  };

  const updateContent = (id: string, updatedContent: Partial<Content>) => {
    setContents(contents.map(content => content.id === id ? { ...content, ...updatedContent } : content));
    
    const content = contents.find(c => c.id === id);
    if (content) {
      _addLog({
        type: 'info',
        message: `İçerik güncellendi: ${content.title}`,
        user: 'admin@tacticiq.app',
      });
    }
  };

  const deleteContent = (id: string) => {
    const content = contents.find(c => c.id === id);
    setContents(contents.filter(content => content.id !== id));
    
    if (content) {
      _addLog({
        type: 'warning',
        message: `İçerik silindi: ${content.title}`,
        user: 'admin@tacticiq.app',
      });
    }
  };

  // Advertisement CRUD
  const addAdvertisement = (ad: Omit<Advertisement, 'id' | 'createdDate'>) => {
    const newAd: Advertisement = {
      ...ad,
      id: Date.now().toString(),
      createdDate: new Date().toISOString().split('T')[0],
    };
    setAdvertisements([newAd, ...advertisements]);

    _addLog({
      type: 'success',
      message: `Yeni reklam eklendi: ${ad.title}`,
      user: 'admin@tacticiq.app',
    });
  };

  const updateAdvertisement = (id: string, updatedAd: Partial<Advertisement>) => {
    setAdvertisements(advertisements.map(ad => ad.id === id ? { ...ad, ...updatedAd } : ad));
    
    const ad = advertisements.find(a => a.id === id);
    if (ad) {
    _addLog({
      type: 'info',
      message: `Reklam güncellendi: ${ad.title}`,
      user: 'admin@tacticiq.app',
    });
    }
  };

  const deleteAdvertisement = (id: string) => {
    const ad = advertisements.find(a => a.id === id);
    setAdvertisements(advertisements.filter(ad => ad.id !== id));
    
    if (ad) {
    _addLog({
      type: 'warning',
      message: `Reklam silindi: ${ad.title}`,
      user: 'admin@tacticiq.app',
    });
    }
  };

  // Press Kit File CRUD
  const addPressKitFile = (file: Omit<PressKitFile, 'id' | 'uploadedDate'>) => {
    const newFile: PressKitFile = {
      ...file,
      id: Date.now().toString(),
      uploadedDate: new Date().toISOString().split('T')[0],
    };
    setPressKitFiles([newFile, ...pressKitFiles]);

    _addLog({
      type: 'success',
      message: `Yeni basın kiti dosyası eklendi: ${file.title}`,
      user: 'admin@tacticiq.app',
    });
  };

  const updatePressKitFile = (id: string, updatedFile: Partial<PressKitFile>) => {
    setPressKitFiles(pressKitFiles.map(file => file.id === id ? { ...file, ...updatedFile } : file));
    
    const file = pressKitFiles.find(f => f.id === id);
    if (file) {
    _addLog({
      type: 'info',
      message: `Basın kiti dosyası güncellendi: ${file.title}`,
      user: 'admin@tacticiq.app',
    });
    }
  };

  const deletePressKitFile = (id: string) => {
    const file = pressKitFiles.find(f => f.id === id);
    setPressKitFiles(pressKitFiles.filter(file => file.id !== id));
    
    if (file) {
    _addLog({
      type: 'warning',
      message: `Basın kiti dosyası silindi: ${file.title}`,
      user: 'admin@tacticiq.app',
    });
    }
  };

  // Team Member CRUD
  const addTeamMember = (member: Omit<TeamMember, 'id'>) => {
    const newMember: TeamMember = {
      ...member,
      id: Date.now().toString(),
    };
    setTeamMembers([newMember, ...teamMembers]);

    _addLog({
      type: 'success',
      message: `Yeni ekip üyesi eklendi: ${member.name}`,
      user: 'admin@tacticiq.app',
    });
  };

  const updateTeamMember = (id: string, updatedMember: Partial<TeamMember>) => {
    setTeamMembers(teamMembers.map(member => member.id === id ? { ...member, ...updatedMember } : member));
    
    const member = teamMembers.find(m => m.id === id);
    if (member) {
      _addLog({
        type: 'info',
        message: `Ekip üyesi güncellendi: ${member.name}`,
        user: 'admin@tacticiq.app',
      });
    }
  };

  const deleteTeamMember = (id: string) => {
    const member = teamMembers.find(m => m.id === id);
    setTeamMembers(teamMembers.filter(member => member.id !== id));
    
    if (member) {
      _addLog({
        type: 'warning',
        message: `Ekip üyesi silindi: ${member.name}`,
        user: 'admin@tacticiq.app',
      });
    }
  };

  // Press Release CRUD
  const addPressRelease = (release: Omit<PressRelease, 'id'>) => {
    const newRelease: PressRelease = {
      ...release,
      id: Date.now().toString(),
    };
    setPressReleases([newRelease, ...pressReleases]);

    _addLog({
      type: 'success',
      message: `Yeni basın bülteni eklendi: ${release.title}`,
      user: 'admin@tacticiq.app',
    });
  };

  const updatePressRelease = (id: string, updatedRelease: Partial<PressRelease>) => {
    setPressReleases(pressReleases.map(release => release.id === id ? { ...release, ...updatedRelease } : release));
    
    const release = pressReleases.find(r => r.id === id);
    if (release) {
      _addLog({
        type: 'info',
        message: `Basın bülteni güncellendi: ${release.title}`,
        user: 'admin@tacticiq.app',
      });
    }
  };

  const deletePressRelease = (id: string) => {
    const release = pressReleases.find(r => r.id === id);
    setPressReleases(pressReleases.filter(release => release.id !== id));
    
    if (release) {
      _addLog({
        type: 'warning',
        message: `Basın bülteni silindi: ${release.title}`,
        user: 'admin@tacticiq.app',
      });
    }
  };

  // Game CRUD
  const addGame = (game: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newGame: Game = {
      ...game,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    setGames([newGame, ...games]);

    _addLog({
      type: 'success',
      message: `Yeni oyun eklendi: ${game.name}`,
      user: 'admin@tacticiq.app',
    });
  };

  const updateGame = (id: string, updatedGame: Partial<Game>) => {
    setGames(games.map(game => 
      game.id === id 
        ? { ...game, ...updatedGame, updatedAt: new Date().toISOString() }
        : game
    ));
    
    const game = games.find(g => g.id === id);
    if (game) {
      _addLog({
        type: 'info',
        message: `Oyun güncellendi: ${game.name}`,
        user: 'admin@tacticiq.app',
      });
    }
  };

  const deleteGame = (id: string) => {
    const game = games.find(g => g.id === id);
    setGames(games.filter(game => game.id !== id));
    
    if (game) {
      _addLog({
        type: 'warning',
        message: `Oyun silindi: ${game.name}`,
        user: 'admin@tacticiq.app',
      });
    }
  };

  // Partner CRUD
  const addPartner = (partner: Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newPartner: Partner = {
      ...partner,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    const updated = [newPartner, ...partners];
    setPartners(updated);
    localStorage.setItem('admin_partners', JSON.stringify(updated));

    _addLog({
      type: 'success',
      message: `Yeni partner eklendi: ${partner.name}`,
      user: 'admin@tacticiq.app',
    });
  };

  const updatePartner = (id: string, updatedPartner: Partial<Partner>) => {
    const updated = partners.map(partner => 
      partner.id === id 
        ? { ...partner, ...updatedPartner, updatedAt: new Date().toISOString() }
        : partner
    );
    setPartners(updated);
    localStorage.setItem('admin_partners', JSON.stringify(updated));
    
    const partner = partners.find(p => p.id === id);
    if (partner) {
      _addLog({
        type: 'info',
        message: `Partner güncellendi: ${partner.name}`,
        user: 'admin@tacticiq.app',
      });
    }
  };

  const deletePartner = (id: string) => {
    const partner = partners.find(p => p.id === id);
    const updated = partners.filter(p => p.id !== id);
    setPartners(updated);
    localStorage.setItem('admin_partners', JSON.stringify(updated));
    
    if (partner) {
      _addLog({
        type: 'warning',
        message: `Partner silindi: ${partner.name}`,
        user: 'admin@tacticiq.app',
      });
    }
  };

  // Section Media - Her bölüm için metin ve görsel yönetimi
  const addSectionMedia = (media: Omit<SectionMediaItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMedia: SectionMediaItem = {
      ...media,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...sectionMedia, newMedia];
    setSectionMedia(updated);
    localStorage.setItem('admin_section_media', JSON.stringify(updated));
    
    _addLog({
      type: 'success',
      message: `Medya eklendi: ${media.title} (${media.sectionId})`,
      user: 'admin@tacticiq.app',
    });
  };

  const updateSectionMedia = (id: string, media: Partial<SectionMediaItem>) => {
    const updated = sectionMedia.map(m => 
      m.id === id ? { ...m, ...media, updatedAt: new Date().toISOString() } : m
    );
    setSectionMedia(updated);
    localStorage.setItem('admin_section_media', JSON.stringify(updated));
    
    const updatedMedia = updated.find(m => m.id === id);
    if (updatedMedia) {
      _addLog({
        type: 'info',
        message: `Medya güncellendi: ${updatedMedia.title}`,
        user: 'admin@tacticiq.app',
      });
    }
  };

  const deleteSectionMedia = (id: string) => {
    const media = sectionMedia.find(m => m.id === id);
    const updated = sectionMedia.filter(m => m.id !== id);
    setSectionMedia(updated);
    localStorage.setItem('admin_section_media', JSON.stringify(updated));
    
    if (media) {
      _addLog({
        type: 'warning',
        message: `Medya silindi: ${media.title}`,
        user: 'admin@tacticiq.app',
      });
    }
  };

  const getSectionMedia = (sectionId: string): SectionMediaItem[] => {
    return sectionMedia
      .filter(m => m.sectionId === sectionId && m.enabled)
      .sort((a, b) => a.order - b.order);
  };

  // Feature Category CRUD - Tahmin Kategorileri
  const addFeatureCategory = (category: Omit<FeatureCategory, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newCategory: FeatureCategory = {
      ...category,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...featureCategories, newCategory].sort((a, b) => a.order - b.order);
    setFeatureCategories(updated);
    localStorage.setItem('admin_feature_categories', JSON.stringify(updated));
    
    _addLog({
      type: 'success',
      message: `Kategori eklendi: ${category.title}`,
      user: 'admin@tacticiq.app',
    });
  };

  const updateFeatureCategory = (id: string, category: Partial<FeatureCategory>) => {
    const updated = featureCategories.map(c => 
      c.id === id ? { ...c, ...category, updatedAt: new Date().toISOString() } : c
    ).sort((a, b) => a.order - b.order);
    setFeatureCategories(updated);
    localStorage.setItem('admin_feature_categories', JSON.stringify(updated));
    
    const updatedCategory = updated.find(c => c.id === id);
    if (updatedCategory) {
      _addLog({
        type: 'info',
        message: `Kategori güncellendi: ${updatedCategory.title}`,
        user: 'admin@tacticiq.app',
      });
    }
  };

  const deleteFeatureCategory = (id: string) => {
    const category = featureCategories.find(c => c.id === id);
    const updated = featureCategories.filter(c => c.id !== id);
    setFeatureCategories(updated);
    localStorage.setItem('admin_feature_categories', JSON.stringify(updated));
    
    if (category) {
      _addLog({
        type: 'warning',
        message: `Kategori silindi: ${category.title}`,
        user: 'admin@tacticiq.app',
      });
    }
  };

  const reorderFeatureCategories = (categories: FeatureCategory[]) => {
    const updated = categories.map((c, index) => ({ ...c, order: index + 1, updatedAt: new Date().toISOString() }));
    setFeatureCategories(updated);
    localStorage.setItem('admin_feature_categories', JSON.stringify(updated));
    
    _addLog({
      type: 'info',
      message: 'Kategori sıralaması güncellendi',
      user: 'admin@tacticiq.app',
    });
  };

  // Legal Documents CRUD - Yasal Belgeler
  useEffect(() => {
    const loadLegalDocuments = async () => {
      try {
        const documents = await legalDocumentsService.getAll();
        setLegalDocuments(documents);
      } catch (error) {
        console.error('Failed to load legal documents:', error);
      }
    };
    loadLegalDocuments();
  }, []);

  const addLegalDocument = async (document: Omit<LegalDocument, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const existing = legalDocuments.find(d => d.document_id === document.document_id && d.language === document.language);
      const newDoc = await legalDocumentsService.upsert(document);
      if (newDoc) {
        setLegalDocuments(prev => {
          if (existing) {
            return prev.map(d => d.id === existing.id ? newDoc : d);
          }
          return [...prev, newDoc];
        });
        
        _addLog({
          type: 'success',
          message: `Yasal belge ${existing ? 'güncellendi' : 'eklendi'}: ${document.title} (${document.language})`,
          user: 'admin@tacticiq.app',
        });
        addSessionChange({
          category: 'Yasal Belgeler',
          action: existing ? 'update' : 'create',
          description: `${document.title} (${document.language})`,
        });
      }
    } catch (error) {
      console.error('Failed to add legal document:', error);
    }
  };

  const updateLegalDocument = async (id: string, updates: Partial<LegalDocument>) => {
    try {
      const success = await legalDocumentsService.update(id, updates);
      if (success) {
        setLegalDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, ...updates } : doc));
        
        const doc = legalDocuments.find(d => d.id === id);
        if (doc) {
          _addLog({
            type: 'info',
            message: `Yasal belge güncellendi: ${doc.title} (${doc.language})`,
            user: 'admin@tacticiq.app',
          });
          addSessionChange({
            category: 'Yasal Belgeler',
            action: 'update',
            description: `${doc.title} (${doc.language})`,
          });
        }
      }
    } catch (error) {
      console.error('Failed to update legal document:', error);
    }
  };

  const deleteLegalDocument = async (id: string) => {
    try {
      const doc = legalDocuments.find(d => d.id === id);
      const success = await legalDocumentsService.delete(id);
      if (success) {
        setLegalDocuments(prev => prev.filter(doc => doc.id !== id));
        
        if (doc) {
          _addLog({
            type: 'warning',
            message: `Yasal belge silindi: ${doc.title} (${doc.language})`,
            user: 'admin@tacticiq.app',
          });
          addSessionChange({
            category: 'Yasal Belgeler',
            action: 'delete',
            description: `${doc.title} (${doc.language})`,
          });
        }
      }
    } catch (error) {
      console.error('Failed to delete legal document:', error);
    }
  };

  // Session Change Tracking - Oturum değişiklik takibi
  const addSessionChange = (change: Omit<ChangeLogEntry, 'id' | 'timestamp'>) => {
    const newChange: ChangeLogEntry = {
      ...change,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    setSessionChanges(prev => [...prev, newChange]);
  };

  const clearSessionChanges = () => {
    setSessionChanges([]);
  };

  const getSessionChangeSummary = (): string => {
    if (sessionChanges.length === 0) return '';
    
    const grouped = sessionChanges.reduce((acc, change) => {
      if (!acc[change.category]) {
        acc[change.category] = [];
      }
      acc[change.category].push(change);
      return acc;
    }, {} as Record<string, ChangeLogEntry[]>);

    let summary = `📊 Admin Panel Değişiklik Özeti\n`;
    summary += `📅 Tarih: ${new Date().toLocaleString('tr-TR')}\n`;
    summary += `📧 Gönderen: TacticIQ Admin Panel\n\n`;
    summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    Object.entries(grouped).forEach(([category, changes]) => {
      summary += `📁 ${category} (${changes.length} değişiklik)\n`;
      changes.forEach((change, index) => {
        const actionEmoji = change.action === 'create' ? '➕' : change.action === 'update' ? '✏️' : '🗑️';
        summary += `   ${index + 1}. ${actionEmoji} ${change.description}\n`;
        if (change.details) {
          summary += `      └─ ${change.details}\n`;
        }
      });
      summary += '\n';
    });

    summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    summary += `Toplam: ${sessionChanges.length} değişiklik\n`;

    return summary;
  };

  // Notification Settings - Bildirim ayarları
  const updateNotificationSettings = (updatedSettings: Partial<AdminNotificationSettings>) => {
    setNotificationSettings(prev => {
      const newSettings = { ...prev, ...updatedSettings };
      localStorage.setItem('admin_notification_settings', JSON.stringify(newSettings));
      // Supabase'e kaydet (async)
      configService.set('notification_settings', newSettings).catch(err => 
        console.error('Failed to save notification_settings to Supabase:', err)
      );
      return newSettings;
    });
    
    addSessionChange({
      category: 'Bildirim Ayarları',
      action: 'update',
      description: 'Bildirim ayarları güncellendi',
    });
  };

  // Settings - Supabase'e ve localStorage'a kaydet
  const updateAdSettings = (updatedSettings: Partial<AdSettings>) => {
    setAdSettings(prevSettings => {
      const newSettings = { ...prevSettings, ...updatedSettings };
      // localStorage'a hemen kaydet
      localStorage.setItem('admin_ad_settings', JSON.stringify(newSettings));
      // Supabase'e kaydet (async)
      configService.set('ad_settings', newSettings).catch(err => 
        console.error('Failed to save ad_settings to Supabase:', err)
      );
      return newSettings;
    });
    
    _addLog({
      type: 'success',
      message: 'Reklam ayarları güncellendi',
      user: 'admin@tacticiq.app',
    });

    // Session change tracking
    const changedKeys = Object.keys(updatedSettings).join(', ');
    addSessionChange({
      category: 'Reklam Ayarları',
      action: 'update',
      description: 'Reklam ayarları güncellendi',
      details: `Değiştirilen: ${changedKeys}`,
    });
  };

  const updatePriceSettings = (updatedSettings: Partial<PriceSettings>) => {
    setPriceSettings(prevSettings => {
      const mergedSettings = { ...prevSettings, ...updatedSettings };
      
      // Aktif döneme göre proPrice'ı otomatik güncelle
      const billingPeriod = mergedSettings.billingPeriod || prevSettings.billingPeriod;
      if (billingPeriod === 'monthly' && mergedSettings.monthlyPrice !== undefined) {
        mergedSettings.proPrice = mergedSettings.monthlyPrice;
      } else if (billingPeriod === 'yearly' && mergedSettings.yearlyPrice !== undefined) {
        mergedSettings.proPrice = mergedSettings.yearlyPrice;
      } else if (mergedSettings.billingPeriod && !mergedSettings.proPrice) {
        // Billing period değiştiyse ama fiyat güncellenmediyse, aktif fiyatı kullan
        mergedSettings.proPrice = billingPeriod === 'monthly' 
          ? (mergedSettings.monthlyPrice || prevSettings.monthlyPrice || prevSettings.proPrice)
          : (mergedSettings.yearlyPrice || prevSettings.yearlyPrice || prevSettings.proPrice);
      }
      
      const newSettings = mergedSettings as PriceSettings;
      console.log('Price Settings Updated:', newSettings);
      // localStorage'a kaydet
      localStorage.setItem('admin_price_settings', JSON.stringify(newSettings));
      // Supabase'e kaydet (async)
      configService.set('price_settings', newSettings).catch(err => 
        console.error('Failed to save price_settings to Supabase:', err)
      );
      return newSettings;
    });
    
    _addLog({
      type: 'success',
      message: 'Fiyat ayarları güncellendi',
      user: 'admin@tacticiq.app',
    });

    // Session change tracking
    addSessionChange({
      category: 'Fiyatlandırma',
      action: 'update',
      description: 'Fiyat ayarları güncellendi',
      details: updatedSettings.proPrice !== undefined ? `Pro fiyat: ${updatedSettings.proPrice}` : undefined,
    });
  };

  const updateDiscountSettings = (updatedSettings: Partial<DiscountSettings>) => {
    setDiscountSettings(prevSettings => {
      const newSettings = { ...prevSettings, ...updatedSettings };
      console.log('Discount Settings Updated:', newSettings);
      // localStorage'a kaydet
      localStorage.setItem('admin_discount_settings', JSON.stringify(newSettings));
      // Supabase'e kaydet (async)
      configService.set('discount_settings', newSettings).catch(err => 
        console.error('Failed to save discount_settings to Supabase:', err)
      );
      return newSettings;
    });
    
    _addLog({
      type: 'success',
      message: 'İndirim ayarları güncellendi',
      user: 'admin@tacticiq.app',
    });

    // Session change tracking
    addSessionChange({
      category: 'İndirim Ayarları',
      action: 'update',
      description: 'İndirim ayarları güncellendi',
      details: updatedSettings.discountPercent ? `İndirim: %${updatedSettings.discountPercent}` : undefined,
    });
  };

  // Profil Promosyon Ayarları Güncelleme
  const updateProfilePromoSettings = (updatedSettings: Partial<ProfilePromoSettings>) => {
    setProfilePromoSettings(prevSettings => {
      const newSettings = { ...prevSettings, ...updatedSettings };
      console.log('Profile Promo Settings Updated:', newSettings);
      // localStorage'a kaydet
      localStorage.setItem('admin_profile_promo_settings', JSON.stringify(newSettings));
      // Supabase'e kaydet (async)
      configService.set('profile_promo_settings', newSettings).catch(err => 
        console.error('Failed to save profile_promo_settings to Supabase:', err)
      );
      return newSettings;
    });
    
    _addLog({
      type: 'success',
      message: 'Profil promosyon ayarları güncellendi',
      user: 'admin@tacticiq.app',
    });

    // Session change tracking
    addSessionChange({
      category: 'Profil Promosyon Ayarları',
      action: 'update',
      description: 'Profil promosyon ayarları güncellendi',
      details: updatedSettings.discountPercent ? `İndirim: %${updatedSettings.discountPercent}` : undefined,
    });
  };

  const updateEmailAutoReply = (updatedSettings: Partial<EmailAutoReplySettings>) => {
    setEmailAutoReply({ ...emailAutoReply, ...updatedSettings });
    
    _addLog({
      type: 'success',
      message: 'Otomatik email cevap ayarları güncellendi',
      user: 'admin@tacticiq.app',
    });
  };

  const updateSettings = (updatedSettings: Partial<SiteSettings>) => {
    setSettings({ ...settings, ...updatedSettings });
    
    _addLog({
      type: 'success',
      message: 'Site ayarları güncellendi',
      user: 'admin@tacticiq.app',
    });

    // Session change tracking
    addSessionChange({
      category: 'Site Ayarları',
      action: 'update',
      description: 'Site ayarları güncellendi',
    });
  };

  const updateSectionSettings = (updatedSettings: Partial<SectionSettings>) => {
    // Deep merge için her section'ı ayrı ayrı merge et
    const merged: SectionSettings = {
      ...sectionSettings,
      // Tüm nested properties için deep merge
      hero: {
        ...sectionSettings.hero,
        ...(updatedSettings.hero || {}),
      },
      features: {
        ...sectionSettings.features,
        ...(updatedSettings.features || {}),
      },
      howItWorks: {
        ...sectionSettings.howItWorks,
        ...(updatedSettings.howItWorks || {}),
      },
      product: {
        ...sectionSettings.product,
        ...(updatedSettings.product || {}),
      },
      playerPrediction: {
        ...sectionSettings.playerPrediction,
        ...(updatedSettings.playerPrediction || {}),
      },
      training: {
        ...sectionSettings.training,
        ...(updatedSettings.training || {}),
      },
      pricing: {
        ...sectionSettings.pricing,
        ...(updatedSettings.pricing || {}),
      },
      blog: {
        ...sectionSettings.blog,
        ...(updatedSettings.blog || {}),
      },
      appDownload: {
        ...sectionSettings.appDownload,
        ...(updatedSettings.appDownload || {}),
      },
      cta: {
        ...sectionSettings.cta,
        ...(updatedSettings.cta || {}),
      },
      game: {
        ...sectionSettings.game,
        ...(updatedSettings.game || {}),
      },
      testimonials: {
        ...sectionSettings.testimonials,
        ...(updatedSettings.testimonials || {}),
      },
      about: {
        ...sectionSettings.about,
        ...(updatedSettings.about || {}),
      },
      partners: {
        ...sectionSettings.partners,
        ...(updatedSettings.partners || {}),
      },
      press: {
        ...sectionSettings.press,
        ...(updatedSettings.press || {}),
      },
      faq: {
        ...sectionSettings.faq,
        ...(updatedSettings.faq || {}),
      },
      contact: {
        ...sectionSettings.contact,
        ...(updatedSettings.contact || {}),
      },
      newsletter: {
        ...sectionSettings.newsletter,
        ...(updatedSettings.newsletter || {}),
      },
      footer: {
        ...sectionSettings.footer,
        ...(updatedSettings.footer || {}),
      },
      auth: {
        ...sectionSettings.auth,
        ...(updatedSettings.auth || {}),
      },
    };
    
    // State'i güncelle
    setSectionSettings(merged);
    // localStorage'a kaydet
    localStorage.setItem('admin_section_settings', JSON.stringify(merged));
    // Supabase'e kaydet (async)
    configService.set('section_settings', merged).catch(err => 
      console.error('Failed to save section_settings to Supabase:', err)
    );
    
    _addLog({
      type: 'success',
      message: 'Section ayarları güncellendi',
      user: 'admin@tacticiq.app',
    });

    // Session change tracking
    const changedSections = Object.keys(updatedSettings).join(', ');
    addSessionChange({
      category: 'Bölüm Ayarları',
      action: 'update',
      description: 'Bölüm görünürlük ayarları güncellendi',
      details: `Değiştirilen: ${changedSections}`,
    });
  };

  const updateWebsiteContent = (section: keyof WebsiteContent, content: WebsiteContent[keyof WebsiteContent]) => {
    setWebsiteContent({ ...websiteContent, [section]: content });
    
    _addLog({
      type: 'success',
      message: 'Web sitesi içeriği güncellendi',
      user: 'admin@tacticiq.app',
    });
  };

  // filterLogs is now from AdminUsersContext

  // Update stats (manual update for About section)
  const updateStats = (newStats: Partial<AdminStats>) => {
    setStats({ ...stats, ...newStats });

    _addLog({
      type: 'success',
      message: 'İstatistikler güncellendi',
      user: 'admin@tacticiq.app',
    });
  };

  // Refresh stats (simulate real-time update)
  const refreshStats = () => {
    setStats({
      ...stats,
      totalVisitors: stats.totalVisitors + Math.floor(Math.random() * 100),
      activeUsers: stats.activeUsers + Math.floor(Math.random() * 10),
    });

    _addLog({
      type: 'info',
      message: 'İstatistikler güncellendi',
      user: 'system',
    });
  };

  // Load data from Supabase (with localStorage fallback) on mount
  useEffect(() => {
    const loadFromSupabase = async () => {
      console.log('🔄 Loading admin data from Supabase...');
      
      try {
        // 1. Config değerlerini Supabase'den yükle
        const configs = await configService.getAll();
        console.log('📦 Loaded configs from Supabase:', Object.keys(configs));
        
        if (configs.price_settings) {
          setPriceSettings(prev => ({ ...prev, ...configs.price_settings }));
          localStorage.setItem('admin_price_settings', JSON.stringify(configs.price_settings));
        }
        
        if (configs.discount_settings) {
          setDiscountSettings(prev => ({ ...prev, ...configs.discount_settings }));
          localStorage.setItem('admin_discount_settings', JSON.stringify(configs.discount_settings));
        }
        
        if (configs.ad_settings) {
          setAdSettings(prev => ({ ...prev, ...configs.ad_settings }));
          localStorage.setItem('admin_ad_settings', JSON.stringify(configs.ad_settings));
        }
        
        if (configs.section_settings) {
          setSectionSettings(prev => ({ ...prev, ...configs.section_settings }));
          localStorage.setItem('admin_section_settings', JSON.stringify(configs.section_settings));
        }
        
        if (configs.notification_settings) {
          setNotificationSettings(prev => ({ ...prev, ...configs.notification_settings }));
          localStorage.setItem('admin_notification_settings', JSON.stringify(configs.notification_settings));
        }

        // 2. Partners'ı Supabase'den yükle
        const partnersData = await partnersService.getAll();
        if (partnersData.length > 0) {
          // snake_case -> camelCase dönüşümü
          const mappedPartners = partnersData.map((p: SupabasePartner) => ({
            id: p.id,
            name: p.name,
            logo: p.logo || '',
            website: p.website || '',
            description: p.description || '',
            category: p.category || '',
            enabled: p.enabled ?? true,
            featured: p.featured ?? false,
            order: p.sort_order || 0,
            createdAt: p.created_at || '',
            updatedAt: p.updated_at || ''
          }));
          setPartners(mappedPartners);
          if (import.meta.env.DEV) {
            console.log('✅ Partners loaded:', mappedPartners.length);
          }
        }

        // 3. Team Members'ı Supabase'den yükle
        const teamData = await teamMembersService.getAll();
        if (teamData.length > 0) {
          const mappedTeam = teamData.map((m: SupabaseTeamMember) => ({
            id: m.id,
            name: m.name,
            role: m.role || '',
            avatar: m.avatar || '',
            bio: m.bio || '',
            linkedin: m.linkedin,
            twitter: m.twitter,
            email: m.email,
            enabled: m.enabled ?? true,
            order: m.sort_order || 0
          }));
          setTeamMembers(mappedTeam);
          if (import.meta.env.DEV) {
            console.log('✅ Team members loaded:', mappedTeam.length);
          }
        }

        // 4. Advertisements'ı Supabase'den yükle
        const adsData = await advertisementsService.getAll();
        if (adsData.length > 0) {
          const mappedAds = adsData.map((a: SupabaseAdvertisement) => ({
            id: a.id,
            title: a.title,
            type: a.type || 'image',
            placement: a.placement || 'popup',
            mediaUrl: a.media_url || '',
            linkUrl: a.link_url || '',
            duration: a.duration || 10,
            frequency: a.frequency || 5,
            displayCount: a.display_count,
            currentDisplays: a.current_displays || 0,
            enabled: a.enabled ?? true,
            createdDate: a.created_at || ''
          }));
          setAdvertisements(mappedAds);
          if (import.meta.env.DEV) {
            console.log('✅ Advertisements loaded:', mappedAds.length);
          }
        }

        // 5. Feature Categories'ı Supabase'den yükle
        const categoriesData = await featureCategoriesService.getAll();
        if (categoriesData.length > 0) {
          const mappedCategories = categoriesData.map((c: SupabaseFeatureCategory) => ({
            id: c.id,
            key: c.key,
            title: c.title,
            description: c.description || '',
            emoji: c.emoji || '⚽',
            featured: c.featured ?? false,
            enabled: c.enabled ?? true,
            order: c.sort_order || 0,
            createdAt: c.created_at || '',
            updatedAt: c.updated_at || ''
          }));
          setFeatureCategories(mappedCategories);
          if (import.meta.env.DEV) {
            console.log('✅ Feature categories loaded:', mappedCategories.length);
          }
        }

        // 6. Section Media'yı Supabase'den yükle
        const mediaData = await sectionMediaService.getAll();
        if (mediaData.length > 0) {
          const mappedMedia = mediaData.map((m: SupabaseSectionMedia) => ({
            id: m.id,
            sectionId: m.section_id,
            type: m.type || 'image',
            title: m.title,
            description: m.description || '',
            url: m.url || '',
            altText: m.alt_text || '',
            order: m.sort_order || 0,
            enabled: m.enabled ?? true,
            createdAt: m.created_at || '',
            updatedAt: m.updated_at || ''
          }));
          setSectionMedia(mappedMedia);
          if (import.meta.env.DEV) {
            console.log('✅ Section media loaded:', mappedMedia.length);
          }
        }

        // 7. Games'i Supabase'den yükle
        const gamesData = await gamesService.getAll();
        if (gamesData.length > 0) {
          const mappedGames = gamesData.map((g: SupabaseGame) => ({
            id: g.id,
            name: g.name,
            logo: g.logo || '',
            link: g.link || '',
            description: g.description || '',
            enabled: g.enabled ?? true,
            featured: g.featured ?? false,
            order: g.sort_order || 0,
            createdAt: g.created_at || '',
            updatedAt: g.updated_at || ''
          }));
          setGames(mappedGames);
          if (import.meta.env.DEV) {
            console.log('✅ Games loaded:', mappedGames.length);
          }
        }

        // 8. Press Releases'ı Supabase'den yükle
        const pressData = await pressReleasesService.getAll();
        if (pressData.length > 0) {
          const mappedPress = pressData.map((p: SupabasePressRelease) => ({
            id: p.id,
            title: p.title,
            subtitle: p.subtitle || '',
            date: p.release_date || '',
            category: p.category || 'other',
            content: p.content || '',
            imageUrl: p.image_url || '',
            pdfUrl: p.pdf_url || '',
            enabled: p.enabled ?? true,
            featured: p.featured ?? false,
            author: p.author || '',
            tags: p.tags || []
          }));
          setPressReleases(mappedPress);
          if (import.meta.env.DEV) {
            console.log('✅ Press releases loaded:', mappedPress.length);
          }
        }

        // 9. Press Kit Files'ı Supabase'den yükle
        const pressKitData = await pressKitFilesService.getAll();
        if (pressKitData.length > 0) {
          const mappedPressKit = pressKitData.map((f: SupabasePressKitFile) => ({
            id: f.id,
            title: f.title,
            description: f.description || '',
            fileUrl: f.file_url || '',
            fileName: f.file_name || '',
            fileType: f.file_type || 'other',
            format: f.format || '',
            size: f.size || '',
            enabled: f.enabled ?? true,
            uploadedDate: f.created_at || ''
          }));
          setPressKitFiles(mappedPressKit);
          if (import.meta.env.DEV) {
            console.log('✅ Press kit files loaded:', mappedPressKit.length);
          }
        }

        // localStorage'dan yedek veriler (Supabase'de olmayan)
        const savedEmailAutoReply = localStorage.getItem('admin_email_auto_reply');
        const savedUsers = localStorage.getItem('admin_users');
        const savedContents = localStorage.getItem('admin_contents');
        const savedActivities = localStorage.getItem('admin_activities');
        const savedLogs = localStorage.getItem('admin_logs');
        const savedStats = localStorage.getItem('admin_stats');

        if (savedEmailAutoReply) {
          try {
            setEmailAutoReply(JSON.parse(savedEmailAutoReply));
          } catch (e) {
            console.error('Error loading email auto reply:', e);
          }
        }

        if (savedUsers) {
          try {
            setUsers(JSON.parse(savedUsers));
          } catch (e) {
            console.error('Error loading users:', e);
          }
        }

        if (savedContents) {
          try {
            setContents(JSON.parse(savedContents));
          } catch (e) {
            console.error('Error loading contents:', e);
          }
        }

        if (savedActivities) {
          try {
            setActivities(JSON.parse(savedActivities));
          } catch (e) {
            console.error('Error loading activities:', e);
          }
        }

        // Logs are managed by AdminUsersContext, skip here
        // They will be loaded by AdminUsersContext from localStorage

        if (savedStats) {
          try {
            setStats(JSON.parse(savedStats));
          } catch (e) {
            console.error('Error loading stats:', e);
          }
        }

        console.log('🎉 All data loaded from Supabase successfully!');
      } catch (error) {
        console.error('❌ Error loading from Supabase, falling back to localStorage:', error);
        
        // Fallback: localStorage'dan yükle
        const savedPriceSettings = localStorage.getItem('admin_price_settings');
        const savedDiscountSettings = localStorage.getItem('admin_discount_settings');
        const savedAdSettings = localStorage.getItem('admin_ad_settings');
        const savedSectionSettings = localStorage.getItem('admin_section_settings');
        
        if (savedPriceSettings) setPriceSettings(prev => ({ ...prev, ...JSON.parse(savedPriceSettings) }));
        if (savedDiscountSettings) setDiscountSettings(prev => ({ ...prev, ...JSON.parse(savedDiscountSettings) }));
        if (savedAdSettings) setAdSettings(prev => ({ ...prev, ...JSON.parse(savedAdSettings) }));
        if (savedSectionSettings) setSectionSettings(prev => ({ ...prev, ...JSON.parse(savedSectionSettings) }));
      }
    };

    loadFromSupabase();
  }, []);

  // Save priceSettings to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('admin_price_settings', JSON.stringify(priceSettings));
  }, [priceSettings]);

  // Save discountSettings to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('admin_discount_settings', JSON.stringify(discountSettings));
  }, [discountSettings]);

  // Save profilePromoSettings to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('admin_profile_promo_settings', JSON.stringify(profilePromoSettings));
  }, [profilePromoSettings]);

  // Save adSettings to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('admin_ad_settings', JSON.stringify(adSettings));
  }, [adSettings]);

  // Save sectionSettings to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('admin_section_settings', JSON.stringify(sectionSettings));
  }, [sectionSettings]);

  // Save settings to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('admin_settings', JSON.stringify(settings));
  }, [settings]);

  // Save pressKitFiles to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('admin_pressKitFiles', JSON.stringify(pressKitFiles));
  }, [pressKitFiles]);

  // Save emailAutoReply to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('admin_email_auto_reply', JSON.stringify(emailAutoReply));
  }, [emailAutoReply]);

  // Save teamMembers to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('admin_team_members', JSON.stringify(teamMembers));
  }, [teamMembers]);

  // Save pressReleases to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('admin_press_releases', JSON.stringify(pressReleases));
  }, [pressReleases]);

  // Save games to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('admin_games', JSON.stringify(games));
  }, [games]);

  // Users, activities, and logs are saved by AdminUsersContext
  // No need to save them here

  // Save contents to localStorage
  useEffect(() => {
    localStorage.setItem('admin_contents', JSON.stringify(contents));
  }, [contents]);

  // Save advertisements to localStorage
  useEffect(() => {
    localStorage.setItem('admin_advertisements', JSON.stringify(advertisements));
  }, [advertisements]);

  // Save stats to localStorage
  useEffect(() => {
    localStorage.setItem('admin_stats', JSON.stringify(stats));
  }, [stats]);

  // Save pressKitFiles to localStorage
  useEffect(() => {
    localStorage.setItem('admin_pressKitFiles', JSON.stringify(pressKitFiles));
  }, [pressKitFiles]);

  // Save featureCategories to localStorage
  useEffect(() => {
    localStorage.setItem('admin_feature_categories', JSON.stringify(featureCategories));
  }, [featureCategories]);

  // Context value'yu useMemo ile memoize et - state değişikliklerinde güncellenecek
  const value = useMemo(() => ({
    stats,
    users,
    contents,
    activities,
    logs,
    settings,
    sectionSettings, // Section kontrolü
    websiteContent,
    advertisements,
    adSettings,
    discountSettings,
    priceSettings, // Fiyat ayarları - indirimden bağımsız
    profilePromoSettings, // Profil sayfası promosyon ayarları
    pressKitFiles, // Basın kiti dosyaları
    emailAutoReply, // Otomatik email cevap ayarları
    teamMembers, // Ekip üyeleri
    pressReleases, // Basın bültenleri
    games, // Oyunlar
    partners, // Ortaklar
    sectionMedia, // Section görselleri ve metinleri
    featureCategories, // Tahmin kategorileri
    sessionChanges, // Oturum değişiklikleri
    notificationSettings, // Bildirim ayarları
    addUser,
    updateUser,
    deleteUser,
    addContent,
    updateContent,
    deleteContent,
    addAdvertisement,
    updateAdvertisement,
    deleteAdvertisement,
    addPressKitFile,
    updatePressKitFile,
    deletePressKitFile,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    addPressRelease,
    updatePressRelease,
    deletePressRelease,
    addGame,
    updateGame,
    deleteGame,
    addPartner,
    updatePartner,
    deletePartner,
    addSectionMedia,
    updateSectionMedia,
    deleteSectionMedia,
    getSectionMedia,
    addFeatureCategory,
    updateFeatureCategory,
    deleteFeatureCategory,
    reorderFeatureCategories,
    addLegalDocument,
    updateLegalDocument,
    deleteLegalDocument,
    updateAdSettings,
    updateDiscountSettings,
    updatePriceSettings,
    updateProfilePromoSettings,
    updateEmailAutoReply,
    updateSettings,
    updateSectionSettings, // Section ayarlarını güncelle
    updateWebsiteContent,
    filterLogs,
    refreshStats,
    updateStats,
    // Değişiklik Takip Sistemi
    addSessionChange,
    clearSessionChanges,
    getSessionChangeSummary,
    updateNotificationSettings,
  }), [
    stats, users, contents, activities, logs, settings, sectionSettings,
    websiteContent, advertisements, adSettings, discountSettings, priceSettings, profilePromoSettings,
    pressKitFiles, emailAutoReply, teamMembers, pressReleases, games, partners, sectionMedia, featureCategories, legalDocuments,
    sessionChanges, notificationSettings
  ]);

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

// Export AdminDataProvider - wraps AdminDataProviderInternal with AdminUsersProvider
export function AdminDataProvider({ children }: { children: ReactNode }) {
  return (
    <AdminUsersProvider>
      <AdminDataProviderInternal>{children}</AdminDataProviderInternal>
    </AdminUsersProvider>
  );
}

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }
  return context;
}

// Safe hook that doesn't throw - returns undefined if not in provider
export function useAdminDataSafe() {
  return useContext(AdminDataContext);
}