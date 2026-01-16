/**
 * Reset Password Confirm Component
 * Email'den gelen link ile şifre sıfırlama
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/app/components/ui/card';
import { authService, ResetPasswordConfirmData } from '@/services/authService';
import { useApi } from '@/hooks/useApi';

interface ResetPasswordConfirmProps {
  token: string; // URL'den alınan token
  onSuccess?: () => void;
}

export function ResetPasswordConfirm({ token, onSuccess }: ResetPasswordConfirmProps) {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const { execute: resetPassword, loading } = useApi(
    authService.resetPasswordConfirm,
    {
      showErrorToast: true,
    }
  );

  const handleInputChange = (field: 'newPassword' | 'confirmPassword') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const validateForm = (): boolean => {
    if (!formData.newPassword) {
      toast.error('Yeni şifrenizi girin');
      return false;
    }

    if (formData.newPassword.length < 8) {
      toast.error('Şifre en az 8 karakter olmalıdır');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const resetData: ResetPasswordConfirmData = {
      token,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword,
    };

    const result = await resetPassword(resetData);
    
    if (result !== null) {
      toast.success('Şifreniz başarıyla sıfırlandı!');
      setResetSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = '/';
        }
      }, 3000);
    }
  };

  if (resetSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="size-16 text-green-600" />
          </div>
          <CardTitle className="text-green-600">Şifre Sıfırlandı!</CardTitle>
          <CardDescription>
            Şifreniz başarıyla değiştirildi. Giriş sayfasına yönlendiriliyorsunuz...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Giriş Sayfasına Git
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="size-5 text-accent" />
          Yeni Şifre Oluştur
        </CardTitle>
        <CardDescription>
          Hesabınız için yeni bir şifre belirleyin.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Yeni Şifre */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Yeni Şifre</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleInputChange('newPassword')}
                placeholder="En az 8 karakter"
                required
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNewPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {formData.newPassword && (
              <div className="text-xs space-y-1">
                <p className={formData.newPassword.length >= 8 ? 'text-green-600' : 'text-red-600'}>
                  {formData.newPassword.length >= 8 ? '✓' : '✗'} En az 8 karakter
                </p>
                <p className={/[A-Z]/.test(formData.newPassword) ? 'text-green-600' : 'text-red-600'}>
                  {/[A-Z]/.test(formData.newPassword) ? '✓' : '✗'} En az bir büyük harf
                </p>
                <p className={/[0-9]/.test(formData.newPassword) ? 'text-green-600' : 'text-red-600'}>
                  {/[0-9]/.test(formData.newPassword) ? '✓' : '✗'} En az bir rakam
                </p>
              </div>
            )}
          </div>

          {/* Yeni Şifre Tekrar */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                placeholder="Şifrenizi tekrar girin"
                required
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {formData.confirmPassword && (
              <p className={
                formData.newPassword === formData.confirmPassword
                  ? 'text-xs text-green-600'
                  : 'text-xs text-red-600'
              }>
                {formData.newPassword === formData.confirmPassword
                  ? '✓ Şifreler eşleşiyor'
                  : '✗ Şifreler eşleşmiyor'}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Şifre Sıfırlanıyor...' : 'Şifreyi Sıfırla'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
