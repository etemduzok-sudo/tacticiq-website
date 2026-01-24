# Backend Sorun Giderme Rehberi

## Backend Neden Duruyor?

Backend'in durmasının olası nedenleri:

### 1. **Uncaught Exception (Yakalanmamış Hata)**
- Backend'de bir hata oluştuğunda `process.exit(1)` çağrılıyordu
- **Çözüm:** Artık backend hata durumunda da çalışmaya devam ediyor
- Watchdog script backend'i otomatik olarak yeniden başlatacak

### 2. **Port Çakışması**
- Port 3001 başka bir uygulama tarafından kullanılıyor olabilir
- **Çözüm:** 
  ```powershell
  netstat -ano | findstr :3001
  # PID'yi bul ve kapat:
  taskkill /F /PID <PID_NUMARASI>
  ```

### 3. **Node Modules Eksik**
- `node_modules` klasörü eksik veya bozuk
- **Çözüm:**
  ```powershell
  cd backend
  npm install
  ```

### 4. **.env Dosyası Eksik**
- Backend `.env` dosyasına ihtiyaç duyuyor
- **Çözüm:** `.env.example` dosyasını kopyalayıp `.env` oluşturun

### 5. **Database Bağlantı Hatası**
- Supabase veya PostgreSQL bağlantısı başarısız
- **Çözüm:** `.env` dosyasındaki `DATABASE_URL` veya `SUPABASE_DB_URL` değerlerini kontrol edin

## Backend'i Watchdog ile Başlatma

Backend'in otomatik olarak yeniden başlatılması için watchdog kullanın:

### Windows:
```batch
start-backend-watchdog.bat
```

### PowerShell:
```powershell
cd backend
.\watchdog-backend.ps1
```

Watchdog:
- Her 5 saniyede bir backend'in çalışıp çalışmadığını kontrol eder
- Backend durduğunda otomatik olarak yeniden başlatır
- Health endpoint'i (`/health`) ile backend'i test eder

## Backend'i Manuel Başlatma

```powershell
cd backend
npm run dev
```

## Backend Durumunu Kontrol Etme

### Health Check:
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/health"
```

### Port Kontrolü:
```powershell
Get-NetTCPConnection -LocalPort 3001
```

## Log Dosyaları

Backend logları console'da görüntülenir. Hata durumunda:
- `❌ UNCAUGHT EXCEPTION` - Kritik hata (artık backend durmuyor)
- `❌ UNHANDLED REJECTION` - Promise hatası (backend çalışmaya devam ediyor)

## Önerilen Çözüm

**En iyi çözüm:** Watchdog script'i kullanın:
```batch
start-backend-watchdog.bat
```

Bu script backend'i sürekli izler ve durduğunda otomatik olarak yeniden başlatır.
