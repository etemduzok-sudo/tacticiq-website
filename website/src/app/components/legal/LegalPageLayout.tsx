import { ReactNode } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated?: string;
  children: ReactNode;
}

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <article className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <header className="space-y-4 border-b pb-8">
              <h1 className="text-4xl font-bold">{title}</h1>
              {lastUpdated && (
                <p className="text-sm text-muted-foreground">
                  {t('blog.publishedOn')} {lastUpdated}
                </p>
              )}
            </header>

            {/* Content */}
            <div className="prose prose-gray dark:prose-invert max-w-none">
              {children}
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}