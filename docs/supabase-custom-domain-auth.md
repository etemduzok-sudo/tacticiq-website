# Supabase Custom Domain: auth.tacticiq.com

**Sonuç:** Hem Google hem Apple oturum açma ekranında **auth.tacticiq.com** görünür; "supabase" hiç görünmez.

- Google: "auth.tacticiq.com uygulamasına devam edin"
- Apple: Aynı callback domain kullanılır → yine **auth.tacticiq.com**

---

## Ön koşullar

- Supabase Pro (veya üzeri) + Custom Domain add-on açık
- **tacticiq.com** domain’ine sahip olmak ve DNS ayarlarına erişim (GoDaddy, Cloudflare, Namecheap vb.)

---

## Adım 1: Supabase’de domain ekle

1. [Supabase Dashboard](https://supabase.com/dashboard) → projen → **Project Settings** (sol altta dişli)
2. **Custom Domains** bölümüne gir (veya Add-ons → Custom Domain)
3. **Add custom domain** → `auth.tacticiq.com` yaz
4. Supabase size şunları verecek:
   - **CNAME kaydı:** `auth` (veya `auth.tacticiq.com`) → `jxdgiskusjljlpzvrzau.supabase.co`
   - **TXT kaydı:** Doğrulama için (örn. `_acme-challenge.auth.tacticiq.com`)

---

## Adım 2: DNS ayarları (domain sağlayıcında)

Domain’i nereden yönettiğinize gidin (Cloudflare, GoDaddy, vb.):

| Tip  | Name / Host     | Value / Target                              |
|------|------------------|---------------------------------------------|
| CNAME| `auth`           | `jxdgiskusjljlpzvrzau.supabase.co`          |
| TXT  | `_acme-challenge.auth` | (Supabase’in verdiği değer – aynen kopyala) |

- **Name:** Sadece `auth` (bazı paneller otomatik `.tacticiq.com` ekler; o zaman sadece `auth` yeterli)
- TTL: 300–3600 arası uygun

Kayıtları kaydedip **5–15 dakika** bekleyin (bazen 30 dk’ya kadar sürebilir).

---

## Adım 3: Supabase’de doğrulama

1. Dashboard’da Custom Domain sayfasında **Verify** / **Reverify** butonuna tıklayın
2. Doğrulama ve SSL sertifikası 5–30 dakika sürebilir
3. Başarılı olunca domain **Active** görünür

---

## Adım 4: Google OAuth callback güncelleme

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**
2. Supabase için kullandığınız **OAuth 2.0 Client ID**’yi açın
3. **Authorized redirect URIs** bölümüne **yeni** URI’yi ekleyin:
   ```
   https://auth.tacticiq.com/auth/v1/callback
   ```
4. Eski Supabase URL’ini (`https://jxdgiskusjljlpzvrzau.supabase.co/auth/v1/callback`) **hemen silmeyin**; önce yeni domain’i test edin, sonra kaldırabilirsiniz
5. **Save**

---

## Adım 4b: Apple Sign in with Apple callback güncelleme

Custom domain kullandığınızda **Sign in with Apple** da aynı domain’e döner; Apple tarafında da yeni URL tanımlanmalı.

1. [Apple Developer](https://developer.apple.com/) → **Certificates, Identifiers & Profiles** → **Identifiers**
2. Uygulamanızın **App ID**’sini seçin (veya Sign in with Apple kullanan identifier)
3. **Sign in with Apple** → **Configure** (veya ilgili servis konfigürasyonu)
4. **Domains and Subdomains** bölümüne `auth.tacticiq.com` ekleyin (Supabase dokümanında belirtilen formatta)
5. **Return URLs** (veya Redirect URLs) kısmında callback’i güncelleyin:
   - `https://auth.tacticiq.com/auth/v1/callback`  
   (Eski `https://jxdgiskusjljlpzvrzau.supabase.co/auth/v1/callback` ile değiştirin veya ikisini de geçiş süresince tutun.)

Apple’da tam yol bazen **Services ID** (web için) veya **App ID** altında “Sign in with Apple” konfigürasyonunda olur; projenize göre ilgili yerde Return URL / Redirect URI alanını auth.tacticiq.com ile güncelleyin.

---

## Adım 5: Uygulamada URL güncelleme

Custom domain aktif olduktan sonra tüm Supabase çağrıları yeni URL üzerinden gidebilir.

**Environment variables (.env / .env.local):**

```env
# Eski
VITE_SUPABASE_URL=https://jxdgiskusjljlpzvrzau.supabase.co

# Yeni (custom domain)
VITE_SUPABASE_URL=https://auth.tacticiq.com
```

- **Website (Vite):** `.env` / `.env.local` içinde `VITE_SUPABASE_URL`
- **Expo/React Native:** `app.json` veya `.env` içinde Supabase URL’i
- **Backend:** Varsa `SUPABASE_URL` veya benzeri env

Supabase **anon key** aynı kalır; sadece URL değişir.

---

## Zorluk özeti

| Adım           | Zorluk   | Süre    |
|----------------|----------|---------|
| DNS kayıtları  | Kolay    | ~5 dk   |
| Doğrulama      | Otomatik | 5–30 dk |
| Google Console| Kolay    | ~2 dk   |
| Env güncelleme| Kolay    | ~2 dk   |

**Toplam:** Teknik olarak zor değil; DNS yayılımı ve SSL bekleme süresi en uzun kısım.

---

## Dikkat

- Custom domain **tek** olabilir: Tüm Supabase API + Auth bu domain’e gelir (örn. `https://auth.tacticiq.com`). Yani hem Auth hem API aynı `auth.tacticiq.com` üzerinden kullanılır; ayrı `api.tacticiq.com` istersen dokümantasyonda “single custom domain per project” kuralına göre hareket etmek gerekir.
- Önce **test ortamında** veya küçük bir kullanıcı grubuyla deneyip, sorun yoksa tam geçiş yapmak iyi olur.

Bu adımlarla **auth.tacticiq.com** ile devam etmek gayet mantıklı ve yapılabilir.
