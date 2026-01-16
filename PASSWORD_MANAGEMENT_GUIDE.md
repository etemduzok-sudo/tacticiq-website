# 🔐 Şifre Değiştirme & Sıfırlama - Backend Entegrasyonu

Şifre yönetimi için tam kapsamlı backend entegrasyon sistemi eklendi!

## 📦 Eklenen Özellikler

### 1. **API Endpoints**
- ✅ `POST /auth/change-password` - Şifre değiştirme (giriş yapılmış kullanıcı için)
- ✅ `POST /auth/forgot-password` - Şifremi unuttum (email gönderimi)
- ✅ `POST /auth/reset-password-confirm` - Şifre sıfırlama onayı (token ile)

### 2. **Auth Service Methods**
```typescript
// Şifre değiştirme
await authService.changePassword({
  oldPassword: 'eski-sifre',
  newPassword: 'yeni-sifre',
  confirmPassword: 'yeni-sifre'
});

// Şifremi unuttum
await authService.forgotPassword({
  email: 'user@example.com'
});

// Şifre sıfırlama onayı
await authService.resetPasswordConfirm({
  token: 'email-token',
  newPassword: 'yeni-sifre',
  confirmPassword: 'yeni-sifre'
});
```

### 3. **UI Components**
- ✅ `ChangePasswordModal` - Şifre değiştirme modal'ı
- ✅ `ForgotPasswordModal` - Şifremi unuttum modal'ı
- ✅ `ResetPasswordConfirm` - Şifre sıfırlama sayfası

## 🎨 UI Bileşenleri Kullanımı

### 1. Şifre Değiştirme Modal

```typescript
import { ChangePasswordModal } from '@/app/components/auth/ChangePasswordModal';
import { useState } from 'react';

function UserSettings() {
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChangePassword(true)}>
        Şifremi Değiştir
      </button>

      <ChangePasswordModal
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
      />
    </div>
  );
}
```

**Özellikler:**
- ✓ Mevcut şifre doğrulama
- ✓ Yeni şifre validasyonu (minimum 8 karakter)
- ✓ Şifre gücü göstergesi
- ✓ Show/Hide password toggles
- ✓ Realtime şifre eşleşme kontrolü
- ✓ Loading states
- ✓ Error handling

### 2. Şifremi Unuttum Modal

```typescript
import { ForgotPasswordModal } from '@/app/components/auth/ForgotPasswordModal';
import { useState } from 'react';

function LoginPage() {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  return (
    <div>
      <button onClick={() => setShowForgotPassword(true)}>
        Şifremi Unuttum
      </button>

      <ForgotPasswordModal
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </div>
  );
}
```

**Özellikler:**
- ✓ Email validasyonu
- ✓ Success confirmation screen
- ✓ Email gönderim onayı
- ✓ Kullanıcı friendly mesajlar
- ✓ Back button ile form'a dönüş

### 3. Şifre Sıfırlama Sayfası

```typescript
import { ResetPasswordConfirm } from '@/app/components/auth/ResetPasswordConfirm';
import { useSearchParams } from 'react-router-dom';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return <div>Geçersiz veya eksik token!</div>;
  }

  return (
    <ResetPasswordConfirm
      token={token}
      onSuccess={() => {
        // Redirect to login or show success message
        window.location.href = '/login';
      }}
    />
  );
}
```

**Özellikler:**
- ✓ Token-based reset
- ✓ Password strength indicator
- ✓ Real-time validation
- ✓ Success confirmation
- ✓ Auto redirect to login
- ✓ Show/Hide password toggles

## 🔧 Backend API Gereksinimleri

### 1. Change Password
**Endpoint:** `POST /auth/change-password`

**Request:**
```json
{
  "oldPassword": "mevcut-sifre",
  "newPassword": "yeni-sifre",
  "confirmPassword": "yeni-sifre"
}
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "Şifre başarıyla değiştirildi"
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Mevcut şifre yanlış
- `401` - Token geçersiz/eksik

### 2. Forgot Password
**Endpoint:** `POST /auth/forgot-password`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Şifre sıfırlama bağlantısı email'inize gönderildi"
}
```

**Email Content:**
Email'de şu format'ta bir link olmalı:
```
https://tacticiq.app/reset-password?token=UNIQUE_RESET_TOKEN
```

**Token:**
- 24 saat geçerli olmalı
- Tek kullanımlık olmalı
- Güvenli random string

### 3. Reset Password Confirm
**Endpoint:** `POST /auth/reset-password-confirm`

**Request:**
```json
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
  "message": "Şifre başarıyla sıfırlandı"
}
```

**Error Responses:**
- `400` - Validation error
- `400` - Token geçersiz/süresi dolmuş
- `400` - Token kullanılmış

## 💡 Kullanım Senaryoları

### Senaryo 1: Admin Panel'de Şifre Değiştirme

```typescript
// Admin ayarlar sayfası
import { ChangePasswordModal } from '@/app/components/auth/ChangePasswordModal';
import { Settings } from 'lucide-react';

function AdminSettings() {
  const [showModal, setShowModal] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Güvenlik Ayarları</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setShowModal(true)}>
          <Settings className="size-4 mr-2" />
          Şifremi Değiştir
        </Button>
      </CardContent>

      <ChangePasswordModal
        open={showModal}
        onOpenChange={setShowModal}
      />
    </Card>
  );
}
```

### Senaryo 2: Login Sayfasında Şifremi Unuttum

```typescript
import { ForgotPasswordModal } from '@/app/components/auth/ForgotPasswordModal';

function LoginForm() {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  return (
    <form>
      {/* Login form fields */}
      
      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowForgotPassword(true)}
          className="text-sm text-accent hover:underline"
        >
          Şifremi Unuttum
        </button>
      </div>

      <ForgotPasswordModal
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </form>
  );
}
```

### Senaryo 3: Email Link'inden Şifre Sıfırlama

```typescript
// app/routes/reset-password.tsx
import { ResetPasswordConfirm } from '@/app/components/auth/ResetPasswordConfirm';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="text-center py-8">
        <h2>Geçersiz Link</h2>
        <p>Bu şifre sıfırlama linki geçersiz veya süresi dolmuş.</p>
        <Button onClick={() => navigate('/login')}>
          Giriş Sayfasına Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <ResetPasswordConfirm
        token={token}
        onSuccess={() => {
          toast.success('Şifreniz değiştirildi! Giriş yapabilirsiniz.');
          navigate('/login');
        }}
      />
    </div>
  );
}
```

## 🔒 Güvenlik Best Practices

### Backend'de Yapılması Gerekenler

1. **Password Hashing**
```javascript
// bcrypt kullanımı
const hashedPassword = await bcrypt.hash(newPassword, 10);
```

2. **Token Generation**
```javascript
// Crypto ile secure token
const crypto = require('crypto');
const resetToken = crypto.randomBytes(32).toString('hex');
```

3. **Rate Limiting**
```javascript
// Express rate limit
const rateLimit = require('express-rate-limit');

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per window
  message: 'Çok fazla şifre sıfırlama isteği. Lütfen 15 dakika sonra tekrar deneyin.'
});

app.post('/auth/forgot-password', passwordResetLimiter, async (req, res) => {
  // ...
});
```

4. **Password Validation**
```javascript
function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers;
}
```

5. **Email Template**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .button { 
      background-color: #1FA2A6; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 4px;
      display: inline-block;
    }
  </style>
</head>
<body>
  <h2>Şifre Sıfırlama İsteği</h2>
  <p>Merhaba,</p>
  <p>TacticIQ hesabınız için şifre sıfırlama isteği aldık. Yeni şifre oluşturmak için aşağıdaki butona tıklayın:</p>
  
  <p>
    <a href="https://tacticiq.app/reset-password?token={{TOKEN}}" class="button">
      Şifremi Sıfırla
    </a>
  </p>
  
  <p>Bu bağlantı 24 saat geçerlidir.</p>
  <p>Eğer bu isteği siz yapmadıysanız, bu email'i görmezden gelebilirsiniz.</p>
  
  <p>Teşekkürler,<br>TacticIQ Ekibi</p>
</body>
</html>
```

## ✅ Test Checklist

Backend entegrasyonunu test etmek için:

- [ ] Şifre değiştirme çalışıyor
- [ ] Mevcut şifre doğrulaması yapılıyor
- [ ] Yeni şifre validasyonu çalışıyor
- [ ] Şifremi unuttum email'i gönderiyor
- [ ] Reset link'i çalışıyor
- [ ] Token süresi kontrol ediliyor
- [ ] Token tek kullanımlık
- [ ] Rate limiting aktif
- [ ] Password hashing yapılıyor
- [ ] Error handling doğru çalışıyor

## 📝 Örnekler

### Tam Backend Implementation (Node.js + Express)

```javascript
// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/email');

// Change Password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Şifreler eşleşmiyor' 
      });
    }

    // Get user
    const user = await User.findById(userId);
    
    // Verify old password
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Mevcut şifre yanlış' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Şifre başarıyla değiştirildi' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      return res.json({ 
        success: true, 
        message: 'Email gönderildi' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save token to database
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send email
    const resetUrl = `https://tacticiq.app/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Şifre Sıfırlama',
      html: `<p>Şifrenizi sıfırlamak için <a href="${resetUrl}">buraya tıklayın</a></p>`
    });

    res.json({ success: true, message: 'Email gönderildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Reset Password Confirm
router.post('/reset-password-confirm', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Şifreler eşleşmiyor' 
      });
    }

    // Hash token
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token geçersiz veya süresi dolmuş' 
      });
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Şifre sıfırlandı' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

module.exports = router;
```

## 🎉 Özet

Artık tam kapsamlı şifre yönetimi sistemine sahipsiniz:

1. ✅ **Şifre Değiştirme** - Giriş yapmış kullanıcılar için
2. ✅ **Şifremi Unuttum** - Email ile şifre sıfırlama
3. ✅ **Token-based Reset** - Güvenli şifre sıfırlama
4. ✅ **UI Components** - Hazır React bileşenleri
5. ✅ **Backend Integration** - API servisleri
6. ✅ **Security Best Practices** - Güvenli implementasyon

Backend API'nizi yapılandırın ve kullanmaya başlayın! 🚀
