import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminData } from '@/contexts/AdminDataContext';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Handshake, Mail, Clock, ExternalLink } from 'lucide-react';

export function PartnersSection() {
  const { t } = useLanguage();
  const { partners } = useAdminData();

  // Sadece aktif ve öne çıkan partnerleri göster
  const displayedPartners = partners
    .filter(partner => partner.enabled)
    .sort((a, b) => {
      // Önce öne çıkanlar, sonra diğerleri
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.order - b.order;
    });

  return (
    <section id="partners" className="py-20 md:py-28 bg-muted/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t('partners.title') || 'Güvenilen Ortaklar'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('partners.subtitle') || 'Dünyanın önde gelen spor organizasyonları ve medya şirketleriyle çalışıyoruz'}
          </p>
        </div>

        {/* Partners Grid */}
        {displayedPartners.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
            {displayedPartners.map((partner) => (
              <Card 
                key={partner.id} 
                className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                  partner.featured ? 'border-2 border-accent/30' : ''
                }`}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[180px]">
                  {partner.logo ? (
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="max-w-full max-h-24 object-contain mb-4 grayscale group-hover:grayscale-0 transition-all"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center mb-4">
                      <Handshake className="size-8 text-muted-foreground" />
                    </div>
                  )}
                  <h3 className="font-semibold text-center mb-2">{partner.name}</h3>
                  {partner.category && (
                    <p className="text-xs text-muted-foreground text-center mb-2">{partner.category}</p>
                  )}
                  {partner.website && (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent hover:underline flex items-center gap-1 mt-2"
                    >
                      <ExternalLink className="size-3" />
                      Web Sitesi
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Handshake className="size-16 mx-auto mb-4 opacity-50" />
            <p>Henüz partner eklenmemiş</p>
          </div>
        )}

        {/* Contact CTA */}
        <div className="text-center">
          <Card className="inline-block border-2 border-accent/30">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-2">
                {t('partners.contact.title') || 'Ortaklık & İş Birliği'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('partners.contact.description') || 'Ortaklık, iş birliği veya reklam fırsatları için bize ulaşın'}
              </p>
              <Button variant="outline" className="gap-2">
                <Mail className="size-4" />
                {t('partners.cta.button') || 'Ortak Ol'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}