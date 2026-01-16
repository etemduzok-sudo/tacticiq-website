# 🔐 Şifre Yönetimi - Hızlı Başlangıç

## ✅ Eklenen Özellikler

### 📡 Backend Endpoints (3 yeni)
- `POST /auth/change-password` - Şifre değiştirme
- `POST /auth/forgot-password` - Şifremi unuttum
- `POST /auth/reset-password-confirm` - Şifre sıfırlama

### 🎨 UI Components (3 yeni)
- `ChangePasswordModal` - Şifre değiştirme modal'ı
- `ForgotPasswordModal` - Şifremi unuttum modal'ı  
- `ResetPasswordConfirm` - Şifre sıfırlama sayfası

### 🔧 Service Methods (3 yeni)
- `authService.changePassword()` 
- `authService.forgotPassword()`
- `authService.resetPasswordConfirm()`

## 🚀 Hızlı Kullanım

### 1. Şifre Değiştirme (Admin Panel veya Ayarlar)

```typescript
import { ChangePasswordModal } from '@/app/components/auth';
import { useState } from 'react';

function UserSettings() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Şifremi Değiştir
      </button>
      
      <ChangePasswordModal
        open={showModal}
        onOpenChange={setShowModal}
      />
    </>
  );
}
```

### 2. Şifremi Unuttum (Login Sayfası)

```typescript
import { ForgotPasswordModal } from '@/app/components/auth';
import { useState } from 'react';

function LoginPage() {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  return (
    <>
      <button onClick={() => setShowForgotPassword(true)}>
        Şifremi Unuttum
      </button>
      
      <ForgotPasswordModal
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </>
  );
}
```

### 3. Şifre Sıfırlama Sayfası

```typescript
import { ResetPasswordConfirm } from '@/app/components/auth';

function ResetPasswordPage() {
  // URL'den token al: /reset-password?token=xyz123
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (!token) {
    return <div>Geçersiz link!</div>;
  }

  return (
    <ResetPasswordConfirm
      token={token}
      onSuccess={() => window.location.href = '/login'}
    />
  );
}
```

## 🎯 Backend API Gereksinimleri

### 1. Change Password

**Request:**
```bash
POST /auth/change-password
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "oldPassword": "eski-sifre",
  "newPassword": "yeni-sifre",
  "confirmPassword": "yeni-sifre"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Şifre başarıyla değiştirildi"
}
```

### 2. Forgot Password

**Request:**
```bash
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email gönderildi"
}
```

**Backend görevleri:**
1. Token oluştur (32 byte random)
2. Token'ı database'e kaydet (hash'lenmiş)
3. Email gönder: `https://tacticiq.app/reset-password?token=ABC123`
4. Token'a 24 saat expiry ekle

### 3. Reset Password Confirm

**Request:**
```bash
POST /auth/reset-password-confirm
Content-Type: application/json

{
  "token": "email-ile-gelen-token",
  "newPassword": "yeni-sifre",
  "confirmPassword": "yeni-sifre"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Şifre sıfırlandı"
}
```

**Backend görevleri:**
1. Token'ı validate et
2. Token süresini kontrol et
3. Şifreyi hash'le ve kaydet
4. Token'ı invalidate et (tek kullanımlık)

## 🔒 Güvenlik

### Frontend (Zaten hazır ✅)
- ✅ Password strength validation
- ✅ Real-time password matching
- ✅ Show/hide password toggles
- ✅ Input sanitization
- ✅ HTTPS enforcement

### Backend (Yapmanız gereken)
- [ ] bcrypt ile password hashing
- [ ] Token generation (crypto.randomBytes)
- [ ] Rate limiting (3 request / 15 min)
- [ ] Email verification
- [ ] Token expiration (24 hours)
- [ ] HTTPS kullanımı

## 📊 Şifre Validasyon Kuralları

Frontend'de otomatik kontrol ediliyor:

```typescript
✓ En az 8 karakter
✓ En az bir büyük harf
✓ En az bir rakam
✓ Şifreler eşleşmeli
✓ Eski şifre ile aynı olmamalı (change password için)
```

Backend'de de aynı kontrolleri yapın!

## 💻 Full Implementation Example

### Admin Panel'e Şifre Değiştirme Butonu Ekleme

Admin panel Settings menüsüne ekleyin:

```typescript
// AdminPanel.tsx içinde
import { ChangePasswordModal } from '@/app/components/auth';
import { Lock } from 'lucide-react';

function SettingsSection() {
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Güvenlik</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={() => setShowChangePassword(true)}
          variant="outline"
          className="w-full justify-start"
        >
          <Lock className="size-4 mr-2" />
          Şifremi Değiştir
        </Button>
      </CardContent>

      <ChangePasswordModal
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
      />
    </Card>
  );
}
```

## 🧪 Test Senaryoları

### Test 1: Şifre Değiştirme
1. Admin panel'de "Şifremi Değiştir" butonuna tıkla
2. Mevcut şifreyi gir
3. Yeni şifre oluştur (8+ karakter, büyük harf, rakam)
4. Şifre eşleşmesini kontrol et
5. "Şifre Değiştir" butonuna tıkla
6. Success toast görülmeli
7. Modal kapanmalı

### Test 2: Şifremi Unuttum
1. Login sayfasında "Şifremi Unuttum" butonuna tıkla
2. Email adresini gir
3. "Bağlantı Gönder" butonuna tıkla
4. Success ekranı görülmeli
5. Email'de link geldi mi kontrol et

### Test 3: Şifre Sıfırlama
1. Email'deki linke tıkla
2. Yeni şifre oluştur
3. Şifre tekrarını gir
4. "Şifreyi Sıfırla" butonuna tıkla
5. Success ekranı görülmeli
6. Login sayfasına yönlendirilmeli

## 🎉 Özet

Artık tam kapsamlı şifre yönetimi sisteminiz hazır:

### ✅ Frontend
- ✅ 3 hazır UI component
- ✅ Validation & error handling
- ✅ Loading states
- ✅ Success confirmations
- ✅ Password strength indicators

### ✅ Backend Integration
- ✅ 3 API endpoint
- ✅ Auth service methods
- ✅ Token management
- ✅ Error handling

### 📖 Dokümantasyon
- ✅ Bu Quick Start Guide
- ✅ Detaylı implementation guide (`PASSWORD_MANAGEMENT_GUIDE.md`)
- ✅ Backend usage examples güncel

## 🔗 İlgili Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `PASSWORD_MANAGEMENT_GUIDE.md` | Detaylı rehber |
| `/src/services/authService.ts` | Auth API servisi |
| `/src/config/api.config.ts` | API endpoints |
| `/src/app/components/auth/` | UI components |

---

**Hemen kullanmaya başlayabilirsiniz!** 🎉

Backend API'nizi hazırlayın ve component'leri import edin. Sistem hazır!
