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
  Edit2
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
import { AdminDataContext, CURRENCY_SYMBOLS, LANGUAGE_CURRENCY_MAP, AdSettings } from '@/contexts/AdminDataContext';
import { WebsiteEditor } from '@/app/components/admin/WebsiteEditor';
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
          <MenuButton
            icon={Layout}
            label="Web Sitesi Editörü"
            active={activeSection === 'website'}
            onClick={() => setActiveSection('website')}
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
            {activeSection === 'pricing' && <PricingContent />}
            {activeSection === 'sections' && <SectionsContent />}
            {activeSection === 'game' && <GameContent />}
            {activeSection === 'settings' && <SettingsContent />}
            {activeSection === 'logs' && <LogsContent />}
            {activeSection === 'website' && <WebsiteContent />}
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
  
  const [editedSections, setEditedSections] = useState(sectionSettings || {});

  // Sync editedSections when sectionSettings changes
  useEffect(() => {
    if (sectionSettings) {
      setEditedSections(sectionSettings);
    }
  }, [sectionSettings]);

  const handleSave = () => {
    if (updateSectionSettings) {
      updateSectionSettings(editedSections);
      toast.success('Bölüm ayarları kaydedildi!');
    }
  };

  // Toggle handler - anında kaydet
  const handleToggleSection = (sectionKey: string, subKey?: string) => {
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
    if (updateSectionSettings) {
      updateSectionSettings(newSections);
    }
    toast.success('Bölüm ayarı güncellendi!');
  };

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

  // adSettings değiştiğinde local state'i güncelle
  useEffect(() => {
    if (adSettings) {
      setEditedAdSettings(adSettings);
    }
  }, [adSettings]);

  const handleSaveSettings = () => {
    if (updateAdSettings) {
      updateAdSettings(editedAdSettings);
      toast.success('Reklam ayarları kaydedildi!');
    }
  };

  // Toggle handler - sadece local state'i güncelle
  const handleToggleSetting = (key: keyof AdSettings) => {
    setEditedAdSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!contextData) {
    return <div className="p-4 text-center">Reklamlar yükleniyor...</div>;
  }

  const handleAddAd = () => {
    if (!newAd.title || !newAd.mediaUrl) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    addAdvertisement(newAd);
    toast.success('Reklam başarıyla eklendi');
    setShowAddDialog(false);
    setNewAd({ title: '', type: 'image', placement: 'popup', mediaUrl: '', linkUrl: '', duration: 10, frequency: 5, displayCount: undefined, currentDisplays: 0, enabled: true });
  };

  const handleDeleteAd = (id: string, title: string) => {
    if (confirm(`"${title}" reklamını silmek istediğinize emin misiniz?`)) {
      deleteAdvertisement(id);
      toast.success('Reklam silindi');
    }
  };

  const activeAdCount = advertisements.filter(a => a.enabled).length;
  const popupAds = advertisements.filter(a => a.placement === 'popup');
  const bannerAds = advertisements.filter(a => a.placement === 'banner');
  const sidebarAds = advertisements.filter(a => a.placement === 'sidebar');

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
              onToggle={() => {
                const newValue = !editedAdSettings.systemEnabled;
                handleToggleSetting('systemEnabled');
                toast.success(newValue ? 'Reklam sistemi açıldı' : 'Reklam sistemi kapatıldı');
              }}
            />
            <Separator />
            <SettingToggle 
              label="Pop-up Reklamlar" 
              description="Ana ekranda açılır pencere reklamları"
              enabled={editedAdSettings.popupEnabled}
              onToggle={() => {
                const newValue = !editedAdSettings.popupEnabled;
                handleToggleSetting('popupEnabled');
                toast.success(newValue ? 'Pop-up reklamlar açıldı' : 'Pop-up reklamlar kapatıldı');
              }}
              disabled={!editedAdSettings.systemEnabled}
            />
            <SettingToggle 
              label="Banner Reklamlar" 
              description="Sayfa üstünde banner reklamlar"
              enabled={editedAdSettings.bannerEnabled}
              onToggle={() => {
                const newValue = !editedAdSettings.bannerEnabled;
                handleToggleSetting('bannerEnabled');
                toast.success(newValue ? 'Banner reklamlar açıldı' : 'Banner reklamlar kapatıldı');
              }}
              disabled={!editedAdSettings.systemEnabled}
            />
            <SettingToggle 
              label="Sidebar Reklamlar" 
              description="Yan menüde gösterilen reklamlar"
              enabled={editedAdSettings.sidebarEnabled}
              onToggle={() => {
                const newValue = !editedAdSettings.sidebarEnabled;
                handleToggleSetting('sidebarEnabled');
                toast.success(newValue ? 'Sidebar reklamlar açıldı' : 'Sidebar reklamlar kapatıldı');
              }}
              disabled={!editedAdSettings.systemEnabled}
            />
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Bildirim E-posta Adresi</Label>
              <Input
                id="adminEmail"
                type="email"
                value={editedAdSettings.adminEmail}
                onChange={(e) => setEditedAdSettings({ ...editedAdSettings, adminEmail: e.target.value })}
                placeholder="admin@tacticiq.app"
              />
              <p className="text-xs text-muted-foreground">Reklam performans raporları bu adrese gönderilir</p>
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

// Pricing Content - Fiyatlandırma ve İndirim Yönetimi
function PricingContent() {
  const contextData = useContext(AdminDataContext);
  const discountSettings = contextData?.discountSettings;
  const updateDiscountSettings = contextData?.updateDiscountSettings;
  
  const [editedSettings, setEditedSettings] = useState(discountSettings || {
    enabled: false,
    discountPercent: 0,
    originalPrice: 0,
    discountedPrice: 0,
    popupTitle: '',
    popupDescription: '',
    ctaText: '',
    expiryDate: '',
    showCountdown: false,
    baseCurrency: 'TRY' as const
  });

  // discountSettings değiştiğinde local state'i güncelle
  useEffect(() => {
    if (discountSettings) {
      setEditedSettings(discountSettings);
    }
  }, [discountSettings]);

  const handleSave = () => {
    if (updateDiscountSettings) {
      updateDiscountSettings(editedSettings);
      toast.success('Fiyatlandırma ayarları kaydedildi!');
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

      {/* Discount Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="size-4" />
            İndirim Popup Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingToggle 
            label="🎁 İndirim Popup Sistemi" 
            description="İndirim popup'larını aktif/pasif yap"
            enabled={editedSettings.enabled}
            onToggle={() => setEditedSettings({ ...editedSettings, enabled: !editedSettings.enabled })}
          />
          
          <Separator />
          
          {/* Para Birimi Seçimi */}
          <div className="space-y-2">
            <Label htmlFor="baseCurrency">Para Birimi</Label>
            <Select 
              value={editedSettings.baseCurrency} 
              onValueChange={(value: 'TRY' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CNY') => 
                setEditedSettings({ ...editedSettings, baseCurrency: value })
              }
              disabled={!editedSettings.enabled}
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
            <p className="text-xs text-muted-foreground">Fiyatı girdiğiniz para birimi - Otomatik olarak diğer dillere çevrilecek</p>
          </div>

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
                  value={editedSettings.discountPercent}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    if (value >= 0 && value <= 100) {
                      setEditedSettings({ ...editedSettings, discountPercent: value });
                    }
                  }}
                  disabled={!editedSettings.enabled}
                  className="pr-14"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-accent">
                  %{editedSettings.discountPercent}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Müşterilere sunulacak indirim yüzdesi</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="originalPrice">Orijinal Fiyat ({CURRENCY_SYMBOLS[editedSettings.baseCurrency]})</Label>
              <div className="relative">
                <Input
                  id="originalPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editedSettings.originalPrice}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    if (value >= 0) {
                      setEditedSettings({ ...editedSettings, originalPrice: value });
                    }
                  }}
                  disabled={!editedSettings.enabled}
                  className="pr-16"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-secondary">
                  {CURRENCY_SYMBOLS[editedSettings.baseCurrency]}{editedSettings.originalPrice.toFixed(2)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">İndirim öncesi normal fiyat</p>
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
                value={editedSettings.dailyShowLimit}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setEditedSettings({ ...editedSettings, dailyShowLimit: value });
                }}
                disabled={!editedSettings.enabled}
              />
              <p className="text-xs text-muted-foreground">Günde kaç kez gösterilecek (0 = sınırsız)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="showDelay">Gösterim Gecikmesi (ms)</Label>
              <Input
                id="showDelay"
                type="number"
                min="0"
                step="1000"
                value={editedSettings.showDelay}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setEditedSettings({ ...editedSettings, showDelay: value });
                }}
                disabled={!editedSettings.enabled}
              />
              <p className="text-xs text-muted-foreground">Sayfa yüklendikten kaç ms sonra gösterilecek</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timerDuration">Geri Sayım Süresi (saniye)</Label>
            <Input
              id="timerDuration"
              type="number"
              min="60"
              max="3600"
              value={editedSettings.timerDuration}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 600;
                if (value >= 60 && value <= 3600) {
                  setEditedSettings({ ...editedSettings, timerDuration: value });
                }
              }}
              disabled={!editedSettings.enabled}
            />
            <p className="text-xs text-muted-foreground">İndirim popup'ındaki geri sayım süresi (60-3600 sn)</p>
          </div>

          <Separator />

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-sm">📊 Özet Bilgi ({CURRENCY_SYMBOLS[editedSettings.baseCurrency]}):</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Orijinal Fiyat:</span>
                <span className="font-bold ml-2">{CURRENCY_SYMBOLS[editedSettings.baseCurrency]}{editedSettings.originalPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">İndirim:</span>
                <span className="font-bold ml-2 text-accent">%{editedSettings.discountPercent}</span>
              </div>
              <div>
                <span className="text-muted-foreground">İndirimli Fiyat:</span>
                <span className="font-bold ml-2 text-secondary">
                  {CURRENCY_SYMBOLS[editedSettings.baseCurrency]}{(editedSettings.originalPrice * (1 - editedSettings.discountPercent / 100)).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Tasarruf:</span>
                <span className="font-bold ml-2 text-green-600">
                  {CURRENCY_SYMBOLS[editedSettings.baseCurrency]}{(editedSettings.originalPrice * (editedSettings.discountPercent / 100)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              💡 İndirim popup'ı kullanıcılara otomatik olarak gösterilir ve dile göre otomatik kur dönüşümü yapılır
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} className="gap-2">
              <Save className="size-4" />
              Değişiklikleri Kaydet
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

// Website Content
function WebsiteContent() {
  return <WebsiteEditor />;
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