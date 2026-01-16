import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/app/components/ui/button';
import { Home, Search, ArrowLeft, TrendingUp } from 'lucide-react';

export function NotFoundPage() {
  const { t } = useLanguage();

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const popularLinks = [
    { label: t('notFound.links.features'), href: '#features' },
    { label: t('notFound.links.pricing'), href: '#pricing' },
    { label: t('notFound.links.contact'), href: '#contact' },
    { label: t('notFound.links.faq'), href: '#faq' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Large 404 */}
        <div className="relative mb-8">
          <div className="text-[180px] md:text-[240px] font-bold leading-none bg-gradient-to-br from-primary via-secondary to-accent bg-clip-text text-transparent opacity-20">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center backdrop-blur-sm">
              <Search className="size-16 md:size-20 text-secondary" />
            </div>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          {t('notFound.title')}
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          {t('notFound.description')}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button onClick={handleGoHome} size="lg" className="gap-2">
            <Home className="size-5" />
            {t('notFound.goHome')}
          </Button>
          <Button onClick={handleGoBack} variant="outline" size="lg" className="gap-2">
            <ArrowLeft className="size-5" />
            {t('notFound.goBack')}
          </Button>
        </div>

        {/* Popular Links */}
        <div className="border-t pt-8">
          <div className="flex items-center justify-center gap-2 mb-4 text-sm text-muted-foreground">
            <TrendingUp className="size-4" />
            {t('notFound.popular')}
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {popularLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="px-4 py-2 rounded-lg bg-card border border-border hover:border-secondary transition-colors text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
