# 22 Şubat "Canlı" Görünme Sorunu – Kök Neden

## Sorun
22 Şubat’ta oynanıp biten bir Roma maçı, uygulamada haftalar sonra hâlâ "canlı" (1H/2H) görünüyordu. Aynı anda gerçekten oynanan Roma maçı (ör. Roma–Juve) ise canlı listede görünmüyordu.

## Kök neden (özet)

1. **Veritabanında statü güncellenmedi**  
   Maç bittiğinde API veya sync süreci bazen `matches` tablosundaki `status` alanını `FT` (Match Finished) yapmıyor. Bu yüzden 22 Şubat maçı DB’de `1H` veya `2H` olarak kaldı.

2. **Backend sadece statüye baktı**  
   `GET /api/matches/live` isteği, canlı maçları şu sorguyla alıyordu:  
   `status IN ('1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE')`.  
   Başlama zamanına (`fixture_timestamp`) hiç bakılmadığı için, çok eski maçlar da "canlı" sayılıp döndü.

3. **Zaman penceresi yoktu**  
   "Canlı" sayılacak maçlar için "maç en fazla X saat önce başlamış olmalı" gibi bir sınır yoktu. Bu yüzden 22 Şubat maçı, Mart’ta bile canlı listesinde yer alıyordu.

## Yapılan düzeltmeler

- **Backend:**  
  - `filterStaleLive`: `fixture_timestamp` veya `fixture.timestamp` kullanılarak, başlaması 3,5 saatten eski maçlar canlı listesinden çıkarılıyor.  
  - DB’den dönen canlı listesi de aynı filtreyle süzülüyor.  
  - Arka planda: statüsü 1H/2H/HT olup başlaması 3,5 saatten eski kayıtlar `FT` yapılıyor (sadece `status`, `status_long`, `elapsed` güncellenir; skor/tarih/takım vb. dokunulmaz).

- **Sonuç:**  
  Eski "canlı" maçlar artık ne API cevabında ne DB cevabında listeleniyor; gerçekten oynanan maç (Roma–Juve) canlı olarak görünüyor.

## Backend kapalıyken davranış

- Backend’e bağlanılamadığında artık **eski veya mock veri gösterilmiyor**.  
- Maç listeleri temizleniyor ve kullanıcıya **"Veri gelmiyor. Sunucu bağlantısı kurulamadı."** uyarısı gösteriliyor.  
- Sunucu tekrar ulaşılır olunca veriler normal şekilde yükleniyor.
