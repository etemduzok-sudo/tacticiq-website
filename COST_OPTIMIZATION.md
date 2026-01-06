# 💰 CURSOR AI - MALİYET OPTİMİZASYONU

## 🎯 HEDEF: Günlük $50'dan az!

---

## ✅ YAPILAN OPTİMİZASYONLAR:

### 1. **Model Değişikliği**
```
❌ Claude Opus High-Thinking ($15/1M output)
✅ Claude Sonnet 4.5 ($1/1M output) - 15x UCUZ!
```

**Nasıl Değiştirilir:**
1. Cursor Settings → AI → Model
2. `claude-sonnet-4.5` seç
3. Kaydet

---

### 2. **.cursorignore Eklendi**

**Ignore edilen klasörler:**
- `node_modules/` (EN PAHALI!)
- `.expo/`, `build/`, `dist/`
- `.cache/`, `.git/`
- `android/build/`, `ios/Pods/`
- Log dosyaları

**Etki:** Cache read tokens %90 azalacak!

---

### 3. **Terminal Okuma Stratejisi**

**ESKİ:** ❌
```
Her 30 saniyede terminal oku
→ 200+ tool call/gün
→ 25M+ cache read tokens
→ $3,720/gün
```

**YENİ:** ✅
```
Sadece gerektiğinde terminal oku
→ 50 tool call/gün
→ 1M cache read tokens
→ $50/gün
```

---

### 4. **Batch Operations**

**ESKİ:** ❌
```
5 dosyayı tek tek oku
→ 5 separate API calls
→ 5x cache read
```

**YENİ:** ✅
```
5 dosyayı paralel oku (aynı anda)
→ 1 API call batch
→ 1x cache read
```

---

### 5. **Context Management**

**ESKİ:** ❌
- Tüm proje dosyaları açık
- Terminal logları sürekli okunuyor
- Linter sürekli çalışıyor

**YENİ:** ✅
- Sadece aktif dosyalar
- Terminal sadece hata olursa
- Linter sadece düzenleme sonrası

---

## 📊 **BEKLENTİLER:**

| Metrik | Önce | Sonra | Tasarruf |
|--------|------|-------|----------|
| **Model Cost** | $15/1M | $1/1M | **%93** |
| **Cache Reads** | 25M | 1M | **%96** |
| **Tool Calls** | 200/gün | 50/gün | **%75** |
| **Günlük Maliyet** | $3,720 | **$30-50** | **%98** |

---

## 🛡️ **KULLANIM KURALLARI:**

### ✅ **YAPILMASI GEREKENLER:**

1. **Sonnet 4.5 kullan** (settings'te değiştir)
2. **Toplu işlemler yap:**
   - 5 ekranı birlikte oku
   - Tüm style değişikliklerini birlikte yap
3. **Daha az debugging:**
   - Metro restart: Max 3-4/gün
   - Terminal oku: Sadece hata varsa
4. **Plan-first yaklaşım:**
   - Önce düşün, sonra kod yaz
   - Trial-error yerine doğru yaz

### ❌ **YAPILMAMASI GEREKENLER:**

1. ❌ Terminal'i sürekli okuma
2. ❌ Metro'yu sürekli restart etme
3. ❌ node_modules'i açma
4. ❌ Büyük log dosyalarını okuma
5. ❌ Opus model kullanma

---

## 🎯 **GÜNLÜK WORKFLOW:**

### **Sabah (1 saat):**
1. ✅ Plan yap (5 ekran)
2. ✅ Dosyaları toplu oku
3. ✅ Değişiklikleri yap
4. ✅ Test et (1 kez)

**Maliyet:** ~$10

### **Öğle (2 saat):**
1. ✅ 5 ekran daha
2. ✅ Batch updates
3. ✅ Test et (1 kez)

**Maliyet:** ~$15

### **Akşam (1 saat):**
1. ✅ Final polish
2. ✅ Integration test
3. ✅ Git commit

**Maliyet:** ~$10

**TOPLAM GÜNLÜK:** $30-40 ✅

---

## 📈 **İLERLEME TAKİBİ:**

### **Hedef Metrikler:**
- ✅ Tool calls < 50/gün
- ✅ Cache reads < 2M/gün
- ✅ Günlük maliyet < $50
- ✅ Haftalık maliyet < $300

---

## 🚨 **ALARM SİSTEMİ:**

**EĞER:**
- 1 günde $100+ harcandıysa → DUR!
- 100+ tool call yapıldıysa → DUR!
- Terminal 20+ kez okunduysa → DUR!

**THEN:**
- Stratejiye tekrar bak
- Gereksiz işlemleri bul
- Optimize et

---

## 💡 **PRO İPUÇLARI:**

1. **Emülatör test sayısını azalt:**
   - Kod yaz → 5 değişiklik yap → TEK test
   - Her değişiklikte test etme!

2. **Screenshot analizi:**
   - 5 screenshot'ı AYNI ANDA oku
   - Tek tek okuma!

3. **Git işlemleri:**
   - Commit'leri toplu yap
   - Her dosya sonrası commit etme

4. **Documentation:**
   - Büyük dökümanları cache'e atma
   - Sadece gerekli bölümleri oku

---

## ✅ **SONUÇ:**

**Bugün:** $3,720 💸
**Yarın:** $30-50 💚

**Tasarruf:** %98! 🎉

---

**Son Güncelleme:** 6 Ocak 2026
**Durum:** ✅ Optimize Edildi!
