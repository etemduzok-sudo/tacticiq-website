# ⚡ Statik Takımlar Sistemi

## 📋 Genel Bakış

Bu sistem, tüm önemli takımları bir kez çekip veritabanında saklayarak **API-Football rate limitini korur** ve **hızlı veri erişimi** sağlar.

## 🎯 Kapsam

### 1. Üst Lig Takımları
- Premier League (İngiltere)
- La Liga (İspanya)
- Serie A (İtalya)
- Bundesliga (Almanya)
- Ligue 1 (Fransa)
- Süper Lig (Türkiye)
- Eredivisie (Hollanda)
- Primeira Liga (Portekiz)
- Ve diğer önemli üst ligler

### 2. Yerel Kupalar
- Türkiye Kupası (Ziraat Türkiye Kupası)
- FA Cup (İngiltere)
- Copa del Rey (İspanya)
- Coppa Italia (İtalya)
- Ve diğer yerel kupalar

### 3. Kıta Kupaları
- UEFA Şampiyonlar Ligi
- UEFA Avrupa Ligi
- UEFA Konfederasyon Ligi
- CONMEBOL Libertadores
- AFC Şampiyonlar Ligi
- Ve diğer kıta kupaları

### 4. Milli Takımlar
- FIFA Dünya Kupası takımları
- Kıta Kupaları (Afrika Uluslar Kupası, vs.)
- Tüm milli takımlar

## 📊 Veritabanı Yapısı

### `static_teams` Tablosu
- `id` - Primary key
- `api_football_id` - API-Football team ID (unique)
- `name` - Takım adı
- `country` - Ülke
- `league` - Lig adı
- `league_type` - Lig tipi (domestic_top, domestic_cup, continental, international, world_cup, continental_championship)
- `team_type` - Takım tipi (club, national)
- `colors` - Resmi arma renkleri (JSON: ["#FF0000", "#FFFFFF"])
- `colors_primary` - Birincil renk (hızlı erişim için)
- `colors_secondary` - İkincil renk
- `coach` - Teknik direktör adı
- `coach_api_id` - API-Football coach ID
- `logo_url` - Logo URL
- `flag_url` - Bayrak URL (milli takımlar için)
- `last_updated` - Son güncelleme tarihi
- `created_at` - Oluşturulma tarihi

### View'lar
- `v_active_static_teams` - Aktif takımlar (son 2 ay içinde güncellenmiş)
- `v_national_teams` - Tüm milli takımlar
- `v_club_teams` - Tüm kulüp takımları

## 🔄 Güncelleme Stratejisi

### Haftalık Full Sync
- **Zaman:** Her hafta (ör: Pazar geceleri)
- **Süreç:**
  1. Tüm üst ligleri çek
  2. Yerel kupaları çek
  3. Kıta kupalarını çek
  4. Milli takımları çek
  5. Her takım için renk, teknik direktör bilgilerini kaydet
  6. 2 ay önceki verileri temizle

### Otomatik Temizlik
- **Zaman:** Her sync'te otomatik
- **Kural:** 2 ay önceki veriler silinir
- **İstisna:** Kullanıcıların favori takımları korunur

## 🚀 Kullanım

### 1. Veritabanını Oluştur
```sql
-- Supabase SQL Editor'de çalıştır
\i backend/database/create_static_teams_db.sql
```

### 2. İlk Sync'i Başlat
```bash
# Backend'de
node backend/scripts/weekly-sync-static-teams.js
```

### 3. Cron Job Kurulumu (Haftalık)
```bash
# Linux/Mac (crontab)
0 2 * * 0 cd /path/to/TacticIQ && node backend/scripts/weekly-sync-static-teams.js

# Windows (Task Scheduler)
# Her Pazar 02:00'de çalıştır
```

### 4. API Kullanımı

#### Takım Ara (Hızlı)
```javascript
GET /api/static-teams/search?q=galatasaray&type=club

Response:
{
  "success": true,
  "data": [
    {
      "id": 645,
      "name": "Galatasaray",
      "country": "Türkiye",
      "league": "Süper Lig",
      "type": "club",
      "colors": ["#FFA500", "#FF0000"],
      "logo": "...",
      "coach": "..."
    }
  ],
  "source": "static_db",
  "count": 1
}
```

#### Milli Takımları Getir
```javascript
GET /api/static-teams/national

Response:
{
  "success": true,
  "data": [...],
  "source": "static_db",
  "count": 200
}
```

#### Kulüp Takımlarını Getir (Ülkeye göre)
```javascript
GET /api/static-teams/clubs?country=Türkiye

Response:
{
  "success": true,
  "data": [...],
  "source": "static_db",
  "count": 20
}
```

## ⚡ Avantajlar

1. **Hızlı Veri Erişimi**
   - API-Football'a direkt bağlanmaz
   - DB'den direkt okur (< 50ms)

2. **Rate Limit Koruması**
   - Haftada 1 kez sync (sadece 500-1000 request)
   - Günlük 7500 limit korunur

3. **Güvenilirlik**
   - API-Football down olsa bile takımlar görülebilir
   - Offline çalışabilir (son sync'ten sonra)

4. **Veri Tutarlılığı**
   - Tüm takımlar aynı formatta
   - Renk, teknik direktör bilgileri her zaman mevcut

5. **Optimizasyon**
   - 2 ay önceki veriler otomatik silinir
   - DB boyutu kontrol altında

## 📝 Notlar

- **İlk Sync:** Yaklaşık 30-60 dakika sürebilir (1000+ takım)
- **Haftalık Sync:** 10-20 dakika (sadece güncellemeler)
- **DB Boyutu:** ~5000-10000 takım ≈ 5-10 MB (çok küçük!)

## 🔧 Geliştirme

### Yeni Lig Eklemek
`staticTeamsService.js` dosyasında `fetchTopLeagues()` fonksiyonuna yeni lig adı ekle:

```javascript
const topLeagueNames = [
  'premier league',
  'yeni lig adı', // ← Buraya ekle
  ...
];
```

### Renk Eklemek
`extractTeamColors()` fonksiyonuna yeni takım renkleri ekle.

### Sync Durumunu Kontrol Et
```sql
SELECT * FROM static_teams_update_history 
ORDER BY started_at DESC 
LIMIT 10;
```

---

**🎯 Sonuç:** Bu sistem sayesinde web ve mobil uygulamalar **çok hızlı** takım araması yapabilir ve API limiti korunur!
