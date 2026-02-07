# 🔔 API Limit Reset Hatırlatması

## Tarih: 7 Şubat 2026

**Durum:** API günlük limiti doldu. Script'ler durduruldu.

**Yapılacaklar:**
1. ✅ API limiti sıfırlandığında (yarın) `watchdog-squad-sync.js` script'ini tekrar başlat
2. ✅ Script'in veri çekmeye başladığını kontrol et
3. ✅ İlerlemeyi `check-real-progress.js` ile takip et

**Komut:**
```bash
cd c:\TacticIQ
node backend/scripts/watchdog-squad-sync.js
```

**Kontrol:**
```bash
node backend/scripts/check-real-progress.js
```

**Not:** Script otomatik olarak Süper Lig'den başlayacak ve tüm öncelikli ligleri işleyecek.
