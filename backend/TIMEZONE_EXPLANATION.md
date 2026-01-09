# 🌍 Timezone (Saat Dilimi) Açıklaması

## ✅ Kısa Cevap: SORUN YOK! 

**API-Football tüm maç verilerini UTC/GMT formatında döndürür.**  
**Tek bir API çağrısıyla tüm dünyadaki maçları çekersiniz!**

---

## 📊 API-Football Nasıl Çalışır?

### 1. **Tek Endpoint, Tüm Dünya:**

```javascript
// Tek bir API call ile TÜM canlı maçlar (dünya geneli)
GET /fixtures?live=all

Response: [
  {
    fixture: {
      id: 12345,
      date: "2025-01-09T17:00:00+00:00", // UTC formatında!
      status: "1H",
      timezone: "UTC"
    },
    league: { country: "Turkey", name: "Super Lig" },
    teams: { home: "Galatasaray", away: "Fenerbahçe" }
  },
  {
    fixture: {
      id: 67890,
      date: "2025-01-09T20:00:00+00:00", // Aynı anda İtalya maçı
      status: "1H",
      timezone: "UTC"
    },
    league: { country: "Italy", name: "Serie A" },
    teams: { home: "AC Milan", away: "Inter" }
  },
  {
    fixture: {
      id: 11111,
      date: "2025-01-10T01:00:00+00:00", // ABD maçı (onlar için gece)
      status: "LIVE",
      timezone: "UTC"
    },
    league: { country: "USA", name: "MLS" },
    teams: { home: "LA Galaxy", away: "Seattle" }
  }
]
```

**Sonuç:** Tek bir `/fixtures?live=all` çağrısı ile:
- ✅ Türkiye'deki maçlar
- ✅ İtalya'daki maçlar
- ✅ Amerika'daki maçlar
- ✅ Tüm dünya maçları

**Hepsi UTC formatında gelir, frontend'de kullanıcının saat dilimine çevirirsiniz.**

---

## 🕐 Frontend'de Timezone Conversion

### React Native'de Otomatik Timezone:

```typescript
// API'den gelen UTC date
const utcDate = "2025-01-09T17:00:00+00:00";

// JavaScript Date object otomatik kullanıcının timezone'una çevirir
const matchDate = new Date(utcDate);

// Türkiye'de kullanıcı:
matchDate.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
// → "9 Ocak 2025 20:00" (UTC+3 olduğu için +3 saat)

// İtalya'da kullanıcı:
matchDate.toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
// → "9 gennaio 2025, 18:00" (UTC+1 olduğu için +1 saat)

// ABD'de kullanıcı (New York):
matchDate.toLocaleString('en-US', { timeZone: 'America/New_York' });
// → "January 9, 2025, 12:00 PM" (UTC-5 olduğu için -5 saat)
```

**Sonuç:** Aynı maç, her kullanıcıya kendi yerel saatinde gösterilir!

---

## 🔄 API Fetch Strategy (Tüm Dünya)

### Backend Fetch:

```javascript
// Tek bir endpoint - tüm dünya
async function fetchGlobalMatches() {
  // 1. Canlı maçlar (tüm dünya)
  const liveResponse = await footballApi.getLiveMatches();
  // Türkiye, İtalya, ABD, Brezilya... HEPSİ

  // 2. Bugünkü maçlar (tüm dünya)
  const todayResponse = await footballApi.getFixturesByDate('2025-01-09');
  // TÜM ülkelerin bugünkü maçları

  // 3. Yarınki maçlar (tüm dünya)
  const tomorrowResponse = await footballApi.getFixturesByDate('2025-01-10');
  // TÜM ülkelerin yarınki maçları
}
```

**Toplam: 3 API call = Tüm dünyanın maçları! ✅**

---

## 🌎 Örnek Senaryo: Türkiye'den Kullanıcı

### Saat 20:00 (Türkiye Saati = UTC+3)

**Backend çeker:**
```javascript
GET /fixtures?live=all

Returns:
- Türkiye: Galatasaray vs Fenerbahçe (UTC: 17:00 → TR: 20:00) ✅
- İtalya: Milan vs Inter (UTC: 20:00 → TR: 23:00) ✅
- İngiltere: Arsenal vs Chelsea (UTC: 19:45 → TR: 22:45) ✅
- ABD: LA Galaxy vs Seattle (UTC: 02:00 → TR: 05:00 ertesi gün) ✅
- Brezilya: Flamengo vs Santos (UTC: 23:00 → TR: 02:00 ertesi gün) ✅
```

**Frontend gösterir:**
```
🔴 CANLI MAÇLAR:
- 20:00 | Galatasaray 2-1 Fenerbahçe ⚽ (Türkiye için)
- 23:00 | AC Milan 1-1 Inter (Türkiye için)
- 22:45 | Arsenal 3-0 Chelsea (Türkiye için)

📅 YAKLAŞAN MAÇLAR:
- 05:00 | LA Galaxy - Seattle (yarın sabah, Türkiye için)
- 02:00 | Flamengo - Santos (yarın gece, Türkiye için)
```

**Aynı anda İtalya'dan kullanıcı:**
```
🔴 CANLI MAÇLAR:
- 18:00 | Galatasaray 2-1 Fenerbahçe (İtalya için)
- 21:00 | AC Milan 1-1 Inter ⚽ (İtalya için)
- 20:45 | Arsenal 3-0 Chelsea (İtalya için)
```

**Herkes kendi saatinde görür, backend tek kez çeker! ✅**

---

## 💡 API-Football'un Timezone Özellikleri

### 1. **Default: UTC**
```json
{
  "fixture": {
    "date": "2025-01-09T17:00:00+00:00",
    "timezone": "UTC"
  }
}
```

### 2. **Opsiyonel: Timezone Parameter**
```javascript
// Eğer isterseniz spesifik timezone'da alabilirsiniz
GET /fixtures?date=2025-01-09&timezone=Europe/Istanbul

Response:
{
  "fixture": {
    "date": "2025-01-09T20:00:00+03:00", // Türkiye saati
    "timezone": "Europe/Istanbul"
  }
}
```

**Ama gerek yok!** UTC kullanın, frontend'de çevirin (best practice).

---

## 🎯 Backend Smart Sync Stratejisi

### UTC Bazlı Peak Hours:

```javascript
// 14:00-23:00 UTC = En yoğun saatler (dünya geneli)
// Neden?
// - 14:00 UTC = 17:00 Türkiye (akşam maçları başlıyor)
// - 14:00 UTC = 15:00 İtalya (Serie A saatleri)
// - 14:00 UTC = 09:00 New York (sabah, ama gece maçları bitti)
// - 20:00 UTC = 23:00 Türkiye (maçlar bitiyor)
// - 20:00 UTC = 15:00 New York (öğlen, akşam maçları yaklaşıyor)

if (currentHourUTC >= 14 && currentHourUTC < 23) {
  interval = 15000; // 15 saniye (sık çek)
}
```

**Mantık:** 
- **14:00-23:00 UTC** arası dünya genelinde en çok maç var
- Türkiye'nin akşam maçları
- Avrupa'nın prime-time maçları
- Amerika'nın öğleden sonra/akşam maçları
- **Hepsi aynı UTC aralığında! ✅**

---

## 📊 API Call Efficiency

### Eski Düşünce (Yanlış):
```
❌ Türkiye maçları için ayrı call
❌ İtalya maçları için ayrı call
❌ ABD maçları için ayrı call
→ 3 API call (verimsiz!)
```

### Doğru Yaklaşım:
```
✅ Tek call, tüm canlı maçlar: GET /fixtures?live=all
✅ Tek call, bugün tüm dünya: GET /fixtures?date=2025-01-09
✅ Tek call, yarın tüm dünya: GET /fixtures?date=2025-01-10
→ 3 API call = TÜM DÜNYA! 🌍
```

---

## 🔧 Frontend Timezone Helper

### Utility Function (Ekleyin):

```typescript
// src/utils/timezoneHelper.ts

export const formatMatchTime = (utcDateString: string): string => {
  const date = new Date(utcDateString);
  
  // Kullanıcının cihaz timezone'ı otomatik
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  // Örnek: "9 Ocak, 20:00 GMT+3"
};

export const isMatchLive = (utcDateString: string, status: string): boolean => {
  const matchTime = new Date(utcDateString);
  const now = new Date();
  
  // Canlı durumlar
  const liveStatuses = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'];
  
  // Ya status canlı, ya da başlama saati geçmiş (devam ediyor)
  return liveStatuses.includes(status) || 
         (now >= matchTime && now <= new Date(matchTime.getTime() + 2 * 60 * 60 * 1000));
};

export const getRelativeTime = (utcDateString: string): string => {
  const matchTime = new Date(utcDateString);
  const now = new Date();
  const diffMs = matchTime.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 0) return 'Başladı';
  if (diffMins < 60) return `${diffMins} dakika içinde`;
  if (diffHours < 24) return `${diffHours} saat içinde`;
  return `${diffDays} gün içinde`;
};
```

### Kullanımı:

```typescript
// MatchCard.tsx
<View>
  <Text>{formatMatchTime(match.fixture.date)}</Text>
  <Text>{getRelativeTime(match.fixture.date)}</Text>
</View>

// Türkiye'de görünüm:
// "9 Ocak, 20:00 GMT+3"
// "2 saat içinde"

// İtalya'da görünüm:
// "9 gennaio, 18:00 GMT+1"
// "2 ore"
```

---

## ✅ SONUÇ

### Sorunuz:
> "Her ülkenin yerel saatine göre verebileceğiz değil mi maçları? Bir defada tüm dünyadaki maç verilerini çekebiliyoruz değil mi?"

### Cevap:
**✅ EVET! Kesinlikle!**

1. **API-Football** tüm maçları UTC formatında döndürür
2. **Tek bir API call** ile tüm dünya maçlarını çekersiniz
3. **Frontend** otomatik olarak kullanıcının timezone'ına çevirir
4. **Backend** sadece UTC bazlı çalışır (daha basit!)
5. **Her kullanıcı** kendi yerel saatinde görür

**Örnek:**
- Türkiye'de: 20:00 ⚽ Galatasaray - Fenerbahçe
- İtalya'da: 18:00 ⚽ Galatasaray - Fenerbahçe  
- ABD'de: 12:00 PM ⚽ Galatasaray - Fenerbahçe

**Aynı maç, aynı API data, farklı gösterimler! ✅**

---

## 📝 Best Practice

1. **Backend:** Her zaman UTC kullan
2. **Database:** Supabase'de date field'ları UTC kaydet
3. **Frontend:** Display için `toLocaleString()` kullan
4. **API Calls:** Timezone parameter kullanma, UTC yeterli

**Sonuç:** Basit, verimli, global! 🌍
