# 🎯 TacticIQ - Backend Entegrasyon Tam Paketi

Web sitenizi backend API'ye bağlamak için **eksiksiz, production-ready** entegrasyon paketi hazır! 

## 🌟 Neler Eklendi?

### ✅ Tam Hazır Backend Entegrasyonu
- **Axios-based HTTP Client** - Tüm API çağrıları için
- **Admin Service** - CRUD operasyonları için
- **Auth Service** - Kullanıcı kimlik doğrulama
- **Custom Hooks** - React için API hooks
- **Context Integration** - Admin panel backend desteği
- **Comprehensive Documentation** - 4 detaylı dokümantasyon dosyası

## 📁 Eklenen Dosyalar

```
📦 Project Root
├── 📄 .env.example                          ← Environment variables şablonu
├── 📄 BACKEND_README.md                     ← Genel bakış (BU DOSYA)
├── 📄 BACKEND_SETUP.md                      ← Adım adım kurulum rehberi
├── 📄 BACKEND_INTEGRATION_GUIDE.md          ← Detaylı teknik rehber
├── 📄 BACKEND_USAGE_EXAMPLES.md             ← Kod örnekleri
│
├── 📂 src/
│   ├── 📂 config/
│   │   └── 📄 api.config.ts                 ← API konfigürasyonu
│   │
│   ├── 📂 services/
│   │   ├── 📄 apiService.ts                 ← HTTP client servisi
│   │   ├── 📄 adminService.ts               ← Admin API servisi
│   │   ├── 📄 authService.ts                ← Authentication servisi
│   │   └── 📄 index.ts                      ← Servis export merkezi
│   │
│   ├── 📂 hooks/
│   │   └── 📄 useApi.ts                     ← API hooks
│   │
│   └── 📂 contexts/
│       └── 📄 AdminDataBackendContext.tsx   ← Backend entegrasyon context
```

## 🚀 Hızlı Başlangıç (3 Adım)

### 1️⃣ Environment Variables
```bash
# .env dosyası oluştur
cp .env.example .env
```

`.env` içeriğini düzenle:
```env
VITE_API_BASE_URL=https://api.tacticiq.app/v1
```

### 2️⃣ Backend Modunu Aktif Et
```typescript
// src/app/App.tsx dosyasında
<AdminDataBackendProvider enableBackend={true}>
```

### 3️⃣ Kullan!
```typescript
import { adminService } from '@/services';

const users = await adminService.getUsers();
```

**O kadar!** 🎉 Sistem artık backend'inize bağlı.

## 📚 Dokümantasyon Rehberi

| Dosya | Kullanım | İçerik |
|-------|----------|---------|
| `BACKEND_SETUP.md` | ⭐ İlk Kurulum | Adım adım kurulum, checklist |
| `BACKEND_INTEGRATION_GUIDE.md` | 🔍 Detaylı Bilgi | API endpoints, veri yapıları, güvenlik |
| `BACKEND_USAGE_EXAMPLES.md` | 💻 Kod Örnekleri | 10+ gerçek kullanım örneği |
| `BACKEND_README.md` | 📖 Genel Bakış | Bu dosya - özet bilgiler |

## ⚡ Özellikler

### HTTP Client (apiService)
- ✅ GET, POST, PUT, PATCH, DELETE methodları
- ✅ Automatic JWT token yönetimi
- ✅ Request/Response interceptors
- ✅ Retry logic (3 deneme)
- ✅ Timeout handling
- ✅ File upload desteği
- ✅ Automatic error handling

### Admin Service
- ✅ **Users**: CRUD operasyonları
- ✅ **Content**: Blog, sayfa yönetimi
- ✅ **Advertisements**: Reklam yönetimi
- ✅ **Statistics**: Dashboard istatistikleri
- ✅ **Settings**: Site ayarları
- ✅ **Logs**: Activity ve system logs
- ✅ **File Upload**: Resim/video yükleme

### Auth Service
- ✅ Login / Register
- ✅ Token refresh
- ✅ Password reset
- ✅ Email verification
- ✅ Auto logout on 401

### React Hooks
- ✅ `useApi()` - Genel API hook
- ✅ `useApiMutation()` - POST, PUT, DELETE için
- ✅ `useApiQuery()` - GET için
- ✅ Auto loading states
- ✅ Auto error handling
- ✅ Toast notifications

## 💡 Kullanım Örnekleri

### 1. Basit API Çağrısı
```typescript
import { adminService } from '@/services';

async function getUsers() {
  const users = await adminService.getUsers();
  console.log(users);
}
```

### 2. React Component
```typescript
import { useApi } from '@/hooks/useApi';
import { adminService } from '@/services';

function UsersList() {
  const { data: users, loading } = useApi(
    adminService.getUsers,
    { showErrorToast: true }
  );

  useEffect(() => {
    execute();
  }, []);

  if (loading) return <div>Yükleniyor...</div>;
  
  return (
    <ul>
      {users?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 3. Form İşlemleri
```typescript
import { useApiMutation } from '@/hooks/useApi';
import { adminService } from '@/services';

function CreateUserForm() {
  const { execute, loading } = useApiMutation(
    adminService.createUser,
    {
      showSuccessToast: true,
      successMessage: 'Kullanıcı oluşturuldu!'
    }
  );

  async function handleSubmit(data) {
    const result = await execute(data);
    if (result) {
      // Success işlemleri
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

### 4. File Upload
```typescript
import { adminService } from '@/services';

async function uploadImage(file: File) {
  const result = await adminService.uploadFile(
    file,
    (progress) => console.log(`${progress}% yüklendi`)
  );
  
  return result.url;
}
```

## 🔧 Backend API Gereksinimleri

### Authentication Header
```
Authorization: Bearer <JWT_TOKEN>
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "İşlem başarılı",
  "statusCode": 200
}
```

### Required Endpoints
- POST `/auth/login`
- GET `/users/list`
- POST `/users`
- GET `/stats/dashboard`
- GET `/advertisements/list`
- POST `/upload`
- ... (tam liste BACKEND_INTEGRATION_GUIDE.md'de)

## 🔐 Güvenlik

- ✅ JWT token authentication
- ✅ Automatic token refresh
- ✅ HTTPS enforcement
- ✅ CORS support
- ✅ XSS protection
- ✅ Secure token storage

## 🎨 Admin Panel Entegrasyonu

Admin panel zaten backend desteklidir!

```typescript
import { useAdminDataBackend } from '@/contexts/AdminDataBackendContext';

function AdminStatus() {
  const { 
    isBackendConnected, 
    backendStatus,
    syncWithBackend 
  } = useAdminDataBackend();

  return (
    <div>
      <p>Backend Status: {backendStatus}</p>
      <button onClick={syncWithBackend}>
        Sync with Backend
      </button>
    </div>
  );
}
```

## 🔄 Local vs Backend Mode

### Local Mode (Default)
- Mock data kullanır
- Backend bağlantısı gerektirmez
- Hızlı development

```typescript
<AdminDataBackendProvider enableBackend={false}>
```

### Backend Mode
- Gerçek API kullanır
- Token authentication
- Production data

```typescript
<AdminDataBackendProvider enableBackend={true}>
```

**Avantaj**: İki mod arasında kolayca geçiş yapabilirsiniz!

## 📊 API Endpoint Özeti

| Kategori | Endpoint | Method | Açıklama |
|----------|----------|--------|----------|
| **Auth** | `/auth/login` | POST | Kullanıcı girişi |
| **Users** | `/users/list` | GET | Tüm kullanıcılar |
| **Users** | `/users` | POST | Yeni kullanıcı |
| **Stats** | `/stats/dashboard` | GET | Dashboard istatistikleri |
| **Content** | `/content/list` | GET | Tüm içerikler |
| **Ads** | `/advertisements/list` | GET | Tüm reklamlar |
| **Settings** | `/settings/get` | GET | Site ayarları |
| **Upload** | `/upload` | POST | Dosya yükleme |

Tam liste için: `BACKEND_INTEGRATION_GUIDE.md`

## 🐛 Debugging

```javascript
// Browser console'da
localStorage.setItem('DEBUG', 'api:*');

// API çağrılarını izleyin
// Network tab'ı kontrol edin
// Backend status'ü kontrol edin
```

## ✅ Kurulum Checklist

- [ ] `.env` dosyası oluşturuldu
- [ ] Backend URL ayarlandı
- [ ] `enableBackend={true}` yapıldı
- [ ] Backend API hazır ve çalışıyor
- [ ] CORS ayarları yapıldı
- [ ] JWT authentication çalışıyor
- [ ] Test API çağrısı yapıldı
- [ ] Error handling test edildi
- [ ] Production deployment yapıldı

## 🆘 Sorun mu Yaşıyorsunuz?

### 1. Backend'e bağlanamıyorum
- `.env` dosyasını kontrol edin
- Backend URL'ini ping edin
- CORS ayarlarını kontrol edin
- Network tab'ı inceleyin

### 2. 401 Unauthorized
- Token'ın geçerli olduğundan emin olun
- Login endpoint'ini kontrol edin
- Authorization header'ını kontrol edin

### 3. 500 Server Error
- Backend loglarını kontrol edin
- Request payload'ı inceleyin
- Database bağlantısını kontrol edin

## 📖 Hangi Dokümantasyonu Okumalıyım?

| Durum | Dokümantasyon |
|-------|---------------|
| Yeni başlıyorum | `BACKEND_SETUP.md` ⭐ |
| Detaylı bilgi istiyorum | `BACKEND_INTEGRATION_GUIDE.md` |
| Kod örnekleri arıyorum | `BACKEND_USAGE_EXAMPLES.md` |
| Hızlı referans | Bu dosya |

## 🎓 Öğrenme Yolu

1. **Başlangıç**: `BACKEND_SETUP.md` - Kurulum yapın
2. **Temel Kullanım**: `BACKEND_USAGE_EXAMPLES.md` - Örnekleri inceleyin
3. **Derinlemesine**: `BACKEND_INTEGRATION_GUIDE.md` - Tüm detayları öğrenin
4. **Production**: Deploy edin ve kullanmaya başlayın!

## 🚀 Sonraki Adımlar

1. `.env` dosyanızı yapılandırın
2. Backend API'nizi hazırlayın
3. `enableBackend={true}` yapın
4. İlk API çağrınızı yapın
5. Admin panel'de test edin

## 💪 Güçlü Özellikleri Keşfedin

- **Automatic Retry**: Network hatalarında 3 kez otomatik retry
- **Token Refresh**: Token süresi dolduğunda otomatik yenileme
- **Error Handling**: Akıllı hata yönetimi ve kullanıcı bildirimleri
- **File Upload**: Progress tracking ile dosya yükleme
- **Caching**: API response'larını cache'leme imkanı
- **Parallel Requests**: Çoklu API çağrılarını paralel yapma

## 🎉 Başarılı Kurulum!

Artık web siteniz backend API'ye bağlanmaya hazır! Herhangi bir sorunuz varsa dokümantasyonu inceleyin.

---

**Made with ❤️ for TacticIQ**

📧 Destek: support@tacticiq.app  
🌐 Web: https://tacticiq.app  
📚 Docs: https://docs.tacticiq.app

---

**⚠️ Önemli Not**: Backend entegrasyonu tamamen opsiyoneldir. Backend hazır değilse sistem otomatik olarak local mock data kullanmaya devam eder. Zero configuration required!
