export const formations = [
  { 
    id: '2-3-5',
    name: '2-3-5 (Classic WM)',
    type: 'attack',
    positions: ['GK', 'CB', 'CB', 'CM', 'CM', 'CM', 'LW', 'RW', 'ST', 'ST', 'ST'],
    description: 'Klasik WM dizilişi. Futbol tarihinden. Beşli atak!',
    pros: ['Maksimum atak', 'Nostalji', 'Çok sayıda hücum oyuncusu'],
    cons: ['Savunma yok denecek kadar az', 'Modern futbola uygun değil', 'İntihar taktiği'],
    bestFor: 'Eğlence maçları, çaresiz durumlar, risk alma'
  },
  { 
    id: '3-3-3-1',
    name: '3-3-3-1',
    type: 'attack',
    positions: ['GK', 'CB', 'CB', 'CB', 'CM', 'CM', 'CM', 'LW', 'CAM', 'RW', 'ST'],
    description: 'Yaratıcı üçlü hücum arkasında tek forvet.',
    pros: ['Esnek hücum', 'Yaratıcılık', 'Pozisyon değişimi'],
    cons: ['3 stoper riski', 'Savunma zayıf'],
    bestFor: 'Yaratıcı kanat oyuncuları, akıllı forvet'
  },
  { 
    id: '3-3-4',
    name: '3-3-4 (Ultra Attack)',
    type: 'attack',
    positions: ['GK', 'CB', 'CB', 'CB', 'CM', 'CM', 'CM', 'LW', 'ST', 'ST', 'RW'],
    description: 'Topyekün saldırı. Dörtlü atak hattı.',
    pros: ['Maksimum hücum gücü', 'Çok sayıda gol yolu', 'Baskı'],
    cons: ['Savunma çok zayıf', 'Kontraya açık', 'Çok riskli'],
    bestFor: 'Gol şart, zayıf rakipler, oyun sonu riski'
  },
  { 
    id: '3-4-1-2',
    name: '3-4-1-2',
    type: 'attack',
    positions: ['GK', 'CB', 'CB', 'CB', 'LM', 'CM', 'CM', 'RM', 'CAM', 'ST', 'ST'],
    description: 'Kompakt atak dizilişi. 10 numara arkasında çift forvet.',
    pros: ['Güçlü forvet ikilisi', '10 numara destek', 'Dar alan etkinliği'],
    cons: ['Kanat oyunu yok', '3 stoper riski'],
    bestFor: 'Güçlü forvet ikilisi, teknik 10 numara'
  },
  { 
    id: '3-4-2-1',
    name: '3-4-2-1 (Diamond)',
    type: 'balanced',
    positions: ['GK', 'CB', 'CB', 'CB', 'LM', 'CM', 'CM', 'RM', 'CAM', 'CAM', 'ST'],
    description: 'Elmas orta saha yapısı. İkili 10 numara.',
    pros: ['Yaratıcı oyun', 'Orta saha yoğunluğu', 'Esnek pozisyonlar'],
    cons: ['3 stoper riski', 'Kanat zayıflığı'],
    bestFor: 'Yaratıcı oyuncular, dar alan kombinasyonları'
  },
  { 
    id: '3-4-3',
    name: '3-4-3 (Attacking)',
    type: 'attack',
    positions: ['GK', 'CB', 'CB', 'CB', 'LM', 'CM', 'CM', 'RM', 'LW', 'ST', 'RW'],
    description: 'Agresif hücum düzeni. Üçlü forvet hattı.',
    pros: ['Çok sayıda hücum oyuncusu', 'Baskı yapabilme', 'Geniş alan kullanımı'],
    cons: ['Savunmada sayısal dezavantaj', 'Yüksek risk'],
    bestFor: 'Gol gereken durumlar, zayıf savunmalı rakipler'
  },
  { 
    id: '3-5-2',
    name: '3-5-2 (Wing Back)',
    type: 'balanced',
    positions: ['GK', 'CB', 'CB', 'CB', 'LWB', 'CM', 'CM', 'CM', 'RWB', 'ST', 'ST'],
    description: 'Kanat beklerle geniş alan kullanımı. Esnek yapı.',
    pros: ['Güçlü kanat oyunu', 'Orta saha üstünlüğü', 'Çift forvet'],
    cons: ['Kanat beklere yüksek yük', '3 stoperle risk'],
    bestFor: 'Çok yönlü kanat oyuncuları, fiziksel kadrolar'
  },
  { 
    id: '3-6-1',
    name: '3-6-1 (Control)',
    type: 'defense',
    positions: ['GK', 'CB', 'CB', 'CB', 'LM', 'CM', 'CM', 'CM', 'CM', 'RM', 'ST'],
    description: 'Top hakimiyeti odaklı. Altılı orta saha bloku.',
    pros: ['Mutlak orta saha kontrolü', 'Top sahipliği', 'Rakip baskısını kırma'],
    cons: ['Atak potansiyeli düşük', 'Monoton oyun'],
    bestFor: 'Teknik kadrolar, tempo kontrolü'
  },
  { 
    id: '4-1-2-3',
    name: '4-1-2-3',
    type: 'attack',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CM', 'CM', 'LW', 'ST', 'RW'],
    description: 'Tek pivot arkasında yaratıcı ikili.',
    pros: ['Yaratıcı orta saha', 'Geniş atak', 'Tek pivot kontrolü'],
    cons: ['Pivot üzerinde yük', 'Orta sahada sayısal dezavantaj'],
    bestFor: 'Güçlü pivot, yaratıcı orta saha oyuncuları'
  },
  { 
    id: '4-1-3-2',
    name: '4-1-3-2',
    type: 'balanced',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'LM', 'CAM', 'RM', 'ST', 'ST'],
    description: 'Dar alan oyununda etkili. Çift forvet.',
    pros: ['Yaratıcı 10 numara', 'Çift forvet ikilisi', 'Pivot güvenliği'],
    cons: ['Kanat oyunu sınırlı', 'Geniş alanlarda zorlanabilir'],
    bestFor: 'Teknik 10 numara, güçlü forvet ikilisi'
  },
  { 
    id: '4-1-4-1',
    name: '4-1-4-1',
    type: 'defense',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'LM', 'CM', 'CM', 'RM', 'ST'],
    description: 'Kompakt savunma. Dörtlü orta saha bloku.',
    pros: ['Güçlü savunma', 'Orta saha yoğunluğu', 'Kolay öğrenilir'],
    cons: ['Forvet yalnız kalır', 'Atak potansiyeli düşük'],
    bestFor: 'Savunma odaklı oyun, güçlü forvet'
  },
  { 
    id: '4-2-2-2',
    name: '4-2-2-2',
    type: 'balanced',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CDM', 'CAM', 'CAM', 'ST', 'ST'],
    description: 'Dengeli yapı. Çift pivot, çift 10, çift forvet.',
    pros: ['Dengeli savunma-atak', 'Çift forvet avantajı', 'Yaratıcı ikili'],
    cons: ['Kanat oyunu yok', 'Dar alan kombinasyonları gerektirir'],
    bestFor: 'Teknik oyuncular, dar alan ustası kadrolar'
  },
  { 
    id: '4-2-3-1',
    name: '4-2-3-1',
    type: 'balanced',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CDM', 'LM', 'CAM', 'RM', 'ST'],
    description: 'Modern futbolun en popüler dizilişi. Çift pivot güvenliği.',
    pros: ['Çift pivot güvenliği', 'Yaratıcı 10 numara', 'Dengeli yapı'],
    cons: ['Tek forvet yük', 'Teknik oyuncular gerektirir'],
    bestFor: 'Yaratıcı 10 numara, güçlü forvet'
  },
  { 
    id: '4-3-1-2',
    name: '4-3-1-2',
    type: 'balanced',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'CAM', 'ST', 'ST'],
    description: 'Dar alan dominasyonu. 10 numara arkasında ikili forvet.',
    pros: ['Güçlü orta saha kontrolü', 'Çift forvet avantajı', 'Dar alan oyununda etkili'],
    cons: ['Kanat oyununda zayıf', 'Teknik oyuncular gerektirir'],
    bestFor: 'Teknik kadrolar, dar alan kombinasyonları'
  },
  { 
    id: '4-3-2-1',
    name: '4-3-2-1 (Christmas Tree)',
    type: 'balanced',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'CAM', 'CAM', 'ST'],
    description: 'Çam ağacı dizilişi. İkili 10 numara desteği.',
    pros: ['Yaratıcı oyun', 'Orta saha üstünlüğü', 'Esnek pozisyonlar'],
    cons: ['Tek forvet yalnız', 'Kanat oyunu yok'],
    bestFor: 'Yaratıcı oyuncular, teknik forvet'
  },
  { 
    id: '4-3-3',
    name: '4-3-3 (Attack)',
    type: 'attack',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW'],
    description: 'Dengeli ve esnek formasyon. Modern futbolun klasiği.',
    pros: ['Dengeli savunma-atak', 'Geniş alan kullanımı', 'Esnek yapı'],
    cons: ['Orta sahada sayısal dezavantaj olabilir', 'Kanat beklere yük'],
    bestFor: 'Hızlı kanat oyuncuları, teknik orta saha'
  },
  { 
    id: '4-3-3-holding',
    name: '4-3-3 (Holding)',
    type: 'defense',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CM', 'CM', 'LW', 'ST', 'RW'],
    description: 'Savunma odaklı 4-3-3. Tek pivot ile güvenlik.',
    pros: ['Savunma güvenliği', 'Geniş alan kullanımı', 'Dengeli'],
    cons: ['Atak potansiyeli düşük', 'Pivot üzerinde yük'],
    bestFor: 'Savunma oyunu, güçlü pivot oyuncu'
  },
  { 
    id: '4-3-3-false9',
    name: '4-3-3 (False 9)',
    type: 'attack',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'CF', 'RW'],
    description: 'Klasik forvet yok. Sahte dokuzlu ile yaratıcılık.',
    pros: ['Rakip savunma şaşırtma', 'Top hakimiyeti', 'Yaratıcı oyun'],
    cons: ['Klasik forvet yok', 'Gol bulmak zor', 'Yüksek IQ gerektirir'],
    bestFor: 'Teknik kadrolar, akıllı oyuncular'
  },
  { 
    id: '4-4-1-1',
    name: '4-4-1-1',
    type: 'balanced',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'CAM', 'ST'],
    description: 'Kompakt orta saha. 10 numara desteği.',
    pros: ['Orta saha kontrolü', 'Yaratıcı 10 numara', 'Savunma güvenliği'],
    cons: ['Tek forvet yük', 'Atak seçenekleri sınırlı'],
    bestFor: 'Yaratıcı 10 numara, fiziksel forvet'
  },
  { 
    id: '4-4-2',
    name: '4-4-2 (Classic)',
    type: 'balanced',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'ST', 'ST'],
    description: 'Futbolun en klasik dizilişi. Her duruma uygun.',
    pros: ['Kolay öğrenilir', 'Dengeli savunma-atak', 'Çift forvet avantajı'],
    cons: ['Orta sahada sayısal dezavantaj', 'Modern takımlara karşı zorlanabilir'],
    bestFor: 'Dengeli oyun tarzı, takım kimyası yüksek kadrolar'
  },
  { 
    id: '4-4-2-diamond',
    name: '4-4-2 (Diamond)',
    type: 'balanced',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'LM', 'RM', 'CAM', 'ST', 'ST'],
    description: 'Elmas orta saha. Çift forvet desteği.',
    pros: ['Orta saha kontrolü', 'Yaratıcı oyun', 'Çift forvet'],
    cons: ['Kanat oyunu zayıf', 'Kanat beklere yük'],
    bestFor: 'Teknik orta saha, güçlü forvet ikilisi'
  },
  { 
    id: '4-5-1',
    name: '4-5-1 (Defensive)',
    type: 'defense',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'CM', 'RM', 'ST'],
    description: 'Savunma kalelenmesi. Beşli orta saha bloku.',
    pros: ['Maksimum savunma', 'Orta saha yoğunluğu', 'Kontra atak'],
    cons: ['Atak potansiyeli çok düşük', 'Forvet yalnız', 'Pasif oyun'],
    bestFor: 'Skor koruma, savunma oyunu, zayıf kadrolar'
  },
  { 
    id: '4-5-1-attack',
    name: '4-5-1 (Attack)',
    type: 'balanced',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CAM', 'CAM', 'RM', 'ST'],
    description: 'Ofansif 4-5-1. İkili 10 numara desteği.',
    pros: ['Yaratıcı orta saha', 'Kanat oyunu', 'Savunma güvenliği'],
    cons: ['Tek forvet yük', 'Karmaşık yapı'],
    bestFor: 'Yaratıcı oyuncular, teknik forvet'
  },
  { 
    id: '5-3-2',
    name: '5-3-2 (Wing Back)',
    type: 'defense',
    positions: ['GK', 'LWB', 'CB', 'CB', 'CB', 'RWB', 'CM', 'CM', 'CM', 'ST', 'ST'],
    description: 'Beşli savunma. Kanat bekleriyle geniş alan.',
    pros: ['Maksimum savunma güvenliği', 'Kanat oyunu', 'Çift forvet'],
    cons: ['Çok savunmacı', 'Kanat beklere yüksek yük', 'Atak potansiyeli düşük'],
    bestFor: 'Savunma oyunu, güçlü kanat bekleri'
  },
  { 
    id: '5-4-1',
    name: '5-4-1 (Ultra Defense)',
    type: 'defense',
    positions: ['GK', 'LWB', 'CB', 'CB', 'CB', 'RWB', 'LM', 'CM', 'CM', 'RM', 'ST'],
    description: 'Maksimum savunma kalelenmesi. Dokuzlu savunma bloku.',
    pros: ['Maksimum savunma', 'Kolay organize edilir', 'Skor koruma'],
    cons: ['Neredeyse sıfır atak', 'Forvet tamamen yalnız', 'Çok pasif'],
    bestFor: 'Skor koruma, savunma kalelenmesi, zayıf kadrolar'
  },
  { 
    id: '4-2-4',
    name: '4-2-4 (Total Attack)',
    type: 'attack',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'LW', 'ST', 'ST', 'RW'],
    description: 'Topyekün hücum. Dörtlü atak hattı ile maksimum gol tehdidi.',
    pros: ['Maksimum atak gücü', 'Geniş hücum alanı', 'Çok sayıda gol yolu'],
    cons: ['Orta saha çok zayıf', 'Kontraya açık', 'Savunma riski'],
    bestFor: 'Gol şart durumlar, zayıf rakipler, son dakika baskısı'
  },
  { 
    id: '4-1-2-1-2',
    name: '4-1-2-1-2 (Narrow)',
    type: 'balanced',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CM', 'CM', 'CAM', 'ST', 'ST'],
    description: 'Dar elmas dizilişi. Orta saha hakimiyeti ile çift forvet.',
    pros: ['Güçlü orta saha', 'Çift forvet', 'Kompakt yapı'],
    cons: ['Kanat oyunu yok', 'Beklere yük biner', 'Dar alan gerektirir'],
    bestFor: 'Teknik orta saha, güçlü forvet ikilisi'
  },
];

/** Formasyon ID → pozisyon etiketleri (GK, LB, CB, ...) – Kadro ve Tahmin aynı gösterim için */
export const formationLabels: Record<string, string[]> = formations.reduce(
  (acc, f) => {
    acc[f.id] = f.positions;
    return acc;
  },
  {} as Record<string, string[]>
);

// Formation Positions - ALL 26 FORMATIONS - Optimized spacing to prevent overlap
// Minimum horizontal gap: 20%, Edge padding: 12-88%, GK max y: 88%
export const formationPositions: Record<string, Array<{ x: number; y: number }>> = {
  '2-3-5': [
    { x: 50, y: 88 }, // GK
    { x: 30, y: 70 }, { x: 70, y: 70 }, // 2 defenders - wider
    { x: 25, y: 50 }, { x: 50, y: 52 }, { x: 75, y: 50 }, // 3 midfield - wider
    { x: 12, y: 25 }, { x: 88, y: 25 }, // Wide attackers
    { x: 30, y: 12 }, { x: 50, y: 8 }, { x: 70, y: 12 }, // 3 strikers
  ],
  '3-3-3-1': [
    { x: 50, y: 88 }, // GK
    { x: 22, y: 70 }, { x: 50, y: 72 }, { x: 78, y: 70 }, // 3 defenders - wider
    { x: 25, y: 50 }, { x: 50, y: 52 }, { x: 75, y: 50 }, // 3 midfield
    { x: 12, y: 28 }, { x: 50, y: 25 }, { x: 88, y: 28 }, // 3 CAM
    { x: 50, y: 8 }, // 1 striker
  ],
  '3-3-4': [
    { x: 50, y: 88 }, // GK
    { x: 22, y: 70 }, { x: 50, y: 72 }, { x: 78, y: 70 }, // 3 defenders
    { x: 25, y: 50 }, { x: 50, y: 52 }, { x: 75, y: 50 }, // 3 midfield
    { x: 12, y: 20 }, { x: 37, y: 12 }, { x: 63, y: 12 }, { x: 88, y: 20 }, // 4 attackers
  ],
  '3-4-1-2': [
    { x: 50, y: 88 }, // GK
    { x: 22, y: 70 }, { x: 50, y: 72 }, { x: 78, y: 70 }, // 3 defenders
    { x: 12, y: 50 }, { x: 37, y: 52 }, { x: 63, y: 52 }, { x: 88, y: 50 }, // 4 midfield
    { x: 50, y: 32 }, // CAM
    { x: 35, y: 12 }, { x: 65, y: 12 }, // 2 strikers
  ],
  '3-4-2-1': [
    { x: 50, y: 88 }, // GK
    { x: 22, y: 70 }, { x: 50, y: 72 }, { x: 78, y: 70 }, // 3 defenders
    { x: 12, y: 50 }, { x: 37, y: 52 }, { x: 63, y: 52 }, { x: 88, y: 50 }, // 4 midfield
    { x: 32, y: 28 }, { x: 68, y: 28 }, // 2 CAM
    { x: 50, y: 8 }, // 1 striker
  ],
  '3-4-3': [
    { x: 50, y: 88 }, // GK
    { x: 22, y: 68 }, { x: 50, y: 70 }, { x: 78, y: 68 }, // 3 defenders
    { x: 12, y: 48 }, { x: 37, y: 50 }, { x: 63, y: 50 }, { x: 88, y: 48 }, // 4 midfield
    { x: 12, y: 18 }, { x: 50, y: 10 }, { x: 88, y: 18 }, // 3 attackers
  ],
  '3-5-2': [
    { x: 50, y: 88 }, // GK
    { x: 22, y: 68 }, { x: 50, y: 70 }, { x: 78, y: 68 }, // 3 defenders
    { x: 12, y: 45 }, { x: 32, y: 48 }, { x: 50, y: 50 }, { x: 68, y: 48 }, { x: 88, y: 45 }, // 5 midfield
    { x: 35, y: 15 }, { x: 65, y: 15 }, // 2 strikers
  ],
  '3-6-1': [
    { x: 50, y: 88 }, // GK
    { x: 22, y: 70 }, { x: 50, y: 72 }, { x: 78, y: 70 }, // 3 defenders
    { x: 12, y: 52 }, { x: 28, y: 48 }, { x: 42, y: 45 }, { x: 58, y: 45 }, { x: 72, y: 48 }, { x: 88, y: 52 }, // 6 midfield
    { x: 50, y: 12 }, // 1 striker
  ],
  '4-1-2-3': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // 4 defenders
    { x: 50, y: 55 }, // CDM
    { x: 32, y: 40 }, { x: 68, y: 40 }, // 2 CM
    { x: 12, y: 18 }, { x: 50, y: 10 }, { x: 88, y: 18 }, // 3 attackers
  ],
  '4-1-3-2': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // 4 defenders
    { x: 50, y: 55 }, // CDM
    { x: 12, y: 38 }, { x: 50, y: 35 }, { x: 88, y: 38 }, // 3 CAM
    { x: 35, y: 12 }, { x: 65, y: 12 }, // 2 strikers
  ],
  '4-1-4-1': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // 4 defenders
    { x: 50, y: 55 }, // CDM
    { x: 12, y: 40 }, { x: 37, y: 42 }, { x: 63, y: 42 }, { x: 88, y: 40 }, // 4 midfield
    { x: 50, y: 12 }, // 1 striker
  ],
  '4-2-2-2': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // 4 defenders
    { x: 32, y: 55 }, { x: 68, y: 55 }, // 2 CDM
    { x: 32, y: 35 }, { x: 68, y: 35 }, // 2 CAM
    { x: 35, y: 12 }, { x: 65, y: 12 }, // 2 strikers
  ],
  '4-2-3-1': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 68 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 88, y: 68 }, // 4 defenders
    { x: 32, y: 52 }, { x: 68, y: 52 }, // 2 CDM
    { x: 12, y: 30 }, { x: 50, y: 28 }, { x: 88, y: 30 }, // 3 CAM
    { x: 50, y: 8 }, // 1 striker
  ],
  '4-3-1-2': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // 4 defenders
    { x: 25, y: 52 }, { x: 50, y: 54 }, { x: 75, y: 52 }, // 3 midfield
    { x: 50, y: 32 }, // CAM
    { x: 35, y: 12 }, { x: 65, y: 12 }, // 2 strikers
  ],
  '4-3-2-1': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // 4 defenders
    { x: 25, y: 52 }, { x: 50, y: 54 }, { x: 75, y: 52 }, // 3 midfield
    { x: 32, y: 28 }, { x: 68, y: 28 }, // 2 CAM
    { x: 50, y: 8 }, // 1 striker
  ],
  '4-3-3': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 68 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 88, y: 68 }, // 4 defenders
    { x: 25, y: 45 }, { x: 50, y: 48 }, { x: 75, y: 45 }, // 3 midfield
    { x: 12, y: 18 }, { x: 50, y: 10 }, { x: 88, y: 18 }, // 3 attackers
  ],
  '4-3-3-holding': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // 4 defenders
    { x: 50, y: 55 }, // CDM
    { x: 32, y: 40 }, { x: 68, y: 40 }, // 2 CM
    { x: 12, y: 18 }, { x: 50, y: 12 }, { x: 88, y: 18 }, // 3 attackers
  ],
  '4-3-3-false9': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // 4 defenders
    { x: 25, y: 48 }, { x: 50, y: 45 }, { x: 75, y: 48 }, // 3 midfield
    { x: 12, y: 18 }, { x: 50, y: 25 }, { x: 88, y: 18 }, // 3 attackers (false 9)
  ],
  '4-4-1-1': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 68 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 88, y: 68 }, // Defense - V
    { x: 12, y: 46 }, { x: 37, y: 48 }, { x: 63, y: 48 }, { x: 88, y: 46 }, // Midfield - V
    { x: 50, y: 26 }, // CAM
    { x: 50, y: 10 }, // ST
  ],
  '4-4-2': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 68 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 88, y: 68 }, // 4 defenders
    { x: 12, y: 45 }, { x: 37, y: 48 }, { x: 63, y: 48 }, { x: 88, y: 45 }, // 4 midfield
    { x: 35, y: 15 }, { x: 65, y: 15 }, // 2 strikers
  ],
  '4-4-2-diamond': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // 4 defenders
    { x: 50, y: 55 }, // CDM
    { x: 25, y: 42 }, { x: 75, y: 42 }, // 2 CM
    { x: 50, y: 28 }, // CAM
    { x: 35, y: 12 }, { x: 65, y: 12 }, // 2 strikers
  ],
  '4-5-1': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 68 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 88, y: 68 }, // 4 defenders
    { x: 12, y: 45 }, { x: 32, y: 48 }, { x: 50, y: 50 }, { x: 68, y: 48 }, { x: 88, y: 45 }, // 5 midfield
    { x: 50, y: 12 }, // 1 striker
  ],
  '4-5-1-attack': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // 4 defenders
    { x: 12, y: 48 }, { x: 32, y: 50 }, { x: 50, y: 38 }, { x: 68, y: 50 }, { x: 88, y: 48 }, // 5 midfield
    { x: 50, y: 10 }, // 1 striker
  ],
  '5-3-2': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 68 }, { x: 30, y: 70 }, { x: 50, y: 72 }, { x: 70, y: 70 }, { x: 88, y: 68 }, // 5 defenders
    { x: 25, y: 48 }, { x: 50, y: 50 }, { x: 75, y: 48 }, // 3 midfield
    { x: 35, y: 18 }, { x: 65, y: 18 }, // 2 strikers
  ],
  '5-4-1': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 66 }, { x: 30, y: 68 }, { x: 50, y: 70 }, { x: 70, y: 68 }, { x: 88, y: 66 }, // 5 defenders
    { x: 15, y: 45 }, { x: 38, y: 48 }, { x: 62, y: 48 }, { x: 85, y: 45 }, // 4 midfield
    { x: 50, y: 12 }, // 1 striker
  ],
  '4-2-4': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 68 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 88, y: 68 }, // 4 defenders
    { x: 35, y: 48 }, { x: 65, y: 48 }, // 2 CM
    { x: 12, y: 18 }, { x: 37, y: 12 }, { x: 63, y: 12 }, { x: 88, y: 18 }, // 4 attackers
  ],
  '4-1-2-1-2': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 68 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 88, y: 68 }, // 4 defenders
    { x: 50, y: 55 }, // CDM
    { x: 30, y: 42 }, { x: 70, y: 42 }, // 2 CM
    { x: 50, y: 28 }, // CAM
    { x: 35, y: 12 }, { x: 65, y: 12 }, // 2 strikers
  ],
};
