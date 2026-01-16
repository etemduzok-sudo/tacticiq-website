import { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, MoveUp, MoveDown } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { toast } from 'sonner';
import { useAdminData } from '@/contexts/AdminDataContext';
import { Partner } from '@/contexts/AdminDataContext';
import { Switch } from '@/app/components/ui/switch';
import { Image as ImageIcon, ExternalLink } from 'lucide-react';

export function PartnerManagement() {
  const { partners, addPartner, updatePartner, deletePartner } = useAdminData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState<Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    logo: '',
    website: '',
    description: '',
    category: '',
    enabled: true,
    featured: false,
    order: partners.length,
  });

  const sortedPartners = [...partners].sort((a, b) => a.order - b.order);
  const enabledPartners = sortedPartners.filter(p => p.enabled);

  const handleOpenDialog = (partner?: Partner) => {
    if (partner) {
      setEditingPartner(partner);
      setFormData({
        name: partner.name,
        logo: partner.logo,
        website: partner.website || '',
        description: partner.description || '',
        category: partner.category || '',
        enabled: partner.enabled,
        featured: partner.featured,
        order: partner.order,
      });
    } else {
      setEditingPartner(null);
      setFormData({
        name: '',
        logo: '',
        website: '',
        description: '',
        category: '',
        enabled: true,
        featured: false,
        order: partners.length,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPartner(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.logo) {
      toast.error('Lütfen partner adı ve logo alanlarını doldurun');
      return;
    }

    if (editingPartner) {
      updatePartner(editingPartner.id, formData);
      toast.success('Partner güncellendi');
    } else {
      addPartner(formData);
      toast.success('Partner eklendi');
    }

    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu partneri silmek istediğinizden emin misiniz?')) {
      deletePartner(id);
      toast.success('Partner silindi');
    }
  };

  const handleToggleEnabled = (id: string, enabled: boolean) => {
    updatePartner(id, { enabled });
    toast.success(enabled ? 'Partner aktif edildi' : 'Partner pasif edildi');
  };

  const handleToggleFeatured = (id: string, featured: boolean) => {
    updatePartner(id, { featured });
    toast.success(featured ? 'Partner öne çıkarıldı' : 'Partner öne çıkarmadan kaldırıldı');
  };

  const handleMoveUp = (partner: Partner) => {
    const currentIndex = sortedPartners.findIndex(p => p.id === partner.id);
    if (currentIndex > 0) {
      const prevPartner = sortedPartners[currentIndex - 1];
      updatePartner(partner.id, { order: prevPartner.order });
      updatePartner(prevPartner.id, { order: partner.order });
      toast.success('Sıralama güncellendi');
    }
  };

  const handleMoveDown = (partner: Partner) => {
    const currentIndex = sortedPartners.findIndex(p => p.id === partner.id);
    if (currentIndex < sortedPartners.length - 1) {
      const nextPartner = sortedPartners[currentIndex + 1];
      updatePartner(partner.id, { order: nextPartner.order });
      updatePartner(nextPartner.id, { order: partner.order });
      toast.success('Sıralama güncellendi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Partner Yönetimi</h2>
          <p className="text-sm text-muted-foreground">
            Web sitesinde gösterilecek ortakları/partnerleri yönetin
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="size-4" />
          Yeni Partner Ekle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{partners.length}</div>
            <div className="text-sm text-muted-foreground">Toplam Partner</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{enabledPartners.length}</div>
            <div className="text-sm text-muted-foreground">Aktif Partner</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-accent">{sortedPartners.filter(p => p.featured).length}</div>
            <div className="text-sm text-muted-foreground">Öne Çıkan Partner</div>
          </CardContent>
        </Card>
      </div>

      {/* Partners List */}
      <Card>
        <CardHeader>
          <CardTitle>Partnerler ({partners.length})</CardTitle>
          <CardDescription>
            Aktif partnerler web sitesinin "Ortaklar" bölümünde gösterilir
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedPartners.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="size-12 mx-auto mb-4 opacity-50" />
              <p>Henüz partner eklenmemiş</p>
              <Button onClick={() => handleOpenDialog()} className="mt-4 gap-2">
                <Plus className="size-4" />
                İlk Partneri Ekle
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedPartners.map((partner, index) => (
                <div
                  key={partner.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    partner.enabled ? 'bg-background' : 'bg-muted/50 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {partner.logo ? (
                      <img
                        src={partner.logo}
                        alt={partner.name}
                        className="w-16 h-16 object-contain rounded border bg-white p-2"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center">
                        <ImageIcon className="size-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{partner.name}</p>
                        {partner.featured && (
                          <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded">Öne Çıkan</span>
                        )}
                        {!partner.enabled && (
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded">Pasif</span>
                        )}
                      </div>
                      {partner.category && (
                        <p className="text-xs text-muted-foreground mb-1">Kategori: {partner.category}</p>
                      )}
                      {partner.website && (
                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="size-3" />
                          {partner.website}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMoveUp(partner)}
                        disabled={index === 0}
                      >
                        <MoveUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMoveDown(partner)}
                        disabled={index === sortedPartners.length - 1}
                      >
                        <MoveDown className="size-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 border-l pl-2">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Aktif</span>
                          <Switch
                            checked={partner.enabled}
                            onCheckedChange={(checked) => handleToggleEnabled(partner.id, checked)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Öne Çıkan</span>
                          <Switch
                            checked={partner.featured}
                            onCheckedChange={(checked) => handleToggleFeatured(partner.id, checked)}
                          />
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(partner)}>
                      <Edit2 className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(partner.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPartner ? 'Partner Düzenle' : 'Yeni Partner Ekle'}</DialogTitle>
            <DialogDescription>
              Partner bilgilerini girin. Logo ve web sitesi URL'i ekleyin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Partner Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: TechCorp"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Örn: Sponsor, Teknoloji Ortağı"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL *</Label>
              <Input
                id="logo"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                placeholder="https://example.com/logo.png"
                required
              />
              <p className="text-xs text-muted-foreground">Partner logosunun URL adresi veya base64 formatında</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Web Sitesi URL</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Partner hakkında kısa açıklama..."
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                  />
                  <Label>Aktif</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                  />
                  <Label>Öne Çıkan</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  <X className="size-4 mr-2" />
                  İptal
                </Button>
                <Button type="submit" className="gap-2">
                  <Save className="size-4" />
                  {editingPartner ? 'Güncelle' : 'Ekle'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
