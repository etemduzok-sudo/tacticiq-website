# TacticIQ – Sistem Özeti ve Birlikte Yapacağımız Adımlar

Bu dosya: **Backend nerede çalışıyor**, **site nerede**, **sisteme eklenen iyileştirmeler**, ve **sırayla ne yapacaksınız** hepsini tek yerde topluyor. Böylece adımlardan kopmadan birlikte ilerleyebiliriz.

---

## BİRLİKTE YAPACAĞIMIZ – SIRA İLE (ÖZET LİSTE)

Aşağıdaki sırayla ilerleyeceğiz. Her adımı bitirince “tamam” deyin, bir sonrakine geçelim.

| Sıra | Ne yapacağız? | Nerede / Nasıl? |
|------|----------------|-----------------|
| **1** | Backend yerelde çalışıyor mu kontrol et | Terminal: `cd c:\TacticIQ\backend` → `npm start` → Tarayıcı: `http://localhost:3001/health` |
| **2** | Backend’i buluta deploy et (uzaktan erişim için) | Railway veya Render’a deploy; backend URL al |
| **3** | Vercel’e backend adresini tanıt | Vercel → Proje → Settings → Environment Variables → `VITE_BACKEND_URL` ve `VITE_BACKEND_API_KEY` ekle (URL sonunda **/** olmasın) |
| **4** | Siteyi yeniden yayınla | Vercel → Deployments → Son deploy → Redeploy |
| **5** | Admin panele giriş yap | Site footer → Admin → Şifre veya e-posta linki |
| **6** | (İsteğe bağlı) E-posta linki için Supabase ayarı | Supabase → Authentication → URL Configuration → Redirect URLs’e site adresini ekle |

Detaylar aşağıda, **“2. BİRLİKTE YAPACAĞIMIZ ADIMLAR”** bölümünde adım adım yazıyor.

---

## SİSTEME EKLENEN İYİLEŞTİRMELER (KOD / ARAYÜZ)

Rehberdeki iyileştirmeler sisteme de eklendi; canlı sitede ve admin panelinde görünür:

1. **Admin giriş penceresi – Güvenlik notu**  
   Footer’daki Admin’e tıklayınca açılan pencerede, açıklamanın altında kutu içinde: “Admin girişi footer’da görünür olsa bile, yetkisiz kullanıcılar e-posta + şifre veya giriş linki olmadan panele erişemez.”

2. **Admin giriş – Giriş bildirimi cümlesi**  
   Aynı pencerede açıklamada: “Giriş bildirimleri yetkisiz admin erişimlerini anında fark etmeniz için tasarlanmıştır.”

3. **E-posta linki sekmesi – Spam/Junk uyarısı**  
   “E-posta linki” sekmesinde: “E-posta gelmezse Spam / Junk klasörünü kontrol edin. Kurumsal maillerde ilk girişte spam’e düşebilir.”

4. **Sistem İzleme (Admin Panel) – Uzaktan backend açıklaması**  
   Canlı sitede “Uzaktan servis kontrolü için backend URL gerekli” banner’ında: “Uzaktan backend ne demek? Sitenin hangi sunucuya bağlanacağını Vercel üzerinden belirlemek demektir.”

5. **Sistem İzleme – Slash uyarısı**  
   Aynı banner’da kutu içinde: “Backend URL’nin sonunda `/` (slash) OLMAMALI” ve doğru/yanlış örnek. Uzaktan backend kullanılıyorken de: “Vercel’de URL değiştirirken sonunda `/` kullanmayın.”

---

## 1. SİSTEM ŞU AN NASIL?

### Website (canlı site)
- **Nerede:** Vercel üzerinde yayında.
- **Adresler:** `https://www.tacticiq.app` ve/veya `https://tacticiq-website.vercel.app`
- **Kod yeri:** Bilgisayarınızda `c:\TacticIQ\website\` klasörü.
- **Durum:** Git push ile Vercel otomatik deploy ediyor; site çalışıyor.

### Backend (API sunucusu)
- **Nerede:** Şu an **sadece sizin bilgisayarınızda** çalışabiliyor.
- **Adres (yerelde):** `http://localhost:3001`
- **Kod yeri:** Bilgisayarınızda `c:\TacticIQ\backend\` klasörü.
- **Durum:** Backend **bulutta (Railway/Render vb.) deploy edilmiş değil**. Yani bilgisayarınız kapalıyken veya siz “backend’i başlatmadığınızda” canlı siteden backend’e ulaşılamaz; admin panelindeki “servis kontrolü” de uzaktan çalışmaz.

### Özet tablo

| Parça    | Nerede çalışıyor?        | Adres (şu an)                    |
|----------|--------------------------|-----------------------------------|
| Website  | Vercel (bulut)           | https://www.tacticiq.app         |
| Backend  | Sadece sizin PC’nizde    | http://localhost:3001 (yerelde)  |

---

## 2. BİRLİKTE YAPACAĞIMIZ ADIMLAR (SIRAYLA)

Aşağıdaki adımları **sırayla** yapalım. Her adımı bitirince “tamam” deyin, bir sonrakine geçelim.

---

### ADIM 0 – Kontrol: Backend yerelde çalışıyor mu?

**Amaç:** Backend’in bilgisayarınızda çalıştığını doğrulamak.

1. Bilgisayarınızda **Cursor** veya bir **terminal** açın.
2. Şu komutu çalıştırın (backend klasörüne girip başlatın):
   ```bash
   cd c:\TacticIQ\backend
   npm start
   ```
3. Ekranda “TacticIQ Backend” veya “Port: 3001” gibi bir çıktı görüyorsanız backend **çalışıyor** demektir.
4. Tarayıcıda şu adresi açın: **http://localhost:3001/health**  
   - Sayfada `{"status":"ok", ...}` benzeri bir şey görürseniz backend ayakta demektir.

**Bu adım tamamsa:** Backend şu an sadece sizin PC’nizde çalışıyor; canlı site (Vercel) bundan haberdar değil. Uzaktan kontrol için **Adım 1** gerekli.

---

### ADIM 1 – Backend’i buluta taşımak (uzaktan erişim için)

**Amaç:** Backend’i Railway veya Render’a deploy edip 7/24 erişilebilir bir adres (URL) almak.

**Seçenek A – Railway (önerilen)**

1. **https://railway.app** adresine gidin.
2. **Login** → **GitHub** ile giriş yapın.
3. **New Project** → **Deploy from GitHub repo** seçin.
4. **TacticIQ** reposunu seçin (veya backend’i ayrı repo’da tutuyorsanız onu).
5. Proje oluşunca **Add Service** → **GitHub Repo** → Repoyu seçin.
6. **Settings** veya **Variables** kısmına girin; **Root Directory** veya **Build** ayarında klasörü **`backend`** olarak verin (tüm proje değil, sadece backend).
7. **Variables** bölümüne şunları ekleyin (değerleri kendi .env’inizden alın):
   - `NODE_ENV` = `production`
   - `PORT` = `3001` (veya Railway’in verdiği PORT’u kullanın)
   - `VALID_API_KEYS` = Örneğin: `tacticiq-admin-2024` (güçlü, kendinize özel bir anahtar)
   - `SUPABASE_URL` = (Supabase projenizden)
   - `SUPABASE_SERVICE_KEY` = (Supabase projenizden)
   - `FOOTBALL_API_KEY` = (API-Football anahtarınız)
   - İsterseniz: `ADMIN_NOTIFY_EMAIL` = `etemduzok@gmail.com`
8. **Deploy** tetikleyin; bittikten sonra **Settings** → **Networking** → **Generate Domain** ile bir URL alın. Örnek: `https://tacticiq-backend.up.railway.app`  
   Bu adres = **sizin backend’inizin canlı adresi**.

**Seçenek B – Render**

1. **https://render.com** adresine gidin.
2. **Get Started** → **GitHub** ile giriş yapın.
3. **New** → **Web Service** seçin.
4. TacticIQ reposunu bağlayın; **Root Directory** olarak **`backend`** yazın.
5. **Build Command:** `npm install`  
   **Start Command:** `npm start`
6. **Environment** kısmına aynı değişkenleri ekleyin (VALID_API_KEYS, SUPABASE_URL, vb.).
7. **Create Web Service** deyin; Render size bir URL verir (örn. `https://tacticiq-backend.onrender.com`).

**Bu adımı bitirdiğinizde:** Elinizde şöyle bir adres olacak: `https://....railway.app` veya `https://....onrender.com`. Buna **backend URL** diyeceğiz. Bir sonraki adımda bunu Vercel’e yazacağız.

---

### ADIM 2 – Vercel’de site tarafına backend adresini tanıtmak

**Amaç:** Canlı sitenin (Vercel) admin panelinden bu backend’e bağlanmasını sağlamak.

1. **https://vercel.com** adresine gidin; giriş yapın.
2. **Dashboard** → TacticIQ **website** projesini açın.
3. Üstten **Settings** sekmesine girin.
4. Sol menüden **Environment Variables** bölümüne girin.
5. **Add New** (veya **Add**) tıklayın.
6. **İlk değişken:**
   - **Name:** `VITE_BACKEND_URL`
   - **Value:** Adım 1’de aldığınız backend adresi (sonunda **/** olmasın).  
     Örnek: `https://tacticiq-backend.up.railway.app`
   - **Environment:** Production (ve isterseniz Preview) işaretleyin.
   - **Save** deyin.
7. **İkinci değişken:**
   - **Name:** `VITE_BACKEND_API_KEY`
   - **Value:** Backend’de kullandığınız `VALID_API_KEYS` ile **aynı** anahtar (örn. `tacticiq-admin-2024`).
   - **Environment:** Production (ve isterseniz Preview).
   - **Save** deyin.

Bu adım tamamsa canlı site, bir sonraki deploy’da backend’inizi tanıyacak.

---

### ADIM 3 – Siteyi yeniden yayınlamak (deploy)

**Amaç:** Vercel’in yeni ortam değişkenlerini kullanması için yeni bir deploy almak.

1. Hâlâ Vercel’de, aynı projede **Deployments** sekmesine gidin.
2. En üstteki (en son) deployment’ın sağındaki **üç nokta (⋯)** menüsüne tıklayın.
3. **Redeploy** seçin; onaylayın.
4. Birkaç dakika bekleyin; deploy “Ready” olunca canlı site güncel demektir.

Bu adımdan sonra: Canlı sitede admin panele girip **Sistem İzleme** bölümünde “Uzaktan backend kullanılıyor” mesajını görmelisiniz; Backend servisini oradan yeniden başlatabilirsiniz.

---

### ADIM 4 – Admin panele giriş (her gün kullanım)

**Amaç:** Admin panele nasıl gireceğinizi netleştirmek.

1. Tarayıcıda **https://www.tacticiq.app** (veya canlı sitenizin adresi) açın.
2. Sayfanın **en altına** (footer) inin.
3. **Admin** yazısına tıklayın.
4. **Şifre ile:** E-posta + şifre yazıp **Giriş Yap** deyin.  
   **E-posta linki ile:** **E-posta linki** sekmesine geçin, e-postanızı yazıp **Giriş linki gönder** deyin; e-postadaki linke tıklayın.

Giriş sonrası sağ üstte “Admin” ve “Çıkış” görünür; admin paneline erişirsiniz.

---

### ADIM 5 – (İsteğe bağlı) E-posta linki için Supabase ayarı

**Amaç:** “E-posta linki gönder” özelliğinin çalışması için Supabase’in site adresinizi tanıması.

1. **https://supabase.com** → Projenizi açın.
2. Sol menüden **Authentication** → **URL Configuration** bölümüne girin.
3. **Redirect URLs** listesine şunları ekleyin (zaten varsa atlayın):
   - `https://www.tacticiq.app`
   - `https://tacticiq.app`
4. **Save** deyin.

Bundan sonra “E-posta linki gönder” ile gelen link, doğru sayfaya yönlendirir.

---

## 3. NEREDE KALDIK? (Kontrol listesi)

Aşağıyı doldurarak nerede olduğunuzu takip edebilirsiniz:

- [ ] **Adım 0** – Backend yerelde çalışıyor; `/health` cevap veriyor.
- [ ] **Adım 1** – Backend Railway veya Render’a deploy edildi; URL aldım.
- [ ] **Adım 2** – Vercel’de `VITE_BACKEND_URL` ve `VITE_BACKEND_API_KEY` eklendi.
- [ ] **Adım 3** – Vercel’de Redeploy yapıldı.
- [ ] **Adım 4** – Admin panele giriş yapıldı (şifre veya e-posta linki).
- [ ] **Adım 5** – (İsteğe bağlı) Supabase Redirect URLs eklendi.

---

## 4. KISA ÖZET

| Soru | Cevap |
|------|--------|
| Website nerede çalışıyor? | Vercel’de (tacticiq.app). |
| Backend şu an nerede? | Sadece sizin bilgisayarınızda (localhost:3001). |
| Backend bulutta var mı? | Hayır; isterseniz Adım 1’de Railway/Render’a koyacağız. |
| Uzaktan servis kontrolü için ne lazım? | Backend’i buluta deploy (Adım 1) + Vercel’e URL ve API key (Adım 2–3). |
| Admin panele nasıl girerim? | Site footer → Admin → Şifre veya e-posta linki (Adım 4). |

Bu dosyayı açık tutup adımları sırayla yapalım; bir adımı bitirdiğinizde yazın, birlikte bir sonrakine geçelim.
