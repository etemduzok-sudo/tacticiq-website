# Apple OAuth JWT Secret Key Oluşturma Rehberi

Apple OAuth için **Secret Key** bir JWT (JSON Web Token) formatında olmalıdır. Bu rehber, Apple Developer Console'dan JWT oluşturmanızı sağlar.

## 📋 Ön Gereksinimler

1. **Apple Developer Account** (ücretli: $99/yıl)
2. **Services ID** oluşturulmuş olmalı (SUPABASE_OAUTH_SETUP.md'de açıklandığı gibi)

## 🔐 Adım Adım JWT Oluşturma

### 1. Key Oluşturma (Apple Developer Console)

1. [Apple Developer Portal](https://developer.apple.com/account) → **Certificates, Identifiers & Profiles** sayfasına gidin
2. **Keys** bölümüne tıklayın
3. **+** butonuna tıklayarak yeni key oluşturun
4. **Key Name**: `TacticIQ Sign in with Apple` (veya istediğiniz isim)
5. **Sign in with Apple** seçeneğini işaretleyin
6. **Configure** butonuna tıklayın:
   - **Primary App ID**: Ana uygulamanızın App ID'sini seçin
   - **Save** butonuna tıklayın
7. **Continue** → **Register** butonuna tıklayın
8. **Download** butonuna tıklayarak `.p8` dosyasını indirin (sadece bir kez indirebilirsiniz!)
9. **Key ID**'yi not edin (örn: `ABC123DEFG`)
10. Sayfayı kapatmadan önce **Team ID**'yi not edin (sayfanın üst kısmında görünür, örn: `XYZ789TEAM`)

**ÖNEMLİ**: `.p8` dosyasını güvenli bir yerde saklayın! Bir daha indiremezsiniz.

### 2. JWT Oluşturma (Manuel veya Tool ile)

Apple için JWT oluşturmak için 2 yöntem var:

#### Yöntem 1: Online Tool Kullanımı (Kolay)

1. [JWT.io](https://jwt.io) veya [JWT Generator](https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens) kullanın

**JWT Header:**
```json
{
  "alg": "ES256",
  "kid": "YOUR_KEY_ID"
}
```

**JWT Payload:**
```json
{
  "iss": "YOUR_TEAM_ID",
  "iat": CURRENT_TIMESTAMP,
  "exp": CURRENT_TIMESTAMP + 15777000,
  "aud": "https://appleid.apple.com",
  "sub": "YOUR_SERVICES_ID"
}
```

**Örnek:**
- **iss** (Issuer): `XYZ789TEAM` (Team ID)
- **kid** (Key ID): `ABC123DEFG` (Key ID)
- **sub** (Subject): `com.tacticiq.web` (Services ID)
- **iat** (Issued At): Şu anki Unix timestamp
- **exp** (Expiration): Şu anki timestamp + 6 ay (15777000 saniye)
- **aud** (Audience): `https://appleid.apple.com`

#### Yöntem 2: Node.js Script ile (Otomatik)

Aşağıdaki Node.js script'ini kullanarak JWT oluşturabilirsiniz:

```javascript
// generate-apple-jwt.js
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Apple Developer'dan aldığınız bilgiler
const TEAM_ID = 'YOUR_TEAM_ID'; // Örn: XYZ789TEAM
const KEY_ID = 'YOUR_KEY_ID'; // Örn: ABC123DEFG
const SERVICES_ID = 'com.tacticiq.web'; // Services ID
const PRIVATE_KEY_PATH = './AuthKey_ABC123DEFG.p8'; // İndirdiğiniz .p8 dosyası

// .p8 dosyasını oku
const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

// JWT oluştur
const token = jwt.sign(
  {
    iss: TEAM_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15777000, // 6 ay geçerli
    aud: 'https://appleid.apple.com',
    sub: SERVICES_ID,
  },
  privateKey,
  {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: KEY_ID,
    },
  }
);

console.log('Apple JWT Secret Key:');
console.log(token);
```

**Kullanım:**
```bash
npm install jsonwebtoken
node generate-apple-jwt.js
```

### 3. JWT'yi Supabase'e Ekleme

1. [Supabase Dashboard](https://app.supabase.com) → Projeniz
2. **Authentication** → **Providers** → **Apple**
3. **Enable** butonuna tıklayın
4. Şu bilgileri girin:
   - **Services ID**: `com.tacticiq.web` (oluşturduğunuz Services ID)
   - **Secret Key**: Oluşturduğunuz JWT token'ı yapıştırın
   - **Team ID**: Apple Developer'dan aldığınız Team ID
   - **Key ID**: Apple Developer'dan aldığınız Key ID
5. **Save** butonuna tıklayın

## ⚠️ Önemli Notlar

### JWT Geçerlilik Süresi

- JWT token'ları genellikle **6 ay** geçerlidir
- Süresi dolduğunda yeni bir JWT oluşturmanız gerekir
- Production ortamında JWT'yi otomatik yenileme mekanizması kurmanız önerilir

### JWT Formatı

JWT şu formatta olmalıdır:
```
eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQzEyM0RFRkcifQ.eyJpc3MiOiJaWVo3ODlURUFNIiwiaWF0IjoxNzM2NzU2MzUyLCJleHAiOjE3NDI3NTYzNTIsImF1ZCI6Imh0dHBzOi8vYXBwbGVpZC5hcHBsZS5jb20iLCJzdWIiOiJjb20udGFjdGljaXEud2ViIn0.signature...
```

### Secret Key vs Private Key

- **Secret Key**: Supabase'e eklenecek JWT token'ı (yukarıda oluşturduğunuz)
- **Private Key**: `.p8` dosyası (JWT oluşturmak için kullanılır, Supabase'e eklenmez)

## 🔧 Sorun Giderme

### "Secret key should be a JWT" Hatası

**Neden:**
- Secret Key alanına `.p8` dosyasının içeriğini yapıştırmış olabilirsiniz
- JWT formatında bir token yapıştırmanız gerekir

**Çözüm:**
1. `.p8` dosyasını kullanarak JWT oluşturun (yukarıdaki script ile)
2. Oluşturulan JWT token'ı Supabase'e yapıştırın (`.p8` dosyasını değil!)

### "Invalid credentials" Hatası

**Kontrol Listesi:**
- ✅ Services ID doğru mu?
- ✅ Team ID doğru mu?
- ✅ Key ID doğru mu?
- ✅ JWT token süresi dolmuş mu? (6 aydan eski ise yenileyin)
- ✅ `.p8` key'i "Sign in with Apple" için oluşturuldu mu?

### JWT Süresi Dolmuşsa

1. Yeni bir JWT oluşturun (aynı `.p8` dosyasını kullanarak)
2. Supabase Dashboard'da **Secret Key** alanını yeni JWT ile güncelleyin
3. **Save** butonuna tıklayın

## 📚 Ek Kaynaklar

- [Apple Sign in with Apple Documentation](https://developer.apple.com/documentation/sign_in_with_apple)
- [Supabase Apple Provider Documentation](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [JWT.io - JWT Debugger](https://jwt.io)

## 🎯 Hızlı Özet

1. Apple Developer → Keys → Yeni Key oluştur (Sign in with Apple aktif)
2. `.p8` dosyasını indir, Key ID ve Team ID'yi not et
3. JWT oluştur (Yukarıdaki script veya JWT.io ile)
4. Supabase Dashboard → Apple Provider → Secret Key'e JWT yapıştır
5. Services ID, Team ID, Key ID'yi gir
6. Save!

**JWT token'ı her 6 ayda bir yenilemeniz gerekir.**
