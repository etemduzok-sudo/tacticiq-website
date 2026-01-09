# 🌟 Stratejik Odak ve Şeffaf Puanlama Sistemi

**Fan Manager 2026** - Tahmin Sistemine Derinlik Katan Yeni Özellikler

---

## 📋 Genel Bakış

Bu sistem, oyuncuların tahmin yapma deneyimini derinleştirmek ve puanlama sürecini şeffaflaştırmak için tasarlanmıştır. Oyuncular artık:

1. **Tahminlerini stratejik olarak gruplandırabilir** (4 analiz kümesi)
2. **Antrenman seçimleriyle puan çarpanları kazanabilir**
3. **En güvendikleri 3 tahmini "Odak" olarak işaretleyebilir** (Yüksek Risk/Yüksek Ödül)
4. **Maç sonunda detaylı analiz raporu görebilir**
5. **Dinamik analist notları alabilir**

---

## 🎯 1. Tahmin Gruplandırma (4 Analiz Kümesi)

Tüm tahmin kategorileri 4 ana kümeye ayrılmıştır:

### ⚡ Tempo & Akış
- İlk gol dakikası
- Uzatma süreleri
- Tempo
- Senaryo
- Toplam gol

### 💪 Fiziksel & Yıpranma
- Sakatlıklar
- Oyuncu değişiklikleri
- Yedek oyuncu tahminleri

### 🟨 Disiplin
- Sarı kartlar
- Kırmızı kartlar
- İkinci sarıdan kırmızı
- Penaltı

### ⭐ Bireysel Performans
- Maçın adamı
- Golü atan oyuncu
- Asist
- Skor tahminleri

**Dosya:** `src/types/prediction.types.ts`

```typescript
export enum AnalysisCluster {
  TEMPO_FLOW = 'tempo_flow',
  PHYSICAL_FATIGUE = 'physical_fatigue',
  DISCIPLINE = 'discipline',
  INDIVIDUAL = 'individual',
}
```

---

## 💪 2. Antrenman Çarpan Sistemi

Oyuncular antrenman seçerek belirli kümelerdeki tahminlerden daha fazla puan kazanabilir.

### Antrenman Tipleri ve Çarpanları

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

**Dosya:** `src/types/prediction.types.ts`

```typescript
export const TRAINING_MULTIPLIERS: Record<TrainingType, Partial<Record<AnalysisCluster, number>>> = {
  [TrainingType.DEFENSE]: {
    [AnalysisCluster.DISCIPLINE]: 1.2,
    [AnalysisCluster.PHYSICAL_FATIGUE]: 1.2,
  },
  // ...
};
```

---

## ⭐ 3. Stratejik Odak Sistemi (Focus/Star)

Oyuncular en güvendikleri **maksimum 3 tahmini** "Odak" olarak işaretleyebilir.

### Mekanik

| Durum | Çarpan | Açıklama |
|-------|--------|----------|
| ✅ Doğru | **2.0x** | Puan ikiye katlanır |
| ❌ Yanlış | **-1.5x** | Puan ceza olarak düşer |

**Örnek:**
- Oyuncu "Toplam Gol" tahminini odak olarak işaretler (Baz puan: 10)
- Tahmin doğruysa: 10 × 2.0 = **+20 puan**
- Tahmin yanlışsa: 10 × -1.5 = **-15 puan**

### UI/UX

- Her tahmin kartının sağ üst köşesinde **⭐ (Star)** ikonu
- Maksimum 3 odak seçilebilir
- Odak sayısı info banner'da gösterilir
- Odaklanılan tahminler altın sarısı (#F59E0B) ile vurgulanır

**Dosya:** `src/components/match/MatchPrediction.tsx`

```typescript
const toggleFocus = (category: string, playerId?: number) => {
  // Max 3 focus kontrolü
  if (focusedPredictions.length >= SCORING_CONSTANTS.MAX_FOCUS) {
    Alert.alert('Maksimum Odak Sayısı!', '...');
    return;
  }
  // Focus ekle/çıkar
};
```

---

## 📊 4. Şeffaf Puanlama Ekranı

Maç sonunda oyuncular detaylı bir analiz raporu görür.

### Gösterilen Bilgiler

#### 📈 Küme Bazlı Puan Özeti
Her küme için:
- Toplam kazanılan puan
- Doğruluk yüzdesi (%)
- Doğru/Toplam tahmin sayısı

#### 🌟 Odaklanılan Tahminler İstatistiği
- Doğru odak sayısı (2x puan)
- Yanlış odak sayısı (-1.5x ceza)

#### 📝 Maç Sonu Analist Notu
Dinamik olarak oluşturulan, performansa özel mesajlar.

**Dosya:** `src/components/match/MatchRatings.tsx`

```typescript
{predictionReport && (
  <Animated.View style={styles.analysisCard}>
    <Text>{predictionReport.analystNote}</Text>
    {predictionReport.clusterScores.map(cluster => (
      <ClusterScoreCard cluster={cluster} />
    ))}
  </Animated.View>
)}
```

---

## 💬 5. Dinamik Analist Notları

Sistem, oyuncunun performansına göre otomatik mesajlar oluşturur.

### Mesaj Mantığı

| Genel Doğruluk | En İyi Küme | En Kötü Küme | Mesaj Tipi |
|----------------|-------------|--------------|------------|
| ≥ 70% | ✅ | - | "Mükemmel performans!" |
| 50-69% | ✅ | ❌ | "İyi ama gelişim gerekli" |
| < 50% | - | ❌ | "Zayıf, çalışmaya devam" |

### Örnek Mesajlar

**Tempo & Akış (İyi):**
- "Bugün tempoyu harika okudun! 🎯"
- "Maçın akışını mükemmel tahmin ettin! ⚡"

**Disiplin (Kötü):**
- "Kart tahminlerinde zayıf kaldın. 🟨"
- "Disiplin analizini geliştir. 📝"

**Dosya:** `src/services/predictionScoringService.ts`

```typescript
export function generateAnalystNote(
  bestCluster: AnalysisCluster,
  worstCluster: AnalysisCluster,
  overallAccuracy: number
): string {
  const bestNote = ANALYST_NOTES[bestCluster].good[random];
  const worstNote = ANALYST_NOTES[worstCluster].bad[random];
  
  if (overallAccuracy >= 70) {
    return `${bestNote} Genel performansın mükemmel! 🌟`;
  }
  // ...
}
```

---

## 🔧 Teknik Detaylar

### Dosya Yapısı

```
src/
├── types/
│   └── prediction.types.ts          # Type tanımları, enum'lar, sabitler
├── services/
│   └── predictionScoringService.ts  # Puan hesaplama logic'i
├── components/
│   └── match/
│       ├── MatchPrediction.tsx      # Focus sistemi entegrasyonu
│       └── MatchRatings.tsx         # Şeffaf puanlama ekranı
└── docs/
    └── STRATEGIC_FOCUS_SYSTEM.md    # Bu belge
```

### State Yönetimi

**MatchPrediction.tsx:**
```typescript
const [focusedPredictions, setFocusedPredictions] = useState<FocusPrediction[]>([]);
const [selectedTraining, setSelectedTraining] = useState<TrainingType | null>(null);
```

**AsyncStorage Kaydı:**
```typescript
const predictionData = {
  matchId: matchData.id,
  matchPredictions: predictions,
  playerPredictions: playerPredictions,
  focusedPredictions: focusedPredictions,  // 🌟 Yeni
  selectedTraining: selectedTraining,       // 💪 Yeni
  timestamp: new Date().toISOString(),
};
```

### Puan Hesaplama Formülü

```
Final Puan = Baz Puan × Antrenman Çarpanı × Odak Çarpanı
```

**Örnek:**
- Baz Puan: 20 (Orta zorluk tahmin)
- Antrenman: Savunma (+20% Disiplin)
- Odak: Evet (Doğru = 2x)
- **Sonuç:** 20 × 1.2 × 2.0 = **48 puan**

---

## 🎮 Kullanıcı Akışı

### 1. Tahmin Yapma
1. Oyuncu maç detayına girer
2. "Tahmin Yap" sekmesine tıklar
3. Antrenman tipi seçer (opsiyonel)
4. Tahminlerini yapar
5. En güvendiği 3 tahmini ⭐ ile işaretler
6. "Tahminleri Kaydet" butonuna basar

### 2. Maç Sonrası
1. Maç biter
2. Oyuncu "Değerlendirme" sekmesine girer
3. "Tahmin Analizi" kartını görür
4. Karta tıklayarak detayları açar
5. Küme bazlı puanları ve analist notunu okur
6. Odak istatistiklerini kontrol eder

---

## 🚀 Gelecek Geliştirmeler

### Potansiyel Eklemeler

1. **Antrenman Seçim Ekranı**
   - Maç öncesi dedicated antrenman seçim UI'ı
   - Her antrenmanın etkilediği kümelerin görsel gösterimi

2. **Tahmin Geçmişi**
   - Oyuncunun hangi kümelerde daha başarılı olduğu
   - Zaman içinde gelişim grafiği

3. **Liderlik Tablosu**
   - Küme bazlı liderlik tabloları
   - "En iyi Tempo Analisti" rozetleri

4. **AI Önerileri**
   - Geçmiş performansa göre antrenman önerisi
   - Hangi tahminlere odaklanması gerektiği tavsiyesi

---

## 📝 Notlar

- Tüm UI değişiklikleri mevcut tasarım sistemine uyumlu
- Hiçbir breaking change yok
- Geriye dönük uyumlu (eski tahminler çalışmaya devam eder)
- Performans optimizasyonu yapılmış (React.memo, useMemo)

---

**Son Güncelleme:** 8 Ocak 2026  
**Versiyon:** 1.0.0  
**Geliştirici:** Fan Manager 2026 Team
