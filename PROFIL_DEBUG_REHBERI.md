# 🔍 Profil Ekranı Debug Rehberi

**Tarih:** 11 Ocak 2026  
**Durum:** ⚠️ İnceleme Altında  
**Sorun:** Profil ekranında Galatasaray görünüyor, ama Fenerbahçe seçilmiş

---

## 🎯 Sorun Tanımı

### **Beklenen Davranış:**
1. Kullanıcı `FavoriteTeamsScreen`'de Fenerbahçe seçer
2. Fenerbahçe (ID: 548) AsyncStorage'e kaydedilir
3. Dashboard'da Fenerbahçe maçları görünür (✅ ÇALIŞIYOR - 47 maç)
4. Profil ekranında Fenerbahçe görünmeli (❌ SORUN - Galatasaray görünüyor)

### **Gerçekleşen Davranış:**
- ✅ Fenerbahçe başarıyla kaydediliyor (console'da doğrulandı)
- ✅ Dashboard doğru çalışıyor (Fenerbahçe maçları gösteriliyor)
- ❌ Profil ekranında hala Galatasaray görünüyor

---

## 📊 Sistem Durumu

### **✅ Çalışan Servisler:**
```
Backend:  http://localhost:3000 (✅ RUNNING)
Frontend: http://localhost:8082 (✅ RUNNING)
Database: Supabase (✅ CONNECTED)
```

### **🔍 Debug Araçları:**
1. **debug-profile-teams.html** - Storage test sayfası
2. **ProfileScreen.tsx** - Debug log'ları eklendi
3. **Console logs** - Detaylı izleme aktif

---

## 🧪 Test Senaryoları

### **Test 1: Storage Kontrolü**

**Adımlar:**
1. Tarayıcıda `debug-profile-teams.html` açın
2. "🔄 Yenile" butonuna tıklayın
3. Storage içeriğini kontrol edin

**Beklenen Sonuç:**
```json
[
  {
    "id": 548,
    "name": "Fenerbahçe",
    "logo": "https://media.api-sports.io/football/teams/548.png",
    "league": "Süper Lig"
  }
]
```

**Test Butonları:**
- 🟡🔵 Fenerbahçe Kaydet
- 🟡🔴 Galatasaray Kaydet
- ⚫⚪ Beşiktaş Kaydet

---

### **Test 2: Profil Ekranı Kontrolü**

**Adımlar:**
1. Frontend'i açın: http://localhost:8082
2. Profil ekranına gidin
3. Browser console'u açın (F12)
4. Aşağıdaki log'ları arayın:

```javascript
🔍 [PROFILE] Loading favorite teams from AsyncStorage...
🔍 [PROFILE] Raw storage data: [{"id":548,"name":"Fenerbahçe",...}]
✅ [PROFILE] Loaded favorite teams: [{...}]
```

**Sorun Varsa:**
- ⚠️ Eğer `null` veya `undefined` görüyorsanız → Storage boş
- ⚠️ Eğer Galatasaray verisi geliyorsa → Cache sorunu
- ⚠️ Eğer log'lar hiç çıkmıyorsa → Component render sorunu

---

### **Test 3: Manuel Storage Temizleme**

**Browser Console'da çalıştırın:**

```javascript
// 1. Mevcut storage içeriğini kontrol et
console.log('Current:', localStorage.getItem('fan-manager-favorite-clubs'));

// 2. Storage'i temizle
localStorage.removeItem('fan-manager-favorite-clubs');

// 3. Fenerbahçe'yi kaydet
localStorage.setItem('fan-manager-favorite-clubs', JSON.stringify([{
  id: 548,
  name: "Fenerbahçe",
  logo: "https://media.api-sports.io/football/teams/548.png",
  league: "Süper Lig"
}]));

// 4. Sayfayı hard refresh yap
location.reload(true);
```

---

## 🔧 Olası Çözümler

### **Çözüm 1: Cache Temizleme**

```bash
# Browser'da:
Ctrl + Shift + R  (Hard Refresh)

# Veya:
F12 → Application → Clear Site Data
```

### **Çözüm 2: Component Force Refresh**

ProfileScreen.tsx'e eklendi:
```typescript
// useEffect with dependency on screen mount
useEffect(() => {
  const fetchUserData = async () => {
    // Force fresh read from AsyncStorage
    const favoriteTeamsStr = await AsyncStorage.getItem('fan-manager-favorite-clubs');
    console.log('🔍 [PROFILE] Raw storage data:', favoriteTeamsStr);
    
    if (favoriteTeamsStr) {
      const teams = JSON.parse(favoriteTeamsStr);
      setFavoriteTeams(teams);
      console.log('✅ [PROFILE] Loaded favorite teams:', teams);
    } else {
      console.log('⚠️ [PROFILE] No favorite teams found');
      setFavoriteTeams([]);
    }
  };

  fetchUserData();
}, []); // Empty deps = run on mount
```

### **Çözüm 3: useFavoriteTeams Hook Refetch**

Eğer ProfileScreen `useFavoriteTeams` hook'unu kullanıyorsa:
```typescript
const { favoriteTeams, loading, refetch } = useFavoriteTeams();

useEffect(() => {
  refetch(); // Force fresh fetch on mount
}, []);
```

---

## 📝 Debug Checklist

### **Storage Kontrolü:**
- [ ] `localStorage.getItem('fan-manager-favorite-clubs')` doğru veriyi döndürüyor mu?
- [ ] Veri formatı doğru mu? (Array of objects with id, name, logo)
- [ ] ID doğru mu? (Fenerbahçe: 548)

### **Component Kontrolü:**
- [ ] ProfileScreen mount olurken AsyncStorage okuyor mu?
- [ ] setFavoriteTeams() çağrılıyor mu?
- [ ] State güncellenmiş mi?

### **Render Kontrolü:**
- [ ] favoriteTeams array'i boş mu?
- [ ] .map() fonksiyonu çalışıyor mu?
- [ ] Takım logoları yükleniyor mu?

---

## 🚀 Hızlı Test Komutları

### **Backend Test:**
```bash
curl http://localhost:3000/health
# Beklenen: {"status":"ok"}
```

### **Frontend Test:**
```bash
# Tarayıcıda:
http://localhost:8082
# Console'da:
localStorage.getItem('fan-manager-favorite-clubs')
```

### **Storage Test:**
```bash
# debug-profile-teams.html açın
# Otomatik 5 saniyede bir yenilenir
```

---

## 📊 Veri Akışı

```
┌─────────────────────────────────────────┐
│  FavoriteTeamsScreen                     │
│  - Kullanıcı Fenerbahçe seçer           │
│  - onComplete([{id:548,...}]) çağrılır  │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  App.tsx                                 │
│  - handleFavoriteTeamsComplete()         │
│  - AsyncStorage.setItem()                │
│  - ✅ BAŞARILI (Console'da doğrulandı)  │
└──────────────┬──────────────────────────┘
               │
               ├───────────────┬──────────────────┐
               │               │                  │
               ↓               ↓                  ↓
┌──────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│  Dashboard       │  │  useFavoriteTeams│  │  ProfileScreen   │
│  ✅ ÇALIŞIYOR   │  │  ✅ ÇALIŞIYOR   │  │  ❌ SORUN        │
│  47 maç görünür │  │  Storage okuyor  │  │  Galatasaray!?   │
└──────────────────┘  └─────────────────┘  └──────────────────┘
```

---

## 🔍 İzleme Noktaları

### **Console'da Bakılacak Log'lar:**

```javascript
// 1. Takım seçimi (FavoriteTeamsScreen)
"✅ Seçili takımlar (ID ile): [{id: 548, ...}]"

// 2. Storage kaydetme (App.tsx)
"💾 Saved favorite teams with IDs: [{id: 548, ...}]"

// 3. Dashboard yükleme (useFavoriteTeamMatches)
"✅ Found 47 matches for Fenerbahçe"

// 4. Profil yükleme (ProfileScreen) - YENİ EKLENEN
"🔍 [PROFILE] Loading favorite teams from AsyncStorage..."
"🔍 [PROFILE] Raw storage data: ..."
"✅ [PROFILE] Loaded favorite teams: ..."
```

---

## 🛠️ Manuel Debug Adımları

### **Adım 1: Storage Doğrulama**
1. F12 → Console
2. Çalıştır:
   ```javascript
   localStorage.getItem('fan-manager-favorite-clubs')
   ```
3. Sonuç Fenerbahçe mi Galatasaray mı?

### **Adım 2: Component State Debug**
ProfileScreen.tsx'e ekle:
```typescript
useEffect(() => {
  console.log('🔍 [PROFILE STATE]', { favoriteTeams });
}, [favoriteTeams]);
```

### **Adım 3: Force Refresh Test**
1. Storage'i manuel olarak Fenerbahçe yap
2. Ctrl + Shift + R (Hard Refresh)
3. Hala Galatasaray görünüyor mu?

---

## 📋 Sonraki Adımlar

### **Eğer Sorun Devam Ediyorsa:**

1. **Cache Temizleme:**
   - F12 → Application → Clear Storage
   - Tüm cookies ve cache'i temizle

2. **Component Yeniden Yazma:**
   - ProfileScreen'i useState yerine useFavoriteTeams hook kullanacak şekilde değiştir

3. **Storage Key Kontrolü:**
   - Başka bir key kullanılıyor olabilir mi?
   - `grep -r "Galatasaray" src/` ile ara

4. **Mock Data Kontrolü:**
   - ProfileScreen'de mock data tanımlı mı?
   - Default value Galatasaray mı?

---

## 🎯 Hedef

**Profil ekranında seçilen favori takımın doğru görünmesi!** 🟡🔵

---

## 📞 Yardım

Eğer sorun devam ediyorsa:

1. `debug-profile-teams.html` açın
2. Browser console screenshot'ları alın
3. ProfileScreen console log'larını paylaşın

---

**Son Güncelleme:** 11 Ocak 2026, 10:20 UTC  
**Durum:** Debug araçları hazır, test bekliyor
