# 🎯 TacticIQ.app - Cursor AI Model Seçim Rehberi

## 📊 Proje Analizi

**Proje Karmaşıklığı:**
- ✅ **Büyük Proje:** ~90,000+ satır kod
- ✅ **Çoklu Platform:** React Native (iOS/Android) + Web (React + Vite)
- ✅ **Full-Stack:** Frontend + Backend (Node.js + Express)
- ✅ **TypeScript:** Tip güvenliği önemli
- ✅ **Karmaşık Mimari:** 200+ dosya, 27 ekran, 20+ bileşen

**Teknoloji Stack:**
- React Native 0.81.5 + Expo SDK 54
- React 18.3.1 + Vite 6.0.5 (Website)
- TypeScript 5.3.3
- Node.js + Express (Backend)
- Supabase (Database)

---

## 🎯 ÖNERİLEN MODEL STRATEJİSİ

### ⭐ **ANA MODEL: Claude Sonnet 4.5** (Önerilen)

**Kullanım Senaryoları:**
- ✅ Günlük geliştirme işleri (%90)
- ✅ Kod yazma ve düzenleme
- ✅ Bug fix'ler
- ✅ Feature geliştirme
- ✅ Refactoring
- ✅ Dokümantasyon yazma

**Avantajlar:**
- 💰 **Maliyet:** $1/1M output tokens (çok uygun!)
- ⚡ **Hız:** Hızlı yanıt süresi
- 🎯 **Kalite:** Yüksek kod kalitesi
- 📚 **Context:** Büyük context window (200K tokens)
- 🔄 **Cache:** Etkili cache kullanımı

**Maliyet Tahmini:**
- Günlük: $30-50
- Aylık: $900-1,500

---

### 🚀 **GELİŞMİŞ MODEL: Claude Opus 4** (Özel Durumlar)

**Kullanım Senaryoları:**
- 🔍 Karmaşık mimari kararlar
- 🐛 Zor bug'lar (3+ saat debug)
- 🏗️ Büyük refactoring (10+ dosya)
- 📐 Sistem tasarımı
- 🔐 Güvenlik analizi
- ⚡ Performans optimizasyonu

**Ne Zaman Kullan:**
- Sonnet 4.5 ile çözülemediğinde
- Kritik kararlar gerektiğinde
- Haftada 1-2 kez maksimum

**Avantajlar:**
- 🧠 **Düşünme:** Daha derin analiz
- 🎯 **Doğruluk:** Daha az hata
- 🔍 **Debug:** Karmaşık sorunları çözme

**Dezavantajlar:**
- 💰 **Maliyet:** $15/1M output tokens (15x pahalı!)
- ⏱️ **Hız:** Daha yavaş yanıt

**Maliyet Tahmini:**
- Günlük: $200-500 (sadece özel durumlarda)
- Aylık: $500-1,000 (kısıtlı kullanım)

---

### ⚡ **HIZLI MODEL: Claude Haiku 3.5** (Basit İşler)

**Kullanım Senaryoları:**
- 📝 Basit kod düzenlemeleri
- 🔤 Typo düzeltmeleri
- 📄 Dokümantasyon formatlama
- 🔍 Basit aramalar
- ✅ Code review (basit)

**Ne Zaman Kullan:**
- Hızlı işler için
- Maliyet tasarrufu için
- Günlük rutin işler

**Avantajlar:**
- ⚡ **Hız:** Çok hızlı
- 💰 **Maliyet:** $0.25/1M output tokens (4x ucuz!)
- 🎯 **Basit İşler:** İdeal

**Dezavantajlar:**
- 🧠 **Karmaşık İşler:** Yetersiz
- 🔍 **Debug:** Zor sorunları çözemez

**Maliyet Tahmini:**
- Günlük: $5-15
- Aylık: $150-450

---

## 📋 GÜNLÜK KULLANIM STRATEJİSİ

### 🌅 **Sabah (1-2 saat) - Günlük Geliştirme**
```
Model: Claude Sonnet 4.5
İşler:
- Yeni feature planlama
- Kod yazma
- Bug fix'ler
Maliyet: ~$10-20
```

### 🌞 **Öğle (2-3 saat) - Aktif Geliştirme**
```
Model: Claude Sonnet 4.5
İşler:
- Ekran geliştirme
- Component oluşturma
- API entegrasyonu
Maliyet: ~$15-30
```

### 🌙 **Akşam (1 saat) - Polish & Review**
```
Model: Claude Sonnet 4.5 (veya Haiku 3.5)
İşler:
- Code review
- Dokümantasyon
- Formatting
Maliyet: ~$5-10
```

**TOPLAM GÜNLÜK:** $30-60 ✅

---

## 🎯 MODEL SEÇİM KARAR AĞACI

```
Başlangıç
    │
    ├─ Basit iş mi? (typo, format, basit düzenleme)
    │   └─ ✅ Claude Haiku 3.5
    │
    ├─ Normal geliştirme mi? (kod yazma, feature, bug fix)
    │   └─ ✅ Claude Sonnet 4.5 (ÖNERİLEN)
    │
    └─ Karmaşık sorun mu? (mimari, zor bug, büyük refactor)
        ├─ Sonnet 4.5 ile çözülemedi mi?
        │   └─ ✅ Claude Opus 4 (sadece gerektiğinde)
        └─ Sonnet 4.5 ile çözüldü mü?
            └─ ✅ Claude Sonnet 4.5 (devam et)
```

---

## 💰 MALİYET KARŞILAŞTIRMASI

| Model | Output Cost | Günlük (Normal) | Günlük (Yoğun) | Aylık (Normal) | Aylık (Yoğun) |
|-------|-------------|-----------------|----------------|----------------|---------------|
| **Haiku 3.5** | $0.25/1M | $5-15 | $20-40 | $150-450 | $600-1,200 |
| **Sonnet 4.5** ⭐ | $1/1M | $30-50 | $80-120 | $900-1,500 | $2,400-3,600 |
| **Opus 4** | $15/1M | $200-500 | $1,000+ | $6,000+ | $30,000+ |

**Önerilen Strateji:**
- %85 Sonnet 4.5 (günlük işler)
- %10 Haiku 3.5 (basit işler)
- %5 Opus 4 (karmaşık sorunlar)

**Tahmini Aylık Maliyet:** $1,000-2,000 ✅

---

## ⚙️ CURSOR AYARLARI

### Model Değiştirme:
1. **Cursor Settings** → **AI** → **Model**
2. İstediğiniz modeli seç:
   - `claude-haiku-3.5` (Hızlı/Basit)
   - `claude-sonnet-4.5` ⭐ (Önerilen)
   - `claude-opus-4` (Gelişmiş)
3. **Save** butonuna tıkla

### Context Window:
- ✅ **200K tokens** (Sonnet 4.5 ve Opus 4)
- ✅ **200K tokens** (Haiku 3.5)
- Büyük projeler için yeterli!

### Cache Kullanımı:
- ✅ `.cursorignore` dosyası aktif olmalı
- ✅ `node_modules/` ignore edilmeli
- ✅ Build klasörleri ignore edilmeli

---

## 🎯 PROJE ÖZEL ÖNERİLER

### TacticIQ.app İçin:

#### ✅ **React Native Geliştirme:**
- **Model:** Claude Sonnet 4.5
- **Neden:** TypeScript desteği, Expo bilgisi, React Native best practices

#### ✅ **Backend API Geliştirme:**
- **Model:** Claude Sonnet 4.5
- **Neden:** Node.js/Express uzmanlığı, API tasarımı, Supabase entegrasyonu

#### ✅ **Website Geliştirme:**
- **Model:** Claude Sonnet 4.5
- **Neden:** React + Vite bilgisi, Tailwind CSS, TypeScript

#### ✅ **Karmaşık Bug Fix:**
- **Model:** Claude Opus 4 (sadece gerektiğinde)
- **Neden:** Derin analiz, karmaşık sorunları çözme

#### ✅ **Basit Düzenlemeler:**
- **Model:** Claude Haiku 3.5
- **Neden:** Hızlı ve ucuz, basit işler için yeterli

---

## 📊 PERFORMANS METRİKLERİ

### İdeal Kullanım:
- ✅ **Tool Calls:** < 50/gün
- ✅ **Cache Reads:** < 2M tokens/gün
- ✅ **Günlük Maliyet:** < $60
- ✅ **Aylık Maliyet:** < $2,000

### Alarm Durumları:
- 🚨 **Günlük $100+** → Model değiştir veya kullanımı azalt
- 🚨 **200+ Tool Call** → Batch operations kullan
- 🚨 **Terminal 20+ okuma** → Sadece gerektiğinde oku

---

## 🛡️ MALİYET OPTİMİZASYONU

### ✅ **YAPILMASI GEREKENLER:**

1. **Sonnet 4.5 kullan** (ana model)
2. **Batch operations:**
   - 5 dosyayı birlikte oku
   - Toplu değişiklikler yap
3. **Cache kullanımı:**
   - `.cursorignore` aktif
   - Gereksiz dosyaları ignore et
4. **Plan-first yaklaşım:**
   - Önce düşün, sonra kod yaz
   - Trial-error yerine doğru yaz

### ❌ **YAPILMAMASI GEREKENLER:**

1. ❌ Opus 4'ü günlük işler için kullanma
2. ❌ Terminal'i sürekli okuma
3. ❌ node_modules'i açma
4. ❌ Büyük log dosyalarını okuma
5. ❌ Her değişiklikte test etme (5 değişiklik → 1 test)

---

## 🎯 SONUÇ VE ÖNERİLER

### ⭐ **ÖNERİLEN SETUP:**

**Ana Model:** `claude-sonnet-4.5`
- Günlük işlerin %85'i için
- En iyi maliyet/performans oranı
- Yüksek kod kalitesi

**Yedek Model:** `claude-haiku-3.5`
- Basit işler için
- Maliyet tasarrufu

**Özel Durumlar:** `claude-opus-4`
- Sadece gerektiğinde
- Karmaşık sorunlar için

### 📈 **BEKLENTİLER:**

- ✅ **Günlük Maliyet:** $30-60
- ✅ **Aylık Maliyet:** $1,000-2,000
- ✅ **Kod Kalitesi:** Yüksek
- ✅ **Geliştirme Hızı:** Hızlı
- ✅ **Maliyet Kontrolü:** Optimize

---

## 📝 GÜNCELLEME NOTLARI

**Son Güncelleme:** 28 Ocak 2026  
**Durum:** ✅ Aktif  
**Versiyon:** 1.0.0

**Not:** Bu rehber, TacticIQ.app projesinin özelliklerine göre hazırlanmıştır. Proje büyüklüğü ve karmaşıklığı değiştikçe model seçimi güncellenebilir.

---

## 🔗 İLGİLİ DOKÜMANTASYON

- [COST_OPTIMIZATION.md](./COST_OPTIMIZATION.md) - Maliyet optimizasyonu detayları
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Proje kurulum rehberi
- [PROJE_OZET_DOKUMANTASYON.md](./PROJE_OZET_DOKUMANTASYON.md) - Proje yapısı
