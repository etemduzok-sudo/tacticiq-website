import { useState, useEffect } from 'react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useUserAuth, UserProfile } from '@/contexts/UserAuthContext';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/app/components/ui/sheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Switch } from '@/app/components/ui/switch';
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
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { LegalDocumentsModal } from '@/app/components/legal/LegalDocumentsModal';
import { ChangePasswordModal } from '@/app/components/auth/ChangePasswordModal';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Alert, AlertDescription } from '@/app/components/ui/alert';

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
  const { t, language, setLanguage } = useLanguage();
  const { user, profile, signOut, updateProfile, deleteAccount, isLoading } = useUserAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'badges'>('profile');
  
  // Profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  
  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [campaignNotifications, setCampaignNotifications] = useState(true);
  
  // Language & Timezone state
  const [selectedTimezone, setSelectedTimezone] = useState('Europe/Istanbul');

  // Initialize form data from profile
  useEffect(() => {
    if (profile && user && open) {
      const nameParts = (profile.name || user.user_metadata?.name || user.email?.split('@')[0] || '').split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setNickname(profile.nickname || profile.name || user.email?.split('@')[0] || '');
      setSelectedTeam(profile.favoriteTeams?.[0] || '');
      
      // Google/Apple kayıt olanlar için otomatik doldur
      if (user.app_metadata?.provider === 'google' || user.app_metadata?.provider === 'apple') {
        const fullName = user.user_metadata?.name || user.user_metadata?.full_name || '';
        if (fullName) {
          const parts = fullName.split(' ');
          setFirstName(parts[0] || '');
          setLastName(parts.slice(1).join(' ') || '');
        }
        setNickname(user.user_metadata?.name || user.email?.split('@')[0] || '');
      }

      // Eğer nickname veya takım eksikse otomatik düzenleme moduna geç
      const isEmailUser = user.app_metadata?.provider === 'email' || !user.app_metadata?.provider;
      const hasNickname = profile.nickname || profile.name;
      const hasTeam = profile.favoriteTeams && profile.favoriteTeams.length > 0;
      
      if ((isEmailUser && !hasNickname) || !hasTeam) {
        setIsEditing(true);
      }
    }
  }, [profile, user, open]);

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

  // Badges (mobile app ile tutarlı - 25 rozet)
  const allBadges = [
    // Bronz Tier
    { id: 'first_prediction', name: 'İlk Tahmin', icon: '🎯', tier: 'bronze', earned: false, howToEarn: 'İlk tahmininizi yapın' },
    { id: 'rookie', name: 'Çaylak', icon: '🌱', tier: 'bronze', earned: false, howToEarn: '5 tahmin yapın' },
    { id: 'streak_3', name: '3\'lü Seri', icon: '🔥', tier: 'bronze', earned: false, howToEarn: '3 ardışık doğru tahmin' },
    { id: 'early_bird', name: 'Erken Kuş', icon: '🐦', tier: 'bronze', earned: false, howToEarn: 'Maçtan 24 saat önce tahmin yapın' },
    { id: 'daily_player', name: 'Günlük Oyuncu', icon: '📅', tier: 'bronze', earned: false, howToEarn: '7 gün üst üste aktif olun' },
    
    // Gümüş Tier
    { id: 'streak_5', name: '5\'li Seri', icon: '🔥', tier: 'silver', earned: false, howToEarn: '5 ardışık doğru tahmin' },
    { id: 'league_expert', name: 'Lig Uzmanı', icon: '🏟️', tier: 'silver', earned: false, howToEarn: 'Tek bir ligde 20 doğru tahmin' },
    { id: 'team_supporter', name: 'Takım Destekçisi', icon: '🎽', tier: 'silver', earned: false, howToEarn: 'Favori takımınızın 10 maçını tahmin edin' },
    { id: 'quick_learner', name: 'Hızlı Öğrenen', icon: '📚', tier: 'silver', earned: false, howToEarn: 'İlk haftada 50 puan kazanın' },
    { id: 'night_owl', name: 'Gece Kuşu', icon: '🦉', tier: 'silver', earned: false, howToEarn: 'Gece 00:00 sonrası 10 tahmin yapın' },
    
    // Altın Tier
    { id: 'streak_10', name: '10\'lu Seri', icon: '🔥', tier: 'gold', earned: false, howToEarn: '10 ardışık doğru tahmin' },
    { id: 'perfect_week', name: 'Mükemmel Hafta', icon: '⭐', tier: 'gold', earned: false, howToEarn: 'Bir haftada %100 başarı' },
    { id: 'multi_league', name: 'Çoklu Lig Ustası', icon: '🌍', tier: 'gold', earned: false, howToEarn: '5 farklı ligde tahmin yapın' },
    { id: 'prediction_wizard', name: 'Tahmin Büyücüsü', icon: '🧙', tier: 'gold', earned: false, howToEarn: '%75+ başarı oranı (min 50 tahmin)' },
    { id: 'consistency_champ', name: 'Tutarlılık Şampiyonu', icon: '📊', tier: 'gold', earned: false, howToEarn: '30 gün üst üste aktif olun' },
    
    // Platin Tier
    { id: 'streak_20', name: '20\'li Seri', icon: '🔥', tier: 'platinum', earned: false, howToEarn: '20 ardışık doğru tahmin' },
    { id: 'champion', name: 'Şampiyon', icon: '🏆', tier: 'platinum', earned: false, howToEarn: 'Haftalık liderlik tablosunda 1. olun' },
    { id: 'legend', name: 'Efsane', icon: '👑', tier: 'platinum', earned: false, howToEarn: '1000 doğru tahmin yapın' },
    { id: 'legendary_analyst', name: 'Efsanevi Analist', icon: '🔮', tier: 'platinum', earned: false, howToEarn: '%85+ başarı oranı (min 100 tahmin)' },
    { id: 'pro_predictor', name: 'Pro Tahmincu', icon: '💎', tier: 'platinum', earned: false, howToEarn: 'Pro üye olun ve 100 tahmin yapın' },
    
    // Elmas Tier
    { id: 'streak_50', name: '50\'li Seri', icon: '🔥', tier: 'diamond', earned: false, howToEarn: '50 ardışık doğru tahmin' },
    { id: 'tacticiq_master', name: 'TacticIQ Master', icon: '🎓', tier: 'diamond', earned: false, howToEarn: 'Diğer 24 rozeti kazanın' },
    { id: 'world_champion', name: 'Dünya Şampiyonu', icon: '🌟', tier: 'diamond', earned: false, howToEarn: 'Global liderlik tablosunda 1. olun' },
    { id: 'perfect_month', name: 'Mükemmel Ay', icon: '🌙', tier: 'diamond', earned: false, howToEarn: 'Bir ayda %90+ başarı oranı' },
    { id: 'ultimate_fan', name: 'Ultimate Fan', icon: '⚽', tier: 'diamond', earned: false, howToEarn: '5000 puan kazanın' },
  ];

  // Show loading state while auth is initializing
  if (isLoading || !user || !profile) {
    return null;
  }

  const handleSaveProfile = async () => {
    // Email ile kayıt olanlar için nickname zorunlu
    const isEmailUser = user.app_metadata?.provider === 'email' || !user.app_metadata?.provider;
    if (isEmailUser && !nickname.trim()) {
      toast.error('Nickname zorunludur');
      return;
    }

    // Takım seçimi zorunlu
    if (!selectedTeam) {
      toast.error('Lütfen bir takım seçin');
      return;
    }

    setSaving(true);
    try {
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || nickname;
      const result = await updateProfile({ 
        name: fullName || nickname,
        nickname: nickname,
        favoriteTeams: selectedTeam ? [selectedTeam] : [],
      });
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
    onOpenChange(false);
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
        onOpenChange(false);
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
  const isEmailUser = user.app_metadata?.provider === 'email' || !user.app_metadata?.provider;
  const isGoogleUser = user.app_metadata?.provider === 'google';
  const isAppleUser = user.app_metadata?.provider === 'apple';

  // Sample teams for selection (can be replaced with API call)
  const availableTeams = [
    'Fenerbahçe', 'Galatasaray', 'Beşiktaş', 'Trabzonspor', 'Başakşehir',
    'Arsenal', 'Manchester City', 'Liverpool', 'Real Madrid', 'Barcelona',
    'Bayern Munich', 'PSG', 'Juventus', 'AC Milan', 'Inter Milan',
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('profile.title') || 'Profil'}</SheetTitle>
            <SheetDescription>
              {t('profile.description') || 'Profil bilgilerinizi yönetin'}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 pr-4" style={{ height: 'calc(100vh - 100px)' }}>
            <div className="space-y-6 mt-6">
              {/* Tab Navigation */}
              <div className="flex bg-muted rounded-lg p-1 gap-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'profile' 
                      ? 'bg-background shadow-sm text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <User className="size-4" />
                  Profil
                </button>
                <button
                  onClick={() => setActiveTab('badges')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'badges' 
                      ? 'bg-background shadow-sm text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Trophy className="size-4" />
                  Rozetler
                  {userStats.badgeCount > 0 && (
                    <span className="bg-amber-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {userStats.badgeCount}
                    </span>
                  )}
                </button>
              </div>

              {activeTab === 'profile' ? (
                <>
                  {/* Profile Header */}
                  <Card>
                    <div className="h-16 bg-gradient-to-r from-secondary/20 via-accent/10 to-secondary/20" />
                    <CardContent className="relative pt-0 pb-4">
                      <div className="flex flex-col items-center -mt-10">
                        <Avatar className="size-16 border-4 border-background shadow-lg mb-3">
                          <AvatarImage src={profile.avatar} />
                          <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-secondary to-accent text-white">
                            {getInitials(profile.name || profile.email)}
                          </AvatarFallback>
                        </Avatar>
                        <h2 className="text-lg font-bold mb-1">{profile.name || nickname || profile.email}</h2>
                        <p className="text-xs text-muted-foreground mb-2">{profile.email}</p>
                        {isPro ? (
                          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black">
                            <Crown className="size-3 mr-1" />
                            PRO
                          </Badge>
                        ) : (
                          <Badge variant="outline">Free</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Profile Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Kişisel Bilgiler</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* First Name */}
                      <div className="space-y-2">
                        <Label>İsim</Label>
                        <Input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="İsim"
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-muted cursor-not-allowed' : ''}
                        />
                      </div>

                      {/* Last Name */}
                      <div className="space-y-2">
                        <Label>Soyisim</Label>
                        <Input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Soyisim"
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-muted cursor-not-allowed' : ''}
                        />
                      </div>

                      {/* Nickname - Zorunlu (email kullanıcılar için) */}
                      <div className="space-y-2">
                        <Label>
                          Nickname {isEmailUser && <span className="text-destructive">*</span>}
                        </Label>
                        <Input
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          placeholder="Kullanıcı adı"
                          required={isEmailUser}
                          disabled={!isEditing}
                          className={`${!isEditing ? 'bg-muted cursor-not-allowed' : ''} ${!nickname && isEmailUser && isEditing ? 'border-destructive' : ''}`}
                        />
                        {isEmailUser && (
                          <p className="text-xs text-muted-foreground">Email ile kayıt olanlar için zorunludur</p>
                        )}
                      </div>

                      {/* Team Selection - Zorunlu */}
                      <div className="space-y-2">
                        <Label>
                          Favori Takım <span className="text-destructive">*</span>
                        </Label>
                        <Select value={selectedTeam} onValueChange={setSelectedTeam} disabled={!isEditing}>
                          <SelectTrigger className={`${!isEditing ? 'bg-muted cursor-not-allowed' : ''} ${!selectedTeam && isEditing ? 'border-destructive' : ''}`}>
                            <SelectValue placeholder="Takım seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTeams.map(team => (
                              <SelectItem key={team} value={team}>
                                {team}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Bir takım seçmeniz zorunludur</p>
                      </div>

                      {/* Save Button */}
                      {isEditing && (
                        <div className="flex gap-2 pt-2">
                          <Button onClick={handleSaveProfile} disabled={saving} className="flex-1">
                            {saving ? (
                              <>
                                <Loader2 className="size-4 mr-2 animate-spin" />
                                Kaydediliyor...
                              </>
                            ) : (
                              <>
                                <Save className="size-4 mr-2" />
                                Kaydet
                              </>
                            )}
                          </Button>
                          <Button variant="outline" onClick={() => setIsEditing(false)}>
                            İptal
                          </Button>
                        </div>
                      )}
                      
                      {!isEditing && (
                        <div className="pt-2">
                          <Button onClick={() => setIsEditing(true)} className="w-full" variant="outline">
                            <Edit2 className="size-4 mr-2" />
                            Düzenle
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Ayarlar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Language & Timezone */}
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
                              <SelectValue />
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
                              toast.success(`Saat dilimi değiştirildi`);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
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

                      <Separator />

                      {/* Password Change */}
                      {isEmailUser && (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setShowChangePasswordModal(true)}
                        >
                          <Lock className="size-4 mr-2" />
                          Şifre Değiştir
                        </Button>
                      )}

                      {/* Sign Out */}
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={handleSignOut}
                      >
                        <LogOut className="size-4 mr-2" />
                        Çıkış Yap
                      </Button>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  {/* Badges Tab */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t('badges.title') || 'Rozetlerim'}</CardTitle>
                      <CardDescription>
                        {allBadges.filter(b => b.earned).length} / {allBadges.length} rozet kazanıldı
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Badge Progress */}
                      <Card className="mb-4 bg-muted/50">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              {allBadges.filter(b => b.earned).length} / {allBadges.length}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round((allBadges.filter(b => b.earned).length / allBadges.length) * 100)}%
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all"
                              style={{ width: `${(allBadges.filter(b => b.earned).length / allBadges.length) * 100}%` }}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Badges Grid */}
                      <div className="grid grid-cols-4 gap-3">
                        {allBadges.map((badge) => (
                          <Card 
                            key={badge.id} 
                            className={`text-center p-3 cursor-pointer transition-all hover:scale-105 group relative ${
                              badge.earned 
                                ? 'border-amber-500/50 bg-amber-500/5' 
                                : 'border-border/50 bg-card'
                            }`}
                            title={badge.earned 
                              ? `${badge.name} - Kazanıldı!` 
                              : `${badge.name} - Nasıl Kazanılır: ${badge.howToEarn}`
                            }
                          >
                            <div className="relative flex items-center justify-center">
                              {!badge.earned && (
                                <div className="absolute -top-2 -right-2 size-5 rounded-full bg-muted border-2 border-background flex items-center justify-center z-10 shadow-md">
                                  <Lock className="size-3 text-muted-foreground" />
                                </div>
                              )}
                              {badge.earned && (
                                <div className="absolute -top-2 -right-2 size-5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center z-10 shadow-md">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              )}
                              <span className="text-4xl block">{badge.icon}</span>
                            </div>
                            <p className="text-[10px] font-medium mt-2 line-clamp-2">{badge.name}</p>
                            <Badge 
                              variant="outline" 
                              className={`text-[8px] mt-2 px-1 py-0.5 ${
                                badge.tier === 'bronze' ? 'text-orange-600 border-orange-600/30' :
                                badge.tier === 'silver' ? 'text-slate-400 border-slate-400/30' :
                                badge.tier === 'gold' ? 'text-amber-500 border-amber-500/30' :
                                badge.tier === 'platinum' ? 'text-purple-500 border-purple-500/30' :
                                'text-cyan-400 border-cyan-400/30'
                              }`}
                            >
                              {badge.tier === 'bronze' ? 'Bronz' :
                               badge.tier === 'silver' ? 'Gümüş' :
                               badge.tier === 'gold' ? 'Altın' :
                               badge.tier === 'platinum' ? 'Platin' : 'Elmas'}
                            </Badge>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Legal Documents Modal */}
      <LegalDocumentsModal 
        open={showLegalModal} 
        onOpenChange={setShowLegalModal} 
      />

      {/* Change Password Modal */}
      <ChangePasswordModal 
        open={showChangePasswordModal} 
        onOpenChange={setShowChangePasswordModal} 
      />

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Hesabı Sil
            </DialogTitle>
            <DialogDescription>
              Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz kalıcı olarak silinecektir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertDescription>
                Hesabınızı silmek için aşağıya "sil" veya "delete" yazın.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label>Onay Metni</Label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="sil veya delete yazın"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              İptal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                <>
                  <Trash2 className="size-4 mr-2" />
                  Hesabı Sil
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}