import { useState, useEffect } from 'react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useUserAuth, UserProfile } from '@/contexts/UserAuthContext';
import { useAdminData, CURRENCY_SYMBOLS, LANGUAGE_CURRENCY_MAP, convertCurrency } from '@/contexts/AdminDataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Switch } from '@/app/components/ui/switch';
// Tabs removed - using custom tab implementation for mobile app consistency
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import {
  User,
  Crown,
  Settings,
  Shield,
  LogOut,
  Edit2,
  Save,
  Trophy,
  Target,
  Star,
  Loader2,
  FileText,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Heart,
  Zap,
  Medal,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { LegalDocumentsModal } from '@/app/components/legal/LegalDocumentsModal';
import { ChangePasswordModal } from '@/app/components/auth/ChangePasswordModal';

// Available languages
const LANGUAGES = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];

// Available timezones
const TIMEZONES = [
  { id: 'Europe/Istanbul', name: 'İstanbul (UTC+3)', offset: '+03:00' },
  { id: 'Europe/London', name: 'Londra (UTC+0)', offset: '+00:00' },
  { id: 'Europe/Berlin', name: 'Berlin (UTC+1)', offset: '+01:00' },
  { id: 'Europe/Paris', name: 'Paris (UTC+1)', offset: '+01:00' },
  { id: 'Europe/Madrid', name: 'Madrid (UTC+1)', offset: '+01:00' },
  { id: 'America/New_York', name: 'New York (UTC-5)', offset: '-05:00' },
  { id: 'America/Los_Angeles', name: 'Los Angeles (UTC-8)', offset: '-08:00' },
  { id: 'Asia/Dubai', name: 'Dubai (UTC+4)', offset: '+04:00' },
  { id: 'Asia/Shanghai', name: 'Şangay (UTC+8)', offset: '+08:00' },
  { id: 'Asia/Tokyo', name: 'Tokyo (UTC+9)', offset: '+09:00' },
];

export function UserProfileSection() {
  const { t, language, setLanguage } = useLanguage();
  const { user, profile, signOut, updateProfile, deleteAccount, isLoading } = useUserAuth();
  const { profilePromoSettings, priceSettings, sectionSettings } = useAdminData();
  const showBadges = sectionSettings?.profile?.showBadges !== false;
  const [isEditing, setIsEditing] = useState(false);
  
  // Profil Promosyon State
  const [promoTimeLeft, setPromoTimeLeft] = useState(profilePromoSettings.timerDuration);
  const [showPromo, setShowPromo] = useState(false);
  const [dailyShows, setDailyShows] = useState(0);
  const [editedName, setEditedName] = useState(profile?.name || '');
  const [saving, setSaving] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [campaignNotifications, setCampaignNotifications] = useState(true);
  
  // Language & Timezone state
  const [selectedTimezone, setSelectedTimezone] = useState('Europe/Istanbul');

  // Profil Promosyon - Günlük gösterim kontrolü ve timer
  useEffect(() => {
    if (!profilePromoSettings.enabled) return;
    
    // Günlük gösterim kontrolü
    const today = new Date().toDateString();
    const storedData = localStorage.getItem('profile_promo_data');
    let data = storedData ? JSON.parse(storedData) : { date: today, shows: 0 };
    
    // Yeni gün ise sıfırla
    if (data.date !== today) {
      data = { date: today, shows: 0 };
    }
    
    setDailyShows(data.shows);
    
    // Gösterim limiti kontrolü
    if (profilePromoSettings.dailyShowLimit === 0 || data.shows < profilePromoSettings.dailyShowLimit) {
      setShowPromo(true);
      // Gösterim sayısını artır
      data.shows += 1;
      localStorage.setItem('profile_promo_data', JSON.stringify(data));
    }
  }, [profilePromoSettings.enabled, profilePromoSettings.dailyShowLimit]);

  // Timer countdown
  useEffect(() => {
    if (!showPromo || !profilePromoSettings.showTimer) return;
    
    const timer = setInterval(() => {
      setPromoTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [showPromo, profilePromoSettings.showTimer]);

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Fiyat hesaplama
  const targetCurrency = LANGUAGE_CURRENCY_MAP[language] || 'TRY';
  const currencySymbol = CURRENCY_SYMBOLS[targetCurrency];
  const billingPeriod = priceSettings.billingPeriod ?? 'yearly';
  const basePrice = billingPeriod === 'monthly' 
    ? (priceSettings.monthlyPrice ?? 49)
    : (priceSettings.yearlyPrice ?? 479);
  const originalPrice = convertCurrency(basePrice, priceSettings.baseCurrency as 'TRY', targetCurrency);
  const discountedPrice = originalPrice * (1 - profilePromoSettings.discountPercent / 100);

  // User stats (mobile app ile tutarlı)
  const userStats = {
    level: 1,
    points: 0,
    badgeCount: 0,
    successRate: 0,
    totalPredictions: 0,
    dayStreak: 0,
    countryRank: 0,
    totalPlayers: 1000,
    avgMatchRating: 0,
    xpGainThisWeek: 0,
  };

  // Favorite teams (mobile app ile tutarlı)
  const favoriteTeams = profile?.favoriteTeams || [];

  // Achievements (mobile app ile tutarlı)
  const achievements = [
    { id: 'winner', icon: '🏆', name: 'Winner', description: '10 doğru tahmin' },
    { id: 'streak', icon: '🔥', name: 'Streak Master', description: '5 gün üst üste' },
    { id: 'expert', icon: '⭐', name: 'Expert', description: 'Level 10\'a ulaştı' },
  ];

  // Badges - 40 rozet, 8 sütun x 5 satır
  const allBadges = [
    // Bronz Tier (8)
    { id: 'first_prediction', name: 'İlk Tahmin', icon: '🎯', tier: 'bronze', earned: false, howToEarn: 'İlk tahmininizi yapın' },
    { id: 'rookie', name: 'Çaylak', icon: '🌱', tier: 'bronze', earned: false, howToEarn: '5 tahmin yapın' },
    { id: 'streak_3', name: '3\'lü Seri', icon: '🔥', tier: 'bronze', earned: false, howToEarn: '3 ardışık doğru tahmin' },
    { id: 'early_bird', name: 'Erken Kuş', icon: '🐦', tier: 'bronze', earned: false, howToEarn: 'Maçtan 24 saat önce tahmin yapın' },
    { id: 'daily_player', name: 'Günlük Oyuncu', icon: '📅', tier: 'bronze', earned: false, howToEarn: '7 gün üst üste aktif olun' },
    { id: 'first_goal', name: 'İlk Gol', icon: '⚽', tier: 'bronze', earned: false, howToEarn: 'İlk gol tahminini doğru yapın' },
    { id: 'weekend_warrior', name: 'Hafta Sonu Savaşçısı', icon: '🗓️', tier: 'bronze', earned: false, howToEarn: 'Hafta sonu 5 maç tahmin edin' },
    { id: 'early_riser', name: 'Erken Kalkan', icon: '🌅', tier: 'bronze', earned: false, howToEarn: 'Sabah maçında tahmin yapın' },
    // Gümüş Tier (8)
    { id: 'streak_5', name: '5\'li Seri', icon: '🔥', tier: 'silver', earned: false, howToEarn: '5 ardışık doğru tahmin' },
    { id: 'league_expert', name: 'Lig Uzmanı', icon: '🏟️', tier: 'silver', earned: false, howToEarn: 'Tek bir ligde 20 doğru tahmin' },
    { id: 'team_supporter', name: 'Takım Destekçisi', icon: '🎽', tier: 'silver', earned: false, howToEarn: 'Favori takımınızın 10 maçını tahmin edin' },
    { id: 'quick_learner', name: 'Hızlı Öğrenen', icon: '📚', tier: 'silver', earned: false, howToEarn: 'İlk haftada 50 puan kazanın' },
    { id: 'night_owl', name: 'Gece Kuşu', icon: '🦉', tier: 'silver', earned: false, howToEarn: 'Gece 00:00 sonrası 10 tahmin yapın' },
    { id: 'score_hunter', name: 'Skor Avcısı', icon: '🎯', tier: 'silver', earned: false, howToEarn: '10 skor tahminini doğru yapın' },
    { id: 'derby_master', name: 'Derbi Ustası', icon: '⚔️', tier: 'silver', earned: false, howToEarn: 'Derbi maçında doğru tahmin yapın' },
    { id: 'midweek_hero', name: 'Hafta İçi Kahramanı', icon: '📆', tier: 'silver', earned: false, howToEarn: 'Hafta içi 15 maç tahmin edin' },
    // Altın Tier (8)
    { id: 'streak_10', name: '10\'lu Seri', icon: '🔥', tier: 'gold', earned: false, howToEarn: '10 ardışık doğru tahmin' },
    { id: 'perfect_week', name: 'Mükemmel Hafta', icon: '⭐', tier: 'gold', earned: false, howToEarn: 'Bir haftada %100 başarı' },
    { id: 'multi_league', name: 'Çoklu Lig Ustası', icon: '🌍', tier: 'gold', earned: false, howToEarn: '5 farklı ligde tahmin yapın' },
    { id: 'prediction_wizard', name: 'Tahmin Büyücüsü', icon: '🧙', tier: 'gold', earned: false, howToEarn: '%75+ başarı oranı (min 50 tahmin)' },
    { id: 'consistency_champ', name: 'Tutarlılık Şampiyonu', icon: '📊', tier: 'gold', earned: false, howToEarn: '30 gün üst üste aktif olun' },
    { id: 'big_match', name: 'Büyük Maç Uzmanı', icon: '🏆', tier: 'gold', earned: false, howToEarn: 'Büyük final maçında doğru tahmin' },
    { id: 'comeback_king', name: 'Geri Dönüş Kralı', icon: '👑', tier: 'gold', earned: false, howToEarn: '5 maçta geri dönüşlü skoru tahmin edin' },
    { id: 'trend_follower', name: 'Trend Takipçisi', icon: '📈', tier: 'gold', earned: false, howToEarn: '5 ardışık maçta form trendini yakalayın' },
    // Platin Tier (8)
    { id: 'streak_20', name: '20\'li Seri', icon: '🔥', tier: 'platinum', earned: false, howToEarn: '20 ardışık doğru tahmin' },
    { id: 'champion', name: 'Şampiyon', icon: '🏆', tier: 'platinum', earned: false, howToEarn: 'Haftalık liderlik tablosunda 1. olun' },
    { id: 'legend', name: 'Efsane', icon: '👑', tier: 'platinum', earned: false, howToEarn: '1000 doğru tahmin yapın' },
    { id: 'legendary_analyst', name: 'Efsanevi Analist', icon: '🔮', tier: 'platinum', earned: false, howToEarn: '%85+ başarı oranı (min 100 tahmin)' },
    { id: 'pro_predictor', name: 'Pro Tahmincu', icon: '💎', tier: 'platinum', earned: false, howToEarn: 'Pro üye olun ve 100 tahmin yapın' },
    { id: 'continental', name: 'Kıtasal Uzman', icon: '🌐', tier: 'platinum', earned: false, howToEarn: '3 farklı kıtadan ligde tahmin yapın' },
    { id: 'season_veteran', name: 'Sezon Emektarı', icon: '📋', tier: 'platinum', earned: false, howToEarn: 'Bir sezonda 200+ tahmin yapın' },
    { id: 'top_percent', name: 'Top %10', icon: '💯', tier: 'platinum', earned: false, howToEarn: 'Liderlikte top %10\'a girin' },
    // Elmas Tier (8)
    { id: 'streak_50', name: '50\'li Seri', icon: '🔥', tier: 'diamond', earned: false, howToEarn: '50 ardışık doğru tahmin' },
    { id: 'tacticiq_master', name: 'TacticIQ Master', icon: '🎓', tier: 'diamond', earned: false, howToEarn: 'Diğer 39 rozeti kazanın' },
    { id: 'world_champion', name: 'Dünya Şampiyonu', icon: '🌟', tier: 'diamond', earned: false, howToEarn: 'Global liderlik tablosunda 1. olun' },
    { id: 'perfect_month', name: 'Mükemmel Ay', icon: '🌙', tier: 'diamond', earned: false, howToEarn: 'Bir ayda %90+ başarı oranı' },
    { id: 'ultimate_fan', name: 'Ultimate Fan', icon: '⚽', tier: 'diamond', earned: false, howToEarn: '5000 puan kazanın' },
    { id: 'unstoppable', name: 'Durdurulamaz', icon: '🚀', tier: 'diamond', earned: false, howToEarn: '20 maç üst üste doğru tahmin' },
    { id: 'oracle', name: 'Kâhin', icon: '🔮', tier: 'diamond', earned: false, howToEarn: '%95+ başarı (min 20 tahmin)' },
    { id: 'immortal', name: 'Ölümsüz', icon: '🛡️', tier: 'diamond', earned: false, howToEarn: 'Tüm tier rozetlerini kazanın' },
  ];

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <section id="profile" className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/20 scroll-mt-20" style={{ animation: 'none' }}>
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="size-12 mx-auto mb-4 animate-spin text-secondary" />
              <p className="text-muted-foreground">Yükleniyor...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }
  
  // User must be authenticated
  if (!user || !profile) {
    return null;
  }

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const result = await updateProfile({ name: editedName });
      if (result.success) {
        toast.success('Profil güncellendi');
        setIsEditing(false);
      } else {
        toast.error(result.error || 'Profil güncellenemedi');
      }
    } catch (err) {
      toast.error('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Çıkış yapıldı');
  };

  const handleDeleteAccount = async () => {
    const confirmText = deleteConfirmText.toLowerCase().trim();
    if (confirmText !== 'sil' && confirmText !== 'delete') {
      toast.error('Onay için "sil" veya "delete" yazmanız gerekiyor');
      return;
    }

    setDeleting(true);
    try {
      const result = await deleteAccount();
      if (result.success) {
        toast.success('Hesabınız başarıyla silindi');
        setShowDeleteDialog(false);
        setDeleteConfirmText('');
        // Redirect will happen automatically via auth state change
      } else {
        toast.error(result.error || 'Hesap silme başarısız');
      }
    } catch (err) {
      toast.error('Bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isPro = profile.plan === 'pro';

  const rankPercentage = ((userStats.totalPlayers - userStats.countryRank) / userStats.totalPlayers) * 100;
  const topPercentage = ((userStats.countryRank / userStats.totalPlayers) * 100).toFixed(1);

  return (
    <section id="profile" className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/20 scroll-mt-20" style={{ animation: 'none' }}>
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Profil içerik - mobildeki gibi tek sayfa, rozetler inline */}
        <>
            {/* Profile Header Card - Mobile App ile tutarlı */}
            <Card className="mb-6 overflow-hidden border-secondary/20">
              <div className="h-24 bg-gradient-to-r from-secondary/20 via-accent/10 to-secondary/20" />
              <CardContent className="relative pt-0 pb-6">
                <div className="flex flex-col items-center -mt-12">
                  {/* Avatar */}
                  <Avatar className="size-24 border-4 border-secondary shadow-xl mb-4">
                    <AvatarImage src={profile.avatar} />
                    <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-secondary to-accent text-white">
                      {getInitials(profile.name || profile.email)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name & Edit */}
                  <div className="flex items-center gap-2 mb-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="max-w-xs"
                          placeholder="İsminiz"
                        />
                        <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
                          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                          İptal
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h1 className="text-2xl font-bold">{profile.name}</h1>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditedName(profile.name || '');
                          setIsEditing(true);
                        }}>
                          <Edit2 className="size-4" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Email */}
                  <p className="text-muted-foreground text-sm mb-3">{profile.email}</p>

                  {/* Plan Badge */}
                  {isPro ? (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black px-4 py-1.5 rounded-full font-semibold">
                      <span>👑</span>
                      <span>PRO</span>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Free
                    </Badge>
                  )}

                  {/* Level, Badges, Points - Mobile App ile tutarlı */}
                  <div className="flex items-center gap-8 mt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Level</p>
                      <p className="text-2xl font-bold text-secondary">{userStats.level}</p>
                    </div>
                    <div className="w-px h-10 bg-border" />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Badges</p>
                      <p className="text-2xl font-bold text-amber-500">{userStats.badgeCount}</p>
                    </div>
                    <div className="w-px h-10 bg-border" />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Points</p>
                      <p className="text-2xl font-bold">{userStats.points.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Card - Mobile App ile tutarlı */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-5 text-secondary" />
                  <CardTitle className="text-lg">Performance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-muted/30 rounded-xl">
                    <p className="text-2xl font-bold text-secondary">{userStats.successRate}%</p>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-xl">
                    <p className="text-2xl font-bold">{userStats.totalPredictions}</p>
                    <p className="text-xs text-muted-foreground">Total Predictions</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-xl">
                    <p className="text-2xl font-bold text-amber-500">{userStats.dayStreak}</p>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                  </div>
                </div>

                {/* Country Ranking */}
                <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-xl mb-4">
                  <div className="flex justify-between mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Türkiye Sıralaması</p>
                      <p className="text-xl font-bold text-secondary">#{userStats.countryRank.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Toplam Oyuncu</p>
                      <p className="text-xl font-bold">{userStats.totalPlayers.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="h-2 bg-muted/50 rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-gradient-to-r from-secondary to-accent rounded-full transition-all" 
                      style={{ width: `${rankPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">Top {topPercentage}%</p>
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                    <Medal className="size-4 text-amber-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Rating</p>
                      <p className="text-sm font-bold">{userStats.avgMatchRating}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                    <Zap className="size-4 text-secondary" />
                    <div>
                      <p className="text-xs text-muted-foreground">XP This Week</p>
                      <p className="text-sm font-bold">+{userStats.xpGainThisWeek}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Favorite Teams Card - Mobile App ile tutarlı */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Heart className="size-5 text-secondary" />
                  <CardTitle className="text-lg">Favori Takımlar</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {favoriteTeams.length > 0 ? (
                  <div className="space-y-3">
                    {favoriteTeams.map((team, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="size-3 rounded-full bg-secondary" />
                        <span className="font-medium">{team}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Heart className="size-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Henüz favori takım seçilmemiş</p>
                    <p className="text-xs">Mobil uygulamadan takımlarınızı ekleyin</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rozetlerim - mobildeki gibi inline (ayrı sekme yok) */}
            {showBadges && (
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="size-5 text-amber-500" />
                      <CardTitle className="text-lg">Rozetlerim</CardTitle>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {allBadges.filter(b => b.earned).length} / {allBadges.length}
                    </div>
                  </div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all"
                      style={{ width: `${(allBadges.filter(b => b.earned).length / allBadges.length) * 100}%` }}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {allBadges.map((badge) => (
                      <Card 
                        key={badge.id} 
                        className={`text-center p-3 cursor-pointer transition-all hover:scale-105 group relative ${
                          badge.earned 
                            ? 'border-amber-500/50 bg-amber-500/5' 
                            : 'border-border/50 bg-card'
                        }`}
                        title={badge.earned ? `${badge.name} - Kazanıldı!` : `${badge.name} - ${badge.howToEarn}`}
                      >
                        <div className="relative flex items-center justify-center">
                          {!badge.earned && (
                            <div className="absolute -top-2 -right-2 size-5 rounded-full bg-muted border-2 border-background flex items-center justify-center z-10">
                              <Lock className="size-2.5 text-muted-foreground" />
                            </div>
                          )}
                          {badge.earned && (
                            <div className="absolute -top-2 -right-2 size-5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center z-10">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                          <span className="text-3xl block">{badge.icon}</span>
                        </div>
                        <p className="text-[10px] font-medium mt-2 line-clamp-2">{badge.name}</p>
                        <Badge variant="outline" className={`text-[8px] mt-1 px-1 py-0 ${
                          badge.tier === 'bronze' ? 'text-orange-600 border-orange-600/30' :
                          badge.tier === 'silver' ? 'text-slate-400 border-slate-400/30' :
                          badge.tier === 'gold' ? 'text-amber-500 border-amber-500/30' :
                          badge.tier === 'platinum' ? 'text-purple-500 border-purple-500/30' :
                          'text-cyan-400 border-cyan-400/30'
                        }`}>
                          {badge.tier === 'bronze' ? 'Bronz' : badge.tier === 'silver' ? 'Gümüş' : badge.tier === 'gold' ? 'Altın' : badge.tier === 'platinum' ? 'Platin' : 'Elmas'}
                        </Badge>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Achievements Card - Mobile App ile tutarlı */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Star className="size-5 text-amber-500" />
                  <CardTitle className="text-lg">Achievements</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {achievements.map((achievement) => (
                    <div 
                      key={achievement.id} 
                      className="text-center p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl"
                    >
                      <span className="text-3xl">{achievement.icon}</span>
                      <p className="text-sm font-semibold mt-2">{achievement.name}</p>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Settings Section - Accordion style */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="size-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Ayarlar</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Notification Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Bildirim Ayarları</h4>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>E-posta Bildirimleri</Label>
                      <p className="text-sm text-muted-foreground">Maç sonuçları ve tahmin hatırlatmaları</p>
                    </div>
                  <Switch 
                    checked={emailNotifications}
                    onCheckedChange={(checked) => {
                      setEmailNotifications(checked);
                      // TODO: Save to backend when notification API is ready
                      toast.success(checked ? 'E-posta bildirimleri açıldı' : 'E-posta bildirimleri kapatıldı');
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Haftalık Özet</Label>
                    <p className="text-sm text-muted-foreground">Haftalık performans özeti</p>
                  </div>
                  <Switch 
                    checked={weeklySummary}
                    onCheckedChange={(checked) => {
                      setWeeklySummary(checked);
                      // TODO: Save to backend when notification API is ready
                      toast.success(checked ? 'Haftalık özet açıldı' : 'Haftalık özet kapatıldı');
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Kampanya Bildirimleri</Label>
                    <p className="text-sm text-muted-foreground">İndirim ve özel teklifler</p>
                  </div>
                  <Switch 
                    checked={campaignNotifications}
                    onCheckedChange={(checked) => {
                      setCampaignNotifications(checked);
                      toast.success(checked ? 'Kampanya bildirimleri açıldı' : 'Kampanya bildirimleri kapatıldı');
                    }}
                  />
                </div>
                </div>

                <Separator className="my-4" />

                {/* Language & Region */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Dil ve Bölge</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Dil</Label>
                      <Select 
                        value={language} 
                        onValueChange={(value: Language) => {
                          setLanguage(value);
                          toast.success(`Dil değiştirildi: ${LANGUAGES.find(l => l.code === value)?.name}`);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Dil seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map(lang => (
                            <SelectItem key={lang.code} value={lang.code}>
                              <span className="flex items-center gap-2">
                                <span>{lang.flag}</span>
                                <span>{lang.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Saat Dilimi</Label>
                      <Select 
                        value={selectedTimezone} 
                        onValueChange={(value) => {
                          setSelectedTimezone(value);
                          toast.success(`Saat dilimi değiştirildi: ${TIMEZONES.find(tz => tz.id === value)?.name}`);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Saat dilimi seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map(tz => (
                            <SelectItem key={tz.id} value={tz.id}>
                              {tz.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Security Section */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Güvenlik</h4>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Şifre Değiştir</p>
                      <p className="text-xs text-muted-foreground">Hesap güvenliğiniz için şifrenizi düzenli aralıklarla değiştirin</p>
                    </div>
                    <Button size="sm" onClick={() => setShowChangePasswordModal(true)} className="gap-2">
                      <Shield className="size-4" />
                      Değiştir
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-secondary/20 flex items-center justify-center">
                        <Shield className="size-4 text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Bu Cihaz</p>
                        <p className="text-xs text-muted-foreground">Şu an aktif</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">Aktif</Badge>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Yasal Bilgilendirmeler - mobildeki gibi ayarlar içinde */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="size-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Yasal Bilgilendirmeler</p>
                      <p className="text-xs text-muted-foreground">Platform kullanım koşulları ve yasal belgeler</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowLegalModal(true)}>
                    Görüntüle
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Profil Promosyon Banner - Admin'den kontrol edilir */}
            {!isPro && showPromo && profilePromoSettings.enabled && (
              <Card className="mb-6 overflow-hidden border-2 border-amber-400/50 shadow-lg relative">
                {/* Badge */}
                <div className="absolute -top-1 -right-1 z-10">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg shadow-md">
                    {profilePromoSettings.badgeText || `%${profilePromoSettings.discountPercent} İNDİRİM`}
                  </div>
                </div>
                
                <CardContent className="p-4" style={{ background: profilePromoSettings.backgroundColor }}>
                  <div className="text-center" style={{ color: profilePromoSettings.textColor }}>
                    {/* Timer */}
                    {profilePromoSettings.showTimer && promoTimeLeft > 0 && (
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Zap className="size-4 animate-pulse" />
                        <span className="text-sm font-semibold">
                          Bu teklif için kalan süre: {formatTime(promoTimeLeft)}
                        </span>
                      </div>
                    )}
                    
                    {/* Title */}
                    <h3 className="text-xl font-bold mb-1">
                      {profilePromoSettings.promoTitle}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-sm opacity-90 mb-3">
                      {profilePromoSettings.promoDescription}
                    </p>
                    
                    {/* Price Display */}
                    <div className="flex items-center justify-center gap-3 mb-3">
                      {profilePromoSettings.showOriginalPrice && (
                        <span className="text-lg line-through opacity-60">
                          {currencySymbol}{originalPrice.toFixed(2)}
                        </span>
                      )}
                      <span className="text-3xl font-bold">
                        {currencySymbol}{discountedPrice.toFixed(2)}
                      </span>
                      <span className="text-xs opacity-75">
                        /{billingPeriod === 'monthly' ? 'ay' : 'yıl'}
                      </span>
                    </div>
                    
                    {/* CTA Button */}
                    <Button 
                      className="w-full gap-2 bg-white text-black hover:bg-gray-100 font-bold text-lg py-6"
                      onClick={() => {
                        const pricingSection = document.getElementById('pricing');
                        if (pricingSection) {
                          pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        } else {
                          window.location.hash = '#pricing';
                        }
                      }}
                    >
                      <Crown className="size-5" />
                      {profilePromoSettings.ctaButtonText}
                    </Button>
                    
                    {/* Daily show info (debug - admin için) */}
                    {profilePromoSettings.dailyShowLimit > 0 && (
                      <p className="text-xs opacity-50 mt-2">
                        Bugün {dailyShows}/{profilePromoSettings.dailyShowLimit} gösterim
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions - Sign Out & Pro Upgrade */}
            <div className="space-y-3 mb-6">
              {!isPro && !showPromo && (
                <Button 
                  className="w-full gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:from-amber-600 hover:to-yellow-500"
                  onClick={() => {
                    const pricingSection = document.getElementById('pricing');
                    if (pricingSection) {
                      pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                      window.location.hash = '#pricing';
                    }
                  }}
                >
                  <Crown className="size-4" />
                  Pro'ya Yükselt
                </Button>
              )}
              <Button variant="outline" onClick={handleSignOut} className="w-full gap-2">
                <LogOut className="size-4" />
                Çıkış Yap
              </Button>
            </div>

            {/* Account Management - Very Hidden Delete Option */}
            <Card className="border-muted/30 opacity-50 hover:opacity-100 transition-opacity">
              <CardContent className="py-3">
                <details className="group">
                  <summary className="text-xs text-muted-foreground/60 cursor-pointer hover:text-muted-foreground list-none">
                    <span className="flex items-center gap-1">
                      <span>Gelişmiş Ayarlar</span>
                      <span className="group-open:rotate-180 transition-transform text-[10px]">▼</span>
                    </span>
                  </summary>
                  <div className="mt-3 pt-3 border-t border-muted/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 w-full justify-start text-xs"
                    >
                      <Trash2 className="size-3 mr-2" />
                      Hesabı Sil
                    </Button>
                  </div>
                </details>
              </CardContent>
            </Card>
          </>
      </div>

      {/* Legal Documents Modal */}
      <LegalDocumentsModal open={showLegalModal} onOpenChange={setShowLegalModal} />

      {/* Change Password Modal */}
      <ChangePasswordModal open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal} />

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Hesabı Sil
            </DialogTitle>
            <DialogDescription>
              Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz kalıcı olarak silinecektir.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              <strong>Dikkat:</strong> Bu işlem sonrasında:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Tüm tahminleriniz silinecek</li>
                <li>Puanlarınız ve istatistikleriniz kaybolacak</li>
                <li>Profil bilgileriniz kalıcı olarak silinecek</li>
                <li>Bu işlem geri alınamaz</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Onaylamak için <strong>&quot;sil&quot;</strong> veya <strong>&quot;delete&quot;</strong> yazın:
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="sil veya delete"
                className="font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteDialog(false);
              setDeleteConfirmText('');
            }}>
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleting || (deleteConfirmText.toLowerCase().trim() !== 'sil' && deleteConfirmText.toLowerCase().trim() !== 'delete')}
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                <>
                  <Trash2 className="size-4 mr-2" />
                  Hesabı Kalıcı Olarak Sil
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
