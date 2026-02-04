# TacticIQ Production Geçiş Kontrol Listesi

## 🗑️ Eski Verileri Temizleme (Migration)

Production'a geçmeden önce eski `fan-manager-*` key'lerini temizlemek için:

### AsyncStorage Key'leri (Kullanıcı Cihazında)
Eski key'ler artık `LEGACY_STORAGE_KEYS` olarak tanımlı ve geriye uyumluluk için okunuyor.
Production'da yeni kullanıcılar için sadece `tacticiq-*` key'leri kullanılacak.

```javascript
// Temizlenecek eski key'ler:
const LEGACY_KEYS_TO_CLEAN = [
  'fan-manager-user',
  'fan-manager-language', 
  'fan-manager-favorite-clubs',
  'fan-manager-predictions-*',
  'fan-manager-squad-*',
  'fan-manager-ratings-*',
];
```

### Migration Script (Opsiyonel)
Mevcut kullanıcıların verilerini korumak için migration script:

```javascript
// src/utils/migrateLegacyData.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, LEGACY_STORAGE_KEYS } from '../config/constants';

export async function migrateLegacyData() {
  try {
    // 1. Eski user verisini kontrol et
    const legacyUser = await AsyncStorage.getItem('fan-manager-user');
    if (legacyUser && !(await AsyncStorage.getItem(STORAGE_KEYS.USER))) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, legacyUser);
      await AsyncStorage.removeItem('fan-manager-user');
    }
    
    // 2. Diğer key'ler için benzer işlem...
    
    console.log('✅ Legacy data migration completed');
  } catch (error) {
    console.error('Migration error:', error);
  }
}
```

## ✅ Tamamlanan Değişiklikler

### 1. Storage Key'leri Güncellendi
- [x] `STORAGE_KEYS.SQUAD` eklendi
- [x] `LEGACY_STORAGE_KEYS` tanımlandı
- [x] Tüm hardcoded `fan-manager-*` key'leri sabitlerle değiştirildi

### 2. UI Değişiklikleri
- [x] MatchDetail: "Özet" sekmesi kaldırıldı (6 → 5 sekme)
- [x] MatchPredictionSummaryCard: Biten maçların altında tahmin özeti
- [x] Biten maçlar listesinde yıldız badge'i + puan gösterimi

### 3. Etkilenen Dosyalar
- `src/config/constants.ts`
- `src/components/MatchDetail.tsx`
- `src/components/match/MatchSquad.tsx`
- `src/components/match/MatchPrediction.tsx`
- `src/components/match/MatchRatings.tsx`
- `src/hooks/useMatchesWithPredictions.ts`
- `src/navigation/handlers.ts`
- `src/hooks/useAppNavigation.ts`
- `src/screens/ProfileScreen.tsx`
- `src/services/mockAuthService.ts`
- `src/screens/MatchListScreen.tsx` (yeni MatchPredictionSummaryCard)

## 🚀 Production Öncesi Yapılacaklar

1. [ ] Migration script'i test et
2. [ ] Eski verilerin doğru şekilde okunduğunu doğrula
3. [ ] Yeni verilerin `tacticiq-*` key'leriyle kaydedildiğini doğrula
4. [ ] ScoringEngine entegrasyonunu tamamla (MatchPredictionSummaryCard'da mock veri yerine)
5. [ ] Community stats API'yi gerçek verilerle doldur
6. [ ] Beta test kullanıcılarıyla test et

## 📝 Notlar

- Eski veriler **silinmiyor**, sadece yeni key'lerle kaydediliyor
- Geriye uyumluluk 2-3 versiyon boyunca korunacak
- Production'da eski key'leri okuyan fallback'ler kademeli olarak kaldırılabilir
