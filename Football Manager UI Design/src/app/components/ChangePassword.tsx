import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Lock, Eye, EyeOff, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

interface ChangePasswordProps {
  onBack: () => void;
}

export function ChangePassword({ onBack }: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Tüm alanları doldurun");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Yeni şifre en az 6 karakter olmalı");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }

    // Mock password change
    toast.success("Şifre başarıyla değiştirildi! ✓", {
      description: "Yeni şifrenizle giriş yapabilirsiniz.",
    });

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    
    setTimeout(() => {
      onBack();
    }, 1000);
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
          <h1 className="text-lg font-semibold text-foreground">Şifre Değiştir</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between p-6">
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Current Password */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-[#059669]" />
              <h3 className="font-semibold text-foreground">Mevcut Şifre</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current">Mevcut Şifreniz</Label>
              <div className="relative">
                <Input
                  id="current"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Mevcut şifrenizi girin"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* New Password */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-[#059669]" />
              <h3 className="font-semibold text-foreground">Yeni Şifre</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="new">Yeni Şifreniz</Label>
                <div className="relative mt-2">
                  <Input
                    id="new"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirm">Şifre Tekrarı</Label>
                <div className="relative mt-2">
                  <Input
                    id="confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Yeni şifrenizi tekrar girin"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium text-foreground mb-2">Şifre gereksinimleri:</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 6 ? 'bg-[#059669]' : 'bg-muted-foreground'}`} />
                  En az 6 karakter
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${newPassword === confirmPassword && newPassword ? 'bg-[#059669]' : 'bg-muted-foreground'}`} />
                  Şifreler eşleşmeli
                </li>
              </ul>
            </div>
          </div>
        </motion.form>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6"
        >
          <Button
            onClick={handleSubmit}
            className="w-full bg-[#059669] hover:bg-[#059669]/90 text-white h-[50px] rounded-xl flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Şifreyi Değiştir
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
