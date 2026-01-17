# Supabase OAuth Provider Ayarları - Doğru Yol

## ❌ Yanlış Yer: OAuth Apps
"OAuth Apps" bölümü **başka uygulamaların size bağlanması** için kullanılır. Web sitenizin Google/Apple ile giriş yapması için değil!

## ✅ Doğru Yer: Authentication > Providers

### 1. Supabase Dashboard'a Giriş Yapın
- [https://app.supabase.com](https://app.supabase.com)
- Projenizi seçin

### 2. Authentication Menüsüne Gidin
Sol menüden:
- **Authentication** (Kimlik Doğrulama) tıklayın
- **Providers** (Sağlayıcılar) sekmesine tıklayın

### 3. OAuth Provider'ları Aktif Edin

#### Google OAuth Aktif Etme:
1. **Providers** listesinde **"Google"** seçeneğini bulun
2. **Toggle'ı AÇIK yapın** (sağa kaydırın)
3. Şu bilgileri girin:
   - **Client ID (for OAuth)**: Google Cloud Console'dan aldığınız Client ID
   - **Client Secret (for OAuth)**: Google Cloud Console'dan aldığınız Client Secret
4. **"Save"** butonuna tıklayın

#### Apple OAuth Aktif Etme:
1. **Providers** listesinde **"Apple"** seçeneğini bulun
2. **Toggle'ı AÇIK yapın**
3. Şu bilgileri girin:
   - **Services ID**: Apple Developer Portal'dan aldığınız Services ID
   - **Secret Key**: JWT formatında (APPLE_OAUTH_JWT_GUIDE.md'ye bakın)
4. **"Save"** butonuna tıklayın

## 📍 Yol Haritası

```
Supabase Dashboard
  └── Authentication (Sol menü)
       └── Providers (Üst menü sekmesi)
            ├── Email (Zaten aktif olmalı)
            ├── Google (Buradan aktif edin) ✅
            ├── Apple (Buradan aktif edin) ✅
            └── Diğer provider'lar...
```

## 🔍 Nerede Bulunur?

**OAuth Apps ≠ OAuth Providers**

- **OAuth Apps**: Başka uygulamaların SİZE bağlanması için (OAuth Server Settings)
- **OAuth Providers**: SİZİN başka servislere (Google, Apple) bağlanmanız için ✅

## ✅ Kontrol Listesi

- [ ] Authentication > Providers sayfasına gittiniz mi?
- [ ] Google toggle'ını AÇIK yaptınız mı?
- [ ] Google Client ID ve Secret'ı girdiniz mi?
- [ ] Apple toggle'ını AÇIK yaptınız mı?
- [ ] Apple Services ID ve JWT Secret'ı girdiniz mi?
- [ ] Redirect URL'leri eklediniz mi? (Auto-configured olabilir)

## 🆘 Hala Bulamıyorsanız

**Screenshot gönderebilir misiniz?**
- Supabase Dashboard'da hangi menüde olduğunuzu gösterin
- Authentication sayfasının görünümünü paylaşın

Alternatif yol:
1. URL'yi kontrol edin: `https://app.supabase.com/project/[PROJECT-ID]/auth/providers`
2. Direkt bu URL'ye gidebilirsiniz

## 📚 Detaylı Rehberler

- Google OAuth: `SUPABASE_OAUTH_SETUP.md`
- Apple OAuth JWT: `APPLE_OAUTH_JWT_GUIDE.md`
- OAuth Redirect Fix: `OAUTH_REDIRECT_FIX.md`
