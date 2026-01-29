// Admin Data Types
// All TypeScript interfaces and types for AdminDataContext

export interface AdminStats {
  totalVisitors: number;
  activeUsers: number;
  monthlyRevenue: number;
  conversionRate: number;
  visitorChange: number;
  userChange: number;
  revenueChange: number;
  conversionChange: number;
  // About Section Stats
  foundedYear: number; // Kuruluş yılı
  totalUsers: string; // Toplam kullanıcı (örn: "0.0K+")
  totalLeagues: number; // Toplam lig sayısı
  totalLanguages: number; // Desteklenen dil sayısı
  totalCountries: string; // Toplam ülke (örn: "150+")
  // Stats Section (Hero altındaki istatistikler)
  averageRating: string; // Ortalama değerlendirme (örn: "4.9/5")
  totalPredictions: number; // Toplam tahmin sayısı
  // Analytics - Coğrafi Dağılım
  geoDistribution: { country: string; percentage: number }[];
  // Analytics - Ziyaret Saatleri
  visitHours: { timeRange: string; percentage: number }[];
  // Analytics - Kullanıcı Segmentleri
  userSegments: { segment: string; percentage: number }[];
  // Analytics - Büyüme Metrikleri
  growthMetrics: { label: string; value: string; change: string }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'Free' | 'Premium';
  status: 'active' | 'inactive';
  joinDate: string;
}

export interface Content {
  id: string;
  title: string;
  type: 'Blog' | 'Sayfa' | 'Video';
  status: 'Yayında' | 'Taslak' | 'Zamanlandı';
  date: string;
  author: string;
}

export interface Activity {
  id: string;
  type: 'user' | 'payment' | 'content' | 'system';
  title: string;
  description: string;
  time: string;
}

export interface LogEntry {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  user: string;
  time: string;
}

export interface Advertisement {
  id: string;
  title: string;
  type: 'image' | 'video';
  placement: 'popup' | 'banner' | 'sidebar'; // Reklam yerleşimi
  mediaUrl: string;
  linkUrl?: string;
  duration: number; // seconds for display
  frequency: number; // show every X minutes
  displayCount?: number; // Kaç kez gösterilecek (opsiyonel, sınırsız için boş)
  currentDisplays?: number; // Şimdiye kadar kaç kez gösterildi
  enabled: boolean;
  createdDate: string;
}

export interface AdSettings {
  systemEnabled: boolean; // Tüm reklam sistemini aç/kapa
  popupEnabled: boolean; // Pop-up reklamları
  bannerEnabled: boolean; // Banner reklamları
  sidebarEnabled: boolean; // Sidebar reklamları
  adminEmail: string; // Reklam bildirimleri için mail
}

// Section Media - Her bölüm için metin ve görsel yönetimi
export interface SectionMediaItem {
  id: string;
  sectionId: string; // Hangi section'a ait (hero, features, pricing, vb.)
  type: 'image' | 'video' | 'text';
  title: string;
  description?: string;
  url?: string; // Görsel/video URL'i
  altText?: string; // Görsel alternatif metni
  order: number; // Sıralama
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Press Kit - Basın Kiti Dosyaları
export interface PressKitFile {
  id: string;
  title: string;
  description: string;
  fileUrl: string; // Dosya URL'i
  fileName: string; // Dosya adı
  fileType: 'logo' | 'brand-guide' | 'screenshot' | 'document' | 'other'; // Dosya tipi
  format: string; // PDF, PNG, SVG, ZIP vs.
  size: string; // Dosya boyutu (örn: "2.4 MB")
  enabled: boolean; // Gösterilsin mi?
  uploadedDate: string;
}

// Email Auto-Reply Settings - Otomatik Email Cevap Ayarları
export interface EmailAutoReplySettings {
  enabled: boolean; // Otomatik cevap aktif mi?
  supportEmail: string; // Destek email adresi (örn: support@tacticiq.app)
  replySubject: string; // Otomatik cevap konu başlığı
  replyMessage: string; // Otomatik cevap mesajı
  replyDelay: number; // Cevap gecikmesi (saniye, 0 = anında)
  signature: string; // Email imzası
  businessHours: boolean; // Sadece iş saatlerinde mi?
  businessHoursStart: string; // İş saatleri başlangıç (örn: "09:00")
  businessHoursEnd: string; // İş saatleri bitiş (örn: "18:00")
  outOfOfficeMessage: string; // Mesai dışı otomatik cevap
}

// Team Member - Ekip Üyesi
export interface TeamMember {
  id: string;
  name: string;
  role: string; // Pozisyon/rol
  avatar: string; // İnisiyaller (örn: "ED")
  bio: string; // Kısa biyografi
  linkedin?: string; // LinkedIn profil linki
  twitter?: string; // Twitter profil linki
  email?: string; // Email adresi
  enabled: boolean; // Gösterilsin mi?
  order: number; // Sıralama
}

// Partner - Ortak/Partner
export interface Partner {
  id: string;
  name: string; // Partner adı
  logo: string; // Partner logosu (URL veya base64)
  website?: string; // Partner web sitesi
  description?: string; // Partner açıklaması
  category?: string; // Kategori (örn: "Sponsor", "Teknoloji Ortağı", "Medya Ortağı")
  enabled: boolean; // Gösterilsin mi?
  featured: boolean; // Öne çıkan mı?
  order: number; // Sıralama
  createdAt: string; // Oluşturulma tarihi
  updatedAt: string; // Güncellenme tarihi
}

// Press Release - Basın Bülteni
export interface PressRelease {
  id: string;
  title: string;
  subtitle?: string;
  date: string; // Yayın tarihi
  category: 'product' | 'partnership' | 'award' | 'event' | 'other'; // Kategori
  content: string; // Bülten içeriği (Markdown destekli)
  imageUrl?: string; // Kapak görseli
  pdfUrl?: string; // PDF dosyası
  enabled: boolean; // Yayında mı?
  featured: boolean; // Öne çıkan mı?
  author: string; // Yazar
  tags: string[]; // Etiketler
}

// Game - Oyun (Partner Oyunlar)
export interface Game {
  id: string;
  name: string; // Oyun adı
  logo: string; // Oyun logosu (PNG/JPG/SVG URL veya base64)
  link: string; // Oyun linki (URL)
  description?: string; // Oyun açıklaması
  enabled: boolean; // Gösterilsin mi?
  featured: boolean; // Öne çıkan mı?
  order: number; // Sıralama
  createdAt: string; // Oluşturulma tarihi
  updatedAt: string; // Güncellenme tarihi
}

// Feature Category - Tahmin Kategorisi (15 Tahmin Kategorisi bölümü)
export interface FeatureCategory {
  id: string;
  key: string; // Benzersiz anahtar (örn: 'halftime_score', 'yellow_cards')
  title: string; // Başlık
  description: string; // Açıklama
  emoji: string; // Emoji/İkon
  featured: boolean; // Öne çıkan (yıldızlı) mı?
  enabled: boolean; // Aktif mi?
  order: number; // Sıralama
  createdAt: string;
  updatedAt: string;
}

// Değişiklik Takip Sistemi - Admin oturumundaki değişiklikleri takip eder
export interface ChangeLogEntry {
  id: string;
  timestamp: string;
  category: string; // Hangi bölümde değişiklik yapıldı (örn: 'Fiyatlandırma', 'Reklam Ayarları')
  action: 'create' | 'update' | 'delete'; // İşlem tipi
  description: string; // Değişiklik açıklaması
  details?: string; // Ek detaylar
}

// Legal Document - Yasal Belge
export interface LegalDocument {
  id: string;
  document_id: string; // 'terms', 'privacy', 'cookies', 'kvkk', 'consent', 'sales', 'copyright'
  language: string; // 'tr', 'en', 'de', 'fr', 'es', 'it', 'ar', 'zh'
  title: string;
  content: string;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

// Admin Bildirim Ayarları
export interface AdminNotificationSettings {
  notificationEmail: string; // Bildirim gönderilecek email adresi
  sendOnExit: boolean; // Çıkışta email gönder
  sendOnImportantChanges: boolean; // Önemli değişikliklerde email gönder
}

// Fiyat Ayarları - İndirim popup'ından bağımsız
export interface PriceSettings {
  proPrice: number; // Pro plan fiyatı (girilen para birimi cinsinden) - aktif fiyat
  baseCurrency: 'TRY' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CNY'; // Fiyatın girildiği para birimi
  freeTrialDays: number; // Ücretsiz deneme süresi (gün)
  monthlyPrice?: number; // Aylık fiyat (opsiyonel)
  yearlyPrice?: number; // Yıllık fiyat (opsiyonel)
  billingPeriod: 'monthly' | 'yearly'; // Aktif fatura dönemi - web'de gösterilecek
}

// İndirim Popup Ayarları - Fiyattan bağımsız
export interface DiscountSettings {
  enabled: boolean; // İndirim popup'ı aktif mi?
  discountPercent: number; // İndirim yüzdesi (örn: 20 = %20)
  showDiscountOnWeb: boolean; // İndirimli fiyatı web'de göster (true) veya sadece popup'ta göster (false)
  showDiscountViaPopup: boolean; // Popup ile indirimi göster - web'de normal fiyat, popup'ta indirimli fiyat
  dailyShowLimit: number; // Günde kaç kere gösterilecek (0 = sınırsız)
  showDelay: number; // Kaç saniye sonra gösterilecek (örn: 5000 = 5 saniye)
  timerDuration: number; // Geri sayım süresi (saniye cinsinden, örn: 600 = 10 dakika)
  maxShowsPerUser: number; // Kullanıcı başına maksimum toplam gösterim (0 = sınırsız)
  cooldownAfterClose: number; // Kapatıldıktan sonra tekrar gösterme süresi (saniye, örn: 3600 = 1 saat)
  showOnEveryPage: boolean; // Her sayfa yüklemesinde mi yoksa sadece ana sayfada mı gösterilsin
  popupTitle: string; // Popup başlığı
  popupDescription: string; // Popup açıklaması
  ctaButtonText: string; // CTA buton metni
}

// Profil Sayfası Promosyon Ayarları
export interface ProfilePromoSettings {
  enabled: boolean; // Profil promosyonu aktif mi?
  discountPercent: number; // Sadece % olarak indirim (örn: 30 = %30)
  dailyShowLimit: number; // Günde kaç kez gösterilecek (0 = sınırsız)
  showDuration: number; // Her gösterimde kaç saniye görünecek (0 = süresiz)
  promoTitle: string; // Promosyon başlığı (örn: "Şimdi Üye Ol!")
  promoDescription: string; // Promosyon açıklaması
  ctaButtonText: string; // Buton metni (örn: "İndirimli Satın Al")
  showTimer: boolean; // Geri sayım göster
  timerDuration: number; // Geri sayım süresi (saniye)
  showOriginalPrice: boolean; // Orijinal fiyatı üstü çizili göster
  badgeText: string; // İndirim rozeti metni (örn: "Özel Teklif")
  backgroundColor: string; // Arka plan rengi
  textColor: string; // Metin rengi
}

export interface SiteSettings {
  siteName: string;
  siteUrl: string;
  defaultLanguage: string;
  timezone: string;
  smtpServer: string;
  senderEmail: string;
  emailLimit: number;
  newUserNotifications: boolean;
  premiumSaleNotifications: boolean;
  errorNotifications: boolean;
  dailyReport: boolean;
  // Currency settings
  autoUpdateCurrency: boolean; // Otomatik kur güncellemesi
  lastCurrencyUpdate?: string; // Son kur güncelleme zamanı
  defaultCurrency: 'TRY' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CNY'; // Varsayılan para birimi
  // Mobile App QR Codes
  googlePlayQRCode?: string; // Google Play Store QR kodu (base64 veya URL)
  appStoreQRCode?: string; // Apple App Store QR kodu (base64 veya URL)
  // Game System
  gameEnabled: boolean; // Oyun sistemi aktif mi?
  // Admin Security
  adminPassword: string; // Admin giriş şifresi (hash'lenmiş)
  loginAttempts: number; // Başarısız giriş denemeleri
  lastLoginAttempt?: string; // Son giriş denemesi zamanı
  lockoutUntil?: string; // Hesap kilitlenme süresi
  // Contact Information
  contactEmail: string; // İletişim email adresi
  contactPhone?: string; // İletişim telefon numarası
  contactAddress?: string; // Şirket adresi
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
}

// Website Section Control Settings
export interface SectionSettings {
  hero: {
    enabled: boolean;
    showStats: boolean; // İstatistikleri göster
    showEmailSignup: boolean; // Email kayıt formunu göster
    showPlayButton: boolean; // Oyun oyna butonunu göster
  };
  features: {
    enabled: boolean;
    maxFeatures: number; // Gösterilecek maksimum özellik sayısı
  };
  howItWorks: {
    enabled: boolean;
  };
  product: {
    enabled: boolean;
  };
  playerPrediction: {
    enabled: boolean;
  };
  training: {
    enabled: boolean;
  };
  pricing: {
    enabled: boolean;
    showFreeOption: boolean; // Ücretsiz planı göster
    discountEnabled: boolean; // İndirim göster
  };
  blog: {
    enabled: boolean;
    maxPosts: number; // Gösterilecek maksimum blog sayısı
  };
  appDownload: {
    enabled: boolean;
    showQRCodes: boolean; // QR kodlarını göster
  };
  cta: {
    enabled: boolean;
  };
  game: {
    enabled: boolean; // Oyun section'ı görünür mü?
  };
  testimonials: {
    enabled: boolean;
    showStats: boolean; // Alt kısımdaki istatistikleri göster
  };
  about: {
    enabled: boolean;
    showTeam: boolean; // Ekip üyelerini göster
    showMission: boolean; // Misyon & Vizyon göster
  };
  partners: {
    enabled: boolean;
  };
  press: {
    enabled: boolean;
  };
  faq: {
    enabled: boolean;
  };
  contact: {
    enabled: boolean;
    emailAddress: string; // İletişim e-posta adresi
    officeAddress: string; // Ofis adresi
    workingHours: string; // Çalışma saatleri
    workingDays: string; // Çalışma günleri
    responseTime: string; // Yanıt süresi
  };
  // Newsletter Ayarları
  newsletter: {
    enabled: boolean;
  };
  // Footer Ayarları
  footer: {
    enabled: boolean; // Footer görünür mü?
    showVisitorCounter: boolean; // Ziyaretçi sayacını göster (admin için)
    showSocialLinks: boolean; // Sosyal medya linklerini göster
    showAppDownloadButtons: boolean; // Uygulama indirme butonlarını göster
  };
  // Kayıt/Giriş Ayarları
  auth: {
    enabled: boolean; // Kayıt/giriş sistemi aktif mi?
    requireAgeVerification: boolean; // Yaş doğrulama zorunlu mu?
    minimumAge: number; // Minimum yaş (örn: 18)
    enableGoogleAuth: boolean; // Google ile giriş aktif mi?
    enableAppleAuth: boolean; // Apple ile giriş aktif mi?
    enableEmailAuth: boolean; // E-posta ile giriş aktif mi?
    requireEmailConfirmation: boolean; // E-posta doğrulama zorunlu mu?
    requireTermsAcceptance: boolean; // Kullanım şartları onayı zorunlu mu?
    requirePrivacyAcceptance: boolean; // Gizlilik politikası onayı zorunlu mu?
  };
}

// Game System Types
export interface GameSettings {
  enabled: boolean; // Oyun modülü açık/kapalı
  maxPlayersPerGame: number; // Oyun başına maksimum oyuncu sayısı
  gameDuration: number; // Oyun süresi (dakika)
  pointsPerCorrectPrediction: number; // Doğru tahmin başına puan
  penaltyPerWrongPrediction: number; // Yanlış tahmin ceza puanı
  enableLeaderboard: boolean; // Liderlik tablosu aktif mi?
  enableMultiplayer: boolean; // Çok oyunculu mod aktif mi?
  dailyGameLimit: number; // Günlük oyun limiti (0 = sınırsız)
  requirePremium: boolean; // Premium üyelik gerektiriyor mu?
}

export interface GameData {
  id: string;
  userId: string;
  matchId: string;
  predictions: GamePrediction[];
  score: number;
  status: 'active' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt?: string;
}

export interface GamePrediction {
  category: string;
  prediction: Record<string, unknown>; // Generic prediction data structure
  isCorrect?: boolean;
  pointsEarned?: number;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  totalScore: number;
  gamesPlayed: number;
  accuracy: number; // percentage
  rank: number;
}

export interface WebsiteSection {
  id: string;
  name: string;
  title: string;
  description: string;
  buttonText?: string;
  enabled: boolean;
}

export interface WebsiteContent {
  hero: {
    title: string;
    subtitle: string;
    buttonText: string;
  };
  features: {
    title: string;
    description: string;
    items: Array<{
      id: string;
      title: string;
      description: string;
    }>;
  };
  pricing: {
    title: string;
    description: string;
    plans: Array<{
      id: string;
      name: string;
      price: string;
      description: string;
      features: string[];
    }>;
  };
  blog: {
    title: string;
    description: string;
  };
  cta: {
    title: string;
    description: string;
    buttonText: string;
  };
}

export interface AdminDataContextType {
  stats: AdminStats;
  users: User[];
  contents: Content[];
  activities: Activity[];
  logs: LogEntry[];
  settings: SiteSettings;
  sectionSettings: SectionSettings; // Section kontrolü
  websiteContent: WebsiteContent;
  advertisements: Advertisement[];
  adSettings: AdSettings;
  discountSettings: DiscountSettings;
  priceSettings: PriceSettings; // Fiyat ayarları - indirimden bağımsız
  profilePromoSettings: ProfilePromoSettings; // Profil sayfası promosyon ayarları
  pressKitFiles: PressKitFile[]; // Basın kiti dosyaları
  emailAutoReply: EmailAutoReplySettings; // Otomatik email cevap ayarları
  teamMembers: TeamMember[]; // Ekip üyeleri
  pressReleases: PressRelease[]; // Basın bültenleri
  games: Game[]; // Oyunlar (Partner Oyunlar)
  partners: Partner[]; // Ortaklar/Partnerler
  sectionMedia: SectionMediaItem[]; // Section görselleri ve metinleri
  featureCategories: FeatureCategory[]; // Tahmin kategorileri (15 Tahmin Kategorisi)
  legalDocuments: LegalDocument[]; // Yasal belgeler
  addUser: (user: Omit<User, 'id' | 'joinDate'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addContent: (content: Omit<Content, 'id' | 'date'>) => void;
  updateContent: (id: string, content: Partial<Content>) => void;
  deleteContent: (id: string) => void;
  addAdvertisement: (ad: Omit<Advertisement, 'id' | 'createdDate'>) => void;
  updateAdvertisement: (id: string, ad: Partial<Advertisement>) => void;
  deleteAdvertisement: (id: string) => void;
  addPressKitFile: (file: Omit<PressKitFile, 'id' | 'uploadedDate'>) => void;
  updatePressKitFile: (id: string, file: Partial<PressKitFile>) => void;
  deletePressKitFile: (id: string) => void;
  addTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  updateTeamMember: (id: string, member: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;
  addPressRelease: (release: Omit<PressRelease, 'id'>) => void;
  updatePressRelease: (id: string, release: Partial<PressRelease>) => void;
  deletePressRelease: (id: string) => void;
  addGame: (game: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGame: (id: string, game: Partial<Game>) => void;
  deleteGame: (id: string) => void;
  addPartner: (partner: Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePartner: (id: string, partner: Partial<Partner>) => void;
  deletePartner: (id: string) => void;
  addSectionMedia: (media: Omit<SectionMediaItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSectionMedia: (id: string, media: Partial<SectionMediaItem>) => void;
  deleteSectionMedia: (id: string) => void;
  getSectionMedia: (sectionId: string) => SectionMediaItem[];
  addFeatureCategory: (category: Omit<FeatureCategory, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateFeatureCategory: (id: string, category: Partial<FeatureCategory>) => void;
  deleteFeatureCategory: (id: string) => void;
  reorderFeatureCategories: (categories: FeatureCategory[]) => void;
  addLegalDocument: (document: Omit<LegalDocument, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateLegalDocument: (id: string, updates: Partial<LegalDocument>) => Promise<void>;
  deleteLegalDocument: (id: string) => Promise<void>;
  updateAdSettings: (settings: Partial<AdSettings>) => void;
  updateDiscountSettings: (settings: Partial<DiscountSettings>) => void;
  updatePriceSettings: (settings: Partial<PriceSettings>) => void;
  updateProfilePromoSettings: (settings: Partial<ProfilePromoSettings>) => void;
  updateEmailAutoReply: (settings: Partial<EmailAutoReplySettings>) => void;
  updateSettings: (settings: Partial<SiteSettings>) => void;
  updateSectionSettings: (settings: Partial<SectionSettings>) => void; // Section ayarlarını güncelle
  updateWebsiteContent: (section: keyof WebsiteContent, content: WebsiteContent[keyof WebsiteContent]) => void;
  filterLogs: (type: 'all' | 'info' | 'success' | 'warning' | 'error') => LogEntry[];
  refreshStats: () => void;
  updateStats: (stats: Partial<AdminStats>) => void;
  // Değişiklik Takip Sistemi
  sessionChanges: ChangeLogEntry[];
  addSessionChange: (change: Omit<ChangeLogEntry, 'id' | 'timestamp'>) => void;
  clearSessionChanges: () => void;
  getSessionChangeSummary: () => string;
  // Admin Bildirim Ayarları
  notificationSettings: AdminNotificationSettings;
  updateNotificationSettings: (settings: Partial<AdminNotificationSettings>) => void;
}
