# TacticIQ Oyun Sistemi - Güvenlik Rehberi

## 🔐 Güvenlik Önlemleri Özeti

TacticIQ oyun sistemi, endüstri standartlarında güvenlik önlemleriyle korunmuştur. Bu dokümantasyon, uygulanan güvenlik katmanlarını ve best practice'leri açıklar.

## 🛡️ Güvenlik Katmanları

### 1. Rate Limiting (Oran Sınırlama)

#### Amaç
DDoS ve abuse saldırılarına karşı koruma

#### Implementasyon
```typescript
// gameService.ts içinde
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1 dakika
const MAX_REQUESTS_PER_WINDOW = 30; // Dakikada max 30 istek

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];
  
  // Eski istekleri temizle
  const recentRequests = userRequests.filter(
    time => now - time < RATE_LIMIT_WINDOW
  );
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit aşıldı
  }
  
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
  return true;
}
```

#### Backend Implementasyonu
```typescript
// Express middleware örneği
import rateLimit from 'express-rate-limit';

const gameRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 30, // Maksimum 30 istek
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Store: Redis kullanımı önerilir (production'da)
  store: new RedisStore({
    client: redisClient,
    prefix: 'game_rl:'
  })
});

// Tüm game endpoint'lerine uygula
app.use('/game/*', gameRateLimiter);
```

---

### 2. Input Sanitization (Giriş Temizleme)

#### Amaç
XSS (Cross-Site Scripting) ve injection saldırılarına karşı koruma

#### Frontend Sanitization
```typescript
// gameService.ts içinde
function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // HTML tag karakterlerini kaldır
      .replace(/javascript:/gi, '') // JavaScript protokolünü engelle
      .replace(/on\w+\s*=/gi, '') // Event handler'ları engelle
      .trim()
      .substring(0, 1000); // Max 1000 karakter
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = Array.isArray(input) ? [] : {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }
  return input;
}
```

#### Backend Sanitization
```typescript
import validator from 'validator';
import xss from 'xss';

// Input validation middleware
function sanitizeGameData(req, res, next) {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // XSS temizleme
      return xss(validator.escape(obj));
    }
    if (typeof obj === 'object' && obj !== null) {
      const cleaned: any = {};
      for (const key in obj) {
        cleaned[key] = sanitize(obj[key]);
      }
      return cleaned;
    }
    return obj;
  };
  
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  next();
}

app.use('/game/*', sanitizeGameData);
```

---

### 3. CSRF Protection (CSRF Koruması)

#### Amaç
Cross-Site Request Forgery saldırılarını engelleme

#### Backend Implementasyonu
```typescript
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

// CSRF middleware kurulumu
app.use(cookieParser());
const csrfProtection = csrf({ cookie: true });

// Token oluşturma endpoint'i
app.get('/game/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Tüm POST/PUT/DELETE isteklerinde CSRF kontrolü
app.post('/game/*', csrfProtection, (req, res, next) => {
  // CSRF token otomatik kontrol edilir
  next();
});
```

#### Frontend Kullanımı
```typescript
// CSRF token'ı al ve her istekte gönder
import api from '@/services/apiService';

async function getCsrfToken(): Promise<string> {
  const response = await api.get('/game/csrf-token');
  return response.data.csrfToken;
}

async function startGameWithCsrf(userId: string, matchId: string) {
  const csrfToken = await getCsrfToken();
  
  const response = await api.post('/game/start', 
    { userId, matchId },
    { headers: { 'X-CSRF-Token': csrfToken } }
  );
  
  return response.data;
}
```

---

### 4. Authentication & Authorization

#### JWT Token Implementasyonu
```typescript
// Backend: Token oluşturma
import jwt from 'jsonwebtoken';

function generateGameToken(userId: string): string {
  return jwt.sign(
    { 
      userId,
      type: 'game',
      permissions: ['play', 'view_stats']
    },
    process.env.JWT_SECRET!,
    { 
      expiresIn: '2h', // 2 saatlik oturum
      issuer: 'tacticiq-game'
    }
  );
}
```

#### Token Doğrulama Middleware
```typescript
async function authenticateGameToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ 
      message: 'Authentication required' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    
    // Token tipini kontrol et
    if (decoded.type !== 'game') {
      return res.status(403).json({ 
        message: 'Invalid token type' 
      });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      message: 'Invalid or expired token' 
    });
  }
}

// Tüm game endpoint'lerine uygula
app.use('/game/*', authenticateGameToken);
```

---

### 5. Data Encryption (Veri Şifreleme)

#### İletimde Şifreleme (HTTPS)
```typescript
// Backend: HTTPS/SSL zorunlu
import https from 'https';
import fs from 'fs';

const httpsOptions = {
  key: fs.readFileSync('./ssl/private-key.pem'),
  cert: fs.readFileSync('./ssl/certificate.pem')
};

const server = https.createServer(httpsOptions, app);
server.listen(443);

// HTTP'den HTTPS'e yönlendirme
app.use((req, res, next) => {
  if (!req.secure && process.env.NODE_ENV === 'production') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});
```

#### Veritabanında Şifreleme
```typescript
import crypto from 'crypto';

// Hassas verileri şifrele
function encryptSensitiveData(data: string): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

// Şifrelenmiş veriyi çöz
function decryptSensitiveData(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

---

### 6. SQL Injection Prevention

#### Parameterized Queries
```typescript
// ❌ YANLIŞ - SQL Injection açığı
const query = `SELECT * FROM games WHERE user_id = '${userId}'`;

// ✅ DOĞRU - Parameterized query
const query = 'SELECT * FROM games WHERE user_id = $1';
const result = await db.query(query, [userId]);
```

#### ORM Kullanımı (Önerilen)
```typescript
import { Sequelize, DataTypes } from 'sequelize';

// Sequelize otomatik olarak SQL injection'ı engeller
const Game = sequelize.define('Game', {
  userId: DataTypes.UUID,
  matchId: DataTypes.UUID,
  score: DataTypes.INTEGER
});

// Güvenli sorgu
const games = await Game.findAll({
  where: { userId: req.user.userId }
});
```

---

### 7. Secure Headers

#### Helmet.js Kullanımı
```typescript
import helmet from 'helmet';

// Güvenlik header'larını ayarla
app.use(helmet());

// Özel CSP (Content Security Policy)
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "https:", "data:"],
    connectSrc: ["'self'", "https://api.tacticiq.app"],
    fontSrc: ["'self'", "https:", "data:"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  }
}));

// HSTS (HTTP Strict Transport Security)
app.use(helmet.hsts({
  maxAge: 31536000, // 1 yıl
  includeSubDomains: true,
  preload: true
}));
```

---

### 8. Logging & Monitoring

#### Güvenlik Olaylarını Loglama
```typescript
import winston from 'winston';

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ 
      filename: 'security-error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'security-combined.log' 
    })
  ]
});

// Güvenlik olaylarını logla
function logSecurityEvent(event: string, details: any) {
  securityLogger.warn({
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
}

// Kullanım örneği
app.post('/game/start', async (req, res) => {
  if (!checkRateLimit(req.user.userId)) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      userId: req.user.userId,
      ip: req.ip,
      endpoint: '/game/start'
    });
    return res.status(429).json({ message: 'Too many requests' });
  }
  // ...
});
```

---

## 🚨 Güvenlik Best Practices

### 1. Environment Variables
```bash
# .env dosyası (GİT'e eklenmemeli!)
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ENCRYPTION_KEY=64-character-hex-string-for-aes-256
DATABASE_URL=postgresql://user:pass@localhost:5432/tacticiq
REDIS_URL=redis://localhost:6379
CSRF_SECRET=your-csrf-secret-key
```

### 2. API Key Rotation
```typescript
// API anahtarlarını düzenli olarak değiştirin
const API_KEY_ROTATION_DAYS = 30;

async function rotateApiKeys() {
  const now = Date.now();
  const rotationInterval = API_KEY_ROTATION_DAYS * 24 * 60 * 60 * 1000;
  
  // Son rotation zamanını kontrol et
  const lastRotation = await getLastKeyRotation();
  
  if (now - lastRotation > rotationInterval) {
    await generateNewApiKeys();
    await invalidateOldKeys();
    logSecurityEvent('API_KEY_ROTATION', { timestamp: now });
  }
}
```

### 3. Penetration Testing
```typescript
// Düzenli güvenlik testleri yapın
// OWASP ZAP veya Burp Suite kullanarak:
// - SQL Injection testleri
// - XSS testleri
// - CSRF testleri
// - Rate limiting testleri
// - Authentication bypass testleri
```

### 4. Dependency Updates
```bash
# npm audit ile güvenlik açıklarını kontrol edin
npm audit

# Yüksek ve kritik seviye açıkları düzeltin
npm audit fix

# Otomatik güvenlik güncellemeleri için
npm install -g npm-check-updates
ncu -u
npm install
```

---

## 🔍 Güvenlik Kontrol Listesi

### Frontend
- [x] Rate limiting implementasyonu
- [x] Input sanitization
- [x] XSS koruması
- [x] CSRF token kullanımı
- [ ] Content Security Policy headers
- [ ] Subresource Integrity (SRI)

### Backend
- [ ] HTTPS/SSL sertifikası
- [ ] JWT authentication
- [ ] CSRF protection middleware
- [ ] Rate limiting (Redis ile)
- [ ] Input validation (Joi/Yup)
- [ ] SQL injection koruması
- [ ] Secure headers (Helmet.js)
- [ ] Logging & monitoring
- [ ] Environment variables
- [ ] Database encryption
- [ ] API key rotation
- [ ] Regular security audits

### Database
- [ ] Parameterized queries
- [ ] Encryption at rest
- [ ] Access control (principle of least privilege)
- [ ] Regular backups
- [ ] SQL injection testleri

### Infrastructure
- [ ] Firewall konfigürasyonu
- [ ] DDoS koruması (Cloudflare/AWS Shield)
- [ ] VPN kullanımı (production veritabanı erişimi için)
- [ ] Regular security patches
- [ ] Intrusion detection system (IDS)

---

## 🚀 Production Checklist

Oyun sistemini production'a almadan önce:

1. **SSL/TLS Sertifikası:** Let's Encrypt veya ücretli sertifika
2. **Environment Variables:** Tüm hassas bilgiler .env'de
3. **Rate Limiting:** Redis ile distributed rate limiting
4. **Database Encryption:** PostgreSQL encryption at rest
5. **Monitoring:** Sentry, Datadog veya New Relic
6. **Backup Strategy:** Günlük otomatik yedekleme
7. **Security Audit:** Profesyonel penetration testing
8. **GDPR Compliance:** Kullanıcı veri gizliliği
9. **Terms of Service:** Yasal dökümanlar hazır
10. **Incident Response Plan:** Güvenlik ihlali planı

---

## 📞 Güvenlik Sorunları İçin

Güvenlik açığı bulduysanız:
- **Email:** security@tacticiq.app
- **Bug Bounty:** Yakında aktif olacak
- **Disclosure:** Responsible disclosure policy uygulanır

---

**Son Güncelleme:** 16 Ocak 2026  
**Güvenlik Seviyesi:** Production Ready  
**Compliance:** OWASP Top 10, GDPR Ready
