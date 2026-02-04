# DB Senkronizasyon Raporu

**Tarih:** Şubat 2026  
**Kapsam:** Maçlar, takım kadroları, takım renkleri, teknik direktör bilgisi, turnuva maç verileri

---

## 1. MAÇLAR

### 1.1 Planlanmış maçlar (sezonun kalanı)
| İşlem | Script | Tablo | Açıklama |
|-------|--------|-------|----------|
| ✅ | `sync-planned-matches.js` | `matches` | Bugün → 30 Haziran arası **tüm turnuva maçları** (1 API çağrısı) |
| | | | UEFA CL, EL, Süper Lig, La Liga, Copa Libertadores vb. dahil |

### 1.2 Lig bazlı sezon maçları
| İşlem | Script | Tablo | Açıklama |
|-------|--------|-------|----------|
| ✅ | `sync-all-teams-matches.js` | `matches` | ~130 lig için 2025 sezon maçları (lig × 1 API) |
| | | | İç lig + kıta turnuvaları (UEFA CL, Copa Libertadores vb.) |
| | | | Her ligdeki takımların tüm maçları (geçmiş + gelecek) |

### Maç tablosuna kaydedilen alanlar
- `id`, `league_id`, `season`, `round`
- `home_team_id`, `away_team_id`
- `fixture_date`, `fixture_timestamp`, `timezone`
- `status`, `status_long`, `elapsed`
- `home_score`, `away_score`, `halftime_home`, `halftime_away`
- `venue_name`, `venue_city`, `referee`

---

## 2. TAKIM KADROLARI

| İşlem | Script | Tablo | Açıklama |
|-------|--------|-------|----------|
| ✅ | `sync-all-world-leagues.js` | `team_squads` | 127 lig, ~2300 takım kadrosu |
| ✅ | `auto-sync-squads.js` | `team_squads` | Eksik kadroların otomatik tamamlanması |

### Kadro verisi
- `team_id`, `team_name`, `season`
- `players`: API-Football `/players/squads` yanıtı (oyuncu listesi)
- `team_data.coach`: Teknik direktör adı

---

## 3. TAKIM RENKLERİ

| İşlem | Script | Tablo | Açıklama |
|-------|--------|-------|----------|
| ✅ | `sync-all-world-leagues.js` | `static_teams` | Her takım için `colors_primary`, `colors_secondary` |
| | | | Ülke bazlı varsayılan renkler (Türkiye: #E30A17, İngiltere: #FF0000 vb.) |

### Renk alanları
- `colors_primary` (ana forma rengi)
- `colors_secondary` (ikinci renk)
- `colors` (JSON array)

---

## 4. TEKNİK DİREKTÖR BİLGİSİ

| İşlem | Script | Tablo | Açıklama |
|-------|--------|-------|----------|
| ✅ | `sync-all-world-leagues.js` | `team_squads.team_data.coach` | Kadro kaydedilirken teknik direktör çekilir |
| ✅ | `backfill-coaches.js` | `team_squads.team_data.coach` | Eksik kadrolardaki teknik direktör bilgisi tamamlanır |

### Veri kaynağı
- API-Football `/coachs?team={teamId}` endpoint'i

---

## 5. TAKIMLARA AİT TÜM BELİRLENMİŞ TURNUVA MAÇ VERİLERİ

| Kaynak | Kapsam | Turnuva örnekleri |
|--------|--------|-------------------|
| **sync-planned-matches** | Bugün → sezon sonu | Tüm ligler + UEFA CL/EL, Copa Libertadores, AFC CL vb. |
| **sync-all-teams-matches** | 2025 sezonu | Lig bazlı: Premier League, Süper Lig, La Liga, Serie A, Bundesliga, Ligue 1, MLS, J1 League, Copa Libertadores, UEFA CL/EL, FIFA World Cup, Copa América vb. |

### Kapsanan lig ve turnuvalar (leaguesScope + WORLD_LEAGUE_IDS)
- **Domestic Top Tier:** Avrupa 1. ligleri, Güney Amerika, Asya, Afrika, Okyanusya
- **Kıta Kulüp Turnuvaları:** UEFA CL, EL, Conference League, Copa Libertadores, Sudamericana, AFC CL, CAF CL, CONCACAF Champions Cup, OFC Champions League
- **Kıta Millî Takım Turnuvaları:** EURO (4), Copa América (9), AFC Asian Cup (16), Africa Cup (17), Gold Cup (22), OFC Nations Cup (23)
- **Global:** FIFA World Cup (1), FIFA Club World Cup (10)
- **UEFA Nations League (5)**

Millî takım maçları hem `sync-planned-matches` (tarih aralığı) hem `sync-all-teams-matches` (lig bazlı) ile DB'ye yazılır.

---

## 6. ÇALIŞTIRMA SIRASI (post-reset-full-sync.js)

```
1. sync-planned-matches.js     → 1 API  | Sezonun kalanı maçları
2. sync-all-teams-matches.js   → ~130   | Lig bazlı sezon maçları
3. backfill-coaches.js         → ~6000  | Eksik teknik direktörler
4. sync-all-world-leagues.js   → ~2500  | Takımlar, renkler, kadrolar, teknik direktörler
```

**Toplam tahmini API kullanımı:** ~7500 (günlük limit)

---

## 7. UYGULAMA TARAFINDA KULLANIM (DB-FIRST)

Senkron tamamlandıktan sonra uygulama:

| Endpoint | Davranış |
|----------|----------|
| `GET /api/matches/date/:date` | Önce DB → boşsa API |
| `GET /api/matches/team/:id/season/:season` | Memory cache → DB → API fallback |

Böylece API kotası korunur, yanıt süreleri düşer.

---

## 8. TABLOLAR

| Tablo | İçerik |
|-------|--------|
| `matches` | Maçlar (takım ID, lig, skor, tarih, statü) |
| `teams` | Takım temel bilgisi (upsert maç kaydı sırasında) |
| `leagues` | Lig bilgisi (upsert maç kaydı sırasında) |
| `static_teams` | Takım meta (renkler, ülke, lig, api_football_id) |
| `team_squads` | Kadro (oyuncular, teknik direktör) |
