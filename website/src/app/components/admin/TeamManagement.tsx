import { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, MoveUp, MoveDown } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { toast } from 'sonner';
import { useAdminData, TeamMember } from '@/contexts/AdminDataContext';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Switch } from '@/app/components/ui/switch';

export function TeamManagement() {
  const { teamMembers, addTeamMember, updateTeamMember, deleteTeamMember } = useAdminData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState<Omit<TeamMember, 'id'>>({
    name: '',
    role: '',
    avatar: '',
    bio: '',
    linkedin: '',
    twitter: '',
    email: '',
    enabled: true,
    order: teamMembers.length,
  });

  const sortedMembers = [...teamMembers].sort((a, b) => a.order - b.order);

  const handleOpenDialog = (member?: TeamMember) => {
    if (member) {
      setEditingMember(member);
      setFormData(member);
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        role: '',
        avatar: '',
        bio: '',
        linkedin: '',
        twitter: '',
        email: '',
        enabled: true,
        order: teamMembers.length,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMember(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.role || !formData.avatar || !formData.bio) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    if (editingMember) {
      updateTeamMember(editingMember.id, formData);
      toast.success('Ekip üyesi güncellendi');
    } else {
      addTeamMember(formData);
      toast.success('Ekip üyesi eklendi');
    }

    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu ekip üyesini silmek istediğinizden emin misiniz?')) {
      deleteTeamMember(id);
      toast.success('Ekip üyesi silindi');
    }
  };

  const handleToggleEnabled = (id: string, enabled: boolean) => {
    updateTeamMember(id, { enabled });
    toast.success(enabled ? 'Ekip üyesi aktif edildi' : 'Ekip üyesi pasif edildi');
  };

  const handleMoveUp = (member: TeamMember) => {
    const currentIndex = sortedMembers.findIndex(m => m.id === member.id);
    if (currentIndex > 0) {
      const prevMember = sortedMembers[currentIndex - 1];
      updateTeamMember(member.id, { order: prevMember.order });
      updateTeamMember(prevMember.id, { order: member.order });
      toast.success('Sıralama güncellendi');
    }
  };

  const handleMoveDown = (member: TeamMember) => {
    const currentIndex = sortedMembers.findIndex(m => m.id === member.id);
    if (currentIndex < sortedMembers.length - 1) {
      const nextMember = sortedMembers[currentIndex + 1];
      updateTeamMember(member.id, { order: nextMember.order });
      updateTeamMember(nextMember.id, { order: member.order });
      toast.success('Sıralama güncellendi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ekip Yönetimi</h2>
          <p className="text-sm text-muted-foreground">Ekip üyelerini ekleyin ve yönetin</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="size-4 mr-2" />
          Ekip Üyesi Ekle
        </Button>
      </div>

      {/* Team Members List */}
      <div className="grid gap-4">
        {sortedMembers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Henüz ekip üyesi eklenmedi</p>
            </CardContent>
          </Card>
        ) : (
          sortedMembers.map((member, index) => (
            <Card key={member.id}>
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  {/* Avatar */}
                  <Avatar className="size-16 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-secondary to-accent text-white text-xl font-bold">
                      {member.avatar}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{member.name}</h3>
                      <span className="text-sm text-secondary font-semibold">{member.role}</span>
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs text-muted-foreground">
                          {member.enabled ? 'Aktif' : 'Pasif'}
                        </span>
                        <Switch
                          checked={member.enabled}
                          onCheckedChange={(checked) => handleToggleEnabled(member.id, checked)}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{member.bio}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {member.email && <span>✉ {member.email}</span>}
                      {member.linkedin && <span>🔗 LinkedIn</span>}
                      {member.twitter && <span>🐦 Twitter</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveUp(member)}
                      disabled={index === 0}
                    >
                      <MoveUp className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveDown(member)}
                      disabled={index === sortedMembers.length - 1}
                    >
                      <MoveDown className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(member)}
                    >
                      <Edit2 className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(member.id)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Ekip Üyesini Düzenle' : 'Yeni Ekip Üyesi Ekle'}</DialogTitle>
            <DialogDescription>
              Ekip üyesi bilgilerini girin. İnisiyaller avatar olarak gösterilir.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">İsim *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Etem Düzok"
                required
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Pozisyon *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="CEO & Founder"
                required
              />
            </div>

            {/* Avatar Initials */}
            <div className="space-y-2">
              <Label htmlFor="avatar">İnisiyaller (Avatar) *</Label>
              <Input
                id="avatar"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value.toUpperCase() })}
                placeholder="ED"
                maxLength={3}
                required
              />
              <p className="text-xs text-muted-foreground">
                2-3 harf (örn: ED, JD, TM)
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Kısa Biyografi *</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="10+ yıllık futbol analizi deneyimi..."
                rows={3}
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email (Opsiyonel)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="etem@tacticiq.app"
              />
            </div>

            {/* LinkedIn */}
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn (Opsiyonel)</Label>
              <Input
                id="linkedin"
                type="url"
                value={formData.linkedin}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            {/* Twitter */}
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter (Opsiyonel)</Label>
              <Input
                id="twitter"
                type="url"
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                placeholder="https://twitter.com/username"
              />
            </div>

            {/* Enabled */}
            <div className="flex items-center gap-2">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
              <Label htmlFor="enabled">Aktif (Web sitesinde göster)</Label>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                <Save className="size-4 mr-2" />
                {editingMember ? 'Güncelle' : 'Ekle'}
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
