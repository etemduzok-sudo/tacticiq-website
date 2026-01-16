# 🚀 Backend Entegrasyonu Kurulum Rehberi

TacticIQ web sitenizi backend'e bağlamak için adım adım rehber.

## 📋 Gereksinimler

1. **Backend API**: REST API endpoint'leri
2. **Node.js**: v18+ (development için)
3. **Package Manager**: npm, yarn veya pnpm

## ⚙️ Kurulum Adımları

### 1. Environment Variables Ayarlama

Proje kök dizininde `.env` dosyası oluşturun:

```bash
# .env.example dosyasını kopyalayın
cp .env.example .env
```

`.env` dosyasını düzenleyin:

```env
# Production backend URL'inizi buraya yazın
VITE_API_BASE_URL=https://api.tacticiq.app/v1

# Veya local development için
VITE_API_BASE_URL=http://localhost:3000/api

# Environment
VITE_ENV=production  # veya development
```

### 2. Backend Modunu Aktif Etme

`/src/app/App.tsx` dosyasında `enableBackend` prop'unu `true` yapın:

```typescript
<AdminDataBackendProvider enableBackend={true}>
  {/* ... */}
</AdminDataBackendProvider>
```

### 3. Axios Paketini Yükleme

Axios zaten yüklü (package.json'da mevcut), ancak eksikse:

```bash
npm install axios
# veya
yarn add axios
# veya
pnpm add axios
```

### 4. Backend API Test

Browser console'da backend bağlantısını test edin:

```javascript
// Browser console
import { apiService } from '/src/services/apiService.ts';

// Test GET request
const response = await apiService.get('/test');
console.log(response);
```

## 🔧 Backend API Gereksinimleri

### API Response Format

Tüm endpoint'ler şu format'ta response dönmeli:

```json
{
  "success": true,
  "data": { ... },
  "message": "İşlem başarılı",
  "statusCode": 200
}
```

### Required Endpoints

#### 1. Authentication
```
POST /auth/login
POST /auth/register
POST /auth/logout
POST /auth/refresh
```

#### 2. Users
```
GET    /users/list
POST   /users
PUT    /users/:id
DELETE /users/:id
```

#### 3. Statistics
```
GET /stats/dashboard
GET /stats/visitors
GET /stats/revenue
```

#### 4. Content
```
GET    /content/list
POST   /content/create
PUT    /content/:id
DELETE /content/:id
```

#### 5. Advertisements
```
GET    /advertisements/list
POST   /advertisements/create
PUT    /advertisements/:id
DELETE /advertisements/:id
POST   /advertisements/:id/view
GET    /advertisements/settings
PUT    /advertisements/settings
```

#### 6. Settings
```
GET /settings/get
PUT /settings/update
```

#### 7. Logs
```
GET  /logs/list
POST /logs/create
```

#### 8. File Upload
```
POST /upload (multipart/form-data)
```

### Authentication Header

Backend JWT token'ı `Authorization` header'da beklemeli:

```
Authorization: Bearer <JWT_TOKEN>
```

## 🎯 Kullanım Örnekleri

### 1. Basit API Çağrısı

```typescript
import { adminService } from '@/services/adminService';

async function loadUsers() {
  try {
    const users = await adminService.getUsers();
    console.log('Users:', users);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### 2. React Component'te Kullanım

```typescript
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';

function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 3. useApi Hook ile

```typescript
import { useApi } from '@/hooks/useApi';
import { adminService } from '@/services/adminService';

function StatsComponent() {
  const { data, loading, execute } = useApi(
    adminService.getStats
  );

  useEffect(() => {
    execute();
  }, []);

  if (loading) return <div>Loading...</div>;

  return <div>Visitors: {data?.totalVisitors}</div>;
}
```

## 🔐 Güvenlik

### 1. CORS Ayarları

Backend'inizde CORS ayarlarını yapın:

```javascript
// Express.js örneği
app.use(cors({
  origin: ['https://tacticiq.app', 'http://localhost:5173'],
  credentials: true
}));
```

### 2. JWT Token Yönetimi

- Token'ları localStorage'da saklayın (otomatik yapılıyor)
- Refresh token mekanizması kullanın
- Token expiration kontrolü yapın

### 3. HTTPS Kullanımı

Production'da mutlaka HTTPS kullanın:

```env
VITE_API_BASE_URL=https://api.tacticiq.app/v1
```

## 🐛 Debugging

### Console Logları

API çağrılarını console'da görmek için:

```javascript
// Browser console
localStorage.setItem('DEBUG', 'api:*');
```

### Network Tab

Browser DevTools > Network sekmesinden API isteklerini izleyin.

### Backend Status

Backend bağlantı durumunu kontrol etmek için:

```typescript
import { useAdminDataBackend } from '@/contexts/AdminDataBackendContext';

function StatusComponent() {
  const { backendStatus, isBackendConnected } = useAdminDataBackend();
  
  return (
    <div>
      <p>Status: {backendStatus}</p>
      <p>Connected: {isBackendConnected ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

## 📊 Veri Yapıları

Detaylı veri yapıları için `BACKEND_INTEGRATION_GUIDE.md` dosyasına bakın.

### User
```typescript
interface User {
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
interface AdminStats {
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

## 🔄 Local vs Backend Mode

### Local Mode (Varsayılan)
- Backend bağlantısı yok
- Mock data kullanılır
- Hızlı development

### Backend Mode
- Gerçek API kullanılır
- Production data
- Token authentication

### Toggle Between Modes

```typescript
import { useAdminDataBackend } from '@/contexts/AdminDataBackendContext';

function ToggleBackend() {
  const { toggleBackendMode, isBackendConnected } = useAdminDataBackend();

  return (
    <button onClick={() => toggleBackendMode(!isBackendConnected)}>
      {isBackendConnected ? 'Disable' : 'Enable'} Backend
    </button>
  );
}
```

## ✅ Checklist

Backend entegrasyonunu tamamlamak için:

- [ ] `.env` dosyası oluşturuldu
- [ ] `VITE_API_BASE_URL` doğru şekilde ayarlandı
- [ ] Backend API endpoint'leri hazır
- [ ] CORS ayarları yapıldı
- [ ] JWT authentication çalışıyor
- [ ] App.tsx'te `enableBackend={true}` yapıldı
- [ ] API çağrıları test edildi
- [ ] Error handling kontrol edildi
- [ ] Production deployment yapıldı

## 📞 Yardım

Sorun yaşıyorsanız:

1. `BACKEND_INTEGRATION_GUIDE.md` - Detaylı API dokümantasyonu
2. `BACKEND_USAGE_EXAMPLES.md` - Kod örnekleri
3. Console loglarını kontrol edin
4. Network tab'ı kontrol edin

## 🚀 Production Deployment

### 1. Build

```bash
npm run build
# veya
yarn build
# veya
pnpm build
```

### 2. Environment Variables

Production ortamında `.env` dosyasını güvenli şekilde yönetin:

```env
VITE_API_BASE_URL=https://api.tacticiq.app/v1
VITE_ENV=production
```

### 3. Deploy

Build edilen dosyaları hosting servisinize yükleyin (Vercel, Netlify, etc.)

---

**Not**: Backend entegrasyonu opsiyoneldir. Backend hazır değilse sistem otomatik olarak local mock data kullanmaya devam eder.
