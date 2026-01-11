# 🚨 CONNECTION REFUSED - Troubleshooting

## ❌ **HATA:**

```
ERR_CONNECTION_REFUSED
localhost bağlanmayı reddetti
```

**Frontend:** http://localhost:8082 (Expo web)
**Backend:** http://localhost:3000 (Express)

---

## ✅ **DURUM:**

1. **Backend çalışıyor** ✅
   - Port 3000 LISTENING
   - Database sync yapıyor
   
2. **Frontend çalışıyor** ✅
   - Port 8082'de açık

3. **Sorun:** Frontend → Backend bağlantısı kesildi

---

## 🔧 **ÇÖZÜM ADıMLARI:**

### **1. Manuel Yenileme (En Kolay)**

Tarayıcıda:
```
F12 (DevTools) → Application → Clear storage → Clear site data
CTRL + SHIFT + R (Hard refresh)
```

### **2. Backend Log Kontrolü**

Terminal'de backend'i kontrol edin:
```bash
cd backend
npm run dev
```

**Beklenen:**
```
✅ Server running on port 3000
✅ Database connected
```

### **3. Frontend Yeniden Başlat**

Yeni terminal'de:
```bash
npx expo start --web --port 8082 --clear
```

`--clear` flag'i cache'i temizler.

### **4. CORS Kontrolü**

`backend/server.js` dosyasında:
```javascript
app.use(cors({
  origin: [
    'http://localhost:8081', 
    'http://localhost:19006', 
    'http://localhost:3000', 
    'http://localhost:8082'  // ← Bu var mı?
  ],
  credentials: true,
}));
```

---

## 🎯 **HIZLI TEST:**

Tarayıcı console'unda (F12):
```javascript
fetch('http://localhost:3000/api/matches/team/611/season/2025')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Eğer çalışıyorsa:** Frontend problemi
**Eğer hata veriyorsa:** CORS problemi

---

## 📝 **YAPILACAKLAR:**

1. ✅ Backend çalışıyor (port 3000)
2. ⏳ Frontend'i yeniden başlat
3. ⏳ Cache temizle (CTRL + SHIFT + R)
4. ⏳ Fetch test et (browser console)

---

**Şimdi deneyin:**

1. Tarayıcıyı kapatın
2. Yeni terminal:
   ```
   npx expo start --web --port 8082 --clear
   ```
3. Tarayıcıyı açın: http://localhost:8082
4. Log'ları kontrol edin

**Sonucu paylaşın!** 🚀
