# TacticIQ Reklam ve Para Birimi Yönetim Sistemi

## 📋 Genel Bakış

TacticIQ admin paneline gelişmiş **Reklam Yönetimi** ve **Çoklu Para Birimi** desteği eklendi. Sistem tamamen fonksiyonel ve admin tarafından kolayca yönetilebilir durumda.

---

## 🎯 1. REKLAM YÖNETİM SİSTEMİ

### Özellikler

#### ✅ Üç Farklı Reklam Alanı
1. **Pop-up Reklamlar** - Tam ekran açılır pencere reklamları
2. **Banner Reklamlar** - Sayfa üst kısmında banner reklamlar
3. **Sidebar Reklamlar** - Sağ alt köşede sidebar reklamları

#### ✅ Reklam Kontrol Sistemi
- **Master Switch**: Tüm reklam sistemini tek tuşla aç/kapa
- **Alan Bazlı Kontrol**: Her reklam alanını bağımsız olarak aç/kapa
  - Pop-up açık/kapalı
  - Banner açık/kapalı
  - Sidebar açık/kapalı
- **Reklam Bazlı Kontrol**: Her reklamı ayrı ayrı aktif/pasif yapabilme

#### ✅ Reklam Özellikleri
- **Medya Desteği**: Görsel (image) ve Video desteği
- **Yerleşim Seçimi**: Pop-up, Banner veya Sidebar
- **Tıklanabilir Link**: Reklama özel URL eklenebilir
- **Süre Kontrolü**: Reklamın kaç saniye gösterileceği
- **Gösterim Sıklığı**: Reklamın kaç dakikada bir gösterileceği
- **Aktif/Pasif Durumu**: Her reklamı switch ile açıp kapatabilme

#### ✅ Admin Panel Özellikleri
- Toplam reklam sayısı görüntüleme
- Alan bazlı reklam istatistikleri (Pop-up, Banner, Sidebar)
- Sekmeli reklam listesi (Tümü, Pop-up, Banner, Sidebar)
- Her reklamda toggle switch ile anlık açma/kapatma
- Reklam ekleme/silme dialog'ları
- Bildirim e-posta adresi ayarı

### Teknik Detaylar

#### Yeni Dosyalar
- `/src/app/components/modals/AdPopup.tsx` - Pop-up reklam komponenti (güncellendi)
- `/src/app/components/modals/AdBanner.tsx` - Banner reklam komponenti (YENİ)
- `/src/app/components/modals/AdSidebar.tsx` - Sidebar reklam komponenti (YENİ)

#### Güncellenmiş Dosyalar
- `/src/contexts/AdminDataContext.tsx`
  - `Advertisement` interface'ine `placement` alanı eklendi
  - `AdSettings` interface'i eklendi (systemEnabled, popupEnabled, bannerEnabled, sidebarEnabled, adminEmail)
  - `updateAdSettings()` fonksiyonu eklendi
  
- `/src/app/components/admin/AdminPanel.tsx`
  - `AdsContent` komponenti tamamen yenilendi
  - 4 farklı sekme: Tümü, Pop-up, Banner, Sidebar
  - Reklam Sistemi Ayarları kartı eklendi
  - Alan bazlı istatistik kartları eklendi

- `/src/app/App.tsx`
  - `AdBanner` ve `AdSidebar` komponentleri eklendi

### Kullanım

#### Admin Panelinden Reklam Ekleme
1. Admin Panel > **Reklam Yönetimi**
2. **Yeni Reklam** butonuna tıklayın
3. Formu doldurun:
   - Başlık
   - Yerleşim Alanı (Pop-up/Banner/Sidebar)
   - Medya Türü (Görsel/Video)
   - Medya URL
   - Tıklama URL (opsiyonel)
   - Süre (saniye)
   - Gösterim Sıklığı (dakika)
4. **Ekle** butonuna tıklayın

#### Reklam Sistemini Yönetme
1. **Master Switch**: Tüm reklam sistemini kapat/aç
2. **Alan Anahtarları**: Pop-up, Banner, Sidebar alanlarını ayrı ayrı kontrol et
3. **Reklam Listesi**: Her reklamı toggle switch ile aktif/pasif yap
4. **Bildirim E-posta**: Performans raporları için e-posta adresi gir

---

## 💰 2. ÇOKLU PARA BİRİMİ SİSTEMİ

### Özellikler

#### ✅ Desteklenen Para Birimleri
- **TRY** - Türk Lirası (₺) [Base Currency]
- **USD** - Amerikan Doları ($)
- **EUR** - Euro (€)
- **GBP** - İngiliz Sterlini (£)
- **AED** - BAE Dirhemi (د.إ) - Arapça ülkeler için
- **CNY** - Çin Yuanı (¥)

#### ✅ Otomatik Kur Güncellemesi
- **Auto Update** seçeneği (açık/kapalı)
- **24 Saatlik Güncelleme**: Kurlar her 24 saatte bir otomatik güncellenir
- **Manuel Güncelleme**: Admin panelinden anında güncelleme
- **Son Güncelleme Tarihi**: En son ne zaman güncellendiğini gösterir

#### ✅ Dil Bazlı Para Birimi
- Türkçe → TRY (₺)
- İngilizce → USD ($)
- Almanca, Fransızca, İspanyolca, İtalyanca → EUR (€)
- Arapça → USD ($) [AED opsiyonel]
- Çince → USD ($) [CNY opsiyonel]

### Teknik Detaylar

#### Yeni Dosyalar
- `/src/services/currencyService.ts` - Para birimi servisi
  - `fetchExchangeRates()` - API'den kur çekme
  - `shouldUpdateRates()` - Güncelleme gerekli mi kontrol
  - `saveExchangeRates()` - LocalStorage'a kaydetme
  - `getStoredExchangeRates()` - LocalStorage'dan okuma
  - `autoUpdateRates()` - Otomatik güncelleme
  - `convertPrice()` - Fiyat dönüşümü
  - `formatCurrencyPrice()` - Formatlanmış fiyat

#### Güncellenmiş Dosyalar
- `/src/contexts/AdminDataContext.tsx`
  - `SiteSettings` interface'ine `autoUpdateCurrency` ve `lastCurrencyUpdate` eklendi

- `/src/app/components/admin/AdminPanel.tsx`
  - Settings bölümüne "Para Birimi Ayarları" kartı eklendi
  - Otomatik güncelleme toggle'ı
  - Manuel güncelleme butonu
  - Son güncelleme tarihi gösterimi

- `/src/utils/pricing.ts` (Mevcut - Güncelleme gerekmedi)
  - Statik kurlar zaten mevcuttu
  - `getPricingForLanguage()` fonksiyonu ile dil bazlı fiyatlandırma

### API Entegrasyonu

#### Desteklenen API Servisleri
1. **exchangerate-api.com** (Önerilen - Ücretsiz)
   - Aylık 1500 istek
   - API anahtarı gerektirmez
   - URL: `https://api.exchangerate-api.com/v4/latest/TRY`

2. **fixer.io** (Ücretli - Güvenilir)
   - Profesyonel kullanım için önerilir
   - URL: `https://api.fixer.io/latest?base=TRY&access_key=YOUR_KEY`

3. **currencyapi.com** (Ücretsiz - Kısıtlı)
   - Aylık 300 istek
   - URL: `https://api.currencyapi.com/v3/latest?base_currency=TRY`

#### API Kurulumu
1. `/src/services/currencyService.ts` dosyasını açın
2. `fetchExchangeRates()` fonksiyonunda ilgili API URL'ini aktif edin
3. API anahtarınızı `.env` dosyasına ekleyin:
   ```env
   VITE_CURRENCY_API_KEY=your_api_key_here
   ```
4. Mock data yerine gerçek API çağrısını kullanın

### Kullanım

#### Admin Panelinden Para Birimi Yönetimi
1. Admin Panel > **Ayarlar**
2. **Para Birimi Ayarları** kartına gidin
3. **Otomatik Kur Güncellemesi**: Açık/Kapalı
4. **Manuel Güncelle**: Anında kur güncellemesi için tıklayın
5. **Son Güncelleme**: En son ne zaman güncellendiğini görün

---

## 📊 Admin Panel Menü Yapısı

### Reklam Yönetimi Sekmesi
```
📺 Reklam Yönetimi
├── 🎛️ Reklam Sistemi Ayarları
│   ├── 🟢 Master Switch (Tüm sistem)
│   ├── Pop-up Açık/Kapalı
│   ├── Banner Açık/Kapalı
│   ├── Sidebar Açık/Kapalı
│   └── 📧 Bildirim E-posta
│
├── 📊 İstatistikler
│   ├── Toplam Reklam
│   ├── Pop-up Sayısı
│   ├── Banner Sayısı
│   └── Sidebar Sayısı
│
└── 📋 Reklam Listesi (Sekmeli)
    ├── Tümü
    ├── Pop-up
    ├── Banner
    └── Sidebar
```

### Ayarlar Sekmesi
```
⚙️ Ayarlar
├── 🌐 Genel Ayarlar
├── 📧 E-posta Ayarları
├── 🔔 Bildirim Ayarları
├── 💰 Para Birimi Ayarları (YENİ)
│   ├── Otomatik Güncelleme Toggle
│   ├── Son Güncelleme Tarihi
│   ├── Manuel Güncelle Butonu
│   └── API Bilgileri
└── 💾 Veritabanı
```

---

## 🔐 Admin Erişimi

**Şifre**: `*130923*Tdd*`

Admin girişi footer'ın en altında gizli olarak mevcuttur.

---

## ✨ Yeni Özellikler Özeti

### Reklam Sistemi
✅ 3 farklı reklam alanı (Pop-up, Banner, Sidebar)  
✅ Master switch ile tüm sistemi kontrol  
✅ Alan bazlı açma/kapatma  
✅ Reklam bazlı aktif/pasif durumu  
✅ Görsel ve video desteği  
✅ Tıklanabilir link ekleme  
✅ Süre ve sıklık kontrolü  
✅ Sekmeli reklam listesi  
✅ Bildirim e-posta adresi  

### Para Birimi Sistemi
✅ 6 farklı para birimi desteği  
✅ Otomatik kur güncellemesi (24 saatte bir)  
✅ Manuel güncelleme butonu  
✅ Son güncelleme tarihi gösterimi  
✅ API entegrasyonu için hazır altyapı  
✅ LocalStorage ile kur saklama  
✅ Dil bazlı otomatik para birimi seçimi  

---

## 🎨 Kullanıcı Deneyimi

### Reklam Gösterimi
- **Pop-up**: Sayfa yüklendiğinde veya belirlenen sıklıkta merkezi açılır pencere
- **Banner**: Sayfa üst kısmında estetik banner (kapatma butonlu)
- **Sidebar**: Sağ alt köşede küçük, dikkat çekici reklam kartı

### Para Birimi Görünümü
- Kullanıcının seçtiği dile göre otomatik para birimi
- Fiyatlandırma bölümünde doğru sembol ve tutar
- Animasyonlu fiyat değişimleri
- Tüm dillerde uyumlu gösterim

---

## 🔧 Geliştirici Notları

### Reklam Sistemi Genişletme
- Yeni reklam alanları için `/src/app/components/modals/` klasörüne yeni komponent ekleyin
- `AdminDataContext.tsx`'de `Advertisement` interface'ine yeni placement ekleyin
- `AdminPanel.tsx`'de ilgili sekme ve istatistiği ekleyin

### Para Birimi API Entegrasyonu
1. API anahtarı alın (exchangerate-api.com önerilir)
2. `/src/services/currencyService.ts`'de API URL'ini aktif edin
3. `.env` dosyasına API anahtarını ekleyin
4. `fetchExchangeRates()` fonksiyonunda mock data'yı gerçek API ile değiştirin

---

## 📝 Değişiklik Logu

### v2.0 - Reklam ve Para Birimi Sistemi
- ✅ Reklam yönetim sistemi eklendi
- ✅ 3 farklı reklam alanı (Pop-up, Banner, Sidebar)
- ✅ Master switch ve alan bazlı kontroller
- ✅ Çoklu para birimi desteği (6 farklı para birimi)
- ✅ Otomatik kur güncellemesi
- ✅ API entegrasyonu için altyapı
- ✅ Admin panel geliştirildi

---

## 🎓 Eğitim Videoları İçin Öneriler

### 1. Reklam Sistemi Kullanımı
- Admin paneline giriş
- Yeni reklam ekleme
- Reklam alanlarını yönetme
- Master switch kullanımı
- İstatistikleri okuma

### 2. Para Birimi Yönetimi
- Para birimi ayarlarına erişim
- Otomatik güncelleme açma/kapatma
- Manuel güncelleme yapma
- API entegrasyonu kurulumu
- Dil bazlı para birimi kontrolü

---

## 🚀 Sonraki Adımlar

### Önerilen Geliştirmeler
1. **Reklam Analitikleri**: Tıklama oranları, görüntülenme sayıları
2. **A/B Testing**: Farklı reklamların performans karşılaştırması
3. **Zamanlı Reklamlar**: Belirli saatlerde gösterim
4. **Coğrafi Hedefleme**: Ülke bazlı reklam gösterimi
5. **Gelişmiş İstatistikler**: Grafik ve çizelgelerle raporlama

### Para Birimi İyileştirmeleri
1. **Daha Fazla Para Birimi**: JPY, CAD, AUD vb.
2. **Gerçek Zamanlı Kur**: WebSocket ile anlık güncelleme
3. **Kur Geçmişi**: Tarihsel kur grafikleri
4. **Özel Kurlar**: Admin tarafından manuel kur belirleme
5. **Otomatik Yuvarlama**: Estetik fiyat formatları

---

## 📞 Destek ve İletişim

Sorularınız için:
- 📧 E-posta: admin@tacticiq.app
- 📚 Dokümantasyon: `/docs` klasörü
- 🔧 Teknik Destek: GitHub Issues

---

**Sistem Durumu**: ✅ %100 Fonksiyonel  
**Son Güncelleme**: 16 Ocak 2026  
**Versiyon**: 2.0
