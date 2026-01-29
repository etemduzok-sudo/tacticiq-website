# Static Teams Tablosu Kurulum Rehberi

## 🎯 Amaç

`static_teams` tablosu takım renklerini (forma renkleri) saklar. Bu renkler lineups endpoint'inde kullanılır.

---

## ✅ Hızlı Kontrol

```bash
cd backend
node scripts/check-static-teams.js
```

Bu script şunları kontrol eder:
- ✅ Tablo var mı?
- ✅ Veri var mı?
- ✅ Renkler dolu mu?
- ✅ Önemli takımlar var mı?

---

## 📋 Kurulum Adımları

### Yöntem 1: Node.js Script (Önerilen - Otomatik)

```bash
cd backend
node scripts/setup-static-teams-supabase.js
```

Bu script:
- ✅ Tabloyu oluşturur (yoksa)
- ✅ Milli takımları yükler (15 takım)
- ✅ Kulüp takımlarını yükler (30+ takım)
- ✅ Verileri doğrular

**Gereksinimler:**
- `backend/.env` dosyasında `SUPABASE_SERVICE_KEY` olmalı

---

### Yöntem 2: Supabase SQL Editor (Manuel)

**Adım 1:** Supabase Dashboard'a git
```
https://supabase.com/dashboard/project/jxdgiskusjljlpzvrzau/sql
```

**Adım 2:** SQL Editor'ü aç
- Sol menüden "SQL Editor" seç
- "New query" butonuna tıkla

**Adım 3:** SQL script'i çalıştır
- `supabase/005_static_teams.sql` dosyasını aç
- İçeriğini kopyala
- SQL Editor'e yapıştır
- "Run" butonuna tıkla

**Adım 4:** Kontrol et
```bash
cd backend
node scripts/check-static-teams.js
```

---

## 🔍 Kontrol Komutları

### Tablo Durumunu Kontrol Et
```bash
cd backend
node scripts/check-static-teams.js
```

### Veri Yükleme Scripti Çalıştır
```bash
cd backend
node scripts/setup-static-teams-supabase.js
```

---

## 📊 İçerik

Tablo şu takımları içerir:

### Milli Takımlar (15 takım)
- Türkiye, Almanya, Fransa, İngiltere, İspanya
- İtalya, Brezilya, Arjantin, Portekiz, Hollanda
- Belçika, Hırvatistan, Polonya, Ukrayna, Danimarka

### Kulüp Takımları (30+ takım)
- **Süper Lig:** Fenerbahçe, Galatasaray, Beşiktaş, Trabzonspor, vs.
- **Premier League:** Man City, Man United, Liverpool, Arsenal, Chelsea, Tottenham
- **La Liga:** Real Madrid, Barcelona, Atletico Madrid
- **Bundesliga:** Bayern Munich, Dortmund, Leverkusen
- **Serie A:** AC Milan, Inter, Juventus, Napoli
- **Ligue 1:** PSG, Marseille, Lyon

---

## 🎨 Veri Formatı

Her takım şu bilgileri içerir:
```json
{
  "api_football_id": 611,
  "name": "Fenerbahce",
  "country": "Turkey",
  "league": "Süper Lig",
  "team_type": "club",
  "colors_primary": "#FFED00",
  "colors_secondary": "#00205B",
  "colors": ["#FFED00", "#00205B"]
}
```

---

## ⚠️ Sorun Giderme

### Problem: "Table does not exist"
**Çözüm:** 
```bash
# Supabase SQL Editor'de:
# supabase/005_static_teams.sql dosyasını çalıştır
```

### Problem: "SUPABASE_SERVICE_KEY is not set"
**Çözüm:**
1. `backend/.env` dosyasını aç
2. `SUPABASE_SERVICE_KEY=...` ekle
3. Supabase Dashboard > Settings > API > service_role key'i kopyala

### Problem: "Table is empty"
**Çözüm:**
```bash
node scripts/setup-static-teams-supabase.js
```

### Problem: "Some teams missing colors"
**Çözüm:**
- Script otomatik olarak renkleri yükler
- Eksik renkler için `staticTeamsService.js` içindeki `MAJOR_TEAMS` array'ini kontrol et

---

## 🔄 Güncelleme

Takımlar otomatik olarak güncellenir:
- **Scheduler:** Günde 2 kez (08:00 ve 20:00 UTC)
- **Manuel:** `node scripts/setup-static-teams-supabase.js`

---

## ✅ Başarı Kontrolü

Kurulum başarılı ise:
```bash
cd backend
node scripts/check-static-teams.js
```

Çıktı:
```
✅ Table exists!
📊 Total teams in database: 45+
✅ Sample teams (first 10): ...
✅ All teams have colors!
✅ static_teams table is ready!
```

---

## 📝 Notlar

- Tablo sadece **renk bilgilerini** saklar (logo/armalar telif nedeniyle yok)
- `api_football_id` ile API-Football takım ID'si eşleşir
- Renkler `colors_primary` ve `colors_secondary` kolonlarında saklanır
- Lineups endpoint'i bu renkleri kullanır
