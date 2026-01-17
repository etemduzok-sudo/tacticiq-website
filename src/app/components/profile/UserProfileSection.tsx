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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  User,
  Mail,
  Crown,
  Settings,
  Bell,
  Shield,
  LogOut,
  Edit2,
  Save,
  Trophy,
  Target,
  Star,
  Calendar,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export function UserProfileSection() {
  const { t } = useLanguage();
  const { user, profile, signOut, updateProfile, isLoading } = useUserAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile?.name || '');
  const [saving, setSaving] = useState(false);

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isPro = profile.plan === 'pro';

  return (
    <section id="profile" className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-8 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-secondary via-accent to-secondary" />
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-16">
              {/* Avatar */}
              <Avatar className="size-32 border-4 border-background shadow-xl">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-secondary to-accent text-white">
                  {getInitials(profile.name || profile.email)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 text-center md:text-left mt-4 md:mt-0">
                <div className="flex items-center justify-center md:justify-start gap-2">
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
                <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 mt-1">
                  <Mail className="size-4" />
                  {profile.email}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
                  <Badge variant={isPro ? 'default' : 'secondary'} className={isPro ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black' : ''}>
                    {isPro ? (
                      <>
                        <Crown className="size-3 mr-1" />
                        Pro Üye
                      </>
                    ) : (
                      'Ücretsiz Plan'
                    )}
                  </Badge>
                  {profile.createdAt && (
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="size-3" />
                      {new Date(profile.createdAt).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {!isPro && (
                  <Button className="gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:from-amber-600 hover:to-yellow-500">
                    <Crown className="size-4" />
                    Pro'ya Yükselt
                  </Button>
                )}
                <Button variant="outline" onClick={handleSignOut} className="gap-2">
                  <LogOut className="size-4" />
                  Çıkış
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stats" className="gap-2">
              <Trophy className="size-4" />
              İstatistikler
            </TabsTrigger>
            <TabsTrigger value="predictions" className="gap-2">
              <Target className="size-4" />
              Tahminler
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="size-4" />
              Ayarlar
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="size-4" />
              Güvenlik
            </TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Tahmin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Target className="size-8 text-secondary" />
                    <span className="text-3xl font-bold">0</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Başarı Oranı</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Star className="size-8 text-accent" />
                    <span className="text-3xl font-bold">0%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Puan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Trophy className="size-8 text-yellow-500" />
                    <span className="text-3xl font-bold">0</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Son Aktiviteler</CardTitle>
                <CardDescription>Son tahminleriniz ve aktiviteleriniz</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="size-12 mx-auto mb-4 opacity-50" />
                  <p>Henüz aktivite yok</p>
                  <p className="text-sm">Tahmin yapmaya başlayın!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions">
            <Card>
              <CardHeader>
                <CardTitle>Tahmin Geçmişi</CardTitle>
                <CardDescription>Geçmiş tahminleriniz ve sonuçları</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="size-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Henüz tahmin yapmadınız</p>
                  <p className="text-sm mb-4">Maçlara tahmin yaparak puanlar kazanın</p>
                  <Button>Tahmin Yapmaya Başla</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Bildirim Ayarları</CardTitle>
                <CardDescription>Bildirim tercihlerinizi yönetin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>E-posta Bildirimleri</Label>
                    <p className="text-sm text-muted-foreground">Maç sonuçları ve tahmin hatırlatmaları</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Haftalık Özet</Label>
                    <p className="text-sm text-muted-foreground">Haftalık performans özeti</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Kampanya Bildirimleri</Label>
                    <p className="text-sm text-muted-foreground">İndirim ve özel teklifler</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Dil ve Bölge</CardTitle>
                <CardDescription>Tercih ettiğiniz dil ve bölge ayarları</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Şifre Değiştir</CardTitle>
                <CardDescription>Hesap güvenliğiniz için şifrenizi düzenli aralıklarla değiştirin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Mevcut Şifre</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Yeni Şifre</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Yeni Şifre (Tekrar)</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <Button className="gap-2">
                  <Shield className="size-4" />
                  Şifreyi Güncelle
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Oturum Bilgileri</CardTitle>
                <CardDescription>Aktif oturumlarınız ve cihaz bilgileri</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-secondary/20 flex items-center justify-center">
                      <Shield className="size-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium">Bu Cihaz</p>
                      <p className="text-sm text-muted-foreground">Şu an aktif</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Aktif</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4 border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Tehlikeli Bölge</CardTitle>
                <CardDescription>Bu işlemler geri alınamaz</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="gap-2">
                  Hesabı Sil
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
