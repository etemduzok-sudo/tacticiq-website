import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Bell, Trophy, Flag, TrendingUp, Mail } from "lucide-react";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";

interface NotificationsProps {
  onBack: () => void;
}

export function Notifications({ onBack }: NotificationsProps) {
  const [matchReminders, setMatchReminders] = useState(true);
  const [teamNews, setTeamNews] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const handleToggle = (type: string, value: boolean) => {
    switch (type) {
      case "match":
        setMatchReminders(value);
        break;
      case "team":
        setTeamNews(value);
        break;
      case "stats":
        setWeeklyStats(value);
        break;
      case "email":
        setEmailNotifications(value);
        break;
    }

    toast.success("Bildirim ayarları güncellendi");
  };

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
        enabled ? "bg-[#059669]" : "bg-muted"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-foreground hover:text-[#059669] transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Bildirimler</h1>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 pb-24">
          {/* Match Reminders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-[#059669]" />
              <h3 className="font-semibold text-foreground">Maç Bildirimleri</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Label className="text-sm font-medium text-foreground">Maç Hatırlatıcıları</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Favori takımlarınızın maçlarından önce bildirim alın
                  </p>
                </div>
                <ToggleSwitch
                  enabled={matchReminders}
                  onChange={(value) => handleToggle("match", value)}
                />
              </div>

              {matchReminders && (
                <div className="pl-4 border-l-2 border-[#059669]/20 space-y-2">
                  <p className="text-xs text-muted-foreground">• Maçtan 1 saat önce</p>
                  <p className="text-xs text-muted-foreground">• Maç başladığında</p>
                  <p className="text-xs text-muted-foreground">• Maç bittiğinde</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Team News */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Flag className="w-5 h-5 text-[#059669]" />
              <h3 className="font-semibold text-foreground">Takım Haberleri</h3>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium text-foreground">Takım Güncellemeleri</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Favori takımlarınız hakkında transfer ve haberler
                </p>
              </div>
              <ToggleSwitch
                enabled={teamNews}
                onChange={(value) => handleToggle("team", value)}
              />
            </div>
          </motion.div>

          {/* Weekly Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#059669]" />
              <h3 className="font-semibold text-foreground">İstatistikler</h3>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium text-foreground">Haftalık Özet</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Haftalık performans özetinizi her Pazartesi alın
                </p>
              </div>
              <ToggleSwitch
                enabled={weeklyStats}
                onChange={(value) => handleToggle("stats", value)}
              />
            </div>
          </motion.div>

          {/* Email Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-[#059669]" />
              <h3 className="font-semibold text-foreground">E-posta Bildirimleri</h3>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium text-foreground">E-posta ile Bildir</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Bildirimleri e-posta olarak da alın
                </p>
              </div>
              <ToggleSwitch
                enabled={emailNotifications}
                onChange={(value) => handleToggle("email", value)}
              />
            </div>
          </motion.div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4"
          >
            <p className="text-xs text-muted-foreground">
              💡 <strong>İpucu:</strong> Bildirim ayarlarınızı cihaz ayarlarından da yönetebilirsiniz.
            </p>
          </motion.div>
        </div>
      </ScrollArea>
    </div>
  );
}
