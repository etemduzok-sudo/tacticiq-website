# ⚖️ Telif Hakkı Koruma Politikası

## ⚠️ ÖNEMLİ: Kulüp Takım Armoları ASLA Kullanılmaz

### ❌ YASAKLANAN:
1. **Kulüp Takım Armoları (Logo)**
   - Kulüp takımlarının resmi armaları/logo'ları **ASLA** kullanılmaz
   - Telif hakkı koruması nedeniyle logo URL'leri kaydedilmez veya döndürülmez
   - Logo görselleri API-Football'dan alınmaz veya gösterilmez
   - Tüm kulüp takımları için logo her zaman NULL olarak kaydedilir/döndürülür

2. **Organizasyon Logo'ları (UEFA, FIFA, vs.)**
   - UEFA Şampiyonlar Ligi, UEFA Avrupa Ligi logo'ları **ASLA** kullanılmaz
   - FIFA Dünya Kupası, FIFA logosu **ASLA** kullanılmaz
   - CONMEBOL, AFC, CAF gibi kıta organizasyonları logo'ları **ASLA** kullanılmaz
   - Tüm organizasyon logo'ları teliflidir ve kullanılmaz

3. **Ülke 1. Lig Logo'ları (Premier League, La Liga, Serie A, vs.)**
   - Premier League logo'su **ASLA** kullanılmaz
   - La Liga logo'su **ASLA** kullanılmaz
   - Serie A logo'su **ASLA** kullanılmaz
   - Bundesliga logo'su **ASLA** kullanılmaz
   - Ligue 1 logo'su **ASLA** kullanılmaz
   - Süper Lig logo'su **ASLA** kullanılmaz
   - Tüm ülke 1. liglerinin logo'ları teliflidir ve kullanılmaz
   - Sadece lig renkleri (brand colors) kullanılabilir

### ✅ İZİN VERİLEN:
1. **Arma Renkleri (Kit Colors)**
   - Kulüp takımlarının resmi forma renkleri kullanılabilir
   - Örnek: Fenerbahçe → Sarı (#FFFF00) ve Lacivert (#000080)
   - Örnek: Beşiktaş → Siyah (#000000) ve Beyaz (#FFFFFF)
   - Bu renkler telifli değildir ve kullanılabilir

2. **Milli Takım Bayrakları**
   - Milli takımların ülke bayrakları kullanılabilir
   - Bayrak görselleri telifli değildir
   - API-Football'dan flag URL'leri alınabilir ve gösterilebilir

3. **Organizasyon Renkleri (Brand Colors)**
   - UEFA organizasyon renkleri kullanılabilir (örnek: UEFA mavisi #0C2340)
   - FIFA organizasyon renkleri kullanılabilir (örnek: FIFA kırmızısı #E10600)
   - Kıta organizasyonları renkleri kullanılabilir (CONMEBOL, AFC, vs.)
   - Renkler telifli değildir ve marka tanımlaması için kullanılabilir

---

## 🔧 Uygulama Detayları

### Backend (`staticTeamsService.js`):
```javascript
// ⚠️ TELİF HAKKI KORUMASI
const logoUrl = teamType === 'club' ? null : null; // Kulüp armaları telifli - ASLA kullanılmaz
const flagUrl = teamType === 'national' ? (teamData.flag || null) : null; // Sadece milli takımlar için bayrak
```

### Backend (`matches.js`, `databaseService.js`):
```javascript
// ⚠️ TELİF HAKKI: Organizasyon logo'ları (UEFA, FIFA) ASLA kullanılmaz
logo: null, // League logo'ları telifli - ASLA kullanılmaz
```

### API Response (`staticTeams.js`):
```javascript
{
  id: 645,
  name: "Galatasaray",
  type: "club",
  colors: ["#FFA500", "#FF0000"], // ✅ Renkler kullanılabilir
  logo: null, // ❌ Logo ASLA döndürülmez (telif koruması)
  flag: null  // Kulüp takımları için bayrak yok
}

{
  id: 777,
  name: "Türkiye",
  type: "national",
  colors: ["#E30A17", "#FFFFFF"],
  logo: null,
  flag: "https://..." // ✅ Milli takım bayrağı kullanılabilir
}
```

### Database Schema (`create_static_teams_db.sql`):
```sql
logo_url TEXT, -- ⚠️ Kulüp takımları için NULL (telif koruması)
flag_url TEXT, -- ✅ Milli takımlar için bayrak (telifli değil)
```

### View (`v_club_teams`):
```sql
-- logo_url ASLA döndürülmez (telif koruması - sadece renkler kullanılır)
```

---

## 📱 Frontend Kullanımı

### Mobil ve Web'de Kulüp Takım Gösterimi:
```tsx
// ❌ YANLIŞ - Logo gösterilmez
<Image source={{ uri: team.logo }} />

// ✅ DOĞRU - Sadece renkler kullanılır
<LinearGradient colors={team.colors} style={styles.teamCard}>
  <Text>{team.name}</Text>
</LinearGradient>

// Veya renk bar ile:
<View style={{ backgroundColor: team.colors[0] }} />
```

### Milli Takım Gösterimi:
```tsx
// ✅ DOĞRU - Bayrak kullanılabilir
{team.type === 'national' && team.flag && (
  <Image source={{ uri: team.flag }} />
)}
```

---

## 🎨 UI/UX Önerileri

### Kulüp Takım Kartları:
- Renkli gradient arka plan (forma renkleri)
- Takım adı (metin)
- Renk bar (yan şerit)
- Logo **ASLA** gösterilmez

### Milli Takım Kartları:
- Bayrak görseli (küçük)
- Renkli gradient arka plan (forma renkleri)
- Takım adı (metin)
- Bayrak **kullanılabilir**

---

## ✅ Kontrol Listesi

### Kulüp Takımları:
- [x] `staticTeamsService.js` - Logo URL'leri NULL olarak kaydedilir
- [x] `staticTeams.js` - Logo NULL olarak döndürülür
- [x] `create_static_teams_db.sql` - Logo URL yorumu eklendi
- [x] `v_club_teams` view - Logo URL döndürülmez

### Organizasyonlar (UEFA, FIFA, vs.):
- [x] `matches.js` - League logo NULL olarak döndürülür
- [x] `databaseService.js` - League logo NULL olarak kaydedilir
- [x] `dailySyncService.js` - League logo NULL olarak kaydedilir
- [x] `create_static_teams_db.sql` - League logo URL yorumu eklendi

### Kulüp Takımları (Tüm Liga'lar):
- [x] `databaseService.js` - Team logo NULL olarak kaydedilir
- [x] `teams.js` - Team logo NULL olarak döndürülür
- [x] `matches.js` - Team logo NULL olarak döndürülür
- [x] `dailySyncService.js` - Team logo NULL olarak kaydedilir

### Frontend:
- [ ] Frontend kontrolü - Logo gösterimi yok
- [ ] UI/UX test - Sadece renkler kullanılıyor
- [ ] Organizasyon logo'ları kaldırıldı (UEFA, FIFA, vs.)

---

**📝 Not:** Bu politika, kulüp takımlarının telif haklarını korumak ve yasal sorunlardan kaçınmak için uygulanmaktadır. Arma renkleri telifli değildir ve kullanılabilir.
