# ⚽ TacticIQ - Web Sitesi Tasarım Dokümantasyonu
## Figma için Kapsamlı Proje Hikayesi ve Akış Dokümantasyonu
### Tek Dosya - Tüm Proje Detayları

**Versiyon:** 2.0.0 (Kapsamlı Güncelleme)  
**Tarih:** 5 Ocak 2026  
**Hazırlayan:** TacticIQ Development Team  
**Toplam Bölüm:** 20 Ana Bölüm + Ek Bilgiler  
**Toplam Satır:** ~2,400+ satır  
**Durum:** ✅ Tek Dosya - Tüm Detaylar İçerir

---

## 📋 İÇİNDEKİLER

### 🎯 Temel Bilgiler
1. [Uygulama Konsepti ve Vizyon](#1-uygulama-konsepti-ve-vizyon)
2. [Kullanıcı Hikayesi ve Akış](#2-kullanıcı-hikayesi-ve-akış)

### 📱 Ekranlar ve Özellikler
3. [Tüm Ekranlar ve Özellikler](#3-tüm-ekranlar-ve-özellikler)
4. [Oyuncu Kartı Tahmin Sistemi](#4-oyuncu-kartı-tahmin-sistemi)
5. [Maç Özet Sayfası Detayları](#5-maç-özet-sayfası-detayları)

### 🎮 Sistemler ve Mekanikler
6. [Tahmin Kategorileri ve Sistemler](#6-tahmin-kategorileri-ve-sistemler)
7. [Tasarım Sistemi](#7-tasarım-sistemi)
8. [Interaksiyonlar ve Animasyonlar](#8-interaksiyonlar-ve-animasyonlar)

### 🔧 Teknik Detaylar
9. [UI States ve Durum Yönetimi](#9-ui-states-ve-durum-yönetimi)
10. [Validasyon Kuralları ve Kısıtlamalar](#10-validasyon-kuralları-ve-kısıtlamalar)
11. [Edge Cases ve Özel Durumlar](#11-edge-cases-ve-özel-durumlar)
12. [Mantıksal Geliştirmeler ve Öneriler](#12-mantıksal-geliştirmeler-ve-öneriler)
13. [Responsive Tasarım ve Breakpoints](#13-responsive-tasarım-ve-breakpoints)
14. [Animasyon Timing ve Easing](#14-animasyon-timing-ve-easing)
15. [Kullanıcı Akış Diyagramları](#15-kullanıcı-akış-diyagramları)
16. [Teknik Spesifikasyonlar](#16-teknik-spesifikasyonlar)
17. [Performans Metrikleri](#17-performans-metrikleri)
18. [Test Senaryoları](#18-test-senaryoları)
19. [Erişilebilirlik (Accessibility)](#19-erişilebilirlik-accessibility)
20. [Gelecekteki Özellikler (Roadmap)](#20-gelecekteki-özellikler-roadmap)

### 📝 Ek Bilgiler
- [Figma Tasarım İçin Öneriler](#-figma-tasarım-için-öneriler)
- [Öncelikli Ekranlar](#-öncelikli-ekranlar-figma-için)

---

## 1. UYGULAMA KONSEPTİ VE VİZYON

### 🎯 TacticIQ Nedir?

**TacticIQ**, futbol maçları için **skill-based (beceri tabanlı) tahmin ve analiz** uygulamasıdır. Kullanıcılar:

- ⚽ Maçlar hakkında detaylı tahminler yapar
- 👥 İlk 11'e oyuncuları yerleştirir ve oyuncu bazlı tahminler yapar
- 📊 Tahminlerinin doğruluğuna göre puan kazanır
- 🏆 Liderlik tablosunda sıralanır
- 📈 Performanslarını analiz eder ve geliştirir

### 🚫 Önemli Notlar

- ❌ **Bahis değildir** - Para kazanma/kaybetme yok
- ✅ **Skill-based** - Beceri ve bilgiye dayalı
- ✅ **Eğitici** - Futbol bilgisini geliştirir
- ✅ **Rekabetçi** - Liderlik tablosu ve rozetler

### 🎮 Temel Özellikler

1. **Maç Tahminleri** - Skor, kartlar, istatistikler
2. **Oyuncu Tahminleri** - İlk 11'deki oyuncular için detaylı tahminler
3. **Stratejik Odak Sistemi** - En güvenilen 3 tahmine odaklanma
4. **Antrenman Çarpanları** - Antrenman seçerek puan çarpanları kazanma
5. **Canlı Maç Takibi** - Maç sırasında gerçek zamanlı güncellemeler
6. **Performans Analizi** - Detaylı raporlar ve istatistikler
7. **Liderlik Tablosu** - Global ve sezon bazlı sıralamalar
8. **Rozet Sistemi** - Başarılar için rozetler

---

## 2. KULLANICI HİKAYESİ VE AKIŞ

### 🚀 İlk Açılış Akışı

```
1. SPLASH SCREEN (3 saniye)
   ↓
2. DİL SEÇİMİ (Türkçe/İngilizce)
   ↓
3. GİRİŞ/KAYIT EKRANI
   - Email ile kayıt
   - Google ile giriş
   - Apple ile giriş
   ↓
4. FAVORİ TAKIM SEÇİMİ
   - En az 1 takım seçilmeli
   - Maksimum 3 takım (Pro üyeler için daha fazla)
   ↓
5. ANA SAYFA (HOME)
   - Yaklaşan maçlar
   - Canlı maçlar
   - İstatistikler
```

### 🔄 Return User (Dönen Kullanıcı) Akışı

```
SPLASH SCREEN
   ↓
   (AsyncStorage kontrolü)
   ↓
ANA SAYFA (Doğrudan)
```

### 📱 Ana Navigasyon Yapısı

**3 Ana Tab:**

1. **🏠 Keşfet (Home)**
   - Yaklaşan maçlar
   - Canlı maçlar
   - Bugünün maçları
   - İstatistikler ve özetler

2. **⚽ Maçlar (Matches)**
   - Tüm maçlar listesi
   - Filtreleme (Lig, Tarih, Durum)
   - Arama

3. **👤 Profil (Profile)**
   - Kullanıcı bilgileri
   - Tahmin geçmişi
   - İstatistikler
   - Rozetler
   - Ayarlar
   - Pro Üyelik

---

## 3. TÜM EKRANLAR VE ÖZELLİKLER

### 📱 Ekran Listesi

#### 1. **Splash Screen**
- **Süre:** 3 saniye
- **İçerik:**
  - TacticIQ logosu
  - Animasyonlu yükleme
  - Arka plan: Yeşil gradient (stadyum teması)
- **Aksiyon:** Otomatik geçiş

#### 2. **Language Selection Screen**
- **İçerik:**
  - Türkçe / English seçenekleri
  - Büyük bayraklar veya dil isimleri
- **Aksiyon:** Dil seçimi → Auth ekranına geçiş

#### 3. **Auth Screen (Giriş/Kayıt)**
- **Sekmeler:** Giriş / Kayıt
- **Giriş Seçenekleri:**
  - Email + Şifre
  - Google ile Giriş
  - Apple ile Giriş
- **Kayıt Seçenekleri:**
  - Email + Şifre + İsim
  - Google ile Kayıt
  - Apple ile Kayıt
- **Ekstra:**
  - Şifremi Unuttum linki
- **Aksiyon:** Başarılı giriş → Favorite Teams

#### 4. **Favorite Teams Screen**
- **İçerik:**
  - Takım listesi (logo + isim)
  - Arama çubuğu
  - En az 1 takım seçilmeli
  - Maksimum 3 takım (Free), 5+ takım (Pro)
- **Aksiyon:** Seçim yap → Ana sayfa

#### 5. **Home Screen (Ana Sayfa)**
- **Bölümler:**
  1. **Header**
     - Kullanıcı avatarı
     - Bildirim ikonu
     - Pro badge (varsa)
  
  2. **Canlı Maçlar**
     - Şu anda oynanan maçlar
     - Skor, dakika, durum
  
  3. **Yaklaşan Maçlar**
     - Bugünün maçları
     - Yarının maçları
     - Favori takımların maçları vurgulu
  
  4. **İstatistikler Özeti**
     - Toplam tahmin sayısı
     - Başarı yüzdesi
     - Bu hafta kazanılan puan
     - Sıralama
  
  5. **Son Tahminler**
     - Son yapılan tahminler
     - Sonuç durumu (Doğru/Yanlış/Beklemede)

#### 6. **Matches Screen (Maçlar)**
- **Filtreler:**
  - Lig (Tümü, Süper Lig, Premier League, vb.)
  - Tarih (Bugün, Yarın, Bu Hafta, Tümü)
  - Durum (Yaklaşan, Canlı, Biten)
  - Favoriler (Sadece favori takımların maçları)
  
- **Maç Kartları:**
  - Ev sahibi takım (logo + isim)
  - Skor (yaklaşan maçlarda "VS")
  - Tarih ve saat
  - Lig bilgisi
  - Durum badge (Yaklaşan, Canlı, Biten)
  - Tahmin yapıldı mı? (badge)

#### 7. **Match Detail Screen (Maç Detayı)** ⭐ EN ÖNEMLİ EKRAN

**6 Sekme Yapısı:**

##### **Sekme 1: 📋 Kadro (Squad)**
- **İçerik:**
  - Futbol sahası görünümü
  - 26 farklı formasyon seçeneği
  - Formasyon seçim butonu
  - İlk 11 oyuncu yerleştirme
  - Yedek oyuncular listesi
  - Oyuncu kartları:
    - Oyuncu fotoğrafı
    - İsim
    - Pozisyon
    - Numara
    - Rating (1-10)
    - Form durumu (%)
  
- **İnteraksiyonlar:**
  - Formasyon seçimi → Saha pozisyonları güncellenir
  - Boş pozisyona tıklama → Oyuncu seçim modalı açılır
  - Oyuncu kartına tıklama → Oyuncu detay modalı
  - Oyuncu sürükle-bırak ile pozisyon değiştirme

##### **Sekme 2: 🎯 Tahmin (Prediction)** ⭐ EN DETAYLI SEKME

**Bölümler:**

1. **Antrenman Seçimi (Opsiyonel)**
   - 🛡️ Savunma Antrenmanı (+20% Disiplin + Fiziksel)
   - ⚔️ Hücum Antrenmanı (+20% Tempo + Bireysel)
   - 🎯 Orta Saha Antrenmanı (+15% Tempo + Disiplin)
   - 💪 Fiziksel Antrenman (+25% Fiziksel)
   - 🧠 Taktik Antrenmanı (+15% Tempo + Bireysel)

2. **Maç Tahminleri** ⭐ DETAYLI LİSTE

   **10 Ana Tahmin Kategorisi:**

   #### **Kategori 1: ⏱️ İlk Yarı Tahminleri**

   **1.1. ⚽ İlk Yarı Skoru**
   - **Ev Sahibi Golü:** 0, 1, 2, 3, 4, 5+ (6 seçenek)
   - **Deplasman Golü:** 0, 1, 2, 3, 4, 5+ (6 seçenek)
   - **Format:** Ev Sahibi - Deplasman (örn: 2-1)
   - **Odaklanılabilir:** ✅ Evet (⭐ ikonu ile)
   - **Puan:** Medium zorluk

   **1.2. ⏱️ İlk Yarı Uzatma Süresi**
   - **Seçenekler:**
     - +1 dk
     - +2 dk
     - +3 dk
     - +4 dk
     - +5+ dk
   - **Toplam:** 5 seçenek
   - **Odaklanılabilir:** ❌ Hayır
   - **Puan:** Medium zorluk

   #### **Kategori 2: ⏱️ Maç Sonu Tahminleri**

   **2.1. ⚽ Maç Sonu Skoru (İkinci Yarı Skoru)**
   - **Ev Sahibi Golü:** 0, 1, 2, 3, 4, 5+ (6 seçenek)
   - **Deplasman Golü:** 0, 1, 2, 3, 4, 5+ (6 seçenek)
   - **Format:** Ev Sahibi - Deplasman (örn: 3-2)
   - **Odaklanılabilir:** ✅ Evet (⭐ ikonu ile)
   - **Puan:** Medium zorluk
   - **Not:** Bu maçın final skorunu tahmin eder

   **2.2. ⏱️ İkinci Yarı Uzatma Süresi**
   - **Seçenekler:**
     - +1 dk
     - +2 dk
     - +3 dk
     - +4 dk
     - +5+ dk
   - **Toplam:** 5 seçenek
   - **Odaklanılabilir:** ❌ Hayır
   - **Puan:** Medium zorluk

   #### **Kategori 3: 🧮 Toplam Gol Sayısı**

   **3.1. ⚽ Toplam Gol Sayısı**
   - **Seçenekler:**
     - 0-1 gol
     - 2-3 gol
     - 4-5 gol
     - 6+ gol
   - **Toplam:** 4 seçenek
   - **Odaklanılabilir:** ✅ Evet (⭐ ikonu ile)
   - **Puan:** Very Easy zorluk
   - **Açıklama:** Maçta toplam kaç gol atılacağını tahmin eder

   #### **Kategori 4: ⏰ İlk Gol Zamanı**

   **4.1. ⏰ İlk Gol Zamanı**
   - **Seçenekler:**
     - 1-15 dk
     - 16-30 dk
     - 31-45 dk
     - 46-60 dk
     - 61-75 dk
     - 76-90+ dk
   - **Toplam:** 6 seçenek
   - **Odaklanılabilir:** ❌ Hayır
   - **Puan:** Medium zorluk
   - **Açıklama:** Maçta ilk golün hangi dakika aralığında atılacağını tahmin eder
   - **Not:** Eğer maçta gol olmazsa, tahmin yanlış sayılır

   #### **Kategori 5: 🟨🟥 Disiplin Tahminleri**

   **5.1. 🟨 Toplam Sarı Kart Sayısı**
   - **Seçenekler:**
     - 0-2
     - 3-4
     - 5-6
     - 7+
   - **Toplam:** 4 seçenek
   - **Odaklanılabilir:** ❌ Hayır
   - **Puan:** Easy zorluk
   - **Açıklama:** Maçta toplam kaç sarı kart gösterileceğini tahmin eder

   **5.2. 🟥 Toplam Kırmızı Kart Sayısı**
   - **Seçenekler:**
     - 0
     - 1
     - 2
     - 3+
   - **Toplam:** 4 seçenek
   - **Odaklanılabilir:** ❌ Hayır
   - **Puan:** Hard zorluk
   - **Açıklama:** Maçta toplam kaç kırmızı kart gösterileceğini tahmin eder

   #### **Kategori 6: 📊 Oyun Kontrolü – Topa Sahip Olma**

   **6.1. 🔵 Topa Sahip Olma Yüzdesi**
   - **Kontrol Tipi:** Slider (kaydırıcı)
   - **Ev Sahibi Aralığı:** 30% - 70%
   - **Adım:** 5% (30, 35, 40, 45, 50, 55, 60, 65, 70)
   - **Varsayılan:** 50% (Eşit)
   - **Görsel:** 
     - Sol tarafta "Ev Sahibi" ve yüzde
     - Sağ tarafta "Deplasman" ve yüzde (otomatik hesaplanır: 100 - Ev Sahibi)
     - Ortada "vs" yazısı
     - Slider'ın altında: "← Ev Sahibi Üstünlüğü" ve "Deplasman Üstünlüğü →"
   - **Odaklanılabilir:** ❌ Hayır
   - **Puan:** Very Easy zorluk
   - **Açıklama:** Maçta hangi takımın daha fazla topa sahip olacağını tahmin eder

   #### **Kategori 7: 🎯 Toplam ve İsabetli Şut Sayıları**

   **7.1. ⚽ Toplam Şut Sayısı**
   - **Seçenekler:**
     - 0-10
     - 11-20
     - 21-30
     - 31+
   - **Toplam:** 4 seçenek
   - **Odaklanılabilir:** ❌ Hayır
   - **Puan:** Medium zorluk
   - **Açıklama:** Maçta toplam kaç şut atılacağını tahmin eder (her iki takım toplamı)

   **7.2. 🎯 İsabetli Şut Sayısı**
   - **Seçenekler:**
     - 0-5
     - 6-10
     - 11-15
     - 16+
   - **Toplam:** 4 seçenek
   - **Odaklanılabilir:** ❌ Hayır
   - **Puan:** Medium zorluk
   - **Açıklama:** Maçta toplam kaç isabetli şut yapılacağını tahmin eder (her iki takım toplamı)

   #### **Kategori 8: ⚽ Toplam Korner Aralığı**

   **8.1. 🚩 Toplam Korner Sayısı**
   - **Seçenekler:**
     - 0-6
     - 7-12
     - 12+
   - **Toplam:** 3 seçenek
   - **Odaklanılabilir:** ❌ Hayır
   - **Puan:** Medium zorluk
   - **Açıklama:** Maçta toplam kaç korner kullanılacağını tahmin eder (her iki takım toplamı)

   #### **Kategori 9: ⚡ Maçın Genel Temposu**

   **9.1. 🏃‍♂️ Oyun Hızı / Tempo**
   - **Seçenekler:**
     - Düşük tempo
     - Orta tempo
     - Yüksek tempo
   - **Toplam:** 3 seçenek
   - **Odaklanılabilir:** ❌ Hayır
   - **Puan:** Easy zorluk
   - **Açıklama:** Maçın genel oyun hızını ve tempoyu tahmin eder
   - **Detaylar:**
     - **Düşük tempo:** Yavaş oyun, az pozisyon, kontrollü geçişler
     - **Orta tempo:** Dengeli oyun, normal pozisyon sayısı
     - **Yüksek tempo:** Hızlı oyun, çok pozisyon, hızlı geçişler

   #### **Kategori 10: 🧠 Maç Senaryosu (Makro)**

   **10.1. 🧠 Maç Senaryosu**
   - **Seçenekler:**
     - Kontrollü oyun
     - Baskılı oyun
     - Geçiş oyunu ağırlıklı
     - Duran toplar belirleyici olur
   - **Toplam:** 4 seçenek
   - **Görsel:** Grid layout (2x2)
   - **Odaklanılabilir:** ❌ Hayır
   - **Puan:** Easy zorluk
   - **Açıklama:** Maçın genel oyun karakterini ve senaryosunu tahmin eder
   - **Detaylar:**
     - **Kontrollü oyun:** Takımlar topa sahip olmaya çalışır, yavaş tempo
     - **Baskılı oyun:** Yüksek pres, hızlı tempo, çok pozisyon
     - **Geçiş oyunu ağırlıklı:** Hızlı kontra-ataklar, ani geçişler
     - **Duran toplar belirleyici olur:** Korner, frikik, penaltı önemli

   ---

   ### 📊 Tahmin Özet Tablosu

   | # | Tahmin Kategorisi | Seçenek Sayısı | Odaklanılabilir | Zorluk | Puan (Baz) |
   |---|-------------------|----------------|-----------------|--------|------------|
   | 1 | İlk Yarı Skoru | 6x6 = 36 kombinasyon | ✅ Evet | Medium | 15-25 |
   | 2 | İlk Yarı Uzatma | 5 | ❌ Hayır | Medium | 10-15 |
   | 3 | Maç Sonu Skoru | 6x6 = 36 kombinasyon | ✅ Evet | Medium | 15-25 |
   | 4 | İkinci Yarı Uzatma | 5 | ❌ Hayır | Medium | 10-15 |
   | 5 | Toplam Gol Sayısı | 4 | ✅ Evet | Very Easy | 5-10 |
   | 6 | İlk Gol Zamanı | 6 | ❌ Hayır | Medium | 10-15 |
   | 7 | Toplam Sarı Kart | 4 | ❌ Hayır | Easy | 8-12 |
   | 8 | Toplam Kırmızı Kart | 4 | ❌ Hayır | Hard | 15-20 |
   | 9 | Topa Sahip Olma | 9 (slider) | ❌ Hayır | Very Easy | 5-8 |
   | 10 | Toplam Şut | 4 | ❌ Hayır | Medium | 10-15 |
   | 11 | İsabetli Şut | 4 | ❌ Hayır | Medium | 10-15 |
   | 12 | Toplam Korner | 3 | ❌ Hayır | Medium | 10-15 |
   | 13 | Maç Temposu | 3 | ❌ Hayır | Easy | 8-12 |
   | 14 | Maç Senaryosu | 4 | ❌ Hayır | Easy | 8-12 |

   **Toplam:** 14 farklı tahmin kategorisi, **3 tanesi odaklanılabilir** (⭐)

   ---

   ### 🎯 Odaklanılabilir Tahminler (Stratejik Odak)

   Sadece **3 tahmin** odaklanılabilir (⭐ ikonu ile işaretlenebilir):

   1. ✅ **İlk Yarı Skoru** (Ev Sahibi veya Deplasman ayrı ayrı)
   2. ✅ **Maç Sonu Skoru** (Ev Sahibi veya Deplasman ayrı ayrı)
   3. ✅ **Toplam Gol Sayısı**

   **Odak Çarpanları:**
   - ✅ **Doğru tahmin:** 2.0x puan (ikiye katlanır)
   - ❌ **Yanlış tahmin:** -1.5x puan (ceza olarak düşer)

   **Örnek:**
   - Toplam Gol Sayısı tahmini: "2-3 gol"
   - Baz puan: 10
   - Odak: ✅ Evet
   - Sonuç: Maçta 2 gol atıldı → Doğru tahmin
   - **Kazanılan Puan:** 10 × 2.0 = **20 puan**
   
   Eğer yanlış olsaydı:
   - **Kaybedilen Puan:** 10 × -1.5 = **-15 puan** (ceza)

3. **Oyuncu Tahminleri** (İlk 11'deki oyuncular için)
   - **Detaylar için:** [Oyuncu Kartı Tahmin Sistemi](#4-oyuncu-kartı-tahmin-sistemi) bölümüne bakın

4. **Stratejik Odak Sistemi** ⭐
   - En güvenilen **maksimum 3 tahmin** seçilebilir
   - ⭐ İkonu ile işaretleme
   - **Çarpanlar:**
     - ✅ Doğru tahmin: **2.0x puan**
     - ❌ Yanlış tahmin: **-1.5x puan** (ceza)
   - Odaklanılan tahminler altın sarısı (#F59E0B) ile vurgulanır

5. **Tahmin Kaydetme**
   - "Tahminleri Kaydet" butonu
   - Validasyon: En az 1 tahmin yapılmalı
   - Başarı mesajı

##### **Sekme 3: ⚡ Canlı (Live)**
- **İçerik:**
  - Canlı skor (büyük, vurgulu)
  - Dakika göstergesi
  - Momentum göstergesi (← → ↗ ↘)
  - Canlı olaylar akışı:
    - ⚽ Gol (oyuncu, dakika, asist)
    - 🟨 Sarı kart (oyuncu, dakika)
    - 🟥 Kırmızı kart (oyuncu, dakika)
    - 🔄 Oyuncu değişikliği (çıkan, giren, dakika)
    - ⚠️ Pozisyon (açıklama)
    - 📊 İstatistik güncellemesi
  - Otomatik yenileme (her 30 saniye)

##### **Sekme 4: 📊 İstatistik (Stats)**
- **İçerik:**
  - **Topa Sahip Olma:** Ev Sahibi % vs Deplasman %
  - **Şutlar:** Toplam şut, İsabetli şut (grafik)
  - **Kornerler:** Ev Sahibi vs Deplasman
  - **Pas İsabeti:** Ev Sahibi % vs Deplasman %
  - **Top Kontrolü:** Ev Sahibi % vs Deplasman %
  - **Tehlikeli Ataklar:** Ev Sahibi vs Deplasman
  - **Faul Sayısı:** Ev Sahibi vs Deplasman
  - **Ofsayt:** Ev Sahibi vs Deplasman
  - Grafikler: Bar chart, Pie chart, Line chart

##### **Sekme 5: ⭐ Reyting (Ratings)**
- **İçerik:**
  - **Maçın Adamı (Man of the Match)**
    - Oyuncu fotoğrafı, isim, rating (1-10)
    - Performans özeti
  
  - **Oyuncu Reytingleri (İlk 11)**
    - Her oyuncu için:
      - Fotoğraf
      - İsim, pozisyon
      - Rating (1-10)
      - Performans detayları:
        - Pas isabeti %
        - Top kontrolleri
        - Şut sayısı
        - Foul sayısı
        - Diğer istatistikler
  
  - **Yedek Oyuncular Reytingleri**
    - Sınırlı istatistikler

##### **Sekme 6: 📄 Özet (Summary)** ⭐ DETAYLI BÖLÜM

**2 Alt Sekme:**

###### **Alt Sekme 1: 🏆 Tahmin Özeti**

1. **Bu Maçtan Alınan Puanlar Kartı**
   - **TOPLAM PUAN:** Büyük sayı / Maksimum puan
   - **BAŞARI:** Yüzde (%)
   - Progress bar (başarı yüzdesine göre)
   - **Puan Dağılımı:**
     - Maç Tahminleri: X puan
     - Oyuncu Tahminleri: X puan
     - Bonus: +X puan
     - Ceza: -X puan
   - **Doğruluk Grid:**
     - ✅ Doğru: X adet
     - ❌ Yanlış: X adet
     - ⚪ Boş: X adet

2. **Tahmin Analizi Kartı**
   - **Erken Bonus Badge:** (varsa) "+X Erken Bonus"
   - **Tahmin Listesi:**
     - Her tahmin için kart:
       - ✅/❌ Durum ikonu
       - Tahmin adı
       - **Tahmin:** Kullanıcının tahmini
       - **Sonuç:** Gerçek sonuç
       - **Açıklama:** Neden doğru/yanlış olduğu
       - **Puan:** +X veya 0
   - "X Tahmin Daha Göster" butonu
   - **Tahmin Zamanı:** "Tahminler maçtan X saat önce yapıldı"

3. **Kullanıcı Karşılaştırması Kartı**
   - "X% kullanıcıdan daha iyi performans gösterdin!"
   - **İstatistikler:**
     - **Sıralama:** #X / Toplam kullanıcı
     - **Ortalama:** X puan
     - **En Yüksek:** X puan
   - **Puan Dağılımı Grafiği:**
     - 0-30, 30-60, 60-90, 90-120, 120-150, 150-180 aralıkları
     - Her aralık için bar chart
     - Kullanıcının aralığı vurgulu

4. **Performans Etiketleri**
   - Otomatik oluşturulan etiketler:
     - 🎯 "Analist Seviye Okuma"
     - ⭐ "Oyuncu Tahminlerinde Güçlü"
     - 📊 "İstatistik Uzmanı"
     - vb.
   - Her etiket için ikon + açıklama

5. **Geçmiş Performans**
   - **Son 5 Maç Ortalaması:** X puan
   - **Bu Maç:** X puan (+/- fark)
   - **Son Maçlar Listesi:**
     - Her maç için:
       - Rakip takım
       - Tarih
       - Kazanılan puan
       - Ortalama üstünde mi? (yeşil nokta)
   - **Ekstremler:**
     - En İyi: X puan
     - En Düşük: X puan

6. **Gizlilik Notu**
   - "🔒 Gizlilik: Diğer kullanıcıların tahminleri görünmez. Karşılaştırmalar anonim ve istatistikseldir."

###### **Alt Sekme 2: 📊 Takım Durumu**

1. **Hero Kart (Lig Durumu)**
   - Lig adı
   - Sıralama (büyük sayı)
   - Toplam takım sayısı
   - **İstatistikler Grid:**
     - Maç: X
     - Galibiyet: X
     - Beraberlik: X
     - Mağlubiyet: X
   - **Gol İstatistikleri:**
     - Atılan: X
     - Averaj: +X
     - Yenilen: X

2. **Puan Durumu Tablosu**
   - İlk 5 takım:
     - Sıra
     - Takım adı
     - Oynanan (O)
     - Averaj (A)
     - Puan (P)
   - Kullanıcının takımı vurgulu

3. **Form Durumu**
   - Son 5 maç sonuçları: W (Win), D (Draw), L (Loss)
   - Her sonuç için renkli badge
   - **Seri Kartı:**
     - 🔥 "X Maç Galibiyet Serisi" (veya beraberlik/mağlubiyet)

4. **İç Saha / Dış Saha İstatistikleri**
   - **İç Saha Kartı:**
     - Maç sayısı
     - Galibiyet sayısı
     - Atılan gol
     - Yenilen gol
   - **Dış Saha Kartı:**
     - Aynı istatistikler

#### 8. **Profile Screen (Profil)**
- **Bölümler:**
  1. **Profil Header**
     - Avatar
     - İsim
     - Email
     - Pro badge (varsa)
  
  2. **İstatistikler Grid**
     - Toplam Tahmin: X
     - Başarı Oranı: X%
     - Toplam Puan: X
     - Sıralama: #X
  
  3. **Rozetler**
     - Kazanılan rozetler grid
     - Her rozet için:
       - İkon
       - İsim
       - Açıklama
       - Kazanma tarihi
  
  4. **Son Tahminler**
     - Son yapılan tahminler listesi
  
  5. **Menü Seçenekleri**
     - ⚙️ Ayarlar
     - 🔔 Bildirimler
     - 🔒 Şifre Değiştir
     - ⭐ Pro Üyelik
     - 📄 Yasal Belgeler
     - 🗑️ Hesabı Sil
     - 🚪 Çıkış Yap

#### 9. **Leaderboard Screen (Liderlik Tablosu)**
- **Filtreler:**
  - Zaman (Bu Hafta, Bu Ay, Bu Sezon, Tüm Zamanlar)
  - Lig (Tümü, Süper Lig, vb.)
  
- **Sıralama:**
  - Top 100 kullanıcı
  - Her kullanıcı için:
    - Sıra
    - Avatar
    - İsim
    - Toplam puan
    - Başarı yüzdesi
    - Tahmin sayısı
    - Kullanıcının kendi sırası vurgulu

#### 10. **Pro Upgrade Screen**
- **İçerik:**
  - Pro özellikleri listesi:
    - ✅ Sınırsız favori takım
    - ✅ Gelişmiş istatistikler
    - ✅ Özel rozetler
    - ✅ Reklamsız deneyim
    - ✅ Öncelikli destek
  - Fiyatlandırma seçenekleri:
    - Aylık: X₺
    - Yıllık: X₺ (X% indirim)
  - Ödeme butonları

---

## 4. OYUNCU KARTI TAHMİN SİSTEMİ ⭐

### 🎯 Oyuncu Kartına Tıklama Akışı

**1. İlk 11'deki Oyuncu Kartına Tıklama**

Oyuncu kartı şunları içerir:
- Oyuncu fotoğrafı
- İsim
- Pozisyon
- Numara
- Rating (1-10)
- Form durumu (%)
- Tahmin yapıldı mı? (badge - sağ üst köşede nokta)

**2. Oyuncu Tahmin Modalı Açılır**

Modal içeriği:

#### **Modal Header:**
- Kapat butonu (X)
- Oyuncu numarası (büyük, daire içinde)
- Rating (küçük, daire içinde)
- Oyuncu ismi (büyük)
- Pozisyon + Form durumu

#### **Tahmin Seçenekleri (Scroll edilebilir):**

##### **1. ⚽ Gol Atar**
- Ana buton: "⚽ Gol Atar" (Toggle)
- **Alt Seçenekler:**
  - "Kaç gol?" seçimi:
    - 1 gol
    - 2 gol
    - 3+ gol

##### **2. 🅰️ Asist Yapar**
- Ana buton: "🅰️ Asist Yapar" (Toggle)
- **Alt Seçenekler:**
  - "Kaç asist?" seçimi:
    - 1 asist
    - 2 asist
    - 3+ asist

##### **3. 🟨 Sarı Kart Görür**
- Ana buton: "🟨 Sarı Kart Görür" (Toggle)
- Tek seçenek (evet/hayır)

##### **4. 🟨🟥 2. Sarıdan Kırmızı**
- Ana buton: "🟨🟥 2. Sarıdan Kırmızı" (Toggle)
- **Not:** Bu seçilirse otomatik olarak "Sarı Kart" da seçilir
- Tek seçenek (evet/hayır)

##### **5. 🟥 Direkt Kırmızı Kart**
- Ana buton: "🟥 Direkt Kırmızı Kart" (Toggle)
- Tek seçenek (evet/hayır)

##### **6. 🔄 Oyundan Çıkar (Normal Değişiklik)**
- Ana buton: "🔄 Oyundan Çıkar" (Toggle)
- **Alt Seçenekler:**
  - "Yerine Kim Girer?" modalı açılır
  - Yedek oyuncular listesi:
    - Her oyuncu için:
      - Fotoğraf
      - İsim
      - Pozisyon
      - Numara
  - Seçilen oyuncu gösterilir:
    - "🔄 [Oyuncu Adı] çıkar - [Yedek Oyuncu] girer"
  - "Değiştir" butonu (seçimi değiştirmek için)

##### **7. 🚑 Sakatlanarak Çıkar**
- Ana buton: "🚑 Sakatlanarak Çıkar" (Toggle)
- **Alt Seçenekler:**
  - "Sakatlık Yedeği" modalı açılır
  - Yedek oyuncular listesi (aynı format)
  - Seçilen oyuncu gösterilir:
    - "🚑 [Oyuncu Adı] çıkar - [Yedek Oyuncu] girer"
  - "Değiştir" butonu

#### **Modal Footer:**
- **İptal Et** butonu (gri)
- **Kaydet** butonu (yeşil gradient)

### 📊 Tahmin Kategorileri ve Puanlar

| Tahmin Kategorisi | Zorluk | Baz Puan | Odak Çarpanı (Doğru) | Odak Çarpanı (Yanlış) |
|-------------------|--------|----------|---------------------|---------------------|
| Gol Atar (1 gol) | Hard | 15 | 2.0x = 30 | -1.5x = -22.5 |
| Gol Atar (2 gol) | Very Hard | 25 | 2.0x = 50 | -1.5x = -37.5 |
| Gol Atar (3+ gol) | Expert | 35 | 2.0x = 70 | -1.5x = -52.5 |
| Asist Yapar (1) | Hard | 12 | 2.0x = 24 | -1.5x = -18 |
| Asist Yapar (2) | Very Hard | 20 | 2.0x = 40 | -1.5x = -30 |
| Asist Yapar (3+) | Expert | 28 | 2.0x = 56 | -1.5x = -42 |
| Sarı Kart | Hard | 10 | 2.0x = 20 | -1.5x = -15 |
| 2. Sarıdan Kırmızı | Expert | 30 | 2.0x = 60 | -1.5x = -45 |
| Direkt Kırmızı | Very Hard | 25 | 2.0x = 50 | -1.5x = -37.5 |
| Oyundan Çıkar | Hard | 8 | 2.0x = 16 | -1.5x = -12 |
| Sakatlanarak Çıkar | Very Hard | 20 | 2.0x = 40 | -1.5x = -30 |

### 🎯 Stratejik Odak Sistemi (Oyuncu Tahminleri için)

- Her oyuncu tahmini için ⭐ ikonu
- Maksimum 3 odak seçilebilir (tüm tahminler içinde)
- Odaklanılan tahminler altın sarısı (#F59E0B) ile vurgulanır
- Odak sayısı info banner'da gösterilir: "3/3 Odak Seçildi"

---

## 5. MAÇ ÖZET SAYFASI DETAYLARI ⭐

### 📄 Match Summary Screen - Tam İçerik

**2 Ana Sekme:**

### **SEKME 1: 🏆 Tahmin Özeti**

#### **1. Bu Maçtan Alınan Puanlar Kartı**

**Görsel Yapı:**
- Altın sarısı gradient arka plan (#F59E0B)
- Border: 2px altın sarısı

**İçerik:**
- **Header:**
  - 🏆 İkon
  - "Bu Maçtan Alınan Puanlar" başlığı

- **Ana Metrikler:**
  - **TOPLAM PUAN:** 
    - Büyük sayı (32px, bold, altın sarısı)
    - "/ Maksimum Puan" (16px, gri)
  - **BAŞARI:**
    - Yüzde (24px, bold, yeşil)
  
- **Progress Bar:**
  - Tam genişlik, 8px yükseklik
  - Arka plan: açık gri
  - Doluluk: Başarı yüzdesine göre yeşil-altın gradient
  - Animasyonlu dolum

- **Puan Dağılımı Grid (4 sütun):**
  - **Maç Tahminleri:** X puan (beyaz, bold)
  - **Oyuncu Tahminleri:** X puan (beyaz, bold)
  - **Bonus:** +X puan (yeşil, bold) - özel arka plan
  - **Ceza:** X puan (gri, bold)
  - Her biri için küçük label (gri, uppercase)

- **Doğruluk Grid (3 sütun):**
  - **✅ Doğru:** X adet (yeşil ikon + sayı)
  - **❌ Yanlış:** X adet (gri ikon + sayı)
  - **⚪ Boş:** X adet (boş daire ikon + sayı)

#### **2. Tahmin Analizi Kartı**

**Görsel Yapı:**
- Koyu gri arka plan (#1E293B)
- Border: 1px açık gri

**İçerik:**
- **Header:**
  - 📊 İkon
  - "Tahmin Analizi" başlığı
  - **Erken Bonus Badge:** (varsa)
    - ⚡ İkon
    - "+X Erken Bonus" metni
    - Yeşil arka plan

- **Tahmin Listesi:**
  - Her tahmin için kart:
    - **Durum İkonu:** ✅ (yeşil) veya ❌ (gri)
    - **Tahmin Adı:** Bold, beyaz
    - **Detaylar Satırı:**
      - "Tahmin: [Kullanıcının tahmini]" (gri)
      - "•" (nokta)
      - "Sonuç: [Gerçek sonuç]" (beyaz, bold)
    - **Açıklama:** İtalik, gri, küçük font
      - Örnek: "Maç 2-1 bitti, tahmin aralığı tuttu"
    - **Puan:** Sağ tarafta, büyük, bold
      - ✅ Doğru: Altın sarısı (#F59E0B)
      - ❌ Yanlış: Gri
  
  - İlk 3 tahmin gösterilir
  - "X Tahmin Daha Göster" butonu (varsa)
  - Tıklanınca tüm tahminler gösterilir

- **Tahmin Zamanı:**
  - ⏰ İkon
  - "Tahminler maçtan [X saat önce] yapıldı" metni
  - Bold: zaman bilgisi

#### **3. Kullanıcı Karşılaştırması Kartı**

**Görsel Yapı:**
- Yeşil gradient arka plan (hafif şeffaf)
- Border: 1px yeşil

**İçerik:**
- **Ana Mesaj:**
  - "[X]% kullanıcıdan daha iyi performans gösterdin!"
  - X sayısı: Büyük, yeşil, bold

- **İstatistikler Grid (3 sütun):**
  - **Sıralama:**
    - Label: "Sıralama" (gri, küçük)
    - Değer: "#X" (beyaz, bold)
    - Alt: "/ Toplam kullanıcı" (gri, küçük)
  
  - **Ortalama:**
    - Label: "Ortalama" (gri, küçük)
    - Değer: "X" (beyaz, bold)
    - Alt: "puan" (gri, küçük)
  
  - **En Yüksek:**
    - Label: "En Yüksek" (gri, küçük)
    - Değer: "X" (altın sarısı, bold)
    - Alt: "puan" (gri, küçük)

- **Puan Dağılımı Grafiği:**
  - Başlık: "PUAN DAĞILIMI" (gri, küçük, uppercase)
  - Her aralık için satır:
    - **Aralık:** 0-30, 30-60, 60-90, 90-120, 120-150, 150-180
    - **Bar Chart:**
      - Arka plan bar (gri, şeffaf)
      - Doluluk bar (gri, yarı şeffaf)
      - Kullanıcının aralığı: Yeşil gradient, "SEN" etiketi
    - **Sayı:** Sağda, gri

#### **4. Performans Etiketleri**

**Görsel Yapı:**
- Koyu gri arka plan kartı

**İçerik:**
- **Header:**
  - 🏅 İkon
  - "Performans Etiketleri" başlığı

- **Etiketler Grid:**
  - Her etiket için:
    - İkon (emoji veya ikon)
    - Etiket adı (bold, beyaz)
    - Yeşil arka plan, border, rounded

- **Not:**
  - "Bu etiketler performansına göre otomatik oluşturuldu ve profil istatistiklerinde görünecek"
  - İtalik, gri, küçük

#### **5. Geçmiş Performans**

**Görsel Yapı:**
- Koyu gri arka plan kartı

**İçerik:**
- **Header:**
  - 📈 İkon
  - "Geçmiş Performans" başlığı

- **Karşılaştırma Kartı:**
  - **Son 5 Maç Ortalaması:** X puan (gri label, beyaz değer)
  - **Bu Maç:** X puan (+/- fark) (gri label, beyaz değer + yeşil/kırmızı fark)

- **Son Maçlar Listesi:**
  - Her maç için satır:
    - **Sol:**
      - Nokta (yeşil: ortalamanın üstünde, gri: altında)
      - Rakip takım adı
    - **Sağ:**
      - Tarih (gri, küçük)
      - Puan (beyaz, bold)

- **Ekstremler Grid (2 sütun):**
  - **En İyi:** X puan (yeşil arka plan)
  - **En Düşük:** X puan (gri arka plan)

#### **6. Gizlilik Notu**

**Görsel Yapı:**
- Dashed border, gri arka plan

**İçerik:**
- 🔒 İkon
- "Gizlilik: Diğer kullanıcıların tahminleri görünmez. Karşılaştırmalar anonim ve istatistikseldir."
- Gri, küçük, ortalanmış

---

### **SEKME 2: 📊 Takım Durumu**

#### **1. Hero Kart (Lig Durumu)**

**Görsel Yapı:**
- Yeşil gradient arka plan (#059669 → #047857)
- Büyük, vurgulu

**İçerik:**
- **Header:**
  - Lig adı (küçük, şeffaf beyaz)
  - Sıralama (büyük, 40px, bold, beyaz)
  - "Sırada • Toplam Takım" (beyaz)
  - 🛡️ İkon (sağ üst, büyük daire içinde)

- **İstatistikler Grid (4 sütun):**
  - **Maç:** X (büyük, beyaz, bold)
  - **Galibiyet:** X (büyük, beyaz, bold)
  - **Beraberlik:** X (büyük, beyaz, bold)
  - **Mağlubiyet:** X (büyük, beyaz, bold)
  - Her biri için küçük label (şeffaf beyaz, uppercase)

- **Divider:** Yatay çizgi (şeffaf beyaz)

- **Gol İstatistikleri Grid (3 sütun):**
  - **Atılan:** X (büyük, beyaz, bold)
  - **Averaj:** +X (büyük, altın sarısı, bold)
  - **Yenilen:** X (büyük, beyaz, bold)
  - Her biri için label (şeffaf beyaz)

#### **2. Puan Durumu Tablosu**

**Görsel Yapı:**
- Koyu gri arka plan kartı

**İçerik:**
- **Header:**
  - 🏆 İkon
  - "Puan Durumu" başlığı
  - **Puan Badge:** X Puan (altın sarısı arka plan)

- **Tablo:**
  - İlk 5 takım listesi
  - Her satır için:
    - **Sıra:** Kare içinde sayı (gri arka plan)
      - Kullanıcının takımı: Yeşil arka plan, beyaz yazı
    - **Takım Adı:** Bold, beyaz
      - Kullanıcının takımı: Sol tarafta yeşil border
    - **Oynanan (O):** Gri, ortalanmış
    - **Averaj (A):** Gri, ortalanmış
    - **Puan (P):** Beyaz, bold, ortalanmış

- **Legend:**
  - "O: Oynanan • A: Averaj • P: Puan"
  - Gri, küçük, ortalanmış

#### **3. Form Durumu**

**Görsel Yapı:**
- Koyu gri arka plan kartı

**İçerik:**
- **Header:**
  - 📊 İkon
  - "Form Durumu" başlığı

- **Form Badges:**
  - "Son 5 Maç" label
  - 5 badge (W/D/L):
    - **W (Win):** Yeşil arka plan, yeşil border, yeşil yazı
    - **D (Draw):** Gri arka plan, gri border, gri yazı
    - **L (Loss):** Kırmızı arka plan, kırmızı border, kırmızı yazı
  - Her badge: 40x40px, kare, bold yazı

- **Seri Kartı:**
  - 🔥 İkon (büyük)
  - "X Maç Galibiyet Serisi" (veya beraberlik/mağlubiyet)
  - Altın sarısı arka plan, border

#### **4. İç Saha / Dış Saha İstatistikleri**

**Görsel Yapı:**
- Koyu gri arka plan kartı

**İçerik:**
- **Header:**
  - 🏠 İkon
  - "İç Saha / Dış Saha" başlığı

- **2 Kart (Yan Yana):**
  - **İç Saha Kartı:**
    - 🏠 İkon + "İç Saha" başlığı
    - **İstatistikler Grid (4 sütun):**
      - Maç: X
      - Galibiyet: X
      - Atılan: X
      - Yenilen: X
  
  - **Dış Saha Kartı:**
    - ✈️ İkon + "Dış Saha" başlığı
    - Aynı istatistikler grid

---

## 6. TAHMİN KATEGORİLERİ VE SİSTEMLER

### 📊 Tahmin Kategorileri (4 Analiz Kümesi)

#### **⚡ Tempo & Akış (TEMPO_FLOW)**
- İlk gol dakikası
- İlk yarı uzatma süresi
- İkinci yarı uzatma süresi
- Maç temposu
- Maç senaryosu
- Toplam gol sayısı

#### **💪 Fiziksel & Yıpranma (PHYSICAL_FATIGUE)**
- Sakatlık tahminleri
- Oyuncu değişiklikleri (normal)
- Sakatlık yedeği tahminleri
- Yedek oyuncu tahminleri

#### **🟨 Disiplin (DISCIPLINE)**
- Toplam sarı kart sayısı
- Toplam kırmızı kart sayısı
- İkinci sarıdan kırmızı (oyuncu bazlı)
- Direkt kırmızı kart (oyuncu bazlı)
- Penaltı olur mu?

#### **⭐ Bireysel Performans (INDIVIDUAL)**
- Maçın adamı
- İlk golü atan oyuncu
- Gol atan oyuncular (oyuncu bazlı)
- Asist yapan oyuncular (oyuncu bazlı)
- İlk yarı skoru
- İkinci yarı skoru

### 💪 Antrenman Çarpan Sistemi

| Antrenman | Etkilenen Kümeler | Çarpan |
|-----------|-------------------|--------|
| 🛡️ Savunma | Disiplin + Fiziksel | +20% |
| ⚔️ Hücum | Tempo + Bireysel | +20% |
| 🎯 Orta Saha | Tempo + Disiplin | +15% |
| 💪 Fiziksel | Fiziksel | +25% |
| 🧠 Taktik | Tempo + Bireysel | +15% |

**Örnek:**
- Oyuncu "Savunma Antrenmanı" seçer
- Disiplin kümesinden 20 puan kazanır
- Çarpan uygulanır: 20 × 1.2 = **24 puan**

### ⭐ Stratejik Odak Sistemi (Focus/Star)

**Kurallar:**
- Maksimum **3 tahmin** odak olarak işaretlenebilir
- Odaklanılan tahminler ⭐ ikonu ile gösterilir
- Altın sarısı (#F59E0B) ile vurgulanır

**Çarpanlar:**
- ✅ **Doğru tahmin:** 2.0x puan (ikiye katlanır)
- ❌ **Yanlış tahmin:** -1.5x puan (ceza olarak düşer)

**Örnek:**
- Baz Puan: 20
- Odak: Evet
- Doğru tahmin: 20 × 2.0 = **40 puan**
- Yanlış tahmin: 20 × -1.5 = **-30 puan**

### 📈 Puan Hesaplama Formülü

```
Final Puan = Baz Puan × Antrenman Çarpanı × Odak Çarpanı
```

**Örnek:**
- Baz Puan: 20 (Orta zorluk tahmin)
- Antrenman: Savunma (+20% Disiplin)
- Odak: Evet (Doğru = 2x)
- **Sonuç:** 20 × 1.2 × 2.0 = **48 puan**

---

## 7. TASARIM SİSTEMİ

### 🎨 Renkler

#### **Brand Colors:**
- **Emerald (Yeşil):** #059669 (Primary)
- **Emerald Dark:** #047857
- **Gold (Altın Sarısı):** #F59E0B (Secondary)
- **Gold Dark:** #D97706

#### **Background Colors:**
- **Dark Background:** #0F172A (Ana arka plan)
- **Card Background:** #1E293B (Kart arka planı)
- **Light Card:** #334155

#### **Text Colors:**
- **Primary Text:** #F8FAFB (Beyaz)
- **Secondary Text:** #94A3B8 (Açık gri)
- **Tertiary Text:** #64748B (Koyu gri)

#### **Status Colors:**
- **Success:** #059669 (Yeşil)
- **Warning:** #F59E0B (Altın sarısı)
- **Error:** #EF4444 (Kırmızı)
- **Info:** #3B82F6 (Mavi)

### 📐 Spacing

- **xs:** 4px
- **sm:** 8px
- **base:** 16px
- **lg:** 24px
- **xl:** 32px
- **2xl:** 48px

### 🔤 Typography

#### **Font Sizes:**
- **xs:** 10px
- **sm:** 12px
- **base:** 14px
- **lg:** 16px
- **xl:** 20px
- **2xl:** 24px
- **3xl:** 32px
- **4xl:** 40px

#### **Font Weights:**
- **Normal:** 400
- **Medium:** 500
- **Bold:** 700

### 🎭 Gradients

#### **Auth Gradient (Lacivert):**
```css
['#1E3A8A', '#1E40AF']
```

#### **Stadium Gradient (Yeşil):**
```css
['#059669', '#047857']
```

#### **Primary Button Gradient:**
```css
['#059669', '#047857']
```

#### **Gold Gradient:**
```css
['#F59E0B', '#D97706']
```

### 📏 Border Radius

- **sm:** 4px
- **base:** 8px
- **lg:** 12px
- **xl:** 16px
- **full:** 9999px (daire)

### 🎯 Component Sizes

- **Button Height:** 50px
- **Input Height:** 50px
- **Card Padding:** 16px
- **Tab Height:** 50px
- **Bottom Nav Height:** 60px (iOS), 56px (Android)

---

## 8. İNTERAKSİYONLAR VE ANİMASYONLAR

### ✨ Animasyonlar

#### **Screen Transitions:**
- **Slide from Right:** Yeni ekrana geçiş
- **Slide from Bottom:** Modal açılışı
- **Fade In:** İçerik yüklenmesi

#### **Component Animations:**
- **FadeIn:** Kartlar, listeler
- **FadeInDown:** Bölümler
- **FadeInLeft:** Liste öğeleri
- **SlideInDown:** Modal açılışı
- **Scale:** Buton tıklamaları

#### **Loading States:**
- **Skeleton Loaders:** İçerik yüklenirken
- **Spinner:** Küçük yüklemeler
- **Progress Bar:** İlerleme göstergesi

### 🎮 İnteraksiyonlar

#### **Touch Feedback:**
- **activeOpacity:** 0.7 (butonlar)
- **activeOpacity:** 0.8 (kartlar)
- **Press Animation:** Hafif scale (0.95)

#### **Scroll Behavior:**
- **Smooth Scrolling:** Tüm scrollable alanlar
- **Pull to Refresh:** Liste ekranları
- **Infinite Scroll:** Liderlik tablosu (gelecekte)

#### **Modal Behavior:**
- **Backdrop:** Şeffaf siyah (%50 opacity)
- **Close on Backdrop:** Evet (opsiyonel)
- **Swipe to Dismiss:** Hayır (güvenlik için)

### 📱 Platform Specific

#### **iOS:**
- **Safe Area:** Notch desteği
- **Status Bar:** Light content
- **Haptic Feedback:** Buton tıklamaları

#### **Android:**
- **Status Bar:** Dark content
- **Back Button:** Sistem geri butonu
- **Ripple Effect:** Material Design

---

## 9. UI STATES VE DURUM YÖNETİMİ

### 🔄 Loading States (Yükleme Durumları)

#### **1. İlk Yükleme (Initial Load)**
- **Görsel:** Büyük spinner (ActivityIndicator) + "Yükleniyor..." metni
- **Renk:** #059669 (yeşil)
- **Konum:** Ekranın ortası
- **Kullanım:**
  - Uygulama ilk açıldığında
  - Maç listesi yüklenirken
  - Profil verileri çekilirken

#### **2. Skeleton Loaders (İçerik Yer Tutucuları)**
- **Görsel:** Gri kutular, animasyonlu pulse efekti
- **Kullanım:**
  - Maç kartları yüklenirken
  - Liderlik tablosu yüklenirken
  - Profil istatistikleri yüklenirken
- **Avantaj:** Kullanıcı içeriğin yapısını görür, daha iyi UX

#### **3. Pull-to-Refresh (Aşağı Çekerek Yenileme)**
- **Görsel:** Yukarıdan aşağı çekince spinner görünür
- **Kullanım:**
  - Maç listesi
  - Canlı maçlar
  - Liderlik tablosu
- **Animasyon:** Smooth, native feel

#### **4. Lazy Loading (Tembel Yükleme)**
- **Görsel:** Liste sonuna gelince otomatik yükleme
- **Kullanım:**
  - Maç listesi (sayfalama)
  - Liderlik tablosu (top 100)
- **Gösterge:** Liste sonunda küçük spinner

### ❌ Error States (Hata Durumları)

#### **1. Network Error (İnternet Bağlantı Hatası)**
- **Görsel:**
  - ⚠️ Büyük ikon (64px)
  - "İnternet Bağlantısı Yok" başlığı
  - "Lütfen internet bağlantınızı kontrol edin" açıklaması
  - "Tekrar Dene" butonu
- **Renk:** #EF4444 (kırmızı)
- **Aksiyon:** Butona tıklayınca yeniden dene

#### **2. API Error (Sunucu Hatası)**
- **Görsel:**
  - 🔴 Alert ikon
  - "Bir Hata Oluştu" başlığı
  - Hata mesajı (teknik detay değil, kullanıcı dostu)
  - "Tekrar Dene" butonu
- **Fallback:** Mock data göster (geliştirme için)

#### **3. Validation Error (Doğrulama Hatası)**
- **Görsel:**
  - Input alanının altında kırmızı metin
  - Küçük ⚠️ ikon
- **Kullanım:**
  - Form validasyonları
  - Tahmin kaydetme validasyonları
- **Mesajlar:**
  - "Lütfen en az bir tahmin yapın"
  - "Maksimum 3 odak seçebilirsiniz"
  - "Geçerli bir email adresi girin"

#### **4. Permission Error (İzin Hatası)**
- **Görsel:**
  - 🔒 İkon
  - "Erişim İzni Gerekli" başlığı
  - "Ayarlar'a gidin ve izinleri açın" açıklaması
  - "Ayarlar'a Git" butonu
- **Kullanım:**
  - Bildirim izinleri
  - Konum izinleri (gelecekte)

### 📭 Empty States (Boş Durumlar)

#### **1. Boş Maç Listesi**
- **Görsel:**
  - ⚽ Büyük ikon (64px, gri)
  - "Bugün Maç Bulunamadı" başlığı
  - "Yaklaşan maçları görmek için tarih seçin" açıklaması
  - "Tarih Seç" butonu (opsiyonel)
- **Renk:** #64748B (gri)

#### **2. Boş Tahmin Listesi**
- **Görsel:**
  - 🎯 Büyük ikon
  - "Henüz Tahmin Yapmadınız" başlığı
  - "İlk tahmininizi yapmak için bir maç seçin" açıklaması
  - "Maçları Gör" butonu → Maçlar sekmesine yönlendir

#### **3. Boş Rozet Listesi**
- **Görsel:**
  - 🏅 Büyük ikon
  - "Henüz Başarı Kazanmadınız" başlığı
  - "Tahminlerinizi doğru yaparak rozetler kazanın!" açıklaması
  - Motivasyon mesajı

#### **4. Boş Bildirim Listesi**
- **Görsel:**
  - 🔔 Büyük ikon
  - "Bildirim Yok" başlığı
  - "Yeni bildirimler burada görünecek" açıklaması

### ✅ Success States (Başarı Durumları)

#### **1. Tahmin Kaydedildi**
- **Görsel:** Toast notification (üstte, yeşil)
- **Mesaj:** "✅ Tahminler başarıyla kaydedildi!"
- **Süre:** 3 saniye otomatik kapanır
- **Animasyon:** Slide down + fade in

#### **2. Profil Güncellendi**
- **Görsel:** Toast notification
- **Mesaj:** "✅ Profil güncellendi"
- **Süre:** 2 saniye

#### **3. Rozet Kazanıldı**
- **Görsel:** Modal popup (büyük, vurgulu)
- **İçerik:**
  - Rozet ikonu (büyük, animasyonlu)
  - "Tebrikler!" başlığı
  - Rozet adı ve açıklaması
  - "Kapat" butonu
- **Animasyon:** Scale + bounce efekti

---

## 10. VALİDASYON KURALLARI VE KISITLAMALAR

### 📝 Form Validasyonları

#### **1. Email Validasyonu**
- **Format:** `user@example.com`
- **Hata Mesajı:** "Geçerli bir email adresi girin"
- **Regex:** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

#### **2. Şifre Validasyonu**
- **Minimum:** 6 karakter
- **Maksimum:** 50 karakter
- **Hata Mesajı:** "Şifre en az 6 karakter olmalıdır"

#### **3. İsim Validasyonu**
- **Minimum:** 2 karakter
- **Maksimum:** 30 karakter
- **Hata Mesajı:** "İsim 2-30 karakter arasında olmalıdır"

### 🎯 Tahmin Validasyonları

#### **1. Minimum Tahmin Kuralı**
- **Kural:** En az 1 tahmin yapılmalı
- **Hata Mesajı:** "Lütfen en az bir tahmin yapın"
- **Kontrol:** Maç tahminleri VEYA oyuncu tahminleri

#### **2. Odak Sınırlaması**
- **Kural:** Maksimum 3 tahmin odaklanılabilir
- **Hata Mesajı:** "En fazla 3 tahmine odaklanabilirsiniz. Başka bir tahmini odaktan çıkarın."
- **Kontrol:** `focusedPredictions.length >= 3`

#### **3. Skor Aralığı**
- **Kural:** Skor 0-5+ arasında olmalı
- **Hata Mesajı:** "Geçerli bir skor girin"
- **Kontrol:** `score >= 0 && score <= 5`

#### **4. Topa Sahip Olma Aralığı**
- **Kural:** 30%-70% arasında
- **Hata Mesajı:** "Topa sahip olma yüzdesi 30-70 arasında olmalıdır"
- **Kontrol:** `possession >= 30 && possession <= 70`

### ⏰ Zaman Kısıtlamaları

#### **1. Tahmin Yapma Süresi**
- **Kural:** Maç başlamadan önce tahmin yapılmalı
- **Hata Mesajı:** "Maç başladı, tahmin yapamazsınız"
- **Kontrol:** `matchTime > currentTime`

#### **2. Tahmin Düzenleme Süresi**
- **Kural:** Maç başlamadan 1 saat öncesine kadar düzenlenebilir
- **Hata Mesajı:** "Maça 1 saatten az kaldı, tahmin düzenleyemezsiniz"
- **Kontrol:** `matchTime - currentTime > 3600000` (1 saat = 3600 saniye)

---

## 11. EDGE CASES VE ÖZEL DURUMLAR

### 🔄 Senaryo 1: Maç İptal Edildi

**Durum:** Maç başlamadan önce iptal edildi

**Kullanıcı Deneyimi:**
- Tahmin yapılmışsa: "Maç iptal edildi" bildirimi
- Puan hesaplanmaz
- Tahmin geçmişinde "İptal" olarak işaretlenir
- Kullanıcıya geri bildirim: "Bu maç iptal edildiği için tahmininiz değerlendirilmedi"

### 🔄 Senaryo 2: Maç Ertelendi

**Durum:** Maç başlamadan önce ertelendi

**Kullanıcı Deneyimi:**
- Tahmin yapılmışsa: Yeni tarihe kadar geçerli kalır
- Bildirim: "Maç ertelendi, tahmininiz yeni tarihe kadar geçerli"
- Yeni tarih gösterilir

### 🔄 Senaryo 3: Maç Yarıda Kesildi

**Durum:** Maç yarıda kesildi (yağmur, güvenlik, vb.)

**Kullanıcı Deneyimi:**
- Mevcut skor baz alınır
- Tamamlanan tahminler değerlendirilir
- Tamamlanmayan tahminler "Yarıda Kesildi" olarak işaretlenir
- Puan hesaplama: Tamamlanan tahminler için normal puan

### 🔄 Senaryo 4: Uzatmalar ve Penaltılar

**Durum:** Maç uzatmalara gitti veya penaltılara gitti

**Kullanıcı Deneyimi:**
- Normal süre tahminleri değerlendirilir (90 dakika)
- Uzatma tahminleri ayrı değerlendirilir (varsa)
- Penaltı tahminleri ayrı değerlendirilir (varsa)
- Toplam puan: Normal + Uzatma + Penaltı

### 🔄 Senaryo 5: Çoklu Gol Atan Oyuncu

**Durum:** Bir oyuncu 2+ gol attı

**Kullanıcı Deneyimi:**
- "Gol Atar" tahmini doğru sayılır
- "Kaç gol?" tahmini kontrol edilir:
  - 1 gol tahmin edildiyse: Yanlış
  - 2 gol tahmin edildiyse: Doğru
  - 3+ gol tahmin edildiyse: Doğru (2 gol de dahil)

### 🔄 Senaryo 6: Aynı Dakikada İki Gol

**Durum:** İki takım aynı dakikada gol attı

**Kullanıcı Deneyimi:**
- İlk golü kim atar tahmini: İlk golü atan takım (API'den gelen sıralama)
- İlk gol zamanı tahmini: O dakika aralığı doğru sayılır

### 🔄 Senaryo 7: Kullanıcı Offline

**Durum:** İnternet bağlantısı yok

**Kullanıcı Deneyimi:**
- Tahmin yapılamaz: "İnternet bağlantısı gerekli" mesajı
- Mevcut tahminler görüntülenebilir (cache'den)
- Offline mod: Sadece görüntüleme, yeni tahmin yok

### 🔄 Senaryo 8: Çoklu Odak Seçimi Hatası

**Durum:** Kullanıcı 4. odak seçmeye çalışıyor

**Kullanıcı Deneyimi:**
- Alert: "Maksimum Odak Sayısı! En fazla 3 tahmine odaklanabilirsiniz."
- Seçim yapılmaz
- Mevcut odaklar gösterilir

---

## 12. MANTIKSAL GELİŞTİRMELER VE ÖNERİLER

### 🎯 UX İyileştirmeleri

#### **1. Tahmin Öncesi İpucu Sistemi** ⭐ ÖNERİLEN

**Mantık:**
- Kullanıcı maça tıkladığında, tahmin yapmadan önce ipuçları göster
- İpuçları:
  - Son 5 maç istatistikleri
  - Oyuncu form durumları
  - Takım karşılaşma geçmişi
  - Hava durumu (gelecekte)

**UI:**
- "💡 Tahmin İpuçları" kartı
- Kısa özet bilgiler
- "Tahmin Yap" butonu ile devam

**Avantaj:**
- Daha bilinçli tahminler
- Kullanıcı deneyimi artar
- Başarı oranı artar

#### **2. Tahmin Özeti Önizleme** ⭐ ÖNERİLEN

**Mantık:**
- Tahminleri kaydetmeden önce özet göster
- Kullanıcı son kontrol yapabilsin

**UI:**
- Modal popup
- Tüm tahminler listelenir
- "Düzenle" ve "Kaydet" butonları
- Odaklanılan tahminler vurgulu

**Avantaj:**
- Hata azalır
- Kullanıcı güveni artar

#### **3. Tahmin Geçmişi ve İstatistikler** ⭐ ÖNERİLEN

**Mantık:**
- Kullanıcı hangi kategorilerde daha başarılı?
- Hangi takımların maçlarında daha iyi?
- Zaman içinde gelişim grafiği

**UI:**
- Profil sekmesinde "Tahmin İstatistikleri" bölümü
- Grafikler:
  - Kategori bazlı başarı yüzdesi
  - Zaman içinde puan grafiği
  - En başarılı tahmin kategorileri

**Avantaj:**
- Kullanıcı kendini tanır
- Motivasyon artar
- Stratejik gelişim

#### **4. Akıllı Tahmin Önerileri** ⭐ GELECEKTE

**Mantık:**
- AI/ML ile tahmin önerileri
- Geçmiş performansa göre öneri
- "Bu tahmin için %75 başarı şansın var" gibi

**UI:**
- Tahmin kartının yanında küçük ikon
- Tıklayınca öneri açılır
- "Öneriyi Kullan" butonu

**Avantaj:**
- Yeni kullanıcılar için rehberlik
- Başarı oranı artar

#### **5. Sosyal Özellikler** ⭐ GELECEKTE

**Mantık:**
- Arkadaşlarını ekle
- Arkadaşlarının tahminlerini gör (maç sonrası)
- Grup yarışmaları

**UI:**
- Profil'de "Arkadaşlar" sekmesi
- Arkadaş listesi
- Arkadaş istatistikleri

**Avantaj:**
- Sosyal rekabet
- Kullanıcı tutumu artar

### 🎨 UI/UX İyileştirmeleri

#### **1. Micro-Interactions (Mikro İnteraksiyonlar)**

**Öneriler:**
- Buton tıklamalarında hafif scale efekti (0.95)
- Kart hover'da (web için) hafif yükselme
- Swipe gesture'ları (mobile)
- Pull-to-refresh animasyonu
- Loading spinner'da pulse efekti

**Avantaj:**
- Daha modern ve responsive his
- Kullanıcı geri bildirimi artar

#### **2. Animasyon İyileştirmeleri**

**Öneriler:**
- Sayfa geçişlerinde smooth slide
- Modal açılışında fade + scale
- Liste öğelerinde staggered animation
- Başarı mesajlarında confetti efekti (gelecekte)

**Avantaj:**
- Daha profesyonel görünüm
- Kullanıcı deneyimi artar

#### **3. Dark Mode Optimizasyonu**

**Öneriler:**
- Tüm ekranlar için dark mode desteği
- Otomatik sistem teması algılama
- Manuel tema değiştirme
- Smooth geçiş animasyonu

**Avantaj:**
- Göz yorgunluğu azalır
- Modern uygulama standardı

#### **4. Accessibility (Erişilebilirlik)**

**Öneriler:**
- Screen reader desteği
- Büyük font seçeneği
- Yüksek kontrast modu
- Renk körlüğü desteği (ikona ek olarak metin)

**Avantaj:**
- Daha geniş kullanıcı kitlesi
- Inclusivity

### 🚀 Performans İyileştirmeleri

#### **1. Lazy Loading (Tembel Yükleme)**

**Mantık:**
- Sadece görünen içerik yüklenir
- Scroll edildikçe yeni içerik yüklenir

**Avantaj:**
- İlk yükleme hızı artar
- Bellek kullanımı azalır

#### **2. Image Optimization (Görsel Optimizasyonu)**

**Mantık:**
- Görseller lazy load
- WebP formatı kullan (daha küçük)
- Thumbnail'ler önce yüklenir, tam boyut sonra

**Avantaj:**
- Sayfa yükleme hızı artar
- Veri kullanımı azalır

#### **3. Caching Strategy (Önbellek Stratejisi)**

**Mantık:**
- Maç listesi cache'lenir (5 dakika)
- Kullanıcı profili cache'lenir (1 saat)
- Tahminler cache'lenir (local storage)

**Avantaj:**
- Offline kullanım
- Daha hızlı yükleme

#### **4. Code Splitting (Kod Bölme)**

**Mantık:**
- Her sekme ayrı bundle
- Sadece gerekli kod yüklenir

**Avantaj:**
- İlk yükleme hızı artar
- Bundle boyutu küçülür

### 🔔 Bildirim Sistemi

#### **1. Push Notifications (Anlık Bildirimler)**

**Bildirim Tipleri:**
- ⚽ Maç başladı (favori takımlar)
- 🎯 Tahmin hatırlatıcı (maçtan 1 saat önce)
- 🏆 Yeni rozet kazandın
- 📊 Maç sonuçları hazır
- 🎉 Liderlik tablosunda yükseldin

**Ayarlar:**
- Kullanıcı bildirim tiplerini seçebilir
- Sessiz saatler ayarlanabilir

#### **2. In-App Notifications (Uygulama İçi Bildirimler)**

**Bildirim Tipleri:**
- Yeni mesajlar (gelecekte)
- Sistem güncellemeleri
- Özel kampanyalar

**UI:**
- Bildirim ikonu (header'da)
- Badge ile sayı gösterimi
- Bildirim listesi sayfası

### 📊 Analytics ve Tracking

#### **1. Kullanıcı Davranışı Analizi**

**Takip Edilenler:**
- Hangi ekranlar en çok kullanılıyor?
- Hangi tahmin kategorileri popüler?
- Ortalama tahmin sayısı
- Başarı oranları

**Avantaj:**
- Ürün geliştirme için veri
- Kullanıcı deneyimi optimizasyonu

#### **2. A/B Testing (A/B Testleri)**

**Test Senaryoları:**
- Farklı tahmin UI'ları
- Farklı renk şemaları
- Farklı navigasyon yapıları

**Avantaj:**
- En iyi çözümü bulma
- Veriye dayalı kararlar

### 🎮 Gamification İyileştirmeleri

#### **1. Günlük Görevler (Daily Challenges)**

**Mantık:**
- Her gün yeni görevler
- Örnekler:
  - "Bugün 3 tahmin yap"
  - "Bir maçta %80 başarı elde et"
  - "3 farklı kategori tahmin yap"

**Ödüller:**
- Bonus puanlar
- Özel rozetler
- Streak bonusları

#### **2. Haftalık Yarışmalar**

**Mantık:**
- Her hafta yeni yarışma
- Özel konu: "Bu hafta Premier League maçları"
- En yüksek puan kazanan ödül alır

**Ödüller:**
- Özel rozet
- Liderlik tablosunda özel gösterim
- Pro üyelik (1 hafta)

#### **3. Sezon Ligi**

**Mantık:**
- Sezon boyunca puan topla
- Sezon sonunda en yüksek puanlılar ödül alır

**Ödüller:**
- Şampiyon rozeti
- Özel profil badge'i
- Pro üyelik (1 ay)

### 🔒 Güvenlik ve Gizlilik

#### **1. Veri Şifreleme**

**Mantık:**
- Hassas veriler şifrelenir
- API iletişimi HTTPS
- Local storage şifreleme

#### **2. Gizlilik Ayarları**

**Ayarlar:**
- Profil görünürlüğü (herkese açık / sadece arkadaşlar / gizli)
- İstatistik paylaşımı
- Liderlik tablosunda görünme

#### **3. Veri Silme**

**Mantık:**
- Kullanıcı hesabını silebilir
- Tüm veriler kalıcı olarak silinir
- GDPR uyumlu

---

## 📝 SON NOTLAR

### 🎯 Figma Tasarım İçin Öneriler

1. **Component Library Oluşturun:**
   - Butonlar (Primary, Secondary, Ghost)
   - Kartlar (Default, Highlighted, Gradient)
   - Input alanları
   - Badge'ler
   - İkonlar

2. **Color Styles:**
   - Tüm renkleri style olarak tanımlayın
   - Gradient'leri style olarak ekleyin

3. **Text Styles:**
   - Tüm font kombinasyonlarını style olarak tanımlayın

4. **Auto Layout Kullanın:**
   - Tüm component'lerde auto layout kullanın
   - Responsive tasarım için

5. **Prototyping:**
   - Tüm ekranlar arası geçişleri prototype edin
   - Modal açılış/kapanış animasyonları
   - Tab geçişleri

6. **Mobile First:**
   - Tüm tasarımlar mobil ekran için (375px genişlik)
   - Tablet ve web için ayrı versiyonlar (opsiyonel)

### 🚀 Öncelikli Ekranlar (Figma için)

1. **Match Detail Screen** (6 sekme) - EN ÖNEMLİ
2. **Match Prediction Tab** (Oyuncu kartı modalı dahil)
3. **Match Summary Tab** (2 alt sekme)
4. **Home Screen**
5. **Profile Screen**
6. **Leaderboard Screen**

---

## 13. RESPONSIVE TASARIM VE BREAKPOINTS

### 📱 Mobil (Primary - 375px)

**Genişlik:** 375px (iPhone SE, iPhone 12/13 mini)
**Özellikler:**
- Tek sütun layout
- Bottom navigation (3 tab)
- Kartlar tam genişlik
- Font boyutları: 10px - 32px
- Padding: 16px

### 📱 Tablet (768px+)

**Genişlik:** 768px - 1024px
**Özellikler:**
- İki sütun layout (maç listesi)
- Sidebar navigation (opsiyonel)
- Kartlar grid layout (2 sütun)
- Font boyutları: 12px - 40px
- Padding: 24px

### 💻 Web (1024px+)

**Genişlik:** 1024px+
**Özellikler:**
- Üç sütun layout (maç listesi)
- Top navigation bar
- Kartlar grid layout (3-4 sütun)
- Hover efektleri
- Font boyutları: 14px - 48px
- Padding: 32px

### 🎯 Breakpoint Stratejisi

```css
/* Mobile First Approach */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1440px) { /* Large Desktop */ }
```

---

## 14. ANİMASYON TIMING VE EASING

### ⏱️ Animasyon Süreleri

#### **Hızlı Animasyonlar (100-200ms)**
- Buton tıklamaları
- Badge güncellemeleri
- Toast notifications

#### **Orta Animasyonlar (300-400ms)**
- Modal açılış/kapanış
- Sayfa geçişleri
- Kart animasyonları

#### **Yavaş Animasyonlar (500-800ms)**
- İlk yükleme animasyonları
- Kompleks geçişler
- Confetti efektleri

### 📈 Easing Functions

#### **Ease Out (Çıkış)**
- **Kullanım:** Modal açılışı, kart görünümü
- **Hiss:** Doğal, yumuşak
- **Kod:** `ease-out` veya `cubic-bezier(0.0, 0, 0.2, 1)`

#### **Ease In (Giriş)**
- **Kullanım:** Modal kapanışı, öğe kaybolması
- **Hiss:** Hızlı başlangıç, yavaş bitiş
- **Kod:** `ease-in` veya `cubic-bezier(0.4, 0, 1, 1)`

#### **Ease In Out (Giriş-Çıkış)**
- **Kullanım:** Sayfa geçişleri, genel animasyonlar
- **Hiss:** Dengeli, profesyonel
- **Kod:** `ease-in-out` veya `cubic-bezier(0.4, 0, 0.2, 1)`

#### **Spring (Yay)**
- **Kullanım:** Özel efektler, bounce animasyonları
- **Hiss:** Canlı, dinamik
- **Kod:** `spring()` (React Native Reanimated)

### 🎬 Animasyon Örnekleri

#### **1. Modal Açılışı**
```typescript
// Timing: 300ms
// Easing: ease-out
// Effect: Fade in + Scale (0.95 → 1.0)
```

#### **2. Kart Görünümü**
```typescript
// Timing: 200ms (staggered)
// Easing: ease-out
// Effect: Fade in + Slide up (20px)
// Delay: index * 50ms
```

#### **3. Buton Tıklaması**
```typescript
// Timing: 100ms
// Easing: ease-in-out
// Effect: Scale (1.0 → 0.95 → 1.0)
```

---

## 15. KULLANICI AKIŞ DİYAGRAMLARI

### 🔄 Tahmin Yapma Akışı

```
Kullanıcı Maça Tıklar
    ↓
Match Detail Ekranı Açılır
    ↓
"Tahmin" Sekmesine Geçer
    ↓
Antrenman Seçimi (Opsiyonel)
    ↓
Maç Tahminleri Yapar
    ├─ Skor tahminleri
    ├─ Kart tahminleri
    ├─ İstatistik tahminleri
    └─ Tempo/Senaryo tahminleri
    ↓
İlk 11 Oyuncularına Tıklar
    ↓
Oyuncu Tahmin Modalı Açılır
    ↓
Oyuncu Tahminleri Yapar
    ├─ Gol atar
    ├─ Asist yapar
    ├─ Kart görür
    └─ Oyundan çıkar
    ↓
Odak Sistemi (Maksimum 3)
    ├─ ⭐ İlk Yarı Skoru
    ├─ ⭐ Maç Sonu Skoru
    └─ ⭐ Toplam Gol
    ↓
"Tahminleri Kaydet" Butonuna Tıklar
    ↓
Validasyon Kontrolü
    ├─ En az 1 tahmin var mı? ✅
    └─ Odak sayısı ≤ 3 mü? ✅
    ↓
Tahminler Kaydedilir
    ├─ Local Storage (backup)
    └─ Database (Supabase)
    ↓
Başarı Mesajı Gösterilir
    ↓
Ana Sayfaya Döner veya Maç Detayında Kalır
```

### 🔄 Maç Sonrası Değerlendirme Akışı

```
Maç Biter
    ↓
Backend Maç Sonuçlarını İşler
    ├─ Skorlar
    ├─ Kartlar
    ├─ İstatistikler
    └─ Oyuncu performansları
    ↓
Tahminler Otomatik Değerlendirilir
    ├─ Doğru tahminler → Puan hesapla
    ├─ Yanlış tahminler → 0 puan
    └─ Odak tahminleri → Çarpan uygula
    ↓
Puanlar Hesaplanır
    ├─ Baz puan × Antrenman çarpanı
    ├─ Odak çarpanı (varsa)
    └─ Bonus puanlar (erken tahmin)
    ↓
Kullanıcıya Bildirim Gönderilir
    ├─ "Maç sonuçları hazır!"
    └─ "X puan kazandınız!"
    ↓
Kullanıcı "Özet" Sekmesine Gider
    ↓
Tahmin Özeti Görüntülenir
    ├─ Toplam puan
    ├─ Başarı yüzdesi
    ├─ Doğru/Yanlış tahminler
    └─ Analist notları
    ↓
Performans Analizi
    ├─ Kategori bazlı başarı
    ├─ Kullanıcı karşılaştırması
    └─ Geçmiş performans
```

---

## 16. TEKNİK SPESİFİKASYONLAR

### 📦 API Endpoints

#### **Maçlar**
- `GET /api/matches?date=YYYY-MM-DD` - Tarihe göre maçlar
- `GET /api/matches/live` - Canlı maçlar
- `GET /api/matches/:id` - Maç detayı
- `GET /api/matches/:id/events` - Maç olayları
- `GET /api/matches/:id/statistics` - Maç istatistikleri
- `GET /api/matches/:id/lineups` - Kadrolar

#### **Tahminler**
- `POST /api/predictions` - Tahmin kaydet
- `GET /api/predictions?matchId=:id` - Maç tahminleri
- `GET /api/predictions/user` - Kullanıcı tahminleri
- `PUT /api/predictions/:id` - Tahmin güncelle
- `DELETE /api/predictions/:id` - Tahmin sil

#### **Kullanıcı**
- `GET /api/user/profile` - Profil bilgileri
- `PUT /api/user/profile` - Profil güncelle
- `GET /api/user/stats` - İstatistikler
- `GET /api/user/badges` - Rozetler

#### **Liderlik**
- `GET /api/leaderboard?period=week|month|season` - Liderlik tablosu
- `GET /api/leaderboard/user` - Kullanıcı sıralaması

### 🗄️ Database Schema

#### **Users Table**
```sql
- id (UUID, Primary Key)
- email (String, Unique)
- name (String)
- avatar_url (String, Optional)
- is_pro (Boolean, Default: false)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### **Predictions Table**
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → Users)
- match_id (Integer)
- match_predictions (JSONB)
- player_predictions (JSONB)
- focused_predictions (JSONB, Array)
- training_type (String, Optional)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### **Match Results Table**
```sql
- id (UUID, Primary Key)
- match_id (Integer, Unique)
- home_score (Integer)
- away_score (Integer)
- events (JSONB, Array)
- statistics (JSONB)
- lineups (JSONB)
- status (String)
- finished_at (Timestamp)
```

### 🔐 Güvenlik

#### **Authentication**
- JWT token tabanlı
- Token süresi: 7 gün
- Refresh token: 30 gün
- Secure storage (AsyncStorage şifreli)

#### **Authorization**
- Role-based access (User, Admin)
- Pro features kontrolü
- Rate limiting (API istekleri)

#### **Data Validation**
- Input sanitization
- SQL injection koruması
- XSS koruması

---

## 17. PERFORMANS METRİKLERİ

### ⚡ Hedef Performans Değerleri

#### **İlk Yükleme Süreleri**
- Splash Screen: < 3 saniye
- Ana Sayfa: < 2 saniye
- Maç Listesi: < 1.5 saniye
- Maç Detayı: < 1 saniye

#### **İnteraksiyon Süreleri**
- Buton tıklama yanıtı: < 100ms
- Sayfa geçişi: < 300ms
- Modal açılışı: < 200ms
- Form gönderimi: < 500ms

#### **API Yanıt Süreleri**
- Maç listesi: < 500ms
- Maç detayı: < 300ms
- Tahmin kaydetme: < 400ms
- Canlı veri güncelleme: < 1 saniye

### 📊 Monitoring

#### **Takip Edilen Metrikler**
- Sayfa yükleme süreleri
- API yanıt süreleri
- Hata oranları
- Kullanıcı etkileşim süreleri
- Crash rate

#### **Alerting**
- API yanıt süresi > 2 saniye → Alert
- Hata oranı > 5% → Alert
- Crash rate > 1% → Alert

---

## 18. TEST SENARYOLARI

### ✅ Unit Test Senaryoları

#### **1. Tahmin Validasyonu**
- ✅ En az 1 tahmin kontrolü
- ✅ Odak sayısı ≤ 3 kontrolü
- ✅ Skor aralığı kontrolü (0-5+)
- ✅ Topa sahip olma aralığı kontrolü (30-70%)

#### **2. Puan Hesaplama**
- ✅ Baz puan hesaplama
- ✅ Antrenman çarpanı uygulama
- ✅ Odak çarpanı uygulama (doğru)
- ✅ Odak çarpanı uygulama (yanlış, ceza)

#### **3. Form Validasyonu**
- ✅ Email format kontrolü
- ✅ Şifre uzunluk kontrolü
- ✅ İsim uzunluk kontrolü

### ✅ Integration Test Senaryoları

#### **1. Tahmin Kaydetme Akışı**
- ✅ Tahmin yap → Kaydet → Database'e kaydedildi mi?
- ✅ Local storage'a backup yapıldı mı?
- ✅ Başarı mesajı gösterildi mi?

#### **2. Maç Sonrası Değerlendirme**
- ✅ Maç bitti → Tahminler değerlendirildi mi?
- ✅ Puanlar doğru hesaplandı mı?
- ✅ Kullanıcıya bildirim gönderildi mi?

### ✅ E2E Test Senaryoları

#### **1. Tam Tahmin Akışı**
- ✅ Kullanıcı giriş yapar
- ✅ Maç seçer
- ✅ Tahmin yapar
- ✅ Kaydeder
- ✅ Maç biter
- ✅ Sonuçları görür

#### **2. Liderlik Tablosu**
- ✅ Kullanıcı giriş yapar
- ✅ Liderlik tablosuna gider
- ✅ Kendi sırasını görür
- ✅ Filtreleme yapar

---

## 19. ERİŞİLEBİLİRLİK (ACCESSIBILITY)

### ♿ WCAG 2.1 Uyumluluğu

#### **Level A (Minimum)**
- ✅ Tüm görseller için alt text
- ✅ Form etiketleri
- ✅ Renk kontrastı (4.5:1)
- ✅ Klavye navigasyonu

#### **Level AA (Önerilen)**
- ✅ Renk kontrastı (4.5:1 metin, 3:1 UI)
- ✅ Focus indicators
- ✅ Error mesajları
- ✅ Heading hierarchy

#### **Level AAA (İdeal)**
- ✅ Renk kontrastı (7:1)
- ✅ Ses kontrolleri
- ✅ Animasyonları kapatma seçeneği

### 🎨 Erişilebilirlik Özellikleri

#### **1. Screen Reader Desteği**
- Tüm butonlar için `accessibilityLabel`
- Tüm görseller için `accessibilityHint`
- Form alanları için `accessibilityLabel`

#### **2. Büyük Font Seçeneği**
- Sistem font boyutunu takip et
- Minimum font boyutu: 12px
- Maksimum font boyutu: 24px (dinamik)

#### **3. Yüksek Kontrast Modu**
- Renk kontrastını artır
- Border'ları kalınlaştır
- Metinleri vurgula

#### **4. Renk Körlüğü Desteği**
- Sadece renge güvenme
- İkonlar + metin kombinasyonu
- Pattern'ler kullan (çizgiler, noktalar)

---

## 20. GELECEKTEKİ ÖZELLİKLER (ROADMAP)

### 🚀 Faz 1: Temel İyileştirmeler (Q1 2026)
- ✅ Tahmin öncesi ipuçları
- ✅ Tahmin özeti önizleme
- ✅ Gelişmiş istatistikler
- ✅ Dark mode optimizasyonu

### 🚀 Faz 2: Sosyal Özellikler (Q2 2026)
- 🔄 Arkadaş sistemi
- 🔄 Grup yarışmaları
- 🔄 Tahmin paylaşımı
- 🔄 Yorum sistemi

### 🚀 Faz 3: AI ve ML (Q3 2026)
- 🔄 Akıllı tahmin önerileri
- 🔄 Performans analizi AI
- 🔄 Kişiselleştirilmiş içerik
- 🔄 Otomatik tahmin önerileri

### 🚀 Faz 4: Gelişmiş Özellikler (Q4 2026)
- 🔄 Canlı maç yorumları
- 🔄 Video highlight'lar
- 🔄 Podcast entegrasyonu
- 🔄 Fantasy lig entegrasyonu

---

---

## 📄 DOKÜMANTASYON SONU

Bu dokümantasyon, **TacticIQ** uygulamasının **tüm özelliklerini, akışlarını, teknik detaylarını ve mantıksal geliştirmelerini** tek dosyada içermektedir.

### ✅ İçerik Özeti

- **20 Ana Bölüm**
- **100+ Alt Bölüm**
- **Tüm Ekran Detayları**
- **Tüm Tahmin Kategorileri**
- **UI/UX Spesifikasyonları**
- **Teknik Detaylar**
- **Edge Cases ve Senaryolar**
- **Mantıksal Geliştirmeler**
- **Test Senaryoları**
- **Gelecek Özellikler**

### 🎯 Kullanım

Bu dokümantasyon **Figma tasarımı** için hazırlanmıştır ve şunları içerir:

1. ✅ Tüm ekranların detaylı açıklamaları
2. ✅ Tüm tahmin kategorileri ve seçenekleri
3. ✅ Tasarım sistemi (renkler, spacing, typography)
4. ✅ Animasyon ve interaksiyon detayları
5. ✅ UI states (loading, error, empty, success)
6. ✅ Validasyon kuralları
7. ✅ Edge cases ve özel durumlar
8. ✅ Teknik spesifikasyonlar
9. ✅ Kullanıcı akış diyagramları
10. ✅ Mantıksal geliştirmeler ve öneriler

### 📊 Dokümantasyon İstatistikleri

- **Toplam Satır:** ~2,400+ satır
- **Ana Bölüm:** 20
- **Alt Bölüm:** 100+
- **Ekran Detayları:** 10+
- **Tahmin Kategorileri:** 14
- **Edge Cases:** 8
- **Önerilen Geliştirmeler:** 15+
- **Test Senaryoları:** 7+

### 📧 İletişim

**Sorularınız için:** development@tacticiq.com

### 📅 Versiyon Bilgisi

**Son Güncelleme:** 5 Ocak 2026  
**Versiyon:** 2.0.0 (Kapsamlı Güncelleme)  
**Durum:** ✅ Tamamlandı - Tek Dosya Formatında

---

**© 2026 TacticIQ - Tüm hakları saklıdır.**
