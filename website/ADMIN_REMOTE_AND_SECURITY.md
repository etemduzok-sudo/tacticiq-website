# Admin: Uzaktan Servis Kontrolü ve Güvenlik

Bu dokümanda **uzaktan servis kontrolü** (Vercel’den backend’e bağlanma) ve **admin giriş güvenliği** (2FA, e-posta doğrulama, ayrı subdomain) adımları özetlenir.

---

## 1. Uzaktan Servis Kontrolü

Canlı sitede (Vercel) admin panelinden backend’i yeniden başlatmak veya durumunu görmek için backend’i internete açık bir adreste çalıştırmanız ve site tarafında bu adresi tanımlamanız gerekir.

### 1.1 Backend’i Buluta Deploy Etme

- **Railway / Render / Fly.io** gibi bir platformda backend’i deploy edin.
- Örnek: `https://api.tacticiq.app` veya `https://your-app.onrender.com`.
- Backend’in `.env` dosyasında `VALID_API_KEYS` tanımlı olsun (ör. `VALID_API_KEYS=your-secret-key-123`).

### 1.2 Vercel Ortam Değişkenleri

Vercel projesinde (Website) şu değişkenleri ekleyin:

| Değişken | Açıklama | Örnek |
|----------|----------|--------|
| `VITE_BACKEND_URL` | Uzak backend adresi (sonunda `/` olmasın) | `https://api.tacticiq.app` |
| `VITE_BACKEND_API_KEY` | Backend’deki `VALID_API_KEYS` ile aynı değer | `your-secret-key-123` |

Deploy sonrası admin panelinde “Sistem İzleme” bölümü bu URL üzerinden backend’e istek atar; uzaktan sadece **Backend** servisi yeniden başlatılabilir (Expo/Website yerel ortamda kalır).

### 1.3 Yerel Kullanım

- Bilgisayarınızda `website` için `npm run dev`, `backend` için `npm start` çalıştırın.
- Admin paneli `http://localhost:5173` üzerinden açıldığında servis kontrolü otomatik olarak `http://localhost:3001` kullanır; ekstra ortam değişkeni gerekmez.

---

## 2. Admin Giriş Güvenliği

### 2.1 İki Adımlı Doğrulama (2FA)

- **Supabase Dashboard** → Authentication → Providers → (Email/Google vs.)  
  MFA (Multi-Factor Authentication) açılabilir.
- Kullanıcılar hesap ayarlarından TOTP (Google Authenticator vb.) ekleyebilir.
- İsteğe bağlı: Admin paneli route’unda (`/admin` veya admin sayfası) sadece MFA tamamlanmış kullanıcılara erişim verilebilir (Supabase `user.factors` veya MFA tamamlanma durumu kontrol edilir).

### 2.2 Admin Giriş Bildirim E-postası

- Admin olarak giriş yapıldığında “Admin girişi – IP, tarih” e-postası göndermek için:
  - **Seçenek A:** Backend’e `POST /api/admin/login-notify` gibi bir endpoint ekleyin; admin girişi başarılı olduktan sonra frontend bu endpoint’i çağırsın (API key veya admin token ile).
  - **Seçenek B:** Supabase **Edge Function** veya **Database Trigger** ile `auth.users` / giriş log’una göre admin e-posta adresine bildirim gönderin.

Bu özellik şu an kodda yok; eklenmesi için backend veya Supabase tarafında küçük bir geliştirme gerekir.

### 2.3 Ayrı Admin Subdomain (admin.tacticiq.app)

- **Yöntem 1 – Aynı Vercel projesi:**  
  Vercel’de `admin.tacticiq.app` (veya `www.tacticiq.app_admin` yerine standart `admin.tacticiq.app`) domain alias olarak eklenir. Aynı build çalışır; farklı domain sadece erişim/akılda kalır. İsteğe bağlı: Middleware ile sadece `admin.tacticiq.app` host’unda `/admin` route’una izin verip diğer host’larda 404 verebilirsiniz.
- **Yöntem 2 – Ayrı proje:**  
  Sadece admin arayüzünü içeren ayrı bir Vercel projesi açıp `admin.tacticiq.app`’i oraya bağlayabilirsiniz; aynı Supabase ve backend API kullanılır.

Güvenlik: Admin sayfası zaten giriş (ve isteğe bağlı 2FA) ile korunuyor; subdomain sadece “admin trafiğini” ayırmak ve isteğe bağlı ek kontroller için kullanılır.

---

## Özet

| Konu | Ne yapılır |
|------|------------|
| **Uzaktan servis kontrolü** | Backend’i Railway/Render vb. deploy edin; Vercel’de `VITE_BACKEND_URL` ve `VITE_BACKEND_API_KEY` tanımlayın. |
| **2FA** | Supabase MFA’yı açın; isteğe bağlı olarak admin route’unda MFA tamamlanmış mı kontrol edin. |
| **Giriş e-postası** | Backend veya Edge Function ile “admin girişi” bildirimi ekleyin. |
| **Ayrı subdomain** | `admin.tacticiq.app` için Vercel’de domain alias (veya ayrı proje) kullanın. |

Bu adımlar tamamlandığında, canlı siteden uzaktan backend durumu görülebilir ve (desteklenen servisler için) yeniden başlatma yapılabilir; admin girişi de 2FA ve isteğe bağlı bildirimle güçlendirilmiş olur.
