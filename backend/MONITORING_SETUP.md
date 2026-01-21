# 🔍 Backend Monitoring & Auto-Restart Kurulumu

## ✅ Tamamlanan Özellikler

1. ✅ **Otomatik Health Check** - Her 30 saniyede backend sağlığını kontrol eder
2. ✅ **Otomatik Restart** - Backend çökerse otomatik yeniden başlatır
3. ✅ **Admin Email Bildirimleri** - Hata durumunda etemduzok@gmail.com'a email gönderir
4. ✅ **Email Forwarding** - info@tacticiq.com'a gelen tüm mailler etemduzok@gmail.com'a iletilir

## 🚀 Hızlı Başlangıç

### 1. Environment Variables Ayarlayın

`backend/.env` dosyasını oluşturun veya düzenleyin:

```env
# Email Configuration (Zorunlu)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@tacticiq.com
SMTP_PASS=your-app-specific-password-here
ADMIN_EMAIL=etemduzok@gmail.com
```

### 2. Gmail App-Specific Password Oluşturun

1. https://myaccount.google.com/ → Security
2. 2-Step Verification'ı aktif edin
3. App Passwords → "Mail" → "TacticIQ Backend"
4. Oluşturulan şifreyi `SMTP_PASS` olarak ekleyin

### 3. Backend'i Başlatın

```bash
cd backend
npm run dev
```

Monitoring servisi otomatik olarak 10 saniye sonra başlayacaktır.

## 📧 Email Forwarding Kurulumu

### SendGrid ile (Önerilen)

1. SendGrid hesabı oluşturun
2. Inbound Parse Webhook ayarlayın:
   - **URL**: `https://your-domain.com/api/email/webhook`
   - **Domain**: `tacticiq.com`
   - **Forward to**: `info@tacticiq.com`

### Mailgun ile

1. Mailgun hesabı oluşturun
2. Routes → Create Route:
   - **Match**: `info@tacticiq.com`
   - **Action**: Forward to webhook
   - **URL**: `https://your-domain.com/api/email/webhook`

### Test Etme

```bash
curl -X POST http://localhost:3000/api/email/test-forward
```

## 🔧 Monitoring Ayarları

### Health Check
- **Interval**: 30 saniye
- **Endpoint**: `http://localhost:3000/health`
- **Timeout**: 5 saniye

### Auto-Restart
- **Max Attempts**: 5
- **Cooldown**: 1 dakika (ardışık restart'lar arası)
- **Restart Delay**: 2 saniye

### Email Alerts
- **Recipient**: etemduzok@gmail.com
- **Subject**: 🚨 TacticIQ Backend - Critical Alert
- **Content**: 
  - Hata detayları
  - Restart talimatları
  - Servis durumu
  - Log bilgileri

## 📋 Admin Email İçeriği

Admin'e gönderilen email şunları içerir:

1. **Hata Detayları**:
   - Timestamp
   - Hata mesajı
   - Restart deneme sayısı
   - Server bilgileri

2. **Yapılması Gerekenler**:
   - Backend'i başlatma komutu
   - Diğer servisleri kontrol etme
   - Log kontrolü

3. **Hızlı Linkler**:
   - Health check endpoint
   - Backend log dosyaları

## 🛠️ Sorun Giderme

### Monitoring Başlamıyor

1. `.env` dosyasını kontrol edin
2. `SMTP_PASS` değerinin doğru olduğundan emin olun
3. Console log'larını kontrol edin:
   ```
   🔍 Starting backend monitoring service...
   ✅ Monitoring started (checking every 30 seconds)
   ```

### Email Gönderilmiyor

1. Gmail App-Specific Password'un doğru olduğundan emin olun
2. 2-Step Verification'ın aktif olduğundan emin olun
3. SMTP ayarlarını test edin:
   ```bash
   node -e "require('./services/emailService').sendAdminEmail('Test', '<p>Test</p>', 'Test')"
   ```

### Restart Çalışmıyor

1. Port 3000'in başka bir process tarafından kullanılmadığından emin olun
2. Backend'in manuel olarak başlatılabildiğinden emin olun
3. Log'ları kontrol edin

## 📊 Monitoring Log'ları

Console'da şu log'ları göreceksiniz:

```
✅ Backend health check OK: { status: 'ok', ... }
❌ Backend health check failed: ...
🔄 Attempting to restart backend (Attempt 1/5)...
✅ Backend restart command executed
✅ Admin alert email sent
```

## 🔐 Güvenlik Notları

1. **`.env` dosyasını Git'e commitlemeyin**
2. **App-specific password kullanın** (normal şifre değil)
3. **Webhook endpoint'ine authentication ekleyin** (production için)
4. **Rate limiting ekleyin** (spam önleme)

## 📝 Production Önerileri

1. **PM2 Kullanın**: Process management için
   ```bash
   npm install -g pm2
   pm2 start server.js --name tacticiq-backend
   pm2 startup
   pm2 save
   ```

2. **Log Rotation**: Log dosyalarını düzenli temizleyin

3. **Monitoring Dashboard**: Grafana veya benzeri kullanın

4. **Email Rate Limiting**: Spam önleme için

## 🎯 Test Senaryoları

### 1. Backend'i Manuel Olarak Durdurun

```bash
# Backend'i durdurun (Ctrl+C veya process kill)
# 30 saniye içinde monitoring restart deneyecek
# Admin'e email gönderilecek
```

### 2. Health Check Endpoint'ini Kapatın

```bash
# server.js'de health endpoint'ini geçici olarak kapatın
# Monitoring hata tespit edecek ve restart deneyecek
```

### 3. Email Forwarding Test

```bash
curl -X POST http://localhost:3000/api/email/test-forward
# etemduzok@gmail.com'a test email gönderilecek
```

## ✅ Kurulum Kontrol Listesi

- [ ] `.env` dosyası oluşturuldu
- [ ] `SMTP_PASS` (Gmail app password) eklendi
- [ ] `ADMIN_EMAIL=etemduzok@gmail.com` ayarlandı
- [ ] Backend başlatıldı (`npm run dev`)
- [ ] Monitoring log'ları görünüyor
- [ ] Test email gönderildi ve alındı
- [ ] Email forwarding test edildi

---

**Not**: Bu sistem development ortamında test edilmiştir. Production'da ek güvenlik önlemleri alınmalıdır.

**Sorular için**: etemduzok@gmail.com
