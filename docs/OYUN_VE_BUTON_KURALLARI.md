# Oyun ve Buton Kuralları

Bu dosya TacticIQ uygulamasındaki kadro oluşturma, formasyon seçimi, oyuncu yerleştirme ve canlı maç kurallarını içerir.
**Bu dosya sadece onay alındıktan sonra güncellenir.**

---

## 1. Kilit Durumları

### Kilit Kapalı (Kırmızı - Kilitli)
- Kadro tamamlandığında kilit otomatik olarak kapalı (kırmızı) olur
- **Sadece görüntüleme yapılabilir:**
  - Atak/Defans butonlarına basınca ilgili formasyon ve oyuncular sahada görünür
  - Formasyon değiştirilemez
  - Oyuncu değiştirilemez/silinemez
  - Popup açılmaz

### Kilit Açık (Yeşil - Düzenlenebilir)
- Kullanıcı kilit tuşuna basarak kilidi açabilir
- **Düzenleme yapılabilir:**
  - Atak/Defans butonlarına basınca ilgili formasyon sahada görünür + Popup açılır
  - Formasyon değiştirilebilir
  - Oyuncu değiştirilebilir/silinebilir

---

## 2. Formasyon Butonları Davranışı

### Atak Butonuna Basınca
| Kilit Durumu | Davranış |
|--------------|----------|
| Kapalı | Sahada atak formasyonunu ve oyuncuları göster (popup açılmaz) |
| Açık | Sahada atak formasyonunu göster + Formasyon popup'ı aç |

### Defans Butonuna Basınca
| Kilit Durumu | Davranış |
|--------------|----------|
| Kapalı | Sahada defans formasyonunu ve oyuncuları göster (popup açılmaz) |
| Açık | Sahada defans formasyonunu göster + Formasyon popup'ı aç |

### Önemli Kontroller
- Defans butonu: Önce atak formasyonu seçilmiş olmalı
- Formasyon yokken butona basılırsa ve kilit açıksa → Popup açılır
- Formasyon yokken butona basılırsa ve kilit kapalıysa → "Kadro Kilitli" uyarısı

---

## 3. Formasyon Seçimi Kuralları

### Atak Formasyonu Değişirse
- **TÜM DİZİLİŞLER SIFIRLANIR:**
  - Atak oyuncuları sıfırlanır
  - Defans formasyonu sıfırlanır
  - Defans oyuncuları sıfırlanır
- Kullanıcıya "Atak Formasyonu Seçildi" bildirimi gösterilir

### Aynı Atak Formasyonu Tekrar Seçilirse
- **HİÇBİR ŞEY DEĞİŞMEZ:**
  - Atak oyuncuları korunur
  - Defans formasyonu korunur
  - Defans oyuncuları korunur
- Sadece popup kapanır

### Defans Formasyonu Değişirse
- **SADECE DEFANS SIFIRLANIR:**
  - Atak formasyonu ve oyuncuları korunur
  - Defans oyuncuları sıfırlanır (sadece kaleci otomatik atanır)
- Kullanıcıya "Defans Formasyonu Seçildi" bildirimi gösterilir

### Aynı Defans Formasyonu Tekrar Seçilirse
- **HİÇBİR ŞEY DEĞİŞMEZ:**
  - Defans oyuncuları korunur
- Sadece popup kapanır

---

## 4. Oyuncu Değişikliği Kuralları

### Atak Modunda Oyuncu Değişirse veya Silinirse
- Sadece değiştirilen/silinen oyuncu güncellenir
- **DEFANS FORMASYONU TAMAMEN SIFIRLANIR:**
  - Defans formasyonu null olur
  - Defans oyuncuları boşaltılır
  - Kullanıcıya "Defans Formasyonu Sıfırlandı - Lütfen yeniden seçin" bildirimi gösterilir

### Defans Modunda Oyuncu Değişirse
- Sadece değiştirilen oyuncu güncellenir
- Atak kadrosu etkilenmez
- Diğer defans oyuncuları korunur

### Defans Modunda Oyuncu Seçimi
- Sadece atak kadrosundaki 11 oyuncudan seçim yapılabilir
- Atak kadrosunda olmayan oyuncular seçilemez

---

## 5. Kaleci Kuralları

- Kaleci (GK) sadece kale pozisyonuna yerleştirilebilir
- Kale pozisyonuna sadece kaleci yerleştirilebilir
- Defans formasyonu seçildiğinde kaleci otomatik olarak GK slotuna atanır

---

## 6. Popup İçi Davranış

### Sekme Değişikliği (Atak ↔ Defans)
- Popup içinde sekme değiştirildiğinde sahada o formasyon görünür
- editingMode ve formationType güncellenir

### Formasyon Seçimi
- Seçilen formasyona göre yukarıdaki kurallar uygulanır
- Aynı formasyon seçilirse oyuncular korunur

---

## 7. Kaydetme ve Tamamlama

### Tamamla Butonu
- 11 oyuncu yerleştirildiğinde aktif olur
- Kadro local storage'a kaydedilir
- Tahmin sekmesine geçilir
- Kilit otomatik olarak kapalı (kırmızı) duruma geçer

### Kilit Açma Sonrası
- Herhangi bir değişiklik yapılırsa `hasModifiedSinceUnlock` true olur
- Değişiklik yapılmadan kilit kapatılabilir

---

## 8. Maç Öncesi Tahmin ve Canlı Maç Kuralları

### Veri Kaynakları

**Gerçek İlk 11:**
- API'den çekilir (Lineup API)
- Maçın gerçek kadrosu (teknik direktörün sahaya sürdüğü 11 oyuncu)
- Oyuncu numaraları, isimleri ve pozisyonları gerçek verilerdir

**Topluluk Tercihleri:**
- Sadece formasyon seçimi ve oyuncu atamaları için kullanılır
- Kullanıcıların en çok tercih ettiği formasyonlar (örn: 4-2-3-1, 4-3-3)
- Kullanıcıların oyuncuları hangi pozisyonlara atadığı (tercih yüzdeleri)
- Bu veriler "tahmin yapmayan" kullanıcılara varsayılan kadro olarak gösterilir

### Tahmin Yapılmadan Maç Başlarsa

**Önemli:** Kullanıcı maç başlamadan önce hiç tahmin yapmamışsa (kadro oluşturmamışsa):

1. **Kadro Sekmesinde:**
   - Kadro tamamen kilitli olur - düzenleme yapılamaz
   - Gerçek İlk 11 API'den çekilir
   - Topluluk tercihlerine göre formasyon ve pozisyon atamaları yapılır
   - "İlk 11 Kadrosu" popup'ı açılır
   - Kilit butonu gizlenir
   - Formasyon butonları sadece görüntüleme modunda çalışır

2. **Görüntülenen Kadro:**
   - Oyuncular: API'den gelen gerçek İlk 11
   - Formasyon: Topluluk tarafından en çok tercih edilen formasyon
   - Pozisyon atamaları: Topluluk tercihlerine göre
   - Oyuncu kartlarında tercih yüzdeleri gösterilir

3. **Tahmin Sekmesinde:**
   - Tahmin girişi devre dışı kalır
   - "Maç başlamadan tahmin yapmadınız" mesajı gösterilir

### Tahmin Yapılmışsa

- Normal kilit mantığı çalışır (yukarıdaki kurallara göre)
- Kullanıcı isterse kilidi açıp kadrosunu düzenleyebilir
- Değişiklikler kaydedilir

---

## 9. İlk 11 Kadrosu Popup'ı (Canlı Maç)

### İçerik Kaynağı
- **Oyuncular:** Gerçek İlk 11 (API'den)
- **Tercih yüzdeleri:** Topluluk verileri (kullanıcıların bu oyuncuyu hangi pozisyona atadığı)

### Görünüm
- Maç canlıyken ve tahmin yapılmamışsa otomatik açılır
- Takım adı ve "Topluluk tercihleri ile oluşturuldu" yazısı gösterilir
- Tüm 11 oyuncu tek popup içinde görünür (scroll yok)
- Oyuncular forma numaralarına göre sıralanır (1-11)
- Her oyuncunun yanında topluluk tercih yüzdesi gösterilir
- Kaleci altın/sarı renk ile vurgulanır
- Diğer oyuncular turkuaz-yeşil tonlarında

### Davranış
- X tuşuna basarak popup kapatılır ve saha görüntülenir
- Popup kapatıldıktan sonra topluluk formasyonu ve atamaları sahaya uygulanır
- Bu kadro düzenlenemez

---

## 10. Topluluk Verisi Görünürlük Kuralları (YENİ)

### Gizli Mod (Tahmin Kaydedilmeden Önce)
- Topluluk yüzdeleri `??%` olarak gösterilir
- Formasyon tercih oranları maskelenir
- Oyuncu pozisyon yüzdeleri gizlidir
- "Tahminlerinizi kaydedin ve topluluk verilerini görün!" mesajı gösterilir

### Açık Mod (Aşağıdaki Durumlardan Birinde)
- Kullanıcı tahminlerini kaydettiyse
- Maç canlı (live) durumda ise
- Maç bitmiş (finished) durumda ise

Bu durumların herhangi birinde tüm topluluk verileri görünür olur.

---

## 11. Canlı Maç Sinyal Sistemi (YENİ)

### Sinyal Türleri

**Saha Oyuncuları:**
- `substitution` - Oyundan çıksın (turuncu)
- `yellowCard` - Sarı kart görecek (sarı)
- `secondYellow` - 2. sarıdan atılacak (sarı→kırmızı gradient)
- `redCard` - Kırmızı kart görecek (kırmızı)
- `injury` - Sakatlanacak (mor)
- `goal` - Gol atacak (yeşil)
- `assist` - Asist yapacak (turkuaz)

**Kaleci Özel:**
- `concede` - Gol yiyecek (pembe)
- `penaltySave` - Penaltı kurtaracak (açık mavi)
- `redCard` - Kırmızı kart (kırmızı)
- `injury` - Sakatlanacak (mor)

### Sinyal Öncelik Sırası (Yüksekten Düşüğe)
1. Kırmızı kart
2. 2. Sarı kart
3. Sakatlanma
4. Oyundan çıkma
5. Gol yeme (kaleci)
6. Sarı kart
7. Gol atma
8. Asist yapma
9. Penaltı kurtarma (kaleci)

### Görsel Gösterimler

**Oyuncu Kartı Çerçevesi:**
- %10-30: 1px çerçeve
- %30-50: 2px çerçeve
- %50-70: 3px çerçeve
- %70+: 4px çerçeve + pulse animasyonu

**Sinyal Badge'leri:**
- Oyuncu kartının sol üst köşesinde
- En fazla 3 badge gösterilir
- %20+ sinyaller badge olarak görünür
- Her sinyal kendi emoji'siyle gösterilir

### Sinyal Popup'ı ("i" İkonuna Tıklanınca)
- Tüm aktif sinyaller listesi
- Her sinyal için: yüzde, son 15dk yüzdesi, oy sayısı
- "Katıl" butonu ile oylamaya katılım
- Gerçekleşen sinyaller yeşil işaretle gösterilir
- Kullanıcı katıldı ve sinyal gerçekleştiyse bonus puan gösterilir

### Çelişki Kontrolleri (Uyarı Gösterilir)
- Oyundan çıkma + Gol atma
- Oyundan çıkma + Asist yapma
- Kırmızı kart + Gol atma
- Kırmızı kart + Asist yapma
- Sakatlanma + Gol atma
- Sakatlanma + Asist yapma

### Zaman Aşımı
- Son 15 dakikadaki veriler ayrıca gösterilir
- Sinyaller 15 dakika boyunca geçerli sayılır
- Minimum 50 kullanıcı olmalı (mock modda 5)

---

## 12. Değerlendirme (Rating) 24 Saat Kuralı (YENİ)

### Kural
- TD ve oyuncu değerlendirmeleri maç bittikten sonra **24 saat boyunca** yapılabilir
- 24 saat sonra değerlendirme sekmesi kilitlenir

### Görsel Gösterim
- **Yeşil (24+ saat kala):** "Kalan süre: X saat"
- **Turuncu (2 saat veya daha az):** "Son X dakika!"
- **Kırmızı (Süre dolmuş):** "Değerlendirme süresi doldu (24 saat)"

### Kilit Sonrası
- Kaydet butonu devre dışı
- Değerlendirmeler salt okunur modda gösterilir
- Kullanıcı ve topluluk puanları görüntülenebilir

---

## 13. Bonus Puan Sistemi (YENİ)

### Sinyal Tahmin Puanları
| Sinyal Türü | Doğru Tahmin Puanı |
|-------------|-------------------|
| Penaltı Kurtarma | 25 |
| Kırmızı Kart | 20 |
| 2. Sarı Kart | 18 |
| Gol | 15 |
| Sakatlanma | 15 |
| Asist | 12 |
| Oyundan Çıkma | 10 |
| Sarı Kart | 8 |
| Gol Yeme (Kaleci) | 8 |

### Koşullar
- Kullanıcı sinyale "Katıl" butonu ile katılmış olmalı
- Sinyal gerçekleşmiş olmalı (maç içi olaylarla eşleşme)
- Oyundan çıkma için dakika tahmini +/-5 dk toleranslı

---

## 14. Birleşik Maçlar Sekmesi (YENİ - Faz B)

### Yeni Tab Bar Yapısı
Eski yapı: `Maç Takvimi | Biten Maçlar | Sıralama | Profil`
Yeni yapı: `Maçlar | Sıralama | Rozetler | Profil`

### Maçlar Sekmesi (Unified)
Tek bir scroll view'da tüm maçlar gösterilir:

1. **Geçmiş Maçlar (Üst Kısım)**
   - Profil kartının arkasından yukarı scroll ile görünür
   - En son oynanan maç en üstte
   - Maksimum 10 maç gösterilir, "daha fazla göster" butonu
   - Gri status badge: "Bitti"

2. **Canlı Maçlar (Orta - Sticky)**
   - Kırmızı vurgulu bölüm
   - Pulse animasyonlu canlı indicator
   - "Canlı'ya Git" floating butonu (uzaklaşınca görünür)

3. **Gelecek Maçlar (Alt Kısım)**
   - Bottom bar'ın arkasına doğru aşağı scroll
   - En yakın maç en üstte
   - Turkuaz status badge ile tarih/saat

### Maç Kartı Bilgileri
- Takım logoları ve isimleri
- Skor (canlı/biten) veya VS (gelecek)
- Lig bilgisi
- Tahmin yapıldı işareti (yeşil ✓)

### Maç Kartına Tıklama
- Her durumda 5 sekmeli maç detay ekranı açılır
- Biten maçlar: `stats` sekmesi ile açılır
- Gelecek/Canlı maçlar: `squad` sekmesi ile açılır

### Rozetler Sekmesi
- ProfileScreen'in `badges` tab'ı ile açılır
- Kullanıcının kazandığı rozetleri gösterir
- Profil ekranının tüm özelliklerine erişim

---

## 15. Ana Ekran (Dashboard) Scroll ve Maç Kartı Pozisyon Kuralları (YENİ)

### Scroll Yapısı (Yukarıdan Aşağıya)
```
┌─────────────────────────────────────┐  ← ScrollView en üstü
│  [Biten Maç - en eski]              │     (aşağı kaydırınca görünür)
│  [Biten Maç - daha yeni]            │
│  [Biten Maç - en yeni]              │
└─────────────────────────────────────┘
         │
    ─────┴───── ProfileCard alt çizgisi (SABİT OVERLAY)
         │
┌─────────────────────────────────────┐
│  [CANLI MAÇ] veya [En Yakın Maç]    │  ← SAYFA AÇILDIĞINDA BU GÖRÜNÜR
│  [Yaklaşan Maç 2]                   │
│  [Yaklaşan Maç 3 - en uzak]         │
└─────────────────────────────────────┘  ← ScrollView en altı
```

### Başlangıç Pozisyonu Kuralı
- **Sayfa açıldığında:** İlk görünen kart ProfileCard'ın hemen altında olmalı
- **Canlı maç varsa:** Canlı maç kartı ProfileCard altında görünür
- **Canlı maç yoksa:** En yakın yaklaşan maç kartı ProfileCard altında görünür
- **ProfileCard alt çizgisi:** Biten maçlar ile canlı/yaklaşan maç arasındaki boşluğun tam ortasında

### CSS/Style Ölçüleri
- **scrollContent.paddingTop:** `238px` (iOS) / `228px` (Android/Web)
- Bu değer ProfileCard yüksekliği + filtre barı + boşluk toplamıdır
- İlk maç kartının üst kenarı ProfileCard alt çizgisinin hemen altında olmalı
- Biten maç kartının alt çizgisi görünmemeli

### Scroll Davranışları
| Hareket | Sonuç |
|---------|-------|
| Aşağı kaydır (scroll down) | Biten maçlar görünür (ProfileCard arkasından çıkar) |
| Yukarı kaydır (scroll up) | Yaklaşan maçlar görünür (ekranın altına doğru) |

### Otomatik Scroll
- Sayfa yüklendiğinde biten maçların toplam yüksekliği hesaplanır
- ScrollView bu yükseklik kadar scroll edilir (animated: false)
- Böylece canlı/yaklaşan maç ProfileCard altında görünür
- Kullanıcı aşağı kaydırarak biten maçlara erişebilir

### Maç Bitiş Sonrası Geçiş Kuralı
- Maç bittikten **1 saat sonra** otomatik olarak "Biten Maçlar" bölümüne taşınır
- Bu süre zarfında (0-60 dakika) maç hala canlı maç pozisyonunda kalır
- Kullanıcı maç sonucu özetini görebilir, puan hesaplaması yapılabilir
- 1 saat sonra maç kartı biten maçlar arasına kayar ve scroll pozisyonu güncellenir
- **Otomatik kart yenileme:** Biten maç yukarı kayınca, bir alttaki maç (canlı varsa canlı, yoksa yaklaşan) otomatik olarak ProfileCard altındaki ana pozisyona gelir

### Kod Referansları
- **scrollContent paddingTop:** `Dashboard.tsx` ~satır 1890
- **Otomatik scroll:** `Dashboard.tsx` ~satır 1306-1318 (onLayout)
- **Biten maçlar (ters sıra):** `Dashboard.tsx` ~satır 1322 ([...filteredPastMatches].reverse())

---

## Kod Referansları

- **Formasyon butonları:** `MatchSquad.tsx` ~satır 3210-3290
- **handleFormationSelect:** `MatchSquad.tsx` ~satır 2404
- **applyFormationChange:** `MatchSquad.tsx` ~satır 2292
- **handlePlayerSelect:** `MatchSquad.tsx` ~satır 2530
- **handleRemovePlayer:** `MatchSquad.tsx` ~satır 2601
- **FormationModal:** `MatchSquad.tsx` ~satır 3999
- **Sinyal tipleri:** `types/signals.types.ts`
- **Mock sinyaller:** `data/mockTestData.ts` ~satır 1950+
- **24 saat kuralı:** `MatchRatings.tsx` ~satır 175+
- **Birleşik Maçlar:** `screens/UnifiedMatchesScreen.tsx`
- **Bottom Navigation:** `components/BottomNavigation.tsx`
- **Navigation Types:** `navigation/types.ts`

---

**Son Güncelleme:** 2026-02-10
**Versiyon:** 2.2

---

## Bölüm 16: Popup/Modal Tasarım Standartları

### Standart Popup Genişliği ve Stili
Tüm popup ve modal'lar aşağıdaki standart stili kullanacak:

```typescript
// Standart Modal/Popup Stilleri
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  justifyContent: 'center',         // Ortada açılan popup'lar için
  // veya: justifyContent: 'flex-end',  // Alttan açılan popup'lar için
  alignItems: 'center',
  padding: 16,
},
modalContent: {
  backgroundColor: '#1A2E2A',
  borderRadius: 16,                  // Ortada: tüm köşeler yuvarlatılır
  // veya: borderTopLeftRadius: 24,   // Alttan: sadece üst köşeler
  //       borderTopRightRadius: 24,
  width: '100%',
  maxWidth: 400,                     // ✅ STANDART: Maksimum 400px genişlik
  maxHeight: '90%',                  // Ekran yüksekliğinin %90'ı
  borderWidth: 1,
  borderColor: 'rgba(31, 162, 166, 0.2)',
}
```

### Popup Türleri
1. **Ortadan Açılan Popup'lar** (Alert, Onay, Bilgi):
   - `justifyContent: 'center'`
   - Tüm köşeler yuvarlatılır (`borderRadius: 16`)
   - Örnek: "Maç Başlamak Üzere!" popup'ı

2. **Alttan Açılan Popup'lar** (Seçim, Liste):
   - `justifyContent: 'flex-end'`
   - Sadece üst köşeler yuvarlatılır (`borderTopLeftRadius: 24`)
   - Ekranın altından yukarı doğru açılır
   - Örnek: Formasyon seçim popup'ı

### Önemli Kurallar
- **maxWidth: 400** tüm popup'larda sabit kalacak (mobil uyumlu genişlik)
- Padding'ler tutarlı olacak: 16-20px
- Arka plan rengi: `#1A2E2A` (koyu yeşil-mavi)
- Border rengi: `rgba(31, 162, 166, 0.2)` (turkuaz %20 opacity)

---

### Değişiklik Notları

**v2.3 (2026-02-10):**
- Bölüm 16 eklendi: Popup/Modal Tasarım Standartları
- Standart popup genişliği belirlendi (maxWidth: 400px)
- Popup türleri (ortadan/alttan açılan) açıklandı

**v2.2 (2026-02-10):**
- Bölüm 15 eklendi: Ana Ekran Scroll ve Maç Kartı Pozisyon Kuralları
- paddingTop ölçüleri belgelendi (238px iOS / 228px Web)
- Scroll yapısı ve otomatik scroll mantığı açıklandı
- Biten/Canlı/Yaklaşan maç sıralaması belgelendi

**v2.1 (2026-02-10):**
- Bölüm 14 eklendi: Birleşik Maçlar Sekmesi (Faz B)
- Tab bar yapısı güncellendi: Maçlar | Sıralama | Rozetler | Profil
- UnifiedMatchesScreen eklendi
- Kod referansları güncellendi

**v2.0 (2026-02-10):**
- Bölüm 10 eklendi: Topluluk Verisi Görünürlük Kuralları
- Bölüm 11 eklendi: Canlı Maç Sinyal Sistemi (tüm detaylar)
- Bölüm 12 eklendi: Değerlendirme 24 Saat Kuralı
- Bölüm 13 eklendi: Bonus Puan Sistemi
- Kod referansları güncellendi

**v1.2 (2026-02-10):**
- Bölüm 8: Veri kaynakları açıkça belirtildi (Gerçek İlk 11 = API, Topluluk = formasyon/atama)
- Bölüm 9: Popup içerik kaynağı ve scroll-free tasarım eklendi

**v1.1 (2026-02-10):**
- Bölüm 8 eklendi: Maç Öncesi Tahmin ve Canlı Maç Kuralları
- Bölüm 9 eklendi: İlk 11 Kadrosu Popup'ı tasarım ve davranış kuralları
- Tahmin yapılmadan maç başlarsa kadro kilitlenme kuralı eklendi
