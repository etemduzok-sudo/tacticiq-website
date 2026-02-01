# TacticIQ – Admin Girişi ve Ayarlar Rehberi

Bu rehber, **yazılım bilgisi gerektirmeden** admin panele nasıl girileceğini ve uzaktan backend ayarlarının nereden yapılacağını adım adım anlatır.

---

## BÖLÜM A: Admin Panele Nasıl Girilir?

**🔒 Güvenlik Notu:**  
Admin girişi footer’da görünür olsa bile, yetkisiz kullanıcılar e-posta + şifre veya magic link olmadan panele erişemez. Tüm giriş denemeleri backend tarafında doğrulanır ve kayıt altına alınır.

### Yöntem 1 – Şifre ile giriş

1. Tarayıcıda **TacticIQ sitesini** açın: **https://www.tacticiq.app** (veya canlı sitenizin adresi).
2. Sayfanın **en altına** (footer) inin.
3. **"Admin"** yazısına tıklayın (kilit simgesi yanında).
4. Açılan pencerede:
   - **E-posta:** Admin e-posta adresinizi yazın (örn. `etemduzok@gmail.com`).
   - **Şifre:** Admin şifrenizi yazın.
5. **"Giriş Yap"** butonuna tıklayın.
6. Başarılı olursa pencere kapanır; sağ üstte **"Admin"** ve **"Çıkış"** görünür. Sayfada admin paneline erişebilirsiniz.

### Yöntem 2 – E-posta linki ile giriş (Magic Link)

1. Yine **footer’daki "Admin"**e tıklayın.
2. Açılan pencerede üstte **"E-posta linki"** sekmesine tıklayın.
3. **Admin e-posta adresinizi** yazın.
4. **"Giriş linki gönder"** butonuna tıklayın.
5. E-postanızı kontrol edin; gelen **linke tıklayın**.
6. Tarayıcı siteye döner ve otomatik admin olarak giriş yapmış olursunuz.

**⚠️ Eğer e-posta gelmezse** Spam / Junk klasörünü kontrol edin. Kurumsal maillerde (Outlook, Gmail Workspace) ilk girişte spam’e düşebilir.

**Not:** E-posta linki ile girişte, her girişte e-postanıza bir bildirim maili de gider (admin giriş bildirimi).

**E-posta linki çalışmıyorsa:** Supabase’de Redirect URL eklemeniz gerekir:
1. **https://supabase.com** → Projeniz → **Authentication** → **URL Configuration**.
2. **Redirect URLs** bölümüne sitenizin adresini ekleyin: `https://www.tacticiq.app` ve `https://tacticiq.app` (veya canlı sitenizin adresi).
3. **Save** tıklayın.

---

## BÖLÜM B: Uzaktan Backend Ayarları (Vercel)

**ℹ️ Uzaktan backend ne demek?**  
Sitenin hangi sunucuya bağlanacağını Vercel üzerinden belirlemek demektir. Bilgisayar başında olmadan, sadece tarayıcıdan backend adresini değiştirebilirsiniz.

Bilgisayar başında olmadan backend’i yönetmek için **Vercel’de iki ayar** yapmanız yeterli. Backend’i daha önce Railway veya Render’a deploy etmiş olmalısınız.

### Adım 1: Vercel’e giriş

1. **https://vercel.com** adresine gidin.
2. Giriş yapın (TacticIQ projesinin sahibi hesapla).

### Adım 2: Projeyi seçin

1. Üstteki **"Dashboard"** veya **"Projects"** bölümüne girin.
2. **TacticIQ website** projesini (tacticiq-website veya site adınız) tıklayın.

### Adım 3: Ortam değişkenlerini ekleyin

1. Proje sayfasında üst menüden **"Settings"** (Ayarlar) sekmesine tıklayın.
2. Sol menüden **"Environment Variables"** (Ortam Değişkenleri) bölümüne girin.
3. **"Add New"** veya **"Add"** butonuna tıklayın.
4. İlk değişken:
   - **Name (İsim):** `VITE_BACKEND_URL`
   - **Value (Değer):** Backend adresiniz.  
   - **Environment:** Production (ve isterseniz Preview) işaretleyin.
   - **Save** (Kaydet) tıklayın.

   **⚠️ Backend URL’nin sonunda `/` (slash) OLMAMALI**

   | Doğru ✅ | Yanlış ❌ |
   |----------|-----------|
   | `https://api.tacticiq.app` | `https://api.tacticiq.app/` |
   | `https://tacticiq-backend.onrender.com` | `https://tacticiq-backend.onrender.com/` |
5. İkinci değişken:
   - **Name:** `VITE_BACKEND_API_KEY`
   - **Value:** Backend’de kullandığınız API anahtarı (backend’deki `VALID_API_KEYS` ile **aynı** olmalı).  
     Örnek: `tacticiq-admin-2024` (kendi belirlediğiniz güçlü bir anahtar kullanın).
   - **Environment:** Production (ve isterseniz Preview).
   - **Save** tıklayın.

### Adım 4: Siteyi yeniden yayınlayın

1. **"Deployments"** sekmesine gidin.
2. En üstteki (son) deployment’ın sağındaki **üç nokta (⋯)** menüsüne tıklayın.
3. **"Redeploy"** (Yeniden dağıt) seçin; onaylayın.
4. Birkaç dakika bekleyin. Bittiğinde canlı sitede admin paneli → **Sistem İzleme** bölümünde **"Uzaktan backend kullanılıyor"** mesajını görürsünüz; Backend servisini oradan yeniden başlatabilirsiniz.

---

## BÖLÜM C: Admin Giriş Bildirim E-postası

**🔐 Bu bildirim sistemi,** yetkisiz admin erişimlerini anında fark etmeniz için tasarlanmıştır.

Admin olarak (şifre veya e-posta linki ile) giriş yaptığınızda, **e-postanıza otomatik bir bildirim** gider:

- **Konu:** "TacticIQ Admin Girişi – [e-posta] – [tarih]"
- **İçerik:** Hangi e-posta ile, hangi tarih/saatte ve hangi IP’den giriş yapıldığı yazar.

Bu bildirimin gideceği adres:

- Backend’i **bulutta** çalıştırıyorsanız: Backend’in `.env` dosyasında **`ADMIN_NOTIFY_EMAIL`** tanımlı ise oraya, yoksa varsayılan olarak projede ayarlı admin e-postasına gider.
- Backend’i **yerelde** çalıştırıyorsanız: Backend’deki `emailService.js` içinde varsayılan adres kullanılır (gerekirse orayı kendi e-postanızla değiştirebilirsiniz).

Bildirim, **sadece giriş anında** tetiklenir; her sayfa yenilemede gönderilmez.

---

## BÖLÜM D: İsteğe Bağlı – Admin Subdomain (admin.tacticiq.app)

Admin panele ayrı bir adresle girmek isterseniz:

1. **Vercel** → Projeniz → **Settings** → **Domains**.
2. **"Add"** ile yeni domain ekleyin: `admin.tacticiq.app`
3. Domain sağlayıcınızda (DNS) bu adres için **CNAME** kaydını Vercel’e yönlendirin (Vercel ekranda tam adresi gösterir).
4. Kayıt yayıldıktan sonra **https://admin.tacticiq.app** adresinden site açılır; aynı sayfa, aynı admin girişi. Sadece adres farklı olur.

---

## Admin Panel Yapısı

- **Web Yönetimi:** Gösterge Paneli, Analitik, Kullanıcılar, İçerik, Reklam, Ekip, vb.
- **Test Alanı:** Test Bot (ayrı bölüm, altta değil).
- **Sistem İzleme:** Servisler & Veri Akışı (ayrı bölüm, altta değil).
- **Mobil Admin:** Mobil uygulama yönetimi (placeholder).

---

## Özet Tablo

| Ne yapmak istiyorsunuz? | Nereye gideceksiniz? | Ne yapacaksınız? |
|-------------------------|----------------------|------------------|
| **Admin panele giriş** | Site footer → **Admin** | E-posta + şifre ile **Giriş Yap** veya **E-posta linki** sekmesinden link gönderin, e-postadaki linke tıklayın. |
| **Uzaktan backend kullanmak** | **Vercel** → Proje → **Settings** → **Environment Variables** | `VITE_BACKEND_URL` ve `VITE_BACKEND_API_KEY` ekleyin; ardından **Redeploy** yapın. |
| **Giriş bildirimi nereye gidiyor?** | Backend’in bulunduğu sunucudaki `.env` | `ADMIN_NOTIFY_EMAIL=your@email.com` ekleyebilirsiniz (isteğe bağlı). |
| **Admin’e ayrı adres** | **Vercel** → **Settings** → **Domains** | `admin.tacticiq.app` ekleyip DNS’te CNAME’i Vercel’e verin. |

Tüm bu adımlar **kod yazmadan**, sadece tarayıcı ve Vercel/DNS ayarlarıyla yapılır.
