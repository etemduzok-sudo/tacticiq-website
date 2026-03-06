# tacticiq.supabase.co — Vanity Subdomain + Logo (Adım Adım)

**Sonuç:** Giriş ekranında `jxdgiskusjljlpzvrzau.supabase.co` yerine **tacticiq.supabase.co** görünecek. Logo ve uygulama adı **Google** (ve Apple) tarafında ayarlanır; onu da ekleyeceğiz.

- Ek ücret yok (Pro planında dahil).
- Logo: Google OAuth consent screen + (isteğe) Apple tarafında eklenir.

---

## Ön kontrol

- [ ] Supabase Pro (veya üzeri) planındayım
- [ ] Bilgisayarda Node/npm veya Supabase CLI kullanmaya hazırım

---

## Adım 1 — Supabase CLI ile vanity subdomain kontrolü ve aktivasyon

Vanity subdomain **sadece CLI** ile yapılıyor (dashboard’da yok).

### 1.1 Supabase CLI kur (yoksa)

```bash
npm install -g supabase
```

Veya: https://supabase.com/docs/guides/cli/getting-started

### 1.2 Supabase’e giriş yap

```bash
supabase login
```

Tarayıcı açılır; Supabase hesabınla giriş yap.

### 1.3 Subdomain müsait mi kontrol et

```bash
supabase vanity-subdomains --project-ref jxdgiskusjljlpzvrzau check-availability --desired-subdomain tacticiq --experimental
```

“Available” / uygun görürsen devam et. Başka isim istersen `tacticiq-app` vb. dene.

### 1.4 Google ve Apple callback’leri önce ekle (önemli)

Aktivasyondan **önce** Google (ve Apple) tarafında **yeni** callback URI’yi ekle ki giriş kırılmasın.

**Google:**  
[Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → ilgili OAuth client → **Authorized redirect URIs**’e ekle:

```
https://tacticiq.supabase.co/auth/v1/callback
```

Eski `https://jxdgiskusjljlpzvrzau.supabase.co/auth/v1/callback`’i **şimdilik silme**. Save.

**Apple (Sign in with Apple kullanıyorsan):**  
Apple Developer → Sign in with Apple config → **Return URLs** ve **Domains**’e `tacticiq.supabase.co` ve `https://tacticiq.supabase.co/auth/v1/callback` ekle.

- [ ] Google’da yeni redirect URI eklendi
- [ ] Apple’da eklendi (veya atlandı)

### 1.5 Vanity subdomain’i aktif et

```bash
supabase vanity-subdomains --project-ref jxdgiskusjljlpzvrzau activate --desired-subdomain tacticiq --experimental
```

Başarılı olunca proje hem eski hem yeni URL’den çalışır:
- Eski: `https://jxdgiskusjljlpzvrzau.supabase.co`
- Yeni: `https://tacticiq.supabase.co`

- [ ] Adım 1 tamam — tacticiq.supabase.co aktif

---

## Adım 2 — Uygulamada Supabase URL’ini güncelle

Tüm ortamlarda Supabase URL’ini **tacticiq.supabase.co** yap. Key’ler aynı kalır.

- **Website (Vite):** `.env` / `.env.local`  
  `VITE_SUPABASE_URL=https://tacticiq.supabase.co`
- **Mobil (Expo):** `.env` veya app config  
  Supabase URL = `https://tacticiq.supabase.co`
- **Backend:** Varsa `SUPABASE_URL=https://tacticiq.supabase.co`

- [ ] Tüm env’ler güncellendi

---

## Adım 3 — Logo ve uygulama adı (Google)

Bunlar **Supabase’den değil**, Google’dan ayarlanır; vanity subdomain ile uyumlu.

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **OAuth consent screen**.
2. **App information** (veya “Edit app”) bölümüne gir.
3. **Application name:** Örn. **TacticIQ**
4. **Application logo:** Yükle (ör. 120x120 px, kare). Google’ın kurallarına uygun logo kullan.
5. Kaydet.

Bazı durumlarda “Branding” / “Authorized domains” vb. ek adımlar çıkabilir; ekrandaki talimatları izle. Logo, “Bir hesap seçin” ekranında uygulama adının yanında görünebilir.

- [ ] Google’da uygulama adı ve logo ayarlandı

---

## Adım 4 — Logo / görünüm (Apple, Sign in with Apple varsa)

Apple tarafında “Sign in with Apple” için ayrı bir logo alanı yok; Apple kendi butonunu kullanır. Uygulama adı ve görünüm, Apple Developer’da **App ID** / **App** bilgilerinden gelir. Logo eklemek istersen:

- App Store Connect’te uygulama ikonu zaten var.
- Sign in with Apple **web** kullanıyorsan, Apple’ın “Services ID” / configuration sayfasında “Return URLs” ve “Domains” doğru olsun; görünüm büyük ölçüde senin sitenin/uygulamanın tarafından kontrol edilir.

- [ ] Apple tarafı kontrol edildi (veya “Apple kullanmıyorum”)

---

## Özet

| Ne | Nerede |
|----|--------|
| tacticiq.supabase.co | Supabase CLI (vanity subdomain) |
| Redirect URI | Google + Apple console’da `https://tacticiq.supabase.co/auth/v1/callback` |
| Uygulama adı + logo | Google: OAuth consent screen → App information |
| Proje URL’i | Tüm .env’lerde `https://tacticiq.supabase.co` |

Bunları yaptığında hem **tacticiq.supabase.co** görünür hem de **logo** Google giriş ekranında kullanılabilir.
