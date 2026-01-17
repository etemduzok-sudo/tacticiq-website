import { useState, useContext } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { ForgotPasswordModal } from '@/app/components/auth/ForgotPasswordModal';
import { AdminDataContext } from '@/contexts/AdminDataContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Separator } from '@/app/components/ui/separator';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Apple, Mail, Chrome, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { t } = useLanguage();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple, isLoading } = useUserAuth();
  const adminData = useContext(AdminDataContext);
  const authSettings = adminData?.sectionSettings?.auth;
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        // Yaş doğrulama (admin ayarına göre)
        const requireAge = authSettings?.requireAgeVerification ?? true;
        const minAge = authSettings?.minimumAge ?? 18;
        
        if (requireAge) {
          if (!birthDate) {
            toast.error(t('auth.error.ageRequired'));
            return;
          }
          
          const birth = new Date(birthDate);
          const today = new Date();
          const age = today.getFullYear() - birth.getFullYear();
          const monthDiff = today.getMonth() - birth.getMonth();
          
          if (age < minAge || (age === minAge && monthDiff < 0) || (age === minAge && monthDiff === 0 && today.getDate() < birth.getDate())) {
            toast.error(t('auth.error.ageRestriction'));
            return;
          }
        }
        
        if (password !== confirmPassword) {
          toast.error(t('auth.error.passwordMismatch'));
          return;
        }
        
        // Kullanım şartları onayı (admin ayarına göre)
        const requireTerms = authSettings?.requireTermsAcceptance ?? true;
        const requirePrivacy = authSettings?.requirePrivacyAcceptance ?? true;
        
        if ((requireTerms && !agreedToTerms) || (requirePrivacy && !agreedToPrivacy)) {
          toast.error(t('auth.error.termsRequired'));
          return;
        }
        
        // Kayıt işlemi - useUserAuth hook'u kullan
        const result = await signUpWithEmail(email, password, name);

        if (!result.success) {
          toast.error(result.error || t('auth.error.general'));
          return;
        }

        // If email confirmation is required, show info and keep modal open
        if (result.error && result.error.includes('doğrulama linki')) {
          toast.info(
            <div className="space-y-2">
              <p className="font-medium">{result.error}</p>
              <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                <span className="text-lg">📧</span>
                <div>
                  <p className="font-medium mb-1">E-postanızı kontrol edin</p>
                  <p>Eğer e-postayı göremiyorsanız, <strong className="text-foreground">spam klasörünüzü</strong> de kontrol etmeyi unutmayın.</p>
                </div>
              </div>
            </div>,
            { duration: 12000 }
          );
          // Don't close modal yet - user needs to check email
          return;
        }

        // If signup successful with session, wait a bit for auth state to update
        toast.success(t('auth.success.signup'));
        
        // Wait for session and profile to be loaded before closing modal
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Reset form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setName('');
        setBirthDate('');
        setAgreedToTerms(false);
        setAgreedToPrivacy(false);
        
        // Close modal after state is updated
        onOpenChange(false);
      } else {
        // Giriş işlemi - useUserAuth hook'u kullan
        const result = await signInWithEmail(email, password);

        if (!result.success) {
          toast.error(result.error || t('auth.error.general'));
          return;
        }

        toast.success(t('auth.success.signin'));
        onOpenChange(false);
        setEmail('');
        setPassword('');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || t('auth.error.general'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    // Admin ayarlarını kontrol et
    if (!(authSettings?.enableGoogleAuth ?? true)) {
      toast.error('Google ile giriş şu anda devre dışı.', {
        description: 'Lütfen e-posta ile kayıt olun.',
      });
      return;
    }
    
    const result = await signInWithGoogle();
    if (!result.success) {
      // Show user-friendly error message
      const errorMsg = result.error || t('auth.error.google');
      toast.error(errorMsg, {
        duration: 5000,
        description: 'Google ile giriş şu anda aktif değil. E-posta ile kayıt olabilirsiniz.',
      });
    }
  };

  const handleAppleAuth = async () => {
    // Admin ayarlarını kontrol et
    if (!(authSettings?.enableAppleAuth ?? false)) {
      toast.error('Apple ile giriş şu anda devre dışı.', {
        description: 'Lütfen e-posta ile kayıt olun.',
      });
      return;
    }
    
    const result = await signInWithApple();
    if (!result.success) {
      // Show user-friendly error message
      const errorMsg = result.error || t('auth.error.apple');
      toast.error(errorMsg, {
        duration: 5000,
        description: 'Apple ile giriş şu anda aktif değil. E-posta ile kayıt olabilirsiniz.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {mode === 'signin' ? t('auth.signin.title') : t('auth.signup.title')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === 'signin' ? t('auth.signin.subtitle') : t('auth.signup.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Social Auth Buttons */}
          <div className="space-y-3">
            {/* Google OAuth - Admin ayarlarına göre */}
            {(authSettings?.enableGoogleAuth ?? true) && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleAuth}
                disabled={loading || isLoading}
              >
                <Chrome className="mr-2 size-5" />
                {mode === 'signin' ? t('auth.google.signin') : t('auth.google.signup')}
              </Button>
            )}

            {/* Apple OAuth - Admin ayarlarına göre */}
            {(authSettings?.enableAppleAuth ?? false) && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAppleAuth}
                disabled={loading || isLoading}
              >
                <Apple className="mr-2 size-5" />
                {mode === 'signin' ? t('auth.apple.signin') : t('auth.apple.signup')}
              </Button>
            )}
          </div>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
              {t('auth.or')}
            </span>
          </div>

          {/* Email Auth Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name">{t('auth.name')}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t('auth.name.placeholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={mode === 'signup'}
                  disabled={loading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="auth-email">{t('auth.email')}</Label>
              <Input
                id="auth-email"
                type="email"
                placeholder={t('auth.email.placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password')}</Label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    {t('auth.forgotPassword') || 'Şifremi Unuttum'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.password.placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder={t('auth.confirmPassword.placeholder')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive">{t('auth.error.passwordMismatch')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">{t('auth.birthDate')}</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required={mode === 'signup'}
                    disabled={loading}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-muted-foreground">{t('auth.birthDate.helper')}</p>
                </div>
              </>
            )}

            {mode === 'signup' && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 rounded-lg bg-secondary/10 p-3 text-xs">
                  <ShieldCheck className="size-4 shrink-0 text-secondary mt-0.5" />
                  <p className="text-muted-foreground">
                    {t('auth.disclaimer')}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                      className="mt-1"
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      <span className="text-muted-foreground">
                        {t('auth.terms.checkbox')}{' '}
                        <a
                          href="/legal/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-semibold"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t('auth.terms.link')}
                        </a>
                      </span>
                    </label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="privacy"
                      checked={agreedToPrivacy}
                      onCheckedChange={(checked) => setAgreedToPrivacy(checked as boolean)}
                      className="mt-1"
                    />
                    <label
                      htmlFor="privacy"
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      <span className="text-muted-foreground">
                        {t('auth.privacy.checkbox')}{' '}
                        <a
                          href="/legal/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-semibold"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t('auth.privacy.link')}
                        </a>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              <Mail className="mr-2 size-4" />
              {mode === 'signin' ? t('auth.email.signin') : t('auth.email.signup')}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {mode === 'signin' ? t('auth.no_account') : t('auth.have_account')}
            </span>
            {' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-primary font-semibold hover:underline"
              disabled={loading}
            >
              {mode === 'signin' ? t('auth.signup.link') : t('auth.signin.link')}
            </button>
          </div>
        </div>
      </DialogContent>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal open={showForgotPassword} onOpenChange={setShowForgotPassword} />
    </Dialog>
  );
}