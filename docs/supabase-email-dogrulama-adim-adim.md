# Supabase E-posta Doğrulama – Adım Adım (Sizin Yapacaklarınız)

Bu rehber, **sadece e-posta ile kayıt** olan kullanıcılar için doğrulama maili açmayı ve hangi mailden gideceğini adım adım anlatır. Google/Apple ile girişte doğrulama **gerekmez** (sağlayıcı zaten e-postayı doğrular).

---

## 1. Confirm email’i açın (link ile doğrulama)

1. **Supabase Dashboard**’a girin: https://supabase.com/dashboard  
2. Projenizi seçin (TacticIQ).  
3. Sol menüden **Authentication** → **Providers** tıklayın.  
4. **Email** satırına tıklayın (veya “Email” provider’ı açın).  
5. **“Confirm email”** anahtarını **Açık** (Enable) yapın.  
6. **Save** ile kaydedin.

Bundan sonra e-posta + şifre ile kayıt olan her kullanıcıya Supabase otomatik bir **doğrulama linki** gönderir. Kullanıcı bu linke tıklayana kadar oturum açamaz (“Email not confirmed” alır).  
**Not:** Varsayılan akış **link** ile çalışır (maildeki linke tıklama). 4 haneli kod isterseniz aşağıdaki “4 haneli kod” bölümüne bakın.

---

## 2. Doğrulama maili hangi adresten gider?

- **SMTP ayarı yapmazsanız:** Supabase’in kendi mail sunucusu kullanılır; gönderen adres Supabase’e aittir (örn. `noreply@mail.app.supabase.io` veya benzeri).  
- **Kendi SMTP’nizi eklerseniz:** Maili **sizin belirlediğiniz adres** (örn. `noreply@tacticiq.com`) gönderirsiniz.

**Tek yönlü (one-way) mail kullanımı:**  
Doğrulama ve bildirim mailleri için **noreply** adresi kullanmanız önerilir (örn. `noreply@tacticiq.com`). Böylece:
- Bu adrese **gelen maili okumanız gerekmez**; sadece **gönderen** tarafı kullanırsınız.  
- Gelen kutusunu takip etmeniz gerekmez; tek taraflı çalışır.

---

## 3. Kendi mail adresinizle göndermek (SMTP – isteğe bağlı)

Mailin “TacticIQ” / kendi domain’inizden gitmesini istiyorsanız:

1. Dashboard’da **Project Settings** (sol altta dişli).  
2. **Auth** sekmesi → **SMTP Settings** bölümü.  
3. **“Enable Custom SMTP”** işaretleyin.  
4. Bilgileri doldurun:
   - **Sender email:** Gönderen adres (örn. `noreply@tacticiq.com`).  
   - **Sender name:** Örn. `TacticIQ`.  
   - **Host / Port / User / Password:** Mail sağlayıcınızın SMTP bilgileri (SendGrid, Resend, Gmail vb. – `backend/EMAIL_SETUP.md` içinde örnekler var).

Kaydedince doğrulama mailleri bu adresten gider. Gelen kutusunu kullanmayacaksanız noreply kullanın; böylece mail trafiğini takip etmeniz gerekmez.

---

## 4. Doğrulama mailinin içeriği (şablon)

1. **Authentication** → **Email Templates** bölümüne gidin.  
2. **“Confirm signup”** şablonunu seçin.  
3. Burada:
   - **Subject:** Mail konusu (örn. “TacticIQ – E-postanızı doğrulayın”).  
   - **Body:** Metin ve `{{ .ConfirmationURL }}` – Supabase bu alanı doğrulama linki ile değiştirir.

İçeriği istediğiniz gibi düzenleyebilirsiniz; `{{ .ConfirmationURL }}` mutlaka kalmalı. Kaydedin.

---

## 5. Kim doğrulama görür?

- **Sadece e-posta ile kayıt:** Evet. Kayıt sonrası doğrulama maili gider; linke tıklanınca hesap doğrulanır.  
- **Google / Apple ile giriş/kayıt:** Hayır. Bu sağlayıcılar e-postayı zaten doğrular; Supabase’te ek “Confirm email” adımı gerekmez. Uygulama tarafında da sadece mail+şifre kayıt akışında doğrulama ekranı/mesajı kullanılıyor.

---

## 6. 4 haneli kod istenirse (opsiyonel)

Şu an Supabase’in **Confirm email** akışı **link** ile çalışır (maildeki linke tıklama).  
**4 (veya 6) haneli kod** ile doğrulama isterseniz:

- Supabase’te **Email OTP** (Magic Link / OTP) kullanılır; maile giden **tek seferlik kod** (genelde 6 haneli) ile giriş yapılır.  
- Bu, “kayıt → mail ile kod gelir → kullanıcı kodu girer” akışıdır; mevcut “Confirm email” (link) akışından farklıdır.  
- İsterseniz ileride ayrı bir görevde “e-posta ile kayıt = OTP ile doğrulama” olacak şekilde akışı değiştirebiliriz; şu an adım adım rehber **link ile doğrulama** içindir.

---

## 7. Yapılacaklar özeti (sizin yapacaklarınız)

| Sıra | Ne yapacaksınız |
|------|------------------|
| 1 | Supabase Dashboard → **Authentication** → **Providers** → **Email** → **Confirm email**’i **Açın**, Save. |
| 2 | (İsteğe bağlı) **Project Settings** → **Auth** → **SMTP** → Kendi SMTP’nizi ekleyin; **Sender email** olarak noreply kullanın (tek yönlü, takip gerekmez). |
| 3 | **Authentication** → **Email Templates** → **Confirm signup** şablonunda konu ve metni düzenleyin; `{{ .ConfirmationURL }}` kalsın. |
| 4 | Uygulama tarafı zaten hazır: mail ile kayıtta doğrulama gerekince “E-postanızı doğrulayın” mesajı gösteriliyor; Google/Apple’da bu adım yok. |

Bu adımlarla doğrulama maili belirlediğiniz adresten (veya Supabase varsayılanından) gidecek, sadece e-posta ile kayıt olanlar doğrulama görür; noreply kullanırsanız mail trafiğini takip etmeniz gerekmez.

---

## 8. (Opsiyonel) Nickname uygunluk fonksiyonu

Profil ekranında kullanıcı adı değişince yeşil tik / müsaitlik kontrolü için Supabase’te bir fonksiyon çalıştırmanız gerekir. Projede şu migration dosyası var:

- `supabase/migrations/20260307_check_nickname_available.sql`

Supabase Dashboard → **SQL Editor** → bu dosyanın içeriğini yapıştırıp **Run** deyin. Böylece `check_nickname_available` RPC’si oluşur ve uygulama nickname müsaitliğini anlık kontrol edebilir.
