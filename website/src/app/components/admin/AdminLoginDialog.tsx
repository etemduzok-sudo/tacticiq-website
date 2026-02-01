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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Lock, LogOut, Shield, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { adminAuthService } from '@/config/supabase';

export function AdminLoginDialog() {
  const { isAdmin, login, logout, loading } = useAdmin();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);

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

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicLinkEmail?.trim()) {
      toast.error('E-posta adresi girin');
      return;
    }
    setMagicLinkLoading(true);
    try {
      const result = await adminAuthService.sendMagicLink(magicLinkEmail.trim());
      if (result.success) {
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('admin_magic_link_sent', '1');
        toast.success(result.message || 'E-postanıza giriş linki gönderildi. Linke tıklayın.');
        setOpen(false);
        setMagicLinkEmail('');
      } else {
        toast.error(result.error || 'Link gönderilemedi');
      }
    } finally {
      setMagicLinkLoading(false);
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
            Yönetim paneline erişmek için şifre ile giriş yapın veya e-postanıza giriş linki gönderin. Giriş bildirimleri yetkisiz admin erişimlerini anında fark etmeniz için tasarlanmıştır.
          </DialogDescription>
          <p className="text-xs text-muted-foreground mt-2 rounded-md bg-muted/50 p-2 border border-border/50">
            🔒 Admin girişi footer’da görünür olsa bile, yetkisiz kullanıcılar e-posta + şifre veya giriş linki olmadan panele erişemez. Tüm giriş denemeleri doğrulanır ve kayıt altına alınır.
          </p>
        </DialogHeader>
        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password" className="gap-1.5">
              <Lock className="size-4" />
              Şifre ile
            </TabsTrigger>
            <TabsTrigger value="magic" className="gap-1.5">
              <Mail className="size-4" />
              E-posta linki
            </TabsTrigger>
          </TabsList>
          <TabsContent value="password" className="space-y-4 mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-login-email">E-posta</Label>
                <Input
                  id="admin-login-email"
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
                  onClick={() => { setOpen(false); setEmail(''); setPassword(''); }}
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
          </TabsContent>
          <TabsContent value="magic" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              E-postanıza tek kullanımlık giriş linki gönderilir. Linke tıklayarak güvenli giriş yapabilirsiniz.
            </p>
            <form onSubmit={handleSendMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magic-email">Admin e-posta adresi</Label>
                <Input
                  id="magic-email"
                  type="email"
                  value={magicLinkEmail}
                  onChange={(e) => setMagicLinkEmail(e.target.value)}
                  placeholder="admin@tacticiq.app"
                  disabled={magicLinkLoading}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setOpen(false); setMagicLinkEmail(''); }}
                  disabled={magicLinkLoading}
                >
                  İptal
                </Button>
                <Button type="submit" className="gap-2" disabled={magicLinkLoading}>
                  <Mail className="size-4" />
                  {magicLinkLoading ? 'Gönderiliyor...' : 'Giriş linki gönder'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}