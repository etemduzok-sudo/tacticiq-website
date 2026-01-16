/**
 * Change Password Component
 * Kullanıcıların şifre değiştirmesini sağlayan modal bileşeni
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff } from 'lucide-react';
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
import { authService, ChangePasswordData } from '@/services/authService';
import { useApi } from '@/hooks/useApi';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordModal({ open, onOpenChange }: ChangePasswordModalProps) {
  const { t, isRTL } = useLanguage();
  const [formData, setFormData] = useState<ChangePasswordData>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { execute: changePassword, loading } = useApi(
    authService.changePassword,
    {
      showErrorToast: true,
      showSuccessToast: true,
      successMessage: t('changePassword.success'),
    }
  );

  const handleInputChange = (field: keyof ChangePasswordData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const validateForm = (): boolean => {
    if (!formData.oldPassword) {
      toast.error(t('changePassword.errors.currentPasswordRequired'));
      return false;
    }

    if (!formData.newPassword) {
      toast.error(t('changePassword.errors.newPasswordRequired'));
      return false;
    }

    if (formData.newPassword.length < 8) {
      toast.error(t('changePassword.errors.minLength'));
      return false;
    }

    if (formData.newPassword === formData.oldPassword) {
      toast.error(t('changePassword.errors.sameAsOld'));
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t('changePassword.errors.passwordsMismatch'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await changePassword(formData);
    
    if (result !== null) {
      // Success - close modal and reset form
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="size-5 text-accent" />
            {t('changePassword.title')}
          </DialogTitle>
          <DialogDescription>
            {t('changePassword.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mevcut Şifre */}
          <div className="space-y-2">
            <Label htmlFor="oldPassword">{t('changePassword.currentPassword')}</Label>
            <div className="relative">
              <Input
                id="oldPassword"
                type={showOldPassword ? 'text' : 'password'}
                value={formData.oldPassword}
                onChange={handleInputChange('oldPassword')}
                placeholder={t('changePassword.currentPasswordPlaceholder')}
                required
                disabled={loading}
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
            <Label htmlFor="newPassword">{t('changePassword.newPassword')}</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleInputChange('newPassword')}
                placeholder={t('changePassword.newPasswordPlaceholder')}
                required
                disabled={loading}
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
            {formData.newPassword && (
              <div className={`text-xs space-y-1 ${isRTL ? 'text-right' : ''}`}>
                <p className={formData.newPassword.length >= 8 ? 'text-green-600' : 'text-red-600'}>
                  {formData.newPassword.length >= 8 ? '✓' : '✗'} {t('changePassword.requirements.length')}
                </p>
                <p className={/[A-Z]/.test(formData.newPassword) ? 'text-green-600' : 'text-red-600'}>
                  {/[A-Z]/.test(formData.newPassword) ? '✓' : '✗'} {t('changePassword.requirements.uppercase')}
                </p>
                <p className={/[0-9]/.test(formData.newPassword) ? 'text-green-600' : 'text-red-600'}>
                  {/[0-9]/.test(formData.newPassword) ? '✓' : '✗'} {t('changePassword.requirements.number')}
                </p>
              </div>
            )}
          </div>

          {/* Yeni Şifre Tekrar */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('changePassword.confirmPassword')}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                placeholder={t('changePassword.confirmPasswordPlaceholder')}
                required
                disabled={loading}
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
            {formData.confirmPassword && (
              <p className={
                formData.newPassword === formData.confirmPassword
                  ? `text-xs text-green-600 ${isRTL ? 'text-right' : ''}`
                  : `text-xs text-red-600 ${isRTL ? 'text-right' : ''}`
              }>
                {formData.newPassword === formData.confirmPassword
                  ? `✓ ${t('changePassword.validation.passwordsMatch')}`
                  : `✗ ${t('changePassword.validation.passwordsMismatch')}`}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              {t('changePassword.button.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('changePassword.button.submitting') : t('changePassword.button.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}