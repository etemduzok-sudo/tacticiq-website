import { useState } from "react";
import { motion } from "motion/react";
import { Settings, Camera, Trophy, Flame, Star, Crown, TrendingUp, ChevronLeft, Zap, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "./ui/drawer";

interface ProfileProps {
  onBack: () => void;
  onSettings: () => void;
  onProUpgrade?: () => void;
}

const achievements = [
  { id: "winner", icon: "🏆", name: "Winner", description: "10 doğru tahmin" },
  { id: "streak", icon: "🔥", name: "Streak Master", description: "5 gün üst üste" },
  { id: "expert", icon: "⭐", name: "Expert", description: "Level 10'a ulaştı" },
];

const favoriteTeams = [
  { id: "gs", name: "Galatasaray" },
  { id: "rm", name: "Real Madrid" },
  { id: "tr", name: "Türkiye" },
];

export function Profile({ onBack, onSettings, onProUpgrade }: ProfileProps) {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isPro] = useState(false); // Change to true for PRO users

  const user = {
    name: "Ahmet Yılmaz",
    username: "@ahmetyilmaz",
    email: "ahmet@example.com",
    avatar: "",
    level: 12,
    points: 3450,
    countryRank: 156,
    totalPlayers: 2365,
    country: "Türkiye",
    avgMatchRating: 7.8,
    xpGainThisWeek: 245,
    stats: {
      success: 68.5,
      total: 142,
      streak: 5,
    },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-foreground hover:text-[#059669] transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-foreground absolute left-1/2 -translate-x-1/2">Profile</h1>
          <button
            onClick={onSettings}
            className="text-foreground hover:text-[#059669] transition-colors"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 pb-24">
          {/* Profile Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#059669]/10 to-transparent border border-[#059669]/20 rounded-2xl p-6"
          >
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-4 border-[#059669]">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-[#059669] to-[#047857] text-white">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => setShowAvatarPicker(true)}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-[#059669] text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Name & Username */}
              <h2 className="text-2xl font-bold text-foreground mt-4">{user.name}</h2>
              <p className="text-muted-foreground">{user.username}</p>

              {/* Plan Badge */}
              {isPro ? (
                <div className="mt-3 px-4 py-1.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white rounded-full flex items-center gap-2 shadow-lg">
                  <Crown className="w-4 h-4" />
                  <span className="font-medium">PRO</span>
                </div>
              ) : (
                <div className="mt-3 px-4 py-1.5 bg-muted border border-border text-muted-foreground rounded-full flex items-center gap-2">
                  <span className="font-medium">Free</span>
                </div>
              )}

              {/* Level & Points */}
              <div className="flex items-center gap-6 mt-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Level</p>
                  <p className="text-2xl font-bold text-[#059669]">{user.level}</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Points</p>
                  <p className="text-2xl font-bold text-foreground">{user.points.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Performance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#059669]" />
              <h3 className="font-semibold text-foreground">Performance</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <p className="text-2xl font-bold text-[#059669] mb-1">
                  {user.stats.success}%
                </p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <p className="text-2xl font-bold text-foreground mb-1">
                  {user.stats.total}
                </p>
                <p className="text-xs text-muted-foreground">Total Predictions</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <p className="text-2xl font-bold text-[#F59E0B] mb-1">
                  {user.stats.streak}
                </p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>

            {/* Country Ranking */}
            <div className="mt-4 p-4 bg-gradient-to-r from-[#059669]/10 to-transparent border border-[#059669]/20 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{user.country} Sıralaması</p>
                  <p className="text-xl font-bold text-[#059669]">
                    #{user.countryRank.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Toplam Oyuncu</p>
                  <p className="text-xl font-bold text-foreground">
                    {user.totalPlayers.toLocaleString()}
                  </p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#059669] to-[#047857] rounded-full transition-all duration-500"
                  style={{ width: `${((user.totalPlayers - user.countryRank) / user.totalPlayers) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Top {((user.countryRank / user.totalPlayers) * 100).toFixed(1)}%
              </p>
            </div>

            {/* Additional Metrics */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <Award className="w-4 h-4 text-[#F59E0B]" />
                <div>
                  <p className="text-xs text-muted-foreground">Avg Rating</p>
                  <p className="font-bold text-foreground">{user.avgMatchRating}</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <Zap className="w-4 h-4 text-[#059669]" />
                <div>
                  <p className="text-xs text-muted-foreground">XP This Week</p>
                  <p className="font-bold text-foreground">+{user.xpGainThisWeek}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Favorite Teams Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-[#059669]" />
              <h3 className="font-semibold text-foreground">Favorite Teams</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {favoriteTeams.map((team) => (
                <div
                  key={team.id}
                  className="px-4 py-2 bg-[#059669]/10 border border-[#059669]/20 text-[#059669] rounded-full text-sm flex items-center gap-2"
                >
                  <div className="w-2 h-2 bg-[#059669] rounded-full" />
                  <span>{team.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Achievements Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-[#F59E0B]" />
              <h3 className="font-semibold text-foreground">Achievements</h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="text-center p-4 bg-gradient-to-br from-[#F59E0B]/10 to-transparent border border-[#F59E0B]/20 rounded-xl"
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <p className="text-xs font-medium text-foreground mb-1">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* PRO Upgrade Card (for Free users) */}
          {!isPro && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-[#F59E0B]/20 via-[#F59E0B]/10 to-transparent border-2 border-[#F59E0B] rounded-2xl p-6 relative overflow-hidden"
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Upgrade to PRO</h3>
                    <p className="text-sm text-muted-foreground">Unlock premium features</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {[
                    "3 favorite clubs",
                    "Advanced statistics",
                    "Exclusive badges",
                    "Priority support",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button className="w-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#F59E0B] text-white h-12 rounded-xl shadow-lg shadow-[#F59E0B]/30" onClick={onProUpgrade}>
                  Learn More
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Avatar Picker Drawer */}
      <Drawer open={showAvatarPicker} onOpenChange={setShowAvatarPicker}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Profil Fotoğrafı Değiştir</DrawerTitle>
            <DrawerDescription>
              Yeni bir profil fotoğrafı yükleyin veya mevcut fotoğrafınızı değiştirin.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-6 space-y-3">
            <Button className="w-full h-12 rounded-xl" variant="outline">
              📷 Fotoğraf Çek
            </Button>
            <Button className="w-full h-12 rounded-xl" variant="outline">
              🖼️ Galeriden Seç
            </Button>
            <Button className="w-full h-12 rounded-xl" variant="outline">
              🎨 Avatar Oluştur
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}