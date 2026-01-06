import { useState } from "react";
import { motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Trophy,
  Globe,
  Palette,
  Crown,
  Lock,
  Bell,
  LogOut,
  Check,
  Moon,
  Sun,
  Monitor,
  Info,
  Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";

interface ProfileSettingsProps {
  onBack: () => void;
  onNavigateToFavoriteTeams: () => void;
  onNavigateToLanguage: () => void;
  onLogout: () => void;
  onNavigateToChangePassword?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToDeleteAccount?: () => void;
  onNavigateToProUpgrade?: () => void;
}

type Theme = "dark" | "light" | "system";

export function ProfileSettings({
  onBack,
  onNavigateToFavoriteTeams,
  onNavigateToLanguage,
  onLogout,
  onNavigateToChangePassword,
  onNavigateToNotifications,
  onNavigateToDeleteAccount,
  onNavigateToProUpgrade,
}: ProfileSettingsProps) {
  const [name, setName] = useState("Ahmet Yılmaz");
  const [username, setUsername] = useState("ahmetyilmaz");
  const [theme, setTheme] = useState<Theme>("dark");
  const [hasChanges, setHasChanges] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isPro] = useState(false); // Change to true for PRO users

  const favoriteClubs = ["Galatasaray"];
  const favoriteNational = "Türkiye";
  const currentLanguage = "Türkçe";

  const handleNameChange = (value: string) => {
    setName(value);
    setHasChanges(true);
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setHasChanges(true);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setHasChanges(true);

    // Apply theme immediately
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System theme
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem("fan-manager-name", name);
    localStorage.setItem("fan-manager-username", username);
    localStorage.setItem("fan-manager-theme", theme);

    setHasChanges(false);
    toast.success("Değişiklikler kaydedildi! ✓", {
      description: "Profil bilgileriniz güncellendi.",
    });
  };

  const handleLogoutConfirm = () => {
    // Clear user data
    localStorage.removeItem("fan-manager-user");
    toast.success("Çıkış yapıldı", {
      description: "Güvenli bir şekilde çıkış yaptınız.",
    });
    onLogout();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (hasChanges) {
                if (confirm("Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?")) {
                  onBack();
                }
              } else {
                onBack();
              }
            }}
            className="text-foreground hover:text-[#059669] transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Profil Ayarları</h1>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 pb-32">
          {/* Basic Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-[#059669]" />
              <h3 className="font-semibold text-foreground">Temel Bilgiler</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">İsim Soy İsim</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Adınız ve soyadınız"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="username">Kullanıcı Adı</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="Kullanıcı adınız"
                  className="mt-2"
                />
              </div>
            </div>
          </motion.div>

          {/* Favorite Teams Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-[#059669]" />
              <h3 className="font-semibold text-foreground">Favori Takımlar</h3>
            </div>

            <div className="space-y-3">
              <button
                onClick={onNavigateToFavoriteTeams}
                className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Kulüpler</p>
                    <p className="text-xs text-muted-foreground">
                      {favoriteClubs.join(", ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {favoriteClubs.length}/{isPro ? 3 : 1}
                  </span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </button>

              <div className="h-px bg-border" />

              <button
                onClick={onNavigateToFavoriteTeams}
                className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Milli Takım</p>
                    <p className="text-xs text-muted-foreground">
                      {favoriteNational || "Opsiyonel"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Takım limitleri planınıza göre uygulanır. PRO kullanıcılar 3 kulüp seçebilir.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Language Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-[#059669]" />
              <h3 className="font-semibold text-foreground">Dil</h3>
            </div>

            <button
              onClick={onNavigateToLanguage}
              className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Uygulama Dili</p>
                  <p className="text-xs text-muted-foreground">{currentLanguage}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mt-3">
              <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Dil değişikliği uygulamayı yeniden başlatır.
              </p>
            </div>
          </motion.div>

          {/* Theme Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-[#059669]" />
              <h3 className="font-semibold text-foreground">Tema</h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "dark", name: "Koyu", icon: Moon },
                { id: "light", name: "Açık", icon: Sun },
                { id: "system", name: "Otomatik", icon: Monitor },
              ].map((themeOption) => {
                const Icon = themeOption.icon;
                const isSelected = theme === themeOption.id;

                return (
                  <button
                    key={themeOption.id}
                    onClick={() => handleThemeChange(themeOption.id as Theme)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-[#059669] bg-[#059669]/10"
                        : "border-border bg-muted/50 hover:border-[#059669]/50"
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? "text-[#059669]" : "text-muted-foreground"}`} />
                    <p className={`text-sm font-medium ${isSelected ? "text-[#059669]" : "text-foreground"}`}>
                      {themeOption.name}
                    </p>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#059669] mx-auto mt-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* PRO Membership Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`rounded-2xl p-6 border-2 ${
              isPro
                ? "bg-gradient-to-br from-[#F59E0B]/20 via-[#F59E0B]/10 to-transparent border-[#F59E0B]"
                : "bg-gradient-to-br from-[#F59E0B]/10 to-transparent border-[#F59E0B]/50"
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-[#F59E0B]" />
              <h3 className="font-semibold text-foreground">PRO Üyelik</h3>
            </div>

            {isPro ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">PRO Aktif</p>
                    <p className="text-sm text-muted-foreground">Premium özelliklerin keyfini çıkarın</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {["3 kulüp takibi", "Gelişmiş istatistikler", "Özel rozetler", "Öncelikli destek"].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-[#F59E0B]" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                <button className="w-full flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 rounded-xl hover:bg-white/70 dark:hover:bg-black/30 transition-colors">
                  <span className="text-sm font-medium text-foreground">Aboneliği Yönet</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#F59E0B]/20 to-[#D97706]/10 rounded-xl flex items-center justify-center border-2 border-[#F59E0B]/30">
                    <Crown className="w-6 h-6 text-[#F59E0B]" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">PRO'ya Geç</p>
                    <p className="text-sm text-muted-foreground">Premium özellikleri keşfedin</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {["• 3 kulüp takibi", "• Gelişmiş istatistikler", "• Özel rozetler"].map((feature) => (
                    <p key={feature} className="text-sm text-foreground">{feature}</p>
                  ))}
                </div>

                <Button className="w-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#F59E0B] text-white h-12 rounded-xl shadow-lg shadow-[#F59E0B]/30" onClick={onNavigateToProUpgrade}>
                  PRO Aç
                </Button>
              </div>
            )}
          </motion.div>

          {/* Account Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-[#059669]" />
              <h3 className="font-semibold text-foreground">Hesap</h3>
            </div>

            <div className="space-y-3">
              <button
                onClick={onNavigateToChangePassword}
                className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Şifre Değiştir</p>
                    <p className="text-xs text-muted-foreground">Güvenliğini artır</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button
                onClick={onNavigateToNotifications}
                className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Bildirimler</p>
                    <p className="text-xs text-muted-foreground">Maç uyarıları, haberler</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button
                onClick={() => setShowLogoutDialog(true)}
                className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-red-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-red-500">Çıkış Yap</p>
                    <p className="text-xs text-red-400">Oturumu kapat</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-500" />
              </button>

              <button
                onClick={onNavigateToDeleteAccount}
                className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-red-500">Hesabı Sil</p>
                    <p className="text-xs text-red-400">Kalıcı olarak sil</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-500" />
              </button>
            </div>
          </motion.div>
        </div>
      </ScrollArea>

      {/* Bottom Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="sticky bottom-0 z-50 bg-card/95 backdrop-blur-md border-t border-border p-4"
        >
          <Button
            onClick={handleSave}
            className="w-full bg-[#059669] hover:bg-[#059669]/90 text-white h-14 rounded-xl flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Kaydet
          </Button>
        </motion.div>
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border"
          >
            <h3 className="text-lg font-bold text-foreground mb-2">Çıkış Yap</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Oturumu kapatmak istediğinize emin misiniz?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowLogoutDialog(false)}
                variant="outline"
                className="flex-1 h-12 rounded-xl"
              >
                İptal
              </Button>
              <Button
                onClick={handleLogoutConfirm}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white h-12 rounded-xl"
              >
                Çıkış Yap
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}