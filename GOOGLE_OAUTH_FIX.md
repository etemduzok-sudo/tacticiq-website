# Google OAuth "OAuth client was not found" Hatası Düzeltme

## 🔴 Hata
```
Error 401: invalid_client
The OAuth client was not found.
```

## 🔍 Sorun
Bu hata, Supabase'de Google OAuth provider'ının doğru yapılandırılmadığı anlamına gelir. Google Cloud Console'da oluşturulan **Client ID** ve **Client Secret** bilgileri Supabase'e doğru eklenmemiş olabilir.

## ✅ Çözüm Adımları

### 1. Google Cloud Console'da OAuth Client Kontrolü

1. [Google Cloud Console](https://console.cloud.google.com) → Projenizi seçin
2. **APIs & Services** > **Credentials** sayfasına gidin
3. **OAuth 2.0 Client IDs** bölümünde client'ınızı bulun
4. Client'ı açın ve şu bilgileri not edin:
   - **Client ID** (örn: `123456789-abc123def456.apps.googleusercontent.com`)
   - **Client Secret** (görmek için "Show" butonuna tıklayın)

### 2. Authorized Redirect URIs Kontrolü

Google Cloud Console'daki OAuth client ayarlarında **Authorized redirect URIs** listesinde şu URL olmalı:

```
https://jxdgiskusjljlpzvrzau.supabase.co/auth/v1/callback
```

**Eğer yoksa ekleyin:**
1. OAuth client'ı açın
2. **Authorized redirect URIs** bölümüne gidin
3. **+ ADD URI** butonuna tıklayın
4. `https://jxdgiskusjljlpzvrzau.supabase.co/auth/v1/callback` ekleyin
5. **SAVE** butonuna tıklayın

### 3. Supabase Dashboard'da Google Provider Ayarları

1. [Supabase Dashboard](https://app.supabase.com) → Projeniz
2. **Authentication** > **Providers** > **Google** sayfasına gidin
3. **Enable Google** toggle'ını açın (eğer kapalıysa)
4. Şu bilgileri girin:

   **Client IDs:**
   ```
   TacticIQ.app
   ```
   veya tam Client ID:
   ```
   123456789-abc123def456.apps.googleusercontent.com
   ```

   **Client Secret:**
   ```
   Google Cloud Console'dan aldığınız Client Secret
   ```

5. **Callback URL** kontrol edin:
   ```
   https://jxdgiskusjljlpzvrzau.supabase.co/auth/v1/callback
   ```
   Bu URL zaten gösteriliyorsa, bunu kopyalayıp Google Cloud Console'a ekleyin (adım 2'de)

6. **Skip nonce checks**: Kapalı bırakın (daha güvenli)

7. **Allow users without an email**: Açın

8. **Save** butonuna tıklayın

### 4. Önemli Kontrol Noktaları

#### ✅ Client ID Formatı
Supabase'de Client ID alanına **sadece Client ID** girmelisiniz:
- ❌ Yanlış: `TacticIQ.app` (eğer gerçek Client ID değilse)
- ✅ Doğru: `123456789-abc123def456.apps.googleusercontent.com` (Google Cloud'dan aldığınız gerçek Client ID)

Eğer "TacticIQ.app" gerçek Client ID'niz ise, Google Cloud Console'da kontrol edin.

#### ✅ Client Secret
- Client Secret'i Google Cloud Console'dan alın
- ⚠️ **Gizli tutun**, herkese açık paylaşmayın

#### ✅ Redirect URI Eşleşmesi
- Google Cloud Console'daki **Authorized redirect URIs** listesinde Supabase callback URL'i olmalı
- Supabase'de gösterilen Callback URL ile Google Cloud'daki URL **tam olarak eşleşmeli**

### 5. Değişikliklerden Sonra

1. **Birkaç dakika bekleyin** (OAuth ayarları bazen biraz sürebilir)
2. **Browser cache'ini temizleyin** veya **Hard refresh** yapın (Ctrl+Shift+R)
3. **Supabase Dashboard'dan çıkış yapın ve tekrar giriş yapın**
4. Web sitesinde **Google ile giriş** butonunu tekrar deneyin

## 🔧 Alternatif: Yeni OAuth Client Oluşturma

Eğer mevcut Client ID çalışmıyorsa, yeni bir tane oluşturabilirsiniz:

### Google Cloud Console'da:

1. **APIs & Services** > **Credentials** > **+ CREATE CREDENTIALS** > **OAuth client ID**
2. **Application type**: **Web application** seçin
3. **Name**: `TacticIQ Web App` (veya istediğiniz isim)
4. **Authorized JavaScript origins**:
   ```
   https://jxdgiskusjljlpzvrzau.supabase.co
   https://tacticiq.app
   ```
5. **Authorized redirect URIs**:
   ```
   https://jxdgiskusjljlpzvrzau.supabase.co/auth/v1/callback
   ```
6. **CREATE** butonuna tıklayın
7. **Client ID** ve **Client Secret**'i kopyalayın
8. Supabase Dashboard'a geri dönün ve yeni Client ID/Secret'ı girin

## 📝 Checklist

- [ ] Google Cloud Console'da OAuth client var mı?
- [ ] Client ID doğru mu? (`xxx-xxx.apps.googleusercontent.com` formatında)
- [ ] Client Secret doğru mu?
- [ ] Authorized redirect URIs'de Supabase callback URL var mı?
- [ ] Supabase'de Google provider **Enable** durumunda mı?
- [ ] Supabase'de Client ID ve Secret doğru girilmiş mi?
- [ ] Değişikliklerden sonra birkaç dakika beklendi mi?
- [ ] Browser cache temizlendi mi?

## 🆘 Hala Çalışmıyorsa

1. **Browser Console'u kontrol edin:**
   - F12 > Console sekmesi
   - OAuth hatalarını inceleyin

2. **Network sekmesini kontrol edin:**
   - F12 > Network sekmesi
   - Google OAuth isteğini inceleyin
   - Response'da ne hatası var bakın

3. **Supabase Dashboard > Logs:**
   - Authentication loglarını kontrol edin
   - Google OAuth denemelerinde ne hatası görünüyor?

4. **Google Cloud Console > APIs & Services > OAuth consent screen:**
   - OAuth consent screen ayarlarını kontrol edin
   - Publishing status'u ne durumda?

## 📚 İlgili Dosyalar

- `SUPABASE_OAUTH_SETUP.md` - Genel OAuth kurulum rehberi
- `SUPABASE_API_KEY_FIX.md` - API key sorunları için
