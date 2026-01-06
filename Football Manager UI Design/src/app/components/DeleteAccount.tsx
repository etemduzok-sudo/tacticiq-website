import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

interface DeleteAccountProps {
  onBack: () => void;
  onDeleteConfirm: () => void;
}

export function DeleteAccount({ onBack, onDeleteConfirm }: DeleteAccountProps) {
  const [confirmText, setConfirmText] = useState("");
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  const handleDelete = () => {
    if (confirmText.toLowerCase() !== "sil") {
      toast.error("Lütfen 'SIL' yazarak onaylayın");
      return;
    }

    setShowFinalConfirm(true);
  };

  const handleFinalConfirm = () => {
    toast.success("Hesabınız silindi", {
      description: "Verileriniz kalıcı olarak silindi.",
    });

    setTimeout(() => {
      onDeleteConfirm();
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
          <h1 className="text-lg font-semibold text-foreground">Hesabı Sil</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Warning Card */}
          <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Dikkat!</h3>
                <p className="text-sm text-red-500">Bu işlem geri alınamaz</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-foreground">
                Hesabınızı sildiğinizde aşağıdaki veriler <strong>kalıcı olarak</strong> silinecektir:
              </p>

              <div className="space-y-2">
                {[
                  "Tüm tahminleriniz ve istatistikleriniz",
                  "Seviye, puan ve rozetleriniz",
                  "Favori takımlarınız",
                  "Profil bilgileriniz",
                  "PRO üyeliğiniz (varsa)",
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alternative Options */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold text-foreground mb-4">Alternatif Seçenekler</h3>
            
            <div className="space-y-3">
              <div className="p-4 bg-muted/50 rounded-xl">
                <p className="text-sm font-medium text-foreground mb-1">
                  Sadece veri silmek isterseniz
                </p>
                <p className="text-xs text-muted-foreground">
                  Tahminlerinizi ve istatistiklerinizi sıfırlayabilirsiniz
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-xl">
                <p className="text-sm font-medium text-foreground mb-1">
                  Mola vermek isterseniz
                </p>
                <p className="text-xs text-muted-foreground">
                  Bildirimleri kapatıp daha sonra geri dönebilirsiniz
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-foreground">Hesabı Kalıcı Olarak Sil</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="confirm">
                  Devam etmek için <strong>SIL</strong> yazın
                </Label>
                <Input
                  id="confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="SIL"
                  className="mt-2"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Bu işlem <strong>geri alınamaz</strong> ve tüm verileriniz kalıcı olarak silinecektir.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Delete Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6"
        >
          <Button
            onClick={handleDelete}
            disabled={confirmText.toLowerCase() !== "sil"}
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white h-[50px] rounded-xl flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Hesabı Kalıcı Olarak Sil
          </Button>
        </motion.div>
      </div>

      {/* Final Confirmation Dialog */}
      {showFinalConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Son Onay</h3>
              <p className="text-sm text-muted-foreground">
                Hesabınızı silmek üzeresiniz. Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowFinalConfirm(false)}
                variant="outline"
                className="flex-1 h-12 rounded-xl"
              >
                İptal
              </Button>
              <Button
                onClick={handleFinalConfirm}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white h-12 rounded-xl"
              >
                Evet, Sil
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
