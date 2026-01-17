import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminData } from '@/contexts/AdminDataContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Mail, Send, CheckCircle2, AlertCircle, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function ContactSection() {
  const { t } = useLanguage();
  const { sectionSettings, emailAutoReply } = useAdminData();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
  });

  // Admin panelinden kontrol
  if (!sectionSettings.contact.enabled) {
    return null;
  }

  // Admin panelinden contact bilgileri
  const contactSettings = sectionSettings.contact;
  
  // Fallback değer - emailAutoReply yoksa varsayılan email kullan
  const supportEmail = emailAutoReply?.supportEmail || 'support@tacticiq.app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error(t('contact.form.error'));
      return;
    }

    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In production, this would send to backend
    console.log('Contact form submitted:', formData);
    
    setLoading(false);
    setSubmitted(true);
    toast.success(t('contact.form.success'));
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        email: '',
        subject: '',
        category: '',
        message: '',
      });
    }, 3000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section id="contact" className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-semibold mb-4">
            <Mail className="size-4" />
            {t('contact.badge')}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t('contact.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold mb-4">{t('contact.info.title')}</h3>
              <p className="text-muted-foreground mb-6">
                {t('contact.info.description')}
              </p>
            </div>

            {/* Contact Cards */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-card border border-border rounded-lg">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="size-5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t('contact.info.email.title')}</h4>
                  <a 
                    href={`mailto:${supportEmail}`}
                    className="text-sm text-secondary hover:underline"
                  >
                    {supportEmail}
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('contact.info.email.response')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card border border-border rounded-lg">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="size-5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t('contact.info.address.title')}</h4>
                  <p className="text-sm text-muted-foreground">
                    TacticIQ Ltd.<br />
                    İstanbul, Turkey
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card border border-border rounded-lg">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="size-5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t('contact.info.hours.title')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('contact.info.hours.time')}<br />
                    {t('contact.info.hours.days')}
                  </p>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="p-6 bg-gradient-to-br from-secondary/10 to-accent/10 rounded-lg border border-secondary/20">
              <p className="text-sm font-semibold mb-2">{t('contact.info.response.title')}</p>
              <div className="flex items-center gap-2 text-2xl font-bold text-secondary">
                <CheckCircle2 className="size-6" />
                {t('contact.info.response.time')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('contact.info.response.description')}
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="size-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{t('contact.form.submitted.title')}</h3>
                <p className="text-muted-foreground">
                  {t('contact.form.submitted.description')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">{t('contact.form.name.label')}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t('contact.form.name.placeholder')}
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="contact-email">{t('contact.form.email.label')}</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder={t('contact.form.email.placeholder')}
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">{t('contact.form.category.label')}</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleChange('category', value)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('contact.form.category.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">{t('contact.form.category.general')}</SelectItem>
                      <SelectItem value="support">{t('contact.form.category.support')}</SelectItem>
                      <SelectItem value="billing">{t('contact.form.category.billing')}</SelectItem>
                      <SelectItem value="partnership">{t('contact.form.category.partnership')}</SelectItem>
                      <SelectItem value="press">{t('contact.form.category.press')}</SelectItem>
                      <SelectItem value="other">{t('contact.form.category.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject">{t('contact.form.subject.label')}</Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder={t('contact.form.subject.placeholder')}
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">{t('contact.form.message.label')}</Label>
                  <Textarea
                    id="message"
                    placeholder={t('contact.form.message.placeholder')}
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    rows={5}
                    required
                    disabled={loading}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('contact.form.sending')}
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      {t('contact.form.submit')}
                    </>
                  )}
                </Button>

                {/* Privacy Notice */}
                <p className="text-xs text-muted-foreground text-center">
                  {t('contact.form.privacy')}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}