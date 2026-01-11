# 🔍 Backend Monitoring & Auto-Restart System

## Özellikler

1. **Otomatik Health Check**: Her 30 saniyede bir backend sağlığını kontrol eder
2. **Otomatik Restart**: Backend çökerse otomatik olarak yeniden başlatır
3. **Admin Bildirimleri**: Hata durumunda admin'e email gönderir
4. **Email Forwarding**: info@fanmanager.com'a gelen tüm mailler etemduzok@gmail.com'a iletilir

## Kurulum

### 1. Environment Variables

`.env` dosyasına ekleyin:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@fanmanager.com
SMTP_PASS=your-app-specific-password
ADMIN_EMAIL=etemduzok@gmail.com
```

### 2. Gmail App-Specific Password

1. Google Account'a gidin: https://myaccount.google.com/
2. Security > 2-Step Verification'ı aktif edin
3. App Passwords bölümüne gidin
4. "Mail" seçin ve "Fan Manager Backend" yazın
5. Oluşturulan şifreyi `SMTP_PASS` olarak ekleyin

### 3. Backend'i Başlatın

```bash
cd backend
npm run dev
```

Monitoring servisi otomatik olarak başlayacaktır.

## Monitoring Özellikleri

### Health Check
- **Interval**: 30 saniye
- **Endpoint**: `http://localhost:3000/health`
- **Timeout**: 5 saniye

### Auto-Restart
- **Max Attempts**: 5
- **Cooldown**: 1 dakika
- **Restart Delay**: 2 saniye

### Email Alerts
- **Recipient**: etemduzok@gmail.com
- **Subject**: 🚨 Fan Manager Backend - Critical Alert
- **Content**: Hata detayları, restart talimatları, servis durumu

## Email Forwarding

### Webhook Endpoint

```
POST /api/email/webhook
```

Email servisi sağlayıcınızdan (SendGrid, Mailgun, vb.) webhook almak için bu endpoint'i kullanın.

### Test Forwarding

```bash
curl -X POST http://localhost:3000/api/email/test-forward
```

## Email Service Provider Kurulumu

### SendGrid

1. SendGrid hesabı oluşturun
2. Inbound Parse Webhook ayarlayın:
   - URL: `https://your-domain.com/api/email/webhook`
   - Domain: `fanmanager.com`
   - Forward to: `info@fanmanager.com`

### Mailgun

1. Mailgun hesabı oluşturun
2. Routes ayarlayın:
   - Match: `info@fanmanager.com`
   - Action: Forward to webhook
   - URL: `https://your-domain.com/api/email/webhook`

## Log'lar

Monitoring log'ları console'da görüntülenir:

```
🔍 Starting backend monitoring service...
✅ Monitoring started (checking every 30 seconds)
✅ Backend health check OK: { status: 'ok', ... }
❌ Backend health check failed: ...
🔄 Attempting to restart backend (Attempt 1/5)...
✅ Admin alert email sent
```

## Sorun Giderme

### Monitoring Başlamıyor

1. `.env` dosyasını kontrol edin
2. Email ayarlarının doğru olduğundan emin olun
3. Console log'larını kontrol edin

### Email Gönderilmiyor

1. SMTP ayarlarını kontrol edin
2. App-specific password'un doğru olduğundan emin olun
3. Gmail'in "Less secure app access" ayarını kontrol edin (artık gerekli değil, app password kullanın)

### Restart Çalışmıyor

1. Port 3000'in başka bir process tarafından kullanılmadığından emin olun
2. Backend'in `npm run dev` ile başlatılabildiğinden emin olun
3. Log'ları kontrol edin

## Production Notları

1. **PM2 Kullanın**: Production'da PM2 ile process management yapın
2. **Log Rotation**: Log dosyalarını düzenli olarak temizleyin
3. **Email Rate Limiting**: Spam önleme için email gönderim limitleri ekleyin
4. **Monitoring Dashboard**: Grafana veya benzeri bir monitoring dashboard kullanın

## Güvenlik

- `.env` dosyasını Git'e commitlemeyin
- App-specific password kullanın (normal şifre değil)
- Webhook endpoint'ine authentication ekleyin
- Rate limiting ekleyin

---

**Not**: Bu sistem development ortamında test edilmiştir. Production'da ek güvenlik önlemleri alınmalıdır.
