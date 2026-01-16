import { useState, useContext } from 'react';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { AdminDataContext, Advertisement } from '@/contexts/AdminDataContext';
import { Monitor, Trash2, Plus } from 'lucide-react';

export function AdManagement() {
  const contextData = useContext(AdminDataContext);
  
  if (!contextData) {
    return <div className="p-4 text-center">Reklamlar yükleniyor...</div>;
  }
  
  const { advertisements, addAdvertisement, deleteAdvertisement, updateAdvertisement } = contextData;
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [newAd, setNewAd] = useState({
    title: '',
    type: 'image' as 'image' | 'video',
    placement: 'popup' as 'popup' | 'banner' | 'sidebar',
    mediaUrl: '',
    linkUrl: '',
    duration: 10,
    frequency: 5,
    displayCount: undefined as number | undefined,
    currentDisplays: 0,
    enabled: true,
  });

  const handleAddAd = () => {
    if (!newAd.title || !newAd.mediaUrl) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    addAdvertisement(newAd);
    toast.success('Reklam başarıyla eklendi');
    setShowAddDialog(false);
    setNewAd({ title: '', type: 'image', placement: 'popup', mediaUrl: '', linkUrl: '', duration: 10, frequency: 5, displayCount: undefined, currentDisplays: 0, enabled: true });
  };

  const handleDeleteAd = (id: string, title: string) => {
    if (confirm(`"${title}" reklamını silmek istediğinize emin misiniz?`)) {
      deleteAdvertisement(id);
      toast.success('Reklam silindi');
    }
  };

  const handleEditAd = (ad: Advertisement) => {
    setEditingAd(ad);
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editingAd || !editingAd.title || !editingAd.mediaUrl) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    updateAdvertisement(editingAd.id, editingAd);
    toast.success('Reklam güncellendi');
    setShowEditDialog(false);
    setEditingAd(null);
  };

  return (
    <>
      {/* Advertisements List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor className="size-4" />
            Reklam Listesi
          </CardTitle>
            <Button
              onClick={() => setShowAddDialog(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="size-4" />
              Yeni Reklam Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {advertisements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Henüz reklam eklenmemiş
              </div>
            ) : (
              advertisements.map((ad) => (
                <div key={ad.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{ad.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {ad.type === 'image' ? '🖼️ Resim' : '🎥 Video'} • {ad.placement === 'popup' ? '🪟 Popup' : ad.placement === 'banner' ? '📰 Banner' : '📌 Sidebar'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Süre: {ad.duration}s • Frekans: {ad.frequency} dk • Gösterim: {ad.currentDisplays || 0}/{ad.displayCount || '∞'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${ad.enabled ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                      {ad.enabled ? 'Aktif' : 'Pasif'}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAd(ad)}
                    >
                      Düzenle
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAd(ad.id, ad.title)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Advertisement Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Reklam Ekle</DialogTitle>
            <DialogDescription>Sisteme yeni reklam ekleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ad-title">Başlık</Label>
              <Input
                id="ad-title"
                value={newAd.title}
                onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                placeholder="Reklam başlığı"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ad-type">Tip</Label>
                <Select value={newAd.type} onValueChange={(value: 'image' | 'video') => setNewAd({ ...newAd, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Resim</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-placement">Yerleşim</Label>
                <Select value={newAd.placement} onValueChange={(value: 'popup' | 'banner' | 'sidebar') => setNewAd({ ...newAd, placement: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popup">Popup</SelectItem>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="sidebar">Sidebar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ad-mediaUrl">Medya URL</Label>
              <Input
                id="ad-mediaUrl"
                value={newAd.mediaUrl}
                onChange={(e) => setNewAd({ ...newAd, mediaUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ad-linkUrl">Link URL (Opsiyonel)</Label>
              <Input
                id="ad-linkUrl"
                value={newAd.linkUrl}
                onChange={(e) => setNewAd({ ...newAd, linkUrl: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ad-duration">Süre (sn)</Label>
                <Input
                  id="ad-duration"
                  type="number"
                  value={newAd.duration}
                  onChange={(e) => setNewAd({ ...newAd, duration: parseInt(e.target.value) || 10 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-frequency">Frekans (dk)</Label>
                <Input
                  id="ad-frequency"
                  type="number"
                  value={newAd.frequency}
                  onChange={(e) => setNewAd({ ...newAd, frequency: parseInt(e.target.value) || 5 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-displayCount">Max Gösterim</Label>
                <Input
                  id="ad-displayCount"
                  type="number"
                  value={newAd.displayCount || ''}
                  onChange={(e) => setNewAd({ ...newAd, displayCount: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Sınırsız"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ad-enabled"
                checked={newAd.enabled}
                onChange={(e) => setNewAd({ ...newAd, enabled: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="ad-enabled">Aktif</Label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>İptal</Button>
              <Button onClick={handleAddAd}>Ekle</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Advertisement Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reklamı Düzenle</DialogTitle>
            <DialogDescription>Reklam bilgilerini güncelleyin</DialogDescription>
          </DialogHeader>
          {editingAd && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-ad-title">Başlık</Label>
                <Input
                  id="edit-ad-title"
                  value={editingAd.title}
                  onChange={(e) => setEditingAd({ ...editingAd, title: e.target.value })}
                  placeholder="Reklam başlığı"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-ad-type">Tip</Label>
                  <Select value={editingAd.type} onValueChange={(value: 'image' | 'video') => setEditingAd({ ...editingAd, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Resim</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ad-placement">Yerleşim</Label>
                  <Select value={editingAd.placement} onValueChange={(value: 'popup' | 'banner' | 'sidebar') => setEditingAd({ ...editingAd, placement: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popup">Popup</SelectItem>
                      <SelectItem value="banner">Banner</SelectItem>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ad-mediaUrl">Medya URL</Label>
                <Input
                  id="edit-ad-mediaUrl"
                  value={editingAd.mediaUrl}
                  onChange={(e) => setEditingAd({ ...editingAd, mediaUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ad-linkUrl">Link URL (Opsiyonel)</Label>
                <Input
                  id="edit-ad-linkUrl"
                  value={editingAd.linkUrl}
                  onChange={(e) => setEditingAd({ ...editingAd, linkUrl: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-ad-duration">Süre (sn)</Label>
                  <Input
                    id="edit-ad-duration"
                    type="number"
                    value={editingAd.duration}
                    onChange={(e) => setEditingAd({ ...editingAd, duration: parseInt(e.target.value) || 10 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ad-frequency">Frekans (dk)</Label>
                  <Input
                    id="edit-ad-frequency"
                    type="number"
                    value={editingAd.frequency}
                    onChange={(e) => setEditingAd({ ...editingAd, frequency: parseInt(e.target.value) || 5 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ad-displayCount">Max Gösterim</Label>
                  <Input
                    id="edit-ad-displayCount"
                    type="number"
                    value={editingAd.displayCount || ''}
                    onChange={(e) => setEditingAd({ ...editingAd, displayCount: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="Sınırsız"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-ad-enabled"
                  checked={editingAd.enabled}
                  onChange={(e) => setEditingAd({ ...editingAd, enabled: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="edit-ad-enabled">Aktif</Label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>İptal</Button>
                <Button onClick={handleSaveEdit}>Kaydet</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
