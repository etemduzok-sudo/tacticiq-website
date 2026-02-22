# TacticIQ Oyuncu Rating Sistemi

## Reyting oluşturma (hesaplama) nasıl çalışır?

- **Kaynak**: API-Football oyuncu istatistikleri (`/players?id=&season=`) → maç, gol, pas, dribling, müdahale, duel, şut, kart, faul.
- **Formül**: `backend/utils/playerRatingFromStats.js` içinde:
  - `rawAttributesFromStats(latestStats)` → 6 öznitelik 0–100 (shooting, passing, dribbling, defense, physical, pace).
  - `calculatePlayerAttributesFromStats(latestStats, playerData)` → bu 6 özniteliğin **ortalaması** 65–95 bandına clamp’lenir → **rating**.
  - Pozisyon ağırlıkları PowerScore için kullanılır; rating doğrudan 6 özniteliğin ortalaması.
- **Kullanıcı oyları**: Planlanan aşamada formül çıktısı + kullanıcı puanları birleştirilecek (ağırlıklı ortalama / Bayesian güncelleme). Şu an sadece API + formül.
- **Frontend gösterim**: 0–10 (maç reytingi) → ×10 (67); 11–100 (genel) → olduğu gibi tam sayı. `src/utils/ratingUtils.ts` ve saha kartlarındaki `normalizeRatingTo100` – rakamlar yuvarlanıp kaybedilmez (60–70 farkı korunur).

---

## 1. Amaç

- **Başlangıç**: Tüm oyuncular için gerçekçi, veriye dayalı rating (70/70/70 yerine pozisyon ve istatistik bazlı).
- **Sonra**: Formül + kullanıcı geri bildirimleri ile optimum rating havuzu.

---

## 2. Mevcut Formül (API-Football istatistikleri)

Rating ve 6 öznitelik **API-Football** oyuncu istatistiklerinden türetiliyor:

| Öznitelik | Veri kaynağı (API) |
|-----------|--------------------|
| **Shooting** | Gol/maç, şut isabeti, şut sayısı |
| **Passing** | Pas isabeti, asist, kilit pas |
| **Dribbling** | Dribling denemesi/başarı oranı |
| **Defense** | Müdahale, duel kazanma |
| **Physical** | Duel oranı, dakika |
| **Pace** | Dribling hacmi + aktivite (proxy; API’de hız yok) |

- **Rating (65–95)**: 6 özniteliğin ortalaması (FIFA benzeri band).
- **Pozisyon ağırlıkları**: PowerScore için ST, AM, CM, CB, GK vb. farklı ağırlıklar (`playerRatingFromStats.js` içinde).

Dosya: `backend/utils/playerRatingFromStats.js`  
- `calculatePlayerAttributesFromStats(latestStats, playerData)`  
- `calculateRatingFromStats(latestStats, playerData)`

---

## 3. Başlangıç Verisi (Tek Seferlik / Periyodik)

- **Kaynak**: API-Football `/players?id={playerId}&season={season}` → `statistics` (maç, gol, pas, dribling, müdahale, duel, şut, kart, faul).
- **Harici toplu kaynak**: Transfermarkt / Football Manager tarzı tek seferlik “tüm oyuncular” verisi yok; lisans ve maliyet nedeniyle kullanılmıyor.
- **Strateji**:  
  - Başlangıç rating’leri **sadece API-Football istatistikleri** ile hesaplanıyor.  
  - İlk doldurma: `seed-initial-player-ratings.js` (team_squads’taki tüm oyuncular).  
  - Periyodik güncelleme: `update-all-player-ratings.js` (lig bazlı).

Veri yoksa (API’de istatistik yok): **pozisyona göre varsayılan** (Kaleci 72, Defans 70, Orta saha 71, Forvet 72) kullanılıyor; böylece kartlarda her şey 70/70 olmuyor.

---

## 4. Kullanıcı Geri Bildirimi (Planlanan)

- Kullanıcılar oyuncu kartlarında rating/öznitelik verebilecek.
- **Hedef**: Formül çıktısı + kullanıcı puanlarının birleşimi (örn. ağırlıklı ortalama veya Bayesian benzeri güncelleme).
- **Havuz**: Önce API + formül ile başlangıç havuzu; zamanla kullanıcı verisi eklenerek havuz zenginleşecek.

---

## 4.1 Topluluk Rating Formülü (Nasıl Birleştirilir?)

API rating’i (R_api) ile topluluk oylarını (kullanıcıların verdiği puanlar) birleştirmek için üç pratik yöntem:

### Yöntem A: Ağırlıklı ortalama (en basit)

- **Formül:**  
  `R = (w_api * R_api + w_user * R_user_avg) / (w_api + w_user)`
- **R_user_avg:** Kullanıcıların o oyuncuya verdiği rating’lerin ortalaması (örn. 1–100 veya 65–95 bandında).
- **Ağırlıklar örnek:**  
  - Sabit: `w_api = 1`, `w_user = n` (n = oy sayısı). Böylece oy arttıkça topluluk daha baskın olur.  
  - Veya: `w_api = C` (sabit, örn. 10), `w_user = n`. Minimum oy gelene kadar API ağırlıklı kalır.
- **Örnek:** R_api = 78, R_user_avg = 82, n = 20, w_api = 10, w_user = 20  
  → R = (10×78 + 20×82) / (10+20) = 2360/30 ≈ **80.7**.

### Yöntem B: Bayesian benzeri (IMDb tarzı)

- **Fikir:** “Ön bilgi” = API rating; her kullanıcı oyu bu ön bilgiyi günceller.
- **Formül (Wilson/ Bayesian ortalama basitleştirilmiş):**  
  `R = (C * R_prior + n * R_user_avg) / (C + n)`  
  Burada **R_prior = R_api**, **C** = “güven sayısı” (ne kadar oy, API’yi dengeleyecek).
- **C seçimi:** C = 5 → 5 kullanıcı oyu, API ile eşit ağırlıkta. C = 20 → topluluk oyu daha çok oy topladıkça öne geçer.
- **Avantaj:** Az oy alan oyuncuda rating API’ye yakın kalır; çok oy alan oyuncuda topluluk ortalaması dominant olur.

### Yöntem C: Minimum oy + ağırlıklı ortalama

- **Kural:** Sadece **en az N oy** (örn. N = 3 veya 5) toplandıysa topluluk rating’i kullan; yoksa sadece R_api göster.
- **Birleşik formül (N geçildiyse):**  
  `R = (R_api * (C - n) + R_user_avg * n) / C`  
  n = oy sayısı, C = cap (örn. 30). n &lt; N ise R = R_api.
- Böylece az oylı oyuncular “sallanmaz”; çok oylı oyuncuda topluluk belirleyici olur.

### Önerilen uygulama (tek satır)

- **Gösterilen rating:**  
  `R = (C * R_api + n * R_user_avg) / (C + n)`  
  C = 10, n = o oyuncuya verilen topluluk oyu sayısı, R_user_avg = oyların ortalaması (65–95 veya 0–100 aynı bandda tutulmalı).
- **Minimum oy:** n &lt; 2 ise sadece R_api göster (topluluk karışmasın).
- **Veri:** Bir tablo örn. `player_community_ratings (player_id, user_id, rating, created_at)`; topluluk ortalaması ve n per player_id ile hesaplanır; günlük/haftalık job ile `players.rating` veya ayrı `display_rating` alanı güncellenir.

**Uygulama:** Şu an sadece API gösteriliyor; n ≥ 2 topluluk oyu olan oyuncuda sistem otomatik blend kullanır (`displayRating.js` → `getDisplayRatingsMap`). Ek job yok. Tablo: `create_player_community_ratings.sql`; detay: `JOBS_AND_CRON.md`.

---

## 5. Script’ler

| Script | Amaç |
|--------|------|
| `seed-initial-player-ratings.js` | team_squads’taki tüm oyuncular için API’den istatistik çekip `players` tablosuna rating yazar (bir defalık / ihtiyaç halinde). |
| `update-all-player-ratings.js` | Belirli liglerdeki takımların kadrolarını API’den çekip rating + power_score günceller (haftalık vb.). |

**Bir defalık başlangıç doldurma:** `node scripts/seed-initial-player-ratings.js` (ilerleme: `data/seed-ratings-progress.json`).  
**Windows’ta tek tık:** `scripts/run-seed-ratings.bat` (pencereyi kapatmayın; ~35–40 dk sürebilir).

**Kota bilgisi:** Günlük 7500 hak; bu script oturumda en fazla 7450 kullanır. Kadrolarda ~24.000 oyuncu varsa tamamı için yaklaşık 3 gün (her gün script’i tekrar çalıştırın). Limit dolunca ilerleme kaydedilir, ertesi gün kaldığı yerden devam eder.

---

## 6. Özet

- **Formül**: Var; API-Football istatistikleri → 6 öznitelik + rating (65–95).  
- **Başlangıç verisi**: Sadece API-Football; harici toplu indirme yok.  
- **Gerçekçi başlangıç**: API’den gelenler formülle, gelmeyenler pozisyon varsayılanı ile.  
- **İleride**: Kullanıcı geri bildirimleri bu rating havuzu ile birleştirilecek.
