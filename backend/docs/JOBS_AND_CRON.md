# Günlük Job'lar ve Otomasyon

## İlk kurulum (bir kez)

1. **Topluluk rating tablosu:** Supabase SQL Editor'da `backend/database/create_player_community_ratings.sql` çalıştırın. Tablo yoksa topluluk oyları kaydedilmez; gösterim her zaman sadece API rating olur.
2. **Coach / renkler / kadrolar:** Önce DB'yi %100 tamamlayın (aşağıda "İlk tam doldurma"), sonra günde bir rutin için `run-daily-jobs.js` zamanlayın.

---

## 1. Coach + Renkler + Kadrolar

### İlk tam doldurma (DB %100 – bir kez)

```bash
cd backend
node scripts/update-coach-colors-squads.js --all --delay=500
```

Tüm eksik coach, renk ve 2025 kadro doldurulur (~20–60 dk). **Windows:** `scripts\run-complete-coach-colors-squads.bat`

### Rutin günlük (her gün)

**Script:** `scripts/run-daily-jobs.js`  
Bu script `update-coach-colors-squads.js` çalıştırır (max 1500 takım, 600ms aralık). API kotasının geri kalanı rating script’i için bırakılır.

```bash
cd backend
node scripts/run-daily-jobs.js
```

**Windows:** `scripts/run-daily-jobs.bat` çalıştırın (başlangıç klasörü backend).

### Cron (Linux/macOS) – her gün 03:00

```bash
0 3 * * * cd /path/to/TacticIQ/backend && node scripts/run-daily-jobs.js
```

### Windows Task Scheduler

1. Görev Zamanlayıcı → Temel görev oluştur.
2. Tetikleyici: Günlük, saat 03:00.
3. Eylem: Program başlat → Program: `node`, Bağımsız değişkenler: `scripts/run-daily-jobs.js`, Başlangıç konumu: `C:\TacticIQ\backend`. Alternatif: Eylem olarak `scripts\run-daily-jobs.bat` çalıştır, Başlangıç: `C:\TacticIQ\backend`.

---

## 2. Topluluk rating (otomatik, ek job yok)

- **Şimdilik gösterim:** Sadece API’den gelen rating gösteriliyor. Topluluk oyu toplamıyorsanız tüm oyuncular API rating ile görünür.
- **Otomatik geçiş:** Bir oyuncu için **en az 2 topluluk oyu** (n ≥ 2) oluşunca sistem **otomatik** olarak blend kullanır; ekstra job veya ayar gerekmez.  
  **Formül:** `R = (10 * R_api + n * R_user_avg) / (10 + n)`  
  n < 2 ise gösterilen = sadece R_api.
- **Oy toplamak:** Giriş yapan kullanıcı `POST /api/players/:playerId/rate` ile oy verir (body: `{ "rating": 1-100 }`). Kayıt `player_community_ratings` tablosuna yazılır. Maç/kadro cevaplarında `getDisplayRatingsMap` zaten bu tabloyu okuyup n ≥ 2 ise blend’i uygular.
- **Tablo:** Yukarıdaki “İlk kurulum”da `create_player_community_ratings.sql` çalıştırıldıysa hazırsınızdır.

---

## 3. DB güncelleme raporu (5 dakika)

**Script:** `scripts/db-status-report-every-5min.js`  
Supabase istatistiklerini (takım sayısı, coach/renk/kadro/rating yüzdeleri) alır, önceki raporla karşılaştırır; çıktıyı konsola ve `backend/data/db-status-report.txt` dosyasına ekler. Son 100 blok (~8 saat) tutulur.

### Çalıştırma

```bash
cd backend
node scripts/db-status-report-every-5min.js
```

Sürekli çalışır (5 dakikada bir rapor yazar). Durdurmak için Ctrl+C.

### İsteğe bağlı: pm2 ile arka planda

```bash
cd backend
pm2 start scripts/db-status-report-every-5min.js --name tacticiq-db-report
```

---

## 4. Özet

| Ne | Nasıl |
|----|--------|
| Coach / renkler / kadrolar | `run-daily-jobs.js` günde bir (cron veya Task Scheduler). |
| Rating gösterimi | Sadece API; n ≥ 2 topluluk oyu olan oyuncuda sistem **otomatik** blend: `(10*R_api + n*avg)/(10+n)`. |
| Topluluk oyu toplamak | `POST /api/players/:id/rate` (auth gerekli). Belirli sayıda oy oluşunca blend otomatik devreye girer. |
| DB raporu (5 dk) | `db-status-report-every-5min.js` (isteğe bağlı, pm2 ile sürekli). |
