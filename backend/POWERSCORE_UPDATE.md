# PowerScore Güncelleme (Pozisyona Göre Ağırlık)

Bu doküman, **PowerScore** formülünü ve aylık batch job’u özetler.

---

## 1) 6 Attribute (0–100)

API-Football istatistiklerinden tek sezonluk veri ile hesaplanır (min-max proxy; lig+pozisyon batch’te iyileştirilebilir):

| Attribute   | Kaynak |
|------------|--------|
| **Shooting** | goals, shots on target, total shots, shot accuracy proxy |
| **Passing**  | passes, key passes, pass accuracy, assists |
| **Dribbling**| dribbles attempted/success, duels won (ground) |
| **Defense**  | tackles, interceptions, blocks, duels won |
| **Physical** | duels total/won, fouls drawn/committed dengesi, minutes |
| **Pace**     | minutes + dribbles + duels tempo proxy (düşük ağırlık) |

Hepsi **0–100** aralığına normalize edilir. Kod: `backend/utils/playerRatingFromStats.js` → `rawAttributesFromStats`, `calculatePlayerAttributesFromStats`.

---

## 2) Pozisyona Göre PowerScore

Ağırlıklar (kısa):

- **ST/WF:** 0.45 Shooting + 0.20 Dribbling + 0.15 Physical + 0.10 Passing + 0.10 Form  
- **AM/W:**  0.30 Passing + 0.25 Dribbling + 0.20 Shooting + 0.15 Form + 0.10 Physical  
- **CM/DM:** 0.30 Passing + 0.25 Defense + 0.15 Physical + 0.15 Form + 0.15 Dribbling  
- **CB:**    0.45 Defense + 0.25 Physical + 0.15 Form + 0.15 Passing  
- **FB/WB:** 0.25 Defense + 0.20 Passing + 0.20 Dribbling + 0.20 Physical + 0.15 Form  
- **GK:**    (GK stats varsa) defense/physical/form/passing ağırlıklı; yoksa mevcut proxy  

**Form** = son 5 maçın aynı attribute’larının ortalamasından 0–100. Veri yoksa 50 kullanılır.

---

## 3) Sakatlık Cezası

- **Injured:**  PowerScore × 0.75  
- **Doubtful:** PowerScore × 0.90  
- **Fit:**      değişmez  

`fitness_status` API-Football Injuries endpoint’inden veya batch sırasında doldurulur.

---

## 4) Disiplin (isteğe bağlı)

- `Discipline = 100 - normalize(cards_per_90 + fouls_per_90)`  
- DM/CB için PowerScore’a küçük ek: örn. +0.05 etkisi (en fazla ~+5 puan).

---

## 5) Çıktı Tablosu: `player_power_scores`

| Alan            | Açıklama |
|-----------------|----------|
| player_id       | players.id |
| team_id         | Takım |
| league_id       | Lig |
| season          | Sezon (örn. 2025) |
| position        | Pozisyon string |
| power_score     | 0–100, sakatlık çarpanı uygulanmış |
| shooting        | 0–100 |
| passing         | 0–100 |
| dribbling       | 0–100 |
| defense         | 0–100 |
| physical        | 0–100 |
| pace            | 0–100 |
| form            | 0–100 (son 5 maç ort.) |
| discipline      | 0–100 (isteğe bağlı) |
| fitness_status  | fit \| doubtful \| injured |
| updated_at      | Son güncelleme |

Migration: `supabase/migrations/add_player_power_scores.sql`

---

## 6) Aylık Job (Cron)

- **Önerilen cron:** `0 03 1 * *` (her ayın 1’i 03:00)
- **Yapılacaklar:**  
  - Takım/ligenin oyuncu listesi alınır.  
  - API-Football’dan sezonluk player statistics (ve mümkünse Injuries) çekilir.  
  - Son 5 maç verisi varsa Form hesaplanır; yoksa Form=50.  
  - `calculatePlayerAttributesFromStats` / `calculatePowerScore` ile power_score ve attribute’lar hesaplanır.  
  - `player_power_scores` tablosuna upsert edilir.

Batch script taslağı: `backend/scripts/power-score-batch.js` (ileride doldurulacak).

---

## 7) App Tarafında

- **Kadro ekranı:** Oyuncu listesi ve PowerScore/attribute’lar için sadece `player_power_scores` tablosu okunur.  
- **API-Football** sadece aylık batch update için kullanılır → maliyet/limit kontrolü.

---

## Kullanılan Modül

- `backend/utils/playerRatingFromStats.js`  
  - `rawAttributesFromStats(latestStats)`  
  - `calculatePlayerAttributesFromStats(latestStats, playerData)`  
  - `calculatePowerScore(attrs, position, fitnessStatus, options)`  
  - `calculateForm(attributesLast5)`  
  - `calculateDiscipline(cardsPer90, foulsPer90)`  
  - `getFitnessMultiplier(fitnessStatus)`
