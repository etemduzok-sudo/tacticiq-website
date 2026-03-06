# Google'da Yeni Callback (Redirect URI) Ekleme — Adım Adım

**Amaç:** Supabase için kullandığın Google OAuth uygulamasına şu adresi eklemek:  
`https://tacticiq.supabase.co/auth/v1/callback`

Bunu **vanity subdomain’i aktif etmeden önce** yap.

---

## Adım 1 — Google Cloud Console’u aç

1. Tarayıcıda şunu aç: **https://console.cloud.google.com/**
2. TacticIQ / Supabase için kullandığın **Google hesabıyla** giriş yap.
3. Üstte **proje seçici** var (varsayılan “My Project” veya bir proje adı). Tıkla.
4. Listeden **Supabase ile giriş için kullandığın projeyi** seç. (Hangi proje olduğundan emin değilsen, Supabase Dashboard → Authentication → Providers → Google’da bazen proje bilgisi veya “Google Cloud Console’da şu ayarları yap” gibi bir link olur; o projeyi seç.)

---

## Adım 2 — Credentials (Kimlik Bilgileri) sayfasına git

1. Sol taraftaki **≡** (hamburger) menüyü aç.
2. **“APIs & Services”** (API ve Hizmetler) bölümünü bul.
3. **“Credentials”** (Kimlik Bilgileri) tıkla.  
   - Doğrudan link: **https://console.cloud.google.com/apis/credentials**
4. Açılan sayfada **“OAuth 2.0 Client IDs”** başlığı altında liste görünecek (Web client, Android, iOS vb.).

---

## Adım 3 — Doğru OAuth client’ı bul ve aç

1. **OAuth 2.0 Client IDs** listesinde, Supabase’e eklediğin **Web client**’ı bul.  
   - Genelde adı “Web client (auto created by Google Service)” veya senin verdiğin bir isim olur.  
   - **Authorized redirect URIs** sütununda veya detayda `https://jxdgiskusjljlpzvrzau.supabase.co/auth/v1/callback` görüyorsan doğru client’tır.
2. Bu satırdaki **isim**e (client adına) tıkla.  
   - Açılan sayfa: **“Edit OAuth client”** veya **“OAuth 2.0 Client ID’yi düzenle”**.

---

## Adım 4 — Redirect URI’yi ekle

1. Sayfada **“Authorized redirect URIs”** (Yetkili yönlendirme URI’leri) bölümünü bul.
2. **“+ ADD URI”** veya **“URI Ekle”** butonuna tıkla.
3. Yeni çıkan kutuya **aynen** şunu yaz (tek satır, boşluksuz):
   ```
   https://tacticiq.supabase.co/auth/v1/callback
   ```
4. **Eski** Supabase URI’yi (`https://jxdgiskusjljlpzvrzau.supabase.co/auth/v1/callback`) **silme**; ikisi de listede dursun. Böylece hem eski hem yeni domain çalışır.
5. Gerekirse sayfanın altındaki **“SAVE”** / **“Kaydet”** butonuna tıkla.

---

## Adım 5 — Kontrol

- **Authorized redirect URIs** listesinde şunları görmelisin:
  - `https://jxdgiskusjljlpzvrzau.supabase.co/auth/v1/callback` (eski)
  - `https://tacticiq.supabase.co/auth/v1/callback` (yeni)

Bu adımları yaptıysan Google tarafı hazır. Sonra Supabase CLI ile vanity subdomain’i aktif edebilirsin.
