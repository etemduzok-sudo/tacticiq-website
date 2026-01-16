import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDataSafe } from '@/contexts/AdminDataContext';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Smartphone, Apple, Play, QrCode, Download } from 'lucide-react';

export function AppDownloadSection() {
  const { t } = useLanguage();
  const adminData = useAdminDataSafe();
  
  // Get section settings
  const sectionSettings = adminData?.sectionSettings?.appDownload ?? {
    enabled: true,
    showQRCodes: true,
  };
  
  // If section is disabled, don't render
  if (!sectionSettings.enabled) {
    return null;
  }

  const handleAppStoreClick = () => {
    // App Store URL'i buraya eklenecek
    window.open('https://apps.apple.com/app/tacticiq', '_blank');
  };

  const handlePlayStoreClick = () => {
    // Google Play Store URL'i buraya eklenecek
    window.open('https://play.google.com/store/apps/details?id=com.tacticiq', '_blank');
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left Content */}
          <div className="space-y-6">
            <Badge variant="secondary" className="gap-2">
              <Smartphone className="size-4" />
              {t('download.badge')}
            </Badge>

            <h2 className="text-3xl md:text-4xl font-bold">
              {t('download.title')}
            </h2>

            <p className="text-lg text-muted-foreground">
              {t('download.subtitle')}
            </p>

            <ul className="space-y-3">
              {[
                t('download.features.predictions'),
                t('download.features.live'),
                t('download.features.analysis'),
                t('download.features.rankings'),
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="size-2 rounded-full bg-secondary" />
                  </div>
                  <span className="text-foreground/80">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                variant="default"
                className="gap-2"
                onClick={handleAppStoreClick}
              >
                <Apple className="size-5" />
                <div className="text-left">
                  <div className="text-xs opacity-80">{t('download.available_on')}</div>
                  <div className="font-semibold">App Store</div>
                </div>
              </Button>

              <Button
                size="lg"
                variant="default"
                className="gap-2"
                onClick={handlePlayStoreClick}
              >
                <Play className="size-5" />
                <div className="text-left">
                  <div className="text-xs opacity-80">{t('download.get_it_on')}</div>
                  <div className="font-semibold">Google Play</div>
                </div>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Download className="size-4" />
              {t('download.coming_soon')}
            </p>
          </div>

          {/* Right Content - Phone Mockup */}
          <div className="relative">
            <Card className="p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
              <div className="space-y-6">
                {/* QR Code Placeholder */}
                <div className="bg-white rounded-xl p-6 mx-auto w-fit shadow-lg">
                  <div className="size-48 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                    <QrCode className="size-24 text-white" />
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">{t('download.qr.title')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('download.qr.description')}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">500K+</div>
                    <div className="text-xs text-muted-foreground">{t('download.stats.downloads')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">4.8★</div>
                    <div className="text-xs text-muted-foreground">{t('download.stats.rating')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">25+</div>
                    <div className="text-xs text-muted-foreground">{t('download.stats.leagues')}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}