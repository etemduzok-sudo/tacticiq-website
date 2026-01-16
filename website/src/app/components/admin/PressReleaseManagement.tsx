import { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Star, FileText } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { toast } from 'sonner';
import { useAdminData, PressRelease } from '@/contexts/AdminDataContext';
import { Switch } from '@/app/components/ui/switch';
import { Badge } from '@/app/components/ui/badge';

const CATEGORIES = [
  { value: 'product', label: 'Ürün' },
  { value: 'partnership', label: 'İşbirliği' },
  { value: 'award', label: 'Ödül' },
  { value: 'event', label: 'Etkinlik' },
  { value: 'other', label: 'Diğer' },
] as const;

export function PressReleaseManagement() {
  const { pressReleases, addPressRelease, updatePressRelease, deletePressRelease } = useAdminData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<PressRelease | null>(null);
  const [formData, setFormData] = useState<Omit<PressRelease, 'id'>>({
    title: '',
    subtitle: '',
    date: new Date().toISOString().split('T')[0],
    category: 'product',
    content: '',
    imageUrl: '',
    pdfUrl: '',
    enabled: true,
    featured: false,
    author: 'TacticIQ Ekibi',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  const sortedReleases = [...pressReleases].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleOpenDialog = (release?: PressRelease) => {
    if (release) {
      setEditingRelease(release);
      setFormData(release);
    } else {
      setEditingRelease(null);
      setFormData({
        title: '',
        subtitle: '',
        date: new Date().toISOString().split('T')[0],
        category: 'product',
        content: '',
        imageUrl: '',
        pdfUrl: '',
        enabled: true,
        featured: false,
        author: 'TacticIQ Ekibi',
        tags: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRelease(null);
    setTagInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.date) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    if (editingRelease) {
      updatePressRelease(editingRelease.id, formData);
      toast.success('Basın bülteni güncellendi');
    } else {
      addPressRelease(formData);
      toast.success('Basın bülteni eklendi');
    }

    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu basın bültenini silmek istediğinizden emin misiniz?')) {
      deletePressRelease(id);
      toast.success('Basın bülteni silindi');
    }
  };

  const handleToggleEnabled = (id: string, enabled: boolean) => {
    updatePressRelease(id, { enabled });
    toast.success(enabled ? 'Basın bülteni yayınlandı' : 'Basın bülteni yayından kaldırıldı');
  };

  const handleToggleFeatured = (id: string, featured: boolean) => {
    updatePressRelease(id, { featured });
    toast.success(featured ? 'Basın bülteni öne çıkarıldı' : 'Basın bülteni öne çıkarmadan kaldırıldı');
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Basın Bültenleri</h2>
          <p className="text-sm text-muted-foreground">Basın bültenlerini ekleyin ve yönetin</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="size-4 mr-2" />
          Basın Bülteni Ekle
        </Button>
      </div>

      {/* Press Releases List */}
      <div className="grid gap-4">
        {sortedReleases.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Henüz basın bülteni eklenmedi</p>
            </CardContent>
          </Card>
        ) : (
          sortedReleases.map((release) => (
            <Card key={release.id}>
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Image Preview */}
                  {release.imageUrl && (
                    <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={release.imageUrl} 
                        alt={release.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg">{release.title}</h3>
                          {release.featured && (
                            <Star className="size-4 text-accent fill-accent" />
                          )}
                        </div>
                        {release.subtitle && (
                          <p className="text-sm text-muted-foreground mb-2">{release.subtitle}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <span>📅 {new Date(release.date).toLocaleDateString('tr-TR')}</span>
                          <Badge variant="secondary">{getCategoryLabel(release.category)}</Badge>
                          <span>✍️ {release.author}</span>
                        </div>
                        {release.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {release.tags.map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {release.content}
                        </p>
                      </div>

                      {/* Status Controls */}
                      <div className="flex flex-col gap-3 items-end">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {release.enabled ? 'Yayında' : 'Taslak'}
                          </span>
                          <Switch
                            checked={release.enabled}
                            onCheckedChange={(checked) => handleToggleEnabled(release.id, checked)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Öne Çıkan</span>
                          <Switch
                            checked={release.featured}
                            onCheckedChange={(checked) => handleToggleFeatured(release.id, checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(release)}
                    >
                      <Edit2 className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(release.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRelease ? 'Basın Bültenini Düzenle' : 'Yeni Basın Bülteni Ekle'}</DialogTitle>
            <DialogDescription>
              Basın bülteni detaylarını girin. Markdown formatı desteklenir.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Başlık *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="TacticIQ Yeni Özellik Duyurusu"
                required
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <Label htmlFor="subtitle">Alt Başlık (Opsiyonel)</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Yapay zeka destekli maç analizi artık TacticIQ'da"
              />
            </div>

            {/* Date & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Tarih *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Author */}
            <div className="space-y-2">
              <Label htmlFor="author">Yazar *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="TacticIQ Ekibi"
                required
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">İçerik (Markdown) *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Basın bülteni içeriğini buraya yazın..."
                rows={8}
                required
              />
              <p className="text-xs text-muted-foreground">
                Markdown formatı desteklenir: **kalın**, *italik*, [link](url)
              </p>
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Kapak Görseli URL (Opsiyonel)</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* PDF URL */}
            <div className="space-y-2">
              <Label htmlFor="pdfUrl">PDF Dosyası URL (Opsiyonel)</Label>
              <Input
                id="pdfUrl"
                type="url"
                value={formData.pdfUrl}
                onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
                placeholder="https://example.com/document.pdf"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Etiketler</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Etiket ekle..."
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Ekle
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Switches */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
                <Label htmlFor="enabled">Yayınla (Web sitesinde göster)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured">Öne Çıkar</Label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                <Save className="size-4 mr-2" />
                {editingRelease ? 'Güncelle' : 'Ekle'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                <X className="size-4 mr-2" />
                İptal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
