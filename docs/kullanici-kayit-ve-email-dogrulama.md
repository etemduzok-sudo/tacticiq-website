# Kullanıcı Kayıt, Ad/Soyad, Nickname ve E-posta Doğrulama

## 1. Ad / Soyad zorunlu olmalı mı?

**Öneri: Hayır, zorunlu tutmayın.**

- **Sohbet modülü:** Sohbet için görünen ad yeterli; bu da **nickname** (kullanıcı adı) veya e-posta ön eki ile zaten sağlanıyor. Gerçek ad/soyad sohbet için şart değil.
- **Doğru iletişim:** Asıl ihtiyacınız **geçerli ve doğrulanmış e-posta**. Kayıt sonrası “e-posta doğrulama” açarsanız, mail adresi doğruluğu onay maili ile garanti altına alınır.
- **Veritabanı:** Şu an `user_profiles` içinde tek metin alanı **`name`** (tam ad). Ad/soyad ayrı kolon yok; uygulama tarafında `firstName` + `lastName` birleştirilip `name` olarak kaydediliyor. Ad/soyadı **opsiyonel** bırakıp sadece **e-posta + nickname** zorunlu tutmanız yeterli.

---

## 2. Nickname (kullanıcı adı) – varsayılan ve saklama

- **Varsayılan:** Evet, nickname **ön tanımlı olarak e-postanın @ işaretinden önceki kısmı** (örn. `etemduzok@gmail.com` → `etemduzok`). Kod: `email.split('@')[0]`.
- **Değiştirme:** Kullanıcı isterse **değiştirebiliyor**; sadece harf, rakam ve alt çizgi, en az 3 karakter, **benzersiz** olmalı.
- **Uygunluk kontrolü:** Profil ekranında nickname değiştirilirken **anlık müsaitlik kontrolü** yapılır; müsaitse **yeşil tik** ✅, alınmışsa **kırmızı çarpı** ❌ gösterilir. Kaydetme sadece müsait nickname ile yapılır.
- **Aynı prefix, farklı domain (örn. user1@gmail vs user1@hotmail):** Nickname veritabanında **tekil** (unique). İkinci kullanıcı aynı prefix ile geldiğinde varsayılan atama yapılırken **müsaitlik kontrolü** çalışır; prefix alınmışsa otomatik olarak **TacticIQxxxx** gibi alternatif atanır.
- **Nerede tutuluyor:**
  - **Supabase:** `user_profiles.nickname` (unique), `user_profiles.name` (tam ad / birleşik ad-soyad).
  - **Eski tablo:** `users.username` (eski schema; yeni akışta `user_profiles` kullanılıyor).
- **Sohbet:** Sohbet modülünde “görünen ad” için `nickname` veya `name` kullanılabilir; ikisi de kayıtlı.

---

## 3. E-posta doğrulama – mevcut durum ve seçenekler

### 3.1 Şu an ne var?

- **Supabase Auth:** Kayıt `supabase.auth.signUp({ email, password })` ile yapılıyor. E-posta doğrulama **Supabase Dashboard** ayarına bağlı (Authentication → Providers → Email → **Confirm email**).
- **Backend (Node):** `backend/services/emailService.js` (nodemailer) var; **şifre sıfırlama**, **hoş geldin**, **admin bildirimi** gibi mailler için kullanılıyor. Kayıt (signUp) akışı ise doğrudan **Supabase Auth** üzerinden; yani “kayıt onay maili” için ya Supabase’in gönderdiği mail ya da Supabase’e bağlanan SMTP kullanılır.

### 3.2 “Doğru mail” = onay maili ile doğrulama

- Mail ile kayıt yapanlara **onay maili** göndermek istiyorsanız:
  - **En pratik yol:** Supabase’te **Confirm email**’i açmak. Supabase varsayılan mailleriyle veya kendi SMTP’nizle (Resend, SendGrid, Gmail vb.) bu maili gönderebilir.
  - **Alternatif:** Kendi backend’inizde kayıt sonrası “doğrulama linki” üretip `emailService` ile göndermek; bu durumda Supabase’te custom token/link mantığını siz yönetirsiniz (daha fazla iş).

---

## 4. E-posta altyapısı – nasıl kuralım?

### Seçenek A: Supabase ile (önerilen, hızlı)

1. **Supabase Dashboard** → **Authentication** → **Providers** → **Email**  
   - **Confirm email** → Açın.
2. (İsteğe bağlı) Kendi domain/SMTP’nizi kullanmak için:  
   **Project Settings** → **Auth** → **SMTP Settings**  
   - Custom SMTP gir (SendGrid, Resend, Gmail app password vb.).  
   - Ayrıntılar: [Supabase Auth – Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
3. Mobil/web tarafında:
   - `signUp` sonrası oturum yoksa (Supabase confirmation açıksa session başta null gelir) kullanıcıya:  
     *“E-postanıza gelen doğrulama linkine tıklayın; ardından giriş yapabilirsiniz.”*  
   - Girişte “Email not confirmed” hatası gelirse aynı mesajı gösterin.

Bu yapı ile **ek bir mail sunucusu kodlamanıza gerek kalmaz**; sadece Dashboard + isteğe bağlı SMTP yeterli.

### Seçenek B: Backend (nodemailer) ile özel doğrulama

- Zaten var: `backend/services/emailService.js`, `backend/EMAIL_SETUP.md`.
- İsterseniz kayıt sonrası **kendi** doğrulama linkinizi üretip bu servisle gönderebilirsiniz; ancak:
  - Doğrulama token’ını saklamak (DB veya Redis),
  - Link tıklanınca Supabase’te kullanıcıyı “confirmed” yapmak veya kendi auth mantığınızı kullanmak gerekir.
- Genelde **Seçenek A** daha az iş ve daha güvenli.

### Özet tablo

| Konu | Durum / Öneri |
|------|----------------|
| Ad/soyad zorunlu mu? | Hayır; sohbet için doğru mail + nickname yeterli. |
| Nickname varsayılanı | E-postanın @ öncesi; kullanıcı değiştirebiliyor. |
| Nickname / ad nerede? | `user_profiles.nickname`, `user_profiles.name`. |
| Mail doğrulama | Supabase “Confirm email” + (opsiyonel) Custom SMTP. |
| Mail altyapısı | Supabase Auth + SMTP ayarı ile kurulabilir; backend emailService ek doğrulama için kullanılabilir. |

---

## 5. Hızlı uygulama adımları (Supabase e-posta doğrulama)

1. Supabase Dashboard → **Auth** → **Providers** → **Email** → **Confirm email** aç.
2. (İsteğe bağlı) **Project Settings** → **Auth** → **SMTP** ile kendi SMTP’nizi ekleyin (Resend/SendGrid önerilir).
3. Mobil `authService.signUp` sonrası: `data.session === null` ise kullanıcıya “E-postanızı doğrulayın” mesajı göster.
4. Girişte `Email not confirmed` hatası için aynı bilgi mesajını göster; web tarafında benzer mesaj zaten var, mobilde de aynı mantık eklenebilir.

**Dashboard'da sizin yapacaklarınız** için ayrı rehber: **[Supabase E-posta Doğrulama – Adım Adım](supabase-email-dogrulama-adim-adim.md)**. Uygulama tarafı hazır; bu adımlarla mail ile kayıt + doğrulama altyapısı kurulmuş olur; ad/soyad opsiyonel kalabilir.
