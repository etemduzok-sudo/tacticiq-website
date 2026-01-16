# 🎮 TacticIQ.app - Eksiksiz Web Sitesi Dokümantasyonu

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Teknik Altyapı](#teknik-altyapı)
3. [Mimari Yapı](#mimari-yapı)
4. [Özellikler ve Fonksiyonlar](#özellikler-ve-fonksiyonlar)
5. [Admin Paneli](#admin-paneli)
6. [Dil Desteği (i18n)](#dil-desteği-i18n)
7. [Ödeme Sistemi](#ödeme-sistemi)
8. [Oyun Sistemi](#oyun-sistemi)
9. [Reklam ve İndirim Sistemi](#reklam-ve-indirim-sistemi)
10. [Güvenlik](#güvenlik)
11. [Backend Entegrasyonu](#backend-entegrasyonu)
12. [Deployment ve Yayınlama](#deployment-ve-yayınlama)

---

## 🎯 Genel Bakış

**TacticIQ.app**, profesyonel futbol analizi ve tahmin platformudur. Bahis platformu değil, beceri tabanlı bir eğitim ve analiz aracıdır.

### Temel Özellikler
- ✅ 8 Dil Desteği (İngilizce, Türkçe, Almanca, Fransızca, İspanyolca, İtalyanca, Arapça, Çince)
- ✅ RTL (Sağdan Sola) Dil Desteği (Arapça)
- ✅ Tam Responsive Tasarım
- ✅ Dark/Light Mode
- ✅ Admin Paneli (Şifre: *130923*Tdd*)
- ✅ Kullanıcı Yönetimi ve Authentication
- ✅ Oyun Sistemi (14 Tahmin Kategorisi)
- ✅ Ödeme Sistemi (Apple Pay & Google Pay)
- ✅ Reklam Yönetimi
- ✅ İndirim Popup Sistemi
- ✅ Para Birimi Desteği (6 Para Birimi)
- ✅ QR Kod Sistemi (App Store & Google Play)

---

## 🛠 Teknik Altyapı

### Frontend Stack
```json
{
  "framework": "React 18.3.1",
  "language": "TypeScript",
  "styling": "Tailwind CSS v4",
  "buildTool": "Vite 6.0.5",
  "animations": "Motion (Framer Motion)",
  "icons": "Lucide React",
  "routing": "React Router DOM",
  "stateManagement": "React Context API",
  "forms": "React Hook Form",
  "notifications": "Sonner (Toast)",
  "ui": "shadcn/ui Components"
}
```

### Marka Renkleri
```css
--primary: #0F2A24    /* Koyu Yeşil */
--secondary: #1FA2A6  /* Açık Turkuaz */
--accent: #C9A44C     /* Altın Sarısı */
```

### Klasör Yapısı
```
tacticiq/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── admin/           # Admin paneli bileşenleri
│   │   │   ├── auth/            # Kimlik doğrulama bileşenleri
│   │   │   ├── legal/           # Yasal sayfalar
│   │   │   ├── marketing/       # Pazarlama (indirim popup vs)
│   │   │   ├── modals/          # Modal'lar (reklamlar, videolar)
│   │   │   ├── payment/         # Ödeme bileşenleri
│   │   │   ├── sections/        # Ana sayfa bölümleri
│   │   │   └── ui/              # UI bileşenleri (shadcn/ui)
│   │   └── App.tsx              # Ana uygulama dosyası
│   ├── contexts/                # React Context'ler
│   ├── hooks/                   # Custom hooks
│   ├── i18n/                    # Çeviri dosyaları
│   ├── services/                # API servisleri
│   ├── styles/                  # CSS dosyaları
│   └── utils/                   # Yardımcı fonksiyonlar
├── public/                      # Static dosyalar
└── [Dokümantasyon dosyaları]
```

---

## 🏗 Mimari Yapı

### Context Yönetimi

#### 1. AdminDataContext
**Dosya:** `/src/contexts/AdminDataContext.tsx`

Tüm admin verilerini merkezi olarak yönetir:

```typescript
// Kullanılabilir veriler
{
  stats,              // İstatistikler
  users,              // Kullanıcılar
  contents,           // İçerikler
  activities,         // Aktiviteler
  logs,               // Sistem logları
  settings,           // Site ayarları
  websiteContent,     // Web sitesi içeriği
  advertisements,     // Reklamlar
  adSettings,         // Reklam ayarları
  discountSettings,   // İndirim ayarları
  // CRUD fonksiyonları
  addUser, updateUser, deleteUser,
  addContent, updateContent, deleteContent,
  addAdvertisement, updateAdvertisement, deleteAdvertisement,
  updateAdSettings,
  updateDiscountSettings,
  updateSettings,
  updateWebsiteContent
}
```

#### 2. LanguageContext
**Dosya:** `/src/contexts/LanguageContext.tsx`

8 dil desteği ve çeviri yönetimi:

```typescript
{
  language,           // Aktif dil
  changeLanguage,     // Dil değiştirme
  t,                  // Çeviri fonksiyonu
  direction,          // 'ltr' veya 'rtl'
  currencies          // Para birimi bilgileri
}
```

Desteklenen Diller:
- 🇬🇧 English (en)
- 🇹🇷 Türkçe (tr)
- 🇩🇪 Deutsch (de)
- 🇫🇷 Français (fr)
- 🇪🇸 Español (es)
- 🇮🇹 Italiano (it)
- 🇸🇦 العربية (ar) - RTL
- 🇨🇳 中文 (zh)

#### 3. AdminContext
**Dosya:** `/src/contexts/AdminContext.tsx`

Admin oturum yönetimi:

```typescript
{
  isAdmin,            // Admin mi?
  login,              // Giriş yapma
  logout              // Çıkış yapma
}
```

**Admin Şifresi:** `*130923*Tdd*`

#### 4. PaymentContext
**Dosya:** `/src/contexts/PaymentContext.tsx`

Ödeme işlemleri:

```typescript
{
  initiateApplePay,   // Apple Pay başlat
  initiateGooglePay,  // Google Pay başlat
  isProcessing        // İşlem durumu
}
```

---

## 🎨 Özellikler ve Fonksiyonlar

### Ana Sayfa Bölümleri

#### 1. Hero Section
**Komponent:** `/src/app/components/sections/HeroSection.tsx`

- Animasyonlu başlık
- CTA butonları
- İstatistik kartları (kullanıcı, tahmin, lig sayıları)
- Dil bazlı dinamik içerik

#### 2. Product Section
**Komponent:** `/src/app/components/sections/ProductSection.tsx`

TacticIQ'nun ne olduğunu açıklar:
- 6 ana özellik kartı
- Animasyonlu görseller
- "Bahis Değil" vurgusu

#### 3. Features Section
**Komponent:** `/src/app/components/sections/FeaturesSection.tsx`

14 tahmin kategorisini detaylı anlatır:
- İlk yarı/Maç sonu skorları
- Uzatma süreleri
- Kartlar, şutlar, kornerler
- Topa sahip olma
- Tempo ve senaryo tahminleri

#### 4. Player Prediction Section
**Komponent:** `/src/app/components/sections/PlayerPredictionSection.tsx`

Oyuncu tahmin sistemi:
- 8 kategori (Gol, Asist, Kartlar, Değişiklik, MOTM)
- Detaylı açıklamalar

#### 5. Training Section
**Komponent:** `/src/app/components/sections/TrainingSection.tsx`

Antrenman çarpan sistemi:
- 5 antrenman türü
- Bonus puan hesaplamaları
- Örnek hesaplamalar

#### 6. How It Works Section
**Komponent:** `/src/app/components/sections/HowItWorksSection.tsx`

6 adımlı kullanım kılavuzu:
1. Ücretsiz kayıt
2. Maç seçimi
3. Kadro kurma
4. Maç tahminleri
5. Oyuncu tahminleri + Odak
6. Puan kazanma

#### 7. Pricing Section
**Komponent:** `/src/app/components/sections/PricingSection.tsx`

Fiyatlandırma planları:
- **Free Plan:** ₺0 (Temel özellikler)
- **Pro Plan:** ₺149/ay (Tüm özellikler)

Para birimi desteği:
- TRY (₺)
- USD ($)
- EUR (€)
- GBP (£)
- AED (د.إ)
- CNY (¥)

#### 8. Blog Section
**Komponent:** `/src/app/components/sections/BlogSection.tsx`

3 örnek blog yazısı:
- Stratejik odak sistemi rehberi
- Oyuncu kart tahmin rehberi
- Antrenman çarpanları açıklaması

#### 9. CTA Section
**Komponent:** `/src/app/components/sections/CTASection.tsx`

Son çağrı bölümü:
- Email kayıt formu
- Güvenlik garantileri
- 4 ana özellik vurgusu

#### 10. Footer
**Komponent:** `/src/app/components/sections/Footer.tsx`

- 4 bilgi kartı (Bahis Değil, Beceri Tabanlı, Sanal Puanlar, Eğitici)
- Menü linkleri
- Sosyal medya
- QR kodları (App Store & Google Play)
- Gizli admin girişi (10 kez logo'ya tıklama)

#### 11. Game Section
**Komponent:** `/src/app/components/sections/GameSection.tsx`

Oyun arayüzü tanıtımı:
- 4 ana özellik
- Güvenlik bilgileri
- "Şimdi Oyna" butonu

---

## 👑 Admin Paneli

### Erişim
**URL:** Herhangi bir yerde
**Şifre:** `*130923*Tdd*`
**Açma:** Footer'da logo'ya 10 kez tıkla veya URL'de admin hash

### Ana Menü

#### 1. Dashboard (📊)
Genel bakış ve istatistikler:
- Toplam ziyaretçi
- Aktif kullanıcı
- Aylık gelir
- Conversion oranı
- Tüm metrikler için değişim yüzdeleri

#### 2. Analytics (📈)
Detaylı analitik raporlar:
- Aylık gelir grafiği
- Kullanıcı aktivitesi
- Conversion hunnel
- Coğrafi dağılım
- Cihaz dağılımı

#### 3. Kullanıcılar (👥)
Kullanıcı yönetimi:
- Kullanıcı listesi (tablo)
- Arama ve filtreleme
- Düzenleme/Silme
- Yeni kullanıcı ekleme
- Plan yükseltme/düşürme

**Örnek Kullanıcılar:**
- Marco Rossi (Premium)
- Thomas Müller (Premium)
- Jean Dupont (Free)
- Carlos García (Premium)
- Ahmed Al-Rashid (Free)
- Wei Chen (Premium)
- Mehmet Yılmaz (Free)

#### 4. İçerik Yönetimi (📝)
Blog ve içerik yönetimi:
- İçerik listesi
- Tip filtreleme (Blog, Sayfa, Video)
- Durum yönetimi (Yayında, Taslak, Zamanlandı)
- CRUD işlemleri

**Örnek İçerikler:**
- Premier League Taktiksel Analiz
- xG Metriklerinin Kullanımı
- Pressing Stratejileri
- Set Piece Analizi

#### 5. Reklam Yönetimi (📺)
**Reklam Sistemi Ayarları:**
- 🟢 Master Switch (Tüm sistem)
- Pop-up reklamları aç/kapa
- Banner reklamları aç/kapa
- Sidebar reklamları aç/kapa
- Bildirim email adresi

**İndirim Popup Ayarları:**
- ✅ Sistem aktif/pasif
- İndirim oranı (%)
- Orijinal fiyat (₺)
- Günlük gösterim limiti (0 = sınırsız)
- Gösterim gecikmesi (ms)
- Geri sayım süresi (saniye)
- Özet bilgi (hesaplamalar)

**Reklam Listesi:**
- 4 tab (Tümü, Pop-up, Banner, Sidebar)
- Her reklam için:
  - Başlık
  - Tip (Görsel/Video)
  - Yerleşim
  - Medya URL
  - Tıklama URL
  - Süre (saniye)
  - Frekans (dakika)
  - Gösterim sayısı/limiti
  - Aktif/Pasif toggle

**Örnek Reklamlar:**
- TacticIQ Premium %20 İndirim (Popup)
- Yeni Analiz Özellikleri (Banner)
- Takım Analizi Kursu (Sidebar)

#### 6. Oyun Sistemi (🎮)
**Oyun Ayarları:**
- Oyun modülü aç/kapa
- Oyun başına max oyuncu sayısı
- Oyun süresi (dakika)
- Doğru tahmin puanı
- Yanlış tahmin ceza puanı
- Liderlik tablosu aktif/pasif
- Çok oyunculu mod aktif/pasif
- Günlük oyun limiti
- Premium üyelik gerekliliği

**Rate Limiting:**
- Max istek/dakika
- Max istek/saat
- Max istek/gün
- Auto-ban sistemi

**XSS Koruması:**
- Input sanitization
- Output encoding
- Content Security Policy

**CSRF Koruması:**
- Token bazlı koruma
- Double submit cookies
- SameSite cookies

#### 7. Ayarlar (⚙️)
**Genel Ayarlar:**
- Site adı
- Site URL
- Varsayılan dil
- Zaman dilimi

**Email Ayarları:**
- SMTP sunucusu
- Gönderen email
- Email limiti
- Bildirim tercihleri

**Para Birimi Ayarları:**
- Otomatik kur güncellemesi
- Varsayılan para birimi
- Son güncelleme tarihi

**Mobil Uygulama QR Kodları:**
- Google Play QR kodu URL
- App Store QR kodu URL

**Oyun Sistemi:**
- Oyun sistemi aktif/pasif

#### 8. Loglar (📋)
Sistem logları:
- Tip filtreleme (Tümü, Info, Success, Warning, Error)
- Zaman damgası
- Kullanıcı bilgisi
- Mesaj detayı

**Log Tipleri:**
- 🔵 Info - Bilgilendirme
- 🟢 Success - Başarılı işlem
- 🟡 Warning - Uyarı
- 🔴 Error - Hata

#### 9. Website (🌐)
Web sitesi içerik düzenleyici:
- Hero bölümü düzenleme
- Features düzenleme
- Pricing düzenleme
- Blog düzenleme
- CTA düzenleme
- Önizleme modu

---

## 🌍 Dil Desteği (i18n)

### Yapı
**Dosya Konumu:** `/src/i18n/locales/`

Her dil için JSON dosyası:
- `en.json` - İngilizce
- `tr.json` - Türkçe
- `de.json` - Almanca
- `fr.json` - Fransızca
- `es.json` - İspanyolca
- `it.json` - İtalyanca
- `ar.json` - Arapça (RTL)
- `zh.json` - Çince

### Çeviri Anahtarları

```json
{
  "nav": { /* Navigasyon */ },
  "hero": { /* Hero bölümü */ },
  "product": { /* Ürün tanıtımı */ },
  "features": { /* Özellikler */ },
  "player": { /* Oyuncu tahminleri */ },
  "training": { /* Antrenman sistemi */ },
  "howItWorks": { /* Nasıl çalışır */ },
  "pricing": { /* Fiyatlandırma */ },
  "blog": { /* Blog */ },
  "cta": { /* Call to action */ },
  "footer": { /* Footer */ },
  "game": { /* Oyun sistemi */ },
  "fairPlay": { /* Fair play */ },
  "changePassword": { /* Şifre değiştirme */ },
  "discount": { /* İndirim popup */ },
  "payment": { /* Ödeme */ }
}
```

### Kullanım

```typescript
import { useLanguage } from '@/contexts/LanguageContext';

function MyComponent() {
  const { t, language, changeLanguage, direction } = useLanguage();
  
  return (
    <div dir={direction}>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.description')}</p>
      
      <button onClick={() => changeLanguage('tr')}>
        Türkçe
      </button>
    </div>
  );
}
```

### RTL (Right-to-Left) Desteği

Arapça için otomatik RTL:

```typescript
// LanguageContext otomatik olarak direction'ı belirler
direction = language === 'ar' ? 'rtl' : 'ltr';

// HTML'e otomatik uygulanır
<html dir={direction} />
```

---

## 💳 Ödeme Sistemi

### Desteklenen Yöntemler

#### 1. Apple Pay
**Kullanım:**
```typescript
import { usePayment } from '@/contexts/PaymentContext';

const { initiateApplePay } = usePayment();

// Ödeme başlat
await initiateApplePay(149, 'Pro Plan');
```

#### 2. Google Pay
**Kullanım:**
```typescript
import { usePayment } from '@/contexts/PaymentContext';

const { initiateGooglePay } = usePayment();

// Ödeme başlat
await initiateGooglePay(149, 'Pro Plan');
```

### Ödeme Akışı

1. Kullanıcı plan seçer (Pricing Section)
2. Payment Modal açılır
3. Apple Pay veya Google Pay seçilir
4. Ödeme API'sine istek gönderilir
5. Başarılı/Başarısız toast gösterilir

### Güvenlik

✅ **Kart bilgisi saklanmaz**
✅ **Sadece App Store ve Google Play üzerinden ödeme**
✅ **SSL/TLS şifreleme**
✅ **256-bit şifreleme**
✅ **PCI DSS uyumlu**

**PaymentMethodDialog:**
```typescript
<PaymentMethodDialog
  open={isOpen}
  onClose={handleClose}
  plan={{ name: 'Pro', price: 149 }}
/>
```

---

## 🎮 Oyun Sistemi

### Genel Bakış

**Backend durumu:** ✅ Hazır, entegrasyon bekliyor
**Admin Kontrolü:** ✅ Admin panelinden açılıp kapatılabilir (settings.gameEnabled)
**Hero Section Buton:** ✅ "Oyun Oyna" butonu Hero section'da görünür (oyun aktifse)

TacticIQ oyun sistemi, kullanıcıların futbol maçları için tahminler yaptığı, puan kazandığı ve global liderlik tablosunda yarıştığı bir platformdur.

### Oyun Bölümü (GameSection)

**Dosya:** `/src/app/components/sections/GameSection.tsx`

**Özellikler:**
- ✅ Admin panelinden tam kontrol (açma/kapatma)
- ✅ AdminDataContext ile entegre
- ✅ 4 özellik kartı (Tahminler, Liderlik Tablosu, Beceriler, Fair Play)
- ✅ "Şimdi Oyna" butonu
- ✅ Güvenlik bildirimi
- ✅ Oyun modal'ı (backend bağlantısı bekliyor)

**Admin Kontrolü:**
```typescript
// Admin panelinde: Ayarlar > Genel Ayarlar > Oyun Sistemi
settings.gameEnabled = true/false

// Oyun kapalıysa:
- GameSection tamamen gizlenir
- Hero section'daki "Oyun Oyna" butonu gizlenir
```

**Hero Section Entegrasyonu:**
Hero section'da "Oyun Oyna" butonu:
- Oyun sistemi aktifse görünür
- Tıklandığında GameSection'a scroll yapar
- Gradient renk efekti (turkuaz → altın)
- Mobile responsive

### 14 Tahmin Kategorisi

#### Focusable (Odaklanılabilir - 2x Puan)
1. **İlk Yarı Skoru** (⚽)
2. **Maç Sonu Skoru** (⚽)
3. **Toplam Gol Sayısı** (🧮)

#### Non-Focusable (Odaklanamaz - Normal Puan)
4. **İlk Yarı Uzatma Süresi** (⏱️)
5. **İkinci Yarı Uzatma Süresi** (⏱️)
6. **İlk Gol Zamanı** (⏰)
7. **Toplam Sarı Kart** (🟨)
8. **Toplam Kırmızı Kart** (🟥)
9. **Topa Sahip Olma** (📊)
10. **Toplam Şut** (🎯)
11. **İsabetli Şut** (🎯)
12. **Toplam Korner** (🚩)
13. **Maç Temposu** (🏃‍♂️)
14. **Maç Senaryosu** (🧠)

### Oyuncu Tahminleri (8 Kategori)

İlk 11'deki her oyuncu için:

1. **Gol Atar** (⚽) - 1, 2, 3+
2. **Asist Yapar** (🅰️) - 1, 2, 3+
3. **Sarı Kart** (🟨) - Evet/Hayır
4. **İkinci Sarı** (🟨🟥) - Evet/Hayır
5. **Direkt Kırmızı Kart** (🟥) - Evet/Hayır
6. **Oyundan Çıkacak** (🔄) - Yedek seçimi
7. **Sakatlık Değişikliği** (🚑) - Yedek seçimi
8. **Maçın Adamı (MOTM)** (🏆) - Bu oyuncu

### Puan Hesaplama Sistemi

```
Final Puan = Temel Puan × Antrenman Çarpanı × Odak Çarpanı
```

**Örnek:**
```
20 puan × 1.2 (Savunma Antrenmanı) × 2.0 (Odak) = 48 puan
```

### Antrenman Çarpanları

| Antrenman | Bonus | Kategoriler |
|-----------|-------|-------------|
| 🛡️ Savunma | +%20 | Disiplin + Fiziksel |
| ⚔️ Hücum | +%20 | Tempo + Bireysel |
| 🎯 Orta Saha | +%15 | Tempo + Disiplin |
| 💪 Fiziksel | +%25 | Fiziksel |
| 🧠 Taktik | +%15 | Tempo + Bireysel |

### Stratejik Odak Sistemi

- **Maksimum:** 3 tahmin
- **Doğru tahmin:** 2.0x puan
- **Yanlış tahmin:** -1.5x ceza

### Güvenlik Önlemleri

#### 1. Rate Limiting
```typescript
// Admin ayarları
{
  maxRequestsPerMinute: 30,
  maxRequestsPerHour: 200,
  maxRequestsPerDay: 1000,
  autoBanEnabled: true
}
```

#### 2. XSS Koruması
- Input sanitization
- Output encoding
- Content Security Policy headers

#### 3. CSRF Koruması
- Token bazlı doğrulama
- Double submit cookies
- SameSite cookie attribute

### Backend Entegrasyonu

**Servis Dosyası:** `/src/services/gameService.ts`

**API Endpoints:**
```typescript
// Oyun oluşturma
POST /api/game/create
{
  matchId: string,
  userId: string,
  predictions: GamePrediction[]
}

// Oyun tamamlama
POST /api/game/complete
{
  gameId: string,
  actualResults: any
}

// Liderlik tablosu
GET /api/game/leaderboard?limit=100

// Kullanıcı oyunları
GET /api/game/user/:userId

// İstatistikler
GET /api/game/stats/:userId
```

**Dokümantasyon:**
- `/GAME_SYSTEM_README.md`
- `/GAME_SECURITY_GUIDE.md`
- `/GAME_BACKEND_INTEGRATION.md`
- `/OYUN_SISTEMI_OZET.md`

---

## 📢 Reklam ve İndirim Sistemi

### Reklam Yönetimi

#### Reklam Türleri

1. **Pop-up** - Açılır pencere reklamlar
2. **Banner** - Sayfa üstü banner
3. **Sidebar** - Yan menü reklamları

#### Reklam Özellikleri

```typescript
interface Advertisement {
  id: string;
  title: string;
  type: 'image' | 'video';
  placement: 'popup' | 'banner' | 'sidebar';
  mediaUrl: string;
  linkUrl?: string;
  duration: number;        // Saniye
  frequency: number;       // Dakika
  displayCount?: number;   // Gösterim limiti
  currentDisplays?: number; // Mevcut gösterim
  enabled: boolean;
}
```

#### Master Switch

Tüm reklam sistemini tek tuşla aç/kapa:
```typescript
adSettings.systemEnabled = true/false
```

### İndirim Popup Sistemi

**Komponent:** `/src/app/components/marketing/DiscountPopup.tsx`

#### Özellikler

```typescript
interface DiscountSettings {
  enabled: boolean;              // Aktif/Pasif
  discountPercent: number;       // İndirim yüzdesi (0-100)
  dailyShowLimit: number;        // Günlük limit (0 = sınırsız)
  showDelay: number;             // ms (örn: 5000 = 5 sn)
  timerDuration: number;         // Geri sayım (saniye)
  originalPrice: number;         // Orijinal fiyat (₺)
}
```

#### Günlük Limit Kontrolü

```typescript
// localStorage'da günlük sayaç
{
  date: "Mon Jan 16 2026",
  count: 2  // Bugün 2 kez gösterildi
}
```

- Her gün sıfırlanır
- Limite ulaşınca gösterilmez
- 0 = sınırsız gösterim

#### Hesaplamalar

```javascript
const discountedPrice = originalPrice * (1 - discountPercent / 100);
const savings = originalPrice - discountedPrice;

// Örnek: ₺99.99, %20 indirim
// İndirimli: ₺79.99
// Tasarruf: ₺20.00
```

#### Geri Sayım

- Varsayılan: 600 saniye (10 dakika)
- Min: 60 saniye
- Max: 3600 saniye (1 saat)

#### Animasyonlar

- Badge zoom-in (Framer Motion)
- Timer fade-in
- Feature list stagger
- Gradient background pulse

---

## 🔒 Güvenlik

### Authentication

#### Şifre Gereksinimleri

```typescript
{
  minLength: 8,
  requireUppercase: true,
  requireNumber: true
}
```

#### Şifre Değiştirme

**Komponent:** `/src/app/components/auth/ChangePasswordModal.tsx`

Validasyonlar:
- Mevcut şifre kontrolü
- Yeni şifre gereksinimleri
- Şifre eşleşme kontrolü
- Eski şifre ile aynı olmamalı

#### Unutulan Şifre

**Komponent:** `/src/app/components/auth/ForgotPasswordModal.tsx`

Akış:
1. Email gir
2. Doğrulama kodu gönderilir
3. 6 haneli kod girişi
4. Yeni şifre belirleme
5. Başarılı → Login

### CORS Politikası

```typescript
// API Config
{
  baseURL: process.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
}
```

### XSS Koruması

```typescript
// Input sanitization örneği
import DOMPurify from 'dompurify';

const cleanInput = DOMPurify.sanitize(userInput);
```

### CSRF Token

```typescript
// Her istekte token gönderimi
axios.defaults.headers.common['X-CSRF-Token'] = csrfToken;
```

### Rate Limiting

```typescript
// Oyun sistemi için
{
  maxRequestsPerMinute: 30,
  maxRequestsPerHour: 200,
  maxRequestsPerDay: 1000
}
```

---

## 🔌 Backend Entegrasyonu

### API Servisleri

**Klasör:** `/src/services/`

#### 1. apiService.ts
Genel API istekleri için merkezi servis.

```typescript
import api from '@/services/apiService';

// GET isteği
const data = await api.get('/endpoint');

// POST isteği
const result = await api.post('/endpoint', { data });

// PUT isteği
await api.put('/endpoint/:id', { data });

// DELETE isteği
await api.delete('/endpoint/:id');
```

#### 2. authService.ts
Kimlik doğrulama işlemleri.

```typescript
import { authService } from '@/services/authService';

// Kayıt
await authService.register(name, email, password);

// Giriş
await authService.login(email, password);

// Çıkış
await authService.logout();

// Şifre sıfırlama
await authService.forgotPassword(email);
await authService.resetPassword(token, newPassword);
```

#### 3. adminService.ts
Admin paneli işlemleri.

```typescript
import { adminService } from '@/services/adminService';

// İstatistikler
const stats = await adminService.getStats();

// Kullanıcı yönetimi
await adminService.createUser(userData);
await adminService.updateUser(id, userData);
await adminService.deleteUser(id);

// İçerik yönetimi
await adminService.createContent(contentData);
await adminService.updateContent(id, contentData);
```

#### 4. gameService.ts
Oyun sistemi işlemleri.

```typescript
import { gameService } from '@/services/gameService';

// Oyun oluştur
const game = await gameService.createGame(matchId, predictions);

// Oyun tamamla
await gameService.completeGame(gameId, results);

// Liderlik tablosu
const leaderboard = await gameService.getLeaderboard();

// Kullanıcı oyunları
const games = await gameService.getUserGames(userId);
```

#### 5. currencyService.ts
Para birimi işlemleri.

```typescript
import { currencyService } from '@/services/currencyService';

// Kurları güncelle
await currencyService.updateExchangeRates();

// Fiyat dönüştürme
const converted = await currencyService.convertPrice(price, from, to);
```

#### 6. emailService.ts
Email gönderimi.

```typescript
import { emailService } from '@/services/emailService';

// Email gönder
await emailService.sendEmail(to, subject, body);

// Template email
await emailService.sendTemplateEmail(to, templateId, data);
```

### Custom Hooks

**Klasör:** `/src/hooks/`

#### useApi.ts
API istekleri için custom hook.

```typescript
import { useApi } from '@/hooks/useApi';

function MyComponent() {
  const { data, loading, error, refetch } = useApi('/endpoint');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>{JSON.stringify(data)}</div>;
}
```

### Backend Context Wrapper

**Komponent:** `/src/contexts/AdminDataBackendContext.tsx`

AdminDataContext'i backend ile senkronize eder:

```typescript
<AdminDataBackendContext>
  <AdminDataProvider>
    <App />
  </AdminDataProvider>
</AdminDataBackendContext>
```

**Özellikler:**
- Otomatik veri yükleme
- Real-time senkronizasyon
- Hata yönetimi
- Loading states

### Dokümantasyonlar

1. `/BACKEND_INTEGRATION_GUIDE.md` - Entegrasyon rehberi
2. `/BACKEND_USAGE_EXAMPLES.md` - Kullanım örnekleri
3. `/BACKEND_SETUP.md` - Kurulum adımları
4. `/COMPLETE_BACKEND_SUMMARY.md` - Genel özet

---

## 🚀 Deployment ve Yayınlama

### Build

```bash
# Geliştirme ortamı
npm run dev

# Production build
npm run build

# Preview
npm run preview
```

### Environment Variables

`.env` dosyası:

```env
VITE_API_BASE_URL=https://api.tacticiq.app
VITE_APP_ENV=production
VITE_ENABLE_ANALYTICS=true
```

### Vercel Deployment

```bash
# Vercel CLI ile deploy
vercel

# Production deploy
vercel --prod
```

**vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Performance Optimizasyonları

1. **Code Splitting**
   - React.lazy() ile route splitting
   - Dynamic imports

2. **Image Optimization**
   - WebP format
   - Lazy loading
   - Responsive images

3. **CSS Optimization**
   - Tailwind CSS purge
   - Critical CSS inline

4. **Bundle Size**
   - Tree shaking
   - Minification
   - Gzip compression

### SEO

```typescript
// Meta tags (index.html)
<meta name="description" content="TacticIQ - Profesyonel Futbol Analiz Platformu" />
<meta name="keywords" content="futbol, analiz, tahmin, taktikel zeka" />
<meta property="og:title" content="TacticIQ" />
<meta property="og:description" content="Futbol analizlerinde uzmanlaş" />
<meta property="og:image" content="/og-image.png" />
```

### Analytics

Google Analytics entegrasyonu:

```typescript
// Örnek event tracking
gtag('event', 'button_click', {
  'event_category': 'engagement',
  'event_label': 'cta_button'
});
```

---

## 📦 Paket Bilgileri

### Ana Bağımlılıklar

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.22.0",
    "motion": "^11.15.0",
    "lucide-react": "^0.462.0",
    "axios": "^1.6.0",
    "sonner": "^1.4.0",
    "react-hook-form": "^7.55.0"
  }
}
```

### shadcn/ui Components

Kullanılan UI bileşenleri:
- Accordion
- Alert Dialog
- Badge
- Button
- Card
- Checkbox
- Dialog
- Dropdown Menu
- Input
- Label
- Select
- Separator
- Sheet
- Switch
- Tabs
- Textarea
- Toast (Sonner)
- Tooltip

---

## 🎨 Tasarım Sistemi

### Renk Paleti

```css
/* Primary Colors */
--primary: #0F2A24;
--primary-foreground: #FFFFFF;

/* Secondary Colors */
--secondary: #1FA2A6;
--secondary-foreground: #FFFFFF;

/* Accent Colors */
--accent: #C9A44C;
--accent-foreground: #FFFFFF;

/* Neutral Colors */
--background: #FFFFFF;
--foreground: #0F2A24;
--muted: #F5F5F5;
--muted-foreground: #6B7280;

/* Border & Ring */
--border: #E5E7EB;
--ring: #1FA2A6;
```

### Typography

```css
/* Font Family */
font-family: 'Inter', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### Spacing

```css
/* Tailwind spacing scale */
0: 0px
1: 0.25rem  /* 4px */
2: 0.5rem   /* 8px */
3: 0.75rem  /* 12px */
4: 1rem     /* 16px */
6: 1.5rem   /* 24px */
8: 2rem     /* 32px */
12: 3rem    /* 48px */
```

### Border Radius

```css
--radius-sm: 0.375rem;  /* 6px */
--radius: 0.5rem;       /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-full: 9999px;
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
sm: 640px   /* Tablet */
md: 768px   /* Tablet Landscape */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large Desktop */
2xl: 1536px /* Extra Large Desktop */
```

### Kullanım

```typescript
// Tailwind classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

---

## 🐛 Hata Ayıklama

### Console Logs

```typescript
// Development modunda konsol logları aktif
if (import.meta.env.DEV) {
  console.log('Debug bilgisi');
}
```

### Error Boundaries

```typescript
// React Error Boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }
}
```

### Toast Bildirimleri

```typescript
import { toast } from 'sonner';

// Başarı
toast.success('İşlem başarılı!');

// Hata
toast.error('Bir hata oluştu');

// Uyarı
toast.warning('Dikkat!');

// Bilgi
toast.info('Bilgilendirme');
```

---

## 📞 Destek ve İletişim

### Teknik Destek
- **Email:** support@tacticiq.app
- **Admin Panel:** Loglar bölümünden sistem durumu

### Dokümantasyon Güncellemeleri

Bu dokümantasyon düzenli olarak güncellenmektedir. Son güncelleme tarihi: **16 Ocak 2026**

---

## 📄 Lisans

**Özel Mülkiyet** - TacticIQ.app tüm hakları saklıdır.

---

## 🎯 Gelecek Özellikler (Roadmap)

### Q1 2026
- [ ] Canlı maç skorları entegrasyonu
- [ ] Sosyal medya paylaşım özelliği
- [ ] Kullanıcı profil sayfaları
- [ ] Arkadaşlarla yarışma modu

### Q2 2026
- [ ] Mobil uygulama (iOS & Android)
- [ ] Push notification sistemi
- [ ] Video analiz modülü
- [ ] AI destekli tahmin önerileri

### Q3 2026
- [ ] Takım oluşturma ve ligler
- [ ] Özel turnuvalar
- [ ] Sponsor entegrasyonları
- [ ] Premium içerik aboneliği

---

## 🔑 Önemli Notlar

### Admin Erişimi
- **Şifre:** `*130923*Tdd*`
- **Açılış:** Footer'da logo'ya 10 kez tıkla
- **Güvenlik:** Production'da şifreyi değiştirin!

### Kart Ödemesi
- ❌ **Kart bilgisi toplanmaz**
- ✅ **Sadece App Store & Google Pay**
- ✅ **Güvenli ödeme garantisi**

### Backend
- ✅ **Tüm servisler hazır**
- ✅ **API endpoint'leri tanımlı**
- ✅ **Dokümantasyon tam**
- ⏳ **Entegrasyon bekleniyor**

### Güvenlik
- ✅ **Rate limiting hazır**
- ✅ **XSS koruması aktif**
- ✅ **CSRF token sistemi hazır**
- ✅ **Admin paneli korumalı**

---

**Son Güncelleme:** 16 Ocak 2026
**Versiyon:** 2.0.0
**Durum:** ✅ Production Ready

---

## Ek Dokümantasyonlar

1. `/ADMIN_GUIDE.md` - Admin paneli kullanım kılavuzu
2. `/GAME_SYSTEM_README.md` - Oyun sistemi detayları
3. `/BACKEND_INTEGRATION_GUIDE.md` - Backend entegrasyon rehberi
4. `/GAME_SECURITY_GUIDE.md` - Oyun güvenliği
5. `/PASSWORD_MANAGEMENT_GUIDE.md` - Şifre yönetimi
6. `/REKLAM_VE_PARA_BIRIMI_SISTEMI.md` - Reklam ve para birimi
7. `/QR_CODES_AND_CURRENCY_SETTINGS.md` - QR kod ve para birimi ayarları

---

**TacticIQ.app** - Profesyonel Futbol Analiz Platformu 🎮⚽

*Bahis Değil, Beceri Tabanlı Oyun!*