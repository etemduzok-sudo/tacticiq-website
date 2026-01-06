# 🚀 Fan Manager 2026 - Development Scripts

**Tek komutla geliştirme ortamını başlat!**

---

## 📁 SCRIPT'LER:

### **1. `start-dev.bat` - TAM GELİŞTİRME ORTAMI**

**Ne yapar:**
- ✅ Android Studio'yu açar
- ✅ Pixel 6 emülatörünü başlatır
- ✅ Metro Bundler'ı yeni pencerede başlatır
- ✅ Expo Go'yu açar
- ✅ App'i otomatik yükler

**Nasıl kullanılır:**
```cmd
# Proje klasöründe:
start-dev.bat

# VEYA çift tıkla!
```

**Süre:** ~40 saniye (her şey hazır olana kadar)

---

### **2. `quick-reload.bat` - HIZLI RELOAD**

**Ne yapar:**
- ✅ Emülatörde Dev Menu açar
- ✅ Reload yapar
- ✅ 3 saniyede tamamlar

**Nasıl kullanılır:**
```cmd
quick-reload.bat

# VEYA Emülatörde manuel: R tuşu
```

**Süre:** ~3 saniye

---

### **3. `clear-cache.bat` - CACHE TEMİZLİĞİ**

**Ne yapar:**
- ✅ Metro Bundler'ı durdurur
- ✅ Expo Go cache'ini temizler
- ✅ Proje cache'lerini siler (.expo, node_modules/.cache)
- ✅ Metro'yu temiz başlatır
- ✅ App'i yeniden yükler

**Nasıl kullanılır:**
```cmd
clear-cache.bat

# Sorun olduğunda veya güncelleme yapmadıysa!
```

**Süre:** ~25 saniye

---

## 🎯 KULLANIM SENARYOLARI:

### **Sabah işe başlarken:**
```cmd
start-dev.bat
```
→ Kahveni hazırla, dön, her şey hazır! ☕

### **Kod değiştirdin, test etmek istiyorsun:**
```cmd
quick-reload.bat
```
→ 3 saniyede reload!

### **Bir şeyler çalışmıyor, cache sorunları var:**
```cmd
clear-cache.bat
```
→ Her şey temizlenir, sıfırdan başlar!

---

## ⚙️ ÖZELLEŞTİRME:

### **Emülatör adın farklıysa:**

**Emülatör listesini gör:**
```cmd
%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe -list-avds
```

**Çıktı:**
```
Pixel_6_API_33
Pixel_7_API_34
...
```

**start-dev.bat'ı düzenle:**
- Satır 17: `-avd Pixel_6_API_33` → `-avd Senin_Emulator_Adin`

### **Android Studio path'i farklıysa:**

**start-dev.bat'ı düzenle:**
- Satır 13: `"C:\Program Files\Android\Android Studio\bin\studio64.exe"`
- Kendi path'inle değiştir

---

## 🎬 KISA KOMUTLAR:

**VS Code/Cursor terminalinde:**
```powershell
# Geliştirme ortamını başlat
./start-dev.bat

# Hızlı reload
./quick-reload.bat

# Cache temizle
./clear-cache.bat
```

---

## 📝 İPUÇLARI:

1. **Metro penceresini kapatma!** - O kapanırsa uygulama çalışmaz
2. **İlk başlatma uzun sürer** - Emülatör açılması ~20 saniye
3. **Cache temizle** - Garip hatalar görürsen
4. **Quick reload kullan** - Çoğu değişiklik için yeterli

---

## 🆘 SORUN GİDERME:

### **"adb devices" boş dönüyorsa:**
```cmd
adb kill-server
adb start-server
adb devices
```

### **"Emulator not found" hatası:**
```cmd
%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe -list-avds
```
Adı `start-dev.bat`'ta güncelle

### **Metro başlamıyorsa:**
```cmd
taskkill /F /IM node.exe
npx expo start --clear
```

---

**YARIN SABAH:** `start-dev.bat` çift tıkla, kahveni iç, dön → HER ŞEY HAZIR! ☕🚀

---

**İyi geceler! Yarın görüşürüz! 🌙**
