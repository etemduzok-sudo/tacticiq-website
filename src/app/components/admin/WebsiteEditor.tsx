import { useState } from 'react';
import { useAdminDataSafe, CURRENCY_SYMBOLS } from '@/contexts/AdminDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Save, Type, DollarSign, FileText, Megaphone, Info } from 'lucide-react';
import { toast } from 'sonner';

export function WebsiteEditor() {
  const adminData = useAdminDataSafe();
  const websiteContent = adminData?.websiteContent;
  const updateWebsiteContent = adminData?.updateWebsiteContent;
  const discountSettings = adminData?.discountSettings;
  
  const [editedContent, setEditedContent] = useState(websiteContent);

  // If admin data is not available, show loading or empty state
  if (!adminData || !websiteContent || !updateWebsiteContent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Website İçerik Editörü</h2>
            <p className="text-sm text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    Object.keys(editedContent).forEach((key) => {
      updateWebsiteContent(key as keyof typeof websiteContent, editedContent[key as keyof typeof editedContent]);
    });
    toast.success('Website içeriği kaydedildi');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Website İçerik Editörü</h2>
          <p className="text-sm text-muted-foreground">Web sitesindeki tüm bölümlerin içeriğini düzenleyin</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="size-4" />
          Tümünü Kaydet
        </Button>
      </div>

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
          <TabsTrigger value="cta">CTA</TabsTrigger>
        </TabsList>

        {/* Hero Section Editor */}
        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="size-5" />
                Hero Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero-title">Ana Başlık</Label>
                <Input
                  id="hero-title"
                  value={editedContent.hero.title}
                  onChange={(e) => setEditedContent({
                    ...editedContent,
                    hero: { ...editedContent.hero, title: e.target.value }
                  })}
                  placeholder="Ana başlık giriniz"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero-subtitle">Alt Başlık</Label>
                <Textarea
                  id="hero-subtitle"
                  value={editedContent.hero.subtitle}
                  onChange={(e) => setEditedContent({
                    ...editedContent,
                    hero: { ...editedContent.hero, subtitle: e.target.value }
                  })}
                  placeholder="Alt başlık giriniz"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero-button">Button Metni</Label>
                <Input
                  id="hero-button"
                  value={editedContent.hero.buttonText}
                  onChange={(e) => setEditedContent({
                    ...editedContent,
                    hero: { ...editedContent.hero, buttonText: e.target.value }
                  })}
                  placeholder="Button metni"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Section Editor */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="size-5" />
                Features Section - Genel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="features-title">Başlık</Label>
                <Input
                  id="features-title"
                  value={editedContent.features.title}
                  onChange={(e) => setEditedContent({
                    ...editedContent,
                    features: { ...editedContent.features, title: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="features-desc">Açıklama</Label>
                <Textarea
                  id="features-desc"
                  value={editedContent.features.description}
                  onChange={(e) => setEditedContent({
                    ...editedContent,
                    features: { ...editedContent.features, description: e.target.value }
                  })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Feature Items */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {editedContent.features.items.map((item, index) => (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Feature #{index + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Başlık</Label>
                    <Input
                      value={item.title}
                      onChange={(e) => {
                        const newItems = [...editedContent.features.items];
                        newItems[index] = { ...newItems[index], title: e.target.value };
                        setEditedContent({
                          ...editedContent,
                          features: { ...editedContent.features, items: newItems }
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Açıklama</Label>
                    <Textarea
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...editedContent.features.items];
                        newItems[index] = { ...newItems[index], description: e.target.value };
                        setEditedContent({
                          ...editedContent,
                          features: { ...editedContent.features, items: newItems }
                        });
                      }}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Pricing Section Editor */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="size-5" />
                Pricing Section - Genel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pricing-title">Başlık</Label>
                <Input
                  id="pricing-title"
                  value={editedContent.pricing.title}
                  onChange={(e) => setEditedContent({
                    ...editedContent,
                    pricing: { ...editedContent.pricing, title: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricing-desc">Açıklama</Label>
                <Textarea
                  id="pricing-desc"
                  value={editedContent.pricing.description}
                  onChange={(e) => setEditedContent({
                    ...editedContent,
                    pricing: { ...editedContent.pricing, description: e.target.value }
                  })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing Plans */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {editedContent.pricing.plans.map((plan, index) => (
              <Card key={plan.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{plan.name} Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Plan Adı</Label>
                    <Input
                      value={plan.name}
                      onChange={(e) => {
                        const newPlans = [...editedContent.pricing.plans];
                        newPlans[index] = { ...newPlans[index], name: e.target.value };
                        setEditedContent({
                          ...editedContent,
                          pricing: { ...editedContent.pricing, plans: newPlans }
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fiyat (Sadece Görüntüleme - "Fiyatlandırma & İndirim" bölümünden yönetilir)</Label>
                    <Input
                      value={plan.name === 'Pro' && discountSettings
                        ? `${CURRENCY_SYMBOLS[discountSettings.baseCurrency]}${discountSettings.originalPrice.toFixed(2)}`
                        : plan.price
                      }
                      disabled
                      className="bg-muted cursor-not-allowed"
                    />
                    <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-800 dark:text-blue-300">
                      <Info className="size-4 mt-0.5 flex-shrink-0" />
                      <span>
                        Fiyat değişiklikleri için <strong>"Fiyatlandırma & İndirim"</strong> bölümünü kullanın. 
                        Bu bölümde gösterilen fiyat, "Fiyatlandırma & İndirim" bölümündeki orijinal fiyatı yansıtır.
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Açıklama</Label>
                    <Textarea
                      value={plan.description}
                      onChange={(e) => {
                        const newPlans = [...editedContent.pricing.plans];
                        newPlans[index] = { ...newPlans[index], description: e.target.value };
                        setEditedContent({
                          ...editedContent,
                          pricing: { ...editedContent.pricing, plans: newPlans }
                        });
                      }}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Özellikler (virgülle ayırın)</Label>
                    <Textarea
                      value={plan.features.join(', ')}
                      onChange={(e) => {
                        const newPlans = [...editedContent.pricing.plans];
                        newPlans[index] = { 
                          ...newPlans[index], 
                          features: e.target.value.split(',').map(f => f.trim()) 
                        };
                        setEditedContent({
                          ...editedContent,
                          pricing: { ...editedContent.pricing, plans: newPlans }
                        });
                      }}
                      rows={3}
                      placeholder="Özellik 1, Özellik 2, Özellik 3"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Blog Section Editor */}
        <TabsContent value="blog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5" />
                Blog Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="blog-title">Başlık</Label>
                <Input
                  id="blog-title"
                  value={editedContent.blog.title}
                  onChange={(e) => setEditedContent({
                    ...editedContent,
                    blog: { ...editedContent.blog, title: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-desc">Açıklama</Label>
                <Textarea
                  id="blog-desc"
                  value={editedContent.blog.description}
                  onChange={(e) => setEditedContent({
                    ...editedContent,
                    blog: { ...editedContent.blog, description: e.target.value }
                  })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CTA Section Editor */}
        <TabsContent value="cta" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="size-5" />
                Call-to-Action Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cta-title">Başlık</Label>
                <Input
                  id="cta-title"
                  value={editedContent.cta.title}
                  onChange={(e) => setEditedContent({
                    ...editedContent,
                    cta: { ...editedContent.cta, title: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta-desc">Açıklama</Label>
                <Textarea
                  id="cta-desc"
                  value={editedContent.cta.description}
                  onChange={(e) => setEditedContent({
                    ...editedContent,
                    cta: { ...editedContent.cta, description: e.target.value }
                  })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta-button">Button Metni</Label>
                <Input
                  id="cta-button"
                  value={editedContent.cta.buttonText}
                  onChange={(e) => setEditedContent({
                    ...editedContent,
                    cta: { ...editedContent.cta, buttonText: e.target.value }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}