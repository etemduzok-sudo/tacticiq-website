# auth.tacticiq.com — Adım Adım Yapılacaklar

Birlikte sırayla yapacağız. Her adımı bitirince işaretle.

---

## Ön kontrol

- [ ] Supabase Pro (veya üzeri) planındayım
- [ ] tacticiq.com domain’i bende ve DNS’e erişebiliyorum (Cloudflare, GoDaddy, Namecheap vb.)

---

## Adım 1 — Supabase’de custom domain ekle

1. Tarayıcıda aç: https://supabase.com/dashboard
2. **TacticIQ projesini** seç (jxdgiskusjljlpzvrzau olan).
3. Sol altta **Project Settings** (dişli ikon) tıkla.
4. Solda **Custom Domains** veya **Add-ons** → Custom Domain bölümünü bul.
5. **Add custom domain** / **Add domain** butonuna tıkla.
6. Domain olarak tam olarak yaz: **auth.tacticiq.com**
7. Kaydet / Add.

Supabase sana **iki şey** gösterecek (ekranda veya “Setup instructions” benzeri bir yerde):
- **CNAME:** Host `auth` → Target `jxdgiskusjljlpzvrzau.supabase.co`
- **TXT:** Bir doğrulama değeri (örn. `_acme-challenge.auth` için uzun bir string)

Bu ekranı açıp CNAME ve TXT değerlerini gördüğünde Adım 1 tamam.  
(CNAME/TXT değerlerini bir yere not et; Adım 2’de kullanacağız.)

- [ ] Adım 1 yapıldı — CNAME ve TXT değerleri not edildi

---

## Adım 2 — DNS’e CNAME ve TXT ekle

1. tacticiq.com’u **hangi siteden** yönetiyorsun? (Cloudflare, GoDaddy, Namecheap, vb.)
2. O sitenin **DNS / DNS Management / Nameservers** bölümüne gir.
3. **Yeni kayıt ekle:**

   **CNAME kaydı:**
   - Type: **CNAME**
   - Name / Host: **auth** (bazı paneller otomatik .tacticiq.com ekler; sadece `auth` yeterli)
   - Target / Value: **jxdgiskusjljlpzvrzau.supabase.co**
   - TTL: 300 veya 3600

   **TXT kaydı (Supabase’in verdiği):**
   - Type: **TXT**
   - Name / Host: **_acme-challenge.auth** (veya Supabase’in yazdığı tam değer)
   - Value: Supabase’in verdiği uzun string’i **aynen** yapıştır
   - TTL: 300 veya 3600

4. Kaydet.

- [ ] Adım 2 yapıldı — CNAME ve TXT eklendi

**Bekle:** 5–15 dakika (bazen 30 dk). Sonra Adım 3’e geç.

---

## Adım 3 — Supabase’de doğrulama (Verify)

1. Supabase Dashboard → Project Settings → Custom Domains sayfasına dön.
2. **Verify** veya **Reverify** butonuna tıkla.
3. Doğrulama ve SSL’in hazır olmasını bekle (birkaç dakika – 30 dk’ya kadar sürebilir).
4. Domain **Active** / yeşil tik görünene kadar bekle.

- [ ] Adım 3 yapıldı — Domain Active

---

## Adım 4 — Google OAuth redirect URI ekle

1. Aç: https://console.cloud.google.com/
2. Doğru projeyi seç.
3. Sol menü: **APIs & Services** → **Credentials**.
4. **OAuth 2.0 Client IDs** listesinden Supabase için kullandığın client’ı aç (Web client veya Supabase’e eklediğin redirect’e sahip olan).
5. **Authorized redirect URIs** bölümüne **yeni satır** ekle:
   - `https://auth.tacticiq.com/auth/v1/callback`
6. **Save**.

(Eski `https://jxdgiskusjljlpzvrzau.supabase.co/auth/v1/callback` satırını şimdilik silme; ikisi de dursun.)

- [ ] Adım 4 yapıldı — Google’da yeni redirect URI eklendi

---

## Adım 5 — Apple Sign in with Apple (varsa)

Sadece uygulamada **Sign in with Apple** kullanıyorsan yap.

1. https://developer.apple.com/ → **Certificates, Identifiers & Profiles** → **Identifiers**.
2. İlgili **App ID** veya **Services ID**’yi seç.
3. **Sign in with Apple** → **Configure**.
4. **Domains:** `auth.tacticiq.com` ekle.
5. **Return URLs:** `https://auth.tacticiq.com/auth/v1/callback` ekle (veya eski Supabase URL’ini bununla değiştir).
6. Kaydet.

- [ ] Adım 5 yapıldı (veya “Apple kullanmıyorum” — atla)

---

## Adım 6 — Projede Supabase URL’ini güncelle

Custom domain **Active** olduktan sonra, uygulama ve backend’de Supabase URL’ini değiştiriyoruz.

**Değişecek:** Tüm `https://jxdgiskusjljlpzvrzau.supabase.co` → `https://auth.tacticiq.com`  
**Değişmeyecek:** Anon key, service role key vb. aynı kalır.

- [ ] Website (Vite) `.env` / `.env.local`: `VITE_SUPABASE_URL=https://auth.tacticiq.com`
- [ ] Mobil (Expo) env: Supabase URL = `https://auth.tacticiq.com`
- [ ] Backend env (varsa): `SUPABASE_URL=https://auth.tacticiq.com`

- [ ] Adım 6 yapıldı — Tüm ortamlarda URL güncellendi

---

## Bitti

- Google ve Apple giriş ekranında artık **auth.tacticiq.com** görünecek; “supabase” görünmeyecek.
- Sorun olursa önce Google/Apple console’da redirect URI’lerin doğru olduğundan ve Supabase’de domain’in **Active** olduğundan emin ol.
