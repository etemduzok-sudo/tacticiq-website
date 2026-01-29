# Oyuncu Reytingleri – Kendi Modelimiz (API-Football İstatistikleriyle)

API-Football çoğu zaman doğrudan reyting vermez; bu yüzden **kendi reyting modelimizi** API’den gelen oyuncu istatistikleriyle hesaplıyoruz.

## Nasıl hesaplanıyor?

- **Kaynak:** API-Football `/players?id=&season=` yanıtındaki `statistics[0]` (gol, asist, pas, maç süresi vb.).
- **Formül fikri:**  
  `rating = pozisyon bazı + (gol*4 + asist*3 + pas_isabeti_katkısı*2 + maç_süresi_katkısı*1)` normalize edilerek **65–95** aralığına çekilir.
- **Kod:** `backend/utils/playerRatingFromStats.js` içindeki `calculateRatingFromStats(latestStats, playerData)`.

Kullanılan alanlar (API’de varsa):

- `games`: minutes, appearences, position  
- `goals`: total, assists  
- `passes`: total, accuracy (veya success/total ile yüzde)  
- `dribbles`: attempts, success → dribbling
- `tackles`: total → defending
- `duels`: won, total → physical (ikili mücadele)
- `shots`: on, total → şut isabeti (shooting)
- Maç başına ortalama süre ve gol/asist katkısı

Pozisyona göre baz puan ve forvet/orta saha için ek gol-asist bonusu uygulanır.

**6 öznitelik (gerçeğe yakın):** `calculatePlayerAttributesFromStats(latestStats, playerData)` ile **pace (hız), shooting (şut), passing (pas), dribbling, defending, physical** hesaplanır. API'de olan alanlar bu özniteliklere yansır; olmayanlar pozisyon bazı + rating ile doldurulur. Tüm kadro oyuncuları için lineups zenginleştirilirken kullanılır.

## Nerede kullanılıyor?

- **Maç kadrosu zenginleştirme:** `backend/routes/matches.js` – lineups çekilirken oyuncu bilgisi + istatistik alınıp rating hesaplanır ve DB’ye yazılır.
- **Takım kadrosu:** `backend/routes/teams.js` – `fetchAndSavePlayerRatings` aynı formülle rating hesaplayıp `players` tablosuna kaydeder.

Sonuç: Reyting verisi **tek kaynaktan (API-Football)** geliyor ama **bizim formülümüzle** üretiliyor; API’nin kendi “rating” alanı kullanılmıyor.
