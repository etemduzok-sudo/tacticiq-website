/**
 * Change Password Component
 * Kullanıcıların şifre değiştirmesini sağlayan modal bileşeni
 * Supabase Auth ile entegre çalışır
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
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

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordModal({ open, onOpenChange }: ChangePasswordModalProps) {
  const { t, isRTL } = useLanguage();
  const { updatePassword, isLoading: authLoading } = useUserAuth();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    if (!oldPassword) {
      toast.error(t('changePassword.errors.currentPasswordRequired') || 'Mevcut şifrenizi girin');
      return false;
    }

    if (!newPassword) {
      toast.error(t('changePassword.errors.newPasswordRequired') || 'Yeni şifrenizi girin');
      return false;
    }

    if (newPassword.length < 6) {
      toast.error(t('changePassword.errors.minLength') || 'Şifre en az 6 karakter olmalı');
      return false;
    }

    if (newPassword === oldPassword) {
      toast.error(t('changePassword.errors.sameAsOld') || 'Yeni şifre eskisiyle aynı olamaz');
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('changePassword.errors.passwordsMismatch') || 'Şifreler eşleşmiyor');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await updatePassword(newPassword);
      
      if (result.success) {
        toast.success(t('changePassword.success') || 'Şifreniz başarıyla değiştirildi');
        // Reset form and close modal
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onOpenChange(false);
      } else {
        toast.error(result.error || t('changePassword.errors.general') || 'Şifre değiştirilemedi');
      }
    } catch (err: any) {
      toast.error(err.message || t('changePassword.errors.general') || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onOpenChange(false);
  };

  const isSubmitting = loading || authLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="size-5 text-accent" />
            {t('changePassword.title') || 'Şifre Değiştir'}
          </DialogTitle>
          <DialogDescription>
            {t('changePassword.description') || 'Güvenliğiniz için şifrenizi düzenli olarak değiştirin.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mevcut Şifre */}
          <div className="space-y-2">
            <Label htmlFor="oldPassword">{t('changePassword.currentPassword') || 'Mevcut Şifre'}</Label>
            <div className="relative">
              <Input
                id="oldPassword"
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder={t('changePassword.currentPasswordPlaceholder') || 'Mevcut şifrenizi girin'}
                required
                disabled={isSubmitting}
                className={isRTL ? 'pl-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors`}
              >
                {showOldPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {/* Yeni Şifre */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('changePassword.newPassword') || 'Yeni Şifre'}</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('changePassword.newPasswordPlaceholder') || 'Yeni şifrenizi girin'}
                required
                disabled={isSubmitting}
                className={isRTL ? 'pl-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors`}
              >
                {showNewPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {newPassword && (
              <div className={`text-xs space-y-1 ${isRTL ? 'text-right' : ''}`}>
                <p className={newPassword.length >= 6 ? 'text-green-600' : 'text-red-600'}>
                  {newPassword.length >= 6 ? '✓' : '✗'} {t('changePassword.requirements.length') || 'En az 6 karakter'}
                </p>
                <p className={/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-muted-foreground'}>
                  {/[A-Z]/.test(newPassword) ? '✓' : '○'} {t('changePassword.requirements.uppercase') || 'Büyük harf (önerilen)'}
                </p>
                <p className={/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-muted-foreground'}>
                  {/[0-9]/.test(newPassword) ? '✓' : '○'} {t('changePassword.requirements.number') || 'Rakam (önerilen)'}
                </p>
              </div>
            )}
          </div>

          {/* Yeni Şifre Tekrar */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('changePassword.confirmPassword') || 'Şifre Tekrar'}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('changePassword.confirmPasswordPlaceholder') || 'Yeni şifrenizi tekrar girin'}
                required
                disabled={isSubmitting}
                className={isRTL ? 'pl-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors`}
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {confirmPassword && (
              <p className={
                newPassword === confirmPassword
                  ? `text-xs text-green-600 ${isRTL ? 'text-right' : ''}`
                  : `text-xs text-red-600 ${isRTL ? 'text-right' : ''}`
              }>
                {newPassword === confirmPassword
                  ? `✓ ${t('changePassword.validation.passwordsMatch') || 'Şifreler eşleşiyor'}`
                  : `✗ ${t('changePassword.validation.passwordsMismatch') || 'Şifreler eşleşmiyor'}`}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {t('changePassword.button.cancel') || 'İptal'}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('changePassword.button.submitting') || 'Kaydediliyor...'}
                </>
              ) : (
                t('changePassword.button.submit') || 'Şifreyi Değiştir'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
