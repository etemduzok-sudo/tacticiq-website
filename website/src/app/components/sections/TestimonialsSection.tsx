import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminData } from '@/contexts/AdminDataContext';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';

export function TestimonialsSection() {
  const { t } = useLanguage();
  const { sectionSettings } = useAdminData();

  const testimonials = [
    {
      name: 'Alex Martinez',
      role: t('testimonials.users.user1.role'),
      avatar: 'AM',
      rating: 5,
      text: t('testimonials.users.user1.text'),
    },
    {
      name: 'Sarah Johnson',
      role: t('testimonials.users.user2.role'),
      avatar: 'SJ',
      rating: 5,
      text: t('testimonials.users.user2.text'),
    },
    {
      name: 'Michael Chen',
      role: t('testimonials.users.user3.role'),
      avatar: 'MC',
      rating: 5,
      text: t('testimonials.users.user3.text'),
    },
    {
      name: 'Emma Davis',
      role: t('testimonials.users.user4.role'),
      avatar: 'ED',
      rating: 5,
      text: t('testimonials.users.user4.text'),
    },
    {
      name: 'James Wilson',
      role: t('testimonials.users.user5.role'),
      avatar: 'JW',
      rating: 5,
      text: t('testimonials.users.user5.text'),
    },
    {
      name: 'Sofia Rodriguez',
      role: t('testimonials.users.user6.role'),
      avatar: 'SR',
      rating: 5,
      text: t('testimonials.users.user6.text'),
    },
  ];

  // Admin panelinden kontrol
  if (!sectionSettings.testimonials.enabled) {
    return null;
  }

  return (
    <section id="testimonials" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-semibold mb-4">
            <Quote className="size-4" />
            {t('testimonials.badge')}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t('testimonials.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('testimonials.subtitle')}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="size-5 fill-accent text-accent" />
                  ))}
                </div>

                {/* Quote */}
                <Quote className="size-8 text-secondary/20 mb-2" />
                <p className="text-sm text-muted-foreground mb-6 italic">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-secondary/10 text-secondary font-semibold">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats - Kaldırıldı: İstatistikler artık StatsSection'da gösteriliyor */}
      </div>
    </section>
  );
}