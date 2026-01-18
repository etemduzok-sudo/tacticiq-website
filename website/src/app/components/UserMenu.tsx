import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserAuthSafe } from '@/contexts/UserAuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { LogOut, Trash2, User, Settings, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface UserMenuProps {
  user?: {
    email: string;
    name: string;
  };
  onSignOut?: () => void;
  onDeleteAccount?: () => void;
  onNavigateToProfile?: () => void;
}

export function UserMenu({
  user = { email: 'user@tacticiq.app', name: 'TacticIQ User' },
  onSignOut,
  onDeleteAccount,
  onNavigateToProfile,
}: UserMenuProps) {
  const { t } = useLanguage();
  const userAuth = useUserAuthSafe();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isPro = userAuth?.profile?.plan === 'pro';

  const handleSignOut = async () => {
    if (userAuth?.signOut) {
      await userAuth.signOut();
    }
    if (onSignOut) {
      onSignOut();
    }
    toast.success(t('user.signout.success'));
  };

  const handleDeleteAccount = () => {
    if (onDeleteAccount) {
      onDeleteAccount();
    }
    setDeleteDialogOpen(false);
    toast.success(t('user.delete.success'));
  };

  const handleNavigateToProfile = () => {
    // Scroll to profile section
    const profileSection = document.getElementById('profile');
    if (profileSection) {
      profileSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If profile section doesn't exist, try to navigate
      window.location.hash = 'profile';
      toast.info(t('profile.title'));
    }
    if (onNavigateToProfile) {
      onNavigateToProfile();
    }
  };

  const handleNavigateToSettings = () => {
    // Scroll to settings section in profile
    const profileSection = document.getElementById('profile');
    if (profileSection) {
      profileSection.scrollIntoView({ behavior: 'smooth' });
      // Wait for scroll then focus settings
      setTimeout(() => {
        const settingsElement = document.querySelector('[data-section="settings"]') || 
                                document.querySelector('#settings') ||
                                document.querySelector('[aria-label*="settings" i]');
        if (settingsElement) {
          settingsElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    } else {
      window.location.hash = 'profile';
      toast.info(t('profile.settings.title'));
    }
  };

  const handleUpgradeToPro = () => {
    // Scroll to pricing section
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
      toast.info(t('profile.settings.upgrade'));
    } else {
      window.location.hash = 'pricing';
      toast.info(t('profile.settings.upgrade'));
    }
  };

  // Get user data from UserAuthContext if available, otherwise use props
  const displayName = userAuth?.profile?.name || user.name || user.email?.split('@')[0] || 'User';
  const displayEmail = userAuth?.profile?.email || user.email || '';
  
  const userInitials = displayName
    .split(' ')
    .filter(n => n.length > 0)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || displayEmail[0]?.toUpperCase() || 'U';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative size-9 rounded-full">
            <Avatar className="size-9">
              <AvatarFallback className="bg-gradient-to-br from-secondary to-accent text-white font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            {isPro && (
              <div className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-amber-400 flex items-center justify-center">
                <Crown className="size-2.5 text-black" />
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                {isPro && (
                  <span className="text-xs bg-gradient-to-r from-amber-500 to-yellow-400 text-black px-1.5 py-0.5 rounded font-semibold">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs leading-none text-muted-foreground">
                {displayEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleNavigateToProfile} className="cursor-pointer">
            <User className="mr-2 size-4" />
            <span>{t('profile.title')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleNavigateToSettings} className="cursor-pointer">
            <Settings className="mr-2 size-4" />
            <span>{t('profile.settings.title')}</span>
          </DropdownMenuItem>
          {!isPro && (
            <DropdownMenuItem onClick={handleUpgradeToPro} className="cursor-pointer text-amber-600 hover:text-amber-500">
              <Crown className="mr-2 size-4" />
              <span>{t('profile.settings.upgrade')}</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
            <LogOut className="mr-2 size-4" />
            <span>{t('user.signout')}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            <span>{t('user.delete.account')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('user.delete.confirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('user.delete.confirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('user.delete.confirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('user.delete.confirm.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}