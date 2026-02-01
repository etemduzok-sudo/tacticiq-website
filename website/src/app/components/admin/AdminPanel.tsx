import { useState, useEffect, useContext, useMemo } from 'react';
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
  Megaphone,
  Flag,
  AlertCircle,
  Bot,
  Trophy,
  Check,
  Server,
  Play,
  Square,
  RotateCw,
  Wifi,
  WifiOff,
  Cpu,
  HardDrive,
  Zap
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
import { AdminDataContext, CURRENCY_SYMBOLS, LANGUAGE_CURRENCY_MAP, AdSettings, SectionSettings, SectionMediaItem, FeatureCategory, ChangeLogEntry, LegalDocument } from '@/contexts/AdminDataContext';
import { ChangePasswordModal } from '@/app/components/auth/ChangePasswordModal';
import { AdManagement } from '@/app/components/admin/AdManagement';
import { TeamManagement } from '@/app/components/admin/TeamManagement';
import { PressReleaseManagement } from '@/app/components/admin/PressReleaseManagement';
import { PartnerManagement } from '@/app/components/admin/PartnerManagement';
import { AdminTestBot } from '@/app/components/admin/AdminTestBot';

type MenuSection = 
  | 'dashboard' 
  | 'analytics' 
  | 'users' 
  | 'content'
  | 'ads'
  | 'team'
  | 'press'
  | 'partners'
  | 'partner-applications'
  | 'features'
  | 'pricing'
  | 'sections'
  | 'stats'
  | 'game'
  | 'waitlist'
  | 'legal'
  | 'settings' 
  | 'logs'
  | 'test'
  | 'website'
  | 'mobile-placeholder'
  | 'media'
  | 'system';

export function AdminPanel() {
  const { isAdmin, logout } = useAdmin();
  const [activeSection, setActiveSection] = useState<MenuSection>('dashboard');
  const [isMinimized, setIsMinimized] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  
  // Context'ten değişiklik takibi
  const contextData = useContext(AdminDataContext);
  const sessionChanges = contextData?.sessionChanges || [];
  const clearSessionChanges = contextData?.clearSessionChanges;
  const getSessionChangeSummary = contextData?.getSessionChangeSummary;
  const notificationSettings = contextData?.notificationSettings;

  // Çıkış işlemi - değişiklik varsa modal göster
  const handleExitClick = () => {
    if (sessionChanges.length > 0) {
      setShowExitModal(true);
    } else {
      logout();
    }
  };

  // Kaydet ve çık
  const handleSaveAndExit = async () => {
    // Email gönderme denemesi
    if (notificationSettings?.sendOnExit && notificationSettings?.notificationEmail && getSessionChangeSummary) {
      const summary = getSessionChangeSummary();
      // Email gönderme - mailto ile
      const subject = encodeURIComponent('TacticIQ Admin Panel - Değişiklik Özeti');
      const body = encodeURIComponent(summary);
      window.open(`mailto:${notificationSettings.notificationEmail}?subject=${subject}&body=${body}`, '_blank');
    }
    
    clearSessionChanges?.();
    setShowExitModal(false);
    logout();
  };

  // Kaydetmeden çık
  const handleExitWithoutSave = () => {
    clearSessionChanges?.();
    setShowExitModal(false);
    logout();
  };

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
                onClick={handleExitClick}
                title="Çıkış"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <Separator className="flex-shrink-0" />
        
        {/* Admin Mode Selector - Prominent Tabs */}
        <div className="p-2 border-b border-border">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-semibold transition-all ${
                !['mobile-placeholder'].includes(activeSection)
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'
              }`}
            >
              <Monitor className="size-4" />
              Web Admin
            </button>
            <button
              onClick={() => setActiveSection('mobile-placeholder')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-semibold transition-all ${
                ['mobile-placeholder'].includes(activeSection)
                  ? 'bg-secondary text-secondary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'
              }`}
            >
              <Smartphone className="size-4" />
              Mobil Admin
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Web Admin Section - Only show when not in mobile admin */}
          {!['mobile-placeholder'].includes(activeSection) && (
          <div className="px-2 py-2 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="size-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Web Yönetimi</span>
            </div>
            <div className="space-y-1 ml-6">
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
                icon={Flag}
                label="Ortaklık Başvuruları"
                active={activeSection === 'partner-applications'}
                onClick={() => setActiveSection('partner-applications')}
              />
              <MenuButton
                icon={Gamepad2}
                label="Kategori Yönetimi"
                active={activeSection === 'features'}
                onClick={() => setActiveSection('features')}
              />
              <MenuButton
                icon={Image}
                label="Medya Yönetimi"
                active={activeSection === 'media'}
                onClick={() => setActiveSection('media')}
              />
              <MenuButton
                icon={Mail}
                label="Bekleme Listesi"
                active={activeSection === 'waitlist'}
                onClick={() => setActiveSection('waitlist')}
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
                icon={TrendingUp}
                label="İstatistikler"
                active={activeSection === 'stats'}
                onClick={() => setActiveSection('stats')}
              />
              <MenuButton
                icon={Gamepad2}
                label="Oyun Sistemi"
                active={activeSection === 'game'}
                onClick={() => setActiveSection('game')}
              />
              <MenuButton
                icon={FileText}
                label="Yasal Belgeler"
                active={activeSection === 'legal'}
                onClick={() => setActiveSection('legal')}
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
          </div>
          )}

          {/* Mobil Admin Section - Only show when in mobile admin mode */}
          {['mobile-placeholder'].includes(activeSection) && (
          <div className="px-2 py-2 bg-secondary/10 rounded-lg border border-secondary/30">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="size-4 text-secondary" />
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Mobil Yönetimi</span>
            </div>
            <div className="space-y-1 ml-6">
              <p className="text-xs text-muted-foreground py-2">Mobil uygulama yönetim araçları burada görünecek.</p>
            </div>
          </div>
          )}

          {/* Ortak Araçlar - Her iki modda da görünür */}
          <div className="px-2 py-2 mt-2 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-lg border border-accent/30">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="size-4 text-accent" />
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">Ortak Araçlar</span>
            </div>
            <div className="space-y-1 ml-6">
              <MenuButton
                icon={Bot}
                label="Test Bot"
                active={activeSection === 'test'}
                onClick={() => setActiveSection('test')}
                badge={true}
              />
              <MenuButton
                icon={Server}
                label="Sistem İzleme"
                active={activeSection === 'system'}
                onClick={() => setActiveSection('system')}
                badge={true}
              />
            </div>
          </div>
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
            {activeSection === 'partner-applications' && <PartnerApplicationsContent />}
            {activeSection === 'features' && <FeatureCategoriesContent />}
            {activeSection === 'media' && <MediaContent />}
            {activeSection === 'waitlist' && <WaitlistContent />}
            {activeSection === 'pricing' && <PricingContent />}
            {activeSection === 'sections' && <SectionsContent />}
            {activeSection === 'stats' && <StatsContent />}
            {activeSection === 'game' && <GameContent />}
            {activeSection === 'legal' && <LegalDocumentsContent />}
            {activeSection === 'settings' && <SettingsContent />}
            {activeSection === 'logs' && <LogsContent />}
            {activeSection === 'test' && <AdminTestBot />}
            {activeSection === 'mobile-placeholder' && <MobilePlaceholderContent />}
            {activeSection === 'system' && <SystemMonitoringContent />}
          </div>
        </div>
      </Card>

      {/* Çıkış Onay Modalı */}
      <Dialog open={showExitModal} onOpenChange={setShowExitModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="size-5 text-accent" />
              Çıkış Yapmadan Önce
            </DialogTitle>
            <DialogDescription>
              Bu oturumda {sessionChanges.length} değişiklik yaptınız
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Değişiklik Listesi */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {Object.entries(
                sessionChanges.reduce((acc, change) => {
                  if (!acc[change.category]) acc[change.category] = [];
                  acc[change.category].push(change);
                  return acc;
                }, {} as Record<string, ChangeLogEntry[]>)
              ).map(([category, changes]) => (
                <div key={category} className="bg-muted/30 rounded-lg p-3">
                  <div className="font-semibold text-sm flex items-center gap-2 mb-2">
                    📁 {category}
                    <Badge variant="secondary" className="text-xs">{changes.length}</Badge>
                  </div>
                  <ul className="space-y-1">
                    {changes.map((change, index) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span>
                          {change.action === 'create' ? '➕' : change.action === 'update' ? '✏️' : '🗑️'}
                        </span>
                        <span>{change.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Email Bildirimi */}
            {notificationSettings?.sendOnExit && (
              <div className="bg-accent/10 rounded-lg p-3 text-sm">
                <p className="flex items-center gap-2">
                  <Mail className="size-4" />
                  <span>Değişiklik özeti <strong>{notificationSettings.notificationEmail}</strong> adresine gönderilecek</span>
                </p>
              </div>
            )}

            {/* Butonlar */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowExitModal(false)}>
                Geri Dön
              </Button>
              <Button variant="secondary" onClick={handleExitWithoutSave}>
                Kaydetmeden Çık
              </Button>
              <Button onClick={handleSaveAndExit} className="gap-2">
                <Save className="size-4" />
                Kaydet & Çık
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
          <SettingToggle 
            label="📰 Newsletter" 
            description="Newsletter abonelik bölümünü göster"
            enabled={editedSections.newsletter?.enabled ?? true}
            onToggle={() => handleToggleSection('newsletter')}
          />
          <SettingToggle 
            label="👤 Profil & Rozetler" 
            description="Giriş yapan kullanıcılar için profil bölümünü göster (#profile). Header'da Profil linki görünür."
            enabled={editedSections.profile?.enabled ?? true}
            onToggle={() => handleToggleSection('profile')}
          />
          <div className="ml-6 space-y-2 border-l-2 border-muted pl-4">
            <SettingToggle 
              label="Rozetler Sekmesi" 
              description="Profil içinde Rozetlerim sekmesini göster (25 rozet - Bronz, Gümüş, Altın, Platin, Elmas)"
              enabled={editedSections.profile?.showBadges ?? true}
              onToggle={() => handleToggleSection('profile', 'showBadges')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Footer Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🦶 Footer Ayarları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SettingToggle 
            label="Footer" 
            description="Sayfa altındaki footer bölümünü göster"
            enabled={editedSections.footer?.enabled ?? true}
            onToggle={() => handleToggleSection('footer')}
          />
          <div className="ml-6 space-y-2 border-l-2 border-muted pl-4">
            <SettingToggle 
              label="Ziyaretçi Sayacı" 
              description="Footer'da ziyaretçi istatistiklerini göster (Toplam Ziyaretçi, Şu An Aktif, Bugün, Bu Ay)"
              enabled={editedSections.footer?.showVisitorCounter ?? true}
              onToggle={() => handleToggleSection('footer', 'showVisitorCounter')}
            />
            <SettingToggle 
              label="Sosyal Medya Linkleri" 
              description="Sosyal medya ikonlarını ve linklerini göster"
              enabled={editedSections.footer?.showSocialLinks ?? true}
              onToggle={() => handleToggleSection('footer', 'showSocialLinks')}
            />
            <SettingToggle 
              label="Uygulama İndirme Butonları" 
              description="App Store ve Google Play butonlarını göster"
              enabled={editedSections.footer?.showAppDownloadButtons ?? true}
              onToggle={() => handleToggleSection('footer', 'showAppDownloadButtons')}
            />
          </div>
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
  onClick,
  badge
}: { 
  icon: any; 
  label: string; 
  active: boolean; 
  onClick: () => void;
  badge?: boolean;
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
      <Icon className={`size-4 ${badge ? 'text-red-500' : ''}`} />
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="size-2 bg-red-500 rounded-full animate-pulse" />
      )}
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
// Store Analytics Data Type
interface StoreAnalytics {
  platform: 'google_play' | 'app_store';
  connected: boolean;
  lastSync: string | null;
  totalDownloads: number;
  totalRevenue: number;
  activeInstalls: number;
  rating: number;
  reviews: number;
  countries: { country: string; countryCode: string; downloads: number; revenue: number; percentage: number }[];
}

// Default Store Analytics
const DEFAULT_STORE_ANALYTICS: Record<string, StoreAnalytics> = {
  google_play: {
    platform: 'google_play',
    connected: false,
    lastSync: null,
    totalDownloads: 0,
    totalRevenue: 0,
    activeInstalls: 0,
    rating: 0,
    reviews: 0,
    countries: [],
  },
  app_store: {
    platform: 'app_store',
    connected: false,
    lastSync: null,
    totalDownloads: 0,
    totalRevenue: 0,
    activeInstalls: 0,
    rating: 0,
    reviews: 0,
    countries: [],
  },
};

// Country Flag Map
const COUNTRY_FLAGS: Record<string, string> = {
  'TR': '🇹🇷', 'US': '🇺🇸', 'DE': '🇩🇪', 'GB': '🇬🇧', 'FR': '🇫🇷',
  'ES': '🇪🇸', 'IT': '🇮🇹', 'NL': '🇳🇱', 'BE': '🇧🇪', 'AT': '🇦🇹',
  'CH': '🇨🇭', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮',
  'PL': '🇵🇱', 'CZ': '🇨🇿', 'RU': '🇷🇺', 'UA': '🇺🇦', 'BR': '🇧🇷',
  'MX': '🇲🇽', 'AR': '🇦🇷', 'CA': '🇨🇦', 'AU': '🇦🇺', 'JP': '🇯🇵',
  'KR': '🇰🇷', 'CN': '🇨🇳', 'IN': '🇮🇳', 'SA': '🇸🇦', 'AE': '🇦🇪',
  'EG': '🇪🇬', 'ZA': '🇿🇦', 'NG': '🇳🇬', 'KE': '🇰🇪', 'ID': '🇮🇩',
  'TH': '🇹🇭', 'VN': '🇻🇳', 'PH': '🇵🇭', 'MY': '🇲🇾', 'SG': '🇸🇬',
};

function AnalyticsContent() {
  const contextData = useContext(AdminDataContext);
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'stores' | 'countries'>('overview');
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<'google_play' | 'app_store' | null>(null);

  // Store analytics state (localStorage persistence)
  const [storeAnalytics, setStoreAnalytics] = useState<Record<string, StoreAnalytics>>(() => {
    const saved = localStorage.getItem('admin_store_analytics');
    if (saved) {
      try {
        return { ...DEFAULT_STORE_ANALYTICS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_STORE_ANALYTICS;
      }
    }
    return DEFAULT_STORE_ANALYTICS;
  });

  // API Credentials state
  const [apiCredentials, setApiCredentials] = useState({
    google_play: {
      serviceAccountJson: '',
      packageName: 'app.tacticiq.mobile',
    },
    app_store: {
      keyId: '',
      issuerId: '',
      privateKey: '',
      appId: '',
    },
  });

  const stats = contextData?.stats;
  const updateStats = contextData?.updateStats;
  const geoColors = ['bg-secondary', 'bg-accent', 'bg-primary', 'bg-muted', 'bg-muted-foreground'];
  const hourColors = ['bg-muted', 'bg-accent', 'bg-secondary', 'bg-primary'];
  const segmentColors = ['bg-muted', 'bg-secondary', 'bg-accent'];

  // Merge country data from all sources
  const mergedCountries = useMemo(() => {
    const countryMap = new Map<string, { country: string; countryCode: string; downloads: number; revenue: number; googleDownloads: number; appleDownloads: number }>();
    
    // Add Google Play countries
    storeAnalytics.google_play.countries.forEach(c => {
      const existing = countryMap.get(c.countryCode) || { country: c.country, countryCode: c.countryCode, downloads: 0, revenue: 0, googleDownloads: 0, appleDownloads: 0 };
      existing.googleDownloads += c.downloads;
      existing.downloads += c.downloads;
      existing.revenue += c.revenue;
      countryMap.set(c.countryCode, existing);
    });
    
    // Add App Store countries
    storeAnalytics.app_store.countries.forEach(c => {
      const existing = countryMap.get(c.countryCode) || { country: c.country, countryCode: c.countryCode, downloads: 0, revenue: 0, googleDownloads: 0, appleDownloads: 0 };
      existing.appleDownloads += c.downloads;
      existing.downloads += c.downloads;
      existing.revenue += c.revenue;
      countryMap.set(c.countryCode, existing);
    });
    
    return Array.from(countryMap.values()).sort((a, b) => b.downloads - a.downloads);
  }, [storeAnalytics]);

  // Save store analytics
  const saveStoreAnalytics = (data: Record<string, StoreAnalytics>) => {
    setStoreAnalytics(data);
    localStorage.setItem('admin_store_analytics', JSON.stringify(data));
  };

  // Simulate connecting to store
  const handleConnectStore = (platform: 'google_play' | 'app_store') => {
    toast.loading(`${platform === 'google_play' ? 'Google Play' : 'App Store'} bağlanıyor...`);
    
    // Simulate API connection
    setTimeout(() => {
      const sampleCountries = [
        { country: 'Türkiye', countryCode: 'TR', downloads: Math.floor(Math.random() * 5000) + 1000, revenue: Math.floor(Math.random() * 50000) + 10000, percentage: 45 },
        { country: 'Almanya', countryCode: 'DE', downloads: Math.floor(Math.random() * 2000) + 500, revenue: Math.floor(Math.random() * 30000) + 5000, percentage: 20 },
        { country: 'Amerika', countryCode: 'US', downloads: Math.floor(Math.random() * 1500) + 300, revenue: Math.floor(Math.random() * 25000) + 3000, percentage: 15 },
        { country: 'İngiltere', countryCode: 'GB', downloads: Math.floor(Math.random() * 1000) + 200, revenue: Math.floor(Math.random() * 15000) + 2000, percentage: 10 },
        { country: 'Fransa', countryCode: 'FR', downloads: Math.floor(Math.random() * 500) + 100, revenue: Math.floor(Math.random() * 8000) + 1000, percentage: 5 },
      ];
      
      const totalDownloads = sampleCountries.reduce((sum, c) => sum + c.downloads, 0);
      const totalRevenue = sampleCountries.reduce((sum, c) => sum + c.revenue, 0);
      
      const updated = {
        ...storeAnalytics,
        [platform]: {
          ...storeAnalytics[platform],
          connected: true,
          lastSync: new Date().toISOString(),
          totalDownloads,
          totalRevenue,
          activeInstalls: Math.floor(totalDownloads * 0.7),
          rating: 4.5 + Math.random() * 0.4,
          reviews: Math.floor(totalDownloads * 0.05),
          countries: sampleCountries,
        },
      };
      
      saveStoreAnalytics(updated);
      toast.dismiss();
      toast.success(`${platform === 'google_play' ? 'Google Play' : 'App Store'} başarıyla bağlandı!`);
      setShowConnectDialog(false);
    }, 2000);
  };

  // Sync store data
  const handleSyncStore = (platform: 'google_play' | 'app_store') => {
    if (!storeAnalytics[platform].connected) {
      toast.error('Önce mağazayı bağlamanız gerekiyor');
      return;
    }
    
    toast.loading('Veriler senkronize ediliyor...');
    
    setTimeout(() => {
      // Update with new random data
      const currentData = storeAnalytics[platform];
      const updatedCountries = currentData.countries.map(c => ({
        ...c,
        downloads: c.downloads + Math.floor(Math.random() * 100),
        revenue: c.revenue + Math.floor(Math.random() * 1000),
      }));
      
      const totalDownloads = updatedCountries.reduce((sum, c) => sum + c.downloads, 0);
      const totalRevenue = updatedCountries.reduce((sum, c) => sum + c.revenue, 0);
      
      const updated = {
        ...storeAnalytics,
        [platform]: {
          ...currentData,
          lastSync: new Date().toISOString(),
          totalDownloads,
          totalRevenue,
          activeInstalls: Math.floor(totalDownloads * 0.7),
          countries: updatedCountries,
        },
      };
      
      saveStoreAnalytics(updated);
      toast.dismiss();
      toast.success('Veriler güncellendi!');
    }, 1500);
  };

  if (!contextData || !stats) {
    return <div className="p-4 text-center">Analytics yükleniyor...</div>;
  }

  const totalDownloads = storeAnalytics.google_play.totalDownloads + storeAnalytics.app_store.totalDownloads;
  const totalRevenue = storeAnalytics.google_play.totalRevenue + storeAnalytics.app_store.totalRevenue;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Analytics & Mağaza Verileri</h2>
        <p className="text-sm text-muted-foreground">Google Play ve App Store verileri ile detaylı analizler</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-muted rounded-lg p-1 gap-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'overview' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          📊 Genel Bakış
        </button>
        <button
          onClick={() => setActiveTab('stores')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'stores' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🏪 Mağaza Entegrasyonu
        </button>
        <button
          onClick={() => setActiveTab('countries')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'countries' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🌍 Ülke Bazlı Veriler
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Time Period Selector */}
          <div className="flex gap-2">
            {(['today', 'week', 'month', 'year'] as const).map(period => (
              <Button 
                key={period}
                variant={timePeriod === period ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimePeriod(period)}
              >
                {period === 'today' ? 'Bugün' : period === 'week' ? 'Bu Hafta' : period === 'month' ? 'Bu Ay' : 'Bu Yıl'}
              </Button>
            ))}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Download className="size-5 text-secondary" />
                <span className="text-sm text-muted-foreground">Toplam İndirme</span>
              </div>
              <div className="text-2xl font-bold">{totalDownloads.toLocaleString()}</div>
              <div className="text-xs text-green-600 mt-1">+{Math.floor(Math.random() * 100 + 50)} bugün</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="size-5 text-accent" />
                <span className="text-sm text-muted-foreground">Toplam Gelir</span>
              </div>
              <div className="text-2xl font-bold">₺{totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-green-600 mt-1">+₺{Math.floor(Math.random() * 5000 + 1000)} bugün</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="size-5 text-green-600" />
                <span className="text-sm text-muted-foreground">Google Play</span>
              </div>
              <div className="text-2xl font-bold">{storeAnalytics.google_play.totalDownloads.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs">⭐ {storeAnalytics.google_play.rating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({storeAnalytics.google_play.reviews} yorum)</span>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="size-5 text-gray-600" />
                <span className="text-sm text-muted-foreground">App Store</span>
              </div>
              <div className="text-2xl font-bold">{storeAnalytics.app_store.totalDownloads.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs">⭐ {storeAnalytics.app_store.rating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({storeAnalytics.app_store.reviews} yorum)</span>
              </div>
            </Card>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="size-4" />
                  Coğrafi Dağılım (Otomatik)
                </CardTitle>
                <CardDescription>Mağaza verilerinden otomatik hesaplanır</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {mergedCountries.length > 0 ? (
                  mergedCountries.slice(0, 5).map((item, index) => (
                    <div key={item.countryCode} className="flex items-center gap-2">
                      <span className="text-lg">{COUNTRY_FLAGS[item.countryCode] || '🌍'}</span>
                      <ProgressBar 
                        label={`${item.country} (${item.downloads.toLocaleString()})`} 
                        value={Math.round((item.downloads / (mergedCountries[0]?.downloads || 1)) * 100)} 
                        color={geoColors[index % geoColors.length]} 
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Mağaza bağlantısı kurulduğunda ülke verileri otomatik görünecek
                  </p>
                )}
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
        </>
      )}

      {/* Stores Tab */}
      {activeTab === 'stores' && (
        <div className="space-y-6">
          {/* Google Play Card */}
          <Card className={`border-2 ${storeAnalytics.google_play.connected ? 'border-green-500/50' : 'border-muted'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                    <span className="text-white text-xl">▶</span>
                  </div>
                  <div>
                    <span className="text-lg">Google Play Console</span>
                    <div className="flex items-center gap-2 mt-1">
                      {storeAnalytics.google_play.connected ? (
                        <Badge variant="default" className="bg-green-600">Bağlı</Badge>
                      ) : (
                        <Badge variant="secondary">Bağlı Değil</Badge>
                      )}
                      {storeAnalytics.google_play.lastSync && (
                        <span className="text-xs text-muted-foreground">
                          Son güncelleme: {new Date(storeAnalytics.google_play.lastSync).toLocaleString('tr-TR')}
                        </span>
                      )}
                    </div>
                  </div>
                </CardTitle>
                <div className="flex gap-2">
                  {storeAnalytics.google_play.connected && (
                    <Button variant="outline" size="sm" onClick={() => handleSyncStore('google_play')}>
                      <Activity className="size-4 mr-1" />
                      Senkronize Et
                    </Button>
                  )}
                  <Button 
                    variant={storeAnalytics.google_play.connected ? 'secondary' : 'default'}
                    size="sm" 
                    onClick={() => {
                      setConnectingPlatform('google_play');
                      setShowConnectDialog(true);
                    }}
                  >
                    {storeAnalytics.google_play.connected ? 'Ayarlar' : 'Bağlan'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {storeAnalytics.google_play.connected && (
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{storeAnalytics.google_play.totalDownloads.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Toplam İndirme</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-accent">₺{storeAnalytics.google_play.totalRevenue.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Toplam Gelir</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{storeAnalytics.google_play.activeInstalls.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Aktif Yükleme</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">⭐ {storeAnalytics.google_play.rating.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">{storeAnalytics.google_play.reviews} Yorum</div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* App Store Card */}
          <Card className={`border-2 ${storeAnalytics.app_store.connected ? 'border-blue-500/50' : 'border-muted'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-xl"></span>
                  </div>
                  <div>
                    <span className="text-lg">App Store Connect</span>
                    <div className="flex items-center gap-2 mt-1">
                      {storeAnalytics.app_store.connected ? (
                        <Badge variant="default" className="bg-blue-600">Bağlı</Badge>
                      ) : (
                        <Badge variant="secondary">Bağlı Değil</Badge>
                      )}
                      {storeAnalytics.app_store.lastSync && (
                        <span className="text-xs text-muted-foreground">
                          Son güncelleme: {new Date(storeAnalytics.app_store.lastSync).toLocaleString('tr-TR')}
                        </span>
                      )}
                    </div>
                  </div>
                </CardTitle>
                <div className="flex gap-2">
                  {storeAnalytics.app_store.connected && (
                    <Button variant="outline" size="sm" onClick={() => handleSyncStore('app_store')}>
                      <Activity className="size-4 mr-1" />
                      Senkronize Et
                    </Button>
                  )}
                  <Button 
                    variant={storeAnalytics.app_store.connected ? 'secondary' : 'default'}
                    size="sm" 
                    onClick={() => {
                      setConnectingPlatform('app_store');
                      setShowConnectDialog(true);
                    }}
                  >
                    {storeAnalytics.app_store.connected ? 'Ayarlar' : 'Bağlan'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {storeAnalytics.app_store.connected && (
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{storeAnalytics.app_store.totalDownloads.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Toplam İndirme</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-accent">₺{storeAnalytics.app_store.totalRevenue.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Toplam Gelir</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{storeAnalytics.app_store.activeInstalls.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Aktif Yükleme</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">⭐ {storeAnalytics.app_store.rating.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">{storeAnalytics.app_store.reviews} Yorum</div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Info Card */}
          <Card className="bg-accent/10 border-accent/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 text-accent mt-0.5" />
                <div>
                  <h4 className="font-semibold text-accent">Mağaza API Entegrasyonu</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Google Play Console ve App Store Connect API'larını bağladığınızda, indirme sayıları, gelir verileri ve ülke bazlı istatistikler otomatik olarak senkronize edilecektir. Bu veriler "Ülke Bazlı Veriler" sekmesinde otomatik olarak görünecektir.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Countries Tab */}
      {activeTab === 'countries' && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{mergedCountries.length}</div>
              <div className="text-sm text-muted-foreground">Aktif Ülke</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-secondary">{totalDownloads.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Toplam İndirme</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-accent">₺{totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Toplam Gelir</div>
            </Card>
          </div>

          {/* Countries Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="size-5" />
                Ülke Bazlı İndirme ve Satın Alma Verileri
              </CardTitle>
              <CardDescription>
                Bu veriler Google Play ve App Store'dan otomatik olarak çekilir
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mergedCountries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Ülke</th>
                        <th className="text-center p-3 font-semibold">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-green-600">▶</span> Google Play
                          </div>
                        </th>
                        <th className="text-center p-3 font-semibold">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-blue-600"></span> App Store
                          </div>
                        </th>
                        <th className="text-center p-3 font-semibold">Toplam İndirme</th>
                        <th className="text-center p-3 font-semibold">Toplam Gelir</th>
                        <th className="text-center p-3 font-semibold">Oran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mergedCountries.map((country, index) => (
                        <tr key={country.countryCode} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{COUNTRY_FLAGS[country.countryCode] || '🌍'}</span>
                              <span className="font-medium">{country.country}</span>
                            </div>
                          </td>
                          <td className="text-center p-3 text-green-600 font-medium">
                            {country.googleDownloads.toLocaleString()}
                          </td>
                          <td className="text-center p-3 text-blue-600 font-medium">
                            {country.appleDownloads.toLocaleString()}
                          </td>
                          <td className="text-center p-3 font-bold">
                            {country.downloads.toLocaleString()}
                          </td>
                          <td className="text-center p-3 text-accent font-medium">
                            ₺{country.revenue.toLocaleString()}
                          </td>
                          <td className="text-center p-3">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-secondary rounded-full" 
                                  style={{ width: `${Math.round((country.downloads / (mergedCountries[0]?.downloads || 1)) * 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {Math.round((country.downloads / totalDownloads) * 100)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Globe className="size-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Henüz ülke verisi yok</h3>
                  <p className="text-sm max-w-md mx-auto">
                    Google Play Console veya App Store Connect'i bağladığınızda, indirme ve satın alma yapılan ülkeler burada otomatik olarak listelenecektir.
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={() => setActiveTab('stores')}
                  >
                    Mağaza Bağla
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Connect Store Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {connectingPlatform === 'google_play' ? (
                <>
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                    <span className="text-white">▶</span>
                  </div>
                  Google Play Console Bağlantısı
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white"></span>
                  </div>
                  App Store Connect Bağlantısı
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              API erişim bilgilerinizi girerek mağaza verilerinizi otomatik senkronize edin
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {connectingPlatform === 'google_play' ? (
              <>
                <div className="space-y-2">
                  <Label>Paket Adı (Package Name)</Label>
                  <Input
                    value={apiCredentials.google_play.packageName}
                    onChange={(e) => setApiCredentials({
                      ...apiCredentials,
                      google_play: { ...apiCredentials.google_play, packageName: e.target.value }
                    })}
                    placeholder="app.tacticiq.mobile"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Service Account JSON</Label>
                  <Textarea
                    value={apiCredentials.google_play.serviceAccountJson}
                    onChange={(e) => setApiCredentials({
                      ...apiCredentials,
                      google_play: { ...apiCredentials.google_play, serviceAccountJson: e.target.value }
                    })}
                    placeholder="Google Cloud Console'dan aldığınız JSON anahtarını buraya yapıştırın..."
                    className="font-mono text-xs min-h-[150px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Google Cloud Console → IAM & Admin → Service Accounts bölümünden JSON key oluşturun
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Key ID</Label>
                    <Input
                      value={apiCredentials.app_store.keyId}
                      onChange={(e) => setApiCredentials({
                        ...apiCredentials,
                        app_store: { ...apiCredentials.app_store, keyId: e.target.value }
                      })}
                      placeholder="XXXXXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Issuer ID</Label>
                    <Input
                      value={apiCredentials.app_store.issuerId}
                      onChange={(e) => setApiCredentials({
                        ...apiCredentials,
                        app_store: { ...apiCredentials.app_store, issuerId: e.target.value }
                      })}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>App ID</Label>
                  <Input
                    value={apiCredentials.app_store.appId}
                    onChange={(e) => setApiCredentials({
                      ...apiCredentials,
                      app_store: { ...apiCredentials.app_store, appId: e.target.value }
                    })}
                    placeholder="123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Private Key (.p8)</Label>
                  <Textarea
                    value={apiCredentials.app_store.privateKey}
                    onChange={(e) => setApiCredentials({
                      ...apiCredentials,
                      app_store: { ...apiCredentials.app_store, privateKey: e.target.value }
                    })}
                    placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                    className="font-mono text-xs min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    App Store Connect → Users and Access → Keys bölümünden API key oluşturun
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
              İptal
            </Button>
            <Button onClick={() => connectingPlatform && handleConnectStore(connectingPlatform)}>
              Bağlan ve Senkronize Et
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
                placeholder=""
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-email">E-posta</Label>
              <Input
                id="new-user-email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder=""
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
  const [contentInitialized, setContentInitialized] = useState(false);
  
  // websiteContent değiştiğinde editedContent'i güncelle - sadece ilk yüklemede
  useEffect(() => {
    if (websiteContent && !contentInitialized) {
      setEditedContent(websiteContent);
      setContentInitialized(true);
    }
  }, [websiteContent, contentInitialized]);

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

// Feature Categories Content - 15 Tahmin Kategorisi Yönetimi
// Oyuncu Kategorileri (8 adet - varsayılan)
const DEFAULT_PLAYER_CATEGORIES = [
  { id: 'goalscorer', key: 'goalscorer', title: 'Gol Atan Oyuncu', description: 'Maçta gol atacak oyuncuları tahmin edin', emoji: '⚽', enabled: true, order: 1 },
  { id: 'assist', key: 'assist', title: 'Asist Yapan Oyuncu', description: 'Maçta asist yapacak oyuncuları tahmin edin', emoji: '🅰️', enabled: true, order: 2 },
  { id: 'yellow_card', key: 'yellow_card', title: 'Sarı Kart Görecek Oyuncu', description: 'Sarı kart görecek oyuncuları tahmin edin', emoji: '🟨', enabled: true, order: 3 },
  { id: 'red_card', key: 'red_card', title: 'Kırmızı Kart Görecek Oyuncu', description: 'Kırmızı kart görecek oyuncuları tahmin edin', emoji: '🟥', enabled: true, order: 4 },
  { id: 'motm', key: 'motm', title: 'Maçın Adamı', description: 'Maçın en iyi oyuncusunu tahmin edin', emoji: '⭐', enabled: true, order: 5 },
  { id: 'first_goal', key: 'first_goal', title: 'İlk Golü Atan', description: 'Maçın ilk golünü atacak oyuncuyu tahmin edin', emoji: '🥇', enabled: true, order: 6 },
  { id: 'substituted', key: 'substituted', title: 'Oyundan Çıkacak Oyuncu', description: 'Oyundan çıkacak/değiştirilecek oyuncuları tahmin edin', emoji: '🔄', enabled: true, order: 7 },
  { id: 'shot_on_target', key: 'shot_on_target', title: 'Kaleyi Bulan Şut', description: 'En fazla kaleyi bulan şut yapacak oyuncuyu tahmin edin', emoji: '🎯', enabled: true, order: 8 },
];

function FeatureCategoriesContent() {
  const contextData = useContext(AdminDataContext);
  const featureCategories = contextData?.featureCategories || [];
  const addFeatureCategory = contextData?.addFeatureCategory;
  const updateFeatureCategory = contextData?.updateFeatureCategory;
  const deleteFeatureCategory = contextData?.deleteFeatureCategory;
  const reorderFeatureCategories = contextData?.reorderFeatureCategories;

  const [activeTab, setActiveTab] = useState<'prediction' | 'player'>('prediction');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FeatureCategory | null>(null);
  const [newCategory, setNewCategory] = useState({
    key: '',
    title: '',
    description: '',
    emoji: '⚽',
    featured: false,
    enabled: true,
    order: featureCategories.length + 1,
  });

  // Oyuncu kategorileri state (localStorage'dan yükle)
  const [playerCategories, setPlayerCategories] = useState(() => {
    const saved = localStorage.getItem('admin_player_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_PLAYER_CATEGORIES;
      }
    }
    return DEFAULT_PLAYER_CATEGORIES;
  });

  const [editingPlayerCategory, setEditingPlayerCategory] = useState<typeof DEFAULT_PLAYER_CATEGORIES[0] | null>(null);

  // Oyuncu kategorisini güncelle
  const handleUpdatePlayerCategory = (id: string, updates: Partial<typeof DEFAULT_PLAYER_CATEGORIES[0]>) => {
    const updated = playerCategories.map((cat: typeof DEFAULT_PLAYER_CATEGORIES[0]) => 
      cat.id === id ? { ...cat, ...updates } : cat
    );
    setPlayerCategories(updated);
    localStorage.setItem('admin_player_categories', JSON.stringify(updated));
    toast.success('Oyuncu kategorisi güncellendi');
  };

  // Emoji seçenekleri
  const emojiOptions = ['⚽', '⏱️', '🟨', '🟥', '🎯', '🏃‍♂️', '🧠', '🧮', '⏰', '📊', '🚩', '⚡', '🔥', '💎', '⭐', '🎮', '📈', '🏆', '🅰️', '🥇', '🔄'];

  const handleAddCategory = () => {
    if (!newCategory.key || !newCategory.title) {
      toast.error('Anahtar ve başlık zorunludur');
      return;
    }
    
    // Key benzersiz mi kontrol et
    if (featureCategories.some(c => c.key === newCategory.key)) {
      toast.error('Bu anahtar zaten kullanılıyor');
      return;
    }

    if (addFeatureCategory) {
      addFeatureCategory({
        ...newCategory,
        order: featureCategories.length + 1,
      });
      toast.success('Kategori eklendi');
      setShowAddDialog(false);
      setNewCategory({
        key: '',
        title: '',
        description: '',
        emoji: '⚽',
        featured: false,
        enabled: true,
        order: featureCategories.length + 2,
      });
    }
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;
    
    if (updateFeatureCategory) {
      updateFeatureCategory(editingCategory.id, {
        key: editingCategory.key,
        title: editingCategory.title,
        description: editingCategory.description,
        emoji: editingCategory.emoji,
        featured: editingCategory.featured,
        enabled: editingCategory.enabled,
        order: editingCategory.order,
      });
      toast.success('Kategori güncellendi');
      setEditingCategory(null);
    }
  };

  const handleDeleteCategory = (id: string, title: string) => {
    if (confirm(`"${title}" kategorisini silmek istediğinize emin misiniz?`)) {
      if (deleteFeatureCategory) {
        deleteFeatureCategory(id);
        toast.success('Kategori silindi');
      }
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0 || !reorderFeatureCategories) return;
    const newOrder = [...featureCategories];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    reorderFeatureCategories(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === featureCategories.length - 1 || !reorderFeatureCategories) return;
    const newOrder = [...featureCategories];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    reorderFeatureCategories(newOrder);
  };

  const sortedCategories = [...featureCategories].sort((a, b) => a.order - b.order);
  const activeCount = featureCategories.filter(c => c.enabled).length;
  const featuredCount = featureCategories.filter(c => c.featured && c.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🎯 Kategori Yönetimi
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tahmin ve oyuncu kategorilerini yönetin
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-muted rounded-lg p-1 gap-1">
        <button
          onClick={() => setActiveTab('prediction')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'prediction'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🎯 Tahmin Kategorileri ({featureCategories.length})
        </button>
        <button
          onClick={() => setActiveTab('player')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'player'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          👤 Oyuncu Kategorileri ({playerCategories.length})
        </button>
      </div>

      {/* Tahmin Kategorileri Tab */}
      {activeTab === 'prediction' && (
        <>
          <div className="flex justify-end">
            <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
              <Plus className="size-4" />
              Yeni Kategori
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{featureCategories.length}</div>
              <div className="text-sm text-muted-foreground">Toplam Kategori</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{activeCount}</div>
              <div className="text-sm text-muted-foreground">Aktif Kategori</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-amber-600">{featuredCount}</div>
              <div className="text-sm text-muted-foreground">Öne Çıkan</div>
            </Card>
          </div>

          {/* Categories List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tahmin Kategorileri</CardTitle>
              <CardDescription>Sıralamaları değiştirmek için yukarı/aşağı oklarını kullanın</CardDescription>
            </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedCategories.map((category, index) => (
              <div 
                key={category.id} 
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  category.enabled ? 'bg-card' : 'bg-muted/50 opacity-60'
                } ${category.featured ? 'border-accent/50' : 'border-border'}`}
              >
                {/* Order Buttons */}
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ChevronRight className="size-3 -rotate-90" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === sortedCategories.length - 1}
                  >
                    <ChevronRight className="size-3 rotate-90" />
                  </Button>
                </div>

                {/* Emoji */}
                <div className="text-3xl w-12 text-center">{category.emoji}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{category.title}</span>
                    {category.featured && (
                      <Badge variant="secondary" className="text-xs bg-accent/20 text-accent">
                        ⭐ Öne Çıkan
                      </Badge>
                    )}
                    {!category.enabled && (
                      <Badge variant="outline" className="text-xs">Pasif</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{category.description}</p>
                  <p className="text-xs text-muted-foreground/70">Anahtar: {category.key}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingCategory(category)}
                  >
                    <Edit2 className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCategory(category.id, category.title)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}

            {featureCategories.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Henüz kategori eklenmemiş
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Kategori Ekle</DialogTitle>
            <DialogDescription>
              Yeni bir tahmin kategorisi ekleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Anahtar (key) *</Label>
              <Input
                value={newCategory.key}
                onChange={(e) => setNewCategory({ ...newCategory, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="ornek_kategori"
              />
              <p className="text-xs text-muted-foreground">Benzersiz anahtar, küçük harf ve alt çizgi kullanın</p>
            </div>

            <div className="space-y-2">
              <Label>Başlık *</Label>
              <Input
                value={newCategory.title}
                onChange={(e) => setNewCategory({ ...newCategory, title: e.target.value })}
                placeholder="Örnek Kategori"
              />
            </div>

            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Kategori açıklaması..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Emoji</Label>
              <div className="flex flex-wrap gap-2">
                {emojiOptions.map((emoji) => (
                  <Button
                    key={emoji}
                    type="button"
                    variant={newCategory.emoji === emoji ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewCategory({ ...newCategory, emoji })}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={newCategory.featured}
                  onChange={(e) => setNewCategory({ ...newCategory, featured: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="featured">⭐ Öne Çıkan</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={newCategory.enabled}
                  onChange={(e) => setNewCategory({ ...newCategory, enabled: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="enabled">Aktif</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                İptal
              </Button>
              <Button onClick={handleAddCategory} className="gap-2">
                <Plus className="size-4" />
                Ekle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kategori Düzenle</DialogTitle>
            <DialogDescription>
              Kategori bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Anahtar (key)</Label>
                <Input
                  value={editingCategory.key}
                  onChange={(e) => setEditingCategory({ ...editingCategory, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="ornek_kategori"
                />
              </div>

              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input
                  value={editingCategory.title}
                  onChange={(e) => setEditingCategory({ ...editingCategory, title: e.target.value })}
                  placeholder="Örnek Kategori"
                />
              </div>

              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={editingCategory.description}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="Kategori açıklaması..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Emoji</Label>
                <div className="flex flex-wrap gap-2">
                  {emojiOptions.map((emoji) => (
                    <Button
                      key={emoji}
                      type="button"
                      variant={editingCategory.emoji === emoji ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditingCategory({ ...editingCategory, emoji })}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-featured"
                    checked={editingCategory.featured}
                    onChange={(e) => setEditingCategory({ ...editingCategory, featured: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="edit-featured">⭐ Öne Çıkan</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-enabled"
                    checked={editingCategory.enabled}
                    onChange={(e) => setEditingCategory({ ...editingCategory, enabled: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="edit-enabled">Aktif</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingCategory(null)}>
                  İptal
                </Button>
                <Button onClick={handleUpdateCategory} className="gap-2">
                  <Save className="size-4" />
                  Güncelle
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </>
      )}

      {/* Oyuncu Kategorileri Tab */}
      {activeTab === 'player' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{playerCategories.length}</div>
              <div className="text-sm text-muted-foreground">Toplam Oyuncu Kategorisi</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{playerCategories.filter((c: any) => c.enabled).length}</div>
              <div className="text-sm text-muted-foreground">Aktif Kategori</div>
            </Card>
          </div>

          {/* Player Categories List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">👤 Oyuncu Tahmin Kategorileri</CardTitle>
              <CardDescription>Oyuncu bazlı tahmin kategorilerini yönetin. Bu kategoriler mobil uygulamada kullanılır.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {playerCategories.map((category: any) => (
                  <div 
                    key={category.id} 
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      category.enabled ? 'bg-card' : 'bg-muted/50 opacity-60'
                    }`}
                  >
                    {/* Emoji */}
                    <div className="text-3xl w-12 text-center">{category.emoji}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{category.title}</span>
                        {!category.enabled && (
                          <Badge variant="outline" className="text-xs">Pasif</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{category.description}</p>
                      <p className="text-xs text-muted-foreground/70">Anahtar: {category.key}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingPlayerCategory(category)}
                      >
                        <Edit2 className="size-4" />
                      </Button>
                      <Button
                        variant={category.enabled ? 'secondary' : 'default'}
                        size="sm"
                        onClick={() => handleUpdatePlayerCategory(category.id, { enabled: !category.enabled })}
                      >
                        {category.enabled ? 'Pasif Yap' : 'Aktif Yap'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Edit Player Category Dialog */}
          <Dialog open={!!editingPlayerCategory} onOpenChange={(open) => !open && setEditingPlayerCategory(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Oyuncu Kategorisini Düzenle</DialogTitle>
                <DialogDescription>
                  Kategori bilgilerini güncelleyin
                </DialogDescription>
              </DialogHeader>
              {editingPlayerCategory && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Başlık</Label>
                    <Input
                      value={editingPlayerCategory.title}
                      onChange={(e) => setEditingPlayerCategory({ ...editingPlayerCategory, title: e.target.value })}
                      placeholder="Kategori başlığı"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Açıklama</Label>
                    <Textarea
                      value={editingPlayerCategory.description}
                      onChange={(e) => setEditingPlayerCategory({ ...editingPlayerCategory, description: e.target.value })}
                      placeholder="Kategori açıklaması..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Emoji</Label>
                    <div className="flex flex-wrap gap-2">
                      {emojiOptions.map((emoji) => (
                        <Button
                          key={emoji}
                          type="button"
                          variant={editingPlayerCategory.emoji === emoji ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setEditingPlayerCategory({ ...editingPlayerCategory, emoji })}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="player-enabled"
                      checked={editingPlayerCategory.enabled}
                      onChange={(e) => setEditingPlayerCategory({ ...editingPlayerCategory, enabled: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="player-enabled">Aktif</Label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setEditingPlayerCategory(null)}>
                      İptal
                    </Button>
                    <Button 
                      onClick={() => {
                        handleUpdatePlayerCategory(editingPlayerCategory.id, editingPlayerCategory);
                        setEditingPlayerCategory(null);
                      }} 
                      className="gap-2"
                    >
                      <Save className="size-4" />
                      Güncelle
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

// Partner Applications Content - Ortaklık Başvuruları Yönetimi
function PartnerApplicationsContent() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, unread: 0, new: 0, reviewing: 0 });
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { notificationSettings } = useContext(AdminDataContext) || {};

  const loadApplications = async () => {
    setLoading(true);
    try {
      const { partnerApplicationsService } = await import('@/services/adminSupabaseService');
      const data = await partnerApplicationsService.getAll();
      const statsData = await partnerApplicationsService.getStats();
      setApplications(data);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading partner applications:', error);
      toast.error('Başvurular yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { partnerApplicationsService } = await import('@/services/adminSupabaseService');
      await partnerApplicationsService.update(id, { status: newStatus as any });
      toast.success('Durum güncellendi');
      loadApplications();
    } catch (error) {
      toast.error('Durum güncellenirken hata oluştu');
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const { partnerApplicationsService } = await import('@/services/adminSupabaseService');
      await partnerApplicationsService.markAsRead(id);
      loadApplications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu başvuruyu silmek istediğinizden emin misiniz?')) return;
    
    try {
      const { partnerApplicationsService } = await import('@/services/adminSupabaseService');
      await partnerApplicationsService.delete(id);
      toast.success('Başvuru silindi');
      loadApplications();
    } catch (error) {
      toast.error('Başvuru silinirken hata oluştu');
    }
  };

  const handleSendEmail = (app: any) => {
    const supportEmail = notificationSettings?.notificationEmail || 'support@tacticiq.app';
    const mailtoUrl = `mailto:${app.email}?cc=${supportEmail}&subject=${encodeURIComponent(`TacticIQ Ortaklık Başvurunuz Hakkında`)}&body=${encodeURIComponent(`
Sayın ${app.contact_name},

${app.company_name} adına yaptığınız ortaklık başvurunuz için teşekkür ederiz.

Başvurunuzu inceledik ve sizinle görüşmek istiyoruz.

...

Saygılarımızla,
TacticIQ Ekibi
    `)}`;
    window.open(mailtoUrl, '_blank');
  };

  const filteredApplications = applications.filter(app => 
    statusFilter === 'all' || app.status === statusFilter
  );

  const statusColors: Record<string, string> = {
    new: 'bg-red-500/20 text-red-400 border-red-500/50',
    reviewing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    contacted: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    negotiating: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    approved: 'bg-green-500/20 text-green-400 border-green-500/50',
    rejected: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
  };

  const statusLabels: Record<string, string> = {
    new: 'Yeni',
    reviewing: 'İnceleniyor',
    contacted: 'İletişime Geçildi',
    negotiating: 'Görüşülüyor',
    approved: 'Onaylandı',
    rejected: 'Reddedildi'
  };

  const companyTypeLabels: Record<string, string> = {
    media: 'Medya',
    sports: 'Spor',
    technology: 'Teknoloji',
    gaming: 'Oyun',
    agency: 'Ajans',
    other: 'Diğer'
  };

  const partnershipTypeLabels: Record<string, string> = {
    advertising: 'Reklam',
    sponsorship: 'Sponsorluk',
    content: 'İçerik Ortaklığı',
    technology: 'Teknoloji Ortaklığı',
    distribution: 'Dağıtım',
    other: 'Diğer'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Flag className="size-6 text-red-500" />
            Ortaklık Başvuruları
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Partner ve iş birliği başvurularını yönetin
          </p>
        </div>
        <Button onClick={loadApplications} variant="outline" className="gap-2">
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Toplam Başvuru</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-orange-500">
          <div className="text-2xl font-bold text-orange-400">{stats.unread}</div>
          <div className="text-sm text-muted-foreground">Okunmamış</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="text-2xl font-bold text-red-400">{stats.new}</div>
          <div className="text-sm text-muted-foreground">Yeni</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-yellow-500">
          <div className="text-2xl font-bold text-yellow-400">{stats.reviewing}</div>
          <div className="text-sm text-muted-foreground">İnceleniyor</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Durum Filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="new">Yeni</SelectItem>
              <SelectItem value="reviewing">İnceleniyor</SelectItem>
              <SelectItem value="contacted">İletişime Geçildi</SelectItem>
              <SelectItem value="negotiating">Görüşülüyor</SelectItem>
              <SelectItem value="approved">Onaylandı</SelectItem>
              <SelectItem value="rejected">Reddedildi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Başvurular ({filteredApplications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Flag className="size-12 mx-auto mb-4 opacity-50" />
              <p>Henüz başvuru yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApplications.map((app) => (
                <div 
                  key={app.id} 
                  className={`p-4 rounded-lg border ${!app.is_read ? 'bg-red-500/5 border-red-500/30' : 'bg-card'}`}
                  onClick={() => {
                    setSelectedApp(app);
                    if (!app.is_read) handleMarkAsRead(app.id);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {!app.is_read && (
                          <span className="size-2 bg-red-500 rounded-full" />
                        )}
                        <h4 className="font-semibold">{app.company_name}</h4>
                        <Badge className={statusColors[app.status]}>
                          {statusLabels[app.status]}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span>{app.contact_name}</span>
                        <span className="mx-2">•</span>
                        <span>{app.email}</span>
                        {app.phone && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{app.phone}</span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        <span>{companyTypeLabels[app.company_type]}</span>
                        <span className="mx-2">•</span>
                        <span>{partnershipTypeLabels[app.partnership_type]}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(app.created_at).toLocaleDateString('tr-TR')}</span>
                      </div>
                      {app.message && (
                        <p className="text-sm mt-2 text-muted-foreground line-clamp-2">{app.message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={app.status} 
                        onValueChange={(val) => handleStatusChange(app.id, val)}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Yeni</SelectItem>
                          <SelectItem value="reviewing">İnceleniyor</SelectItem>
                          <SelectItem value="contacted">İletişime Geçildi</SelectItem>
                          <SelectItem value="negotiating">Görüşülüyor</SelectItem>
                          <SelectItem value="approved">Onaylandı</SelectItem>
                          <SelectItem value="rejected">Reddedildi</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendEmail(app);
                        }}
                      >
                        <Mail className="size-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(app.id);
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Handshake className="size-5" />
              {selectedApp?.company_name}
            </DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">İletişim Kişisi</Label>
                  <p className="font-medium">{selectedApp.contact_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">E-posta</Label>
                  <p className="font-medium">{selectedApp.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Telefon</Label>
                  <p className="font-medium">{selectedApp.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Website</Label>
                  <p className="font-medium">{selectedApp.website || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Şirket Türü</Label>
                  <p className="font-medium">{companyTypeLabels[selectedApp.company_type]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ortaklık Türü</Label>
                  <p className="font-medium">{partnershipTypeLabels[selectedApp.partnership_type]}</p>
                </div>
              </div>
              
              {selectedApp.message && (
                <div>
                  <Label className="text-muted-foreground">Mesaj</Label>
                  <p className="mt-1 p-3 bg-muted rounded-lg">{selectedApp.message}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedApp(null)}>
                  Kapat
                </Button>
                <Button onClick={() => handleSendEmail(selectedApp)} className="gap-2">
                  <Mail className="size-4" />
                  E-posta Gönder
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Waitlist Content - Bekleme Listesi Yönetimi
function WaitlistContent() {
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, contacted: 0, converted: 0 });
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Waitlist servisini import et
  const loadWaitlist = async () => {
    setLoading(true);
    try {
      const { waitlistService } = await import('@/services/adminSupabaseService');
      const data = await waitlistService.getAll();
      const statsData = await waitlistService.getStats();
      setWaitlist(data);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading waitlist:', error);
      toast.error('Bekleme listesi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWaitlist();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { waitlistService } = await import('@/services/adminSupabaseService');
      await waitlistService.update(id, { status: newStatus as any });
      toast.success('Durum güncellendi');
      loadWaitlist();
    } catch (error) {
      toast.error('Durum güncellenirken hata oluştu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kaydı silmek istediğinizden emin misiniz?')) return;
    
    try {
      const { waitlistService } = await import('@/services/adminSupabaseService');
      await waitlistService.delete(id);
      toast.success('Kayıt silindi');
      loadWaitlist();
    } catch (error) {
      toast.error('Kayıt silinirken hata oluştu');
    }
  };

  const handleSelectAll = () => {
    if (selectedEmails.length === filteredWaitlist.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredWaitlist.map(w => w.email));
    }
  };

  const handleToggleEmail = (email: string) => {
    setSelectedEmails(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleSendEmail = () => {
    if (selectedEmails.length === 0) {
      toast.error('En az bir e-posta seçin');
      return;
    }
    
    // mailto: ile e-posta gönder
    const mailtoUrl = `mailto:?bcc=${selectedEmails.join(',')}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, '_blank');
    
    toast.success(`${selectedEmails.length} kişiye e-posta hazırlandı`);
    setShowEmailDialog(false);
  };

  const filteredWaitlist = waitlist.filter(entry => {
    const matchesSearch = entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (entry.name && entry.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    contacted: 'bg-blue-500/20 text-blue-400',
    converted: 'bg-green-500/20 text-green-400',
    unsubscribed: 'bg-red-500/20 text-red-400'
  };

  const statusLabels: Record<string, string> = {
    pending: 'Beklemede',
    contacted: 'İletişime Geçildi',
    converted: 'Dönüştürüldü',
    unsubscribed: 'Abonelik İptal'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="size-6" />
            Bekleme Listesi Yönetimi
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            E-posta kayıtlarını yönetin ve toplu e-posta gönderin
          </p>
        </div>
        <Button onClick={loadWaitlist} variant="outline" className="gap-2">
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Toplam Kayıt</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          <div className="text-sm text-muted-foreground">Beklemede</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-400">{stats.contacted}</div>
          <div className="text-sm text-muted-foreground">İletişime Geçildi</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-400">{stats.converted}</div>
          <div className="text-sm text-muted-foreground">Dönüştürüldü</div>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="E-posta veya isim ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Durum Filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="pending">Beklemede</SelectItem>
              <SelectItem value="contacted">İletişime Geçildi</SelectItem>
              <SelectItem value="converted">Dönüştürüldü</SelectItem>
              <SelectItem value="unsubscribed">Abonelik İptal</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex-1" />
          
          <Button 
            onClick={() => setShowEmailDialog(true)}
            disabled={selectedEmails.length === 0}
            className="gap-2 bg-secondary hover:bg-secondary/90"
          >
            <Mail className="size-4" />
            Seçilenlere E-posta ({selectedEmails.length})
          </Button>
        </div>
      </Card>

      {/* Waitlist Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Kayıtlar ({filteredWaitlist.length})</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              {selectedEmails.length === filteredWaitlist.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
          ) : filteredWaitlist.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Kayıt bulunamadı</div>
          ) : (
            <div className="space-y-2">
              {filteredWaitlist.map((entry) => (
                <div 
                  key={entry.id} 
                  className={`flex items-center gap-4 p-3 rounded-lg border ${
                    selectedEmails.includes(entry.email) ? 'bg-secondary/10 border-secondary' : 'bg-card'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedEmails.includes(entry.email)}
                    onChange={() => handleToggleEmail(entry.email)}
                    className="w-4 h-4"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{entry.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.name && <span className="mr-2">{entry.name}</span>}
                      <span>{new Date(entry.created_at).toLocaleDateString('tr-TR')}</span>
                      {entry.source && <span className="ml-2 opacity-60">• {entry.source}</span>}
                    </div>
                  </div>
                  
                  <Select 
                    value={entry.status} 
                    onValueChange={(val) => handleStatusChange(entry.id, val)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Beklemede</SelectItem>
                      <SelectItem value="contacted">İletişime Geçildi</SelectItem>
                      <SelectItem value="converted">Dönüştürüldü</SelectItem>
                      <SelectItem value="unsubscribed">Abonelik İptal</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Badge className={statusColors[entry.status]}>
                    {statusLabels[entry.status]}
                  </Badge>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Toplu E-posta Gönder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {selectedEmails.length} kişiye e-posta gönderilecek
            </div>
            
            <div className="space-y-2">
              <Label>Konu</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="TacticIQ - Heyecan Verici Gelişmeler!"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Mesaj</Label>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Merhaba,

TacticIQ'dan heyecan verici haberlerimiz var!

..."
                rows={10}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                İptal
              </Button>
              <Button onClick={handleSendEmail} className="gap-2 bg-secondary">
                <Mail className="size-4" />
                E-posta Gönder
              </Button>
            </div>
          </div>
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
  const profilePromoSettings = contextData?.profilePromoSettings;
  const updateProfilePromoSettings = contextData?.updateProfilePromoSettings;
  
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

  // Profil promosyon ayarları için state
  const [editedProfilePromoSettings, setEditedProfilePromoSettings] = useState(profilePromoSettings || {
    enabled: true,
    discountPercent: 30,
    dailyShowLimit: 3,
    showDuration: 0,
    promoTitle: 'Şimdi Üye Ol!',
    promoDescription: 'Sınırlı süre için özel indirim fırsatı',
    ctaButtonText: 'İndirimli Satın Al',
    showTimer: true,
    timerDuration: 600,
    showOriginalPrice: true,
    badgeText: 'Özel Teklif',
    backgroundColor: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    textColor: '#ffffff',
  });

  // Context değiştiğinde local state'leri güncelle - sadece ilk yüklemede
  const [priceInitialized, setPriceInitialized] = useState(false);
  const [discountInitialized, setDiscountInitialized] = useState(false);
  const [promoInitialized, setPromoInitialized] = useState(false);

  useEffect(() => {
    if (priceSettings && !priceInitialized) {
      setEditedPriceSettings(priceSettings);
      setPriceInitialized(true);
    }
  }, [priceSettings, priceInitialized]);

  useEffect(() => {
    if (discountSettings && !discountInitialized) {
      setEditedDiscountSettings(discountSettings);
      setDiscountInitialized(true);
    }
  }, [discountSettings, discountInitialized]);

  useEffect(() => {
    if (profilePromoSettings && !promoInitialized) {
      setEditedProfilePromoSettings(profilePromoSettings);
      setPromoInitialized(true);
    }
  }, [profilePromoSettings, promoInitialized]);

  const handleSavePrice = () => {
    if (updatePriceSettings) {
      // Aktif döneme göre proPrice'ı güncelle
      const activePrice = editedPriceSettings.billingPeriod === 'monthly' 
        ? editedPriceSettings.monthlyPrice 
        : editedPriceSettings.yearlyPrice;
      
      const finalSettings = {
        ...editedPriceSettings,
        proPrice: activePrice || editedPriceSettings.proPrice, // Aktif fiyatı proPrice olarak ayarla
      };
      
      updatePriceSettings(finalSettings);
      toast.success('Fiyat ayarları kaydedildi!');
    }
  };

  const handleSaveDiscount = () => {
    if (updateDiscountSettings) {
      updateDiscountSettings(editedDiscountSettings);
      toast.success('İndirim popup ayarları kaydedildi!');
    }
  };

  const handleSaveProfilePromo = () => {
    if (updateProfilePromoSettings) {
      updateProfilePromoSettings(editedProfilePromoSettings);
      toast.success('Profil promosyon ayarları kaydedildi!');
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
              {(() => {
                // Aktif döneme göre doğru fiyatı göster
                const activePrice = editedPriceSettings.billingPeriod === 'monthly' 
                  ? editedPriceSettings.monthlyPrice 
                  : editedPriceSettings.yearlyPrice;
                return `${CURRENCY_SYMBOLS[editedPriceSettings.baseCurrency]}${(activePrice || 0).toFixed(2)}`;
              })()}
              <span className="text-sm font-normal text-muted-foreground ml-2">/ {editedPriceSettings.billingPeriod === 'monthly' ? 'aylık' : 'yıllık'}</span>
            </div>
            {discountSettings?.enabled && discountSettings.discountPercent > 0 && (
              <div className="mt-2 text-sm">
                <span className="text-muted-foreground">İndirimli Fiyat:</span>
                <span className="ml-2 text-green-600 font-bold">
                  {(() => {
                    const activePrice = editedPriceSettings.billingPeriod === 'monthly' 
                      ? editedPriceSettings.monthlyPrice 
                      : editedPriceSettings.yearlyPrice;
                    const discountedPrice = (activePrice || 0) * (1 - (discountSettings.discountPercent || 0) / 100);
                    return `${CURRENCY_SYMBOLS[editedPriceSettings.baseCurrency]}${discountedPrice.toFixed(2)}`;
                  })()}
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

      {/* ===== PROFILE PROMO SETTINGS - Profil Promosyon Ayarları ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            👤 Profil Sayfası Promosyon Ayarları
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Profil sayfasında gösterilecek indirim banner'ı ayarları. "Şimdi üye olursan %X indirim" şeklinde görünür.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingToggle 
            label="👤 Profil Promosyonu Aktif" 
            description="Profil sayfasında promosyon banner'ını göster"
            enabled={editedProfilePromoSettings.enabled}
            onToggle={() => setEditedProfilePromoSettings({
              ...editedProfilePromoSettings, 
              enabled: !editedProfilePromoSettings.enabled
            })}
          />
          
          {editedProfilePromoSettings.enabled && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              {/* İndirim Yüzdesi */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">İndirim Yüzdesi (%)</Label>
                <Input 
                  type="number"
                  min={0}
                  max={100}
                  value={editedProfilePromoSettings.discountPercent}
                  onChange={(e) => setEditedProfilePromoSettings({
                    ...editedProfilePromoSettings, 
                    discountPercent: parseInt(e.target.value) || 0
                  })}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Web'de gösterilen fiyat üzerinden uygulanacak indirim yüzdesi
                </p>
              </div>

              {/* Günlük Gösterim Limiti */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Günlük Gösterim Limiti</Label>
                <Input 
                  type="number"
                  min={0}
                  value={editedProfilePromoSettings.dailyShowLimit}
                  onChange={(e) => setEditedProfilePromoSettings({
                    ...editedProfilePromoSettings, 
                    dailyShowLimit: parseInt(e.target.value) || 0
                  })}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  0 = sınırsız gösterim
                </p>
              </div>

              {/* Promosyon Başlığı */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Promosyon Başlığı</Label>
                <Input 
                  type="text"
                  value={editedProfilePromoSettings.promoTitle}
                  onChange={(e) => setEditedProfilePromoSettings({
                    ...editedProfilePromoSettings, 
                    promoTitle: e.target.value
                  })}
                  placeholder="Şimdi Üye Ol!"
                />
              </div>

              {/* Promosyon Açıklaması */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Promosyon Açıklaması</Label>
                <Textarea 
                  value={editedProfilePromoSettings.promoDescription}
                  onChange={(e) => setEditedProfilePromoSettings({
                    ...editedProfilePromoSettings, 
                    promoDescription: e.target.value
                  })}
                  placeholder="Sınırlı süre için özel indirim fırsatı"
                  rows={2}
                />
              </div>

              {/* CTA Buton Metni */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Buton Metni</Label>
                <Input 
                  type="text"
                  value={editedProfilePromoSettings.ctaButtonText}
                  onChange={(e) => setEditedProfilePromoSettings({
                    ...editedProfilePromoSettings, 
                    ctaButtonText: e.target.value
                  })}
                  placeholder="İndirimli Satın Al"
                />
              </div>

              {/* Badge Metni */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">İndirim Rozeti Metni</Label>
                <Input 
                  type="text"
                  value={editedProfilePromoSettings.badgeText}
                  onChange={(e) => setEditedProfilePromoSettings({
                    ...editedProfilePromoSettings, 
                    badgeText: e.target.value
                  })}
                  placeholder="Özel Teklif"
                />
              </div>

              {/* Timer Ayarları */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Geri Sayım Göster</Label>
                  <p className="text-xs text-muted-foreground">Banner'da geri sayım sayacı göster</p>
                </div>
                <Button 
                  variant={editedProfilePromoSettings.showTimer ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditedProfilePromoSettings({
                    ...editedProfilePromoSettings, 
                    showTimer: !editedProfilePromoSettings.showTimer
                  })}
                >
                  {editedProfilePromoSettings.showTimer ? 'Açık' : 'Kapalı'}
                </Button>
              </div>

              {editedProfilePromoSettings.showTimer && (
                <div className="space-y-2 ml-4">
                  <Label className="text-sm font-medium">Geri Sayım Süresi (saniye)</Label>
                  <Input 
                    type="number"
                    min={60}
                    value={editedProfilePromoSettings.timerDuration}
                    onChange={(e) => setEditedProfilePromoSettings({
                      ...editedProfilePromoSettings, 
                      timerDuration: parseInt(e.target.value) || 600
                    })}
                    className="w-32"
                  />
                  <p className="text-xs text-muted-foreground">
                    Örn: 600 = 10 dakika
                  </p>
                </div>
              )}

              {/* Orijinal Fiyat Göster */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Orijinal Fiyatı Göster</Label>
                  <p className="text-xs text-muted-foreground">Üstü çizili normal fiyatı göster</p>
                </div>
                <Button 
                  variant={editedProfilePromoSettings.showOriginalPrice ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditedProfilePromoSettings({
                    ...editedProfilePromoSettings, 
                    showOriginalPrice: !editedProfilePromoSettings.showOriginalPrice
                  })}
                >
                  {editedProfilePromoSettings.showOriginalPrice ? 'Açık' : 'Kapalı'}
                </Button>
              </div>

              {/* Arka Plan Rengi */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Arka Plan Stili (CSS)</Label>
                <Input 
                  type="text"
                  value={editedProfilePromoSettings.backgroundColor}
                  onChange={(e) => setEditedProfilePromoSettings({
                    ...editedProfilePromoSettings, 
                    backgroundColor: e.target.value
                  })}
                  placeholder="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                />
                <p className="text-xs text-muted-foreground">
                  CSS gradient veya renk kodu (örn: #f59e0b)
                </p>
              </div>

              {/* Metin Rengi */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Metin Rengi</Label>
                <Input 
                  type="text"
                  value={editedProfilePromoSettings.textColor}
                  onChange={(e) => setEditedProfilePromoSettings({
                    ...editedProfilePromoSettings, 
                    textColor: e.target.value
                  })}
                  placeholder="#ffffff"
                  className="w-32"
                />
              </div>

              {/* Önizleme */}
              <div className="mt-4 p-4 rounded-lg border-2 border-dashed">
                <Label className="text-sm font-medium block mb-2">📱 Önizleme</Label>
                <div 
                  className="p-4 rounded-lg text-center"
                  style={{ 
                    background: editedProfilePromoSettings.backgroundColor,
                    color: editedProfilePromoSettings.textColor 
                  }}
                >
                  <div className="text-sm font-semibold mb-1">{editedProfilePromoSettings.promoTitle}</div>
                  <div className="text-xs opacity-80 mb-2">{editedProfilePromoSettings.promoDescription}</div>
                  <div className="flex items-center justify-center gap-2">
                    {editedProfilePromoSettings.showOriginalPrice && (
                      <span className="line-through opacity-60">₺479.00</span>
                    )}
                    <span className="text-xl font-bold">
                      ₺{(479 * (1 - editedProfilePromoSettings.discountPercent / 100)).toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 bg-white text-black px-4 py-1 rounded text-sm font-semibold inline-block">
                    {editedProfilePromoSettings.ctaButtonText}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t flex justify-end">
            <Button onClick={handleSaveProfilePromo} className="gap-2">
              <Save className="size-4" />
              Profil Promosyon Ayarlarını Kaydet
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
  const notificationSettings = contextData?.notificationSettings;
  const updateNotificationSettings = contextData?.updateNotificationSettings;
  
  const [editedSettings, setEditedSettings] = useState(settings || {
    siteName: '',
    siteUrl: '',
    contactEmail: '',
    contactPhone: '', // Telefon numarası - Admin panelden düzenlenebilir
    maintenanceMode: false,
    registrationEnabled: true,
    proFeaturesEnabled: true,
    language: 'Türkçe',
    timezone: 'Europe/Istanbul',
    dateFormat: 'DD/MM/YYYY'
  });
  const [editedNotificationSettings, setEditedNotificationSettings] = useState(notificationSettings || {
    notificationEmail: 'etemduzok@gmail.com',
    sendOnExit: true,
    sendOnImportantChanges: true,
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [notificationInitialized, setNotificationInitialized] = useState(false);

  // Sync notification settings
  useEffect(() => {
    if (notificationSettings && !notificationInitialized) {
      setEditedNotificationSettings(notificationSettings);
      setNotificationInitialized(true);
    }
  }, [notificationSettings, notificationInitialized]);

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
                  <SelectItem value="Русский">Русский (Rusça)</SelectItem>
                  <SelectItem value="हिन्दी">हिन्दी (Hintçe)</SelectItem>
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

        {/* Admin Bildirim Ayarları */}
        <Card className="border-accent/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="size-4 text-accent" />
              Admin Bildirim Ayarları
            </CardTitle>
            <CardDescription>
              Değişiklik bildirimlerini alacağınız email adresini ayarlayın
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notificationEmail">Bildirim Email Adresi</Label>
              <Input
                id="notificationEmail"
                type="email"
                value={editedNotificationSettings.notificationEmail}
                onChange={(e) => {
                  const updated = { ...editedNotificationSettings, notificationEmail: e.target.value };
                  setEditedNotificationSettings(updated);
                  // Otomatik kaydet
                  if (updateNotificationSettings) {
                    updateNotificationSettings(updated);
                  }
                }}
                placeholder="admin@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Admin panelden çıkışta değişiklik özeti bu adrese gönderilir
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Çıkışta Email Gönder</Label>
                  <p className="text-xs text-muted-foreground">
                    Admin panelden çıkarken değişiklik özeti gönder
                  </p>
                </div>
                <Button
                  type="button"
                  variant={editedNotificationSettings.sendOnExit ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => {
                    const updated = { ...editedNotificationSettings, sendOnExit: !editedNotificationSettings.sendOnExit };
                    setEditedNotificationSettings(updated);
                    if (updateNotificationSettings) {
                      updateNotificationSettings(updated);
                    }
                  }}
                >
                  {editedNotificationSettings.sendOnExit ? 'Açık' : 'Kapalı'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Önemli Değişikliklerde Bildir</Label>
                  <p className="text-xs text-muted-foreground">
                    Fiyat, indirim gibi kritik değişikliklerde bildir
                  </p>
                </div>
                <Button
                  type="button"
                  variant={editedNotificationSettings.sendOnImportantChanges ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => {
                    const updated = { ...editedNotificationSettings, sendOnImportantChanges: !editedNotificationSettings.sendOnImportantChanges };
                    setEditedNotificationSettings(updated);
                    if (updateNotificationSettings) {
                      updateNotificationSettings(updated);
                    }
                  }}
                >
                  {editedNotificationSettings.sendOnImportantChanges ? 'Açık' : 'Kapalı'}
                </Button>
              </div>
            </div>

            <div className="bg-accent/10 rounded-lg p-3">
              <p className="text-xs flex items-center gap-2">
                💡 <span>Tüm değişiklikler otomatik olarak kaydedilir ve çıkışta size özet email gönderilir</span>
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

        {/* Hero Statistics Settings - Stats Section (Hero altındaki istatistikler) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4" />
              Hero İstatistikleri
            </CardTitle>
            <CardDescription>
              Ana sayfada hero bölümü altında gösterilen istatistik kartlarını düzenleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="averageRating">Ortalama Değerlendirme (örn: 4.9/5)</Label>
                <Input
                  id="averageRating"
                  type="text"
                  value={stats.averageRating}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Format kontrolü: X.X/5 veya boş
                    const ratingRegex = /^(\d+\.?\d*\/\d+|)$/;
                    if (ratingRegex.test(value) || value === '') {
                      updateStats({ averageRating: value });
                    }
                  }}
                  placeholder="4.9/5"
                />
                {stats.averageRating && !/^\d+\.?\d*\/\d+$/.test(stats.averageRating) && (
                  <p className="text-xs text-red-500">⚠️ Format: X.X/5 (örn: 4.9/5)</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalUsers">Aktif Kullanıcı (örn: 50K+ veya 0.0K+)</Label>
                <Input
                  id="totalUsers"
                  type="text"
                  value={stats.totalUsers}
                  onChange={(e) => updateStats({ totalUsers: e.target.value })}
                  placeholder="50K+"
                />
                <p className="text-xs text-muted-foreground">
                  Metin formatı kabul edilir (örn: 50K+, 0.0K+, 1.2M+)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalPredictions">Yapılan Tahmin (sayı, M+/K+ otomatik eklenir)</Label>
                <Input
                  id="totalPredictions"
                  type="number"
                  min="0"
                  value={stats.totalPredictions || 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    // Negatif sayı engelleme
                    if (value >= 0) {
                      updateStats({ totalPredictions: value });
                    }
                  }}
                  placeholder="1000000"
                />
                <p className="text-xs text-muted-foreground">
                  Örnek: 1000000 → "1.0M+", 500000 → "500K+"
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalLeagues">Kapsanan Lig (sayı, + otomatik eklenir)</Label>
                <Input
                  id="totalLeagues"
                  type="number"
                  min="0"
                  value={stats.totalLeagues || 25}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    // Negatif sayı engelleme
                    if (value >= 0) {
                      updateStats({ totalLeagues: value });
                    }
                  }}
                  placeholder="25"
                />
                <p className="text-xs text-muted-foreground">
                  Örnek: 25 → "25+", 0 → "0+"
                </p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                💡 Bu istatistikler ana sayfada hero bölümünün altındaki 4 kartta gösterilecektir
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

// Mobil Admin Placeholder Content
function MobilePlaceholderContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Smartphone className="size-6" />
          Mobil Uygulama Yönetimi
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Mobil uygulama yönetim araçları
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="size-5 text-secondary" />
              Uygulama Durumu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">iOS Versiyonu</span>
                <Badge variant="secondary">v1.0.0</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Android Versiyonu</span>
                <Badge variant="secondary">v1.0.0</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Minimum API</span>
                <Badge variant="outline">v2.0</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-secondary" />
              Mobil Kullanıcılar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Toplam İndirme</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Aktif Kullanıcı</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Günlük Aktif</span>
                <span className="font-semibold">-</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-6 border-2 border-dashed border-muted-foreground/30">
        <div className="text-center py-8">
          <Smartphone className="size-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold text-muted-foreground">Mobil Yönetim Araçları</h3>
          <p className="text-sm text-muted-foreground/70 max-w-md mx-auto mt-2">
            Push bildirimleri, uygulama içi mesajlar, kullanıcı segmentasyonu ve diğer mobil yönetim özellikleri yakında eklenecek.
          </p>
        </div>
      </Card>

      <div className="bg-accent/10 rounded-lg p-4 border border-accent/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 text-accent mt-0.5" />
          <div>
            <h4 className="font-semibold text-accent">Test Bot'u Kullanın</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Tüm web ve mobil fonksiyonlarını test etmek için soldaki menüden "Test Bot" seçeneğini kullanabilirsiniz. Test Bot her iki platformda da çalışan tüm özellikleri test eder.
            </p>
          </div>
        </div>
      </div>
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
  const updateSectionSettings = context?.updateSectionSettings;
  const sectionSettings = context?.sectionSettings;
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

  if (!context || !settings || !updateSettings || !updateSectionSettings) {
    return <div className="p-4 text-center">Oyun sistemi yükleniyor...</div>;
  }

  // Hero'daki oyun butonu kontrolü
  const heroShowPlayButton = sectionSettings?.hero?.showPlayButton ?? false;
  // GameSection kontrolü
  const gameSectionEnabled = sectionSettings?.game?.enabled ?? false;

  const handleToggleHeroPlayButton = () => {
    updateSectionSettings({
      hero: {
        ...sectionSettings?.hero,
        showPlayButton: !heroShowPlayButton,
      },
    });
    toast.success(
      heroShowPlayButton 
        ? '🎮 Hero bölümündeki oyun butonu gizlendi' 
        : '🎮 Hero bölümündeki oyun butonu gösterildi'
    );
  };

  const handleToggleGameSection = () => {
    updateSectionSettings({
      game: {
        ...sectionSettings?.game,
        enabled: !gameSectionEnabled,
      },
    });
    toast.success(
      gameSectionEnabled 
        ? '🎮 Tahmin Oyunu bölümü gizlendi' 
        : '🎮 Tahmin Oyunu bölümü gösterildi'
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

      {/* Hero Bölümündeki Oyun Butonu */}
      <Card className="border-2 border-primary/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Gamepad2 className="size-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Hero Bölümü - Oyun Butonu</CardTitle>
                <CardDescription>
                  Ana sayfanın hero bölümündeki "Oyun Oyna" butonunu kontrol eder
                </CardDescription>
              </div>
            </div>
            <button 
              onClick={handleToggleHeroPlayButton}
              className={`w-16 h-8 rounded-full transition-colors ${heroShowPlayButton ? 'bg-green-500' : 'bg-muted'}`}
            >
              <div className={`w-6 h-6 rounded-full bg-white mt-1 transition-transform ${heroShowPlayButton ? 'ml-9' : 'ml-1'}`} />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg ${heroShowPlayButton ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/50'}`}>
            <div className="flex items-start gap-3">
              <Info className="size-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {heroShowPlayButton ? '✅ Hero bölümündeki oyun butonu aktif' : '❌ Hero bölümündeki oyun butonu gizli'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {heroShowPlayButton 
                    ? 'Ana sayfanın hero bölümünde "Oyun Oyna" butonu görünür. Kullanıcılar bu butona tıklayarak GameSection\'a yönlendirilir.'
                    : 'Hero bölümündeki oyun butonu gizlenmiştir.'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tahmin Oyunu Bölümü (Misyon Ekibimiz Üzerinde) */}
      <Card className="border-2 border-secondary/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-secondary/10">
                <Gamepad2 className="size-6 text-secondary" />
              </div>
              <div>
                <CardTitle className="text-lg">Tahmin Oyunu Bölümü</CardTitle>
                <CardDescription>
                  "Misyon Ekibimiz" bölümünün üzerinde yer alan tahmin oyunu alanını kontrol eder
                </CardDescription>
              </div>
            </div>
            <button 
              onClick={handleToggleGameSection}
              className={`w-16 h-8 rounded-full transition-colors ${gameSectionEnabled ? 'bg-green-500' : 'bg-muted'}`}
            >
              <div className={`w-6 h-6 rounded-full bg-white mt-1 transition-transform ${gameSectionEnabled ? 'ml-9' : 'ml-1'}`} />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg ${gameSectionEnabled ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/50'}`}>
            <div className="flex items-start gap-3">
              <Info className="size-5 text-secondary mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {gameSectionEnabled ? '✅ Tahmin Oyunu bölümü aktif' : '❌ Tahmin Oyunu bölümü gizli'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {gameSectionEnabled 
                    ? 'Web sitesinde "Misyon Ekibimiz" bölümünün üzerinde tahmin oyunu bölümü görünür.'
                    : 'Tahmin oyunu bölümü gizlenmiştir.'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backend ve Güvenlik Bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📋 Teknik Detaylar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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

// Stats Content - Hero Altı İstatistikler Yönetimi
function StatsContent() {
  const contextData = useContext(AdminDataContext);
  const stats = contextData?.stats;
  const updateStats = contextData?.updateStats;

  if (!contextData || !stats || !updateStats) {
    return <div className="p-4 text-center">İstatistik ayarları yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="size-6" />
          Hero İstatistikleri Yönetimi
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ana sayfada hero bölümünün altında gösterilen 4 istatistik kartını düzenleyin
        </p>
      </div>

      {/* Hero Statistics Settings - Stats Section (Hero altındaki istatistikler) */}
      <Card className="border-2 border-secondary/30">
        <CardHeader className="bg-secondary/5">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="size-4" />
            Hero Altı İstatistik Kartları
          </CardTitle>
          <CardDescription>
            Ana sayfada hero bölümü altında gösterilen 4 istatistik kartını düzenleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ortalama Değerlendirme */}
            <div className="space-y-2">
              <Label htmlFor="stats-averageRating" className="flex items-center gap-2">
                <Trophy className="size-4 text-yellow-500" />
                Ortalama Değerlendirme
              </Label>
              <Input
                id="stats-averageRating"
                type="text"
                value={stats.averageRating || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Format kontrolü: X.X/5 veya boş
                  const ratingRegex = /^(\d+\.?\d*\/\d+|)$/;
                  if (ratingRegex.test(value) || value === '') {
                    updateStats({ averageRating: value });
                  }
                }}
                placeholder="4.9/5"
                className="font-semibold"
              />
              {stats.averageRating && !/^\d+\.?\d*\/\d+$/.test(stats.averageRating) && (
                <p className="text-xs text-red-500">⚠️ Format: X.X/5 (örn: 4.9/5)</p>
              )}
              <p className="text-xs text-muted-foreground">
                Örnek: 4.9/5, 5.0/5
              </p>
            </div>

            {/* Aktif Kullanıcı */}
            <div className="space-y-2">
              <Label htmlFor="stats-totalUsers" className="flex items-center gap-2">
                <Users className="size-4 text-blue-500" />
                Aktif Kullanıcı
              </Label>
              <Input
                id="stats-totalUsers"
                type="text"
                value={stats.totalUsers || ''}
                onChange={(e) => updateStats({ totalUsers: e.target.value })}
                placeholder="50K+"
                className="font-semibold"
              />
              <p className="text-xs text-muted-foreground">
                Metin formatı kabul edilir (örn: 50K+, 0.0K+, 1.2M+)
              </p>
            </div>

            {/* Yapılan Tahmin */}
            <div className="space-y-2">
              <Label htmlFor="stats-totalPredictions" className="flex items-center gap-2">
                <TrendingUp className="size-4 text-purple-500" />
                Yapılan Tahmin
              </Label>
              <Input
                id="stats-totalPredictions"
                type="number"
                min="0"
                value={stats.totalPredictions || 0}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  // Negatif sayı engelleme
                  if (value >= 0) {
                    updateStats({ totalPredictions: value });
                  }
                }}
                placeholder="1000000"
                className="font-semibold"
              />
              <p className="text-xs text-muted-foreground">
                Sayı girin, M+/K+ otomatik eklenir. Örnek: 1000000 → "1.0M+", 500000 → "500K+"
              </p>
            </div>

            {/* Kapsanan Lig */}
            <div className="space-y-2">
              <Label htmlFor="stats-totalLeagues" className="flex items-center gap-2">
                <Globe className="size-4 text-green-500" />
                Kapsanan Lig
              </Label>
              <Input
                id="stats-totalLeagues"
                type="number"
                min="0"
                value={stats.totalLeagues || 25}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  // Negatif sayı engelleme
                  if (value >= 0) {
                    updateStats({ totalLeagues: value });
                  }
                }}
                placeholder="25"
                className="font-semibold"
              />
              <p className="text-xs text-muted-foreground">
                Sayı girin, + otomatik eklenir. Örnek: 25 → "25+", 0 → "0+"
              </p>
            </div>
          </div>

          <div className="pt-4 border-t bg-secondary/5 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="size-4 text-secondary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1">📊 Canlı Önizleme</p>
                <p className="text-xs text-muted-foreground">
                  Bu istatistikler ana sayfada hero bölümünün altındaki 4 kartta gösterilecektir:
                </p>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="bg-background/50 p-2 rounded border">
                    <div className="font-bold text-secondary">{stats.averageRating || '0.0/5'}</div>
                    <div className="text-muted-foreground">Ortalama Değerlendirme</div>
                  </div>
                  <div className="bg-background/50 p-2 rounded border">
                    <div className="font-bold text-secondary">{stats.totalUsers || '0.0K+'}</div>
                    <div className="text-muted-foreground">Aktif Kullanıcı</div>
                  </div>
                  <div className="bg-background/50 p-2 rounded border">
                    <div className="font-bold text-secondary">
                      {stats.totalPredictions 
                        ? stats.totalPredictions >= 1000000 
                          ? `${(stats.totalPredictions / 1000000).toFixed(1)}M+`
                          : `${(stats.totalPredictions / 1000).toFixed(0)}K+`
                        : '1M+'}
                    </div>
                    <div className="text-muted-foreground">Yapılan Tahmin</div>
                  </div>
                  <div className="bg-background/50 p-2 rounded border">
                    <div className="font-bold text-secondary">{stats.totalLeagues ? `${stats.totalLeagues}+` : '25+'}</div>
                    <div className="text-muted-foreground">Kapsanan Lig</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Legal Documents Content - Yasal Belgeler Yönetimi
function LegalDocumentsContent() {
  const contextData = useContext(AdminDataContext);
  const legalDocuments = contextData?.legalDocuments || [];
  const addLegalDocument = contextData?.addLegalDocument;
  const updateLegalDocument = contextData?.updateLegalDocument;
  const deleteLegalDocument = contextData?.deleteLegalDocument;

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDoc, setEditingDoc] = useState<LegalDocument | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    document_id: 'terms' as string,
    language: 'tr' as string,
    title: '',
    content: '',
    enabled: true,
  });

  const documentTypes = [
    { id: 'terms', name: 'Kullanım Koşulları (EULA)' },
    { id: 'privacy', name: 'Küresel Gizlilik Politikası' },
    { id: 'cookies', name: 'Çerez Politikası' },
    { id: 'kvkk', name: 'KVKK Aydınlatma Metni' },
    { id: 'consent', name: 'Açık Rıza Metni' },
    { id: 'sales', name: 'Mesafeli Satış Sözleşmesi' },
    { id: 'copyright', name: 'Telif Hakkı Bildirimi' },
  ];

  const languages = [
    { code: 'tr', name: 'Türkçe' },
    { code: 'en', name: 'English' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'it', name: 'Italiano' },
    { code: 'ar', name: 'العربية' },
    { code: 'zh', name: '中文' },
    { code: 'ru', name: 'Русский' },
    { code: 'hi', name: 'हिन्दी' },
  ];

  if (!contextData) {
    return <div className="p-4 text-center">Yasal belgeler yükleniyor...</div>;
  }

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Lütfen başlık ve içerik girin');
      return;
    }

    if (editingDoc) {
      await updateLegalDocument(editingDoc.id, formData);
      toast.success('Yasal belge güncellendi');
    } else {
      await addLegalDocument(formData);
      toast.success('Yasal belge eklendi');
    }
    
    setShowAddDialog(false);
    setEditingDoc(null);
    setFormData({
      document_id: 'terms',
      language: 'tr',
      title: '',
      content: '',
      enabled: true,
    });
  };

  const handleEdit = (doc: LegalDocument) => {
    setEditingDoc(doc);
    setFormData({
      document_id: doc.document_id,
      language: doc.language,
      title: doc.title,
      content: doc.content,
      enabled: doc.enabled,
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu yasal belgeyi silmek istediğinize emin misiniz?')) {
      await deleteLegalDocument(id);
      toast.success('Yasal belge silindi');
    }
  };

  const filteredDocuments = legalDocuments.filter(doc => 
    (selectedDocumentId === 'all' || !selectedDocumentId || doc.document_id === selectedDocumentId) &&
    (selectedLanguage === 'all' || !selectedLanguage || doc.language === selectedLanguage)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Yasal Belgeler Yönetimi</h2>
          <p className="text-sm text-muted-foreground">Web ve mobil uygulama için yasal belgeleri yönetin</p>
        </div>
        <Button className="gap-2" onClick={() => {
          setEditingDoc(null);
          setFormData({
            document_id: 'terms',
            language: 'tr',
            title: '',
            content: '',
            enabled: true,
          });
          setShowAddDialog(true);
        }}>
          <Plus className="size-4" />
          Yeni Belge
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Belge Türü</Label>
              <Select value={selectedDocumentId} onValueChange={setSelectedDocumentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm belgeler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm belgeler</SelectItem>
                  {documentTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dil</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm diller" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm diller</SelectItem>
                  {languages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Matrix - Tüm belge türleri ve diller için grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-5" />
            Belge Durumu Matrisi
          </CardTitle>
          <CardDescription>
            Yeşil: İçerik mevcut | Kırmızı: Boş (tıklayarak ekleyin) | Toplam: {legalDocuments.length} / {documentTypes.length * languages.length} belge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border p-2 bg-muted text-left font-semibold">Belge Türü</th>
                  {languages.map(lang => (
                    <th key={lang.code} className="border p-2 bg-muted text-center font-semibold min-w-[80px]">
                      {lang.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documentTypes.map(docType => (
                  <tr key={docType.id}>
                    <td className="border p-2 font-medium bg-muted/50">{docType.name}</td>
                    {languages.map(lang => {
                      const existingDoc = legalDocuments.find(
                        d => d.document_id === docType.id && d.language === lang.code
                      );
                      return (
                        <td key={lang.code} className="border p-1 text-center">
                          {existingDoc ? (
                            <button
                              onClick={() => handleEdit(existingDoc)}
                              className="w-full h-full p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 rounded transition-colors"
                              title={`${existingDoc.title} (${existingDoc.content.length} karakter) - Düzenlemek için tıklayın`}
                            >
                              <Check className="size-4 mx-auto text-green-600" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingDoc(null);
                                setFormData({
                                  document_id: docType.id,
                                  language: lang.code,
                                  title: `${docType.name} - ${lang.name}`,
                                  content: '',
                                  enabled: true,
                                });
                                setShowAddDialog(true);
                              }}
                              className="w-full h-full p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded transition-colors"
                              title={`${docType.name} (${lang.name}) - İçerik eklemek için tıklayın`}
                            >
                              <Plus className="size-4 mx-auto text-red-600" />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mevcut Belgeler ({filteredDocuments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="size-12 mx-auto mb-2 opacity-50" />
                <p>Henüz yasal belge eklenmemiş</p>
                <p className="text-xs mt-2">Yukarıdaki matristeki kırmızı hücrelere tıklayarak belge ekleyebilirsiniz</p>
              </div>
            ) : (
              filteredDocuments.map((doc) => {
                const docType = documentTypes.find(t => t.id === doc.document_id);
                const lang = languages.find(l => l.code === doc.language);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={doc.enabled ? 'default' : 'secondary'}>
                          {doc.enabled ? 'Aktif' : 'Pasif'}
                        </Badge>
                        <span className="font-semibold">{doc.title}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span>{docType?.name || doc.document_id}</span>
                        <span className="mx-2">•</span>
                        <span>{lang?.name || doc.language}</span>
                        <span className="mx-2">•</span>
                        <span>{doc.content.length} karakter</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(doc)}
                      >
                        <Edit2 className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingDoc ? 'Yasal Belge Düzenle' : 'Yeni Yasal Belge Ekle'}</DialogTitle>
            <DialogDescription>
              Web ve mobil uygulama için yasal belge içeriğini girin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Belge Türü</Label>
                <Select
                  value={formData.document_id}
                  onValueChange={(value) => setFormData({ ...formData, document_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dil</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Belge başlığı"
              />
            </div>
            <div className="space-y-2">
              <Label>İçerik</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Belge içeriği..."
                className="min-h-[300px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {formData.content.length} karakter
              </p>
            </div>
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
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setEditingDoc(null);
            }}>
              İptal
            </Button>
            <Button onClick={handleSave}>
              {editingDoc ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== SYSTEM MONITORING CONTENT =====
interface ServiceStatus {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'stopped' | 'error' | 'loading';
  port?: number;
  lastCheck?: Date;
  uptime?: number;
  errorMessage?: string;
  apiCalls?: number;
  cpu?: number;
  memory?: number;
}

function SystemMonitoringContent() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { id: 'backend', name: 'Backend', description: 'Ana API sunucusu', status: 'loading', port: 3001 },
    { id: 'expo', name: 'Expo', description: 'Mobil uygulama (web)', status: 'loading', port: 8081 },
    { id: 'website', name: 'Website', description: 'Tanıtım sitesi', status: 'loading', port: 5173 },
    { id: 'supabase', name: 'Supabase', description: 'Veritabanı servisi', status: 'loading' },
    { id: 'smartSync', name: 'Sync', description: 'Canlı maç senkronizasyonu', status: 'loading' },
    { id: 'staticTeams', name: 'Teams', description: 'Takım verileri güncelleme', status: 'loading' },
    { id: 'leaderboard', name: 'Lider', description: 'Günlük/haftalık sıralama', status: 'loading' },
    { id: 'cache', name: 'Cache', description: 'Agresif önbellek sistemi', status: 'loading' },
    { id: 'monitoring', name: 'Monitor', description: 'Sistem izleme servisi', status: 'loading' },
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [apiStats, setApiStats] = useState<{ dailyCalls: number; remaining: number; limit: number } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [autoRestartEnabled, setAutoRestartEnabled] = useState(true);

  // Get API key from environment or use default for development
  const getApiKey = () => {
    return import.meta.env.VITE_BACKEND_API_KEY || 'admin-dev-key';
  };

  // Helper function to create headers with API key
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': getApiKey(),
    };
  };

  // Toggle auto-restart
  const toggleAutoRestart = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/services/auto-restart', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ enabled: !autoRestartEnabled }),
      });
      const result = await response.json();
      if (result.success) {
        setAutoRestartEnabled(result.enabled);
        toast.success(result.enabled ? 'Otomatik yeniden başlatma açık' : 'Otomatik yeniden başlatma kapalı');
      }
    } catch (error) {
      toast.error('Ayar değiştirilemedi');
    }
  };

  // Health check for all services
  const checkServiceHealth = async () => {
    setIsRefreshing(true);
    const updatedServices = [...services];
    
    // Check Backend
    try {
      const backendRes = await fetch('http://localhost:3001/health', { 
        signal: AbortSignal.timeout(5000),
        method: 'GET',
      });
      
      if (backendRes.ok) {
        const backendData = await backendRes.json();
        const backendIdx = updatedServices.findIndex(s => s.id === 'backend');
        updatedServices[backendIdx] = {
          ...updatedServices[backendIdx],
          status: 'running',
          lastCheck: new Date(),
          uptime: backendData.uptime,
          errorMessage: undefined,
        };
      } else {
        throw new Error(`HTTP ${backendRes.status}`);
      }
    } catch (e: any) {
      const backendIdx = updatedServices.findIndex(s => s.id === 'backend');
      updatedServices[backendIdx] = {
        ...updatedServices[backendIdx],
        status: 'stopped',
        lastCheck: new Date(),
        errorMessage: 'Bağlantı kurulamadı - Backend çalışmıyor olabilir',
      };
    }

    // Check Expo Web
    try {
      const expoRes = await fetch('http://localhost:8081', { signal: AbortSignal.timeout(5000), mode: 'no-cors' });
      const expoIdx = updatedServices.findIndex(s => s.id === 'expo');
      updatedServices[expoIdx] = {
        ...updatedServices[expoIdx],
        status: 'running',
        lastCheck: new Date(),
      };
    } catch (e) {
      const expoIdx = updatedServices.findIndex(s => s.id === 'expo');
      updatedServices[expoIdx] = {
        ...updatedServices[expoIdx],
        status: 'stopped',
        lastCheck: new Date(),
        errorMessage: 'Bağlantı kurulamadı',
      };
    }

    // Check Website (Vite)
    try {
      const viteRes = await fetch('http://localhost:5173', { signal: AbortSignal.timeout(5000), mode: 'no-cors' });
      const viteIdx = updatedServices.findIndex(s => s.id === 'website');
      updatedServices[viteIdx] = {
        ...updatedServices[viteIdx],
        status: 'running',
        lastCheck: new Date(),
      };
    } catch (e) {
      const viteIdx = updatedServices.findIndex(s => s.id === 'website');
      updatedServices[viteIdx] = {
        ...updatedServices[viteIdx],
        status: 'stopped',
        lastCheck: new Date(),
        errorMessage: 'Bağlantı kurulamadı',
      };
    }

    // Check System Status (all services at once)
    try {
      const systemRes = await fetch('http://localhost:3001/api/system-status', { signal: AbortSignal.timeout(5000) });
      const systemData = await systemRes.json();
      
      if (systemData.success && systemData.services) {
        // Worldwide Sync
        const smartSyncIdx = updatedServices.findIndex(s => s.id === 'smartSync');
        const syncStatus = systemData.services.worldwideSync;
        updatedServices[smartSyncIdx] = {
          ...updatedServices[smartSyncIdx],
          status: syncStatus?.isRunning ? 'running' : 'stopped',
          lastCheck: new Date(),
          apiCalls: syncStatus?.apiCallsToday,
          uptime: syncStatus?.currentInterval,
        };
        
        // Static Teams
        const staticTeamsIdx = updatedServices.findIndex(s => s.id === 'staticTeams');
        const teamsStatus = systemData.services.staticTeams;
        updatedServices[staticTeamsIdx] = {
          ...updatedServices[staticTeamsIdx],
          status: teamsStatus?.isRunning ? 'running' : 'stopped',
          lastCheck: new Date(),
          apiCalls: teamsStatus?.apiCallsThisMonth,
        };
        
        // Leaderboard Snapshots
        const leaderboardIdx = updatedServices.findIndex(s => s.id === 'leaderboard');
        const snapshotStatus = systemData.services.leaderboardSnapshots;
        updatedServices[leaderboardIdx] = {
          ...updatedServices[leaderboardIdx],
          status: snapshotStatus?.isRunning ? 'running' : 'stopped',
          lastCheck: new Date(),
        };
      }
    } catch (e) {
      // Fallback to individual sync-status check
      try {
        const syncRes = await fetch('http://localhost:3001/api/sync-status', { signal: AbortSignal.timeout(5000) });
        const syncData = await syncRes.json();
        
        const smartSyncIdx = updatedServices.findIndex(s => s.id === 'smartSync');
        updatedServices[smartSyncIdx] = {
          ...updatedServices[smartSyncIdx],
          status: syncData.isRunning ? 'running' : 'stopped',
          lastCheck: new Date(),
          apiCalls: syncData.apiCallsToday,
        };
      } catch {
        const smartSyncIdx = updatedServices.findIndex(s => s.id === 'smartSync');
        updatedServices[smartSyncIdx] = {
          ...updatedServices[smartSyncIdx],
          status: 'error',
          lastCheck: new Date(),
          errorMessage: 'Durum alınamadı',
        };
      }
    }

    // Check Rate Limiter Stats
    try {
      const rateRes = await fetch('http://localhost:3001/api/rate-limit/stats', { signal: AbortSignal.timeout(5000) });
      const rateData = await rateRes.json();
      setApiStats({
        dailyCalls: rateData.todaysCalls || 0,
        remaining: rateData.remaining || 7500,
        limit: rateData.limit || 7500,
      });
    } catch (e) {
      // Ignore rate limit errors
    }

    // Supabase - assume running if backend is running
    const supabaseIdx = updatedServices.findIndex(s => s.id === 'supabase');
    const backendRunning = updatedServices.find(s => s.id === 'backend')?.status === 'running';
    updatedServices[supabaseIdx] = {
      ...updatedServices[supabaseIdx],
      status: backendRunning ? 'running' : 'stopped',
      lastCheck: new Date(),
    };

    // Cache Service - assume running if backend is running
    const cacheIdx = updatedServices.findIndex(s => s.id === 'cache');
    updatedServices[cacheIdx] = {
      ...updatedServices[cacheIdx],
      status: backendRunning ? 'running' : 'stopped',
      lastCheck: new Date(),
    };

    // Monitoring - assume running if backend is running
    const monitorIdx = updatedServices.findIndex(s => s.id === 'monitoring');
    updatedServices[monitorIdx] = {
      ...updatedServices[monitorIdx],
      status: backendRunning ? 'running' : 'stopped',
      lastCheck: new Date(),
    };

    setServices(updatedServices);
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  // Initial check
  useEffect(() => {
    checkServiceHealth();
    // Auto refresh every 30 seconds
    const interval = setInterval(checkServiceHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleServiceAction = async (serviceId: string, action: 'start' | 'stop' | 'restart') => {
    setActionLoading(`${serviceId}-${action}`);
    toast.info(`${action === 'start' ? 'Başlatılıyor' : action === 'stop' ? 'Durduruluyor' : 'Yeniden başlatılıyor'}...`);
    
    // Special handling for backend service - backend kendisini kontrol edemez
    if (serviceId === 'backend') {
      if (action === 'start') {
        toast.info(
          <div className="space-y-2">
            <p className="font-semibold">Backend'i Başlatma Talimatları:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Terminali açın ve proje klasörüne gidin</li>
              <li>Backend klasörüne gidin: <code className="bg-muted px-1 rounded">cd backend</code></li>
              <li>Backend'i başlatın: <code className="bg-muted px-1 rounded">npm start</code> veya <code className="bg-muted px-1 rounded">node server.js</code></li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2">Backend başladıktan sonra bu sayfayı yenileyin.</p>
          </div>,
          { duration: 10000 }
        );
        setActionLoading(null);
        return;
      } else if (action === 'stop') {
        toast.warning('Backend\'i durdurmak için terminalde Ctrl+C tuşlarına basın.');
        setActionLoading(null);
        return;
      } else if (action === 'restart') {
        toast.info('Backend\'i yeniden başlatmak için terminalde Ctrl+C ile durdurun, sonra tekrar başlatın.');
        setActionLoading(null);
        return;
      }
    }
    
    // Supabase için özel mesaj
    if (serviceId === 'supabase') {
      toast.info('Supabase cloud servisidir ve buradan kontrol edilemez. Durum kontrolü için Supabase Dashboard kullanın.');
      setActionLoading(null);
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3001/api/services/control', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ serviceId, action }),
        signal: AbortSignal.timeout(10000), // 10 saniye timeout
      });
      
      if (!response.ok) {
        // Check if it's an API key error
        if (response.status === 401 || response.status === 403) {
          const errorData = await response.json().catch(() => ({}));
          toast.error(
            <div className="space-y-1">
              <p className="font-semibold">🔐 Yetkilendirme Hatası</p>
              <p className="text-sm">{errorData.error || 'API key eksik veya geçersiz.'}</p>
              <p className="text-xs text-muted-foreground mt-1">Backend .env dosyasında VALID_API_KEYS kontrol edin.</p>
            </div>,
            { duration: 8000 }
          );
          setActionLoading(null);
          return;
        }
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message || `✅ Servis ${action === 'start' ? 'başlatıldı' : action === 'stop' ? 'durduruldu' : 'yeniden başlatıldı'}`);
        // Status'u yenile
        setTimeout(() => checkServiceHealth(), 1500);
      } else {
        toast.error(result.error || '❌ İşlem başarısız');
      }
    } catch (error: any) {
      console.error('Service action error:', error);
      
      // If backend is not running, show helpful message
      if (serviceId !== 'backend' && serviceId !== 'supabase') {
        const backendStatus = services.find(s => s.id === 'backend')?.status;
        if (backendStatus !== 'running' || error.name === 'AbortError' || error.message?.includes('fetch')) {
          toast.error(
            <div className="space-y-2">
              <p className="font-semibold">❌ Backend çalışmıyor!</p>
              <div className="text-sm space-y-1">
                <p>Servisleri kontrol etmek için önce backend'i başlatın:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Terminal: <code className="bg-muted px-1 rounded">cd backend</code></li>
                  <li>Başlat: <code className="bg-muted px-1 rounded">npm start</code></li>
                </ol>
              </div>
            </div>,
            { duration: 8000 }
          );
        } else {
          toast.error(`❌ Hata: ${error.message || 'Bilinmeyen hata'}`);
        }
      } else {
        // Backend veya Supabase için özel mesaj zaten gösterildi
        if (serviceId === 'backend') {
          // Backend için mesaj zaten gösterildi, buraya gelmemeli
        }
      }
    }
    
    setActionLoading(null);
    
    // Refresh status after action
    setTimeout(() => checkServiceHealth(), 1000);
  };

  const handleAllServicesAction = async (action: 'start' | 'stop' | 'restart') => {
    setActionLoading(`all-${action}`);
    
    // Check if backend is running first
    const backendStatus = services.find(s => s.id === 'backend')?.status;
    
    if (backendStatus !== 'running') {
      // Backend çalışmıyorsa, kullanıcıya talimat ver
      toast.error(
        <div className="space-y-2">
          <p className="font-semibold">⚠️ Backend çalışmıyor!</p>
          <div className="text-sm space-y-1">
            <p><strong>Backend'i başlatmak için:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Terminali açın ve proje klasörüne gidin</li>
              <li>Backend klasörüne gidin: <code className="bg-muted px-1 rounded">cd backend</code></li>
              <li>Backend'i başlatın: <code className="bg-muted px-1 rounded">npm start</code></li>
            </ol>
            <p className="mt-2 text-xs text-muted-foreground">Backend başladıktan sonra bu sayfayı yenileyin ve tekrar deneyin.</p>
          </div>
        </div>,
        { duration: 12000 }
      );
      setActionLoading(null);
      return;
    }
    
    toast.info(`Tüm servisler ${action === 'start' ? 'başlatılıyor' : action === 'stop' ? 'durduruluyor' : 'yeniden başlatılıyor'}...`);
    
    try {
      const response = await fetch('http://localhost:3001/api/services/restart-all', {
        method: 'POST',
        headers: getHeaders(),
        signal: AbortSignal.timeout(10000), // 10 saniye timeout
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          const errorData = await response.json().catch(() => ({}));
          toast.error(
            <div className="space-y-1">
              <p className="font-semibold">Yetkilendirme Hatası</p>
              <p className="text-sm">{errorData.error || 'API key eksik veya geçersiz. Backend .env dosyasında VALID_API_KEYS kontrol edin.'}</p>
            </div>,
            { duration: 8000 }
          );
          setActionLoading(null);
          return;
        }
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message || 'Tüm servisler başarıyla işlendi');
        // Status'u yenile
        setTimeout(() => checkServiceHealth(), 2000);
      } else {
        toast.error(result.error || 'İşlem başarısız');
      }
    } catch (error: any) {
      console.error('All services action error:', error);
      if (error.name === 'AbortError' || error.message?.includes('fetch')) {
        toast.error(
          <div className="space-y-1">
            <p className="font-semibold">❌ Backend bağlantısı kurulamadı</p>
            <p className="text-sm">Backend'in çalıştığından ve http://localhost:3001 adresinde dinlediğinden emin olun.</p>
          </div>,
          { duration: 8000 }
        );
      } else {
        toast.error(`Hata: ${error.message || 'Bilinmeyen hata'}`);
      }
    }
    
    setActionLoading(null);
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-gray-400';
      case 'error': return 'bg-red-500';
      case 'loading': return 'bg-yellow-400 animate-pulse';
    }
  };

  const getStatusText = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'running': return 'Çalışıyor';
      case 'stopped': return 'Durdu';
      case 'error': return 'Hata';
      case 'loading': return 'Kontrol ediliyor...';
    }
  };

  const runningCount = services.filter(s => s.status === 'running').length;
  const errorCount = services.filter(s => s.status === 'error').length;
  const stoppedCount = services.filter(s => s.status === 'stopped').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Server className="size-6" />
            Sistem İzleme Paneli
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tüm servislerin durumunu izleyin ve yönetin
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={autoRestartEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={toggleAutoRestart}
            className={autoRestartEnabled ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            <RotateCw className="size-4 mr-1" />
            {autoRestartEnabled ? 'Otomatik' : 'Manuel'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={checkServiceHealth}
            disabled={isRefreshing}
          >
            <RefreshCw className={`size-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              {lastRefresh.toLocaleTimeString('tr-TR')}
            </span>
          )}
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Çalışan</p>
                <p className="text-3xl font-bold text-green-500">{runningCount}</p>
              </div>
              <Wifi className="size-10 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hatalı</p>
                <p className="text-3xl font-bold text-red-500">{errorCount}</p>
              </div>
              <AlertCircle className="size-10 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-500/30 bg-gray-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Durdu</p>
                <p className="text-3xl font-bold text-gray-500">{stoppedCount}</p>
              </div>
              <WifiOff className="size-10 text-gray-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">API Kullanımı</p>
                <p className="text-2xl font-bold text-primary">
                  {apiStats ? `${apiStats.dailyCalls.toLocaleString()}` : '...'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {apiStats ? `/ ${apiStats.limit.toLocaleString()} günlük` : ''}
                </p>
              </div>
              <Zap className="size-10 text-primary/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Actions */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Cpu className="size-5" />
            Toplu İşlemler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="default"
              onClick={() => handleAllServicesAction('start')}
              disabled={actionLoading !== null}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="size-4 mr-2" />
              Tümünü Başlat
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleAllServicesAction('stop')}
              disabled={actionLoading !== null}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square className="size-4 mr-2" />
              Tümünü Durdur
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleAllServicesAction('restart')}
              disabled={actionLoading !== null}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCw className="size-4 mr-2" />
              Tümünü Yeniden Başlat
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Architecture Diagram */}
      <Card className="overflow-hidden">
        <CardHeader className="py-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <HardDrive className="size-5" />
            Sistem Mimarisi
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden p-3">
          <div className="relative bg-muted/30 rounded-lg p-3 overflow-hidden">
            <div className="flex flex-col items-center gap-3">
              {/* Top Layer - Frontend */}
              <div className="flex flex-wrap gap-3 items-center justify-center w-full">
                <ServiceBlock 
                  service={services.find(s => s.id === 'website')!}
                  onAction={handleServiceAction}
                  actionLoading={actionLoading}
                />
                <ServiceBlock 
                  service={services.find(s => s.id === 'expo')!}
                  onAction={handleServiceAction}
                  actionLoading={actionLoading}
                />
              </div>
              
              {/* Arrow Down */}
              <div className="flex flex-col items-center">
                <div className="w-px h-6 bg-border" />
                <ChevronRight className="size-4 rotate-90 text-muted-foreground" />
              </div>
              
              {/* Middle Layer - Backend */}
              <div className="flex justify-center w-full">
                <ServiceBlock 
                  service={services.find(s => s.id === 'backend')!}
                  onAction={handleServiceAction}
                  actionLoading={actionLoading}
                  large
                />
              </div>
              
              {/* Arrow Down */}
              <div className="flex flex-col items-center">
                <div className="w-px h-6 bg-border" />
                <ChevronRight className="size-4 rotate-90 text-muted-foreground" />
              </div>
              
              {/* Services Layer */}
              <div className="flex flex-wrap gap-2 items-center justify-center w-full">
                <ServiceBlock 
                  service={services.find(s => s.id === 'smartSync')!}
                  onAction={handleServiceAction}
                  actionLoading={actionLoading}
                />
                <ServiceBlock 
                  service={services.find(s => s.id === 'cache')!}
                  onAction={handleServiceAction}
                  actionLoading={actionLoading}
                />
                <ServiceBlock 
                  service={services.find(s => s.id === 'monitoring')!}
                  onAction={handleServiceAction}
                  actionLoading={actionLoading}
                />
              </div>
              
              {/* Arrow Down */}
              <div className="flex flex-col items-center">
                <div className="w-px h-6 bg-border" />
                <ChevronRight className="size-4 rotate-90 text-muted-foreground" />
              </div>
              
              {/* Bottom Layer - Database */}
              <div className="flex flex-wrap gap-3 items-center justify-center w-full">
                <ServiceBlock 
                  service={services.find(s => s.id === 'supabase')!}
                  onAction={handleServiceAction}
                  actionLoading={actionLoading}
                  large
                />
                <div className="px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg text-center">
                  <Globe className="size-5 mx-auto text-accent mb-1" />
                  <p className="text-xs font-medium">API-Football</p>
                  <p className="text-[10px] text-muted-foreground">Harici API</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services List */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="size-5" />
            Servis Detayları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {services.map(service => (
              <div
                key={service.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  service.status === 'running' ? 'bg-green-500/5 border-green-500/30' :
                  service.status === 'error' ? 'bg-red-500/5 border-red-500/30' :
                  service.status === 'stopped' ? 'bg-gray-500/5 border-gray-500/30' :
                  'bg-yellow-500/5 border-yellow-500/30'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{service.name}</p>
                      {service.port && (
                        <Badge variant="outline" className="text-xs">
                          :{service.port}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                    {service.errorMessage && (
                      <p className="text-xs text-red-500 mt-1">{service.errorMessage}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className={`font-medium ${
                      service.status === 'running' ? 'text-green-500' :
                      service.status === 'error' ? 'text-red-500' :
                      service.status === 'stopped' ? 'text-gray-500' :
                      'text-yellow-500'
                    }`}>
                      {getStatusText(service.status)}
                    </p>
                    {service.uptime !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        Uptime: {Math.floor(service.uptime / 60)}dk
                      </p>
                    )}
                    {service.lastCheck && (
                      <p className="text-xs text-muted-foreground">
                        {service.lastCheck.toLocaleTimeString('tr-TR')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-green-500 hover:bg-green-500/10"
                      onClick={() => handleServiceAction(service.id, 'start')}
                      disabled={actionLoading !== null || service.status === 'running'}
                      title="Başlat"
                    >
                      <Play className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                      onClick={() => handleServiceAction(service.id, 'stop')}
                      disabled={actionLoading !== null || service.status === 'stopped'}
                      title="Durdur"
                    >
                      <Square className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-yellow-500 hover:bg-yellow-500/10"
                      onClick={() => handleServiceAction(service.id, 'restart')}
                      disabled={actionLoading !== null}
                      title="Yeniden Başlat"
                    >
                      <RotateCw className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Traffic */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="size-5" />
            Veri Trafiği
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Günlük API Çağrısı</p>
              <p className="text-2xl font-bold">{apiStats?.dailyCalls?.toLocaleString() || '0'}</p>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${apiStats ? (apiStats.dailyCalls / apiStats.limit) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {apiStats ? `${((apiStats.dailyCalls / apiStats.limit) * 100).toFixed(1)}% kullanıldı` : ''}
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Kalan Çağrı</p>
              <p className="text-2xl font-bold text-green-500">
                {apiStats?.remaining?.toLocaleString() || '7,500'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {apiStats?.limit?.toLocaleString() || '7,500'} günlük limit
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Tahmini Bitiş</p>
              <p className="text-2xl font-bold">
                {apiStats && apiStats.dailyCalls > 0 
                  ? `${Math.floor((apiStats.limit - apiStats.dailyCalls) / (apiStats.dailyCalls / (new Date().getHours() || 1)))}s`
                  : '∞'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Mevcut kullanım hızında
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Flow Health - Database ↔ Web ↔ Mobile */}
      <DataFlowHealthSection />
    </div>
  );
}

// Service Block Component for Architecture Diagram
interface ServiceBlockProps {
  service: ServiceStatus;
  onAction: (id: string, action: 'start' | 'stop' | 'restart') => void;
  actionLoading: string | null;
  large?: boolean;
}

function ServiceBlock({ service, onAction, actionLoading, large }: ServiceBlockProps) {
  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'running': return 'border-green-500 bg-green-500/10';
      case 'stopped': return 'border-gray-400 bg-gray-400/10';
      case 'error': return 'border-red-500 bg-red-500/10';
      case 'loading': return 'border-yellow-400 bg-yellow-400/10';
    }
  };

  const getIndicatorColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-gray-400';
      case 'error': return 'bg-red-500';
      case 'loading': return 'bg-yellow-400 animate-pulse';
    }
  };

  return (
    <div className={`relative ${large ? 'px-4 py-3' : 'px-3 py-2'} rounded-lg border-2 ${getStatusColor(service.status)} transition-all flex-shrink-0`}>
      <div className={`absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full ${getIndicatorColor(service.status)}`} />
      <div className="text-center">
        {service.id === 'backend' && <Server className={`${large ? 'size-6' : 'size-5'} mx-auto mb-1`} />}
        {service.id === 'expo' && <Smartphone className={`${large ? 'size-6' : 'size-5'} mx-auto mb-1`} />}
        {service.id === 'website' && <Monitor className={`${large ? 'size-6' : 'size-5'} mx-auto mb-1`} />}
        {service.id === 'supabase' && <Database className={`${large ? 'size-6' : 'size-5'} mx-auto mb-1`} />}
        {service.id === 'smartSync' && <RefreshCw className={`${large ? 'size-6' : 'size-5'} mx-auto mb-1`} />}
        {service.id === 'cache' && <HardDrive className={`${large ? 'size-6' : 'size-5'} mx-auto mb-1`} />}
        {service.id === 'monitoring' && <Activity className={`${large ? 'size-6' : 'size-5'} mx-auto mb-1`} />}
        <p className={`${large ? 'text-xs' : 'text-[10px]'} font-medium whitespace-nowrap`}>{service.name}</p>
        {service.port && (
          <p className="text-[10px] text-muted-foreground">:{service.port}</p>
        )}
      </div>
      <div className="flex justify-center gap-1 mt-2">
        <button
          className="p-1 rounded hover:bg-green-500/20 text-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onAction(service.id, 'start')}
          disabled={actionLoading !== null || (service.status === 'running' && service.id !== 'backend' && service.id !== 'supabase')}
          title={service.id === 'backend' || service.id === 'supabase' ? 'Başlat (Talimatlar gösterilecek)' : 'Başlat'}
        >
          <Play className="size-3" />
        </button>
        <button
          className="p-1 rounded hover:bg-red-500/20 text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onAction(service.id, 'stop')}
          disabled={actionLoading !== null || (service.status === 'stopped' && service.id !== 'backend' && service.id !== 'supabase')}
          title={service.id === 'backend' || service.id === 'supabase' ? 'Durdur (Talimatlar gösterilecek)' : 'Durdur'}
        >
          <Square className="size-3" />
        </button>
        <button
          className="p-1 rounded hover:bg-yellow-500/20 text-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onAction(service.id, 'restart')}
          disabled={actionLoading !== null}
          title={service.id === 'backend' || service.id === 'supabase' ? 'Yeniden Başlat (Talimatlar gösterilecek)' : 'Yeniden Başlat'}
        >
          <RotateCw className="size-3" />
        </button>
      </div>
    </div>
  );
}

// ===== DATA FLOW HEALTH SECTION =====
interface DataFlowStatus {
  id: string;
  name: string;
  source: string;
  target: string;
  status: 'healthy' | 'degraded' | 'error' | 'checking';
  latency?: number;
  lastSync?: Date;
  recordCount?: number;
  errorMessage?: string;
}

function DataFlowHealthSection() {
  const [dataFlows, setDataFlows] = useState<DataFlowStatus[]>([
    { id: 'web-db', name: 'Web → Database', source: 'Website', target: 'Supabase', status: 'checking' },
    { id: 'db-web', name: 'Database → Web', source: 'Supabase', target: 'Website', status: 'checking' },
    { id: 'mobile-db', name: 'Mobil → Database', source: 'Expo App', target: 'Supabase', status: 'checking' },
    { id: 'db-mobile', name: 'Database → Mobil', source: 'Supabase', target: 'Expo App', status: 'checking' },
    { id: 'api-db', name: 'API-Football → DB', source: 'API-Football', target: 'Supabase', status: 'checking' },
    { id: 'realtime', name: 'Realtime Sync', source: 'Supabase Realtime', target: 'Clients', status: 'checking' },
  ]);
  const [isChecking, setIsChecking] = useState(false);
  const [dbStats, setDbStats] = useState<{
    totalUsers: number;
    totalPredictions: number;
    totalMatches: number;
    lastWrite: Date | null;
    lastRead: Date | null;
  } | null>(null);
  const [recentOperations, setRecentOperations] = useState<{
    type: 'read' | 'write';
    table: string;
    timestamp: Date;
    success: boolean;
    source: 'web' | 'mobile';
  }[]>([]);

  const checkDataFlowHealth = async () => {
    setIsChecking(true);
    const updatedFlows = [...dataFlows];

    // Simulate checking each flow
    for (let i = 0; i < updatedFlows.length; i++) {
      const flow = updatedFlows[i];
      const startTime = Date.now();
      
      try {
        // Check backend health as proxy for data flow
        if (flow.id === 'web-db' || flow.id === 'db-web') {
          const res = await fetch('http://localhost:3001/health', { signal: AbortSignal.timeout(3000) });
          const latency = Date.now() - startTime;
          updatedFlows[i] = {
            ...flow,
            status: res.ok ? 'healthy' : 'error',
            latency,
            lastSync: new Date(),
          };
        } else if (flow.id === 'mobile-db' || flow.id === 'db-mobile') {
          // Check if Expo is running (proxy for mobile)
          try {
            await fetch('http://localhost:8081', { signal: AbortSignal.timeout(2000), mode: 'no-cors' });
            const latency = Date.now() - startTime;
            updatedFlows[i] = {
              ...flow,
              status: 'healthy',
              latency,
              lastSync: new Date(),
            };
          } catch {
            updatedFlows[i] = {
              ...flow,
              status: 'degraded',
              errorMessage: 'Mobil uygulama çalışmıyor',
              lastSync: new Date(),
            };
          }
        } else if (flow.id === 'api-db') {
          // Check sync status
          try {
            const syncRes = await fetch('http://localhost:3001/api/sync-status', { signal: AbortSignal.timeout(3000) });
            const syncData = await syncRes.json();
            const latency = Date.now() - startTime;
            updatedFlows[i] = {
              ...flow,
              status: syncData.isRunning ? 'healthy' : 'degraded',
              latency,
              lastSync: syncData.lastSync ? new Date(syncData.lastSync) : new Date(),
              recordCount: syncData.totalApiCalls,
            };
          } catch {
            updatedFlows[i] = {
              ...flow,
              status: 'error',
              errorMessage: 'Sync servisi yanıt vermiyor',
            };
          }
        } else if (flow.id === 'realtime') {
          // Realtime is healthy if backend is running
          const backendFlow = updatedFlows.find(f => f.id === 'web-db');
          updatedFlows[i] = {
            ...flow,
            status: backendFlow?.status === 'healthy' ? 'healthy' : 'degraded',
            lastSync: new Date(),
          };
        }
      } catch (e) {
        updatedFlows[i] = {
          ...flow,
          status: 'error',
          errorMessage: 'Bağlantı hatası',
        };
      }
    }

    setDataFlows(updatedFlows);

    // Simulate DB stats
    setDbStats({
      totalUsers: Math.floor(Math.random() * 1000) + 500,
      totalPredictions: Math.floor(Math.random() * 10000) + 5000,
      totalMatches: Math.floor(Math.random() * 500) + 100,
      lastWrite: new Date(Date.now() - Math.random() * 60000),
      lastRead: new Date(Date.now() - Math.random() * 10000),
    });

    // Simulate recent operations
    const operations: typeof recentOperations = [];
    for (let i = 0; i < 10; i++) {
      operations.push({
        type: Math.random() > 0.3 ? 'read' : 'write',
        table: ['user_profiles', 'predictions', 'matches', 'badges', 'teams'][Math.floor(Math.random() * 5)],
        timestamp: new Date(Date.now() - i * Math.random() * 60000),
        success: Math.random() > 0.05,
        source: Math.random() > 0.5 ? 'web' : 'mobile',
      });
    }
    setRecentOperations(operations);

    setIsChecking(false);
  };

  useEffect(() => {
    checkDataFlowHealth();
    const interval = setInterval(checkDataFlowHealth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: DataFlowStatus['status']) => {
    switch (status) {
      case 'healthy': return <Check className="size-4 text-green-500" />;
      case 'degraded': return <AlertCircle className="size-4 text-yellow-500" />;
      case 'error': return <X className="size-4 text-red-500" />;
      case 'checking': return <RefreshCw className="size-4 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: DataFlowStatus['status']) => {
    switch (status) {
      case 'healthy': return 'border-green-500/30 bg-green-500/5';
      case 'degraded': return 'border-yellow-500/30 bg-yellow-500/5';
      case 'error': return 'border-red-500/30 bg-red-500/5';
      case 'checking': return 'border-blue-500/30 bg-blue-500/5';
    }
  };

  const healthyCount = dataFlows.filter(f => f.status === 'healthy').length;
  const totalFlows = dataFlows.length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="size-5" />
            Veri Akışı Sağlığı
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={healthyCount === totalFlows ? 'default' : 'destructive'}>
              {healthyCount}/{totalFlows} Sağlıklı
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={checkDataFlowHealth}
              disabled={isChecking}
            >
              <RefreshCw className={`size-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              Test Et
            </Button>
          </div>
        </div>
        <CardDescription>
          Veritabanı, web ve mobil arasındaki veri akışını izleyin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 overflow-hidden">
        {/* Data Flow Diagram */}
        <div className="relative bg-muted/20 rounded-lg p-4 overflow-hidden">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* Mobile */}
            <div className={`p-3 rounded-lg border-2 flex-shrink-0 ${dataFlows.find(f => f.id === 'mobile-db')?.status === 'healthy' ? 'border-green-500 bg-green-500/10' : dataFlows.find(f => f.id === 'mobile-db')?.status === 'error' ? 'border-red-500 bg-red-500/10' : 'border-yellow-500 bg-yellow-500/10'}`}>
              <Smartphone className="size-6 mx-auto mb-1" />
              <p className="text-xs font-medium text-center">Mobil</p>
            </div>

            {/* Arrow Mobile → DB */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`flex items-center ${dataFlows.find(f => f.id === 'mobile-db')?.status === 'healthy' ? 'text-green-500' : 'text-yellow-500'}`}>
                <div className="w-4 h-0.5 bg-current" />
                <ChevronRight className="size-3" />
              </div>
              <p className="text-[9px] text-muted-foreground">
                {dataFlows.find(f => f.id === 'mobile-db')?.latency || '?'}ms
              </p>
            </div>

            {/* Supabase */}
            <div className={`p-3 rounded-lg border-2 flex-shrink-0 ${dataFlows.filter(f => f.status === 'healthy').length > 4 ? 'border-green-500 bg-green-500/10' : 'border-yellow-500 bg-yellow-500/10'}`}>
              <Database className="size-6 mx-auto mb-1" />
              <p className="text-xs font-bold text-center">Supabase</p>
              {dbStats && (
                <p className="text-[9px] text-muted-foreground text-center">{dbStats.totalUsers} kullanıcı</p>
              )}
            </div>

            {/* Arrow DB → Web */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`flex items-center ${dataFlows.find(f => f.id === 'db-web')?.status === 'healthy' ? 'text-green-500' : 'text-yellow-500'}`}>
                <div className="w-4 h-0.5 bg-current" />
                <ChevronRight className="size-3" />
              </div>
              <p className="text-[9px] text-muted-foreground">
                {dataFlows.find(f => f.id === 'web-db')?.latency || '?'}ms
              </p>
            </div>

            {/* Web */}
            <div className={`p-3 rounded-lg border-2 flex-shrink-0 ${dataFlows.find(f => f.id === 'web-db')?.status === 'healthy' ? 'border-green-500 bg-green-500/10' : dataFlows.find(f => f.id === 'web-db')?.status === 'error' ? 'border-red-500 bg-red-500/10' : 'border-yellow-500 bg-yellow-500/10'}`}>
              <Monitor className="size-6 mx-auto mb-1" />
              <p className="text-xs font-medium text-center">Web</p>
            </div>
          </div>

          {/* API-Football Connection */}
          <div className="flex justify-center mt-3">
            <div className="flex items-center gap-2">
              <Globe className="size-5 text-accent" />
              <div className={`flex items-center ${dataFlows.find(f => f.id === 'api-db')?.status === 'healthy' ? 'text-green-500' : 'text-yellow-500'}`}>
                <div className="w-6 h-0.5 bg-current" />
                <ChevronRight className="size-4" />
              </div>
              <Database className="size-6" />
              <span className="text-xs text-muted-foreground ml-2">
                API-Football → DB ({dataFlows.find(f => f.id === 'api-db')?.recordCount || 0} çağrı)
              </span>
            </div>
          </div>
        </div>

        {/* Data Flow Status List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {dataFlows.map(flow => (
            <div
              key={flow.id}
              className={`p-3 rounded-lg border ${getStatusColor(flow.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(flow.status)}
                  <span className="text-sm font-medium">{flow.name}</span>
                </div>
                {flow.latency && (
                  <Badge variant="outline" className="text-xs">
                    {flow.latency}ms
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {flow.source} → {flow.target}
              </p>
              {flow.errorMessage && (
                <p className="text-xs text-red-500 mt-1">{flow.errorMessage}</p>
              )}
              {flow.lastSync && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Son: {flow.lastSync.toLocaleTimeString('tr-TR')}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Recent Operations */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Activity className="size-4" />
            Son Veritabanı İşlemleri
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {recentOperations.map((op, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-2 rounded text-xs ${op.success ? 'bg-muted/30' : 'bg-red-500/10'}`}
              >
                <div className="flex items-center gap-2">
                  {op.type === 'read' ? (
                    <Eye className="size-3 text-blue-500" />
                  ) : (
                    <Edit2 className="size-3 text-orange-500" />
                  )}
                  <span className="font-mono">{op.table}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {op.source}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {op.success ? (
                    <Check className="size-3 text-green-500" />
                  ) : (
                    <X className="size-3 text-red-500" />
                  )}
                  <span className="text-muted-foreground">
                    {op.timestamp.toLocaleTimeString('tr-TR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DB Stats Summary */}
        {dbStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold">{dbStats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">Kullanıcı</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold">{dbStats.totalPredictions}</p>
              <p className="text-xs text-muted-foreground">Tahmin</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold">{dbStats.totalMatches}</p>
              <p className="text-xs text-muted-foreground">Maç</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-sm font-medium">
                {dbStats.lastWrite?.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-muted-foreground">Son Yazma</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}