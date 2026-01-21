# Email Servisi Kurulum Rehberi

## 📧 Email Adresi: info@tacticiq.com

### 1. Gmail ile SMTP Kurulumu

#### A. Gmail Hesabı Oluşturun
1. `info@tacticiq.com` için bir Gmail hesabı oluşturun (veya mevcut email sağlayıcınızı kullanın)

#### B. App-Specific Password Oluşturun (Gmail için)
1. Google Account'a gidin: https://myaccount.google.com/
2. Security > 2-Step Verification'ı aktif edin
3. App Passwords bölümüne gidin
4. "Mail" seçin ve "Other" diyerek "TacticIQ" yazın
5. Oluşturulan şifreyi kopyalayın (örn: `abcd efgh ijkl mnop`)

#### C. Backend .env Dosyasını Yapılandırın

```bash
# backend/.env dosyasını oluşturun ve aşağıdaki değerleri ekleyin:

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@tacticiq.com
SMTP_PASS=abcd efgh ijkl mnop  # App-specific password
APP_URL=http://localhost:8082   # Veya production URL
```

---

### 2. Alternatif: Özel Email Sunucusu

Eğer kendi domain email'iniz varsa (örn: cPanel, Plesk):

```env
SMTP_HOST=mail.tacticiq.com
SMTP_PORT=587
SMTP_USER=info@tacticiq.com
SMTP_PASS=your_email_password
APP_URL=https://tacticiq.com
```

---

### 3. Alternatif: SendGrid (Önerilen - Production için)

SendGrid ücretsiz 100 email/gün sunuyor:

1. SendGrid'e kaydolun: https://sendgrid.com/
2. API Key oluşturun
3. `.env` dosyasını güncelleyin:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxx  # SendGrid API Key
```

---

### 4. Alternatif: AWS SES (Production için)

AWS SES çok ucuz ve güvenilir:

```env
SMTP_HOST=email-smtp.eu-west-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=YOUR_AWS_SES_USERNAME
SMTP_PASS=YOUR_AWS_SES_PASSWORD
```

---

## 🧪 Test

Backend başlatıldıktan sonra test edin:

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

---

## 📨 Email Türleri

### 1. Şifre Sıfırlama
- **Endpoint:** `POST /api/auth/forgot-password`
- **Gönderen:** info@tacticiq.com
- **Süre:** 15 dakika geçerli

### 2. Hoş Geldin Maili
- **Endpoint:** `POST /api/auth/send-welcome`
- **Gönderen:** info@tacticiq.com
- **İçerik:** Uygulama özellikleri

---

## ⚠️ Önemli Notlar

1. **Gmail Limitleri:**
   - Günde 500 email (free account)
   - Günde 2,000 email (Google Workspace)

2. **Production İçin:**
   - SendGrid veya AWS SES kullanın
   - SPF, DKIM, DMARC kayıtlarını yapılandırın
   - Email bounce tracking ekleyin

3. **Güvenlik:**
   - `.env` dosyasını Git'e commitlemeyin
   - App-specific password kullanın
   - Rate limiting ekleyin (spam önleme)

---

## 🚀 Backend'i Yeniden Başlatın

```bash
cd backend
npm run dev
```

Email servisi hazır! ✅
