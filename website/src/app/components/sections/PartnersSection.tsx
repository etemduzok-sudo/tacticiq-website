import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminData } from '@/contexts/AdminDataContext';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Handshake, Mail, ExternalLink, Send, Building2, User, Phone, Globe, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { partnerApplicationsService } from '@/services/adminSupabaseService';

export function PartnersSection() {
  const { t } = useLanguage();
  const { partners, notificationSettings } = useAdminData();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    company_type: 'other' as const,
    partnership_type: 'other' as const,
    message: ''
  });

  // Sadece aktif ve öne çıkan partnerleri göster
  const displayedPartners = partners
    .filter(partner => partner.enabled)
    .sort((a, b) => {
      // Önce öne çıkanlar, sonra diğerleri
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.order - b.order;
    });

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name || !formData.contact_name || !formData.email) {
      toast.error(t('partners.form.requiredFields') || 'Lütfen zorunlu alanları doldurun');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error(t('partners.form.invalidEmail') || 'Geçerli bir e-posta adresi girin');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await partnerApplicationsService.add(formData);
      
      if (result) {
        toast.success(t('partners.form.success') || 'Başvurunuz alındı! En kısa sürede sizinle iletişime geçeceğiz.');
        
        // Admin'e e-posta bildirimi gönder
        const supportEmail = notificationSettings?.notificationEmail || 'support@tacticiq.app';
        const mailtoUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(`🚨 Yeni Ortaklık Başvurusu: ${formData.company_name}`)}&body=${encodeURIComponent(`
YENİ ORTAKLIK BAŞVURUSU

Şirket: ${formData.company_name}
İletişim: ${formData.contact_name}
E-posta: ${formData.email}
Telefon: ${formData.phone || '-'}
Website: ${formData.website || '-'}
Şirket Türü: ${formData.company_type}
Ortaklık Türü: ${formData.partnership_type}

Mesaj:
${formData.message || '-'}

---
Bu başvuru tacticiq.app üzerinden gönderilmiştir.
Tarih: ${new Date().toLocaleString('tr-TR')}
        `)}`;
        
        // Bildirimi aç (opsiyonel - kullanıcıya sorulmadan açmıyoruz)
        // window.open(mailtoUrl, '_blank');
        
        // Formu sıfırla
        setFormData({
          company_name: '',
          contact_name: '',
          email: '',
          phone: '',
          website: '',
          company_type: 'other',
          partnership_type: 'other',
          message: ''
        });
        setShowApplicationForm(false);
      } else {
        toast.error(t('partners.form.error') || 'Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Partner application error:', error);
      toast.error(t('partners.form.error') || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                      {t('partners.website') || 'Web Sitesi'}
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Handshake className="size-16 mx-auto mb-4 opacity-50" />
            <p>{t('partners.noPartners') || 'Henüz partner eklenmemiş'}</p>
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
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setShowApplicationForm(true)}
              >
                <Mail className="size-4" />
                {t('partners.cta.button') || 'Ortak Ol'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Partner Application Form Dialog */}
      <Dialog open={showApplicationForm} onOpenChange={setShowApplicationForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Handshake className="size-6 text-accent" />
              {t('partners.form.title') || 'Ortaklık Başvurusu'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitApplication} className="space-y-4 mt-4">
            {/* Şirket Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name" className="flex items-center gap-1">
                  <Building2 className="size-4" />
                  {t('partners.form.companyName') || 'Şirket Adı'} *
                </Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Şirket adınız"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_name" className="flex items-center gap-1">
                  <User className="size-4" />
                  {t('partners.form.contactName') || 'İletişim Kişisi'} *
                </Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="Ad Soyad"
                  required
                />
              </div>
            </div>

            {/* İletişim Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="size-4" />
                  {t('partners.form.email') || 'E-posta'} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ornek@sirket.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="size-4" />
                  {t('partners.form.phone') || 'Telefon'}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+90 5XX XXX XX XX"
                />
              </div>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-1">
                <Globe className="size-4" />
                {t('partners.form.website') || 'Website'}
              </Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.sirket.com"
              />
            </div>

            {/* Türler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('partners.form.companyType') || 'Şirket Türü'}</Label>
                <Select 
                  value={formData.company_type} 
                  onValueChange={(val: any) => setFormData({ ...formData, company_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="media">Medya</SelectItem>
                    <SelectItem value="sports">Spor</SelectItem>
                    <SelectItem value="technology">Teknoloji</SelectItem>
                    <SelectItem value="gaming">Oyun</SelectItem>
                    <SelectItem value="agency">Ajans</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('partners.form.partnershipType') || 'Ortaklık Türü'}</Label>
                <Select 
                  value={formData.partnership_type} 
                  onValueChange={(val: any) => setFormData({ ...formData, partnership_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advertising">Reklam</SelectItem>
                    <SelectItem value="sponsorship">Sponsorluk</SelectItem>
                    <SelectItem value="content">İçerik Ortaklığı</SelectItem>
                    <SelectItem value="technology">Teknoloji Ortaklığı</SelectItem>
                    <SelectItem value="distribution">Dağıtım</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mesaj */}
            <div className="space-y-2">
              <Label htmlFor="message" className="flex items-center gap-1">
                <MessageSquare className="size-4" />
                {t('partners.form.message') || 'Mesajınız'}
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Ortaklık teklifiniz hakkında detaylı bilgi verin..."
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowApplicationForm(false)}
              >
                {t('common.cancel') || 'İptal'}
              </Button>
              <Button 
                type="submit" 
                className="gap-2 bg-accent hover:bg-accent/90"
                disabled={isSubmitting}
              >
                <Send className="size-4" />
                {isSubmitting 
                  ? (t('common.sending') || 'Gönderiliyor...') 
                  : (t('partners.form.submit') || 'Başvuru Gönder')
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}