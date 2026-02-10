# Oyun ve Buton Kuralları

Bu dosya TacticIQ uygulamasındaki kadro oluşturma, formasyon seçimi ve oyuncu yerleştirme kurallarını içerir.
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

## Kod Referansları

- **Formasyon butonları:** `MatchSquad.tsx` ~satır 3210-3290
- **handleFormationSelect:** `MatchSquad.tsx` ~satır 2404
- **applyFormationChange:** `MatchSquad.tsx` ~satır 2292
- **handlePlayerSelect:** `MatchSquad.tsx` ~satır 2530
- **handleRemovePlayer:** `MatchSquad.tsx` ~satır 2601
- **FormationModal:** `MatchSquad.tsx` ~satır 3999

---

**Son Güncelleme:** 2026-02-10
**Versiyon:** 1.2

### Değişiklik Notları

**v1.2 (2026-02-10):**
- Bölüm 8: Veri kaynakları açıkça belirtildi (Gerçek İlk 11 = API, Topluluk = formasyon/atama)
- Bölüm 9: Popup içerik kaynağı ve scroll-free tasarım eklendi

**v1.1 (2026-02-10):**
- Bölüm 8 eklendi: Maç Öncesi Tahmin ve Canlı Maç Kuralları
- Bölüm 9 eklendi: İlk 11 Kadrosu Popup'ı tasarım ve davranış kuralları
- Tahmin yapılmadan maç başlarsa kadro kilitlenme kuralı eklendi
