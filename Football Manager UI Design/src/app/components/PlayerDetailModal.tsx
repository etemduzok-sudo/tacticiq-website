import { motion } from "motion/react";
import { X, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Progress } from "./ui/progress";

interface PlayerDetailModalProps {
  open: boolean;
  onClose: () => void;
}

const playerData = {
  name: "Mauro Icardi",
  position: "ST",
  number: 9,
  image: "https://api.dicebear.com/7.x/avataaars/svg?seed=icardi",
  value: "€15M",
  height: "181 cm",
  foot: "Sağ",
  age: 31,
  stats: {
    pace: 78,
    shooting: 89,
    passing: 75,
    dribbling: 82,
    defending: 35,
    physical: 80,
  },
  mental: {
    mentality: 88,
    sportsmanship: 72,
    discipline: 65,
  },
};

export function PlayerDetailModal({ open, onClose }: PlayerDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Oyuncu Detayları</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Player Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-[#059669]/20 to-transparent rounded-xl" />
            <div className="relative flex items-center gap-4 p-4">
              <div className="relative">
                <img
                  src={playerData.image}
                  alt={playerData.name}
                  className="w-24 h-24 rounded-full bg-[#059669] border-4 border-[#059669]/30"
                />
                <div className="absolute -bottom-2 -right-2 bg-[#059669] text-white w-10 h-10 rounded-full flex items-center justify-center">
                  {playerData.number}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl text-foreground">{playerData.name}</h3>
                <p className="text-muted-foreground">{playerData.position}</p>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="w-4 h-4 text-[#059669]" />
                  <span className="text-[#059669]">{playerData.value}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Physical Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Yaş</p>
              <p className="text-foreground">{playerData.age}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Boy</p>
              <p className="text-foreground">{playerData.height}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Ayak</p>
              <p className="text-foreground">{playerData.foot}</p>
            </div>
          </div>

          {/* Technical Stats */}
          <div>
            <h4 className="text-foreground mb-3">Teknik Özellikler</h4>
            <div className="space-y-3">
              {Object.entries(playerData.stats).map(([key, value]) => {
                const statNames: Record<string, string> = {
                  pace: "Hız",
                  shooting: "Şut",
                  passing: "Pas",
                  dribbling: "Dripling",
                  defending: "Defans",
                  physical: "Fizik",
                };
                
                const getStatColor = (val: number) => {
                  if (val >= 80) return "bg-[#059669]";
                  if (val >= 70) return "bg-[#F59E0B]";
                  return "bg-gray-500";
                };

                return (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-muted-foreground">{statNames[key]}</span>
                      <span className="text-sm text-foreground">{value}</span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className={`h-full ${getStatColor(value)} rounded-full`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mental Stats */}
          <div>
            <h4 className="text-foreground mb-3">Mental Durum</h4>
            <div className="space-y-3">
              {Object.entries(playerData.mental).map(([key, value]) => {
                const mentalNames: Record<string, string> = {
                  mentality: "Mentalite",
                  sportsmanship: "Centilmenlik",
                  discipline: "Disiplin",
                };

                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <span className="text-sm text-muted-foreground">{mentalNames[key]}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-background rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${value}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className="h-full bg-[#059669] rounded-full"
                        />
                      </div>
                      <span className="text-sm text-foreground w-8">{value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overall Rating */}
          <div className="bg-gradient-to-r from-[#059669]/10 to-transparent p-4 rounded-xl border border-[#059669]/20">
            <div className="flex items-center justify-between">
              <span className="text-foreground">Genel Değerlendirme</span>
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#059669] flex items-center justify-center">
                  <span className="text-white text-xl">85</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
