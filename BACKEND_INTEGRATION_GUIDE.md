# Backend Entegrasyon Rehberi

TacticIQ web sitesinin backend API'ye bağlanması için gerekli tüm yapı kurulmuştur.

## 📁 Oluşturulan Dosyalar

### 1. **API Konfigürasyonu**
- **`/src/config/api.config.ts`**: Backend API URL'leri, endpoint'ler ve hata mesajları
- **`/.env.example`**: Environment variables örnek dosyası

### 2. **Servisler**
- **`/src/services/apiService.ts`**: Axios tabanlı HTTP client servisi
  - GET, POST, PUT, PATCH, DELETE methodları
  - Automatic token yönetimi
  - Request/Response interceptors
  - Retry logic
  - Error handling
  
- **`/src/services/adminService.ts`**: Admin panel için backend API çağrıları
  - Users CRUD
  - Content CRUD
  - Advertisements CRUD
  - Statistics
  - Settings
  - Logs & Activities
  - File upload

### 3. **Hooks**
- **`/src/hooks/useApi.ts`**: API çağrıları için custom React hooks
  - `useApi()`: Genel API hook
  - `useApiMutation()`: POST, PUT, DELETE için
  - `useApiQuery()`: GET için (auto-fetch desteği)

### 4. **Context**
- **`/src/contexts/AdminDataBackendContext.tsx`**: Backend entegrasyon katmanı
  - Backend connection status
  - Auto sync
  - Local/Backend mode toggle

## 🚀 Kullanım

### 1. Environment Variables Ayarlama

`.env` dosyası oluşturun (`.env.example`'dan kopyalayın):

```bash
# Backend API Configuration
VITE_API_BASE_URL=https://your-backend-api.com/api

# Environment
VITE_ENV=production
```

### 2. Backend API Kullanımı

#### Basit API Çağrısı
```typescript
import { apiService } from '@/services/apiService';

// GET request
const response = await apiService.get('/users');

// POST request
const response = await apiService.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});
```

#### Admin Service Kullanımı
```typescript
import { adminService } from '@/services/adminService';

// Get all users
const users = await adminService.getUsers();

// Create user
const newUser = await adminService.createUser({
  name: 'Jane Doe',
  email: 'jane@example.com',
  plan: 'Premium',
  status: 'active'
});

// Update user
await adminService.updateUser('user-id', {
  plan: 'Free'
});
```

#### useApi Hook Kullanımı
```typescript
import { useApi } from '@/hooks/useApi';
import { adminService } from '@/services/adminService';

function MyComponent() {
  const { data, loading, error, execute } = useApi(
    adminService.getUsers,
    {
      showErrorToast: true,
      showSuccessToast: true,
      successMessage: 'Kullanıcılar yüklendi'
    }
  );

  useEffect(() => {
    execute();
  }, []);

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata: {error.message}</div>;
  
  return <div>{data?.map(user => ...)}</div>;
}
```

### 3. Admin Panel Backend Entegrasyonu

Admin panel zaten backend desteklidir. Sadece `.env` dosyasını yapılandırın.

```typescript
// App.tsx içinde
import { AdminDataBackendProvider } from '@/contexts/AdminDataBackendContext';

<AdminDataBackendProvider enableBackend={true}>
  <AdminDataProvider>
    {/* ... */}
  </AdminDataProvider>
</AdminDataBackendProvider>
```

## 🔧 Backend API Gereksinimleri

### Authentication

Tüm API endpoint'leri `Authorization` header'ı ile JWT token bekler:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Response Format

Tüm API response'ları şu formatta olmalı:

```json
{
  "success": true,
  "data": { ... },
  "message": "İşlem başarılı",
  "statusCode": 200
}
```

Hata durumunda:
```json
{
  "success": false,
  "error": "Hata mesajı",
  "message": "Detaylı hata açıklaması",
  "statusCode": 400
}
```

### API Endpoints

#### Authentication
- `POST /auth/login` - Kullanıcı girişi
- `POST /auth/register` - Kullanıcı kaydı
- `POST /auth/logout` - Çıkış
- `POST /auth/refresh` - Token yenileme

#### Users
- `GET /users/list` - Tüm kullanıcıları getir
- `POST /users` - Yeni kullanıcı oluştur
- `PUT /users/:id` - Kullanıcı güncelle
- `DELETE /users/:id` - Kullanıcı sil

#### Content
- `GET /content/list` - Tüm içerikleri getir
- `POST /content/create` - Yeni içerik oluştur
- `PUT /content/:id` - İçerik güncelle
- `DELETE /content/:id` - İçerik sil
- `POST /content/:id/publish` - İçerik yayınla

#### Statistics
- `GET /stats/dashboard` - Dashboard istatistikleri
- `GET /stats/visitors` - Ziyaretçi istatistikleri
- `GET /stats/revenue` - Gelir istatistikleri

#### Advertisements
- `GET /advertisements/list` - Tüm reklamları getir
- `POST /advertisements/create` - Yeni reklam oluştur
- `PUT /advertisements/:id` - Reklam güncelle
- `DELETE /advertisements/:id` - Reklam sil
- `POST /advertisements/:id/view` - Reklam görüntüleme sayısını artır
- `GET /advertisements/settings` - Reklam ayarları
- `PUT /advertisements/settings` - Reklam ayarlarını güncelle

#### Settings
- `GET /settings/get` - Site ayarlarını getir
- `PUT /settings/update` - Site ayarlarını güncelle

#### Logs
- `GET /logs/list` - Logları getir
- `POST /logs/create` - Yeni log oluştur

#### File Upload
- `POST /upload` - Dosya yükleme (multipart/form-data)

## 📊 Veri Yapıları

### User
```typescript
{
  id: string;
  name: string;
  email: string;
  plan: 'Free' | 'Premium';
  status: 'active' | 'inactive';
  joinDate: string;
}
```

### AdminStats
```typescript
{
  totalVisitors: number;
  activeUsers: number;
  monthlyRevenue: number;
  conversionRate: number;
  visitorChange: number;
  userChange: number;
  revenueChange: number;
  conversionChange: number;
}
```

### Advertisement
```typescript
{
  id: string;
  title: string;
  type: 'image' | 'video';
  placement: 'popup' | 'banner' | 'sidebar';
  mediaUrl: string;
  linkUrl?: string;
  duration: number;
  frequency: number;
  displayCount?: number;
  currentDisplays?: number;
  enabled: boolean;
  createdDate: string;
}
```

## 🔒 Güvenlik

1. **CORS**: Backend'inizde CORS ayarlarını yapılandırın
2. **JWT Tokens**: Secure token yönetimi kullanın
3. **HTTPS**: Production'da HTTPS kullanın
4. **Rate Limiting**: API endpoint'lerinize rate limiting ekleyin
5. **Input Validation**: Tüm inputları backend'de validate edin

## 📝 Local Development vs Production

### Local Development
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ENV=development
```

### Production
```env
VITE_API_BASE_URL=https://api.tacticiq.app/v1
VITE_ENV=production
```

## 🐛 Debugging

API çağrılarını debug etmek için:

```typescript
// Browser console'da
localStorage.setItem('debug', 'api:*');

// API service içinde otomatik log'lar aktif olacak
```

## ⚡ Performans

1. **Caching**: API response'ları cache'leyin
2. **Pagination**: Büyük veri setleri için pagination kullanın
3. **Lazy Loading**: Component'leri lazy load edin
4. **Debouncing**: Search/filter işlemlerinde debounce kullanın

## 🚨 Error Handling

Tüm API çağrıları otomatik error handling ile gelir:

- Network errors
- Timeout errors
- HTTP errors (4xx, 5xx)
- Validation errors

Error mesajları kullanıcıya `toast` ile gösterilir.

## 📞 Destek

Backend entegrasyonu ile ilgili sorularınız için:
- Email: support@tacticiq.app
- Docs: https://docs.tacticiq.app

---

**Not**: Backend API'niz henüz hazır değilse, sistem otomatik olarak local mock data kullanmaya devam eder. Backend hazır olduğunda `.env` dosyasını güncelleyip backend modunu aktif edin.
