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

## 🔧 Önerilen Kullanım

1. **Günlük**: `auto-sync-squads.js` çalıştır (API limiti varsa)
2. **Haftalık**: `backup-db.js` ile yedek al
3. **Sorun durumunda**: `restore-db.js` ile geri yükle
