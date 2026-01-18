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
  syncService
} from '../services/adminSupabaseService';

// Currency Exchange Rates (TRY bazlı - 1 TRY = X)
export const EXCHANGE_RATES = {
  TRY: 1,
  USD: 0.029, // 1 TRY = 0.029 USD
  EUR: 0.027, // 1 TRY = 0.027 EUR
  GBP: 0.023, // 1 TRY = 0.023 GBP
  AED: 0.106, // 1 TRY = 0.106 AED
  CNY: 0.211, // 1 TRY = 0.211 CNY
};

// Dil Kodları - Dil Adları Eşleştirmesi (i18n.language -> LANGUAGE_CURRENCY_MAP için)
export const LANGUAGE_CODE_TO_NAME: Record<string, string> = {
  'tr': 'Türkçe',
  'en': 'English',
  'de': 'Deutsch',
  'fr': 'Français',
  'es': 'Español',
  'it': 'Italiano',
  'ar': 'العربية',
  'zh': '中文',
};

// Dil - Para Birimi Eşleştirmesi
export const LANGUAGE_CURRENCY_MAP: Record<string, 'TRY' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CNY'> = {
  'Türkçe': 'TRY',
  'English': 'USD',
  'Deutsch': 'EUR',
  'Français': 'EUR',
  'Español': 'EUR',
  'Italiano': 'EUR',
  'العربية': 'AED',
  '中文': 'CNY',
  // Dil kodları için direkt mapping (ek güvenlik)
  'tr': 'TRY',
  'en': 'USD',
  'de': 'EUR',
  'fr': 'EUR',
  'es': 'EUR',
  'it': 'EUR',
  'ar': 'AED',
  'zh': 'CNY',
};

// Para Birimi Sembolleri
export const CURRENCY_SYMBOLS: Record<string, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  CNY: '¥',
};

// Para birimi çevirme fonksiyonu
export function convertCurrency(
  amount: number,
  fromCurrency: 'TRY' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CNY',
  toCurrency: 'TRY' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CNY'
): number {
  // Önce TRY'ye çevir
  const amountInTRY = amount / EXCHANGE_RATES[fromCurrency];
  // Sonra hedef para birimine çevir
  return amountInTRY * EXCHANGE_RATES[toCurrency];
}

// Fiyat formatla
export function formatPrice(
  amount: number,
  currency: 'TRY' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CNY'
): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  return `${symbol}${amount.toFixed(2)}`;
}

// Types
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
  prediction: any;
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

interface AdminDataContextType {
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
  pressKitFiles: PressKitFile[]; // Basın kiti dosyaları
  emailAutoReply: EmailAutoReplySettings; // Otomatik email cevap ayarları
  teamMembers: TeamMember[]; // Ekip üyeleri
  pressReleases: PressRelease[]; // Basın bültenleri
  games: Game[]; // Oyunlar (Partner Oyunlar)
  partners: Partner[]; // Ortaklar/Partnerler
  sectionMedia: SectionMediaItem[]; // Section görselleri ve metinleri
  featureCategories: FeatureCategory[]; // Tahmin kategorileri (15 Tahmin Kategorisi)
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
  updateAdSettings: (settings: Partial<AdSettings>) => void;
  updateDiscountSettings: (settings: Partial<DiscountSettings>) => void;
  updatePriceSettings: (settings: Partial<PriceSettings>) => void;
  updateEmailAutoReply: (settings: Partial<EmailAutoReplySettings>) => void;
  updateSettings: (settings: Partial<SiteSettings>) => void;
  updateSectionSettings: (settings: Partial<SectionSettings>) => void; // Section ayarlarını güncelle
  updateWebsiteContent: (section: keyof WebsiteContent, content: any) => void;
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

export const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export function AdminDataProvider({ children }: { children: ReactNode }) {
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

  // Users - Gerçek veriler localStorage'dan yüklenecek veya API'den gelecek
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('admin_users');
    return savedUsers ? JSON.parse(savedUsers) : [];
  });

  // Contents - Gerçek veriler localStorage'dan yüklenecek veya API'den gelecek
  const [contents, setContents] = useState<Content[]>(() => {
    const savedContents = localStorage.getItem('admin_contents');
    return savedContents ? JSON.parse(savedContents) : [];
  });

  // Activities - Gerçek veriler localStorage'dan yüklenecek veya API'den gelecek
  const [activities, setActivities] = useState<Activity[]>(() => {
    const savedActivities = localStorage.getItem('admin_activities');
    return savedActivities ? JSON.parse(savedActivities) : [];
  });

  // Logs - Gerçek veriler localStorage'dan yüklenecek veya API'den gelecek
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const savedLogs = localStorage.getItem('admin_logs');
    return savedLogs ? JSON.parse(savedLogs) : [];
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
      proPrice: 99.99,
      baseCurrency: 'TRY',
      freeTrialDays: 7,
      monthlyPrice: 29.99,
      yearlyPrice: 99.99,
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
    contactPhone: '+90 555 123 4567',
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

  // User CRUD
  const addUser = (user: Omit<User, 'id' | 'joinDate'>) => {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      joinDate: new Date().toISOString().split('T')[0],
    };
    setUsers([newUser, ...users]);
    
    // Add activity
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'user',
      title: 'Yeni Kullanıcı Eklendi',
      description: `${user.email} sisteme eklendi`,
      time: 'Az önce',
    };
    setActivities([newActivity, ...activities]);

    // Add log
    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'info',
      message: 'Yeni kullanıcı eklendi',
      user: user.email,
      time: new Date().toLocaleString('tr-TR'),
    };
    setLogs([newLog, ...logs]);
  };

  const updateUser = (id: string, updatedUser: Partial<User>) => {
    setUsers(users.map(user => user.id === id ? { ...user, ...updatedUser } : user));
    
    const user = users.find(u => u.id === id);
    if (user) {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        type: 'info',
        message: 'Kullanıcı bilgileri güncellendi',
        user: user.email,
        time: new Date().toLocaleString('tr-TR'),
      };
      setLogs([newLog, ...logs]);
    }
  };

  const deleteUser = (id: string) => {
    const user = users.find(u => u.id === id);
    setUsers(users.filter(user => user.id !== id));
    
    if (user) {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        type: 'warning',
        message: 'Kullanıcı silindi',
        user: user.email,
        time: new Date().toLocaleString('tr-TR'),
      };
      setLogs([newLog, ...logs]);
    }
  };

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

    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'success',
      message: `Yeni ${content.type} eklendi: ${content.title}`,
      user: content.author,
      time: new Date().toLocaleString('tr-TR'),
    };
    setLogs([newLog, ...logs]);
  };

  const updateContent = (id: string, updatedContent: Partial<Content>) => {
    setContents(contents.map(content => content.id === id ? { ...content, ...updatedContent } : content));
    
    const content = contents.find(c => c.id === id);
    if (content) {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        type: 'info',
        message: `İçerik güncellendi: ${content.title}`,
        user: 'admin@tacticiq.app',
        time: new Date().toLocaleString('tr-TR'),
      };
      setLogs([newLog, ...logs]);
    }
  };

  const deleteContent = (id: string) => {
    const content = contents.find(c => c.id === id);
    setContents(contents.filter(content => content.id !== id));
    
    if (content) {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        type: 'warning',
        message: `İçerik silindi: ${content.title}`,
        user: 'admin@tacticiq.app',
        time: new Date().toLocaleString('tr-TR'),
      };
      setLogs([newLog, ...logs]);
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

    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'success',
      message: `Yeni reklam eklendi: ${ad.title}`,
      user: 'admin@tacticiq.app',
      time: new Date().toLocaleString('tr-TR'),
    };
    setLogs([newLog, ...logs]);
  };

  const updateAdvertisement = (id: string, updatedAd: Partial<Advertisement>) => {
    setAdvertisements(advertisements.map(ad => ad.id === id ? { ...ad, ...updatedAd } : ad));
    
    const ad = advertisements.find(a => a.id === id);
    if (ad) {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        type: 'info',
        message: `Reklam güncellendi: ${ad.title}`,
        user: 'admin@tacticiq.app',
        time: new Date().toLocaleString('tr-TR'),
      };
      setLogs([newLog, ...logs]);
    }
  };

  const deleteAdvertisement = (id: string) => {
    const ad = advertisements.find(a => a.id === id);
    setAdvertisements(advertisements.filter(ad => ad.id !== id));
    
    if (ad) {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        type: 'warning',
        message: `Reklam silindi: ${ad.title}`,
        user: 'admin@tacticiq.app',
        time: new Date().toLocaleString('tr-TR'),
      };
      setLogs([newLog, ...logs]);
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

    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'success',
      message: `Yeni basın kiti dosyası eklendi: ${file.title}`,
      user: 'admin@tacticiq.app',
      time: new Date().toLocaleString('tr-TR'),
    };
    setLogs([newLog, ...logs]);
  };

  const updatePressKitFile = (id: string, updatedFile: Partial<PressKitFile>) => {
    setPressKitFiles(pressKitFiles.map(file => file.id === id ? { ...file, ...updatedFile } : file));
    
    const file = pressKitFiles.find(f => f.id === id);
    if (file) {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        type: 'info',
        message: `Basın kiti dosyası güncellendi: ${file.title}`,
        user: 'admin@tacticiq.app',
        time: new Date().toLocaleString('tr-TR'),
      };
      setLogs([newLog, ...logs]);
    }
  };

  const deletePressKitFile = (id: string) => {
    const file = pressKitFiles.find(f => f.id === id);
    setPressKitFiles(pressKitFiles.filter(file => file.id !== id));
    
    if (file) {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        type: 'warning',
        message: `Basın kiti dosyası silindi: ${file.title}`,
        user: 'admin@tacticiq.app',
        time: new Date().toLocaleString('tr-TR'),
      };
      setLogs([newLog, ...logs]);
    }
  };

  // Team Member CRUD
  const addTeamMember = (member: Omit<TeamMember, 'id'>) => {
    const newMember: TeamMember = {
      ...member,
      id: Date.now().toString(),
    };
    setTeamMembers([newMember, ...teamMembers]);

    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'success',
      message: `Yeni ekip üyesi eklendi: ${member.name}`,
      user: 'admin@tacticiq.app',
      time: new Date().toLocaleString('tr-TR'),
    };
    setLogs([newLog, ...logs]);
  };

  const updateTeamMember = (id: string, updatedMember: Partial<TeamMember>) => {
    setTeamMembers(teamMembers.map(member => member.id === id ? { ...member, ...updatedMember } : member));
    
    const member = teamMembers.find(m => m.id === id);
    if (member) {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        type: 'info',
        message: `Ekip üyesi güncellendi: ${member.name}`,
        user: 'admin@tacticiq.app',
        time: new Date().toLocaleString('tr-TR'),
      };
      setLogs([newLog, ...logs]);
    }
  };

  const deleteTeamMember = (id: string) => {
    const member = teamMembers.find(m => m.id === id);
    setTeamMembers(teamMembers.filter(member => member.id !== id));
    
    if (member) {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        type: 'warning',
        message: `Ekip üyesi silindi: ${member.name}`,
        user: 'admin@tacticiq.app',
        time: new Date().toLocaleString('tr-TR'),
      };
      setLogs([newLog, ...logs]);
    }
  };

  // Press Release CRUD
  const addPressRelease = (release: Omit<PressRelease, 'id'>) => {
    const newRelease: PressRelease = {
      ...release,
      id: Date.now().toString(),
    };
    setPressReleases([newRelease, ...pressReleases]);

    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'success',
      message: `Yeni basın bülteni eklendi: ${release.title}`,
      user: 'admin@tacticiq.app',
      time: new Date().toLocaleString('tr-TR'),
    };
    setLogs([newLog, ...logs]);
  };

  const updatePressRelease = (id: string, updatedRelease: Partial<PressRelease>) => {
    setPressReleases(pressReleases.map(release => release.id === id ? { ...release, ...updatedRelease } : release));
    
    const release = pressReleases.find(r => r.id === id);
    if (release) {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        type: 'info',
        message: `Basın bülteni güncellendi: ${release.title}`,
        user: 'admin@tacticiq.app',
        time: new Date().toLocaleString('tr-TR'),
      };
      setLogs([newLog, ...logs]);
    }
  };

  const deletePressRelease = (id: string) => {
    const release = pressReleases.find(r => r.id === id);
    setPressReleases(pressReleases.filter(release => release.id !== id));
    
    if (release) {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        type: 'warning',
        message: `Basın bülteni silindi: ${release.title}`,
        user: 'admin@tacticiq.app',
        time: new Date().toLocaleString('tr-TR'),
      };
      setLogs([newLog, ...logs]);
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

    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'success',
      message: `Yeni oyun eklendi: ${game.name}`,
      user: 'admin@tacticiq.app',
      time: new Date().toLocaleString('tr-TR'),
    };
    setLogs([newLog, ...logs]);
  };

  const updateGame = (id: string, updatedGame: Partial<Game>) => {
    setGames(games.map(game => 
      game.id === id 
        ? { ...game, ...updatedGame, updatedAt: new Date().toISOString() }
        : game
    ));
    
    const game = games.find(g => g.id === id);
    if (game) {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        type: 'info',
        message: `Oyun güncellendi: ${game.name}`,
        user: 'admin@tacticiq.app',
        time: new Date().toLocaleString('tr-TR'),
      };
      setLogs([newLog, ...logs]);
    }
  };

  const deleteGame = (id: string) => {
    const game = games.find(g => g.id === id);
    setGames(games.filter(game => game.id !== id));
    
    if (game) {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        type: 'warning',
        message: `Oyun silindi: ${game.name}`,
        user: 'admin@tacticiq.app',
        time: new Date().toLocaleString('tr-TR'),
      };
      setLogs([newLog, ...logs]);
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

    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'success',
      message: `Yeni partner eklendi: ${partner.name}`,
      user: 'admin@tacticiq.app',
      time: new Date().toLocaleString('tr-TR'),
    };
    setLogs([newLog, ...logs]);
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
      const newLog: LogEntry = {
        id: Date.now().toString(),
        type: 'info',
        message: `Partner güncellendi: ${partner.name}`,
        user: 'admin@tacticiq.app',
        time: new Date().toLocaleString('tr-TR'),
      };
      setLogs([newLog, ...logs]);
    }
  };

  const deletePartner = (id: string) => {
    const partner = partners.find(p => p.id === id);
    const updated = partners.filter(p => p.id !== id);
    setPartners(updated);
    localStorage.setItem('admin_partners', JSON.stringify(updated));
    
    if (partner) {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        type: 'warning',
        message: `Partner silindi: ${partner.name}`,
        user: 'admin@tacticiq.app',
        time: new Date().toLocaleString('tr-TR'),
      };
      setLogs([newLog, ...logs]);
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
    
    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'success',
      message: `Medya eklendi: ${media.title} (${media.sectionId})`,
      user: 'admin@tacticiq.app',
      time: new Date().toLocaleString('tr-TR'),
    };
    setLogs([newLog, ...logs]);
  };

  const updateSectionMedia = (id: string, media: Partial<SectionMediaItem>) => {
    const updated = sectionMedia.map(m => 
      m.id === id ? { ...m, ...media, updatedAt: new Date().toISOString() } : m
    );
    setSectionMedia(updated);
    localStorage.setItem('admin_section_media', JSON.stringify(updated));
    
    const updatedMedia = updated.find(m => m.id === id);
    if (updatedMedia) {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        type: 'info',
        message: `Medya güncellendi: ${updatedMedia.title}`,
        user: 'admin@tacticiq.app',
        time: new Date().toLocaleString('tr-TR'),
      };
      setLogs([newLog, ...logs]);
    }
  };

  const deleteSectionMedia = (id: string) => {
    const media = sectionMedia.find(m => m.id === id);
    const updated = sectionMedia.filter(m => m.id !== id);
    setSectionMedia(updated);
    localStorage.setItem('admin_section_media', JSON.stringify(updated));
    
    if (media) {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        type: 'warning',
        message: `Medya silindi: ${media.title}`,
        user: 'admin@tacticiq.app',
        time: new Date().toLocaleString('tr-TR'),
      };
      setLogs([newLog, ...logs]);
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
    
    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'success',
      message: `Kategori eklendi: ${category.title}`,
      user: 'admin@tacticiq.app',
      time: new Date().toLocaleString('tr-TR'),
    };
    setLogs([newLog, ...logs]);
  };

  const updateFeatureCategory = (id: string, category: Partial<FeatureCategory>) => {
    const updated = featureCategories.map(c => 
      c.id === id ? { ...c, ...category, updatedAt: new Date().toISOString() } : c
    ).sort((a, b) => a.order - b.order);
    setFeatureCategories(updated);
    localStorage.setItem('admin_feature_categories', JSON.stringify(updated));
    
    const updatedCategory = updated.find(c => c.id === id);
    if (updatedCategory) {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        type: 'info',
        message: `Kategori güncellendi: ${updatedCategory.title}`,
        user: 'admin@tacticiq.app',
        time: new Date().toLocaleString('tr-TR'),
      };
      setLogs([newLog, ...logs]);
    }
  };

  const deleteFeatureCategory = (id: string) => {
    const category = featureCategories.find(c => c.id === id);
    const updated = featureCategories.filter(c => c.id !== id);
    setFeatureCategories(updated);
    localStorage.setItem('admin_feature_categories', JSON.stringify(updated));
    
    if (category) {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        type: 'warning',
        message: `Kategori silindi: ${category.title}`,
        user: 'admin@tacticiq.app',
        time: new Date().toLocaleString('tr-TR'),
      };
      setLogs([newLog, ...logs]);
    }
  };

  const reorderFeatureCategories = (categories: FeatureCategory[]) => {
    const updated = categories.map((c, index) => ({ ...c, order: index + 1, updatedAt: new Date().toISOString() }));
    setFeatureCategories(updated);
    localStorage.setItem('admin_feature_categories', JSON.stringify(updated));
    
    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'info',
      message: 'Kategori sıralaması güncellendi',
      user: 'admin@tacticiq.app',
      time: new Date().toLocaleString('tr-TR'),
    };
    setLogs([newLog, ...logs]);
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
    
    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'success',
      message: 'Reklam ayarları güncellendi',
      user: 'admin@tacticiq.app',
      time: new Date().toLocaleString('tr-TR'),
    };
    setLogs([newLog, ...logs]);

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
      const newSettings = { ...prevSettings, ...updatedSettings };
      console.log('Price Settings Updated:', newSettings);
      // localStorage'a kaydet
      localStorage.setItem('admin_price_settings', JSON.stringify(newSettings));
      // Supabase'e kaydet (async)
      configService.set('price_settings', newSettings).catch(err => 
        console.error('Failed to save price_settings to Supabase:', err)
      );
      return newSettings;
    });
    
    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'success',
      message: 'Fiyat ayarları güncellendi',
      user: 'admin@tacticiq.app',
      time: new Date().toLocaleString('tr-TR'),
    };
    setLogs([newLog, ...logs]);

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
    
    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'success',
      message: 'İndirim ayarları güncellendi',
      user: 'admin@tacticiq.app',
      time: new Date().toLocaleString('tr-TR'),
    };
    setLogs(prevLogs => [newLog, ...prevLogs]);

    // Session change tracking
    addSessionChange({
      category: 'İndirim Ayarları',
      action: 'update',
      description: 'İndirim ayarları güncellendi',
      details: updatedSettings.discountPercent ? `İndirim: %${updatedSettings.discountPercent}` : undefined,
    });
  };

  const updateEmailAutoReply = (updatedSettings: Partial<EmailAutoReplySettings>) => {
    setEmailAutoReply({ ...emailAutoReply, ...updatedSettings });
    
    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'success',
      message: 'Otomatik email cevap ayarları güncellendi',
      user: 'admin@tacticiq.app',
      time: new Date().toLocaleString('tr-TR'),
    };
    setLogs([newLog, ...logs]);
  };

  const updateSettings = (updatedSettings: Partial<SiteSettings>) => {
    setSettings({ ...settings, ...updatedSettings });
    
    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'success',
      message: 'Site ayarları güncellendi',
      user: 'admin@tacticiq.app',
      time: new Date().toLocaleString('tr-TR'),
    };
    setLogs([newLog, ...logs]);

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
    
    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'success',
      message: 'Section ayarları güncellendi',
      user: 'admin@tacticiq.app',
      time: new Date().toLocaleString('tr-TR'),
    };
    setLogs([newLog, ...logs]);

    // Session change tracking
    const changedSections = Object.keys(updatedSettings).join(', ');
    addSessionChange({
      category: 'Bölüm Ayarları',
      action: 'update',
      description: 'Bölüm görünürlük ayarları güncellendi',
      details: `Değiştirilen: ${changedSections}`,
    });
  };

  const updateWebsiteContent = (section: keyof WebsiteContent, content: any) => {
    setWebsiteContent({ ...websiteContent, [section]: content });
    
    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'success',
      message: 'Web sitesi içeriği güncellendi',
      user: 'admin@tacticiq.app',
      time: new Date().toLocaleString('tr-TR'),
    };
    setLogs([newLog, ...logs]);
  };

  // Filter logs
  const filterLogs = (type: 'all' | 'info' | 'success' | 'warning' | 'error') => {
    if (type === 'all') return logs;
    return logs.filter(log => log.type === type);
  };

  // Update stats (manual update for About section)
  const updateStats = (newStats: Partial<AdminStats>) => {
    setStats({ ...stats, ...newStats });

    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'success',
      message: 'İstatistikler güncellendi',
      user: 'admin@tacticiq.app',
      time: new Date().toLocaleString('tr-TR'),
    };
    setLogs([newLog, ...logs]);
  };

  // Refresh stats (simulate real-time update)
  const refreshStats = () => {
    setStats({
      ...stats,
      totalVisitors: stats.totalVisitors + Math.floor(Math.random() * 100),
      activeUsers: stats.activeUsers + Math.floor(Math.random() * 10),
    });

    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: 'info',
      message: 'İstatistikler güncellendi',
      user: 'system',
      time: new Date().toLocaleString('tr-TR'),
    };
    setLogs([newLog, ...logs]);
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
          const mappedPartners = partnersData.map((p: any) => ({
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
          console.log('✅ Partners loaded:', mappedPartners.length);
        }

        // 3. Team Members'ı Supabase'den yükle
        const teamData = await teamMembersService.getAll();
        if (teamData.length > 0) {
          const mappedTeam = teamData.map((m: any) => ({
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
          console.log('✅ Team members loaded:', mappedTeam.length);
        }

        // 4. Advertisements'ı Supabase'den yükle
        const adsData = await advertisementsService.getAll();
        if (adsData.length > 0) {
          const mappedAds = adsData.map((a: any) => ({
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
          console.log('✅ Advertisements loaded:', mappedAds.length);
        }

        // 5. Feature Categories'ı Supabase'den yükle
        const categoriesData = await featureCategoriesService.getAll();
        if (categoriesData.length > 0) {
          const mappedCategories = categoriesData.map((c: any) => ({
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
          console.log('✅ Feature categories loaded:', mappedCategories.length);
        }

        // 6. Section Media'yı Supabase'den yükle
        const mediaData = await sectionMediaService.getAll();
        if (mediaData.length > 0) {
          const mappedMedia = mediaData.map((m: any) => ({
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
          console.log('✅ Section media loaded:', mappedMedia.length);
        }

        // 7. Games'i Supabase'den yükle
        const gamesData = await gamesService.getAll();
        if (gamesData.length > 0) {
          const mappedGames = gamesData.map((g: any) => ({
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
          console.log('✅ Games loaded:', mappedGames.length);
        }

        // 8. Press Releases'ı Supabase'den yükle
        const pressData = await pressReleasesService.getAll();
        if (pressData.length > 0) {
          const mappedPress = pressData.map((p: any) => ({
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
          console.log('✅ Press releases loaded:', mappedPress.length);
        }

        // 9. Press Kit Files'ı Supabase'den yükle
        const pressKitData = await pressKitFilesService.getAll();
        if (pressKitData.length > 0) {
          const mappedPressKit = pressKitData.map((f: any) => ({
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
          console.log('✅ Press kit files loaded:', mappedPressKit.length);
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

        if (savedLogs) {
          try {
            setLogs(JSON.parse(savedLogs));
          } catch (e) {
            console.error('Error loading logs:', e);
          }
        }

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

  // Save users to localStorage
  useEffect(() => {
    localStorage.setItem('admin_users', JSON.stringify(users));
  }, [users]);

  // Save contents to localStorage
  useEffect(() => {
    localStorage.setItem('admin_contents', JSON.stringify(contents));
  }, [contents]);

  // Save activities to localStorage
  useEffect(() => {
    localStorage.setItem('admin_activities', JSON.stringify(activities));
  }, [activities]);

  // Save logs to localStorage
  useEffect(() => {
    localStorage.setItem('admin_logs', JSON.stringify(logs));
  }, [logs]);

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
    updateAdSettings,
    updateDiscountSettings,
    updatePriceSettings,
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
    websiteContent, advertisements, adSettings, discountSettings, priceSettings,
    pressKitFiles, emailAutoReply, teamMembers, pressReleases, games, partners, sectionMedia, featureCategories,
    sessionChanges, notificationSettings
  ]);

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
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