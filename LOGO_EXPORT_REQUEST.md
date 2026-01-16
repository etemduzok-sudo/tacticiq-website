# 🎨 TacticIQ Logo Export İsteği - Figma

## 📋 Sorun
Benim React/Vite sitemde logo dosyası doğru yükleniyor (logo.png render oluyor) ama navbar/header içinde logo "yerleşemiyor" gibi görünüyor çünkü:

1. ✅ Logo PNG'si badge/wax-seal formunda ve kare bir canvas içinde
2. ❌ **Canvas içinde çok büyük transparent padding (boşluk) var**
3. ❌ Header'da logo yüksekliği 40–48px gibi küçük olunca, tarayıcı PNG'nin tüm canvas'ını küçültüyor
4. ❌ İçerikteki gerçek logo da bu yüzden minik/ezilmiş görünüyor
5. ❌ CSS ile `object-contain`, `w-auto`, `max-w`, hatta `scale` denesem de kalıcı çözüm olmuyor çünkü **sorun dosyanın bounding box'ı**

**Şu an header'da görünmeyen şey aslında görünüyor ama çok küçük; çünkü PNG'nin etrafı boş.**

---

## ✅ İhtiyacım Olan

Header/navbar için aşağıdaki logo versiyonlarını istiyorum:

### 1. **Icon Versiyonu (Öncelikli)**
- **Dosya adı:** `logo-icon.svg` veya `logo-icon.png`
- **İçerik:** Sadece TQ badge/wax-seal logosu
- **Boyut:** 100x100px (1:1 aspect ratio)
- **Transparent padding:** **SIFIR** - crop to content
- **Format:** Tercihen **SVG**, alternatif PNG (transparent background)

### 2. **Wordmark Versiyonu**
- **Dosya adı:** `logo-wordmark.svg` veya `logo-wordmark.png`
- **İçerik:** "TacticIQ" yazısı (yatay logo)
- **Boyut:** ~300x100px (3:1 aspect ratio)
- **Transparent padding:** Minimal (sadece yazının etrafında 4-8px)
- **Format:** Tercihen **SVG**

### 3. **Full Logo (Icon + Wordmark)**
- **Dosya adı:** `logo-full.svg` veya `logo-full.png`
- **İçerik:** Icon + "TacticIQ" yazısı yan yana
- **Boyut:** ~400x100px
- **Transparent padding:** Minimal
- **Format:** Tercihen **SVG**

---

## 🎯 Figma Export Kuralları

Logonun Figma'da export edilirken:

1. ✅ **Frame/selection logonun etrafına tight olmalı** (crop to content)
2. ✅ **Transparent boşluk bırakılmamalı**
3. ✅ **Export Settings:**
   - Format: **SVG** (preferred) veya **PNG @2x**
   - Background: Transparent
   - Constraints: Scale proportionally
   - Bounds: Trim transparent pixels ✅
4. ✅ **Viewbox/canvas sadece content'i içermeli**

---

## 📐 Beklenen Boyutlar

| Versiyon | Genişlik | Yükseklik | Aspect Ratio | Kullanım Alanı |
|----------|----------|-----------|--------------|----------------|
| **Icon** | 100px | 100px | 1:1 | Header, Favicon, App Icon |
| **Wordmark** | 300px | 100px | 3:1 | Header (text logo only) |
| **Full** | 400px | 100px | 4:1 | Header (icon + text) |

---

## 🎨 Marka Renkleri (Referans)

- **Primary:** `#0F2A24` (koyu yeşil)
- **Secondary:** `#1FA2A6` (turkuaz)
- **Accent:** `#C9A44C` (altın sarısı)

---

## 🚀 Kullanım Örneği (Header)

```tsx
// React Header Component
<img 
  src="/logo-icon.svg" 
  alt="TacticIQ" 
  className="h-10 w-10"  // 40x40px - tight fit!
/>
```

**Şu anki sorun:**
```
PNG: [        🎯 logo (tiny)        ]  <- Canvas 200x200px, logo 50x50px
                 ⬇️ Scale down to 40px
Result: [  🔍 (8px)  ]  <- Logo 8px görünüyor!
```

**İstenen çözüm:**
```
SVG: [🎯 logo]  <- Canvas 100x100px, logo 100px (tight)
         ⬇️ Scale down to 40px
Result: [🎯 (40px)] <- Logo 40px görünüyor! ✅
```

---

## 📦 Teslim

Lütfen aşağıdaki dosyaları teslim edin:

- [ ] `logo-icon.svg` (100x100px, trimmed)
- [ ] `logo-wordmark.svg` (300x100px, trimmed)
- [ ] `logo-full.svg` (400x100px, trimmed)
- [ ] *(Opsiyonel)* PNG versiyonları (@2x resolution)

---

## 💡 Ekstra Notlar

- Logo SVG ise, renkleri CSS ile değiştirebilirim (`fill="currentColor"`)
- Dark/light mode desteği varsa, ayrı versiyonlar gönderebilirsiniz
- Favicon için ayrıca 32x32px ve 16x16px versiyonlar faydalı olur

---

**Teşekkürler!** 🙏

Bu export sayesinde header'da logo profesyonelce görünecek ve performans artacak (SVG çok daha hafif).
