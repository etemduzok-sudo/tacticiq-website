# 🔌 Backend Entegrasyon Paketi - TacticIQ

Web sitenizi backend API'ye bağlamak için eksiksiz bir entegrasyon paketi kurulmuştur.

## 📦 Eklenen Dosyalar

### 🔧 Configuration
- **`/src/config/api.config.ts`** - API URL'leri, endpoint'ler, hata mesajları
- **`/.env.example`** - Environment variables şablonu

### 🌐 Services
- **`/src/services/apiService.ts`** - Ana HTTP client (Axios)
- **`/src/services/adminService.ts`** - Admin panel API çağrıları
- **`/src/services/authService.ts`** - Authentication servisi
- **`/src/services/index.ts`** - Servis export merkezi

### 🎣 Hooks
- **`/src/hooks/useApi.ts`** - Custom React API hooks

### 🔄 Context
- **`/src/contexts/AdminDataBackendContext.tsx`** - Backend entegrasyon katmanı

### 📚 Dokümantasyon
- **`/BACKEND_SETUP.md`** - Kurulum rehberi
- **`/BACKEND_INTEGRATION_GUIDE.md`** - Detaylı entegrasyon rehberi
- **`/BACKEND_USAGE_EXAMPLES.md`** - Kod örnekleri
- **`/BACKEND_README.md`** - Bu dosya

## 🚀 Hızlı Başlangıç

### 1. Environment Variables
```bash
# .env dosyası oluştur
cp .env.example .env

# Backend URL'ini düzenle
VITE_API_BASE_URL=https://your-api.com/api
```

### 2. Backend Modunu Aktif Et
```typescript
// src/app/App.tsx
<AdminDataBackendProvider enableBackend={true}>
```

### 3. Kullanım
```typescript
import { adminService } from '@/services/adminService';

const users = await adminService.getUsers();
```

## ✨ Özellikler

### ✅ HTTP Client (Axios)
- ✓ Automatic token management
- ✓ Request/Response interceptors
- ✓ Retry logic (3 attempts)
- ✓ Error handling
- ✓ Timeout support
- ✓ File upload support

### ✅ Authentication
- ✓ Login/Register
- ✓ Token refresh
- ✓ Password reset
- ✓ Email verification
- ✓ Auto redirect on 401

### ✅ Admin Operations
- ✓ User CRUD
- ✓ Content CRUD
- ✓ Advertisement CRUD
- ✓ Statistics
- ✓ Settings management
- ✓ Activity logs
- ✓ File uploads

### ✅ React Hooks
- ✓ `useApi()` - Generic API hook
- ✓ `useApiMutation()` - For mutations (POST/PUT/DELETE)
- ✓ `useApiQuery()` - For queries (GET)
- ✓ Auto loading states
- ✓ Auto error handling
- ✓ Toast notifications

### ✅ Context Integration
- ✓ Backend connection status
- ✓ Local/Backend mode toggle
- ✓ Auto sync
- ✓ Fallback to local data

## 📖 Dokümantasyon

### 📘 BACKEND_SETUP.md
**Ne zaman kullanılır**: İlk kurulum yaparken
**İçerik**: 
- Adım adım kurulum
- Environment variables
- Backend gereksinimleri
- Deployment

### 📗 BACKEND_INTEGRATION_GUIDE.md
**Ne zaman kullanılır**: Detaylı bilgi gerektiğinde
**İçerik**:
- API konfigürasyonu
- Servis kullanımı
- Endpoint listesi
- Veri yapıları
- Güvenlik
- Performans

### 📙 BACKEND_USAGE_EXAMPLES.md
**Ne zaman kullanılır**: Kod örnekleri ararken
**İçerik**:
- Authentication örnekleri
- CRUD işlem örnekleri
- Hook kullanımı
- File upload
- Error handling
- Advanced patterns

## 🎯 Kullanım Senaryoları

### Senaryo 1: Basit API Çağrısı
```typescript
import { adminService } from '@/services';

async function loadData() {
  const users = await adminService.getUsers();
  return users;
}
```

### Senaryo 2: React Component
```typescript
import { useApi } from '@/hooks/useApi';
import { adminService } from '@/services';

function Users() {
  const { data, loading } = useApi(adminService.getUsers);
  
  if (loading) return <div>Loading...</div>;
  return <div>{data?.map(...)}</div>;
}
```

### Senaryo 3: Form Submission
```typescript
import { useApiMutation } from '@/hooks/useApi';
import { adminService } from '@/services';

function CreateUser() {
  const { execute, loading } = useApiMutation(
    adminService.createUser,
    { showSuccessToast: true }
  );

  async function handleSubmit(data) {
    await execute(data);
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## 🔐 Güvenlik

- ✅ JWT token authentication
- ✅ Automatic token refresh
- ✅ HTTPS enforcement (production)
- ✅ CORS support
- ✅ Input validation
- ✅ XSS protection

## 🐛 Debugging

```javascript
// Browser console
localStorage.setItem('DEBUG', 'api:*');

// Check backend status
import { useAdminDataBackend } from '@/contexts/AdminDataBackendContext';
const { backendStatus } = useAdminDataBackend();
```

## 📊 API Endpoint Listesi

### Authentication
- POST `/auth/login`
- POST `/auth/register`
- POST `/auth/logout`
- POST `/auth/refresh`

### Users
- GET `/users/list`
- POST `/users`
- PUT `/users/:id`
- DELETE `/users/:id`

### Content
- GET `/content/list`
- POST `/content/create`
- PUT `/content/:id`
- DELETE `/content/:id`

### Statistics
- GET `/stats/dashboard`
- GET `/stats/visitors`
- GET `/stats/revenue`

### Advertisements
- GET `/advertisements/list`
- POST `/advertisements/create`
- PUT `/advertisements/:id`
- DELETE `/advertisements/:id`

### Settings
- GET `/settings/get`
- PUT `/settings/update`

### Logs
- GET `/logs/list`
- POST `/logs/create`

### Upload
- POST `/upload`

## 🔄 Local vs Backend Mode

### Local Mode (Default)
```typescript
<AdminDataBackendProvider enableBackend={false}>
```
- Mock data kullanır
- Backend bağlantısı gerektirmez
- Hızlı development

### Backend Mode
```typescript
<AdminDataBackendProvider enableBackend={true}>
```
- Gerçek API kullanır
- Authentication gerektirir
- Production data

## 💡 Best Practices

1. **Environment Variables**: `.env` dosyasını `.gitignore`'a ekleyin
2. **Error Handling**: Her API çağrısında try-catch kullanın
3. **Loading States**: Kullanıcıya feedback verin
4. **Token Management**: Otomatik token refresh kullanın
5. **Caching**: Sık kullanılan verileri cache'leyin
6. **Retry Logic**: Ağ hatalarında retry yapın
7. **Logging**: Hataları console.error ile loglay ın

## 🧪 Testing

### Backend Connection Test
```typescript
import { apiService } from '@/services';

async function testConnection() {
  try {
    await apiService.get('/test');
    console.log('✅ Backend connected');
  } catch (error) {
    console.error('❌ Backend connection failed');
  }
}
```

### API Response Test
```typescript
import { adminService } from '@/services';

async function testApi() {
  const users = await adminService.getUsers();
  console.log('Users:', users);
}
```

## 📝 Checklist

Entegrasyonu tamamlamak için:

- [ ] `.env` dosyası oluşturuldu
- [ ] Backend URL ayarlandı
- [ ] `enableBackend={true}` yapıldı
- [ ] API endpoint'leri test edildi
- [ ] Authentication çalışıyor
- [ ] Error handling test edildi
- [ ] Loading states eklendi
- [ ] Production deployment yapıldı

## 🆘 Sorun Giderme

### Backend'e bağlanamıyorum
1. `.env` dosyasını kontrol edin
2. CORS ayarlarını kontrol edin
3. Network tab'ı kontrol edin
4. Backend URL'ini ping edin

### Token expired hatası
1. Refresh token endpoint'ini kontrol edin
2. Token expiration time'ı kontrol edin
3. Login sayfasına yönlendirme yapıldığından emin olun

### 500 hatası alıyorum
1. Backend loglarını kontrol edin
2. Request payload'ı kontrol edin
3. Database bağlantısını kontrol edin

## 📞 Destek

Daha fazla yardım için:
- 📘 `BACKEND_SETUP.md` - Kurulum
- 📗 `BACKEND_INTEGRATION_GUIDE.md` - Detaylı rehber
- 📙 `BACKEND_USAGE_EXAMPLES.md` - Kod örnekleri

---

**Önemli Not**: Backend entegrasyonu tamamen opsiyoneldir. Backend hazır değilse, sistem otomatik olarak local mock data kullanmaya devam eder. Herhangi bir kod değişikliği gerekmez!

🎉 **Hazırsınız! Backend entegrasyonunu kullanmaya başlayabilirsiniz.**
