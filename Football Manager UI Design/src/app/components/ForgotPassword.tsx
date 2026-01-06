import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Mail, RotateCcw, CheckCircle2, HelpCircle, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";

interface ForgotPasswordProps {
  onBack: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendEmail = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Geçersiz email adresi", {
        description: "Lütfen geçerli bir email adresi girin.",
      });
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsEmailSent(true);
    
    toast.success("Email gönderildi!", {
      description: "Şifre sıfırlama bağlantısını kontrol edin.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] flex flex-col items-center justify-center px-4 py-8 relative">
      {/* Back Button - Absolute Position - Same as Login */}
      <button
        onClick={onBack}
        className="absolute top-8 left-4 text-[#059669] hover:text-[#059669]/80 transition-colors z-10"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Footer - Absolute Position - Same as All Pages */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-xs text-gray-500">© 2026 Fan Manager. Tüm hakları saklıdır.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {!isEmailSent ? (
          <>
            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <Shield className="w-20 h-20 text-[#F59E0B] mb-3" strokeWidth={1} />
              <h1 className="text-3xl text-white flex items-center justify-center gap-0">
                <span>Fan Manager 2</span>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="inline-block scale-[0.7] -mx-[5px]"
                >
                  ⚽
                </motion.span>
                <span>26</span>
              </h1>
              <p className="text-gray-400 mt-1 text-sm">Şifre Sıfırlama</p>
            </div>

            {/* Spacer to align with Register page (matches social buttons + divider height) */}
            <div className="h-[154px]"></div>

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendEmail(); }} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#059669]" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[50px] bg-[#0F172A]/50 border-[#059669]/30 text-white pl-11 pr-4 rounded-xl focus:border-[#059669] transition-colors"
                  placeholder="E-posta"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#059669] text-white h-[50px] rounded-xl transition-all shadow-lg shadow-[#059669]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <RotateCcw className="w-5 h-5 animate-spin" />
                      <span>Gönderiliyor...</span>
                    </div>
                  ) : (
                    "Şifre Sıfırlama Linki Gönder"
                  )}
                </Button>
              </div>
            </form>

            {/* Back to Login */}
            <div className="mt-4 text-center">
              <p className="text-gray-400 text-sm">
                Şifrenizi hatırladınız mı?{" "}
                <button
                  onClick={onBack}
                  className="text-[#059669] hover:text-[#059669]/80 transition-colors font-medium"
                >
                  Giriş Yap
                </button>
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <Shield className="w-20 h-20 text-[#F59E0B] mb-3" strokeWidth={1} />
              <h1 className="text-3xl text-white flex items-center justify-center gap-0">
                <span>Fan Manager 2</span>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="inline-block scale-[0.7] -mx-[5px]"
                >
                  ⚽
                </motion.span>
                <span>26</span>
              </h1>
              <p className="text-gray-400 mt-1 text-sm">Şifre Sıfırlama</p>
            </div>

            {/* Success Message */}
            <div className="bg-[#0F172A]/50 border border-[#059669]/30 rounded-xl p-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <CheckCircle2 className="w-16 h-16 text-[#059669] mx-auto mb-3" />
              </motion.div>
              <h2 className="text-xl text-white mb-2">Email Gönderildi!</h2>
              <p className="text-gray-400 text-sm mb-4">
                Şifre sıfırlama bağlantısı <span className="text-white font-medium">{email}</span> adresine gönderildi.
              </p>
              <div className="bg-[#059669]/10 border border-[#059669]/20 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2 text-left">
                  <HelpCircle className="w-4 h-4 text-[#059669] flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-300">
                    <p className="mb-1">Email gelmediyse:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-400">
                      <li>Spam klasörünü kontrol edin</li>
                      <li>Email adresini doğru yazdığınızdan emin olun</li>
                    </ul>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setIsEmailSent(false)}
                variant="outline"
                className="w-full h-[50px] border-[#059669]/30 text-[#059669] hover:bg-[#059669]/10 rounded-xl"
              >
                Tekrar Dene
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}