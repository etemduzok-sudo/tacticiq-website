# Apple OAuth - Gelecekte Yapılacaklar

Apple Developer hesabına erişim sağlandığında aşağıdaki adımları takip edin:

## 📝 Yapılacaklar

### 1. Apple Developer Console'a Giriş
- Yeni şifrenizi alınca Apple Developer Console'a giriş yapın
- [Apple Developer Portal](https://developer.apple.com/account) adresine gidin

### 2. Services ID ve Key Oluşturma
- `SUPABASE_OAUTH_SETUP.md` dosyasındaki Apple OAuth kurulum adımlarını takip edin
- Services ID oluşturun: `com.tacticiq.web`
- Key oluşturun ve `.p8` dosyasını indirin

### 3. JWT Token Oluşturma
- `APPLE_OAUTH_JWT_GUIDE.md` dosyasını takip edin
- `scripts/generate-apple-jwt.js` script'ini kullanarak JWT oluşturun

### 4. Supabase'e Apple Provider Ekleme
- Supabase Dashboard → Authentication → Providers → Apple
- Secret Key (JWT), Services ID, Team ID, Key ID bilgilerini girin

### 5. Apple Butonunu Aktif Etme
- `src/app/components/auth/AuthModal.tsx` dosyasını açın
- Şu satırı bulun:
  ```tsx
  {false && ( // Apple OAuth - Geçici olarak gizlendi
  ```
- `false` değerini `true` yapın veya `false &&` satırını tamamen kaldırın

## ⚡ Hızlı Aktivasyon

Apple OAuth hazır olduğunda, `AuthModal.tsx` dosyasında şu değişikliği yapın:

**Değiştir:**
```tsx
{false && (
  <Button>Apple ile giriş</Button>
)}
```

**Şuna:**
```tsx
<Button
  variant="outline"
  className="w-full"
  onClick={handleAppleAuth}
  disabled={loading || isLoading}
>
  <Apple className="mr-2 size-5" />
  {mode === 'signin' ? t('auth.apple.signin') : t('auth.apple.signup')}
</Button>
```

## 📚 İlgili Dosyalar

- `SUPABASE_OAUTH_SETUP.md` - Genel OAuth kurulum rehberi
- `APPLE_OAUTH_JWT_GUIDE.md` - Detaylı JWT oluşturma rehberi
- `scripts/generate-apple-jwt.js` - JWT oluşturma script'i
