import { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Lock, LogOut, Shield } from 'lucide-react';
import { toast } from 'sonner';

export function AdminLoginDialog() {
  const { isAdmin, login, logout, loading } = useAdmin();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('E-posta ve şifre gerekli');
      return;
    }
    
    const success = await login(email, password);
    if (success) {
      toast.success('Admin girişi başarılı');
      setOpen(false);
      setEmail('');
      setPassword('');
    } else {
      toast.error('Hatalı e-posta veya şifre');
      setPassword('');
    }
  };

  const handleLogout = () => {
    logout();
    toast.info('Admin çıkışı yapıldı');
  };

  if (isAdmin) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
          <Shield className="size-4 text-accent" />
          <span className="text-xs font-medium text-accent">Admin</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2 text-xs"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Çıkış</span>
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-xs opacity-30 hover:opacity-100 transition-opacity"
        >
          <Lock className="size-4" />
          <span className="hidden sm:inline">Admin</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5 text-accent" />
            Admin Girişi
          </DialogTitle>
          <DialogDescription>
            Yönetim paneline erişmek için şifrenizi girin
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tacticiq.app"
              autoFocus
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin şifresini girin"
              disabled={loading}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setEmail('');
                setPassword('');
              }}
              disabled={loading}
            >
              İptal
            </Button>
            <Button type="submit" className="gap-2" disabled={loading}>
              <Lock className="size-4" />
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}