# Profil Sayfası Bileşenleri - Fonksiyonel Dokümantasyon

## 📋 Genel Yapı

Profil sayfası, profil kartına tıklanınca açılan tam ekran bir sayfadır. İki ana sekme içerir:
1. **Profil Sekmesi** - Kullanıcı bilgileri ve istatistikler
2. **Rozetlerim Sekmesi** - Kazanılan ve kilitli rozetler

---

## 🔝 Header (Üst Bar)

### Bileşenler:
1. **Geri Butonu** (Sol)
   - **Fonksiyon:** `onBack()` handler'ını çağırır
   - **Aksiyon:** Ana ekrana geri döner

2. **Başlık** (Orta)
   - **Metin:** "Profile"
   - **Fonksiyon:** Statik başlık

3. **Bildirim Butonu** (Sağ)
   - **Fonksiyon:** Bildirimler ekranına yönlendirme (TODO: henüz implement edilmemiş)
   - **Özellik:** Üzerinde bildirim sayısı badge'i gösterir (örnek: "3")

4. **Ayarlar Butonu** (Sağ)
   - **Fonksiyon:** `onSettings()` handler'ını çağırır
   - **Aksiyon:** Profil ayarları ekranına gider

---

## 📑 Tab Navigasyon

### Bileşenler:

1. **Profil Tab**
   - **İkon:** Person ikonu
   - **Metin:** "Profil"
   - **Fonksiyon:** `setActiveTab('profile')` - Profil sekmesini aktif eder
   - **Durum:** Aktif olduğunda farklı görünüm

2. **Rozetlerim Tab**
   - **İkon:** Trophy ikonu
   - **Metin:** "Rozetlerim"
   - **Fonksiyon:** `setActiveTab('badges')` - Rozetler sekmesini aktif eder
   - **Özellik:** Üzerinde kazanılan rozet sayısı badge'i gösterir (örnek: "5")
   - **Durum:** Aktif olduğunda farklı görünüm

---

## 👤 PROFİL SEKMESİ Bileşenleri

### 1. Profile Header Card (Profil Üst Kartı)

#### Avatar Bölümü:
- **Avatar Container**
  - **Fonksiyon:** Tıklanınca `setShowAvatarPicker(true)` - Avatar seçim modalını açar
  - **İçerik:** 
    - Avatar görseli (varsa) veya kullanıcı adının ilk harfi
    - Sağ alt köşede kamera ikonu butonu

- **Kullanıcı Adı**
  - **Kaynak:** `user.name` (örnek: "Futbol Aşığı")
  - **Not:** Profil kartındaki "Futbol Aşığı" ile aynı olmalı

- **Username**
  - **Kaynak:** `user.username` (örnek: "@kullanici")
  - **Format:** @ işareti ile başlar

- **Plan Badge**
  - **PRO Badge:** `isPro === true` ise gösterilir
    - **İçerik:** 👑 emoji + "PRO" metni
    - **Not:** Profil kartındaki PRO badge ile aynı olmalı
  - **Free Badge:** `isPro === false` ise gösterilir
    - **İçerik:** "Free" metni

- **Level, Points & Badges Container**
  - **Level Box:**
    - **Label:** "Level"
    - **Value:** `user.level` (örnek: 12)
    - **Not:** Profil kartındaki "Level 12" ile aynı olmalı
  
  - **Badges Box:**
    - **Label:** "Badges"
    - **Value:** `badgeCount` (kazanılan rozet sayısı)
  
  - **Points Box:**
    - **Label:** "Points"
    - **Value:** `user.points.toLocaleString()` (örnek: 2,845)
    - **Not:** Profil kartındaki "2,845 Puan" ile aynı olmalı

---

### 2. Performance Card (Performans Kartı)

#### Üst Bölüm - Performance Grid:
- **Success Rate Box:**
  - **Label:** "Success Rate"
  - **Value:** `user.stats.success` + "%"
  - **Fonksiyon:** Başarı oranını gösterir

- **Total Predictions Box:**
  - **Label:** "Total Predictions"
  - **Value:** `user.stats.total`
  - **Fonksiyon:** Toplam tahmin sayısını gösterir

- **Day Streak Box:**
  - **Label:** "Day Streak"
  - **Value:** `user.stats.streak`
  - **Fonksiyon:** Günlük seri sayısını gösterir

#### Orta Bölüm - Country Ranking Card:
- **Ranking Header:**
  - **Sol Taraf:**
    - **Label:** `{user.country} Sıralaması` (örnek: "Türkiye Sıralaması")
    - **Value:** `#{user.countryRank.toLocaleString()}` (örnek: "#156")
    - **Not:** Profil kartındaki "#156 / 2,365" ile uyumlu olmalı
  
  - **Sağ Taraf:**
    - **Label:** "Toplam Oyuncu"
    - **Value:** `{user.totalPlayers.toLocaleString()}` (örnek: "2,365")

- **Progress Bar:**
  - **Fonksiyon:** Sıralama yüzdesini görsel olarak gösterir
  - **Hesaplama:** `((user.totalPlayers - user.countryRank) / user.totalPlayers) * 100`

- **Top Percentage:**
  - **Metin:** "Top {topPercentage}%"
  - **Hesaplama:** `(user.countryRank / user.totalPlayers) * 100`

#### Alt Bölüm - Additional Metrics:
- **Avg Rating Box:**
  - **İkon:** Medal ikonu
  - **Label:** "Avg Rating"
  - **Value:** `user.avgMatchRating`
  - **Fonksiyon:** Ortalama maç puanını gösterir

- **XP This Week Box:**
  - **İkon:** Flash ikonu
  - **Label:** "XP This Week"
  - **Value:** `+{user.xpGainThisWeek}`
  - **Fonksiyon:** Bu hafta kazanılan XP'yi gösterir

---

### 3. Favorite Teams Card (Favori Takımlar Kartı)

#### Bileşenler:
- **Card Header:**
  - **İkon:** Trophy ikonu
  - **Başlık:** "Favori Takımlar"

- **Teams List:**
  - **Milli Takım:** (Varsa)
    - **Gösterim:** Tek bir kart
    - **İçerik:**
      - Takım adı (`selectedNationalTeam.name`)
      - Teknik direktör (`selectedNationalTeam.coach`)
      - Ülke ve lig bilgisi (`selectedNationalTeam.country • selectedNationalTeam.league`)
    - **Görsel:** Sol ve sağ tarafta takım renklerinde gradient şeritler

  - **Kulüp Takımları:** (Maksimum 5 adet)
    - **Gösterim:** Her biri ayrı kart
    - **İçerik:**
      - Takım adı (`selectedClubTeams[index].name`)
      - Teknik direktör (`selectedClubTeams[index].coach`)
      - Ülke ve lig bilgisi (`selectedClubTeams[index].country • selectedClubTeams[index].league`)
    - **Görsel:** Sol ve sağ tarafta takım renklerinde gradient şeritler
    - **Not:** Profil kartındaki rozetler ile aynı takımlar olmalı (eğer rozetler takım bazlı ise)

- **Empty State:**
  - **Koşul:** `!selectedNationalTeam && selectedClubTeams.filter(Boolean).length === 0`
  - **Metin:** "Henüz favori takım seçilmemiş. Takımlarınızı Seçin ekranından ekleyin."

---

### 4. Best Cluster Card (En İyi Olduğu Küme Kartı)

#### Koşul:
- **Gösterim:** Sadece `bestCluster !== null` ise gösterilir

#### Bileşenler:
- **Card Header:**
  - **İkon:** `bestCluster.icon` (örnek: "⚡")
  - **Başlık:** "En İyi Olduğun Küme"

- **Cluster Card:**
  - **Küme Adı:** `bestCluster.name` (örnek: "Tempo & Akış")
  
  - **Stats Container:**
    - **Doğruluk Oranı:**
      - **Label:** "Doğruluk Oranı"
      - **Value:** `{bestCluster.accuracy}%` (örnek: "75%")
    
    - **Uzman Badge:**
      - **İkon:** Trophy ikonu
      - **Metin:** "Uzman"
  
  - **Hint Text:**
    - **Metin:** "Bu alanda çok güçlüsün! Devam et! 💪"

#### Fonksiyon:
- Kullanıcının en başarılı olduğu analiz kümesini gösterir
- Tahmin geçmişine göre hesaplanır

---

### 5. Achievements Card (Başarılar Kartı)

#### Bileşenler:
- **Card Header:**
  - **İkon:** Star ikonu
  - **Başlık:** "Achievements"

- **Achievements Grid:**
  - **Achievement Item:** (3 adet)
    1. **Winner:**
       - **İkon:** 🏆
       - **İsim:** "Winner"
       - **Açıklama:** "10 doğru tahmin"
    
    2. **Streak Master:**
       - **İkon:** 🔥
       - **İsim:** "Streak Master"
       - **Açıklama:** "5 gün üst üste"
    
    3. **Expert:**
       - **İkon:** ⭐
       - **İsim:** "Expert"
       - **Açıklama:** "Level 10'a ulaştı"

#### Not:
- Şu anda statik veri gösteriyor
- Gelecekte kullanıcının gerçek başarılarına göre dinamik olmalı

---

### 6. Database Test Button (Geliştirici Butonu)

#### Koşul:
- **Gösterim:** Sadece `__DEV__ === true` ve `onDatabaseTest` prop'u varsa

#### Bileşenler:
- **Buton:**
  - **İkon:** Server ikonu
  - **Metin:** "🧪 Database Test"
  - **Fonksiyon:** `onDatabaseTest()` handler'ını çağırır
  - **Aksiyon:** Database test ekranına gider

---

## 🏆 ROZETLERİM SEKMESİ Bileşenleri

### 1. Badge Grid (Rozet Grid'i)

#### Yapı:
- **Layout:** 4 sütunlu grid
- **Scroll:** Dikey scroll (FlatList)
- **Data Source:** `allBadges` array'i

#### Badge Card Bileşenleri:
- **Badge Icon:**
  - **Kaynak:** `item.icon` (emoji)
  - **Görünürlük:** Her zaman gösterilir (kilitli olsa bile)

- **Badge Name:**
  - **Kaynak:** `item.name`
  - **Durum:** 
    - Kazanılmışsa: Normal görünüm
    - Kilitliyse: Soluk görünüm

- **Badge Tier Label:**
  - **Kaynak:** `getBadgeTierName(item.tier)`
  - **Görünürlük:** Her zaman gösterilir
  - **Değerler:** Bronze, Silver, Gold, Platinum, Diamond

- **Lock Icon:**
  - **Koşul:** `!item.earned` ise gösterilir
  - **Konum:** Sağ üst köşe
  - **İkon:** Lock-closed ikonu

- **Sparkle Icon:**
  - **Koşul:** `item.earned` ise gösterilir
  - **Konum:** Sağ üst köşe
  - **İkon:** ✨ emoji

- **Border:**
  - **Kazanılmış:** Tier rengine göre border
  - **Kilitli:** Varsayılan border

#### Fonksiyon:
- **Tıklama:** `setSelectedBadge(item)` - Badge detay modalını açar

#### Empty State:
- **Koşul:** `allBadges.length === 0`
- **İkon:** Trophy-outline ikonu
- **Başlık:** "Henüz rozet yok"
- **Açıklama:** "Maçlara tahmin yap ve rozetleri kazan!"

---

### 2. Badge Detail Modal (Rozet Detay Modalı)

#### Açılma Koşulu:
- **Trigger:** Badge card'a tıklanınca
- **State:** `selectedBadge !== null`

#### Bileşenler:

1. **Badge Icon Container:**
   - **İkon:** 
     - Kazanılmışsa: `selectedBadge.icon`
     - Kilitliyse: 🔒 emoji
   - **Fonksiyon:** Rozet görselini gösterir

2. **Badge Name:**
   - **Kaynak:** `selectedBadge.name`
   - **Fonksiyon:** Rozet adını gösterir

3. **Badge Tier:**
   - **Koşul:** Sadece `selectedBadge.earned === true` ise gösterilir
   - **Kaynak:** `getBadgeTierName(selectedBadge.tier)`
   - **Fonksiyon:** Rozet seviyesini gösterir

4. **Badge Description:**
   - **Kaynak:** `selectedBadge.description`
   - **Fonksiyon:** Rozet açıklamasını gösterir

5. **Requirement Section:**
   - **Kazanılmışsa:**
     - **İkon:** Checkmark-circle ikonu
     - **Metin:** `"Kazanıldı: {new Date(selectedBadge.earnedAt!).toLocaleDateString('tr-TR')}"`
     - **Fonksiyon:** Kazanılma tarihini gösterir
   
   - **Kilitliyse:**
     - **İkon:** Information-circle ikonu
     - **Metin:** `"Nasıl Kazanılır: {selectedBadge.requirement}"`
     - **Fonksiyon:** Kazanma koşullarını gösterir

6. **Progress Bar Section:**
   - **Koşul:** Sadece `!selectedBadge.earned` ise gösterilir
   - **Bileşenler:**
     - **Progress Header:**
       - **Label:** "İlerleme"
       - **Value:** "12 / 20" (örnek - gerçek değer hesaplanmalı)
     - **Progress Bar:**
       - **Width:** İlerleme yüzdesine göre (örnek: "60%")
     - **Hint Text:**
       - **Metin:** "🎯 8 maç daha kazanman gerekiyor!" (örnek - dinamik olmalı)
   - **Fonksiyon:** Kilitli rozetler için ilerleme durumunu gösterir

7. **Close Button:**
   - **Metin:** "Kapat"
   - **Fonksiyon:** `setSelectedBadge(null)` - Modalı kapatır

#### Modal Overlay:
- **Fonksiyon:** Dışarı tıklanınca modal kapanır
- **Aksiyon:** `setSelectedBadge(null)`

---

## 🖼️ Avatar Picker Modal (Avatar Seçim Modalı)

#### Açılma Koşulu:
- **Trigger:** Avatar container'a tıklanınca
- **State:** `showAvatarPicker === true`

#### Bileşenler:

1. **Modal Header:**
   - **Başlık:** "Profil Fotoğrafı Değiştir"
   - **Close Button:**
     - **İkon:** Close ikonu
     - **Fonksiyon:** `setShowAvatarPicker(false)` - Modalı kapatır

2. **Modal Options:**
   - **Fotoğraf Çek:**
     - **Metin:** "📷 Fotoğraf Çek"
     - **Fonksiyon:** Kamera açma (TODO: implement edilmemiş)
   
   - **Galeriden Seç:**
     - **Metin:** "🖼️ Galeriden Seç"
     - **Fonksiyon:** Galeri açma (TODO: implement edilmemiş)
   
   - **Avatar Oluştur:**
     - **Metin:** "🎨 Avatar Oluştur"
     - **Fonksiyon:** Avatar oluşturma (TODO: implement edilmemiş)

#### Not:
- Şu anda sadece UI var, fonksiyonlar implement edilmemiş

---

## 🔄 Profil Kartı ile Uyumluluk

### Eşleşmesi Gereken Veriler:

1. **Kullanıcı Adı:**
   - **Profil Kartı:** "Futbol Aşığı" (hardcoded)
   - **Profil Sayfası:** `user.name` (örnek: "Futbol Aşığı")
   - **Uyum:** ✅ Aynı kaynaktan gelmeli

2. **PRO Badge:**
   - **Profil Kartı:** PRO badge gösterilir (hardcoded)
   - **Profil Sayfası:** `isPro === true` ise gösterilir
   - **Uyum:** ✅ Aynı state'ten (`isPro`) kontrol edilmeli

3. **Level ve Puan:**
   - **Profil Kartı:** "Level 12 • 2,845 Puan" (hardcoded)
   - **Profil Sayfası:** 
     - Level: `user.level` (örnek: 12)
     - Points: `user.points.toLocaleString()` (örnek: 2,845)
   - **Uyum:** ✅ Aynı kaynaktan (`user.level`, `user.points`) gelmeli

4. **Türkiye Sıralaması:**
   - **Profil Kartı:** "#156 / 2,365" (hardcoded)
   - **Profil Sayfası:**
     - Rank: `user.countryRank` (örnek: 156)
     - Total: `user.totalPlayers` (örnek: 2,365)
   - **Uyum:** ✅ Aynı kaynaktan (`user.countryRank`, `user.totalPlayers`) gelmeli

5. **Rozetler:**
   - **Profil Kartı:** Yatay scroll'da kazanılan rozetler gösterilir
   - **Profil Sayfası:** 
     - Profil sekmesinde: Badge count gösterilir
     - Rozetler sekmesinde: Tüm rozetler grid'de gösterilir
   - **Uyum:** ✅ Aynı kaynaktan (`getUserBadges()`) gelmeli

6. **Avatar:**
   - **Profil Kartı:** "FM" harfleri (hardcoded)
   - **Profil Sayfası:** `user.avatar` veya `user.name.charAt(0)`
   - **Uyum:** ✅ Aynı kaynaktan (`user.avatar`, `user.name`) gelmeli

---

## 📊 Veri Kaynakları

### State Yönetimi:
- **User Data:** `user` state object'i
  - AsyncStorage'dan yüklenir
  - Supabase'den güncellenir (UUID varsa)
  
- **Badges:** `allBadges` state array'i
  - `getAllAvailableBadges()` servisinden yüklenir
  - Hem kazanılan hem kilitli rozetleri içerir

- **Favorite Teams:** `favoriteTeams` hook'undan gelir
  - `useFavoriteTeams()` hook'u kullanılır
  - AsyncStorage'dan yüklenir

- **Pro Status:** `isPro` state boolean
  - AsyncStorage'dan kontrol edilir
  - Supabase'den güncellenir

---

## 🎯 Handler Fonksiyonları

### Props'tan Gelen Handler'lar:
1. **onBack()** - Ana ekrana geri döner
2. **onSettings()** - Profil ayarları ekranına gider
3. **onProUpgrade()** - PRO yükseltme ekranına gider
4. **onDatabaseTest()** - Database test ekranına gider (opsiyonel)
5. **onTeamSelect(teamId, teamName)** - Takım seçildiğinde maçlar ekranına gider (opsiyonel)

### Internal Handler'lar:
1. **setActiveTab(tab)** - Sekme değiştirir ('profile' | 'badges')
2. **setShowAvatarPicker(show)** - Avatar picker modalını açar/kapatır
3. **setSelectedBadge(badge)** - Badge detay modalını açar/kapatır
4. **handleTeamSelect(team, type, index)** - Takım seçimini kaydeder

---

## 📝 Notlar

1. **Hardcoded Değerler:**
   - Profil kartında bazı değerler hardcoded (örnek: "Futbol Aşığı", "Level 12")
   - Bu değerler `user` state'inden dinamik olarak gelmeli

2. **TODO'lar:**
   - Bildirim butonu fonksiyonu implement edilmeli
   - Avatar picker seçenekleri implement edilmeli
   - Achievements dinamik hale getirilmeli
   - Badge progress bar gerçek verilerle hesaplanmalı

3. **Veri Senkronizasyonu:**
   - Profil kartı ve profil sayfası aynı veri kaynaklarını kullanmalı
   - AsyncStorage ve Supabase senkronize olmalı

4. **Loading State:**
   - Sayfa yüklenirken loading indicator gösterilir
   - `loading === true` ise loading ekranı gösterilir

---

## 🔗 İlgili Dosyalar

- **Profil Sayfası:** `src/screens/ProfileScreen.tsx`
- **Profil Kartı:** `src/components/ProfileCard.tsx`
- **Badge Servisi:** `src/services/badgeService.ts`
- **Badge Tipleri:** `src/types/badges.types.ts`
- **Badge Sabitleri:** `src/constants/badges.ts`
- **Database Servisi:** `src/services/databaseService.ts`
- **Favorite Teams Hook:** `src/hooks/useFavoriteTeams.ts`
