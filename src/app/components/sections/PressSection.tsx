import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDataSafe } from '@/contexts/AdminDataContext';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { FileText, Download, Image as ImageIcon, Mail } from 'lucide-react';

export function PressSection() {
  const { t } = useLanguage();
  const adminData = useAdminDataSafe();

  // Admin kontrolü - bölüm kapalıysa hiç render etme
  if (!adminData?.sectionSettings?.press?.enabled) {
    return null;
  }

  const { pressKitFiles = [], emailAutoReply, pressReleases = [] } = adminData;

  // Sadece enabled dosyaları göster
  const enabledPressKitFiles = pressKitFiles.filter(file => file.enabled);
  
  // Sadece enabled ve yayınlanmış basın bültenlerini göster, tarihe göre sırala
  const enabledPressReleases = pressReleases
    .filter(release => release.enabled)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3); // Son 3 bülteni göster
  
  // Fallback değer - emailAutoReply yoksa varsayılan email kullan
  const supportEmail = emailAutoReply?.supportEmail || 'support@tacticiq.app';

  // Icon seçimi dosya tipine göre
  const getIconForFileType = (fileType: string) => {
    switch (fileType) {
      case 'logo':
      case 'screenshot':
        return ImageIcon;
      case 'brand-guide':
      case 'document':
      default:
        return FileText;
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    // Dosya indirme işlemi - bu admin panelinden yüklenen dosya
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  const handleDownloadAll = () => {
    // Tüm dosyaları zip olarak indir
    alert('Tüm dosyaları indirme özelliği yakında eklenecek');
  };

  return (
    <section id="press" className="py-20 md:py-28 bg-gradient-to-b from-muted/20 to-background">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            <Mail className="size-4" />
            {t('press.badge')}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t('press.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('press.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Press Kit Downloads */}
          <div>
            <h3 className="text-2xl font-bold mb-6">{t('press.kit.title')}</h3>
            <div className="space-y-4">
              {enabledPressKitFiles.map((item) => {
                const Icon = getIconForFileType(item.fileType);
                return (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="size-6 text-secondary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{item.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{item.format}</span>
                            <span>•</span>
                            <span>{item.size}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => handleDownload(item.fileUrl, item.fileName)}
                        >
                          <Download className="size-4" />
                          {t('press.kit.download')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Download All */}
            <Button className="w-full mt-6 gap-2" size="lg" onClick={handleDownloadAll}>
              <Download className="size-5" />
              {t('press.kit.downloadAll')}
            </Button>
          </div>

          {/* Press Releases */}
          <div>
            <h3 className="text-2xl font-bold mb-6">{t('press.releases.title')}</h3>
            {enabledPressReleases.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  {t('press.releases.empty') || 'Henüz basın bülteni eklenmedi'}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {enabledPressReleases.map((release) => (
                  <Card key={release.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="text-sm text-secondary font-semibold mb-2">
                        {new Date(release.date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                      <h4 className="font-bold text-lg mb-2">{release.title}</h4>
                      {release.subtitle && (
                        <p className="text-sm text-muted-foreground mb-2">{release.subtitle}</p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2">{release.content}</p>
                      {release.pdfUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3 gap-2"
                          onClick={() => window.open(release.pdfUrl, '_blank')}
                        >
                          <Download className="size-4" />
                          PDF İndir
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* View All - Sadece 3'ten fazla bülten varsa göster */}
            {pressReleases.filter(r => r.enabled).length > 3 && (
              <Button variant="outline" className="w-full mt-6">
                {t('press.releases.viewAll')}
              </Button>
            )}
          </div>
        </div>

        {/* Media Contact */}
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <Mail className="size-12 text-secondary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">{t('press.contact.title')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('press.contact.description')}
            </p>
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              <Mail className="size-5" />
              {supportEmail}
            </a>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}