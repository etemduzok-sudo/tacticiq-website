# TacticIQ Oyuncu Rating Sistemi

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
- Teknik detay (blend formülü, minimum örnek sayısı vb.) sonra netleştirilecek.

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
