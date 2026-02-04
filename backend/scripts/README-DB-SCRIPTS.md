# TacticIQ Database Scripts

## 📦 Yedekleme ve Geri Yükleme

### Yedekleme
```bash
cd backend
node scripts/backup-db.js
```
- Tüm tabloları `backups/backup-YYYY-MM-DDTHH-MM-SS/` klasörüne kaydeder
- Her tablo ayrı JSON dosyası + `_full_backup.json` (hepsi bir arada)
- `_summary.json` ile kayıt sayıları

### Geri Yükleme
```bash
node scripts/restore-db.js backup-2026-02-02T04-59-53
```
- Belirtilen yedekten verileri geri yükler
- Upsert kullanır (mevcut veriler güncellenir)

---

## 🔄 Kadro Senkronizasyonu

### Otomatik Senkronizasyon
```bash
node scripts/auto-sync-squads.js
```
- API limitini kontrol eder
- Eksik kadroları öncelikli ülkelerden başlayarak çeker
- Progress dosyası ile kaldığı yerden devam eder
- Günde 1-2 kez çalıştırılması önerilir

### Manuel Kadro Tamamlama
```bash
node scripts/complete-missing-squads.js
```
- Öncelikli liglerdeki eksik kadroları çeker

---

## 📊 Veritabanı Kontrol

### DB Durumu Kontrolü
```bash
node scripts/check-db-teams.js
node scripts/check-team-squads.js
```

### Şema Kontrolü
```bash
node scripts/check-db-schema.js
```

---

## ⚠️ API-Football Limitleri

- **Günlük limit**: 7500 istek
- **Reset zamanı**: UTC 00:00 (Türkiye saati 03:00)
- Limit dolduğunda senkronizasyon otomatik durur
- `auto-sync-squads.js` güvenli limitlerle çalışır (300 istek/çalıştırma)

---

## 📁 Dosya Yapısı

```
backend/
├── backups/                    # Yedekler
│   └── backup-YYYY-MM-DD.../
│       ├── static_teams.json
│       ├── team_squads.json
│       ├── matches.json
│       └── _full_backup.json
├── data/
│   └── squad-sync-progress.json  # Senkronizasyon ilerlemesi
└── scripts/
    ├── backup-db.js
    ├── restore-db.js
    ├── auto-sync-squads.js
    └── ...
```

---

## ⚽ Planlanmış Maçlar & API Sıfırlama Sonrası

### DB-FIRST Stratejisi
Uygulama maç verisi alırken **önce DB'den okur**, boşsa API fallback yapar:
- `GET /api/matches/date/:date` → DB (sync-planned-matches ile dolu)
- `GET /api/matches/team/:id/season/:season` → DB (sync-all-teams-matches ile dolu)
Böylece API kotası korunur, yanıt süreleri düşer.

### Planlanmış Maç Senkronu (1 API çağrısı!)
```bash
node scripts/sync-planned-matches.js
```
- **1 API çağrısı** ile bugün → sezon sonu (30 Haziran) tüm maçları çeker
- `getFixturesByDateRange(from, to)` kullanır
- DB'ye bulk upsert (quiet, bulk mode)

### Tüm Takımlar Maç Listesi
```bash
node scripts/sync-all-teams-matches.js
```
- Her lig için sezon maçlarını çeker (~130 lig × 1 API)
- Tüm takımların geçmiş + gelecek maçları DB'de

### API Sıfırlama Sonrası Tam Senkron (03:00)
```bash
node scripts/post-reset-full-sync.js
```
Sırayla çalıştırır (minimum API önceliği):
1. **Planlanmış maçlar** (1 API, bugün → sezon sonu)
2. Tüm takımlar maç listesi (lig bazlı)
3. Eksik teknik direktörler
4. Lig/Takım/Kadro (sync-all-world-leagues)

**Windows Görev Zamanlayıcı**: `schedule-post-reset.bat` ile 03:00'de her gün otomatik çalıştır.

---

## 🔧 Önerilen Kullanım

1. **Günlük 03:00**: `post-reset-full-sync.js` (API sıfırlandıktan sonra) → `schedule-post-reset.bat`
2. **Günlük 04:00**: `backup-db.js` (sync sonrası yedek) → `schedule-backup.bat`
3. **Manuel**: `sync-planned-matches.js` ile sadece maç listesi
4. **Sorun durumunda**: `restore-db.js backup-YYYY-MM-DDTHH-MM-SS` ile geri yükle

## 📋 Yedekleme Detayları

- **Yedeklenen tablolar**: leagues, teams, static_teams, team_squads, players, matches, profiles, predictions, squad_predictions, user_badges
- **Geri dönüş süresi**: ~2–10 dakika (kayıt sayısına göre)
- **Ne kadar geriye**: Alınan her yedek noktasına dönülebilir
- **Detaylı plan**: `backend/docs/YEDEKLEME_VE_KURTARMA_PLANI.md`
