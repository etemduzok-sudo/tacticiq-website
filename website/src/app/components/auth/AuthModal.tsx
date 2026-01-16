import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/config/supabase';
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
import { Apple, Mail, Chrome, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        // Kayıt işlemi
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            },
          },
        });

        if (error) throw error;

        toast.success(t('auth.success.signup'));
        toast.info(t('auth.email.verification'));
      } else {
        // Giriş işlemi
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success(t('auth.success.signin'));
      }

      onOpenChange(false);
      setEmail('');
      setPassword('');
      setName('');
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || t('auth.error.general'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast.error(error.message || t('auth.error.google'));
    }
  };

  const handleAppleAuth = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Apple auth error:', error);
      toast.error(error.message || t('auth.error.apple'));
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
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleAuth}
              disabled={loading}
            >
              <Chrome className="mr-2 size-5" />
              {mode === 'signin' ? t('auth.google.signin') : t('auth.google.signup')}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleAppleAuth}
              disabled={loading}
            >
              <Apple className="mr-2 size-5" />
              {mode === 'signin' ? t('auth.apple.signin') : t('auth.apple.signup')}
            </Button>
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
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.email.placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('auth.password.placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            {mode === 'signup' && (
              <div className="flex items-start gap-2 rounded-lg bg-secondary/10 p-3 text-xs">
                <ShieldCheck className="size-4 shrink-0 text-secondary mt-0.5" />
                <p className="text-muted-foreground">
                  {t('auth.disclaimer')}
                </p>
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
    </Dialog>
  );
}