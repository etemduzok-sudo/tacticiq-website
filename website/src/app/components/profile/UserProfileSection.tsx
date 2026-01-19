import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserAuth, UserProfile } from '@/contexts/UserAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { LegalDocumentsModal } from '@/app/components/legal/LegalDocumentsModal';
import { ChangePasswordModal } from '@/app/components/auth/ChangePasswordModal';

export function UserProfileSection() {
  const { t } = useLanguage();
  const { user, profile, signOut, updateProfile, deleteAccount, isLoading } = useUserAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile?.name || '');
  const [saving, setSaving] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'badges'>('profile');
  
  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [campaignNotifications, setCampaignNotifications] = useState(true);

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

  // Badges (mobile app ile tutarlı)
  const allBadges = [
    { id: 'first_prediction', name: 'İlk Tahmin', icon: '🎯', tier: 'bronze', earned: false },
    { id: 'win_streak_3', name: '3\'lü Seri', icon: '🔥', tier: 'silver', earned: false },
    { id: 'perfect_week', name: 'Mükemmel Hafta', icon: '⭐', tier: 'gold', earned: false },
    { id: 'champion', name: 'Şampiyon', icon: '🏆', tier: 'platinum', earned: false },
  ];

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <section id="profile" className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/20">
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
    <section id="profile" className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Tab Navigation - Mobile App ile tutarlı */}
        <div className="flex bg-card/50 backdrop-blur rounded-xl p-1 mb-8 border">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'profile' 
                ? 'bg-background shadow-sm text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="size-5" />
            Profil
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'badges' 
                ? 'bg-background shadow-sm text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Trophy className="size-5" />
            Rozetlerim
            {userStats.badgeCount > 0 && (
              <span className="bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                {userStats.badgeCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'profile' ? (
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
                      <Input value={profile.preferredLanguage || 'Türkçe'} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Saat Dilimi</Label>
                      <Input value="Europe/Istanbul (UTC+3)" disabled />
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
              </CardContent>
            </Card>

            {/* Legal Documents */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="size-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Yasal Belgeler</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => setShowLegalModal(true)} className="w-full">
                  <FileText className="size-4 mr-2" />
                  Yasal Belgeleri Görüntüle
                </Button>
              </CardContent>
            </Card>

            {/* Actions - Sign Out & Pro Upgrade */}
            <div className="space-y-3 mb-6">
              {!isPro && (
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
        ) : (
          /* Badges Tab - Mobile App ile tutarlı */
          <div className="grid grid-cols-4 gap-3">
            {allBadges.map((badge) => (
              <Card 
                key={badge.id} 
                className={`text-center p-4 cursor-pointer transition-all hover:scale-105 ${
                  badge.earned 
                    ? 'border-amber-500/50 bg-amber-500/5' 
                    : 'opacity-50 grayscale'
                }`}
              >
                <div className="relative">
                  {!badge.earned && (
                    <div className="absolute -top-1 -right-1 size-5 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs">🔒</span>
                    </div>
                  )}
                  <span className="text-3xl">{badge.icon}</span>
                </div>
                <p className="text-xs font-medium mt-2 line-clamp-2">{badge.name}</p>
                <Badge 
                  variant="outline" 
                  className={`text-[10px] mt-1 ${
                    badge.tier === 'bronze' ? 'text-orange-600 border-orange-600/30' :
                    badge.tier === 'silver' ? 'text-slate-400 border-slate-400/30' :
                    badge.tier === 'gold' ? 'text-amber-500 border-amber-500/30' :
                    'text-purple-500 border-purple-500/30'
                  }`}
                >
                  {badge.tier === 'bronze' ? 'Bronz' :
                   badge.tier === 'silver' ? 'Gümüş' :
                   badge.tier === 'gold' ? 'Altın' : 'Platin'}
                </Badge>
              </Card>
            ))}
            {allBadges.length === 0 && (
              <div className="col-span-4 text-center py-16 text-muted-foreground">
                <Trophy className="size-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Henüz rozet yok</p>
                <p className="text-sm">Maçlara tahmin yap ve rozetleri kazan!</p>
              </div>
            )}
          </div>
        )}
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
