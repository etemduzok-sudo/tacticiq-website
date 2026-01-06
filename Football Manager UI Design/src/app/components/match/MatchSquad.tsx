import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X, ChevronDown, Info, Flame, Clock, CircleAlert, BarChart3 } from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "../ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { toast } from "sonner";
import { PlayerDetailDrawer } from "./PlayerDetailDrawer";

interface MatchSquadProps {
  matchData: any;
  onComplete: () => void;
}

// 26 FIFA/Wikipedia Standard Formations
const formations = [
  { 
    id: "2-3-5", 
    name: "2-3-5 (Classic WM)", 
    type: "attack", 
    positions: ["GK", "CB", "CB", "CM", "CM", "CM", "LW", "RW", "ST", "ST", "ST"],
    description: "Klasik WM dizilişi. Futbol tarihinden. Beşli atak!",
    pros: ["Maksimum atak", "Nostalji", "Çok sayıda hücum oyuncusu"],
    cons: ["Savunma yok denecek kadar az", "Modern futbola uygun değil", "İntihar taktiği"],
    bestFor: "Eğlence maçları, çaresiz durumlar, risk alma"
  },
  { 
    id: "3-3-3-1", 
    name: "3-3-3-1", 
    type: "attack", 
    positions: ["GK", "CB", "CB", "CB", "CM", "CM", "CM", "LW", "CAM", "RW", "ST"],
    description: "Yaratıcı üçlü hücum arkasında tek forvet.",
    pros: ["Esnek hücum", "Yaratıcılık", "Pozisyon değişimi"],
    cons: ["3 stoper riski", "Savunma zayıf"],
    bestFor: "Yaratıcı kanat oyuncuları, akıllı forvet"
  },
  { 
    id: "3-3-4", 
    name: "3-3-4 (Ultra Attack)", 
    type: "attack", 
    positions: ["GK", "CB", "CB", "CB", "CM", "CM", "CM", "LW", "ST", "ST", "RW"],
    description: "Topyekün saldırı. Dörtlü atak hattı.",
    pros: ["Maksimum hücum gücü", "Çok sayıda gol yolu", "Baskı"],
    cons: ["Savunma çok zayıf", "Kontraya açık", "Çok riskli"],
    bestFor: "Gol şart, zayıf rakipler, oyun sonu riski"
  },
  { 
    id: "3-4-1-2", 
    name: "3-4-1-2", 
    type: "attack", 
    positions: ["GK", "CB", "CB", "CB", "LM", "CM", "CM", "RM", "CAM", "ST", "ST"],
    description: "Kompakt atak dizilişi. 10 numara arkasında çift forvet.",
    pros: ["Güçlü forvet ikilisi", "10 numara destek", "Dar alan etkinliği"],
    cons: ["Kanat oyunu yok", "3 stoper riski"],
    bestFor: "Güçlü forvet ikilisi, teknik 10 numara"
  },
  { 
    id: "3-4-2-1", 
    name: "3-4-2-1 (Diamond)", 
    type: "balanced", 
    positions: ["GK", "CB", "CB", "CB", "LM", "CM", "CM", "RM", "CAM", "CAM", "ST"],
    description: "Elmas orta saha yapısı. İkili 10 numara.",
    pros: ["Yaratıcı oyun", "Orta saha yoğunluğu", "Esnek pozisyonlar"],
    cons: ["3 stoper riski", "Kanat zayıflığı"],
    bestFor: "Yaratıcı oyuncular, dar alan kombinasyonları"
  },
  { 
    id: "3-4-3", 
    name: "3-4-3 (Attacking)", 
    type: "attack", 
    positions: ["GK", "CB", "CB", "CB", "LM", "CM", "CM", "RM", "LW", "ST", "RW"],
    description: "Agresif hücum düzeni. Üçlü forvet hattı.",
    pros: ["Çok sayıda hücum oyuncusu", "Baskı yapabilme", "Geniş alan kullanımı"],
    cons: ["Savunmada sayısal dezavantaj", "Yüksek risk"],
    bestFor: "Gol gereken durumlar, zayıf savunmalı rakipler"
  },
  { 
    id: "3-5-2", 
    name: "3-5-2 (Wing Back)", 
    type: "balanced", 
    positions: ["GK", "CB", "CB", "CB", "LWB", "CM", "CM", "CM", "RWB", "ST", "ST"],
    description: "Kanat beklerle geniş alan kullanımı. Esnek yapı.",
    pros: ["Güçlü kanat oyunu", "Orta saha üstünlüğü", "Çift forvet"],
    cons: ["Kanat beklere yüksek yük", "3 stoperle risk"],
    bestFor: "Çok yönlü kanat oyuncuları, fiziksel kadrolar"
  },
  { 
    id: "3-6-1", 
    name: "3-6-1 (Control)", 
    type: "defense", 
    positions: ["GK", "CB", "CB", "CB", "LM", "CM", "CM", "CM", "CM", "RM", "ST"],
    description: "Top hakimiyeti odaklı. Altılı orta saha bloku.",
    pros: ["Mutlak orta saha kontrolü", "Top sahipliği", "Rakip baskısını kırma"],
    cons: ["Atak potansiyeli düşük", "Monoton oyun"],
    bestFor: "Teknik kadrolar, tempo kontrolü"
  },
  { 
    id: "4-1-2-3", 
    name: "4-1-2-3", 
    type: "attack", 
    positions: ["GK", "LB", "CB", "CB", "RB", "CDM", "CM", "CM", "LW", "ST", "RW"],
    description: "Tek pivot üzerine kurulu hücum düzeni.",
    pros: ["Güçlü hücum", "Esnek orta saha", "Geniş kanat"],
    cons: ["Tek pivot yükü ağır", "Savunmada risk"],
    bestFor: "Güçlü pivot oyuncusu, hızlı kanatlar"
  },
  { 
    id: "4-1-4-1", 
    name: "4-1-4-1 (Defensive)", 
    type: "defense", 
    positions: ["GK", "LB", "CB", "CB", "RB", "CDM", "LM", "CM", "CM", "RM", "ST"],
    description: "Savunma öncelikli yapı. Tek pivot ile kompakt orta saha.",
    pros: ["Sağlam savunma", "Orta sahada sayısal üstünlük", "Kolay organizasyon"],
    cons: ["Atak seçenekleri kısıtlı", "Forvet izole kalır"],
    bestFor: "Güçlü rakiplere karşı savunma stratejisi"
  },
  { 
    id: "4-2-2-2", 
    name: "4-2-2-2 (Narrow)", 
    type: "balanced", 
    positions: ["GK", "LB", "CB", "CB", "RB", "CDM", "CDM", "CAM", "CAM", "ST", "ST"],
    description: "Dar ve kompakt yapı. İkili şekilde oyuncular.",
    pros: ["Dengeli yapı", "Çift pivot güvenliği", "Çift forvet"],
    cons: ["Kanat oyunu yok", "Dar alana bağımlı"],
    bestFor: "Teknik oyuncular, dar alan ustası kadrolar"
  },
  { 
    id: "4-2-3-1", 
    name: "4-2-3-1 (Modern)", 
    type: "attack", 
    positions: ["GK", "LB", "CB", "CB", "RB", "CDM", "CDM", "CAM", "LW", "RW", "ST"],
    description: "Modern futbolun en popüler dizilişi. Çift pivot ile dengeli yapı.",
    pros: ["Çok yönlü orta saha", "Güçlü savunma dengesi", "Esnek pozisyon değişimleri"],
    cons: ["Forvet yalnız kalabilir", "Çift pivot koordinasyonu gerektirir"],
    bestFor: "10 numara oyuncuları, topa sahip olma stratejisi"
  },
  { 
    id: "4-3-2-1", 
    name: "4-3-2-1 (Christmas Tree)", 
    type: "balanced", 
    positions: ["GK", "LB", "CB", "CB", "RB", "CM", "CM", "CM", "CAM", "CAM", "ST"],
    description: "Çam ağacı görünümü. Orta sahada yaratıcılık odaklı diziliş.",
    pros: ["Güçlü orta saha kontrolü", "Çift 10 numara avantajı", "Dar alan oyununda etkili"],
    cons: ["Kanat oyununda zayıf", "Teknik oyuncular gerektirir"],
    bestFor: "Teknik kadrolar, dar alan kombinasyonları"
  },
  { 
    id: "4-3-3", 
    name: "4-3-3 (Attack)", 
    type: "attack", 
    positions: ["GK", "LB", "CB", "CB", "RB", "CM", "CM", "CM", "LW", "ST", "RW"],
    description: "Hücum odaklı, kanat oyununa dayalı modern diziliş. Geniş alan kullanımı sağlar.",
    pros: ["Güçlü kanat oyunu", "Orta saha hakimiyeti", "Hızlı kontra ataklar"],
    cons: ["Savunmada açık kalabilir", "Fiziksel orta sahalara karşı zor"],
    bestFor: "Hızlı kanat oyuncuları, top hakimiyeti stratejisi"
  },
  { 
    id: "4-4-2", 
    name: "4-4-2 (Classic)", 
    type: "balanced", 
    positions: ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CM", "RM", "ST", "ST"],
    description: "Klasik ve dengeli bir diziliş. Her bölgede eşit güç dağılımı sağlar.",
    pros: ["Kolay öğrenilir", "Dengeli savunma-atak", "Çift forvet avantajı"],
    cons: ["Orta sahada sayısal dezavantaj", "Modern takımlara karşı zorlanabilir"],
    bestFor: "Dengeli oyun tarzı, takım kimyası yüksek kadrolar"
  },
  { 
    id: "4-5-1", 
    name: "4-5-1 (Ultra Defensive)", 
    type: "defense", 
    positions: ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CM", "CM", "RM", "ST"],
    description: "Ekstrem savunma taktiği. Dar alan bırakmaz.",
    pros: ["Maksimum savunma güvenliği", "Çok katmanlı blok", "Kontra fırsatları"],
    cons: ["Çok pasif oyun", "Skor bulmak zor", "Baskı altında zor"],
    bestFor: "Son dakika sonuç koruma, çok güçlü rakipler"
  },
  { 
    id: "4-6-0", 
    name: "4-6-0 (False 9)", 
    type: "attack", 
    positions: ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CM", "RM", "CAM", "CAM"],
    description: "Sahte 9 taktiği. Forsuz oyun, pozisyon değişimi.",
    pros: ["Rakip savunma şaşırtma", "Top hakimiyeti", "Yaratıcı oyun"],
    cons: ["Klasik forvet yok", "Gol bulmak zor", "Yüksek IQ gerektirir"],
    bestFor: "Teknik kadrolar, akıllı oyuncular"
  },
  { 
    id: "5-2-3", 
    name: "5-2-3", 
    type: "attack", 
    positions: ["GK", "LWB", "CB", "CB", "CB", "RWB", "CM", "CM", "LW", "ST", "RW"],
    description: "Sağlam savunma ama üçlü atak hattı.",
    pros: ["Dengeli yapı", "Üçlü atak", "Kanat bek desteği"],
    cons: ["Orta saha ince", "Koordinasyon zor"],
    bestFor: "Sağlam savunma + atak gücü dengesi"
  },
  { 
    id: "5-3-2", 
    name: "5-3-2 (Defensive)", 
    type: "defense", 
    positions: ["GK", "LWB", "CB", "CB", "CB", "RWB", "CM", "CM", "CM", "ST", "ST"],
    description: "Beşli savunma. Çok katmanlı blok.",
    pros: ["Maksimum savunma", "Geniş kanat kapama", "Kontra ataklar"],
    cons: ["Çok pasif", "Baskı zor", "Atak sınırlı"],
    bestFor: "Sonuç koruma, güçlü rakipler"
  },
  { 
    id: "5-4-1", 
    name: "5-4-1 (Park the Bus)", 
    type: "defense", 
    positions: ["GK", "LWB", "CB", "CB", "CB", "RWB", "LM", "CM", "CM", "RM", "ST"],
    description: "Ekstrem savunma. 'Otobüsü park etme' taktiği.",
    pros: ["Maksimum kompaktlık", "Alan bırakmaz", "Fiziksel direnç"],
    cons: ["Hiç atak yok", "Çok pasif", "Monoton"],
    bestFor: "Son dakika skor koruma, çok güçlü rakip"
  },
];

const players = [
  { id: 1, name: "Muslera", position: "GK", rating: 85, number: 1, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=1", stats: { pace: 45, shooting: 30, passing: 65, dribbling: 40 }, form: 92, minutes: 88, status: "available" },
  { id: 2, name: "Dubois", position: "RB", rating: 82, number: 2, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=2", stats: { pace: 85, shooting: 65, passing: 78, dribbling: 75 }, form: 80, minutes: 75, status: "available" },
  { id: 3, name: "Nelsson", position: "CB", rating: 80, number: 3, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=3", stats: { pace: 65, shooting: 40, passing: 70, dribbling: 55 }, form: 85, minutes: 90, status: "available" },
  { id: 4, name: "Abdülkerim", position: "CB", rating: 79, number: 4, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=4", stats: { pace: 70, shooting: 45, passing: 72, dribbling: 60 }, form: 82, minutes: 85, status: "available" },
  { id: 5, name: "Kazımcan", position: "LB", rating: 78, number: 5, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=5", stats: { pace: 82, shooting: 60, passing: 75, dribbling: 78 }, form: 78, minutes: 80, status: "yellow_card" },
  { id: 6, name: "Torreira", position: "CDM", rating: 83, number: 34, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=6", stats: { pace: 75, shooting: 68, passing: 82, dribbling: 78 }, form: 90, minutes: 70, status: "yellow_card" },
  { id: 7, name: "Sara", position: "CM", rating: 81, number: 20, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=7", stats: { pace: 78, shooting: 75, passing: 85, dribbling: 82 }, form: 84, minutes: 88, status: "available" },
  { id: 8, name: "Zaha", position: "LW", rating: 84, number: 14, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=8", stats: { pace: 88, shooting: 82, passing: 78, dribbling: 90 }, form: 88, minutes: 65, status: "available" },
  { id: 9, name: "Mertens", position: "CAM", rating: 83, number: 10, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=9", stats: { pace: 80, shooting: 85, passing: 88, dribbling: 87 }, form: 90, minutes: 92, status: "available" },
  { id: 10, name: "Barış Alper", position: "RW", rating: 80, number: 7, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=10", stats: { pace: 86, shooting: 78, passing: 75, dribbling: 84 }, form: 82, minutes: 85, status: "available" },
  { id: 11, name: "Icardi", position: "ST", rating: 85, number: 9, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=11", stats: { pace: 78, shooting: 92, passing: 75, dribbling: 82 }, form: 88, minutes: 72, status: "injured" },
  { id: 12, name: "Oliveira", position: "CM", rating: 77, number: 8, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=12", stats: { pace: 72, shooting: 70, passing: 80, dribbling: 75 }, form: 76, minutes: 82, status: "available" },
  { id: 13, name: "Seferovic", position: "ST", rating: 76, number: 19, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=13", stats: { pace: 75, shooting: 80, passing: 68, dribbling: 70 }, form: 72, minutes: 55, status: "available" },
  { id: 14, name: "Rashica", position: "LW", rating: 78, number: 11, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=14", stats: { pace: 87, shooting: 76, passing: 72, dribbling: 82 }, form: 80, minutes: 60, status: "available" },
  { id: 15, name: "Kerem Demirbay", position: "CM", rating: 79, number: 17, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=15", stats: { pace: 70, shooting: 78, passing: 84, dribbling: 76 }, form: 85, minutes: 78, status: "available" },
  { id: 16, name: "Günay", position: "GK", rating: 72, number: 23, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=16", stats: { pace: 40, shooting: 25, passing: 60, dribbling: 35 }, form: 70, minutes: 12, status: "available" },
  { id: 17, name: "Emin Bayram", position: "CB", rating: 74, number: 42, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=17", stats: { pace: 68, shooting: 38, passing: 68, dribbling: 52 }, form: 75, minutes: 45, status: "available" },
  { id: 18, name: "Boey", position: "RB", rating: 79, number: 93, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=18", stats: { pace: 84, shooting: 62, passing: 74, dribbling: 76 }, form: 82, minutes: 70, status: "suspended" },
  { id: 19, name: "Melo", position: "CDM", rating: 80, number: 83, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=19", stats: { pace: 68, shooting: 65, passing: 80, dribbling: 72 }, form: 78, minutes: 65, status: "available" },
  { id: 20, name: "Midtsjø", position: "CM", rating: 75, number: 27, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=20", stats: { pace: 70, shooting: 72, passing: 78, dribbling: 74 }, form: 73, minutes: 50, status: "available" },
  { id: 21, name: "Mata", position: "CAM", rating: 79, number: 18, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=21", stats: { pace: 65, shooting: 80, passing: 88, dribbling: 85 }, form: 88, minutes: 48, status: "available" },
  { id: 22, name: "Yunus Akgün", position: "RW", rating: 76, number: 15, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=22", stats: { pace: 83, shooting: 74, passing: 70, dribbling: 80 }, form: 79, minutes: 62, status: "available" },
  { id: 23, name: "Yılmaz", position: "ST", rating: 74, number: 99, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=23", stats: { pace: 72, shooting: 78, passing: 65, dribbling: 68 }, form: 70, minutes: 38, status: "available" },
  { id: 24, name: "Jankat", position: "LB", rating: 73, number: 24, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=24", stats: { pace: 78, shooting: 55, passing: 70, dribbling: 72 }, form: 68, minutes: 35, status: "available" },
  { id: 25, name: "Kaan Ayhan", position: "CB", rating: 77, number: 23, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=25", stats: { pace: 66, shooting: 42, passing: 72, dribbling: 58 }, form: 76, minutes: 58, status: "available" },
  { id: 26, name: "Berkan Kutlu", position: "CDM", rating: 75, number: 16, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=26", stats: { pace: 72, shooting: 68, passing: 76, dribbling: 74 }, form: 74, minutes: 52, status: "yellow_card" },
];

const formationPositions: Record<string, Array<{ x: number; y: number }>> = {
  "4-4-2": [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // Defense
    { x: 12, y: 48 }, { x: 37, y: 50 }, { x: 63, y: 50 }, { x: 88, y: 48 }, // Midfield
    { x: 37, y: 20 }, { x: 63, y: 20 }, // Strikers
  ],
  "4-3-3": [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // Defense
    { x: 30, y: 50 }, { x: 50, y: 48 }, { x: 70, y: 50 }, // Midfield
    { x: 15, y: 20 }, { x: 50, y: 15 }, { x: 85, y: 20 }, // Attack
  ],
  "4-2-3-1": [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // Defense
    { x: 35, y: 58 }, { x: 65, y: 58 }, // CDM
    { x: 18, y: 35 }, { x: 50, y: 32 }, { x: 82, y: 35 }, // LW CAM RW
    { x: 50, y: 15 }, // ST
  ],
  "4-3-2-1": [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // Defense
    { x: 30, y: 54 }, { x: 50, y: 52 }, { x: 70, y: 54 }, // CM
    { x: 35, y: 33 }, { x: 65, y: 33 }, // CAM
    { x: 50, y: 15 }, // ST
  ],
  "4-1-4-1": [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // Defense
    { x: 50, y: 58 }, // CDM
    { x: 12, y: 43 }, { x: 37, y: 45 }, { x: 63, y: 45 }, { x: 88, y: 43 }, // LM CM CM RM
    { x: 50, y: 15 }, // ST
  ],
  "4-5-1": [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // Defense
    { x: 12, y: 50 }, { x: 30, y: 48 }, { x: 50, y: 46 }, { x: 70, y: 48 }, { x: 88, y: 50 }, // 5 Midfield
    { x: 50, y: 15 }, // ST
  ],
  "3-5-2": [
    { x: 50, y: 88 }, // GK
    { x: 25, y: 72 }, { x: 50, y: 74 }, { x: 75, y: 72 }, // 3 CB
    { x: 10, y: 50 }, { x: 30, y: 48 }, { x: 50, y: 46 }, { x: 70, y: 48 }, { x: 90, y: 50 }, // 5 Midfield
    { x: 37, y: 18 }, { x: 63, y: 18 }, // 2 ST
  ],
  "3-4-3": [
    { x: 50, y: 88 }, // GK
    { x: 25, y: 72 }, { x: 50, y: 74 }, { x: 75, y: 72 }, // 3 CB
    { x: 15, y: 50 }, { x: 38, y: 48 }, { x: 62, y: 48 }, { x: 85, y: 50 }, // 4 Midfield
    { x: 15, y: 18 }, { x: 50, y: 15 }, { x: 85, y: 18 }, // 3 Attack
  ],
  "3-6-1": [
    { x: 50, y: 88 }, // GK
    { x: 25, y: 72 }, { x: 50, y: 74 }, { x: 75, y: 72 }, // 3 CB
    { x: 10, y: 54 }, { x: 28, y: 50 }, { x: 42, y: 48 }, { x: 58, y: 48 }, { x: 72, y: 50 }, { x: 90, y: 54 }, // 6 Midfield
    { x: 50, y: 15 }, // 1 ST
  ],
  "3-4-2-1": [
    { x: 50, y: 88 }, // GK
    { x: 25, y: 72 }, { x: 50, y: 74 }, { x: 75, y: 72 }, // 3 CB
    { x: 15, y: 52 }, { x: 38, y: 50 }, { x: 62, y: 50 }, { x: 85, y: 52 }, // 4 Midfield
    { x: 35, y: 32 }, { x: 65, y: 32 }, // 2 CAM
    { x: 50, y: 15 }, // 1 ST
  ],
  "3-4-1-2": [
    { x: 50, y: 88 }, // GK
    { x: 25, y: 72 }, { x: 50, y: 74 }, { x: 75, y: 72 }, // 3 CB
    { x: 15, y: 52 }, { x: 38, y: 50 }, { x: 62, y: 50 }, { x: 85, y: 52 }, // 4 Midfield
    { x: 50, y: 32 }, // 1 CAM
    { x: 37, y: 15 }, { x: 63, y: 15 }, // 2 ST
  ],
  "5-3-2": [
    { x: 50, y: 88 }, // GK
    { x: 8, y: 68 }, { x: 28, y: 70 }, { x: 50, y: 72 }, { x: 72, y: 70 }, { x: 92, y: 68 }, // 5 Defense
    { x: 30, y: 50 }, { x: 50, y: 48 }, { x: 70, y: 50 }, // 3 Midfield
    { x: 37, y: 18 }, { x: 63, y: 18 }, // 2 ST
  ],
  "5-4-1": [
    { x: 50, y: 88 }, // GK
    { x: 8, y: 68 }, { x: 28, y: 70 }, { x: 50, y: 72 }, { x: 72, y: 70 }, { x: 92, y: 68 }, // 5 Defense
    { x: 18, y: 48 }, { x: 38, y: 46 }, { x: 62, y: 46 }, { x: 82, y: 48 }, // 4 Midfield
    { x: 50, y: 15 }, // 1 ST
  ],
  "5-2-3": [
    { x: 50, y: 88 }, // GK
    { x: 8, y: 68 }, { x: 28, y: 70 }, { x: 50, y: 72 }, { x: 72, y: 70 }, { x: 92, y: 68 }, // 5 Defense
    { x: 35, y: 50 }, { x: 65, y: 50 }, // 2 Midfield
    { x: 15, y: 18 }, { x: 50, y: 15 }, { x: 85, y: 18 }, // 3 Attack
  ],
  "4-6-0": [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // Defense (4)
    { x: 12, y: 50 }, { x: 35, y: 48 }, { x: 65, y: 48 }, { x: 88, y: 50 }, // 4 orta saha (LM, CM, CM, RM)
    { x: 38, y: 25 }, { x: 62, y: 25 }, // 2 CAM (False 9 bölgesi - forvet yok!)
  ],
  "4-1-2-3": [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // Defense
    { x: 50, y: 60 }, // CDM
    { x: 35, y: 48 }, { x: 65, y: 48 }, // 2 CM
    { x: 15, y: 20 }, { x: 50, y: 15 }, { x: 85, y: 20 }, // LW ST RW
  ],
  "4-2-2-2": [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // Defense
    { x: 35, y: 57 }, { x: 65, y: 57 }, // 2 CDM
    { x: 35, y: 37 }, { x: 65, y: 37 }, // 2 CAM
    { x: 37, y: 15 }, { x: 63, y: 15 }, // 2 ST
  ],
  "3-3-4": [
    { x: 50, y: 88 }, // GK
    { x: 25, y: 72 }, { x: 50, y: 74 }, { x: 75, y: 72 }, // 3 CB
    { x: 30, y: 50 }, { x: 50, y: 48 }, { x: 70, y: 50 }, // 3 Midfield
    { x: 12, y: 23 }, { x: 38, y: 18 }, { x: 62, y: 18 }, { x: 88, y: 23 }, // 4 Attack
  ],
  "3-3-3-1": [
    { x: 50, y: 88 }, // GK
    { x: 25, y: 72 }, { x: 50, y: 74 }, { x: 75, y: 72 }, // 3 CB
    { x: 30, y: 50 }, { x: 50, y: 48 }, { x: 70, y: 50 }, // 3 Midfield
    { x: 16, y: 28 }, { x: 50, y: 25 }, { x: 84, y: 28 }, // LW CAM RW
    { x: 50, y: 12 }, // 1 ST
  ],
  "2-3-5": [
    { x: 50, y: 88 }, // GK
    { x: 33, y: 72 }, { x: 67, y: 72 }, // 2 CB
    { x: 30, y: 50 }, { x: 50, y: 48 }, { x: 70, y: 50 }, // 3 Midfield
    { x: 10, y: 23 }, { x: 28, y: 18 }, { x: 50, y: 15 }, { x: 72, y: 18 }, { x: 90, y: 23 }, // 5 Attack (WM Classic)
  ],
};

export function MatchSquad({ matchData, onComplete }: MatchSquadProps) {
  const [selectedFormation, setSelectedFormation] = useState<string | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<Record<number, typeof players[0] | null>>({});
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showFormationDrawer, setShowFormationDrawer] = useState(false);
  const [showPlayerDrawer, setShowPlayerDrawer] = useState(false);
  const [formationType, setFormationType] = useState<"attack" | "defense">("attack");
  const [playerDetailDrawerOpen, setPlayerDetailDrawerOpen] = useState(false);
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<any>(null);
  
  // Attack/Defense Phase Management
  const [currentPhase, setCurrentPhase] = useState<"attack" | "defense-choice" | "defense-selection">("attack");
  const [attackFormation, setAttackFormation] = useState<string | null>(null);
  const [attackPlayers, setAttackPlayers] = useState<Record<number, typeof players[0] | null>>({});
  const [defenseFormation, setDefenseFormation] = useState<string | null>(null);
  const [defensePlayers, setDefensePlayers] = useState<Record<number, typeof players[0] | null>>({});

  const handleFormationSelect = (formationId: string) => {
    setSelectedFormation(formationId);
    setSelectedPlayers({});
    setShowFormationDrawer(false);
    toast.success("Formasyon seçildi!", {
      description: formations.find(f => f.id === formationId)?.name,
    });
  };

  const handlePlayerSelect = (player: typeof players[0]) => {
    if (selectedSlot !== null) {
      setSelectedPlayers({ ...selectedPlayers, [selectedSlot]: player });
      setSelectedSlot(null);
      setShowPlayerDrawer(false);
      toast.success(`${player.name} kadronuza eklendi!`, {
        description: `${player.position} • ${player.rating} Rating`,
      });
    }
  };

  const handleRemovePlayer = (slotIndex: number) => {
    const player = selectedPlayers[slotIndex];
    if (player) {
      setSelectedPlayers({ ...selectedPlayers, [slotIndex]: null });
      toast.info(`${player.name} yedeğe gönderildi`);
    }
  };

  const handleComplete = () => {
    const selectedCount = Object.keys(selectedPlayers).filter(k => selectedPlayers[parseInt(k)]).length;
    if (selectedCount === 11) {
      if (currentPhase === "attack") {
        // Save attack formation and players, move to defense choice
        setAttackFormation(selectedFormation);
        setAttackPlayers(selectedPlayers);
        setCurrentPhase("defense-choice");
        toast.success("Atak dizilişi kaydedildi!", {
          description: "Şimdi defans dizilişini belirleyin",
        });
      } else if (currentPhase === "defense-selection") {
        // Save defense formation and complete
        setDefenseFormation(selectedFormation);
        setDefensePlayers(selectedPlayers);
        toast.success("Kadro tamamlandı! 🎉", {
          description: "Tahmin ekranına yönlendiriliyorsunuz...",
        });
        setTimeout(() => onComplete(), 1000);
      }
    } else {
      toast.error("Kadro eksik!", {
        description: `${11 - selectedCount} oyuncu daha seçmelisiniz.`,
      });
    }
  };

  const handleUseSameFormation = () => {
    setDefenseFormation(attackFormation);
    setDefensePlayers(attackPlayers);
    toast.success("Defans dizilişi kopyalandı!", {
      description: "Tahmin ekranına yönlendiriliyorsunuz...",
    });
    setTimeout(() => onComplete(), 1000);
  };

  const handleSelectDifferentFormation = () => {
    setCurrentPhase("defense-selection");
    setSelectedFormation(null);
    setSelectedPlayers({});
    setFormationType("defense"); // Set defense tab active
    setShowFormationDrawer(true); // Open drawer immediately
    toast.info("Defans dizilişi seçimi", {
      description: "Farklı bir diziliş seçin",
    });
  };

  const positions = selectedFormation ? formationPositions[selectedFormation] || formationPositions["4-3-3"] : null;
  const formation = formations.find(f => f.id === selectedFormation);

  return (
    <div className="flex flex-col h-[calc(100vh-234px)] overflow-hidden">
      {/* Defense Choice Screen */}
      {currentPhase === "defense-choice" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col px-4 py-3"
        >
          {/* Football Field Background */}
          <div className="relative w-full h-full max-w-3xl mx-auto bg-gradient-to-b from-green-600 via-green-500 to-green-600 shadow-2xl overflow-hidden rounded-lg">
            {/* FIFA Standard Field Lines */}
            <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 150" preserveAspectRatio="none">
              {/* Outer boundary */}
              <rect x="2" y="2" width="96" height="146" fill="none" stroke="white" strokeWidth="0.5" />
              
              {/* Halfway line */}
              <line x1="2" y1="75" x2="98" y2="75" stroke="white" strokeWidth="0.5" />
              
              {/* Center circle - 9.15m radius */}
              <circle cx="50" cy="75" r="13.5" fill="none" stroke="white" strokeWidth="0.5" />
              <circle cx="50" cy="75" r="1" fill="white" />
              
              {/* Top penalty area: 16.5m depth, 40.32m width */}
              <rect x="20.35" y="2" width="59.3" height="23" fill="none" stroke="white" strokeWidth="0.5" />
              
              {/* Top goal area: 5.5m depth, 18.32m width */}
              <rect x="36.55" y="2" width="26.9" height="7.7" fill="none" stroke="white" strokeWidth="0.5" />
              
              {/* Top penalty spot: 11m from goal line */}
              <circle cx="50" cy="17.3" r="0.8" fill="white" />
              
              {/* Top penalty arc: 9.15m radius from penalty spot, outside penalty area */}
              <circle cx="50" cy="17.3" r="13.5" fill="none" stroke="white" strokeWidth="0.5" clipPath="url(#topPenaltyClip)" />
              
              {/* Bottom penalty area */}
              <rect x="20.35" y="125" width="59.3" height="23" fill="none" stroke="white" strokeWidth="0.5" />
              
              {/* Bottom goal area */}
              <rect x="36.55" y="140.3" width="26.9" height="7.7" fill="none" stroke="white" strokeWidth="0.5" />
              
              {/* Bottom penalty spot */}
              <circle cx="50" cy="132.7" r="0.8" fill="white" />
              
              {/* Bottom penalty arc: 9.15m radius from penalty spot, outside penalty area */}
              <circle cx="50" cy="132.7" r="13.5" fill="none" stroke="white" strokeWidth="0.5" clipPath="url(#bottomPenaltyClip)" />
              
              {/* Corner arcs - 1m radius */}
              <path d="M 2 4.5 A 2.5 2.5 0 0 1 4.5 2" stroke="white" strokeWidth="0.5" fill="none" />
              <path d="M 95.5 2 A 2.5 2.5 0 0 1 98 4.5" stroke="white" strokeWidth="0.5" fill="none" />
              <path d="M 98 145.5 A 2.5 2.5 0 0 1 95.5 148" stroke="white" strokeWidth="0.5" fill="none" />
              <path d="M 4.5 148 A 2.5 2.5 0 0 1 2 145.5" stroke="white" strokeWidth="0.5" fill="none" />
              
              {/* Clip paths for penalty arcs - only show outside penalty area */}
              <defs>
                <clipPath id="topPenaltyClip">
                  <rect x="0" y="25" width="100" height="125" />
                </clipPath>
                <clipPath id="bottomPenaltyClip">
                  <rect x="0" y="0" width="100" height="125" />
                </clipPath>
              </defs>
            </svg>

            {/* Defense Choice Card Overlay */}
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl p-6 text-center max-w-md w-full shadow-2xl">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                  className="text-5xl mb-4"
                >
                  🛡️
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">Defans Dizilişi</h3>
                <p className="text-muted-foreground mb-6">
                  Atak dizilişiniz: <span className="text-foreground font-medium">{attackFormation}</span>
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Defans için aynı dizilişi kullanmak ister misiniz?
                </p>

                <div className="space-y-3">
                  <Button
                    onClick={handleUseSameFormation}
                    className="w-full bg-[#059669] hover:bg-[#059669]/90 text-white h-12 rounded-xl"
                  >
                    Evet, Aynı Dizilişi Kullan
                  </Button>
                  <Button
                    onClick={handleSelectDifferentFormation}
                    variant="outline"
                    className="w-full h-12 rounded-xl"
                  >
                    Hayır, Farklı Dizili�� Seç
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State / Onboarding */}
      {!selectedFormation && currentPhase !== "defense-choice" && (
        /* Empty State - Show Formation Button */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-full flex flex-col px-4 overflow-hidden"
        >
          <div className="relative w-full flex-1 min-h-0 max-w-3xl mx-auto bg-gradient-to-b from-green-600 via-green-500 to-green-600 shadow-2xl overflow-hidden rounded-lg mb-2">
            {/* FIFA Standard Field Lines */}
            <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 150" preserveAspectRatio="none">
              {/* Outer boundary */}
              <rect x="2" y="2" width="96" height="146" fill="none" stroke="white" strokeWidth="0.5" />
              
              {/* Halfway line */}
              <line x1="2" y1="75" x2="98" y2="75" stroke="white" strokeWidth="0.5" />
              
              {/* Center circle - 9.15m radius */}
              <circle cx="50" cy="75" r="13.5" fill="none" stroke="white" strokeWidth="0.5" />
              <circle cx="50" cy="75" r="1" fill="white" />
              
              {/* Top penalty area: 16.5m depth, 40.32m width */}
              <rect x="20.35" y="2" width="59.3" height="23" fill="none" stroke="white" strokeWidth="0.5" />
              
              {/* Top goal area: 5.5m depth, 18.32m width */}
              <rect x="36.55" y="2" width="26.9" height="7.7" fill="none" stroke="white" strokeWidth="0.5" />
              
              {/* Top penalty spot: 11m from goal line */}
              <circle cx="50" cy="17.3" r="0.8" fill="white" />
              
              {/* Top penalty arc: 9.15m radius from penalty spot, outside penalty area */}
              <circle cx="50" cy="17.3" r="13.5" fill="none" stroke="white" strokeWidth="0.5" clipPath="url(#topPenaltyClip)" />
              
              {/* Bottom penalty area */}
              <rect x="20.35" y="125" width="59.3" height="23" fill="none" stroke="white" strokeWidth="0.5" />
              
              {/* Bottom goal area */}
              <rect x="36.55" y="140.3" width="26.9" height="7.7" fill="none" stroke="white" strokeWidth="0.5" />
              
              {/* Bottom penalty spot */}
              <circle cx="50" cy="132.7" r="0.8" fill="white" />
              
              {/* Bottom penalty arc: 9.15m radius from penalty spot, outside penalty area */}
              <circle cx="50" cy="132.7" r="13.5" fill="none" stroke="white" strokeWidth="0.5" clipPath="url(#bottomPenaltyClip)" />
              
              {/* Corner arcs - 1m radius */}
              <path d="M 2 4.5 A 2.5 2.5 0 0 1 4.5 2" stroke="white" strokeWidth="0.5" fill="none" />
              <path d="M 95.5 2 A 2.5 2.5 0 0 1 98 4.5" stroke="white" strokeWidth="0.5" fill="none" />
              <path d="M 98 145.5 A 2.5 2.5 0 0 1 95.5 148" stroke="white" strokeWidth="0.5" fill="none" />
              <path d="M 4.5 148 A 2.5 2.5 0 0 1 2 145.5" stroke="white" strokeWidth="0.5" fill="none" />
              
              {/* Clip paths for penalty arcs - only show outside penalty area */}
              <defs>
                <clipPath id="topPenaltyClip">
                  <rect x="0" y="25" width="100" height="125" />
                </clipPath>
                <clipPath id="bottomPenaltyClip">
                  <rect x="0" y="0" width="100" height="125" />
                </clipPath>
              </defs>
            </svg>
            
            {/* Empty State Message */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center max-w-xs">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-4xl mb-4"
                >
                  ⚽
                </motion.div>
                <h3 className="text-white text-lg mb-2">Stratejini Belirle</h3>
                <p className="text-white/80 text-sm">
                  Devam etmek için bir formasyon seçiniz
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setShowFormationDrawer(true)}
            className="bg-[#059669] hover:bg-[#059669]/90 text-white h-12 px-8 rounded-xl border-2 border-[#059669] w-full max-w-3xl mx-auto"
          >
            <ChevronDown className="w-5 h-5 mr-2" />
            Formasyon Seç
          </Button>
        </motion.div>
      )}

      {/* Football Field with Formation */}
      {selectedFormation && currentPhase !== "defense-choice" && (
        <div className="flex-1 px-4 overflow-hidden flex flex-col min-h-0">
          <div className="relative w-full flex-1 min-h-0 max-w-3xl mx-auto bg-gradient-to-b from-green-600 via-green-500 to-green-600 shadow-2xl overflow-hidden rounded-lg mb-1">
            {/* FIFA Standard Field Lines */}
            <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 150" preserveAspectRatio="none">
              {/* Outer boundary */}
              <rect x="2" y="2" width="96" height="146" fill="none" stroke="white" strokeWidth="0.5" />
              
              {/* Halfway line */}
              <line x1="2" y1="75" x2="98" y2="75" stroke="white" strokeWidth="0.5" />
              
              {/* Center circle - 9.15m radius */}
              <circle cx="50" cy="75" r="13.5" fill="none" stroke="white" strokeWidth="0.5" />
              <circle cx="50" cy="75" r="1" fill="white" />
              
              {/* Top penalty area: 16.5m depth, 40.32m width */}
              <rect x="20.35" y="2" width="59.3" height="23" fill="none" stroke="white" strokeWidth="0.5" />
              
              {/* Top goal area: 5.5m depth, 18.32m width */}
              <rect x="36.55" y="2" width="26.9" height="7.7" fill="none" stroke="white" strokeWidth="0.5" />
              
              {/* Top penalty spot: 11m from goal line */}
              <circle cx="50" cy="17.3" r="0.8" fill="white" />
              
              {/* Top penalty arc: 9.15m radius from penalty spot, outside penalty area */}
              <circle cx="50" cy="17.3" r="13.5" fill="none" stroke="white" strokeWidth="0.5" clipPath="url(#topPenaltyClip)" />
              
              {/* Bottom penalty area */}
              <rect x="20.35" y="125" width="59.3" height="23" fill="none" stroke="white" strokeWidth="0.5" />
              
              {/* Bottom goal area */}
              <rect x="36.55" y="140.3" width="26.9" height="7.7" fill="none" stroke="white" strokeWidth="0.5" />
              
              {/* Bottom penalty spot */}
              <circle cx="50" cy="132.7" r="0.8" fill="white" />
              
              {/* Bottom penalty arc: 9.15m radius from penalty spot, outside penalty area */}
              <circle cx="50" cy="132.7" r="13.5" fill="none" stroke="white" strokeWidth="0.5" clipPath="url(#bottomPenaltyClip)" />
              
              {/* Corner arcs - 1m radius */}
              <path d="M 2 4.5 A 2.5 2.5 0 0 1 4.5 2" stroke="white" strokeWidth="0.5" fill="none" />
              <path d="M 95.5 2 A 2.5 2.5 0 0 1 98 4.5" stroke="white" strokeWidth="0.5" fill="none" />
              <path d="M 98 145.5 A 2.5 2.5 0 0 1 95.5 148" stroke="white" strokeWidth="0.5" fill="none" />
              <path d="M 4.5 148 A 2.5 2.5 0 0 1 2 145.5" stroke="white" strokeWidth="0.5" fill="none" />
              
              {/* Clip paths for penalty arcs - only show outside penalty area */}
              <defs>
                <clipPath id="topPenaltyClip">
                  <rect x="0" y="25" width="100" height="125" />
                </clipPath>
                <clipPath id="bottomPenaltyClip">
                  <rect x="0" y="0" width="100" height="125" />
                </clipPath>
              </defs>
            </svg>

            {/* Player Positions */}
            <div className="relative w-full h-full">
              {positions?.map((pos, index) => {
                const player = selectedPlayers[index];
                const positionLabel = formation?.positions[index] || "";

                return (
                  <div
                    key={index}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10 hover:z-50"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    {player ? (
                      <div className="relative group">
                        <button
                          onClick={() => handleRemovePlayer(index)}
                          className="absolute -top-2 -right-2 z-50 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        
                        {/* Oyuncu kartı - Tıklanabilir */}
                        <button
                          onClick={() => {
                            setSelectedPlayerForDetail(player);
                            setPlayerDetailDrawerOpen(true);
                          }}
                          className="w-16 h-20 rounded-lg border-2 border-white shadow-lg bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center relative hover:scale-105 transition-transform"
                        >
                          {/* Overall Rating - Sol üstte */}
                          <div className="absolute -top-2 -left-2 bg-[#F59E0B] text-slate-900 text-xs w-6 h-6 rounded-full flex items-center justify-center z-40 font-bold border-2 border-white">
                            {player.rating}
                          </div>
                          
                          {/* Forma Numarası (Ortada, büyük) */}
                          <div className="text-3xl font-black text-white leading-none mb-1">
                            {player.number}
                          </div>
                          
                          {/* İsim - Kart içinde */}
                          <div className="text-[10px] font-bold text-white/90 leading-tight px-1 text-center max-w-full truncate">
                            {player.name}
                          </div>
                        </button>
                      </div>
                    ) : (
                      <motion.button
                        onClick={() => {
                          setSelectedSlot(index);
                          setShowPlayerDrawer(true);
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-16 h-20 rounded-lg border-4 border-dashed border-white/40 bg-white/20 backdrop-blur-sm flex items-center justify-center relative group hover:border-[#059669] hover:bg-[#059669]/30 transition-all"
                      >
                        <Plus className="w-6 h-6 text-white" />
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                          <div className="bg-black/70 px-2 py-0.5 rounded text-xs text-white">{positionLabel}</div>
                        </div>
                      </motion.button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formation Name & Complete Button */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Seçili Formasyon</p>
                <p className="text-foreground font-medium">{formation?.name}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFormationDrawer(true)}
              >
                Değiştir
              </Button>
            </div>

            <Button
              onClick={handleComplete}
              disabled={Object.keys(selectedPlayers).filter(k => selectedPlayers[parseInt(k)]).length !== 11}
              className="w-full bg-[#059669] hover:bg-[#059669]/90 text-white h-12 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentPhase === "attack" 
                ? `Kaydet & Defans Formasyonuna Geç (${Object.keys(selectedPlayers).filter(k => selectedPlayers[parseInt(k)]).length}/11)`
                : `Kaydet & Tahmine Geç (${Object.keys(selectedPlayers).filter(k => selectedPlayers[parseInt(k)]).length}/11)`
              }
            </Button>
          </div>
        </div>
      )}

      {/* Formation Drawer */}
      <Drawer open={showFormationDrawer} onOpenChange={setShowFormationDrawer}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-3">
            <DrawerTitle>
              {currentPhase === "defense-selection" 
                ? "Defans Dizilişini Belirleyin" 
                : "Formasyon Seç (20 Diziliş)"}
            </DrawerTitle>
            <DrawerDescription>
              {currentPhase === "defense-selection"
                ? "Defans için ayrı bir formasyon seçin veya atak formasyonunuzla aynı kalın."
                : "Oyunun atak ve defans tarafı için ayrı formasyonlar seçilebilir. Aynı kalmasını istiyorsanız değişiklik yapmadan bir sonraki sayfaya ilerleyin."}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto max-h-[calc(85vh-80px)]">
            {/* Attack/Defense Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setFormationType("attack")}
                className={`flex-1 py-2.5 px-4 rounded-lg transition-all ${
                  formationType === "attack"
                    ? "bg-[#059669] text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Atak
              </button>
              <button
                onClick={() => setFormationType("defense")}
                className={`flex-1 py-2.5 px-4 rounded-lg transition-all ${
                  formationType === "defense"
                    ? "bg-[#059669] text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Defans
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {formations.map((form) => (
                <div key={form.id} className="relative">
                  {/* Main Formation Card */}
                  <button
                    onClick={() => handleFormationSelect(form.id)}
                    className={`w-full py-2.5 px-3 rounded-xl border-2 transition-all text-left ${
                      selectedFormation === form.id
                        ? "border-[#059669] bg-[#059669]/10"
                        : "border-border bg-card hover:border-[#059669]/50"
                    }`}
                  >
                    <p className="font-medium text-foreground mb-0.5 text-sm">{form.id}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{form.name.split('(')[1]?.replace(')', '') || form.name}</p>
                  </button>

                  {/* Info Icon - Popover Trigger */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="absolute -top-1.5 -right-1.5 bg-[#059669] text-white rounded-full p-1 shadow-lg hover:bg-[#059669]/90 transition-all z-10"
                      >
                        <Info className="w-3 h-3" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" side="top" align="center">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="border-b border-border pb-2">
                          <h4 className="font-semibold text-foreground">{form.id} - {form.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{form.description}</p>
                        </div>

                        {/* Pros */}
                        <div>
                          <p className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1">
                            <span className="text-green-500">✓</span> Avantajlar
                          </p>
                          <ul className="space-y-1">
                            {form.pros.map((pro, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <span className="text-green-500 mt-0.5">•</span>
                                <span>{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Cons */}
                        <div>
                          <p className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1">
                            <span className="text-red-500">✗</span> Dezavantajlar
                          </p>
                          <ul className="space-y-1">
                            {form.cons.map((con, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <span className="text-red-500 mt-0.5">•</span>
                                <span>{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Best For */}
                        <div className="bg-muted/50 rounded-lg p-2 border border-border">
                          <p className="text-xs font-medium text-foreground mb-1">📋 İdeal Kullanım</p>
                          <p className="text-xs text-muted-foreground">{form.bestFor}</p>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Player Selection Drawer */}
      <Drawer open={showPlayerDrawer} onOpenChange={setShowPlayerDrawer}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Oyuncu Seç</DrawerTitle>
            <DrawerDescription>
              Takım kadrosundan ilk 11'e ekleyeceğiniz oyuncuları seçin
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="p-4 h-[60vh]">
            <div className="space-y-3">
              {players.map((player) => {
                // Status icon & color
                const statusConfig = {
                  injured: { icon: "🤕", color: "text-red-500", bg: "bg-red-500/10" },
                  suspended: { icon: "🟥", color: "text-red-500", bg: "bg-red-500/10" },
                  yellow_card: { icon: "🟨", color: "text-yellow-500", bg: "bg-yellow-500/10" },
                  available: { icon: null, color: "", bg: "" },
                };
                const status = statusConfig[player.status as keyof typeof statusConfig] || statusConfig.available;

                // Rating color based on value
                const getRatingColor = (rating: number) => {
                  if (rating >= 85) return "bg-[#F59E0B]"; // Gold - Elite players (85+)
                  if (rating < 50) return "bg-red-600"; // Red - Poor players (<50)
                  return "bg-slate-600"; // Gray - Average players (50-84)
                };

                // Calculate Power Score (tempo + physical impact)
                const powerScore = Math.round((player.stats.pace * 0.4 + player.stats.shooting * 0.3 + player.stats.dribbling * 0.3));

                return (
                  <div
                    key={player.id}
                    onClick={() => {
                      if (player.status !== "injured" && player.status !== "suspended") {
                        handlePlayerSelect(player);
                      }
                    }}
                    className={`w-full relative rounded-xl border-2 border-border bg-[#1E293B] hover:border-[#059669] transition-all text-left overflow-hidden ${
                      player.status === "injured" || player.status === "suspended" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    {/* Ultra Compact Content */}
                    <div className="p-2.5">
                      {/* Single Row: All Info Horizontal */}
                      <div className="flex items-center gap-2.5">
                        {/* Jersey Number */}
                        <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#059669] to-emerald-700 flex items-center justify-center border border-emerald-600/30 flex-shrink-0">
                          <span className="text-lg font-black text-white">{player.number}</span>
                        </div>

                        {/* Identity: Name + Position */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white truncate text-sm mb-0.5">{player.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{player.position}</span>
                            {/* Status Badge */}
                            {player.status === "available" && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">✓ Oynar</span>
                            )}
                            {player.status === "injured" && (
                              <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">🤕 Sakatlık</span>
                            )}
                            {player.status === "suspended" && (
                              <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">🟥 Cezalı</span>
                            )}
                            {player.status === "yellow_card" && (
                              <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">⚠ Kart Riski</span>
                            )}
                          </div>
                        </div>

                        {/* Metrics with Labels */}
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          {/* Overall Rating - Sadece görüntüleme */}
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[9px] text-gray-400 uppercase tracking-wide">Overall</span>
                            <div className={`${getRatingColor(player.rating)} text-white px-2 py-0.5 rounded-md font-bold text-sm`}>
                              {player.rating}
                            </div>
                          </div>

                          {/* Power Score */}
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[9px] text-gray-400 uppercase tracking-wide">Power</span>
                            <span className="text-sm font-bold text-[#F59E0B]">{powerScore}</span>
                          </div>

                          {/* Form */}
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[9px] text-gray-400 uppercase tracking-wide">Form</span>
                            <div className="flex items-center gap-0.5">
                              <span className="text-xs">🔥</span>
                              <span className="text-sm font-bold text-white">{player.form}</span>
                            </div>
                          </div>

                          {/* Detail Button - Sadece bu tuş oyuncu detaylarını açıyor */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlayerForDetail(player);
                              setPlayerDetailDrawerOpen(true);
                            }}
                            className="w-9 h-9 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 flex items-center justify-center transition-all flex-shrink-0"
                          >
                            <BarChart3 className="w-4 h-4 text-blue-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>

      {/* Player Detail Drawer */}
      <PlayerDetailDrawer
        open={playerDetailDrawerOpen}
        onOpenChange={(open) => {
          console.log('🔍 MatchSquad: PlayerDetailDrawer opening:', open, 'Player:', selectedPlayerForDetail?.name);
          setPlayerDetailDrawerOpen(open);
        }}
        player={selectedPlayerForDetail}
        selectedSlot={selectedSlot}
        onSelectPlayer={handlePlayerSelect}
      />
    </div>
  );
}