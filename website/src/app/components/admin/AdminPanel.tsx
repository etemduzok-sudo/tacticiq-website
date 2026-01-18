import { useState, useEffect, useContext } from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  Activity, 
  Layout,
  Eye,
  DollarSign,
  UserCheck,
  RefreshCw,
  X,
  ChevronRight,
  Globe,
  Handshake,
  Clock,
  TrendingUp,
  Plus,
  Image,
  Tag,
  Calendar,
  Mail,
  Bell,
  Database,
  Download,
  Trash2,
  Save,
  FileBarChart,
  Monitor,
  Lock,
  Smartphone,
  Info,
  Gamepad2,
  Edit2,
  Type,
  Megaphone
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Separator } from '@/app/components/ui/separator';
import { Textarea } from '@/app/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { useAdmin } from '@/contexts/AdminContext';
import { AdminDataContext, CURRENCY_SYMBOLS, LANGUAGE_CURRENCY_MAP, AdSettings, SectionSettings, SectionMediaItem } from '@/contexts/AdminDataContext';
import { ChangePasswordModal } from '@/app/components/auth/ChangePasswordModal';
import { AdManagement } from '@/app/components/admin/AdManagement';
import { TeamManagement } from '@/app/components/admin/TeamManagement';
import { PressReleaseManagement } from '@/app/components/admin/PressReleaseManagement';
import { PartnerManagement } from '@/app/components/admin/PartnerManagement';

type MenuSection = 
  | 'dashboard' 
  | 'analytics' 
  | 'users' 
  | 'content'
  | 'ads'
  | 'team'
  | 'press'
  | 'partners'
  | 'pricing'
  | 'sections'
  | 'game'
  | 'settings' 
  | 'logs'
  | 'website';

export function AdminPanel() {
  const { isAdmin, logout } = useAdmin();
  const [activeSection, setActiveSection] = useState<MenuSection>('dashboard');
  const [isMinimized, setIsMinimized] = useState(true);

  if (!isAdmin) {
    return null;
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999]">
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMinimized(false);
          }}
          className="rounded-full w-14 h-14 shadow-2xl hover:scale-110 transition-transform bg-primary hover:bg-primary/90 cursor-pointer"
          size="icon"
          type="button"
        >
          <Shield className="size-6 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-5xl h-[85vh] flex gap-2">
      {/* Sidebar Menu */}
      <Card className="w-64 shadow-2xl border-accent/20 bg-background/95 backdrop-blur-sm flex flex-col overflow-hidden">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent/10">
                <Shield className="size-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-base">Admin Panel</CardTitle>
                <CardDescription className="text-xs">TacticIQ</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(true);
                }}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={logout}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <Separator className="flex-shrink-0" />
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <MenuButton
            icon={LayoutDashboard}
            label="Gösterge Paneli"
            active={activeSection === 'dashboard'}
            onClick={() => setActiveSection('dashboard')}
          />
          <MenuButton
            icon={FileBarChart}
            label="Analitik"
            active={activeSection === 'analytics'}
            onClick={() => setActiveSection('analytics')}
          />
          <MenuButton
            icon={Users}
            label="Kullanıcılar"
            active={activeSection === 'users'}
            onClick={() => setActiveSection('users')}
          />
          <MenuButton
            icon={FileText}
            label="İçerik Yönetimi"
            active={activeSection === 'content'}
            onClick={() => setActiveSection('content')}
          />
          <MenuButton
            icon={Monitor}
            label="Reklam Yönetimi"
            active={activeSection === 'ads'}
            onClick={() => setActiveSection('ads')}
          />
          <MenuButton
            icon={UserCheck}
            label="Ekip Yönetimi"
            active={activeSection === 'team'}
            onClick={() => setActiveSection('team')}
          />
          <MenuButton
            icon={FileText}
            label="Basın Bültenleri"
            active={activeSection === 'press'}
            onClick={() => setActiveSection('press')}
          />
          <MenuButton
            icon={Handshake}
            label="Partner Yönetimi"
            active={activeSection === 'partners'}
            onClick={() => setActiveSection('partners')}
          />
          <MenuButton
            icon={Image}
            label="Medya Yönetimi"
            active={activeSection === 'media'}
            onClick={() => setActiveSection('media')}
          />
          <MenuButton
            icon={Tag}
            label="Fiyatlandırma & İndirim"
            active={activeSection === 'pricing'}
            onClick={() => setActiveSection('pricing')}
          />
          <MenuButton
            icon={Layout}
            label="Bölüm Kontrolü"
            active={activeSection === 'sections'}
            onClick={() => setActiveSection('sections')}
          />
          <MenuButton
            icon={Gamepad2}
            label="Oyun Sistemi"
            active={activeSection === 'game'}
            onClick={() => setActiveSection('game')}
          />
          <MenuButton
            icon={Settings}
            label="Ayarlar"
            active={activeSection === 'settings'}
            onClick={() => setActiveSection('settings')}
          />
          <MenuButton
            icon={Activity}
            label="Loglar"
            active={activeSection === 'logs'}
            onClick={() => setActiveSection('logs')}
          />
        </div>
      </Card>

      {/* Main Content Area */}
      <Card className="flex-1 shadow-2xl border-accent/20 bg-background/95 backdrop-blur-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {activeSection === 'dashboard' && <DashboardContent />}
            {activeSection === 'analytics' && <AnalyticsContent />}
            {activeSection === 'users' && <UsersContent />}
            {activeSection === 'content' && <ContentContent />}
            {activeSection === 'ads' && <AdsContent />}
            {activeSection === 'team' && <TeamManagement />}
            {activeSection === 'press' && <PressReleaseManagement />}
            {activeSection === 'partners' && <PartnerManagement />}
            {activeSection === 'media' && <MediaContent />}
            {activeSection === 'pricing' && <PricingContent />}
            {activeSection === 'sections' && <SectionsContent />}
            {activeSection === 'game' && <GameContent />}
            {activeSection === 'settings' && <SettingsContent />}
            {activeSection === 'logs' && <LogsContent />}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Sections Content - Web Sitesi Bölüm Kontrolü
function SectionsContent() {
  const contextData = useContext(AdminDataContext);
  const sectionSettings = contextData?.sectionSettings;
  const updateSectionSettings = contextData?.updateSectionSettings;
  
  const [editedSections, setEditedSections] = useState<SectionSettings | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync editedSections when sectionSettings changes (only once on mount)
  useEffect(() => {
    if (sectionSettings && !isInitialized) {
      setEditedSections(sectionSettings);
      setIsInitialized(true);
    }
  }, [sectionSettings, isInitialized]);

  // Update editedSections when sectionSettings changes externally
  useEffect(() => {
    if (sectionSettings && isInitialized) {
      setEditedSections(sectionSettings);
    }
  }, [sectionSettings, isInitialized]);

  const handleSave = () => {
    if (updateSectionSettings && editedSections) {
      updateSectionSettings(editedSections);
      toast.success('Bölüm ayarları kaydedildi!');
    }
  };

  // Toggle handler - anında kaydet
  const handleToggleSection = (sectionKey: string, subKey?: string) => {
    if (!editedSections || !updateSectionSettings) return;
    
    const newSections = { ...editedSections } as any;
    
    if (subKey) {
      const section = newSections[sectionKey];
      if (section && typeof section === 'object') {
        newSections[sectionKey] = {
          ...section,
          [subKey]: !section[subKey]
        };
      }
    } else {
      const section = newSections[sectionKey];
      if (section && typeof section === 'object' && 'enabled' in section) {
        newSections[sectionKey] = {
          ...section,
          enabled: !section.enabled
        };
      }
    }
    
    setEditedSections(newSections);
    // Anında kaydet
    updateSectionSettings(newSections);
  };

  if (!editedSections) {
    return <div className="p-4">Yükleniyor...</div>;
  }

  if (!contextData) {
    return <div className="p-4 text-center">Bölüm ayarları yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Layout className="size-6" />
          Web Sitesi Bölüm Kontrolü
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ana sayfadaki bölümleri açın/kapatın ve görünürlüklerini kontrol edin
        </p>
      </div>

      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🎯 Hero (Ana Banner)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingToggle 
            label="Hero Bölümü" 
            description="Ana sayfa banner bölümünü göster/gizle"
            enabled={editedSections.hero.enabled}
            onToggle={() => handleToggleSection('hero')}
          />
          <div className="ml-6 space-y-2 border-l-2 border-muted pl-4">
            <SettingToggle 
              label="İstatistikler" 
              description="Hero altındaki istatistik bölümünü göster (Ortalama Değerlendirme, Aktif Kullanıcı, Yapılan Tahmin, Kapsanan Lig)"
              enabled={editedSections.hero.showStats}
              onToggle={() => handleToggleSection('hero', 'showStats')}
            />
            <SettingToggle 
              label="Email Kayıt Formu" 
              description="Email kayıt formunu göster"
              enabled={editedSections.hero.showEmailSignup}
              onToggle={() => handleToggleSection('hero', 'showEmailSignup')}
            />
            <SettingToggle 
              label="Oyun Oyna Butonu" 
              description="Oyun oyna butonunu göster"
              enabled={editedSections.hero.showPlayButton}
              onToggle={() => handleToggleSection('hero', 'showPlayButton')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Other Sections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📋 İçerik Bölümleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SettingToggle 
            label="⭐ Özellikler (Features)" 
            description="Ürün özelliklerini göster"
            enabled={editedSections.features.enabled}
            onToggle={() => handleToggleSection('features')}
          />
          <SettingToggle 
            label="📖 Nasıl Çalışır (How It Works)" 
            description="Nasıl çalışır bölümünü göster"
            enabled={editedSections.howItWorks.enabled}
            onToggle={() => handleToggleSection('howItWorks')}
          />
          <SettingToggle 
            label="🎮 Ürün (Product)" 
            description="Ürün tanıtım bölümünü göster"
            enabled={editedSections.product.enabled}
            onToggle={() => handleToggleSection('product')}
          />
          <SettingToggle 
            label="⚽ Oyuncu Tahmin (Player Prediction)" 
            description="Oyuncu tahmin bölümünü göster"
            enabled={editedSections.playerPrediction.enabled}
            onToggle={() => handleToggleSection('playerPrediction')}
          />
          <SettingToggle 
            label="🏋️ Eğitim (Training)" 
            description="Eğitim bölümünü göster"
            enabled={editedSections.training.enabled}
            onToggle={() => handleToggleSection('training')}
          />
          <SettingToggle 
            label="💰 Fiyatlandırma (Pricing)" 
            description="Fiyatlandırma bölümünü göster"
            enabled={editedSections.pricing.enabled}
            onToggle={() => handleToggleSection('pricing')}
          />
          <div className="ml-6 space-y-2 border-l-2 border-muted pl-4">
            <SettingToggle 
              label="Ücretsiz Plan" 
              description="Free plan seçeneğini göster"
              enabled={editedSections.pricing.showFreeOption}
              onToggle={() => handleToggleSection('pricing', 'showFreeOption')}
            />
            <SettingToggle 
              label="İndirim Göster" 
              description="Fiyatlandırma sayfasında indirim ve çizili fiyatı göster"
              enabled={editedSections.pricing.discountEnabled}
              onToggle={() => handleToggleSection('pricing', 'discountEnabled')}
            />
          </div>
          <SettingToggle 
            label="📝 Blog" 
            description="Blog bölümünü göster"
            enabled={editedSections.blog.enabled}
            onToggle={() => handleToggleSection('blog')}
          />
          <SettingToggle 
            label="📱 Uygulama İndirme (App Download)" 
            description="Uygulama indirme bölümünü göster"
            enabled={editedSections.appDownload.enabled}
            onToggle={() => handleToggleSection('appDownload')}
          />
          <SettingToggle 
            label="📢 CTA (Call to Action)" 
            description="Harekete geçirici bölümü göster"
            enabled={editedSections.cta.enabled}
            onToggle={() => handleToggleSection('cta')}
          />
          <SettingToggle 
            label="🎮 Oyun (Game)" 
            description="Oyun bölümünü göster"
            enabled={editedSections.game.enabled}
            onToggle={() => handleToggleSection('game')}
          />
          <SettingToggle 
            label="💬 Yorumlar (Testimonials)" 
            description="Kullanıcı yorumlarını göster"
            enabled={editedSections.testimonials.enabled}
            onToggle={() => handleToggleSection('testimonials')}
          />
          <SettingToggle 
            label="ℹ️ Hakkımızda (About)" 
            description="Hakkımızda bölümünü göster"
            enabled={editedSections.about.enabled}
            onToggle={() => handleToggleSection('about')}
          />
          <SettingToggle 
            label="🤝 Ortaklar (Partners)" 
            description="Ortaklar bölümünü göster"
            enabled={editedSections.partners.enabled}
            onToggle={() => handleToggleSection('partners')}
          />
          <SettingToggle 
            label="📰 Basın (Press)" 
            description="Basın bölümünü göster"
            enabled={editedSections.press.enabled}
            onToggle={() => handleToggleSection('press')}
          />
          <SettingToggle 
            label="❓ SSS (FAQ)" 
            description="Sık sorulan sorular bölümünü göster"
            enabled={editedSections.faq.enabled}
            onToggle={() => handleToggleSection('faq')}
          />
          <SettingToggle 
            label="📧 İletişim (Contact)" 
            description="İletişim bölümünü göster"
            enabled={editedSections.contact.enabled}
            onToggle={() => handleToggleSection('contact')}
          />
        </CardContent>
      </Card>

      {/* Auth Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🔐 Kayıt/Giriş Ayarları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SettingToggle 
            label="Kayıt Sistemi" 
            description="Kullanıcı kayıt ve giriş sistemini aktif et"
            enabled={editedSections.auth?.enabled ?? true}
            onToggle={() => handleToggleSection('auth')}
          />
          <div className="ml-6 space-y-2 border-l-2 border-muted pl-4">
            <SettingToggle 
              label="Yaş Doğrulama Zorunlu" 
              description="Kayıt sırasında yaş doğrulama (18+) zorunlu olsun"
              enabled={editedSections.auth?.requireAgeVerification ?? true}
              onToggle={() => handleToggleSection('auth', 'requireAgeVerification')}
            />
            <SettingToggle 
              label="Google ile Giriş" 
              description="Google OAuth ile giriş/kayıt aktif"
              enabled={editedSections.auth?.enableGoogleAuth ?? true}
              onToggle={() => handleToggleSection('auth', 'enableGoogleAuth')}
            />
            <SettingToggle 
              label="Apple ile Giriş" 
              description="Apple OAuth ile giriş/kayıt aktif (Apple Developer hesabı gerekli)"
              enabled={editedSections.auth?.enableAppleAuth ?? false}
              onToggle={() => handleToggleSection('auth', 'enableAppleAuth')}
            />
            <SettingToggle 
              label="E-posta ile Giriş" 
              description="E-posta/şifre ile giriş/kayıt aktif"
              enabled={editedSections.auth?.enableEmailAuth ?? true}
              onToggle={() => handleToggleSection('auth', 'enableEmailAuth')}
            />
            <SettingToggle 
              label="E-posta Doğrulama Zorunlu" 
              description="Kayıt sonrası e-posta doğrulama gerekli"
              enabled={editedSections.auth?.requireEmailConfirmation ?? true}
              onToggle={() => handleToggleSection('auth', 'requireEmailConfirmation')}
            />
            <SettingToggle 
              label="Kullanım Şartları Onayı" 
              description="Kayıt için kullanım şartları onayı zorunlu"
              enabled={editedSections.auth?.requireTermsAcceptance ?? true}
              onToggle={() => handleToggleSection('auth', 'requireTermsAcceptance')}
            />
            <SettingToggle 
              label="Gizlilik Politikası Onayı" 
              description="Kayıt için gizlilik politikası onayı zorunlu"
              enabled={editedSections.auth?.requirePrivacyAcceptance ?? true}
              onToggle={() => handleToggleSection('auth', 'requirePrivacyAcceptance')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          ✅ <strong>Otomatik Kayıt:</strong> Bölüm açma/kapama işlemleri anında kaydedilir. Sayfa yenilendiğinde ayarlar korunur.
        </p>
      </div>
    </div>
  );
}

// Menu Button Component
function MenuButton({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any; 
  label: string; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
        active 
          ? 'bg-accent/20 text-accent font-medium' 
          : 'hover:bg-muted/50 text-muted-foreground'
      }`}
    >
      <Icon className="size-4" />
      <span>{label}</span>
    </button>
  );
}

// Dashboard Content
function DashboardContent() {
  const contextData = useContext(AdminDataContext);
  
  if (!contextData) {
    return <div className="p-4 text-center">Admin panel yükleniyor...</div>;
  }
  
  const { stats, activities, refreshStats } = contextData;

  const handleRefresh = () => {
    refreshStats();
    toast.success('İstatistikler güncellendi');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Genel sistem durumu ve önemli metrikler</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="size-4" />
          Yenile
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Eye}
          label="Toplam Ziyaretçi"
          value={stats.totalVisitors.toLocaleString()}
          change={`+${stats.visitorChange}%`}
          positive
        />
        <StatCard
          icon={Users}
          label="Aktif Kullanıcılar"
          value={stats.activeUsers.toLocaleString()}
          change={`+${stats.userChange}%`}
          positive
        />
        <StatCard
          icon={DollarSign}
          label="Gelir (Aylık)"
          value={`€${stats.monthlyRevenue.toLocaleString()}`}
          change={`+${stats.revenueChange}%`}
          positive
        />
        <StatCard
          icon={UserCheck}
          label="Dönüşüm Oranı"
          value={`${stats.conversionRate}%`}
          change={`+${stats.conversionChange}%`}
          positive
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Son Aktiviteler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-80 overflow-y-auto">
          {activities.map((activity) => (
            <ActivityItem key={activity.id} {...activity} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Analytics Content
function AnalyticsContent() {
  const contextData = useContext(AdminDataContext);
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');

  const stats = contextData?.stats;
  const updateStats = contextData?.updateStats;
  const geoColors = ['bg-secondary', 'bg-accent', 'bg-primary', 'bg-muted', 'bg-muted-foreground'];
  const hourColors = ['bg-muted', 'bg-accent', 'bg-secondary', 'bg-primary'];
  const segmentColors = ['bg-muted', 'bg-secondary', 'bg-accent'];

  if (!contextData || !stats) {
    return <div className="p-4 text-center">Analytics yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Analytics</h2>
        <p className="text-sm text-muted-foreground">Detaylı kullanım istatistikleri ve analizler (Admin tarafından düzenlenebilir)</p>
      </div>

      {/* Time Period Selector */}
      <div className="flex gap-2">
        <Button 
          variant={timePeriod === 'today' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setTimePeriod('today')}
        >
          Bugün
        </Button>
        <Button 
          variant={timePeriod === 'week' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setTimePeriod('week')}
        >
          Bu Hafta
        </Button>
        <Button 
          variant={timePeriod === 'month' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setTimePeriod('month')}
        >
          Bu Ay
        </Button>
        <Button 
          variant={timePeriod === 'year' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setTimePeriod('year')}
        >
          Bu Yıl
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="size-4" />
              Coğrafi Dağılım
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.geoDistribution?.map((item, index) => (
              <ProgressBar 
                key={item.country} 
                label={item.country} 
                value={item.percentage} 
                color={geoColors[index % geoColors.length]} 
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="size-4" />
              Ziyaret Saatleri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.visitHours?.map((item, index) => (
              <ProgressBar 
                key={item.timeRange} 
                label={item.timeRange} 
                value={item.percentage} 
                color={hourColors[index % hourColors.length]} 
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4" />
              Kullanıcı Segmentleri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.userSegments?.map((item, index) => (
              <ProgressBar 
                key={item.segment} 
                label={item.segment} 
                value={item.percentage} 
                color={segmentColors[index % segmentColors.length]} 
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4" />
              Büyüme Metrikleri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.growthMetrics?.map((item) => (
              <MetricRow 
                key={item.label} 
                label={item.label} 
                value={item.value} 
                change={item.change} 
                positive={item.change.startsWith('+')} 
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Users Content
function UsersContent() {
  const contextData = useContext(AdminDataContext);
  const users = contextData?.users || [];
  const addUser = contextData?.addUser;
  const deleteUser = contextData?.deleteUser;
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    plan: 'Free' as 'Free' | 'Premium',
    status: 'active' as 'active' | 'inactive',
  });

  if (!contextData) {
    return <div className="p-4 text-center">Kullanıcılar yükleniyor...</div>;
  }

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    addUser(newUser);
    toast.success('Kullanıcı başarıyla eklendi');
    setShowAddDialog(false);
    setNewUser({ name: '', email: '', plan: 'Free', status: 'active' });
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`${name} kullanıcısını silmek istediğinize emin misiniz?`)) {
      deleteUser(id);
      toast.success('Kullanıcı silindi');
    }
  };

  const premiumCount = users.filter(u => u.plan === 'Premium').length;
  const activeCount = users.filter(u => u.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Kullanıcı Yönetimi</h2>
          <p className="text-sm text-muted-foreground">Kayıtlı kullanıcıları görüntüle ve yönet</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
          <Plus className="size-4" />
          Yeni Kullanıcı
        </Button>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Kullanıcı</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="size-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Premium Kullanıcı</p>
                <p className="text-2xl font-bold text-accent">{premiumCount}</p>
              </div>
              <UserCheck className="size-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktif Kullanıcı</p>
                <p className="text-2xl font-bold text-secondary">{activeCount}</p>
              </div>
              <Activity className="size-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kullanıcı Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {users.map((user) => (
              <UserRow 
                key={user.id}
                {...user}
                onDelete={() => handleDeleteUser(user.id, user.name)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
            <DialogDescription>Sisteme yeni kullanıcı ekleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">İsim</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Ahmet Yılmaz"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-email">E-posta</Label>
              <Input
                id="new-user-email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="ahmet@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <Select value={newUser.plan} onValueChange={(value: 'Free' | 'Premium') => setNewUser({ ...newUser, plan: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Free">Free</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select value={newUser.status} onValueChange={(value: 'active' | 'inactive') => setNewUser({ ...newUser, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>İptal</Button>
              <Button onClick={handleAddUser}>Ekle</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Content Content
function ContentContent() {
  const contextData = useContext(AdminDataContext);
  const contents = contextData?.contents || [];
  const addContent = contextData?.addContent;
  const deleteContent = contextData?.deleteContent;
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newContent, setNewContent] = useState({
    title: '',
    type: 'Blog' as 'Blog' | 'Sayfa' | 'Video',
    status: 'Taslak' as 'Yayında' | 'Taslak' | 'Zamanlandı',
    author: 'Admin',
  });

  if (!contextData) {
    return <div className="p-4 text-center">İçerikler yükleniyor...</div>;
  }

  const handleAddContent = () => {
    if (!newContent.title) {
      toast.error('Lütfen başlık girin');
      return;
    }

    addContent(newContent);
    toast.success('İçerik başarıyla eklendi');
    setShowAddDialog(false);
    setNewContent({ title: '', type: 'Blog', status: 'Taslak', author: 'Admin' });
  };

  const handleDeleteContent = (id: string, title: string) => {
    if (confirm(`"${title}" içeriğini silmek istediğinize emin misiniz?`)) {
      deleteContent(id);
      toast.success('İçerik silindi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">İçerik Yönetimi</h2>
          <p className="text-sm text-muted-foreground">Blog, sayfa ve medya içeriklerini yönet</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
          <Plus className="size-4" />
          Yeni İçerik
        </Button>
      </div>

      {/* Content Categories */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-accent transition-colors">
          <CardContent className="pt-6 text-center">
            <FileText className="size-8 mx-auto mb-2 text-secondary" />
            <p className="font-semibold">Blog Yazıları</p>
            <p className="text-2xl font-bold mt-2">{contents.filter(c => c.type === 'Blog').length}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-accent transition-colors">
          <CardContent className="pt-6 text-center">
            <Image className="size-8 mx-auto mb-2 text-accent" />
            <p className="font-semibold">Sayfalar</p>
            <p className="text-2xl font-bold mt-2">{contents.filter(c => c.type === 'Sayfa').length}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-accent transition-colors">
          <CardContent className="pt-6 text-center">
            <Tag className="size-8 mx-auto mb-2 text-primary" />
            <p className="font-semibold">Yayında</p>
            <p className="text-2xl font-bold mt-2">{contents.filter(c => c.status === 'Yayında').length}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-accent transition-colors">
          <CardContent className="pt-6 text-center">
            <Calendar className="size-8 mx-auto mb-2 text-muted-foreground" />
            <p className="font-semibold">Zamanlanmış</p>
            <p className="text-2xl font-bold mt-2">{contents.filter(c => c.status === 'Zamanlandı').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Content List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tüm İçerikler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {contents.map((content) => (
            <ContentRow 
              key={content.id}
              {...content}
              onDelete={() => handleDeleteContent(content.id, content.title)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Add Content Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni İçerik Ekle</DialogTitle>
            <DialogDescription>Sisteme yeni içerik ekleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Başlık</Label>
              <Input
                id="title"
                value={newContent.title}
                onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                placeholder="İçerik başlığı"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tür</Label>
              <Select value={newContent.type} onValueChange={(value: 'Blog' | 'Sayfa' | 'Video') => setNewContent({ ...newContent, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Blog">Blog</SelectItem>
                  <SelectItem value="Sayfa">Sayfa</SelectItem>
                  <SelectItem value="Video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select value={newContent.status} onValueChange={(value: 'Yayında' | 'Taslak' | 'Zamanlandı') => setNewContent({ ...newContent, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Taslak">Taslak</SelectItem>
                  <SelectItem value="Yayında">Yayında</SelectItem>
                  <SelectItem value="Zamanlandı">Zamanlandı</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>İptal</Button>
              <Button onClick={handleAddContent}>Ekle</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Ads Content
function AdsContent() {
  const contextData = useContext(AdminDataContext);
  const adSettings = contextData?.adSettings;
  const updateAdSettings = contextData?.updateAdSettings;
  const advertisements = contextData?.advertisements || [];
  const addAdvertisement = contextData?.addAdvertisement;
  const deleteAdvertisement = contextData?.deleteAdvertisement;
  
  const [editedAdSettings, setEditedAdSettings] = useState<AdSettings>({
    systemEnabled: false,
    popupEnabled: false,
    bannerEnabled: false,
    sidebarEnabled: false,
    adminEmail: ''
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [newAd, setNewAd] = useState({
    title: '',
    type: 'image' as 'image' | 'video',
    placement: 'popup' as 'popup' | 'banner' | 'sidebar',
    mediaUrl: '',
    linkUrl: '',
    duration: 10,
    frequency: 5,
    displayCount: undefined as number | undefined,
    currentDisplays: 0,
    enabled: true,
  });

  // adSettings değiştiğinde local state'i güncelle - sadece ilk yüklemede veya başka bir kaynaktan değişirse
  useEffect(() => {
    if (adSettings && !editedAdSettings.systemEnabled && !editedAdSettings.popupEnabled && !editedAdSettings.bannerEnabled && !editedAdSettings.sidebarEnabled && !editedAdSettings.adminEmail) {
      // Sadece editedAdSettings boşsa (ilk yükleme) güncelle
      setEditedAdSettings(adSettings);
    }
  }, [adSettings]);

  const handleSaveSettings = () => {
    if (updateAdSettings) {
      updateAdSettings(editedAdSettings);
      toast.success('Reklam ayarları kaydedildi!');
    }
  };

  // Toggle handler - hem local state'i güncelle hem de otomatik kaydet
  const handleToggleSetting = (key: keyof AdSettings) => {
    const newValue = !editedAdSettings[key];
    const updated = {
      ...editedAdSettings,
      [key]: newValue
    };
    setEditedAdSettings(updated);
    
    // Otomatik kaydet
    if (updateAdSettings) {
      updateAdSettings(updated);
      toast.success(`${key === 'systemEnabled' ? 'Reklam Sistemi' : key === 'popupEnabled' ? 'Pop-up Reklamlar' : key === 'bannerEnabled' ? 'Banner Reklamlar' : 'Sidebar Reklamlar'} ${newValue ? 'açıldı' : 'kapatıldı'}`);
    }
  };

  if (!contextData) {
    return <div className="p-4 text-center">Reklamlar yükleniyor...</div>;
  }

  const handleAddAd = () => {
    if (!newAd.title || !newAd.mediaUrl) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    if (addAdvertisement) {
      addAdvertisement(newAd);
      toast.success('Reklam başarıyla eklendi');
      setShowAddDialog(false);
      setNewAd({ title: '', type: 'image', placement: 'popup', mediaUrl: '', linkUrl: '', duration: 10, frequency: 5, displayCount: undefined, currentDisplays: 0, enabled: true });
    }
  };

  const handleDeleteAd = (id: string, title: string) => {
    if (confirm(`"${title}" reklamını silmek istediğinize emin misiniz?`)) {
      if (deleteAdvertisement) {
        deleteAdvertisement(id);
        toast.success('Reklam silindi');
      }
    }
  };

  const activeAdCount = advertisements.filter(a => a.enabled).length;
  const popupAds = advertisements.filter(a => a.placement === 'popup' && a.enabled);
  const bannerAds = advertisements.filter(a => a.placement === 'banner' && a.enabled);
  const sidebarAds = advertisements.filter(a => a.placement === 'sidebar' && a.enabled);
  
  // Reklam durumu bilgisi
  const hasActivePopupAds = popupAds.length > 0 && editedAdSettings.systemEnabled && editedAdSettings.popupEnabled;
  const hasActiveBannerAds = bannerAds.length > 0 && editedAdSettings.systemEnabled && editedAdSettings.bannerEnabled;
  const hasActiveSidebarAds = sidebarAds.length > 0 && editedAdSettings.systemEnabled && editedAdSettings.sidebarEnabled;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Reklam Yönetimi</h2>
          <p className="text-sm text-muted-foreground">Tüm reklam alanlarını yönetin (Pop-up, Banner, Sidebar)</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
          <Plus className="size-4" />
          Yeni Reklam
        </Button>
      </div>

      {/* Ad System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="size-4" />
            Reklam Sistemi Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <SettingToggle 
              label="🟢 Reklam Sistemi (Master Switch)" 
              description="Tüm reklam sistemini aç/kapa"
              enabled={editedAdSettings.systemEnabled}
              onToggle={() => handleToggleSetting('systemEnabled')}
            />
            <Separator />
            <SettingToggle 
              label="Pop-up Reklamlar" 
              description="Ana ekranda açılır pencere reklamları"
              enabled={editedAdSettings.popupEnabled}
              onToggle={() => handleToggleSetting('popupEnabled')}
              disabled={!editedAdSettings.systemEnabled}
            />
            <SettingToggle 
              label="Banner Reklamlar" 
              description="Sayfa üstünde banner reklamlar"
              enabled={editedAdSettings.bannerEnabled}
              onToggle={() => handleToggleSetting('bannerEnabled')}
              disabled={!editedAdSettings.systemEnabled}
            />
            <SettingToggle 
              label="Sidebar Reklamlar" 
              description="Yan menüde gösterilen reklamlar"
              enabled={editedAdSettings.sidebarEnabled}
              onToggle={() => handleToggleSetting('sidebarEnabled')}
              disabled={!editedAdSettings.systemEnabled}
            />
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Bildirim E-posta Adresi</Label>
              <Input
                id="adminEmail"
                type="email"
                value={editedAdSettings.adminEmail}
                onChange={(e) => {
                  const updated = { ...editedAdSettings, adminEmail: e.target.value };
                  setEditedAdSettings(updated);
                  // Otomatik kaydet
                  if (updateAdSettings) {
                    updateAdSettings(updated);
                  }
                }}
                placeholder="admin@tacticiq.app"
              />
              <p className="text-xs text-muted-foreground">Reklam performans raporları bu adrese gönderilir</p>
            </div>
          </div>

          {/* Reklam Durumu Bilgisi */}
          <div className="bg-muted/20 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold">📊 Reklam Durumu:</p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className={`p-2 rounded ${hasActivePopupAds ? 'bg-green-500/10 border border-green-500/30' : 'bg-muted/50'}`}>
                <div className="font-medium">Pop-up</div>
                <div className="text-muted-foreground">
                  {popupAds.length} aktif reklam
                </div>
                {hasActivePopupAds ? (
                  <div className="text-green-600 mt-1">✓ Gösteriliyor</div>
                ) : (
                  <div className="text-muted-foreground mt-1">
                    {!editedAdSettings.systemEnabled ? 'Sistem kapalı' : 
                     !editedAdSettings.popupEnabled ? 'Pop-up kapalı' : 
                     popupAds.length === 0 ? 'Aktif reklam yok' : 'Kapalı'}
                  </div>
                )}
              </div>
              <div className={`p-2 rounded ${hasActiveBannerAds ? 'bg-green-500/10 border border-green-500/30' : 'bg-muted/50'}`}>
                <div className="font-medium">Banner</div>
                <div className="text-muted-foreground">
                  {bannerAds.length} aktif reklam
                </div>
                {hasActiveBannerAds ? (
                  <div className="text-green-600 mt-1">✓ Gösteriliyor</div>
                ) : (
                  <div className="text-muted-foreground mt-1">
                    {!editedAdSettings.systemEnabled ? 'Sistem kapalı' : 
                     !editedAdSettings.bannerEnabled ? 'Banner kapalı' : 
                     bannerAds.length === 0 ? 'Aktif reklam yok' : 'Kapalı'}
                  </div>
                )}
              </div>
              <div className={`p-2 rounded ${hasActiveSidebarAds ? 'bg-green-500/10 border border-green-500/30' : 'bg-muted/50'}`}>
                <div className="font-medium">Sidebar</div>
                <div className="text-muted-foreground">
                  {sidebarAds.length} aktif reklam
                </div>
                {hasActiveSidebarAds ? (
                  <div className="text-green-600 mt-1">✓ Gösteriliyor</div>
                ) : (
                  <div className="text-muted-foreground mt-1">
                    {!editedAdSettings.systemEnabled ? 'Sistem kapalı' : 
                     !editedAdSettings.sidebarEnabled ? 'Sidebar kapalı' : 
                     sidebarAds.length === 0 ? 'Aktif reklam yok' : 'Kapalı'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSaveSettings} className="gap-2">
              <Save className="size-4" />
              Ayarları Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ad Management Component */}
      <AdManagement />
    </div>
  );
}

// Media Content - Medya Yönetimi (Her bölüm için görsel ve metin)
function MediaContent() {
  const contextData = useContext(AdminDataContext);
  const sectionMedia = contextData?.sectionMedia || [];
  const addSectionMedia = contextData?.addSectionMedia;
  const updateSectionMedia = contextData?.updateSectionMedia;
  const deleteSectionMedia = contextData?.deleteSectionMedia;
  const websiteContent = contextData?.websiteContent;
  const updateWebsiteContent = contextData?.updateWebsiteContent;

  const [activeTab, setActiveTab] = useState<'media' | 'headers'>('media');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMedia, setEditingMedia] = useState<SectionMediaItem | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [editingSection, setEditingSection] = useState<string>('hero');
  
  const [newMedia, setNewMedia] = useState({
    sectionId: 'hero',
    type: 'image' as 'image' | 'video' | 'text',
    title: '',
    description: '',
    url: '',
    altText: '',
    order: 0,
    enabled: true,
  });

  // WebsiteContent için edited state
  const [editedContent, setEditedContent] = useState(websiteContent);
  
  // websiteContent değiştiğinde editedContent'i güncelle
  useEffect(() => {
    if (websiteContent) {
      setEditedContent(websiteContent);
    }
  }, [websiteContent]);

  // Kullanılabilir bölümler
  const sections = [
    { id: 'hero', label: 'Ana Sayfa (Hero)' },
    { id: 'features', label: 'Özellikler' },
    { id: 'howItWorks', label: 'Nasıl Çalışır' },
    { id: 'product', label: 'Ürün Tanıtım' },
    { id: 'pricing', label: 'Fiyatlandırma' },
    { id: 'testimonials', label: 'Kullanıcı Yorumları' },
    { id: 'blog', label: 'Blog' },
    { id: 'about', label: 'Hakkımızda' },
    { id: 'partners', label: 'Ortaklar' },
    { id: 'press', label: 'Basın' },
    { id: 'faq', label: 'SSS' },
    { id: 'contact', label: 'İletişim' },
    { id: 'appDownload', label: 'Uygulama İndirme' },
    { id: 'game', label: 'Oyun Sistemi' },
    { id: 'cta', label: 'Aksiyon Çağrısı (CTA)' },
  ];

  // Filtrelenmiş medya
  const filteredMedia = selectedSection === 'all' 
    ? sectionMedia 
    : sectionMedia.filter(m => m.sectionId === selectedSection);

  const handleAddMedia = () => {
    if (!newMedia.title) {
      toast.error('Lütfen başlık girin');
      return;
    }
    if (newMedia.type !== 'text' && !newMedia.url) {
      toast.error('Lütfen görsel/video URL\'i girin');
      return;
    }

    if (addSectionMedia) {
      addSectionMedia(newMedia);
      toast.success('Medya başarıyla eklendi');
      setShowAddDialog(false);
      setNewMedia({
        sectionId: 'hero',
        type: 'image',
        title: '',
        description: '',
        url: '',
        altText: '',
        order: 0,
        enabled: true,
      });
    }
  };

  const handleUpdateMedia = () => {
    if (!editingMedia) return;
    
    if (updateSectionMedia) {
      updateSectionMedia(editingMedia.id, editingMedia);
      toast.success('Medya güncellendi');
      setEditingMedia(null);
    }
  };

  const handleDeleteMedia = (id: string, title: string) => {
    if (confirm(`"${title}" öğesini silmek istediğinize emin misiniz?`)) {
      if (deleteSectionMedia) {
        deleteSectionMedia(id);
        toast.success('Medya silindi');
      }
    }
  };

  if (!contextData) {
    return <div className="p-4 text-center">Medya yükleniyor...</div>;
  }

  // Bölüm başlıklarını kaydet
  const handleSaveHeaders = () => {
    if (!updateWebsiteContent || !editedContent) return;
    
    Object.keys(editedContent).forEach((key) => {
      updateWebsiteContent(key as keyof typeof websiteContent, editedContent[key as keyof typeof editedContent]);
    });
    toast.success('Bölüm başlıkları kaydedildi');
  };

  if (!contextData) {
    return <div className="p-4 text-center">Medya yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Image className="size-6" />
            Medya Yönetimi
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Her bölüm için görsel, video, metin içerikleri ve bölüm başlıklarını yönetin
          </p>
        </div>
        {activeTab === 'media' && (
          <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
            <Plus className="size-4" />
            Yeni Medya Ekle
          </Button>
        )}
      </div>

      {/* Sekmeler */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'media' | 'headers')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="media">🖼️ Medya İçeriği</TabsTrigger>
          <TabsTrigger value="headers">📝 Bölüm Başlıkları</TabsTrigger>
        </TabsList>

        {/* Medya İçeriği Sekmesi */}
        <TabsContent value="media" className="space-y-6 mt-6">
          {/* Bölüm Filtresi */}
          <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <Label>Bölüm Filtresi:</Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Bölüm seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Bölümler</SelectItem>
                {sections.map(section => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary">
              {filteredMedia.length} medya
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Medya Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMedia.map(media => (
          <Card key={media.id} className={!media.enabled ? 'opacity-50' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{media.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {sections.find(s => s.id === media.sectionId)?.label || media.sectionId}
                  </CardDescription>
                </div>
                <Badge variant={media.type === 'image' ? 'default' : media.type === 'video' ? 'secondary' : 'outline'}>
                  {media.type === 'image' ? '🖼️ Görsel' : media.type === 'video' ? '🎬 Video' : '📝 Metin'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Görsel Önizleme */}
              {media.type === 'image' && media.url && (
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={media.url} 
                    alt={media.altText || media.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x225?text=Görsel+Yüklenemedi';
                    }}
                  />
                </div>
              )}
              
              {media.type === 'video' && media.url && (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">🎬 Video: {media.url.substring(0, 30)}...</span>
                </div>
              )}

              {media.type === 'text' && media.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">{media.description}</p>
              )}

              {/* Aksiyonlar */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setEditingMedia(media)}
                  >
                    <Edit2 className="size-3 mr-1" />
                    Düzenle
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteMedia(media.id, media.title)}
                  >
                    <Trash2 className="size-3 mr-1" />
                    Sil
                  </Button>
                </div>
                <Badge variant={media.enabled ? 'default' : 'secondary'}>
                  {media.enabled ? 'Aktif' : 'Pasif'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredMedia.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Image className="size-16 mx-auto mb-4 opacity-50" />
            <p>Bu bölümde henüz medya yok</p>
            <Button 
              variant="outline" 
              className="mt-4 gap-2"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="size-4" />
              İlk Medyayı Ekle
            </Button>
          </div>
        )}
      </div>
        </TabsContent>

        {/* Bölüm Başlıkları Sekmesi */}
        <TabsContent value="headers" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Bölüm Başlıkları ve Metinleri</h3>
              <p className="text-sm text-muted-foreground">
                Her bölümün başlık, alt başlık ve buton metinlerini düzenleyin
              </p>
            </div>
            <Button onClick={handleSaveHeaders} className="gap-2">
              <Save className="size-4" />
              Tümünü Kaydet
            </Button>
          </div>

          <Tabs value={editingSection} onValueChange={setEditingSection}>
            <TabsList className="grid w-full grid-cols-5 max-h-[200px] overflow-y-auto">
              <TabsTrigger value="hero">Hero</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="blog">Blog</TabsTrigger>
              <TabsTrigger value="cta">CTA</TabsTrigger>
            </TabsList>

            {/* Hero Section */}
            <TabsContent value="hero" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="size-5" />
                    Hero Section
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Ana Başlık</Label>
                    <Input
                      value={editedContent?.hero?.title || ''}
                      onChange={(e) => setEditedContent({
                        ...editedContent,
                        hero: { ...editedContent?.hero, title: e.target.value }
                      })}
                      placeholder="Ana başlık"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alt Başlık</Label>
                    <Textarea
                      value={editedContent?.hero?.subtitle || ''}
                      onChange={(e) => setEditedContent({
                        ...editedContent,
                        hero: { ...editedContent?.hero, subtitle: e.target.value }
                      })}
                      placeholder="Alt başlık"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Buton Metni</Label>
                    <Input
                      value={editedContent?.hero?.buttonText || ''}
                      onChange={(e) => setEditedContent({
                        ...editedContent,
                        hero: { ...editedContent?.hero, buttonText: e.target.value }
                      })}
                      placeholder="Buton metni"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Features Section */}
            <TabsContent value="features" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="size-5" />
                    Features Section
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Başlık</Label>
                    <Input
                      value={editedContent?.features?.title || ''}
                      onChange={(e) => setEditedContent({
                        ...editedContent,
                        features: { ...editedContent?.features, title: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Açıklama</Label>
                    <Textarea
                      value={editedContent?.features?.description || ''}
                      onChange={(e) => setEditedContent({
                        ...editedContent,
                        features: { ...editedContent?.features, description: e.target.value }
                      })}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing Section */}
            <TabsContent value="pricing" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="size-5" />
                    Pricing Section
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Başlık</Label>
                    <Input
                      value={editedContent?.pricing?.title || ''}
                      onChange={(e) => setEditedContent({
                        ...editedContent,
                        pricing: { ...editedContent?.pricing, title: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Açıklama</Label>
                    <Textarea
                      value={editedContent?.pricing?.description || ''}
                      onChange={(e) => setEditedContent({
                        ...editedContent,
                        pricing: { ...editedContent?.pricing, description: e.target.value }
                      })}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Blog Section */}
            <TabsContent value="blog" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="size-5" />
                    Blog Section
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Başlık</Label>
                    <Input
                      value={editedContent?.blog?.title || ''}
                      onChange={(e) => setEditedContent({
                        ...editedContent,
                        blog: { ...editedContent?.blog, title: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Açıklama</Label>
                    <Textarea
                      value={editedContent?.blog?.description || ''}
                      onChange={(e) => setEditedContent({
                        ...editedContent,
                        blog: { ...editedContent?.blog, description: e.target.value }
                      })}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CTA Section */}
            <TabsContent value="cta" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="size-5" />
                    CTA Section
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Başlık</Label>
                    <Input
                      value={editedContent?.cta?.title || ''}
                      onChange={(e) => setEditedContent({
                        ...editedContent,
                        cta: { ...editedContent?.cta, title: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Açıklama</Label>
                    <Textarea
                      value={editedContent?.cta?.description || ''}
                      onChange={(e) => setEditedContent({
                        ...editedContent,
                        cta: { ...editedContent?.cta, description: e.target.value }
                      })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Buton Metni</Label>
                    <Input
                      value={editedContent?.cta?.buttonText || ''}
                      onChange={(e) => setEditedContent({
                        ...editedContent,
                        cta: { ...editedContent?.cta, buttonText: e.target.value }
                      })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Yeni Medya Ekleme Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yeni Medya Ekle</DialogTitle>
            <DialogDescription>
              Bir bölüme görsel, video veya metin içeriği ekleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Bölüm Seçimi */}
            <div className="space-y-2">
              <Label>Bölüm</Label>
              <Select 
                value={newMedia.sectionId} 
                onValueChange={(value) => setNewMedia({ ...newMedia, sectionId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Bölüm seçin" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(section => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tür Seçimi */}
            <div className="space-y-2">
              <Label>İçerik Türü</Label>
              <Select 
                value={newMedia.type} 
                onValueChange={(value: 'image' | 'video' | 'text') => setNewMedia({ ...newMedia, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">🖼️ Görsel</SelectItem>
                  <SelectItem value="video">🎬 Video</SelectItem>
                  <SelectItem value="text">📝 Metin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Başlık */}
            <div className="space-y-2">
              <Label>Başlık *</Label>
              <Input
                value={newMedia.title}
                onChange={(e) => setNewMedia({ ...newMedia, title: e.target.value })}
                placeholder="Medya başlığı"
              />
            </div>

            {/* URL (Görsel/Video için) */}
            {newMedia.type !== 'text' && (
              <div className="space-y-2">
                <Label>{newMedia.type === 'image' ? 'Görsel URL' : 'Video URL'} *</Label>
                <Input
                  value={newMedia.url}
                  onChange={(e) => setNewMedia({ ...newMedia, url: e.target.value })}
                  placeholder={newMedia.type === 'image' ? 'https://example.com/image.jpg' : 'https://youtube.com/watch?v=...'}
                />
                {newMedia.type === 'image' && newMedia.url && (
                  <div className="mt-2 aspect-video bg-muted rounded-lg overflow-hidden max-w-xs">
                    <img 
                      src={newMedia.url} 
                      alt="Önizleme"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x225?text=Görsel+Yüklenemedi';
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Alt Metin (Görsel için) */}
            {newMedia.type === 'image' && (
              <div className="space-y-2">
                <Label>Alt Metin (SEO için)</Label>
                <Input
                  value={newMedia.altText}
                  onChange={(e) => setNewMedia({ ...newMedia, altText: e.target.value })}
                  placeholder="Görsel açıklaması"
                />
              </div>
            )}

            {/* Açıklama */}
            <div className="space-y-2">
              <Label>Açıklama {newMedia.type === 'text' ? '*' : ''}</Label>
              <Textarea
                value={newMedia.description}
                onChange={(e) => setNewMedia({ ...newMedia, description: e.target.value })}
                placeholder="İçerik açıklaması veya metin"
                rows={3}
              />
            </div>

            {/* Sıralama */}
            <div className="space-y-2">
              <Label>Sıralama</Label>
              <Input
                type="number"
                value={newMedia.order}
                onChange={(e) => setNewMedia({ ...newMedia, order: parseInt(e.target.value) || 0 })}
                min={0}
              />
              <p className="text-xs text-muted-foreground">Düşük sayılar önce gösterilir</p>
            </div>

            {/* Aktif/Pasif */}
            <div className="flex items-center justify-between">
              <Label>Aktif</Label>
              <Button
                type="button"
                variant={newMedia.enabled ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setNewMedia({ ...newMedia, enabled: !newMedia.enabled })}
              >
                {newMedia.enabled ? 'Aktif' : 'Pasif'}
              </Button>
            </div>

            {/* Kaydet */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                İptal
              </Button>
              <Button onClick={handleAddMedia} className="gap-2">
                <Save className="size-4" />
                Ekle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Medya Düzenleme Dialog */}
      <Dialog open={!!editingMedia} onOpenChange={() => setEditingMedia(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Medya Düzenle</DialogTitle>
            <DialogDescription>
              Medya içeriğini güncelleyin
            </DialogDescription>
          </DialogHeader>
          {editingMedia && (
            <div className="space-y-4 pt-4">
              {/* Bölüm */}
              <div className="space-y-2">
                <Label>Bölüm</Label>
                <Select 
                  value={editingMedia.sectionId} 
                  onValueChange={(value) => setEditingMedia({ ...editingMedia, sectionId: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(section => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Başlık */}
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input
                  value={editingMedia.title}
                  onChange={(e) => setEditingMedia({ ...editingMedia, title: e.target.value })}
                />
              </div>

              {/* URL */}
              {editingMedia.type !== 'text' && (
                <div className="space-y-2">
                  <Label>{editingMedia.type === 'image' ? 'Görsel URL' : 'Video URL'}</Label>
                  <Input
                    value={editingMedia.url || ''}
                    onChange={(e) => setEditingMedia({ ...editingMedia, url: e.target.value })}
                  />
                  {editingMedia.type === 'image' && editingMedia.url && (
                    <div className="mt-2 aspect-video bg-muted rounded-lg overflow-hidden max-w-xs">
                      <img 
                        src={editingMedia.url} 
                        alt="Önizleme"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Alt Metin */}
              {editingMedia.type === 'image' && (
                <div className="space-y-2">
                  <Label>Alt Metin</Label>
                  <Input
                    value={editingMedia.altText || ''}
                    onChange={(e) => setEditingMedia({ ...editingMedia, altText: e.target.value })}
                  />
                </div>
              )}

              {/* Açıklama */}
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={editingMedia.description || ''}
                  onChange={(e) => setEditingMedia({ ...editingMedia, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Sıralama */}
              <div className="space-y-2">
                <Label>Sıralama</Label>
                <Input
                  type="number"
                  value={editingMedia.order}
                  onChange={(e) => setEditingMedia({ ...editingMedia, order: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>

              {/* Aktif/Pasif */}
              <div className="flex items-center justify-between">
                <Label>Aktif</Label>
                <Button
                  type="button"
                  variant={editingMedia.enabled ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setEditingMedia({ ...editingMedia, enabled: !editingMedia.enabled })}
                >
                  {editingMedia.enabled ? 'Aktif' : 'Pasif'}
                </Button>
              </div>

              {/* Kaydet */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingMedia(null)}>
                  İptal
                </Button>
                <Button onClick={handleUpdateMedia} className="gap-2">
                  <Save className="size-4" />
                  Güncelle
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Medya Ekleme/Düzenleme Dialog'ları - Tabs dışında */}
      {/* Yeni Medya Ekleme Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yeni Medya Ekle</DialogTitle>
            <DialogDescription>
              Bir bölüme görsel, video veya metin içeriği ekleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Bölüm Seçimi */}
            <div className="space-y-2">
              <Label>Bölüm</Label>
              <Select 
                value={newMedia.sectionId} 
                onValueChange={(value) => setNewMedia({ ...newMedia, sectionId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Bölüm seçin" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(section => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tür Seçimi */}
            <div className="space-y-2">
              <Label>İçerik Türü</Label>
              <Select 
                value={newMedia.type} 
                onValueChange={(value: 'image' | 'video' | 'text') => setNewMedia({ ...newMedia, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">🖼️ Görsel</SelectItem>
                  <SelectItem value="video">🎬 Video</SelectItem>
                  <SelectItem value="text">📝 Metin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Başlık */}
            <div className="space-y-2">
              <Label>Başlık *</Label>
              <Input
                value={newMedia.title}
                onChange={(e) => setNewMedia({ ...newMedia, title: e.target.value })}
                placeholder="Medya başlığı"
              />
            </div>

            {/* URL (Görsel/Video için) */}
            {newMedia.type !== 'text' && (
              <div className="space-y-2">
                <Label>{newMedia.type === 'image' ? 'Görsel URL' : 'Video URL'} *</Label>
                <Input
                  value={newMedia.url}
                  onChange={(e) => setNewMedia({ ...newMedia, url: e.target.value })}
                  placeholder={newMedia.type === 'image' ? 'https://example.com/image.jpg' : 'https://youtube.com/watch?v=...'}
                />
                {newMedia.type === 'image' && newMedia.url && (
                  <div className="mt-2 aspect-video bg-muted rounded-lg overflow-hidden max-w-xs">
                    <img 
                      src={newMedia.url} 
                      alt="Önizleme"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x225?text=Görsel+Yüklenemedi';
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Alt Metin (Görsel için) */}
            {newMedia.type === 'image' && (
              <div className="space-y-2">
                <Label>Alt Metin (SEO için)</Label>
                <Input
                  value={newMedia.altText}
                  onChange={(e) => setNewMedia({ ...newMedia, altText: e.target.value })}
                  placeholder="Görsel açıklaması"
                />
              </div>
            )}

            {/* Açıklama */}
            <div className="space-y-2">
              <Label>Açıklama {newMedia.type === 'text' ? '*' : ''}</Label>
              <Textarea
                value={newMedia.description}
                onChange={(e) => setNewMedia({ ...newMedia, description: e.target.value })}
                placeholder="İçerik açıklaması veya metin"
                rows={3}
              />
            </div>

            {/* Sıralama */}
            <div className="space-y-2">
              <Label>Sıralama</Label>
              <Input
                type="number"
                value={newMedia.order}
                onChange={(e) => setNewMedia({ ...newMedia, order: parseInt(e.target.value) || 0 })}
                min={0}
              />
              <p className="text-xs text-muted-foreground">Düşük sayılar önce gösterilir</p>
            </div>

            {/* Aktif/Pasif */}
            <div className="flex items-center justify-between">
              <Label>Aktif</Label>
              <Button
                type="button"
                variant={newMedia.enabled ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setNewMedia({ ...newMedia, enabled: !newMedia.enabled })}
              >
                {newMedia.enabled ? 'Aktif' : 'Pasif'}
              </Button>
            </div>

            {/* Kaydet */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                İptal
              </Button>
              <Button onClick={handleAddMedia} className="gap-2">
                <Save className="size-4" />
                Ekle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Medya Düzenleme Dialog */}
      <Dialog open={!!editingMedia} onOpenChange={() => setEditingMedia(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Medya Düzenle</DialogTitle>
            <DialogDescription>
              Medya içeriğini güncelleyin
            </DialogDescription>
          </DialogHeader>
          {editingMedia && (
            <div className="space-y-4 pt-4">
              {/* Bölüm */}
              <div className="space-y-2">
                <Label>Bölüm</Label>
                <Select 
                  value={editingMedia.sectionId} 
                  onValueChange={(value) => setEditingMedia({ ...editingMedia, sectionId: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(section => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Başlık */}
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input
                  value={editingMedia.title}
                  onChange={(e) => setEditingMedia({ ...editingMedia, title: e.target.value })}
                />
              </div>

              {/* URL */}
              {editingMedia.type !== 'text' && (
                <div className="space-y-2">
                  <Label>{editingMedia.type === 'image' ? 'Görsel URL' : 'Video URL'}</Label>
                  <Input
                    value={editingMedia.url || ''}
                    onChange={(e) => setEditingMedia({ ...editingMedia, url: e.target.value })}
                  />
                  {editingMedia.type === 'image' && editingMedia.url && (
                    <div className="mt-2 aspect-video bg-muted rounded-lg overflow-hidden max-w-xs">
                      <img 
                        src={editingMedia.url} 
                        alt="Önizleme"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Alt Metin */}
              {editingMedia.type === 'image' && (
                <div className="space-y-2">
                  <Label>Alt Metin</Label>
                  <Input
                    value={editingMedia.altText || ''}
                    onChange={(e) => setEditingMedia({ ...editingMedia, altText: e.target.value })}
                  />
                </div>
              )}

              {/* Açıklama */}
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={editingMedia.description || ''}
                  onChange={(e) => setEditingMedia({ ...editingMedia, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Sıralama */}
              <div className="space-y-2">
                <Label>Sıralama</Label>
                <Input
                  type="number"
                  value={editingMedia.order}
                  onChange={(e) => setEditingMedia({ ...editingMedia, order: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>

              {/* Aktif/Pasif */}
              <div className="flex items-center justify-between">
                <Label>Aktif</Label>
                <Button
                  type="button"
                  variant={editingMedia.enabled ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setEditingMedia({ ...editingMedia, enabled: !editingMedia.enabled })}
                >
                  {editingMedia.enabled ? 'Aktif' : 'Pasif'}
                </Button>
              </div>

              {/* Kaydet */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingMedia(null)}>
                  İptal
                </Button>
                <Button onClick={handleUpdateMedia} className="gap-2">
                  <Save className="size-4" />
                  Güncelle
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Pricing Content - Fiyatlandırma ve İndirim Yönetimi
function PricingContent() {
  const contextData = useContext(AdminDataContext);
  const priceSettings = contextData?.priceSettings;
  const updatePriceSettings = contextData?.updatePriceSettings;
  const discountSettings = contextData?.discountSettings;
  const updateDiscountSettings = contextData?.updateDiscountSettings;
  
  // Fiyat ayarları için ayrı state
  const [editedPriceSettings, setEditedPriceSettings] = useState(priceSettings || {
    proPrice: 99.99,
    baseCurrency: 'TRY' as const,
    freeTrialDays: 7,
    monthlyPrice: 29.99,
    yearlyPrice: 99.99,
    billingPeriod: 'yearly' as 'monthly' | 'yearly',
  });

  // İndirim popup ayarları için ayrı state
  const [editedDiscountSettings, setEditedDiscountSettings] = useState(discountSettings || {
    enabled: false,
    discountPercent: 20,
    showDiscountOnWeb: true,
    showDiscountViaPopup: false,
    dailyShowLimit: 3,
    showDelay: 5000,
    timerDuration: 600,
    maxShowsPerUser: 5,
    cooldownAfterClose: 3600,
    showOnEveryPage: false,
    popupTitle: 'Özel Teklif!',
    popupDescription: 'Sınırlı süre için özel indirim fırsatı',
    ctaButtonText: 'Hemen Al',
  });

  // Context değiştiğinde local state'leri güncelle
  useEffect(() => {
    if (priceSettings) {
      setEditedPriceSettings(priceSettings);
    }
  }, [priceSettings]);

  useEffect(() => {
    if (discountSettings) {
      setEditedDiscountSettings(discountSettings);
    }
  }, [discountSettings]);

  const handleSavePrice = () => {
    if (updatePriceSettings) {
      updatePriceSettings(editedPriceSettings);
      toast.success('Fiyat ayarları kaydedildi!');
    }
  };

  const handleSaveDiscount = () => {
    if (updateDiscountSettings) {
      updateDiscountSettings(editedDiscountSettings);
      toast.success('İndirim popup ayarları kaydedildi!');
    }
  };

  if (!contextData) {
    return <div className="p-4 text-center">Fiyatlandırma ayarları yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="size-6" />
          Fiyatlandırma & İndirim Yönetimi
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ürün fiyatlarını ve indirim kampanyalarını yönetin
        </p>
      </div>

      {/* ===== PRICE SETTINGS - Fiyat Ayarları (İndirimden Bağımsız) ===== */}
      <Card className="border-2 border-secondary/30">
        <CardHeader className="bg-secondary/5">
          <CardTitle className="text-base flex items-center gap-2">
            💰 Pro Plan Fiyat Ayarları
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Bu fiyat sabit kalır ve indirim popup'ından bağımsızdır. Kullanıcı diline göre otomatik para birimi çevrimi yapılır.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Para Birimi Seçimi */}
          <div className="space-y-2">
            <Label htmlFor="priceBaseCurrency">Para Birimi</Label>
            <Select 
              value={editedPriceSettings.baseCurrency} 
              onValueChange={(value: 'TRY' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CNY') => 
                setEditedPriceSettings({ ...editedPriceSettings, baseCurrency: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRY">🇹🇷 Türk Lirası (₺)</SelectItem>
                <SelectItem value="USD">🇺🇸 Amerikan Doları ($)</SelectItem>
                <SelectItem value="EUR">🇪🇺 Euro (€)</SelectItem>
                <SelectItem value="GBP">🇬🇧 İngiliz Sterlini (£)</SelectItem>
                <SelectItem value="AED">🇦🇪 BAE Dirhemi (د.إ)</SelectItem>
                <SelectItem value="CNY">🇨🇳 Çin Yuanı (¥)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Fiyatı girdiğiniz para birimi - Kullanıcı diline göre otomatik çevrilir</p>
          </div>

          <Separator />

          {/* Fatura Dönemi Seçimi */}
          <div className="space-y-2">
            <Label>Web'de Gösterilecek Fatura Dönemi</Label>
            <div className="flex gap-4">
              <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${editedPriceSettings.billingPeriod === 'monthly' ? 'border-secondary bg-secondary/10' : 'border-muted hover:border-secondary/50'}`}>
                <input
                  type="radio"
                  name="billingPeriod"
                  value="monthly"
                  checked={editedPriceSettings.billingPeriod === 'monthly'}
                  onChange={() => {
                    const monthlyPrice = editedPriceSettings.monthlyPrice || 0;
                    setEditedPriceSettings({ 
                      ...editedPriceSettings, 
                      billingPeriod: 'monthly',
                      proPrice: monthlyPrice // Aylık fiyatı aktif fiyat olarak ayarla
                    });
                  }}
                  className="accent-secondary"
                />
                <span className="font-medium">Aylık</span>
              </label>
              <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${editedPriceSettings.billingPeriod === 'yearly' ? 'border-secondary bg-secondary/10' : 'border-muted hover:border-secondary/50'}`}>
                <input
                  type="radio"
                  name="billingPeriod"
                  value="yearly"
                  checked={editedPriceSettings.billingPeriod === 'yearly'}
                  onChange={() => {
                    const yearlyPrice = editedPriceSettings.yearlyPrice || 0;
                    setEditedPriceSettings({ 
                      ...editedPriceSettings, 
                      billingPeriod: 'yearly',
                      proPrice: yearlyPrice // Yıllık fiyatı aktif fiyat olarak ayarla
                    });
                  }}
                  className="accent-secondary"
                />
                <span className="font-medium">Yıllık</span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Seçilen dönemin fiyatı web sitesinde gösterilir</p>
          </div>

          <Separator />
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyPrice">
                Aylık Fiyat ({CURRENCY_SYMBOLS[editedPriceSettings.baseCurrency]})
                {editedPriceSettings.billingPeriod === 'monthly' && <span className="ml-2 text-xs bg-secondary text-white px-2 py-0.5 rounded">AKTİF</span>}
              </Label>
              <Input
                id="monthlyPrice"
                type="number"
                min="0"
                step="0.01"
                value={editedPriceSettings.monthlyPrice || 0}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  const updates: any = { ...editedPriceSettings, monthlyPrice: value };
                  // Eğer aylık aktifse, proPrice'ı da güncelle
                  if (editedPriceSettings.billingPeriod === 'monthly') {
                    updates.proPrice = value;
                  }
                  setEditedPriceSettings(updates);
                }}
                className={editedPriceSettings.billingPeriod === 'monthly' ? 'border-secondary' : ''}
              />
              <p className="text-xs text-muted-foreground">Aylık abonelik fiyatı</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearlyPrice">
                Yıllık Fiyat ({CURRENCY_SYMBOLS[editedPriceSettings.baseCurrency]})
                {editedPriceSettings.billingPeriod === 'yearly' && <span className="ml-2 text-xs bg-secondary text-white px-2 py-0.5 rounded">AKTİF</span>}
              </Label>
              <Input
                id="yearlyPrice"
                type="number"
                min="0"
                step="0.01"
                value={editedPriceSettings.yearlyPrice || 0}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  const updates: any = { ...editedPriceSettings, yearlyPrice: value };
                  // Eğer yıllık aktifse, proPrice'ı da güncelle
                  if (editedPriceSettings.billingPeriod === 'yearly') {
                    updates.proPrice = value;
                  }
                  setEditedPriceSettings(updates);
                }}
                className={editedPriceSettings.billingPeriod === 'yearly' ? 'border-secondary' : ''}
              />
              <p className="text-xs text-muted-foreground">Yıllık abonelik fiyatı</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="freeTrialDays">Ücretsiz Deneme (Gün)</Label>
              <Input
                id="freeTrialDays"
                type="number"
                min="0"
                max="30"
                value={editedPriceSettings.freeTrialDays}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setEditedPriceSettings({ ...editedPriceSettings, freeTrialDays: value });
                }}
              />
              <p className="text-xs text-muted-foreground">0 = deneme yok</p>
            </div>
          </div>

          <div className="bg-secondary/10 rounded-lg p-4">
            <p className="font-semibold text-sm mb-2">📌 Web'de Gösterilecek Fiyat:</p>
            <div className="text-2xl font-bold text-secondary">
              {CURRENCY_SYMBOLS[editedPriceSettings.baseCurrency]}{editedPriceSettings.proPrice.toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground ml-2">/ {editedPriceSettings.billingPeriod === 'monthly' ? 'aylık' : 'yıllık'}</span>
            </div>
            {discountSettings?.enabled && discountSettings.discountPercent > 0 && (
              <div className="mt-2 text-sm">
                <span className="text-muted-foreground">İndirimli Fiyat:</span>
                <span className="ml-2 text-green-600 font-bold">
                  {CURRENCY_SYMBOLS[editedPriceSettings.baseCurrency]}
                  {(editedPriceSettings.proPrice * (1 - (discountSettings.discountPercent || 0) / 100)).toFixed(2)}
                </span>
                <span className="ml-1 text-xs text-green-600">(%{discountSettings.discountPercent} indirim)</span>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSavePrice} className="gap-2 bg-secondary hover:bg-secondary/90">
              <Save className="size-4" />
              Fiyatı Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===== DISCOUNT POPUP SETTINGS - İndirim Popup Ayarları ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            🎁 İndirim Popup Ayarları
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            İndirim popup'ı aktif olduğunda, yukarıdaki fiyata belirlenen yüzde kadar indirim uygulanır.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingToggle 
            label="🎁 İndirim Popup Sistemi" 
            description="İndirim popup'larını aktif/pasif yap"
            enabled={editedDiscountSettings.enabled}
            onToggle={() => setEditedDiscountSettings({ ...editedDiscountSettings, enabled: !editedDiscountSettings.enabled })}
          />

          {editedDiscountSettings.enabled && (
            <>
              <Separator />
              
              {/* İndirimli Fiyat Gösterim Kontrolü */}
              <div className="space-y-4 bg-muted/20 p-4 rounded-lg border">
                <div className="space-y-3">
                  <SettingToggle 
                    label="🌐 İndirimli Fiyatı Web'de Göster" 
                    description="Açık: Web sitesinde indirimli fiyat gösterilir. Kapalı: Web'de normal fiyat gösterilir, indirimli fiyat sadece popup'ta."
                    enabled={editedDiscountSettings.showDiscountOnWeb ?? true}
                    onToggle={() => {
                      const newValue = !(editedDiscountSettings.showDiscountOnWeb ?? true);
                      setEditedDiscountSettings({ 
                        ...editedDiscountSettings, 
                        showDiscountOnWeb: newValue,
                        // Eğer web'de göster aktifse, popup ile göster'i kapat
                        showDiscountViaPopup: newValue ? false : editedDiscountSettings.showDiscountViaPopup
                      });
                    }}
                  />
                  
                  <SettingToggle 
                    label="🎯 Popup ile İndirimi Göster" 
                    description="Açık: Web'de normal fiyat gösterilir, indirimli fiyat sadece popup'ta. Kullanıcı popup'ı kabul ederse satış indirimli fiyattan yapılır."
                    enabled={editedDiscountSettings.showDiscountViaPopup ?? false}
                    onToggle={() => {
                      const newValue = !(editedDiscountSettings.showDiscountViaPopup ?? false);
                      setEditedDiscountSettings({ 
                        ...editedDiscountSettings, 
                        showDiscountViaPopup: newValue,
                        // Eğer popup ile göster aktifse, web'de göster'i kapat
                        showDiscountOnWeb: newValue ? false : editedDiscountSettings.showDiscountOnWeb ?? true
                      });
                    }}
                  />
                </div>
                
                <div className="mt-4 p-3 bg-background/50 rounded border-l-4 border-secondary">
                  <p className="text-xs font-semibold mb-1">📌 Mevcut Davranış:</p>
                  {editedDiscountSettings.showDiscountOnWeb ? (
                    <p className="text-xs text-muted-foreground">
                      ✅ Web sitesinde <strong>indirimli fiyat</strong> gösterilecek. Satış indirimli fiyattan yapılacak.
                    </p>
                  ) : editedDiscountSettings.showDiscountViaPopup ? (
                    <p className="text-xs text-muted-foreground">
                      ✅ Web sitesinde <strong>normal fiyat</strong> gösterilecek. İndirimli fiyat sadece popup'ta. Kullanıcı popup'ı kabul ederse satış indirimli fiyattan, etmezse normal fiyattan yapılacak.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      ℹ️ Web sitesinde <strong>normal fiyat</strong> gösterilecek. Satış normal fiyattan yapılacak.
                    </p>
                  )}
                </div>
              </div>
              
              <Separator />
            </>
          )}
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discountPercent">İndirim Oranı</Label>
              <div className="relative">
                <Input
                  id="discountPercent"
                  type="number"
                  min="0"
                  max="100"
                  value={editedDiscountSettings.discountPercent}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    if (value >= 0 && value <= 100) {
                      setEditedDiscountSettings({ ...editedDiscountSettings, discountPercent: value });
                    }
                  }}
                  disabled={!editedDiscountSettings.enabled}
                  className="pr-14"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-accent">
                  %{editedDiscountSettings.discountPercent}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Fiyat üzerinden uygulanacak indirim</p>
            </div>

            <div className="space-y-2">
              <Label>İndirimli Fiyat Önizleme</Label>
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-green-600">
                    {CURRENCY_SYMBOLS[editedPriceSettings.baseCurrency]}
                    {(editedPriceSettings.proPrice * (1 - editedDiscountSettings.discountPercent / 100)).toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    {CURRENCY_SYMBOLS[editedPriceSettings.baseCurrency]}{editedPriceSettings.proPrice.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Tasarruf: {CURRENCY_SYMBOLS[editedPriceSettings.baseCurrency]}
                  {(editedPriceSettings.proPrice * editedDiscountSettings.discountPercent / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dailyShowLimit">Günlük Gösterim Limiti</Label>
              <Input
                id="dailyShowLimit"
                type="number"
                min="0"
                value={editedDiscountSettings.dailyShowLimit}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setEditedDiscountSettings({ ...editedDiscountSettings, dailyShowLimit: value });
                }}
                disabled={!editedDiscountSettings.enabled}
              />
              <p className="text-xs text-muted-foreground">0 = sınırsız</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="showDelay">Gösterim Gecikmesi (ms)</Label>
              <Input
                id="showDelay"
                type="number"
                min="0"
                step="1000"
                value={editedDiscountSettings.showDelay}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setEditedDiscountSettings({ ...editedDiscountSettings, showDelay: value });
                }}
                disabled={!editedDiscountSettings.enabled}
              />
              <p className="text-xs text-muted-foreground">1000ms = 1 saniye</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timerDuration">Geri Sayım Süresi (sn)</Label>
              <Input
                id="timerDuration"
                type="number"
                min="60"
                max="3600"
                value={editedDiscountSettings.timerDuration}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 600;
                  setEditedDiscountSettings({ ...editedDiscountSettings, timerDuration: value });
                }}
                disabled={!editedDiscountSettings.enabled}
              />
              <p className="text-xs text-muted-foreground">60-3600 saniye</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxShowsPerUser">Kullanıcı Başına Maks.</Label>
              <Input
                id="maxShowsPerUser"
                type="number"
                min="0"
                value={editedDiscountSettings.maxShowsPerUser || 0}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setEditedDiscountSettings({ ...editedDiscountSettings, maxShowsPerUser: value });
                }}
                disabled={!editedDiscountSettings.enabled}
              />
              <p className="text-xs text-muted-foreground">0 = sınırsız</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cooldownAfterClose">Kapatma Sonrası Bekleme (sn)</Label>
            <Input
              id="cooldownAfterClose"
              type="number"
              min="0"
              step="60"
              value={editedDiscountSettings.cooldownAfterClose || 0}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setEditedDiscountSettings({ ...editedDiscountSettings, cooldownAfterClose: value });
              }}
              disabled={!editedDiscountSettings.enabled}
            />
            <p className="text-xs text-muted-foreground">3600 = 1 saat</p>
          </div>

          <SettingToggle 
            label="Her Sayfada Göster" 
            description="Her sayfa yüklemesinde popup göster (kapalıysa sadece ana sayfa)"
            enabled={editedDiscountSettings.showOnEveryPage || false}
            onToggle={() => setEditedDiscountSettings({ ...editedDiscountSettings, showOnEveryPage: !editedDiscountSettings.showOnEveryPage })}
            disabled={!editedDiscountSettings.enabled}
          />

          <Separator />

          {/* Popup İçerik Ayarları */}
          <div className="space-y-4">
            <p className="font-semibold text-sm">✏️ Popup İçeriği:</p>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label htmlFor="popupTitle">Popup Başlığı</Label>
                <Input
                  id="popupTitle"
                  value={editedDiscountSettings.popupTitle || ''}
                  onChange={(e) => setEditedDiscountSettings({ ...editedDiscountSettings, popupTitle: e.target.value })}
                  disabled={!editedDiscountSettings.enabled}
                  placeholder="Özel Teklif!"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="popupDescription">Popup Açıklaması</Label>
                <Input
                  id="popupDescription"
                  value={editedDiscountSettings.popupDescription || ''}
                  onChange={(e) => setEditedDiscountSettings({ ...editedDiscountSettings, popupDescription: e.target.value })}
                  disabled={!editedDiscountSettings.enabled}
                  placeholder="Sınırlı süre için özel indirim fırsatı"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctaButtonText">CTA Buton Metni</Label>
                <Input
                  id="ctaButtonText"
                  value={editedDiscountSettings.ctaButtonText || ''}
                  onChange={(e) => setEditedDiscountSettings({ ...editedDiscountSettings, ctaButtonText: e.target.value })}
                  disabled={!editedDiscountSettings.enabled}
                  placeholder="Hemen Al"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSaveDiscount} className="gap-2">
              <Save className="size-4" />
              İndirim Ayarlarını Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Settings Content
function SettingsContent() {
  const contextData = useContext(AdminDataContext);
  const settings = contextData?.settings;
  const updateSettings = contextData?.updateSettings;
  const stats = contextData?.stats;
  const updateStats = contextData?.updateStats;
  
  const [editedSettings, setEditedSettings] = useState(settings || {
    siteName: '',
    siteUrl: '',
    contactEmail: '',
    maintenanceMode: false,
    registrationEnabled: true,
    proFeaturesEnabled: true,
    language: 'Türkçe',
    timezone: 'Europe/Istanbul',
    dateFormat: 'DD/MM/YYYY'
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Sync editedSettings when settings changes
  useEffect(() => {
    if (settings) {
      setEditedSettings(settings);
    }
  }, [settings]);

  // Real-time saat güncellemesi
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!contextData) {
    return <div className="p-4 text-center">Ayarlar yükleniyor...</div>;
  }

  // Dil ve saat dilimi eşleştirmesi
  const languageTimezoneMap: Record<string, string> = {
    'English': 'America/New_York',
    'Deutsch': 'Europe/Berlin',
    'Français': 'Europe/Paris',
    'Español': 'Europe/Madrid',
    'Italiano': 'Europe/Rome',
    'Türkçe': 'Europe/Istanbul',
    'العربية': 'Asia/Dubai',
    '中文': 'Asia/Shanghai',
  };

  const handleLanguageChange = (language: string) => {
    const timezone = languageTimezoneMap[language] || 'Europe/Istanbul';
    setEditedSettings({
      ...editedSettings,
      defaultLanguage: language,
      timezone: timezone,
    });
    toast.success(`Dil: ${language} • Saat Dilimi: ${timezone}`);
  };

  const handleSave = () => {
    updateSettings(editedSettings);
    toast.success('Ayarlar kaydedildi');
  };

  const handleToggle = (key: keyof typeof editedSettings) => {
    setEditedSettings({
      ...editedSettings,
      [key]: !editedSettings[key as string],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Sistem Ayarları</h2>
          <p className="text-sm text-muted-foreground">Platform yapılandırması ve tercihler</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="size-4" />
          Kaydet
        </Button>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="size-4" />
              Genel Ayarlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Site Adı</Label>
              <Input 
                value={editedSettings.siteName} 
                onChange={(e) => setEditedSettings({ ...editedSettings, siteName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Site URL</Label>
              <Input 
                value={editedSettings.siteUrl} 
                onChange={(e) => setEditedSettings({ ...editedSettings, siteUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Varsayılan Dil</Label>
              <Select value={editedSettings.defaultLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English (İngilizce)</SelectItem>
                  <SelectItem value="Deutsch">Deutsch (Almanca)</SelectItem>
                  <SelectItem value="Français">Français (Fransızca)</SelectItem>
                  <SelectItem value="Español">Español (İspanyolca)</SelectItem>
                  <SelectItem value="Italiano">Italiano (İtalyanca)</SelectItem>
                  <SelectItem value="Türkçe">Türkçe</SelectItem>
                  <SelectItem value="العربية">العربية (Arapça)</SelectItem>
                  <SelectItem value="中文">中文 (Çince)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Dil değiştiğinde saat dilimi otomatik ayarlanır</p>
            </div>
            <div className="space-y-2">
              <Label>Zaman Dilimi</Label>
              <Input 
                value={editedSettings.timezone} 
                onChange={(e) => setEditedSettings({ ...editedSettings, timezone: e.target.value })}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Seçilen dile göre otomatik belirlenir</p>
            </div>
            <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
              <p className="text-xs font-medium mb-2">📍 Aktif Yapılandırma</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>🌍 Dil: <strong className="text-foreground">{editedSettings.defaultLanguage}</strong></p>
                <p>🕒 Saat Dilimi: <strong className="text-foreground">{editedSettings.timezone}</strong></p>
                <p>⏰ Anlık Zaman: <strong className="text-foreground">{currentTime.toLocaleString(editedSettings.defaultLanguage === 'Türkçe' ? 'tr-TR' : 'en-US', { timeZone: editedSettings.timezone })}</strong></p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="size-4" />
              E-posta Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>SMTP Sunucu</Label>
              <Input 
                value={editedSettings.smtpServer} 
                onChange={(e) => setEditedSettings({ ...editedSettings, smtpServer: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Gönderici Adresi</Label>
              <Input 
                value={editedSettings.senderEmail} 
                onChange={(e) => setEditedSettings({ ...editedSettings, senderEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Günlük E-posta Limiti</Label>
              <Input 
                type="number"
                value={editedSettings.emailLimit} 
                onChange={(e) => setEditedSettings({ ...editedSettings, emailLimit: parseInt(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="size-4" />
              Bildirim Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingToggle 
              label="Yeni Kayıt Bildirimi" 
              enabled={editedSettings.newUserNotifications}
              onToggle={() => handleToggle('newUserNotifications')}
            />
            <SettingToggle 
              label="Premium Satış Bildirimi" 
              enabled={editedSettings.premiumSaleNotifications}
              onToggle={() => handleToggle('premiumSaleNotifications')}
            />
            <SettingToggle 
              label="Hata Bildirimleri" 
              enabled={editedSettings.errorNotifications}
              onToggle={() => handleToggle('errorNotifications')}
            />
            <SettingToggle 
              label="Günlük Rapor" 
              enabled={editedSettings.dailyReport}
              onToggle={() => handleToggle('dailyReport')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="size-4" />
              Para Birimi Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingToggle 
              label="Otomatik Kur Güncellemesi" 
              description="Döviz kurlarını günde bir kez otomatik günceller"
              enabled={editedSettings.autoUpdateCurrency}
              onToggle={() => handleToggle('autoUpdateCurrency')}
            />
            <div className="flex justify-between items-center p-2 rounded border">
              <div>
                <span className="text-sm font-medium">Son Güncelleme</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {editedSettings.lastCurrencyUpdate ? new Date(editedSettings.lastCurrencyUpdate).toLocaleDateString('tr-TR') : 'Henüz güncellenmedi'}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setEditedSettings({ ...editedSettings, lastCurrencyUpdate: new Date().toISOString() });
                  toast.success('Döviz kurları güncellendi');
                }}
              >
                <RefreshCw className="size-4 mr-2" />
                Manuel Güncelle
              </Button>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Desteklenen Para Birimleri:</strong><br />
                TRY (Türk Lirası), USD (Dolar), EUR (Euro), GBP (Sterlin), AED (Dirham), CNY (Yuan)
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>API Entegrasyonu:</strong><br />
                Gerçek zamanlı kur güncellemesi için /src/services/currencyService.ts dosyasına API anahtarınızı ekleyin.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="size-4" />
              Güvenlik
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-accent/5 rounded-lg border border-accent/10">
              <p className="text-sm font-medium mb-2">Hesap Güvenliği</p>
              <p className="text-xs text-muted-foreground mb-3">
                Hesabınızın güvenliği için düzenli olarak şifrenizi değiştirin.
              </p>
              <Button 
                onClick={() => setShowChangePassword(true)}
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
              >
                <Lock className="size-4" />
                Şifremi Değiştir
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mobile App QR Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="size-4" />
              Mobil Uygulama QR Kodları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Play QR */}
            <div className="space-y-2">
              <Label htmlFor="googlePlayQR" className="text-sm font-medium">
                Google Play Store QR Kodu
              </Label>
              <div className="flex gap-2">
                <Input
                  id="googlePlayQR"
                  type="url"
                  placeholder="https://example.com/google-play-qr.png"
                  value={settings.googlePlayQRCode || ''}
                  onChange={(e) => updateSettings({ googlePlayQRCode: e.target.value })}
                  className="flex-1"
                />
                {settings.googlePlayQRCode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(settings.googlePlayQRCode, '_blank')}
                  >
                    <Eye className="size-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Google Play Store indirme QR kodunun URL'sini girin
              </p>
            </div>

            {/* App Store QR */}
            <div className="space-y-2">
              <Label htmlFor="appStoreQR" className="text-sm font-medium">
                Apple App Store QR Kodu
              </Label>
              <div className="flex gap-2">
                <Input
                  id="appStoreQR"
                  type="url"
                  placeholder="https://example.com/app-store-qr.png"
                  value={settings.appStoreQRCode || ''}
                  onChange={(e) => updateSettings({ appStoreQRCode: e.target.value })}
                  className="flex-1"
                />
                {settings.appStoreQRCode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(settings.appStoreQRCode, '_blank')}
                  >
                    <Eye className="size-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Apple App Store indirme QR kodunun URL'sini girin
              </p>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                💡 QR kodları web sitesi footer'ında gösterilecektir
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="size-4" />
              İletişim Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">İletişim Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={editedSettings.contactEmail || ''}
                onChange={(e) => setEditedSettings({ ...editedSettings, contactEmail: e.target.value })}
                placeholder="support@tacticiq.app"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Telefon (Opsiyonel)</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={editedSettings.contactPhone || ''}
                onChange={(e) => setEditedSettings({ ...editedSettings, contactPhone: e.target.value })}
                placeholder="+90 555 123 4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactAddress">Adres (Opsiyonel)</Label>
              <Textarea
                id="contactAddress"
                value={editedSettings.contactAddress || ''}
                onChange={(e) => setEditedSettings({ ...editedSettings, contactAddress: e.target.value })}
                placeholder="Istanbul, Turkey"
                rows={2}
              />
            </div>

            <div className="pt-3 border-t">
              <p className="text-sm font-medium mb-3">Sosyal Medya Linkleri (Opsiyonel)</p>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="twitter" className="text-xs">Twitter</Label>
                  <Input
                    id="twitter"
                    type="url"
                    value={editedSettings.socialLinks?.twitter || ''}
                    onChange={(e) => setEditedSettings({ 
                      ...editedSettings, 
                      socialLinks: { ...editedSettings.socialLinks, twitter: e.target.value }
                    })}
                    placeholder="https://twitter.com/tacticiq"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="text-xs">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    value={editedSettings.socialLinks?.linkedin || ''}
                    onChange={(e) => setEditedSettings({ 
                      ...editedSettings, 
                      socialLinks: { ...editedSettings.socialLinks, linkedin: e.target.value }
                    })}
                    placeholder="https://linkedin.com/company/tacticiq"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook" className="text-xs">Facebook</Label>
                  <Input
                    id="facebook"
                    type="url"
                    value={editedSettings.socialLinks?.facebook || ''}
                    onChange={(e) => setEditedSettings({ 
                      ...editedSettings, 
                      socialLinks: { ...editedSettings.socialLinks, facebook: e.target.value }
                    })}
                    placeholder="https://facebook.com/tacticiq"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram" className="text-xs">Instagram</Label>
                  <Input
                    id="instagram"
                    type="url"
                    value={editedSettings.socialLinks?.instagram || ''}
                    onChange={(e) => setEditedSettings({ 
                      ...editedSettings, 
                      socialLinks: { ...editedSettings.socialLinks, instagram: e.target.value }
                    })}
                    placeholder="https://instagram.com/tacticiq"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                💡 Bu bilgiler footer ve iletişim sayfasında gösterilecektir
              </p>
            </div>
          </CardContent>
        </Card>

        {/* About Section Stats Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4" />
              Hakkımızda Bölümü İstatistikleri
            </CardTitle>
            <CardDescription>
              About section'da gösterilecek istatistikleri düzenleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="foundedYear">Kuruluş Yılı</Label>
                <Input
                  id="foundedYear"
                  type="number"
                  value={stats.foundedYear}
                  onChange={(e) => updateStats({ foundedYear: parseInt(e.target.value) || 2026 })}
                  placeholder="2026"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalUsers">Toplam Kullanıcı (örn: 0.0K+)</Label>
                <Input
                  id="totalUsers"
                  type="text"
                  value={stats.totalUsers}
                  onChange={(e) => updateStats({ totalUsers: e.target.value })}
                  placeholder="0.0K+"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalLeagues">Toplam Lig Sayısı</Label>
                <Input
                  id="totalLeagues"
                  type="number"
                  value={stats.totalLeagues}
                  onChange={(e) => updateStats({ totalLeagues: parseInt(e.target.value) || 25 })}
                  placeholder="25"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalLanguages">Desteklenen Dil Sayısı</Label>
                <Input
                  id="totalLanguages"
                  type="number"
                  value={stats.totalLanguages}
                  onChange={(e) => updateStats({ totalLanguages: parseInt(e.target.value) || 8 })}
                  placeholder="8"
                />
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                💡 Bu istatistikler About section'ın alt kısmında gösterilecektir
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Data Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="size-4" />
              Analytics Verileri
            </CardTitle>
            <CardDescription>
              Coğrafi dağılım, ziyaret saatleri ve büyüme metriklerini düzenleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Coğrafi Dağılım */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Coğrafi Dağılım (%)</Label>
              {stats.geoDistribution?.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item.country}
                    onChange={(e) => {
                      const newGeo = [...stats.geoDistribution];
                      newGeo[index] = { ...newGeo[index], country: e.target.value };
                      updateStats({ geoDistribution: newGeo });
                    }}
                    placeholder="Ülke adı"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={item.percentage}
                    onChange={(e) => {
                      const newGeo = [...stats.geoDistribution];
                      newGeo[index] = { ...newGeo[index], percentage: parseInt(e.target.value) || 0 };
                      updateStats({ geoDistribution: newGeo });
                    }}
                    placeholder="%"
                    className="w-20"
                  />
                </div>
              ))}
            </div>

            <Separator />

            {/* Ziyaret Saatleri */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Ziyaret Saatleri (%)</Label>
              {stats.visitHours?.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item.timeRange}
                    onChange={(e) => {
                      const newHours = [...stats.visitHours];
                      newHours[index] = { ...newHours[index], timeRange: e.target.value };
                      updateStats({ visitHours: newHours });
                    }}
                    placeholder="Saat aralığı"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={item.percentage}
                    onChange={(e) => {
                      const newHours = [...stats.visitHours];
                      newHours[index] = { ...newHours[index], percentage: parseInt(e.target.value) || 0 };
                      updateStats({ visitHours: newHours });
                    }}
                    placeholder="%"
                    className="w-20"
                  />
                </div>
              ))}
            </div>

            <Separator />

            {/* Kullanıcı Segmentleri */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Kullanıcı Segmentleri (%)</Label>
              {stats.userSegments?.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item.segment}
                    onChange={(e) => {
                      const newSegments = [...stats.userSegments];
                      newSegments[index] = { ...newSegments[index], segment: e.target.value };
                      updateStats({ userSegments: newSegments });
                    }}
                    placeholder="Segment adı"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={item.percentage}
                    onChange={(e) => {
                      const newSegments = [...stats.userSegments];
                      newSegments[index] = { ...newSegments[index], percentage: parseInt(e.target.value) || 0 };
                      updateStats({ userSegments: newSegments });
                    }}
                    placeholder="%"
                    className="w-20"
                  />
                </div>
              ))}
            </div>

            <Separator />

            {/* Büyüme Metrikleri */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Büyüme Metrikleri</Label>
              {stats.growthMetrics?.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item.label}
                    onChange={(e) => {
                      const newMetrics = [...stats.growthMetrics];
                      newMetrics[index] = { ...newMetrics[index], label: e.target.value };
                      updateStats({ growthMetrics: newMetrics });
                    }}
                    placeholder="Metrik adı"
                    className="flex-1"
                  />
                  <Input
                    value={item.value}
                    onChange={(e) => {
                      const newMetrics = [...stats.growthMetrics];
                      newMetrics[index] = { ...newMetrics[index], value: e.target.value };
                      updateStats({ growthMetrics: newMetrics });
                    }}
                    placeholder="Değer"
                    className="w-24"
                  />
                  <Input
                    value={item.change}
                    onChange={(e) => {
                      const newMetrics = [...stats.growthMetrics];
                      newMetrics[index] = { ...newMetrics[index], change: e.target.value };
                      updateStats({ growthMetrics: newMetrics });
                    }}
                    placeholder="Değişim"
                    className="w-20"
                  />
                </div>
              ))}
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                💡 Bu veriler Analytics sekmesinde görüntülenecektir
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="size-4" />
              Para Birimi Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency" className="text-sm font-medium">
                Varsayılan Para Birimi
              </Label>
              <select
                id="defaultCurrency"
                value={settings.defaultCurrency}
                onChange={(e) => updateSettings({ defaultCurrency: e.target.value as any })}
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
              >
                <option value="TRY">🇹🇷 TRY - Türk Lirası</option>
                <option value="USD">🇺🇸 USD - Amerikan Doları</option>
                <option value="EUR">🇪🇺 EUR - Euro</option>
                <option value="GBP">🇬🇧 GBP - İngiliz Sterlini</option>
                <option value="AED">🇦🇪 AED - BAE Dirhemi</option>
                <option value="CNY">🇨🇳 CNY - Çin Yuanı</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Fiyatlandırma sayfasında gösterilecek varsayılan para birimi
              </p>
            </div>

            <div className="p-3 bg-secondary/10 rounded-lg border">
              <div className="flex items-start gap-2">
                <Info className="size-4 text-secondary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-medium">Desteklenen Para Birimleri:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• TRY (Türkiye), USD (ABD/İngiltere), EUR (Avrupa)</li>
                    <li>• GBP (İngiltere), AED (BAE), CNY (Çin)</li>
                  </ul>
                </div>
              </div>
            </div>

            {settings.autoUpdateCurrency && (
              <div className="flex items-center justify-between p-2 rounded border bg-accent/5">
                <span className="text-xs text-muted-foreground">
                  Son kur güncellemesi:
                </span>
                <span className="text-xs font-medium">
                  {settings.lastCurrencyUpdate || 'Henüz güncellenmedi'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="size-4" />
              Veritabanı
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-2 rounded border">
              <span className="text-sm font-medium">Veritabanı Boyutu</span>
              <span className="text-sm text-muted-foreground">4.8 GB</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded border">
              <span className="text-sm font-medium">Son Yedekleme</span>
              <span className="text-sm text-muted-foreground">{new Date().toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => toast.success('Yedekleme başlatıldı')}>
                <Download className="size-4 mr-2" />
                Şimdi Yedekle
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast.success('Optimizasyon tamamlandı')}>
                Optimizasyon Yap
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
      />
    </div>
  );
}

// Logs Content
function LogsContent() {
  const contextData = useContext(AdminDataContext);
  const filterLogs = contextData?.filterLogs;
  
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'success' | 'warning' | 'error'>('all');

  if (!contextData || !filterLogs) {
    return <div className="p-4 text-center">Loglar yükleniyor...</div>;
  }

  const filteredLogs = filterLogs(logFilter);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Sistem Logları</h2>
        <p className="text-sm text-muted-foreground">Sistem aktiviteleri ve hata kayıtları</p>
      </div>

      {/* Log Filter */}
      <div className="flex gap-2">
        <Button 
          variant={logFilter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setLogFilter('all')}
        >
          Tümü ({filterLogs('all').length})
        </Button>
        <Button 
          variant={logFilter === 'info' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setLogFilter('info')}
        >
          Bilgi ({filterLogs('info').length})
        </Button>
        <Button 
          variant={logFilter === 'success' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setLogFilter('success')}
        >
          Başarılı ({filterLogs('success').length})
        </Button>
        <Button 
          variant={logFilter === 'warning' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setLogFilter('warning')}
        >
          Uyarı ({filterLogs('warning').length})
        </Button>
        <Button 
          variant={logFilter === 'error' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setLogFilter('error')}
        >
          Hata ({filterLogs('error').length})
        </Button>
      </div>

      {/* Log Entries */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y max-h-[60vh] overflow-y-auto">
            {filteredLogs.map((log) => (
              <LogEntry key={log.id} {...log} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  change, 
  positive 
}: { 
  icon: any; 
  label: string; 
  value: string; 
  change: string; 
  positive?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <Icon className="size-5 text-muted-foreground" />
          <span className={`text-xs font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {change}
          </span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ type, title, description, time }: any) {
  const icons = {
    user: Users,
    payment: DollarSign,
    content: FileText,
    system: Bell,
  };
  
  const Icon = icons[type as keyof typeof icons];

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="p-2 rounded-lg bg-muted">
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
    </div>
  );
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function MetricRow({ label, value, change }: { label: string; value: string; change: string; positive?: boolean }) {
  const isPositive = change.startsWith('+') || change.startsWith('-');
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{value}</span>
        <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-muted-foreground'}`}>
          {change}
        </span>
      </div>
    </div>
  );
}

function UserRow({ name, email, plan, status, onDelete }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
          <span className="text-white font-medium text-sm">{name[0]}</span>
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs px-2 py-1 rounded ${plan === 'Premium' ? 'bg-accent/20 text-accent' : 'bg-muted'}`}>
          {plan}
        </span>
        <span className={`text-xs px-2 py-1 rounded ${status === 'active' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
          {status === 'active' ? 'Aktif' : 'Pasif'}
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

function ContentRow({ title, type, status, date, onDelete }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-3 flex-1">
        <FileText className="size-5 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs text-muted-foreground">{type} • {date}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
          status === 'Yayında' ? 'bg-green-500/20 text-green-600' :
          status === 'Taslak' ? 'bg-yellow-500/20 text-yellow-600' :
          'bg-blue-500/20 text-blue-600'
        }`}>
          {status}
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

function AdRow({ title, type, placement, enabled, mediaUrl, duration, frequency, displayCount, currentDisplays, onDelete, onToggle }: any) {
  const placementLabels = {
    popup: 'Pop-up',
    banner: 'Banner',
    sidebar: 'Sidebar',
  };

  const displayInfo = displayCount 
    ? `${currentDisplays || 0}/${displayCount} gösterim` 
    : 'Sınırsız';

  const isExpired = displayCount && currentDisplays && currentDisplays >= displayCount;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${isExpired ? 'bg-muted/30 opacity-70' : ''}`}>
      <div className="flex items-center gap-3 flex-1">
        <Monitor className="size-5 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs text-muted-foreground">
            {type === 'image' ? 'Görsel' : 'Video'} • {placementLabels[placement as keyof typeof placementLabels] || 'Pop-up'} • {duration}s • Her {frequency}dk • {displayInfo}
          </p>
          {isExpired && <p className="text-xs text-orange-600 mt-1">⚠️ Maksimum gösterime ulaşıldı</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggle}
          className={`w-10 h-5 rounded-full transition-colors ${enabled && !isExpired ? 'bg-green-500' : 'bg-muted'}`}
        >
          <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${enabled && !isExpired ? 'ml-5' : 'ml-0.5'}`} />
        </button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

function SettingToggle({ label, description, enabled, onToggle, disabled }: { 
  label: string; 
  description?: string;
  enabled: boolean; 
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center p-3 rounded border ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex-1">
        <span className="text-sm font-medium">{label}</span>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
      <button 
        onClick={onToggle}
        disabled={disabled}
        className={`w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-accent' : 'bg-muted'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${enabled ? 'ml-5' : 'ml-0.5'}`} />
      </button>
    </div>
  );
}

// Game Content Section
function GameContent() {
  const context = useContext(AdminDataContext);
  const settings = context?.settings;
  const updateSettings = context?.updateSettings;
  const games = context?.games || [];
  const addGame = context?.addGame;
  const updateGame = context?.updateGame;
  const deleteGame = context?.deleteGame;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<any>(null);
  const [formData, setFormData] = useState<Omit<any, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    logo: '',
    link: '',
    description: '',
    enabled: true,
    featured: false,
    order: games.length,
  });

  if (!context || !settings || !updateSettings) {
    return <div className="p-4 text-center">Oyun sistemi yükleniyor...</div>;
  }

  const handleToggleGame = () => {
    updateSettings({ gameEnabled: !settings.gameEnabled });
    toast.success(
      settings.gameEnabled 
        ? '🎮 Oyun sistemi devre dışı bırakıldı' 
        : '🎮 Oyun sistemi aktif edildi'
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Oyun Sistemi Yönetimi</h2>
        <p className="text-sm text-muted-foreground">
          Web üzerinden oynanabilir oyun modülünü yönetin
        </p>
      </div>

      <Card className="border-2 border-accent/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-accent/10">
                <Gamepad2 className="size-6 text-accent" />
              </div>
              <div>
                <CardTitle className="text-lg">Oyun Modülü</CardTitle>
                <CardDescription>
                  Kullanıcıların web sitesinden oyun oynayabilmesini sağlar
                </CardDescription>
              </div>
            </div>
            <button 
              onClick={handleToggleGame}
              className={`w-16 h-8 rounded-full transition-colors ${settings.gameEnabled ? 'bg-green-500' : 'bg-muted'}`}
            >
              <div className={`w-6 h-6 rounded-full bg-white mt-1 transition-transform ${settings.gameEnabled ? 'ml-9' : 'ml-1'}`} />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${settings.gameEnabled ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/50'}`}>
              <div className="flex items-start gap-3">
                <Info className="size-5 text-accent mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {settings.gameEnabled ? '✅ Oyun sistemi aktif' : '❌ Oyun sistemi devre dışı'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {settings.gameEnabled 
                      ? 'Kullanıcılar web sitesinde "Oyun Oyna" butonunu görebilir ve oyun arayüzüne erişebilir.'
                      : 'Oyun butonu ve arayüzü gizlenmiştir. Sadece admin panelinden yeniden açabilirsiniz.'
                    }
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">📋 Backend Bağlantısı Gerekli</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>🔸 Oyun veritabanı şeması oluşturulmalı</p>
                <p>🔸 API endpoint'leri yapılandırılmalı</p>
                <p>🔸 Game Service backend'e bağlanmalı</p>
                <p>🔸 Liderlik tablosu database'e entegre edilmeli</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">🔐 Güvenlik Önlemleri</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✅ Rate limiting aktif (dakikada 30 istek)</p>
                <p>✅ Input sanitization ve XSS koruması</p>
                <p>✅ CSRF token kontrolü</p>
                <p>✅ Şifrelenmiş veri iletimi</p>
                <p>✅ API authentication sistemi</p>
              </div>
            </div>

            <Separator />

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Database className="size-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Dokümantasyon Hazır
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tüm game system dokümantasyonu oluşturuldu. Detaylar için README dosyalarına bakın:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                    <li>• GAME_SYSTEM_README.md</li>
                    <li>• GAME_SECURITY_GUIDE.md</li>
                    <li>• GAME_BACKEND_INTEGRATION.md</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">📊 Oyun İstatistikleri (Demo)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Toplam Oyuncu</p>
              <p className="text-2xl font-bold text-accent">-</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Aktif Oyunlar</p>
              <p className="text-2xl font-bold text-accent">-</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Tamamlanan</p>
              <p className="text-2xl font-bold text-accent">-</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Ortalama Puan</p>
              <p className="text-2xl font-bold text-accent">-</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            * Backend bağlantısı sonrası gerçek veriler görüntülenecek
          </p>
        </CardContent>
      </Card>

      {/* Partner Oyunlar Yönetimi */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gamepad2 className="size-5 text-accent" />
                Partner Oyunlar
              </CardTitle>
              <CardDescription>
                Web sitesinde gösterilecek partner oyunları yönetin (logo + link)
              </CardDescription>
            </div>
            <Button onClick={() => {
              setEditingGame(null);
              setFormData({
                name: '',
                logo: '',
                link: '',
                description: '',
                enabled: true,
                featured: false,
                order: games.length,
              });
              setIsDialogOpen(true);
            }}>
              <Plus className="size-4 mr-2" />
              Oyun Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {games.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Henüz partner oyun eklenmedi
              </p>
            ) : (
              games
                .sort((a, b) => a.order - b.order)
                .map((game) => (
                  <Card key={game.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {game.logo && (
                          <img 
                            src={game.logo} 
                            alt={game.name} 
                            className="w-16 h-16 object-contain rounded-lg border"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{game.name}</h3>
                            {game.featured && (
                              <Badge variant="secondary" className="text-xs">Öne Çıkan</Badge>
                            )}
                            {!game.enabled && (
                              <Badge variant="outline" className="text-xs">Gizli</Badge>
                            )}
                          </div>
                          {game.description && (
                            <p className="text-sm text-muted-foreground mb-2">{game.description}</p>
                          )}
                          <a 
                            href={game.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {game.link}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingGame(game);
                              setFormData(game);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`${game.name} oyununu silmek istediğinizden emin misiniz?`)) {
                                deleteGame(game.id);
                                toast.success('Oyun silindi');
                              }
                            }}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Oyun Ekleme/Düzenleme Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGame ? 'Oyun Düzenle' : 'Yeni Oyun Ekle'}</DialogTitle>
            <DialogDescription>
              Partner oyun bilgilerini girin. Logo PNG/JPG/SVG URL veya base64 formatında olabilir.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!formData.name || !formData.logo || !formData.link) {
              toast.error('Lütfen zorunlu alanları doldurun');
              return;
            }
            if (editingGame) {
              updateGame(editingGame.id, formData);
              toast.success('Oyun güncellendi');
            } else {
              addGame(formData);
              toast.success('Oyun eklendi');
            }
            setIsDialogOpen(false);
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Oyun Adı *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: Football Manager 2026"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo (URL veya Base64) *</Label>
              <Input
                id="logo"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                placeholder="https://example.com/logo.png veya data:image/png;base64,..."
                required
              />
              {formData.logo && (
                <img 
                  src={formData.logo} 
                  alt="Preview" 
                  className="w-24 h-24 object-contain border rounded-lg mt-2"
                  onError={() => toast.error('Logo yüklenemedi. URL veya base64 formatını kontrol edin.')}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Oyun Linki (URL) *</Label>
              <Input
                id="link"
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://example.com/game"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Oyun hakkında kısa açıklama"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="enabled" className="cursor-pointer">Aktif</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="featured" className="cursor-pointer">Öne Çıkan</Label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit">
                  <Save className="size-4 mr-2" />
                  {editingGame ? 'Güncelle' : 'Ekle'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LogEntry({ type, message, user, time }: any) {
  const colors = {
    info: 'bg-blue-500/20 text-blue-600',
    success: 'bg-green-500/20 text-green-600',
    warning: 'bg-yellow-500/20 text-yellow-600',
    error: 'bg-red-500/20 text-red-600',
  };

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
      <div className={`px-2 py-1 rounded text-xs font-medium ${colors[type as keyof typeof colors]}`}>
        {type.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{message}</p>
        <p className="text-xs text-muted-foreground">User: {user}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
    </div>
  );
}