# 🏆 Rozet Sistemi Kullanım Kılavuzu

## 📋 İçindekiler
1. [Rozet Kazanma](#rozet-kazanma)
2. [Rozet Gösterimi](#rozet-gösterimi)
3. [Rozet Vitrini](#rozet-vitrini)
4. [Entegrasyon](#entegrasyon)

---

## 🎯 1. Rozet Kazanma

### Maç Sonrası Otomatik Kontrol

**MatchRatings.tsx** içinde maç bittiğinde:

```typescript
import { checkAndAwardBadges, UserStats } from '../services/badgeService';
import { AnalysisCluster } from '../types/prediction.types';

// Maç sonu puanlama yapıldıktan sonra
const handleMatchEnd = async () => {
  // 1. Kullanıcı istatistiklerini hesapla
  const userStats: UserStats = {
    totalPredictions: 150,
    correctPredictions: 120,
    accuracy: 80,
    currentStreak: 12,
    longestStreak: 25,
    
    leagueStats: {
      '203': { // Süper Lig
        total: 50,
        correct: 43,
        accuracy: 86,
      },
      '39': { // Premier League
        total: 30,
        correct: 21,
        accuracy: 70,
      },
    },
    
    clusterStats: {
      [AnalysisCluster.TEMPO_FLOW]: {
        total: 40,
        correct: 33,
        accuracy: 82.5,
      },
      [AnalysisCluster.DISCIPLINE]: {
        total: 35,
        correct: 28,
        accuracy: 80,
      },
      [AnalysisCluster.PHYSICAL_WEAR]: {
        total: 30,
        correct: 22,
        accuracy: 73.3,
      },
      [AnalysisCluster.INDIVIDUAL_PERFORMANCE]: {
        total: 45,
        correct: 37,
        accuracy: 82.2,
      },
    },
    
    perfectMatches: 2,
  };
  
  // 2. Rozet kontrolü yap
  const newBadges = await checkAndAwardBadges(userStats);
  
  // 3. Yeni rozet kazanıldıysa otomatik popup gösterilir
  if (newBadges.length > 0) {
    console.log('🎉 Yeni rozetler kazanıldı:', newBadges);
  }
};
```

---

## 🎨 2. Rozet Gösterimi

### Leaderboard'da Rozet Gösterimi

**Leaderboard.tsx** içinde:

```typescript
import { getTopBadges } from '../services/badgeService';

// Component içinde
const [userBadges, setUserBadges] = useState<string[]>([]);

useEffect(() => {
  loadUserBadges();
}, []);

const loadUserBadges = async () => {
  const badges = await getTopBadges(3); // En iyi 3 rozet
  setUserBadges(badges);
};

// Render
<View style={styles.badgesRow}>
  {userBadges.map((badge, idx) => (
    <View key={idx} style={styles.badgeIcon}>
      <Text style={styles.badgeIconText}>{badge}</Text>
    </View>
  ))}
</View>
```

### Profile Screen'de Rozet Sayısı

```typescript
import { getUserBadges } from '../services/badgeService';

const [badgeCount, setBadgeCount] = useState(0);

useEffect(() => {
  loadBadgeCount();
}, []);

const loadBadgeCount = async () => {
  const badges = await getUserBadges();
  setBadgeCount(badges.length);
};

// Render
<View style={styles.statCard}>
  <Ionicons name="medal" size={24} color="#F59E0B" />
  <Text style={styles.statValue}>{badgeCount}</Text>
  <Text style={styles.statLabel}>Rozet</Text>
</View>
```

---

## 🏛️ 3. Rozet Vitrini

### ProfileScreen'e Rozet Vitrini Ekleme

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { getUserBadges } from '../services/badgeService';
import { Badge, getBadgeColor, getBadgeTierName } from '../types/badges.types';

export function BadgeShowcase() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  
  useEffect(() => {
    loadBadges();
  }, []);
  
  const loadBadges = async () => {
    const userBadges = await getUserBadges();
    setBadges(userBadges);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Rozetlerim</Text>
      
      <ScrollView contentContainerStyle={styles.badgeGrid}>
        {badges.map((badge) => (
          <TouchableOpacity
            key={badge.id}
            style={[
              styles.badgeCard,
              { borderColor: getBadgeColor(badge.tier) }
            ]}
            onPress={() => setSelectedBadge(badge)}
          >
            <Text style={styles.badgeEmoji}>{badge.icon}</Text>
            <Text style={styles.badgeName}>{badge.name}</Text>
            <Text style={[styles.badgeTier, { color: getBadgeColor(badge.tier) }]}>
              {getBadgeTierName(badge.tier)}
            </Text>
          </TouchableOpacity>
        ))}
        
        {/* Locked badges (not earned yet) */}
        {/* TODO: Show all available badges with locked state */}
      </ScrollView>
      
      {/* Badge Detail Modal */}
      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  badgeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 10,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeTier: {
    fontSize: 9,
    fontWeight: '600',
  },
});
```

---

## 🔗 4. Entegrasyon

### Adım 1: MatchRatings'e Entegre Et

**src/components/match/MatchRatings.tsx**

```typescript
// En üste import ekle
import { checkAndAwardBadges, UserStats } from '../../services/badgeService';

// handleSaveRatings fonksiyonunun sonuna ekle
const handleSaveRatings = async () => {
  // ... mevcut kod ...
  
  // Rozet kontrolü
  const userStats = await calculateUserStats(); // Bu fonksiyonu implement et
  await checkAndAwardBadges(userStats);
};
```

### Adım 2: ProfileScreen'e Rozet Sayısını Ekle

**src/screens/ProfileScreen.tsx**

```typescript
import { getUserBadges } from '../services/badgeService';

// Component içinde
const [badgeCount, setBadgeCount] = useState(0);

useEffect(() => {
  loadBadges();
}, []);

const loadBadges = async () => {
  const badges = await getUserBadges();
  setBadgeCount(badges.length);
};

// Stats kısmına ekle
<View style={styles.statCard}>
  <Ionicons name="medal" size={24} color="#F59E0B" />
  <Text style={styles.statValue}>{badgeCount}</Text>
  <Text style={styles.statLabel}>Rozet</Text>
</View>
```

### Adım 3: Leaderboard'a Rozet Gösterimini Ekle

**src/components/Leaderboard.tsx**

Zaten eklendi! ✅

---

## 📊 Rozet Kazanma Koşulları

### Lig Uzmanı Rozetleri

| Rozet | Koşul | Seviye |
|-------|-------|--------|
| 🇹🇷 Süper Lig Tanıdık | 10 doğru tahmin | Bronz |
| 🇹🇷 Süper Lig Gurusu | %85+ doğruluk | Altın |
| 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier Lig Tanıdık | 10 doğru tahmin | Bronz |
| 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier Lig Bilgini | %70+ doğruluk | Gümüş |
| 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier Lig Gurusu | %85+ doğruluk | Altın |
| 🇪🇸 La Liga Gurusu | %85+ doğruluk | Altın |

### Küme Ustası Rozetleri

| Rozet | Koşul | Seviye |
|-------|-------|--------|
| ⚡ Tempo Ustası | Tempo & Akış kümesinde %80+ | Altın |
| 🟨 Disiplin Ustası | Disiplin kümesinde %80+ | Altın |
| 💪 Fiziksel Analiz Ustası | Fiziksel & Yıpranma kümesinde %80+ | Altın |
| ⭐ Bireysel Performans Ustası | Bireysel Performans kümesinde %80+ | Altın |

### Seri Kralı Rozetleri

| Rozet | Koşul | Seviye |
|-------|-------|--------|
| 🔥 Seri Başlangıcı | 5 ardışık doğru tahmin | Bronz |
| 🔥 Seri Ustası | 10 ardışık doğru tahmin | Gümüş |
| 🔥 Seri Kralı | 20 ardışık doğru tahmin | Altın |
| 🔥 Seri Efsanesi | 50 ardışık doğru tahmin | Elmas |

### Tahmin Tanrısı Rozetleri

| Rozet | Koşul | Seviye |
|-------|-------|--------|
| 💯 Mükemmel Maç | Bir maçta tüm tahminler doğru | Platin |
| 🎯 Tahmin Ustası | 100 doğru tahmin | Altın |
| 🎯 Tahmin Efsanesi | 500 doğru tahmin | Elmas |

---

## 🎉 Rozet Kazanma Popup'ı

Rozet kazanıldığında otomatik olarak şu popup gösterilir:

```
┌─────────────────────────────────┐
│  🎉 Yeni Rozet Kazandın!        │
├─────────────────────────────────┤
│                                 │
│         🇹🇷                     │
│                                 │
│   Süper Lig Gurusu              │
│                                 │
│   Süper Lig'de %85+ doğruluk    │
│                                 │
├─────────────────────────────────┤
│   [Paylaş]        [Tamam]       │
└─────────────────────────────────┘
```

---

## 🚀 Sonraki Adımlar

1. **calculateUserStats()** fonksiyonunu implement et
2. **BadgeDetailModal** component'ini oluştur
3. **Sosyal paylaşım** özelliğini ekle
4. **Rozet progress bar'ı** ekle (örn: "20 seri rozetine 5 tahmin kaldı")

---

**Not:** Rozet sistemi tamamen frontend'de çalışıyor (AsyncStorage). Backend entegrasyonu için API endpoint'leri eklenebilir.
