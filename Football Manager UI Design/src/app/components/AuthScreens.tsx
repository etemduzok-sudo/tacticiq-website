import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, Shield, Mail, Lock, Apple, User, ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";

interface AuthScreensProps {
  onAuthComplete: () => void;
  onForgotPassword?: () => void;
  onNavigateToLegal: (documentType: string) => void;
  onBackToLanguage: () => void;
}

export function AuthScreens({ onAuthComplete, onForgotPassword, onNavigateToLegal, onBackToLanguage }: AuthScreensProps) {
  const [showRegisterScreen, setShowRegisterScreen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form
  const [username, setUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSocialLogin = (provider: string) => {
    toast.success(`${provider} ile giriş yapılıyor...`, {
      description: "Lütfen bekleyin.",
    });
    setTimeout(() => {
      onAuthComplete();
    }, 1500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }

    toast.success("Giriş başarılı!", {
      description: "Hoş geldiniz!",
    });
    
    setTimeout(() => {
      onAuthComplete();
    }, 1000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !registerEmail || !registerPassword || !confirmPassword) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }

    if (registerPassword !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }

    if (!agreedToTerms) {
      toast.error("Kullanım koşullarını kabul etmelisiniz");
      return;
    }

    toast.success("Kayıt başarılı!", {
      description: "Hoş geldiniz!",
    });
    
    setTimeout(() => {
      onAuthComplete();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] flex items-center justify-center px-4 py-8 relative">
      {/* Back Button - Absolute Position - Login Screen */}
      {!showRegisterScreen && (
        <button
          onClick={onBackToLanguage}
          className="absolute top-8 left-4 text-[#059669] hover:text-[#059669]/80 transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Back Button - Absolute Position - Register Screen */}
      {showRegisterScreen && (
        <button
          onClick={() => setShowRegisterScreen(false)}
          className="absolute top-8 left-4 text-[#059669] hover:text-[#059669]/80 transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Footer - Absolute Position - Same on All Pages */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-xs text-gray-500">© 2026 Fan Manager. Tüm hakları saklıdır.</p>
      </div>

      <AnimatePresence mode="wait">
        {!showRegisterScreen ? (
          // LOGIN SCREEN
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            {/* Logo */}
            <div className="flex flex-col items-center mb-12">
              <Shield className="w-24 h-24 text-[#F59E0B] mb-4" strokeWidth={1} />
              <h1 className="text-4xl text-white flex items-center justify-center gap-0">
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
              <p className="text-gray-400 mt-2">Hoş Geldiniz</p>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3 mb-4">
              <Button
                type="button"
                onClick={() => handleSocialLogin("Google")}
                className="w-full bg-white hover:bg-gray-50 text-gray-800 flex items-center justify-center gap-3 h-[50px] rounded-xl transition-all shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google ile Giriş
              </Button>
              <Button
                type="button"
                onClick={() => handleSocialLogin("Apple")}
                className="w-full bg-black hover:bg-gray-900 text-white flex items-center justify-center gap-3 h-[50px] rounded-xl transition-all border border-white/10"
              >
                <Apple className="w-5 h-5" />
                Apple ile Giriş
              </Button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
              <span className="text-gray-500 text-sm">veya</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2 text-sm">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#059669]" />
                  <Input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full h-[50px] bg-[#0F172A]/50 border-[#059669]/30 text-white pl-11 pr-4 rounded-xl focus:border-[#059669] transition-colors"
                    placeholder="ornek@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-2 text-sm">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#059669]" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full h-[50px] bg-[#0F172A]/50 border-[#059669]/30 text-white pl-11 pr-11 rounded-xl focus:border-[#059669] transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#059669] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-[#059669] hover:text-[#059669]/80 transition-colors text-sm"
                >
                  Şifremi Unuttum?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#059669] text-white h-[50px] rounded-xl transition-all shadow-lg shadow-[#059669]/20"
              >
                Giriş Yap
              </Button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Hesabınız yok mu?{" "}
                <button
                  onClick={() => setShowRegisterScreen(true)}
                  className="text-[#059669] hover:text-[#059669]/80 transition-colors font-medium"
                >
                  Kayıt Ol
                </button>
              </p>
            </div>
          </motion.div>
        ) : (
          // REGISTER SCREEN
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
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
              <p className="text-gray-400 mt-1 text-sm">Kayıt Ol</p>
            </div>

            {/* Social Register Buttons */}
            <div className="space-y-2.5 mb-3">
              <Button
                type="button"
                onClick={() => handleSocialLogin("Google")}
                className="w-full bg-white hover:bg-gray-50 text-gray-800 flex items-center justify-center gap-3 h-[50px] rounded-xl transition-all shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google ile Kayıt
              </Button>
              <Button
                type="button"
                onClick={() => handleSocialLogin("Apple")}
                className="w-full bg-black hover:bg-gray-900 text-white flex items-center justify-center gap-3 h-[50px] rounded-xl transition-all border border-white/10"
              >
                <Apple className="w-5 h-5" />
                Apple ile Kayıt
              </Button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
              <span className="text-gray-500 text-sm">veya</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
            </div>

            {/* Register Form */}
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#059669]" />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-[50px] bg-[#0F172A]/50 border-[#059669]/30 text-white pl-11 pr-4 rounded-xl focus:border-[#059669] transition-colors"
                  placeholder="Kullanıcı adı"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#059669]" />
                <Input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="w-full h-[50px] bg-[#0F172A]/50 border-[#059669]/30 text-white pl-11 pr-4 rounded-xl focus:border-[#059669] transition-colors"
                  placeholder="E-posta"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#059669]" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="w-full h-[50px] bg-[#0F172A]/50 border-[#059669]/30 text-white pl-11 pr-11 rounded-xl focus:border-[#059669] transition-colors"
                  placeholder="Şifre"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#059669] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#059669]" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-[50px] bg-[#0F172A]/50 border-[#059669]/30 text-white pl-11 pr-11 rounded-xl focus:border-[#059669] transition-colors"
                  placeholder="Şifre tekrar"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#059669] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-sm text-gray-400 leading-tight">
                  <button
                    type="button"
                    onClick={() => onNavigateToLegal("terms")}
                    className="text-[#059669] hover:text-[#059669]/80 transition-colors"
                  >
                    Kullanım Koşulları
                  </button>
                  {" "}ve{" "}
                  <button
                    type="button"
                    onClick={() => onNavigateToLegal("privacy")}
                    className="text-[#059669] hover:text-[#059669]/80 transition-colors"
                  >
                    Gizlilik Politikası
                  </button>
                  'nı okudum ve kabul ediyorum
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#059669] text-white h-[50px] rounded-xl transition-all shadow-lg shadow-[#059669]/20"
              >
                Kayıt Ol
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-4 text-center">
              <p className="text-gray-400 text-sm">
                Zaten hesabınız var mı?{" "}
                <button
                  onClick={() => setShowRegisterScreen(false)}
                  className="text-[#059669] hover:text-[#059669]/80 transition-colors font-medium"
                >
                  Giriş Yap
                </button>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}