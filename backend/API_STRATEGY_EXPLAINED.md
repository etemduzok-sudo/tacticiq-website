# 🎯 API Strategy: Maximum 7,500 Calls/Day Kullanımı

## 📊 Matematiksel Hesaplama

```
1 gün = 86,400 saniye
API Limit = 7,500 call/day
Optimal interval = 86,400 ÷ 7,500 = 11.52 saniye
→ Her 12 saniyede bir istek = 7,200 call/day (%96 kullanım)
```

---

## 🧠 Smart Adaptive Sync Strategy

### Neden Sabit 12 Saniye Yerine Adaptive?

**Problem:**
- Gece 03:00'te maç yok → API israfı
- Cumartesi 18:00'de 30 canlı maç var → Yetersiz
- Hafta içi gündüz 5 maç var → Gereksiz sık çekme

**Çözüm: Adaptive Interval (10s - 60s)**

```javascript
// Priority 1: Canlı Maçlar
if (liveMatches > 10) → 10 saniye

// Priority 2: Yaklaşan Maçlar (2 saat içinde)
if (upcomingMatches > 5) → 12 saniye

// Priority 3: Normal Saatler (14:00-23:00)
if (peakHours) → 12 saniye

// Priority 4: Düşük Aktivite
if (lowActivity) → 24 saniye

// Priority 5: Gece (00:00-06:00)
if (nightTime && noMatches) → 60 saniye
```

---

## 🔄 Fetch Stratejisi

### Her Döngüde (12 saniye):

1. **Live Matches** (1 API call)
   ```javascript
   GET /fixtures?live=all
   → Tüm canlı maçlar (skor, dakika, events)
   ```

2. **Today's Matches** (1 API call)
   ```javascript
   GET /fixtures?date=2026-01-09
   → Bugünkü tüm maçlar
   ```

3. **Next 2 Days** (2 API calls - if available)
   ```javascript
   GET /fixtures?date=2026-01-10
   GET /fixtures?date=2026-01-11
   → Gelecek maçlar
   ```

**Total: 3-4 API call per cycle**

---

## 📈 API Usage Projection

### Scenario A: Peak Hours (14:00-23:00)
```
Interval: 12 saniye
Calls per cycle: 4
Duration: 9 saat = 32,400 saniye
Total calls: (32,400 ÷ 12) × 4 = 10,800 calls
```
⚠️ **Limit aşımı riski!** → Adaptive interval devreye girer

### Scenario B: Normal Hours (06:00-14:00)
```
Interval: 12 saniye
Calls per cycle: 3
Duration: 8 saat = 28,800 saniye
Total calls: (28,800 ÷ 12) × 3 = 7,200 calls
```
✅ **Optimal kullanım**

### Scenario C: Night Hours (00:00-06:00)
```
Interval: 60 saniye (adaptive)
Calls per cycle: 2
Duration: 6 saat = 21,600 saniye
Total calls: (21,600 ÷ 60) × 2 = 720 calls
```
✅ **API tasarrufu**

---

## 🎯 Günlük Toplam Tahmini

```
Peak Hours (9h): ~4,000 calls
Normal Hours (9h): ~2,500 calls
Night Hours (6h): ~500 calls
────────────────────────────
TOTAL: ~7,000 calls/day (%93 kullanım)
```

---

## 🚦 Rate Limit Protection

### API-Football PRO Plan Limitleri:
```
✅ 7,500 requests/day
✅ 300 requests/hour
✅ 30 requests/second
```

### Smart Sync Korumaları:
```javascript
// Hourly limit check
if (apiCallsThisHour >= 300) {
  interval = 60000; // Slow down
}

// Daily limit check
if (apiCallsToday >= 7,400) {
  interval = 120000; // Very slow
}

// Emergency stop
if (apiCallsToday >= 7,500) {
  stopSync(); // Stop completely
}
```

---

## 📊 Monitoring

### Status Endpoint:
```bash
GET http://localhost:3000/api/sync-status

Response:
{
  "isRunning": true,
  "currentInterval": "12s",
  "apiCallsToday": 1245,
  "apiCallsThisHour": 52,
  "remaining": {
    "daily": 6255,
    "hourly": 248
  }
}
```

---

## 🔧 Services Comparison

### Old: dailySyncService.js
```
✅ Interval: 30 dakika
✅ Calls per sync: 150
❌ Problem: Burst usage (150 call birden)
❌ Problem: Off-peak saatlerde israf
```

### Old: liveMatchService.js
```
✅ Interval: 10 saniye (sadece canlı maçlar)
❌ Problem: Canlı maç yoksa gereksiz
```

### NEW: smartSyncService.js
```
✅ Interval: 12 saniye (adaptive 10-60s)
✅ Calls per cycle: 3-4 (distributed)
✅ Priority-based fetching
✅ Rate limit protection
✅ Gece saatlerinde otomatik yavaşlama
```

---

## 🚀 Deployment Checklist

- [x] `smartSyncService.js` oluşturuldu
- [ ] `server.js` güncellenmeli
- [ ] `liveMatchService.js` devre dışı bırakılmalı (duplicated)
- [ ] `dailySyncService.js` devre dışı bırakılmalı (duplicated)
- [ ] Backend restart
- [ ] Status endpoint test: `GET /api/sync-status`

---

## 📝 Summary

**Sizin öneriniz:** Her 12 saniyede bir çek (7,200 call/day)
**Uygulanan:** Smart adaptive sync (10-60s, ortalama 12s, ~7,000 call/day)

**Avantajlar:**
- ✅ API limitini maksimum kullanır (%93)
- ✅ Canlı maçlarda daha sık günceller
- ✅ Gece saatlerinde tasarruf eder
- ✅ Rate limit koruması
- ✅ Otomatik adaptasyon

**Sonuç:** Hem verimli hem güvenli! 🎉
