/**
 * Forgot Password Component
 * Kullanıcıların şifre sıfırlama isteği göndermesini sağlar
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { Mail, ArrowLeft } from 'lucide-react';
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
import { authService } from '@/services/authService';
import { useApi } from '@/hooks/useApi';

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const { execute: sendResetEmail, loading } = useApi(
    authService.forgotPassword,
    {
      showErrorToast: true,
    }
  );

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Email adresinizi girin');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Geçerli bir email adresi girin');
      return;
    }

    const result = await sendResetEmail({ email });
    
    if (result !== null) {
      setEmailSent(true);
      toast.success('Şifre sıfırlama bağlantısı email adresinize gönderildi!');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {!emailSent ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="size-5 text-accent" />
                Şifremi Unuttum
              </DialogTitle>
              <DialogDescription>
                Email adresinize şifre sıfırlama bağlantısı göndereceğiz.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Adresi</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Gönderiliyor...' : 'Bağlantı Gönder'}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <Mail className="size-5" />
                Email Gönderildi!
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderildi.
                </p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>📧 Email'inizi kontrol edin</p>
                <p>🔗 Bağlantıya tıklayarak yeni şifre oluşturun</p>
                <p>⏱️ Bağlantı 24 saat geçerlidir</p>
              </div>

              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  Email gelmediyse spam/önemsiz klasörünü kontrol edin.
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
                Geri
              </Button>
              <Button onClick={handleClose}>
                Tamam
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
