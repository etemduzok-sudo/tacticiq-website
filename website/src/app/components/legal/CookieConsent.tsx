import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/app/components/ui/button';
import { X, Cookie, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';

const COOKIE_CONSENT_KEY = 'tacticiq_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'tacticiq_cookie_preferences';

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsent() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, cannot be disabled
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    
    if (!consent) {
      // Show banner after 2 seconds
      setTimeout(() => setIsVisible(true), 2000);
    }
    
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    
    savePreferences(allAccepted);
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    
    savePreferences(onlyNecessary);
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
    setShowSettings(false);
    setIsVisible(false);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    
    // Trigger custom event for analytics/tracking services
    window.dispatchEvent(new CustomEvent('cookiePreferencesUpdated', { detail: prefs }));
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-2xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Icon & Text */}
            <div className="flex-1 flex items-start gap-3">
              <div className="mt-1">
                <Cookie className="size-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  {t('cookie.title')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('cookie.description')}
                  <button
                    onClick={() => setShowSettings(true)}
                    className="text-secondary hover:underline ml-1"
                  >
                    {t('cookie.learnMore')}
                  </button>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="gap-2"
              >
                <Settings className="size-4" />
                {t('cookie.customize')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectAll}
              >
                {t('cookie.rejectAll')}
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="bg-secondary hover:bg-secondary/90"
              >
                {t('cookie.acceptAll')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="size-5 text-secondary" />
              {t('cookie.settings.title')}
            </DialogTitle>
            <DialogDescription>
              {t('cookie.settings.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Necessary Cookies */}
            <div className="flex items-start justify-between gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <Label className="text-base font-semibold">
                  {t('cookie.types.necessary.title')}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('cookie.types.necessary.description')}
                </p>
              </div>
              <Switch
                checked={true}
                disabled
                className="mt-1"
              />
            </div>

            {/* Functional Cookies */}
            <div className="flex items-start justify-between gap-4 p-4 border rounded-lg">
              <div className="flex-1">
                <Label className="text-base font-semibold">
                  {t('cookie.types.functional.title')}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('cookie.types.functional.description')}
                </p>
              </div>
              <Switch
                checked={preferences.functional}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, functional: checked })
                }
                className="mt-1"
              />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start justify-between gap-4 p-4 border rounded-lg">
              <div className="flex-1">
                <Label className="text-base font-semibold">
                  {t('cookie.types.analytics.title')}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('cookie.types.analytics.description')}
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, analytics: checked })
                }
                className="mt-1"
              />
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-start justify-between gap-4 p-4 border rounded-lg">
              <div className="flex-1">
                <Label className="text-base font-semibold">
                  {t('cookie.types.marketing.title')}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('cookie.types.marketing.description')}
                </p>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, marketing: checked })
                }
                className="mt-1"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleRejectAll}
            >
              {t('cookie.rejectAll')}
            </Button>
            <Button
              onClick={handleSavePreferences}
              className="bg-secondary hover:bg-secondary/90"
            >
              {t('cookie.savePreferences')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
