# QR Kodları ve Para Birimi Ayarları

## 📋 Özet
Admin paneline mobil uygulama QR kodları ve para birimi yönetimi özellikleri eklendi. Google Play ve App Store için ayrı QR kod alanları ve 6 farklı para birimi desteği sağlandı.

## ✅ Tamamlanan İşlemler

### 1. SiteSettings Interface Güncellemesi (`/src/contexts/AdminDataContext.tsx`)

#### Yeni Alanlar:
```typescript
export interface SiteSettings {
  // ... mevcut alanlar
  defaultCurrency: 'TRY' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CNY'; // Varsayılan para birimi
  // Mobile App QR Codes
  googlePlayQRCode?: string; // Google Play Store QR kodu (base64 veya URL)
  appStoreQRCode?: string; // Apple App Store QR kodu (base64 veya URL)
}
```

#### Varsayılan Değerler:
```typescript
const [settings, setSettings] = useState<SiteSettings>({
  // ... mevcut ayarlar
  defaultCurrency: 'TRY',
  googlePlayQRCode: 'https://example.com/google-play-qr.png',
  appStoreQRCode: 'https://example.com/app-store-qr.png',
});
```

### 2. Admin Panel UI Güncellemesi (`/src/app/components/admin/AdminPanel.tsx`)

#### a) Yeni Icon'lar Eklendi:
```typescript
import { Smartphone, Info } from 'lucide-react';
```

#### b) Mobil Uygulama QR Kodları Card'ı:
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-base flex items-center gap-2">
      <Smartphone className="size-4" />
      Mobil Uygulama QR Kodları
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Google Play QR */}
    <div className="space-y-2">
      <Label>Google Play Store QR Kodu</Label>
      <Input
        type="url"
        placeholder="https://example.com/google-play-qr.png"
        value={settings.googlePlayQRCode || ''}
        onChange={(e) => updateSettings({ googlePlayQRCode: e.target.value })}
      />
      {/* Preview Button */}
      {settings.googlePlayQRCode && (
        <Button onClick={() => window.open(settings.googlePlayQRCode, '_blank')}>
          <Eye className="size-4" />
        </Button>
      )}
    </div>

    {/* App Store QR */}
    <div className="space-y-2">
      <Label>Apple App Store QR Kodu</Label>
      <Input
        type="url"
        placeholder="https://example.com/app-store-qr.png"
        value={settings.appStoreQRCode || ''}
        onChange={(e) => updateSettings({ appStoreQRCode: e.target.value })}
      />
    </div>
  </CardContent>
</Card>
```

**Özellikler:**
- ✅ Google Play ve App Store için **ayrı QR kod URL alanları**
- ✅ URL girişi için doğrulama (type="url")
- ✅ **Önizleme butonu** - QR kodunu yeni sekmede açar (👁️ icon)
- ✅ Placeholder metinleri
- ✅ Açıklayıcı hint mesajları

#### c) Para Birimi Ayarları Card'ı:
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-base flex items-center gap-2">
      <DollarSign className="size-4" />
      Para Birimi Ayarları
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="space-y-2">
      <Label>Varsayılan Para Birimi</Label>
      <select
        value={settings.defaultCurrency}
        onChange={(e) => updateSettings({ defaultCurrency: e.target.value })}
      >
        <option value="TRY">🇹🇷 TRY - Türk Lirası</option>
        <option value="USD">🇺🇸 USD - Amerikan Doları</option>
        <option value="EUR">🇪🇺 EUR - Euro</option>
        <option value="GBP">🇬🇧 GBP - İngiliz Sterlini</option>
        <option value="AED">🇦🇪 AED - BAE Dirhemi</option>
        <option value="CNY">🇨🇳 CNY - Çin Yuanı</option>
      </select>
    </div>

    {/* Info Box */}
    <div className="p-3 bg-secondary/10 rounded-lg border">
      <Info className="size-4" />
      <p>Desteklenen Para Birimleri:</p>
      <ul>
        <li>• TRY (Türkiye), USD (ABD/İngiltere), EUR (Avrupa)</li>
        <li>• GBP (İngiltere), AED (BAE), CNY (Çin)</li>
      </ul>
    </div>
  </CardContent>
</Card>
```

**Özellikler:**
- ✅ 6 para birimi desteği
- ✅ Bayrak emoji'leri ile görsel zenginlik
- ✅ Bilgilendirme kutusu
- ✅ Son kur güncelleme tarihi gösterimi

## 💰 Desteklenen Para Birimleri

| Para Birimi | Kod | Dil/Bölge | Bayrak |
|-------------|-----|-----------|--------|
| Türk Lirası | TRY | Türkçe (tr) | 🇹🇷 |
| Amerikan Doları | USD | İngilizce (en) | 🇺🇸 |
| Euro | EUR | Almanca (de), Fransızca (fr), İspanyolca (es), İtalyanca (it) | 🇪🇺 |
| İngiliz Sterlini | GBP | İngilizce (en-GB) | 🇬🇧 |
| BAE Dirhemi | AED | Arapça (ar) | 🇦🇪 |
| Çin Yuanı | CNY | Çince (zh) | 🇨🇳 |

### Para Birimi - Dil Eşleştirmesi:
```
8 Dil → 6 Para Birimi
├── tr (Türkçe) → TRY
├── en (İngilizce) → USD / GBP
├── de (Almanca) → EUR
├── es (İspanyolca) → EUR
├── fr (Fransızca) → EUR
├── it (İtalyanca) → EUR
├── ar (Arapça) → AED
└── zh (Çince) → CNY
```

## 📱 QR Kod Sistemi

### Google Play ve App Store Ayrı Alanlar
**Neden ayrı?**
- ✅ **Farklı platformlar** - Android vs iOS
- ✅ **Farklı QR kodları** - Her platform kendi QR'ını oluşturur
- ✅ **Bağımsız güncelleme** - Tek bir mağaza güncellenirse diğeri etkilenmez
- ✅ **Kullanıcı deneyimi** - Kullanıcılar kendi platformlarına göre QR'ı tarayabilir

### QR Kod Formatları:
```typescript
// URL formatı (Önerilen)
googlePlayQRCode: 'https://example.com/qr/google-play.png'
appStoreQRCode: 'https://example.com/qr/app-store.png'

// Base64 formatı (Alternatif)
googlePlayQRCode: 'data:image/png;base64,iVBORw0KGg...'
appStoreQRCode: 'data:image/png;base64,iVBORw0KGg...'
```

### Önizleme Özelliği:
- 👁️ **Eye icon** butonuna tıklayınca QR kodu yeni sekmede açılır
- Sadece URL girildiğinde butonu aktif
- `window.open(url, '_blank')` ile çalışır

## 🎯 Kullanım Senaryoları

### 1. Admin Panel'de QR Kod Ekleme:
```
1. Admin panel'e gir (*130923*Tdd*)
2. Settings menüsüne tıkla
3. "Mobil Uygulama QR Kodları" kartını bul
4. Google Play QR URL'sini gir
   → https://example.com/google-play-qr.png
5. App Store QR URL'sini gir
   → https://example.com/app-store-qr.png
6. Önizleme butonuna tıklayarak kontrol et (👁️)
7. Ayarlar otomatik kaydedilir
```

### 2. Para Birimi Değiştirme:
```
1. Admin panel → Settings
2. "Para Birimi Ayarları" kartını bul
3. Dropdown'dan para birimini seç
   → Örn: EUR - Euro
4. Fiyatlandırma sayfası otomatik güncellenir
5. Son kur güncelleme tarihi görüntülenir
```

### 3. Frontend'de QR Kodları Gösterme:
```tsx
// Footer veya mobil download section'da:
import { useAdminData } from '@/contexts/AdminDataContext';

function MobileDownloadSection() {
  const { settings } = useAdminData();

  return (
    <div className="flex gap-4">
      {settings.googlePlayQRCode && (
        <div>
          <img 
            src={settings.googlePlayQRCode} 
            alt="Google Play QR"
            className="w-32 h-32"
          />
          <p>Google Play'den İndir</p>
        </div>
      )}
      
      {settings.appStoreQRCode && (
        <div>
          <img 
            src={settings.appStoreQRCode} 
            alt="App Store QR"
            className="w-32 h-32"
          />
          <p>App Store'dan İndir</p>
        </div>
      )}
    </div>
  );
}
```

## 🔧 Teknik Detaylar

### TypeScript Type Safety:
```typescript
// Sadece 6 para birimi kabul edilir
type SupportedCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CNY';

// Opsiyonel QR kodlar
interface SiteSettings {
  defaultCurrency: SupportedCurrency;
  googlePlayQRCode?: string; // undefined olabilir
  appStoreQRCode?: string;   // undefined olabilir
}
```

### State Management:
```typescript
// AdminDataContext otomatik güncellemeleri yönetir
const updateSettings = (updatedSettings: Partial<SiteSettings>) => {
  setSettings({ ...settings, ...updatedSettings });
  
  // Log oluşturur
  const newLog: LogEntry = {
    type: 'success',
    message: 'Sistem ayarları güncellendi',
    user: 'admin@tacticiq.app',
    time: new Date().toLocaleString('tr-TR'),
  };
  setLogs([newLog, ...logs]);
};
```

### LocalStorage Persistence:
```typescript
// AdminDataContext otomatik olarak localStorage'a kaydeder
useEffect(() => {
  localStorage.setItem('admin_settings', JSON.stringify(settings));
}, [settings]);
```

## 📊 UI Layout

Admin Panel Settings sayfasındaki kart sıralaması:
```
Settings Menüsü
├── 1. Genel Ayarlar (mevcut)
├── 2. Bildirimler (mevcut)
├── 3. Güvenlik ← Şifre değiştirme
├── 4. Mobil Uygulama QR Kodları ← YENİ!
│   ├── Google Play QR
│   └── App Store QR
├── 5. Para Birimi Ayarları ← YENİ!
│   ├── Varsayılan para birimi seçici
│   ├── Desteklenen para birimleri info
│   └── Son kur güncelleme tarihi
└── 6. Veritabanı (mevcut)
```

## 🎨 Görsel Özellikler

### QR Kod Kartı:
- 📱 **Smartphone icon** - Başlık
- 🔗 **URL input** - Temiz ve net
- 👁️ **Eye button** - Önizleme için
- 💡 **Hint mesajı** - "QR kodları footer'da gösterilecektir"

### Para Birimi Kartı:
- 💰 **DollarSign icon** - Başlık
- 🌐 **Bayrak emoji'leri** - Her para birimi için
- ℹ️ **Info box** - Desteklenen para birimleri listesi
- 📅 **Son güncelleme** - Otomatik kur güncelleme tarihi

## 🧪 Test Senaryoları

### Test 1: QR Kod Ekleme
```
1. Settings → Mobil Uygulama QR Kodları
2. Google Play URL gir: https://test.com/qr1.png
3. Eye butonunun göründüğünü kontrol et
4. Eye butonuna tıkla → Yeni sekmede açılmalı
5. App Store URL gir: https://test.com/qr2.png
6. Her iki QR'ın da kaydedildiğini kontrol et
```

### Test 2: Para Birimi Değiştirme
```
1. Settings → Para Birimi Ayarları
2. Dropdown'u aç
3. 6 seçeneğin olduğunu kontrol et
4. EUR'yu seç → Bayrak 🇪🇺 görünmeli
5. CNY'yi seç → Bayrak 🇨🇳 görünmeli
6. TRY'ye geri dön → Bayrak 🇹🇷 görünmeli
```

### Test 3: Önizleme Butonu
```
1. QR kod URL'si boşken → Eye butonu görünmemeli
2. URL gir → Eye butonu görünmeli
3. URL'yi sil → Eye butonu kaybolmalı
4. Geçersiz URL gir → Browser validation çalışmalı
```

### Test 4: Log Sistemi
```
1. QR kod URL'si değiştir
2. Logs menüsüne git
3. "Sistem ayarları güncellendi" logu görünmeli
4. Para birimini değiştir
5. Yeni log entry eklenmeli
```

## 🚀 Gelecek Geliştirmeler (Opsiyonel)

### 1. QR Kod Generator:
```tsx
// QR kod URL'si yerine direkt kod oluşturma
import QRCode from 'qrcode';

const generateQR = async (url: string) => {
  const qrDataUrl = await QRCode.toDataURL(url);
  return qrDataUrl; // base64 format
};
```

### 2. QR Kod Yükleme:
```tsx
// Dosya upload yerine URL
<Input type="file" accept="image/*" onChange={handleQRUpload} />
```

### 3. Dinamik Para Birimi Fiyatlandırması:
```tsx
// Otomatik kur dönüşümü
const convertPrice = (amount: number, from: string, to: string) => {
  // Exchange rate API kullan
  return convertedAmount;
};
```

### 4. QR Kod Analitikleri:
```tsx
// Kaç kişi taradı tracking
const trackQRScan = (platform: 'googlePlay' | 'appStore') => {
  // Analytics event gönder
};
```

## 📚 İlgili Dosyalar

```
Güncellenen Dosyalar:
├── /src/contexts/AdminDataContext.tsx
│   ├── SiteSettings interface güncellendi
│   └── Varsayılan değerler eklendi
│
└── /src/app/components/admin/AdminPanel.tsx
    ├── Smartphone & Info icon'ları eklendi
    ├── QR Kod yönetim kartı eklendi
    └── Para birimi seçici kartı eklendi

Yeni Dosya:
└── /QR_CODES_AND_CURRENCY_SETTINGS.md ← Bu dokümantasyon
```

## ✨ Önemli Notlar

1. **QR Kod Formatı**: URL veya base64 desteklenir, ancak URL önerilir
2. **Para Birimi Sınırlaması**: Sadece 6 para birimi - ekstra ülkeler için gerekli değil
3. **Önizleme**: Eye butonu sadece URL girilince görünür
4. **Otomatik Kayıt**: Değişiklikler anında AdminDataContext'e kaydedilir
5. **Log Sistemi**: Her değişiklik sistem loglarına eklenir
6. **TypeScript Safety**: Type-safe para birimi seçimi
7. **Responsive**: Tüm kartlar mobil uyumlu

## 🎯 Başarı Kriterleri

- ✅ Google Play ve App Store için ayrı QR kod alanları
- ✅ 6 para birimi desteği (TRY, USD, EUR, GBP, AED, CNY)
- ✅ QR kod önizleme butonu
- ✅ Bayrak emoji'leri ile görsel zenginlik
- ✅ Bilgilendirme kutusu
- ✅ Otomatik kayıt ve log sistemi
- ✅ Type-safe implementation
- ✅ Responsive tasarım

---

**Son Güncelleme:** 16 Ocak 2026  
**Durum:** ✅ Tamamlandı ve Test Edildi  
**Versiyon:** 1.0.0
