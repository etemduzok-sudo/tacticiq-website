import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Crown, Check, Zap, Trophy, Star, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";

interface ProUpgradeProps {
  onBack: () => void;
}

export function ProUpgrade({ onBack }: ProUpgradeProps) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");

  const plans = [
    {
      id: "monthly",
      name: "Aylık",
      price: "₺49.99",
      period: "/ay",
      savings: null,
    },
    {
      id: "yearly",
      name: "Yıllık",
      price: "₺399.99",
      period: "/yıl",
      savings: "%33 tasarruf",
    },
  ];

  const features = [
    {
      icon: Trophy,
      title: "3 Kulüp Takibi",
      description: "En sevdiğiniz 3 kulübü takip edin (Free: sadece 1)",
      color: "text-[#059669]",
    },
    {
      icon: TrendingUp,
      title: "Gelişmiş İstatistikler",
      description: "Detaylı performans analizi ve tahmin geçmişi",
      color: "text-[#059669]",
    },
    {
      icon: Star,
      title: "Özel Rozetler",
      description: "PRO kullanıcılara özel başarı rozetleri",
      color: "text-[#F59E0B]",
    },
    {
      icon: Zap,
      title: "Öncelikli Destek",
      description: "Sorunlarınız için 24 saat içinde yanıt",
      color: "text-[#F59E0B]",
    },
  ];

  const handleUpgrade = () => {
    toast.success("Ödeme işlemi başlatılıyor...", {
      description: "Ödeme sayfasına yönlendiriliyorsunuz.",
    });

    // Mock payment process
    setTimeout(() => {
      toast.success("🎉 PRO üyeliğiniz aktif!", {
        description: "Premium özelliklerin keyfini çıkarın.",
      });
    }, 2000);
  };

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
          <h1 className="text-lg font-semibold text-foreground">PRO Üyelik</h1>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 pb-32">
          {/* Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-gradient-to-br from-[#F59E0B]/20 via-[#F59E0B]/10 to-transparent border-2 border-[#F59E0B] rounded-2xl p-8 overflow-hidden"
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />

            <div className="relative text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#F59E0B]/30">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Fan Manager PRO
              </h2>
              <p className="text-sm text-muted-foreground">
                Premium özellikleriyle tahminlerinizi bir üst seviyeye taşıyın
              </p>
            </div>
          </motion.div>

          {/* Plan Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="font-semibold text-foreground mb-4">Plan Seçin</h3>

            <div className="grid grid-cols-2 gap-3">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id as "monthly" | "yearly")}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-[#F59E0B] bg-[#F59E0B]/10"
                        : "border-border bg-muted/50 hover:border-[#F59E0B]/50"
                    }`}
                  >
                    {plan.savings && (
                      <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-[#059669] text-white text-xs font-medium rounded-full">
                        {plan.savings}
                      </div>
                    )}
                    <p className="text-sm font-medium text-foreground mb-1">
                      {plan.name}
                    </p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-xl font-bold text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {plan.period}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-[#F59E0B] mx-auto mt-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="font-semibold text-foreground mb-4">
              PRO ile Neler Kazanıyorsunuz?
            </h3>

            <div className="space-y-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="flex gap-4 p-4 bg-muted/30 rounded-xl"
                  >
                    <div className={`w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 ${feature.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        {feature.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="font-semibold text-foreground mb-4">Free vs PRO</h3>

            <div className="space-y-3">
              {[
                { feature: "Kulüp takibi", free: "1 kulüp", pro: "3 kulüp" },
                { feature: "İstatistikler", free: "Basit", pro: "Gelişmiş" },
                { feature: "Rozetler", free: "Standart", pro: "Özel" },
                { feature: "Destek", free: "E-posta", pro: "Öncelikli" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg text-xs"
                >
                  <span className="font-medium text-foreground">
                    {item.feature}
                  </span>
                  <span className="text-center text-muted-foreground">
                    {item.free}
                  </span>
                  <span className="text-center text-[#F59E0B] font-medium">
                    {item.pro}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="font-semibold text-foreground mb-4">
              Sıkça Sorulan Sorular
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  İptal edebilir miyim?
                </p>
                <p className="text-xs text-muted-foreground">
                  Evet, istediğiniz zaman iptal edebilirsiniz. İptal sonrası süre dolana kadar PRO özelliklerini kullanabilirsiniz.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Ödeme güvenli mi?
                </p>
                <p className="text-xs text-muted-foreground">
                  Tüm ödemeler SSL sertifikalı güvenli bağlantı üzerinden işlenir.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Yıllık plan daha avantajlı mı?
                </p>
                <p className="text-xs text-muted-foreground">
                  Evet, yıllık plan ile %33 tasarruf edersiniz ve tek seferde ödeme yaparsınız.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </ScrollArea>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 z-50 bg-card/95 backdrop-blur-md border-t border-border p-4">
        <div className="mb-3 text-center">
          <p className="text-xs text-muted-foreground">
            {selectedPlan === "yearly" ? "Yıllık" : "Aylık"} plan ile devam ediyorsunuz
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {selectedPlan === "yearly" ? "₺399.99/yıl" : "₺49.99/ay"}
          </p>
        </div>
        <Button
          onClick={handleUpgrade}
          className="w-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#F59E0B] text-white h-[50px] rounded-xl shadow-lg shadow-[#F59E0B]/30 flex items-center justify-center gap-2"
        >
          <Crown className="w-5 h-5" />
          PRO'ya Geç
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-2">
          7 gün para iade garantisi
        </p>
      </div>
    </div>
  );
}
