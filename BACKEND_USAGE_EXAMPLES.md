# Backend API Kullanım Örnekleri

## 1. Authentication İşlemleri

### Login
```typescript
import { authService } from '@/services/authService';
import { toast } from 'sonner';

async function handleLogin(email: string, password: string) {
  try {
    const response = await authService.login({ email, password });
    toast.success(`Hoş geldiniz, ${response.user.name}!`);
    // Redirect to dashboard
    window.location.href = '/dashboard';
  } catch (error: any) {
    toast.error(error.message || 'Giriş başarısız');
  }
}
```

### Register
```typescript
import { authService } from '@/services/authService';

async function handleRegister(formData) {
  try {
    const response = await authService.register(formData);
    toast.success('Kayıt başarılı! Email doğrulama bağlantısı gönderildi.');
    return response;
  } catch (error: any) {
    toast.error(error.message);
  }
}
```

### Logout
```typescript
import { authService } from '@/services/authService';

async function handleLogout() {
  try {
    await authService.logout();
    toast.success('Başarıyla çıkış yapıldı');
    window.location.href = '/';
  } catch (error: any) {
    toast.error(error.message);
  }
}
```

### Change Password
```typescript
import { authService } from '@/services/authService';

async function handleChangePassword(oldPassword: string, newPassword: string) {
  try {
    await authService.changePassword({
      oldPassword,
      newPassword,
      confirmPassword: newPassword
    });
    toast.success('Şifreniz başarıyla değiştirildi');
  } catch (error: any) {
    toast.error(error.message);
  }
}
```

### Forgot Password
```typescript
import { authService } from '@/services/authService';

async function handleForgotPassword(email: string) {
  try {
    await authService.forgotPassword({ email });
    toast.success('Şifre sıfırlama bağlantısı email adresinize gönderildi');
  } catch (error: any) {
    toast.error(error.message);
  }
}
```

### Reset Password Confirm
```typescript
import { authService } from '@/services/authService';

async function handleResetPassword(token: string, newPassword: string) {
  try {
    await authService.resetPasswordConfirm({
      token,
      newPassword,
      confirmPassword: newPassword
    });
    toast.success('Şifreniz başarıyla sıfırlandı');
    window.location.href = '/login';
  } catch (error: any) {
    toast.error(error.message);
  }
}
```

## 2. User Management

### Kullanıcı Listesi
```typescript
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { User } from '@/contexts/AdminDataContext';

function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### Kullanıcı Ekleme
```typescript
import { adminService } from '@/services/adminService';

async function addNewUser() {
  try {
    const newUser = await adminService.createUser({
      name: 'John Doe',
      email: 'john@example.com',
      plan: 'Free',
      status: 'active'
    });
    
    toast.success('Kullanıcı başarıyla eklendi');
    return newUser;
  } catch (error: any) {
    toast.error(error.message);
  }
}
```

### Kullanıcı Güncelleme
```typescript
async function updateUserPlan(userId: string, newPlan: 'Free' | 'Premium') {
  try {
    await adminService.updateUser(userId, { plan: newPlan });
    toast.success('Plan güncellendi');
  } catch (error: any) {
    toast.error(error.message);
  }
}
```

### Kullanıcı Silme
```typescript
async function deleteUser(userId: string) {
  if (!confirm('Kullanıcıyı silmek istediğinizden emin misiniz?')) {
    return;
  }

  try {
    await adminService.deleteUser(userId);
    toast.success('Kullanıcı silindi');
  } catch (error: any) {
    toast.error(error.message);
  }
}
```

## 3. useApi Hook ile Kullanım

### Simple GET Request
```typescript
import { useApi } from '@/hooks/useApi';
import { adminService } from '@/services/adminService';

function StatsComponent() {
  const { 
    data: stats, 
    loading, 
    error, 
    execute 
  } = useApi(
    adminService.getStats,
    { showErrorToast: true }
  );

  useEffect(() => {
    execute();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Toplam Ziyaretçi: {stats?.totalVisitors}</h2>
      <h2>Aktif Kullanıcı: {stats?.activeUsers}</h2>
    </div>
  );
}
```

### POST Request with Mutation
```typescript
import { useApiMutation } from '@/hooks/useApi';
import { adminService } from '@/services/adminService';

function CreateUserForm() {
  const { execute, loading } = useApiMutation(
    adminService.createUser,
    {
      showSuccessToast: true,
      successMessage: 'Kullanıcı oluşturuldu'
    }
  );

  async function handleSubmit(formData) {
    const result = await execute(formData);
    if (result) {
      // Success - do something
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={loading}>
        {loading ? 'Oluşturuluyor...' : 'Oluştur'}
      </button>
    </form>
  );
}
```

## 4. Advertisement Management

### Reklam Listesi
```typescript
async function loadAds() {
  try {
    const ads = await adminService.getAdvertisements();
    return ads.filter(ad => ad.enabled);
  } catch (error) {
    toast.error('Reklamlar yüklenemedi');
    return [];
  }
}
```

### Yeni Reklam Ekleme
```typescript
async function createAd() {
  try {
    const newAd = await adminService.createAdvertisement({
      title: 'Yeni Kampanya',
      type: 'image',
      placement: 'banner',
      mediaUrl: 'https://example.com/banner.jpg',
      linkUrl: 'https://example.com/campaign',
      duration: 10,
      frequency: 30,
      enabled: true
    });
    
    toast.success('Reklam eklendi');
    return newAd;
  } catch (error: any) {
    toast.error(error.message);
  }
}
```

### Reklam Görüntüleme Sayısını Artırma
```typescript
async function trackAdView(adId: string) {
  try {
    await adminService.incrementAdView(adId);
  } catch (error) {
    console.error('Ad view tracking failed:', error);
  }
}
```

## 5. File Upload

### Resim Yükleme
```typescript
import { adminService } from '@/services/adminService';

async function uploadImage(file: File) {
  try {
    const result = await adminService.uploadFile(
      file,
      (progress) => {
        console.log(`Upload progress: ${progress}%`);
        // Update progress bar
      }
    );
    
    toast.success('Dosya yüklendi');
    return result.url;
  } catch (error: any) {
    toast.error('Yükleme başarısız');
  }
}

// Kullanım
function ImageUploader() {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input 
        type="file" 
        onChange={handleFileChange}
        accept="image/*"
        disabled={uploading}
      />
      {uploading && <div>Yükleniyor...</div>}
      {imageUrl && <img src={imageUrl} alt="Uploaded" />}
    </div>
  );
}
```

## 6. Settings Management

### Site Ayarlarını Güncelleme
```typescript
async function updateSiteSettings(settings) {
  try {
    await adminService.updateSettings({
      siteName: settings.siteName,
      siteUrl: settings.siteUrl,
      defaultLanguage: settings.defaultLanguage,
      timezone: settings.timezone
    });
    
    toast.success('Ayarlar kaydedildi');
  } catch (error: any) {
    toast.error(error.message);
  }
}
```

### Reklam Ayarlarını Güncelleme
```typescript
async function updateAdSettings(enabled: boolean) {
  try {
    await adminService.updateAdSettings({
      systemEnabled: enabled,
      popupEnabled: enabled,
      bannerEnabled: enabled,
      sidebarEnabled: enabled
    });
    
    toast.success('Reklam ayarları güncellendi');
  } catch (error: any) {
    toast.error(error.message);
  }
}
```

## 7. Statistics & Analytics

### Dashboard İstatistikleri
```typescript
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';

function DashboardStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Stats loading failed:', error);
    }
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard 
        title="Toplam Ziyaretçi" 
        value={stats?.totalVisitors}
        change={stats?.visitorChange}
      />
      <StatCard 
        title="Aktif Kullanıcı" 
        value={stats?.activeUsers}
        change={stats?.userChange}
      />
      <StatCard 
        title="Aylık Gelir" 
        value={`€${stats?.monthlyRevenue}`}
        change={stats?.revenueChange}
      />
      <StatCard 
        title="Dönüşüm Oranı" 
        value={`${stats?.conversionRate}%`}
        change={stats?.conversionChange}
      />
    </div>
  );
}
```

## 8. Real-time Data Sync

### Backend ile Otomatik Senkronizasyon
```typescript
import { useAdminDataBackend } from '@/contexts/AdminDataBackendContext';

function SyncButton() {
  const { syncWithBackend, isBackendConnected, backendStatus } = useAdminDataBackend();

  return (
    <div>
      <div>
        Status: {backendStatus}
      </div>
      <button 
        onClick={syncWithBackend}
        disabled={!isBackendConnected}
      >
        Sync with Backend
      </button>
    </div>
  );
}
```

### Backend Modu Toggle
```typescript
import { useAdminDataBackend } from '@/contexts/AdminDataBackendContext';

function BackendToggle() {
  const { toggleBackendMode, isBackendConnected } = useAdminDataBackend();

  return (
    <label>
      <input 
        type="checkbox" 
        checked={isBackendConnected}
        onChange={(e) => toggleBackendMode(e.target.checked)}
      />
      Backend Mode
    </label>
  );
}
```

## 9. Error Handling Pattern

### Try-Catch with Toast
```typescript
async function safeApiCall() {
  try {
    toast.loading('İşlem yapılıyor...');
    const result = await adminService.someMethod();
    toast.dismiss();
    toast.success('İşlem başarılı');
    return result;
  } catch (error: any) {
    toast.dismiss();
    toast.error(error.message || 'Bir hata oluştu');
    console.error('API Error:', error);
  }
}
```

### Custom Error Handler
```typescript
import { ApiError } from '@/services/apiService';

function handleApiError(error: any) {
  const apiError = error as ApiError;
  
  switch (apiError.statusCode) {
    case 401:
      // Redirect to login
      window.location.href = '/login';
      break;
    case 403:
      toast.error('Bu işlem için yetkiniz yok');
      break;
    case 404:
      toast.error('Kaynak bulunamadı');
      break;
    case 422:
      // Validation error
      const details = apiError.details;
      if (details?.errors) {
        Object.values(details.errors).forEach((msg: any) => {
          toast.error(msg);
        });
      }
      break;
    default:
      toast.error(apiError.message);
  }
}
```

## 10. Advanced Usage

### Paralel API Çağrıları
```typescript
async function loadAllData() {
  try {
    const [users, content, ads, stats] = await Promise.all([
      adminService.getUsers(),
      adminService.getContent(),
      adminService.getAdvertisements(),
      adminService.getStats()
    ]);

    return { users, content, ads, stats };
  } catch (error) {
    toast.error('Veriler yüklenemedi');
  }
}
```

### Conditional API Calls
```typescript
async function loadDataConditionally(backendEnabled: boolean) {
  if (backendEnabled) {
    // Load from backend
    return await adminService.getUsers();
  } else {
    // Use local data
    return getLocalUsers();
  }
}
```

### Retry Logic (Manual)
```typescript
async function retryableApiCall(maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await adminService.getStats();
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  throw lastError;
}
```

---

Bu örnekleri projenizde kullanarak backend entegrasyonunu kolayca yapabilirsiniz. Her örnek production-ready kod içerir ve best practices'i takip eder.