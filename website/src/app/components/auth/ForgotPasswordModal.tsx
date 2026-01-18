/**
 * Forgot Password Component
 * Kullanıcıların şifre sıfırlama isteği göndermesini sağlar
 * Supabase Auth ile entegre çalışır
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const { t } = useLanguage();
  const { resetPassword, isLoading: authLoading } = useUserAuth();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error(t('forgotPassword.errors.emailRequired') || 'Email adresinizi girin');
      return;
    }

    if (!validateEmail(email)) {
      toast.error(t('forgotPassword.errors.invalidEmail') || 'Geçerli bir email adresi girin');
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(email);
      
      if (result.success) {
        setEmailSent(true);
        toast.success(t('forgotPassword.success') || 'Şifre sıfırlama bağlantısı email adresinize gönderildi!');
      } else {
        toast.error(result.error || t('forgotPassword.errors.general') || 'Bir hata oluştu');
      }
    } catch (err: any) {
      toast.error(err.message || t('forgotPassword.errors.general') || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setEmailSent(false);
    onOpenChange(false);
  };

  const handleBackToForm = () => {
    setEmailSent(false);
  };

  const isSubmitting = loading || authLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {!emailSent ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="size-5 text-accent" />
                {t('forgotPassword.title') || 'Şifremi Unuttum'}
              </DialogTitle>
              <DialogDescription>
                {t('forgotPassword.description') || 'Email adresinize şifre sıfırlama bağlantısı göndereceğiz.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-password-email">
                  {t('forgotPassword.email') || 'Email Adresi'}
                </Label>
                <Input
                  id="forgot-password-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('forgotPassword.emailPlaceholder') || 'ornek@email.com'}
                  required
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  {t('forgotPassword.button.cancel') || 'İptal'}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      {t('forgotPassword.button.submitting') || 'Gönderiliyor...'}
                    </>
                  ) : (
                    t('forgotPassword.button.submit') || 'Bağlantı Gönder'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <Mail className="size-5" />
                {t('forgotPassword.sent.title') || 'Email Gönderildi!'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>{email}</strong> {t('forgotPassword.sent.message') || 'adresine şifre sıfırlama bağlantısı gönderildi.'}
                </p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>📧 {t('forgotPassword.sent.step1') || "Email'inizi kontrol edin"}</p>
                <p>🔗 {t('forgotPassword.sent.step2') || 'Bağlantıya tıklayarak yeni şifre oluşturun'}</p>
                <p>⏱️ {t('forgotPassword.sent.step3') || 'Bağlantı 24 saat geçerlidir'}</p>
              </div>

              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  {t('forgotPassword.sent.spamNote') || 'Email gelmediyse spam/önemsiz klasörünü kontrol edin.'}
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={handleBackToForm}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                {t('forgotPassword.button.back') || 'Geri'}
              </Button>
              <Button onClick={handleClose}>
                {t('forgotPassword.button.done') || 'Tamam'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
