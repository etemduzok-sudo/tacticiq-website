# 🧪 Authentication Test Guide

## 📋 Test Senaryoları

### 1. ✅ Email/Password Authentication (ŞU ANDA ÇALIŞIYOR)

**Mevcut Durum:** Mock auth service kullanılıyor

#### Test Adımları:

```bash
# 1. Web'i başlat
npx expo start --web

# 2. Kayıt Ol ekranına git
- "Kayıt Ol" butonuna tıkla
- Email: test@example.com
- Kullanıcı adı: testuser
- Şifre: 123456
- "Kayıt Ol" butonuna tıkla

# 3. Giriş Yap
- Email: test@example.com
- Şifre: 123456
- "Giriş Yap" butonuna tıkla

# 4. Kontrol Et
- Console'da "✅ [mockAuth] Giriş başarılı!" mesajını gör
- Ana sayfaya yönlendirilmelisin
```

---

### 2. 🔴 Google Sign In (ŞU ANDA MOCK)

**Mevcut Durum:** Sadece simülasyon yapıyor, gerçek Google OAuth yok

#### Gerçek Google Sign In için gerekli:

1. **Firebase/Supabase Google OAuth Kurulumu**
2. **Google Cloud Console'da OAuth 2.0 Client ID**
3. **Expo Config'de Google Client ID**

#### Test Adımları (Mock):

```bash
# 1. Web'i başlat
npx expo start --web

# 2. Google ile Giriş butonuna tıkla
- Beyaz "Google ile Giriş" butonuna tıkla
- 1.5 saniye bekle
- Otomatik giriş yapılır (mock)

# 3. Console'da kontrol et
- "✅ Google ile giriş simülasyonu" mesajını gör
```

---

### 3. 🔴 Apple Sign In (ŞU ANDA MOCK)

**Mevcut Durum:** Sadece simülasyon yapıyor, gerçek Apple Sign In yok

#### Gerçek Apple Sign In için gerekli:

1. **Apple Developer Account ($99/yıl)**
2. **App ID ve Service ID**
3. **Supabase Apple OAuth Kurulumu**
4. **iOS/macOS cihazda test (Web'de sınırlı)**

#### Test Adımları (Mock):

```bash
# 1. Web'i başlat
npx expo start --web

# 2. Apple ile Giriş butonuna tıkla
- Siyah "Apple ile Giriş" butonuna tıkla
- 1.5 saniye bekle
- Otomatik giriş yapılır (mock)

# 3. Console'da kontrol et
- "✅ Apple ile giriş simülasyonu" mesajını gör
```

---

## 🚀 Gerçek OAuth Entegrasyonu İçin

### Option 1: Supabase OAuth (Önerilen)

```typescript
// src/services/authService.ts

// Google Sign In
async signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'your-app://auth/callback',
    },
  });
  
  if (error) throw error;
  return data;
}

// Apple Sign In
async signInWithApple() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: 'your-app://auth/callback',
    },
  });
  
  if (error) throw error;
  return data;
}
```

### Option 2: Firebase Authentication

```typescript
// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
```

---

## 🧪 Test Komutları

### 1. Web Test (Mevcut)
```bash
npx expo start --web
```

### 2. iOS Test (Apple Sign In için)
```bash
npx expo start --ios
```

### 3. Android Test (Google Sign In için)
```bash
npx expo start --android
```

---

## 📊 Test Checklist

### Email/Password Auth
- [ ] Kayıt ol - başarılı
- [ ] Kayıt ol - duplicate email hatası
- [ ] Giriş yap - başarılı
- [ ] Giriş yap - yanlış şifre hatası
- [ ] Şifre sıfırlama
- [ ] Email validation
- [ ] Password strength check

### Google Sign In
- [ ] Button görünüyor
- [ ] Button tıklanıyor
- [ ] Mock giriş çalışıyor
- [ ] Gerçek OAuth redirect (TODO)
- [ ] Callback handling (TODO)
- [ ] User profil oluşturma (TODO)

### Apple Sign In
- [ ] Button görünüyor
- [ ] Button tıklanıyor
- [ ] Mock giriş çalışıyor
- [ ] Gerçek OAuth redirect (TODO)
- [ ] Callback handling (TODO)
- [ ] User profil oluşturma (TODO)

---

## 🔍 Console Log'ları

### Email/Password Auth
```
🔑 [mockAuth] Kayıt denemesi: test@example.com
✅ [mockAuth] Kayıt başarılı!
🔑 [mockAuth] Giriş denemesi: test@example.com
✅ [mockAuth] Giriş başarılı!
```

### Google Sign In (Mock)
```
🔑 Google ile giriş başlatıldı
✅ Google ile giriş simülasyonu
→ Going to FAVORITE TEAMS
```

### Apple Sign In (Mock)
```
🔑 Apple ile giriş başlatıldı
✅ Apple ile giriş simülasyonu
→ Going to FAVORITE TEAMS
```

---

## 🎯 Sonuç

### ✅ Şu Anda Test Edilebilir:
1. **Email/Password Kayıt** - Tam çalışıyor
2. **Email/Password Giriş** - Tam çalışıyor
3. **Google Button** - UI çalışıyor, mock giriş yapıyor
4. **Apple Button** - UI çalışıyor, mock giriş yapıyor

### 🔴 Gerçek OAuth İçin Gerekli:
1. **Google:** Firebase/Supabase OAuth setup
2. **Apple:** Apple Developer Account + OAuth setup
3. **Redirect URL:** Deep linking kurulumu
4. **Callback Handler:** OAuth response işleme

---

## 📝 Test Raporu Şablonu

```markdown
### Test Tarihi: [TARIH]
### Test Eden: [İSİM]
### Platform: [Web/iOS/Android]

#### Email/Password Auth
- Kayıt: ✅/❌
- Giriş: ✅/❌
- Hata: [AÇIKLAMA]

#### Google Sign In
- Button: ✅/❌
- Mock: ✅/❌
- OAuth: ✅/❌ (TODO)
- Hata: [AÇIKLAMA]

#### Apple Sign In
- Button: ✅/❌
- Mock: ✅/❌
- OAuth: ✅/❌ (TODO)
- Hata: [AÇIKLAMA]
```

---

**Hazırlayan:** AI Assistant  
**Tarih:** 9 Ocak 2026  
**Durum:** Mock auth çalışıyor, gerçek OAuth kurulumu gerekli
