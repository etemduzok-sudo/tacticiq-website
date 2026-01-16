# 📱 TACTICIQ - TÜM EKRANLAR VE FONKSİYONLAR ANALİZİ

## 📋 İçindekiler
1. [Splash Screen](#1-splash-screen)
2. [Language Selection Screen](#2-language-selection-screen)
3. [Auth Screen](#3-auth-screen)
4. [Register Screen](#4-register-screen)
5. [Forgot Password Screen](#5-forgot-password-screen)
6. [Favorite Teams Screen](#6-favorite-teams-screen)
7. [Home Screen (Dashboard)](#7-home-screen-dashboard)
8. [Match List Screen](#8-match-list-screen)
9. [Match Detail](#9-match-detail)
10. [Match Result Summary Screen](#10-match-result-summary-screen)
11. [Profile Screen](#11-profile-screen)
12. [Profile Settings Screen](#12-profile-settings-screen)
13. [Change Password Screen](#13-change-password-screen)
14. [Notifications Screen](#14-notifications-screen)
15. [Delete Account Screen](#15-delete-account-screen)
16. [Pro Upgrade Screen](#16-pro-upgrade-screen)
17. [Legal Documents Screen](#17-legal-documents-screen)
18. [Legal Document Screen](#18-legal-document-screen)
19. [Leaderboard](#19-leaderboard)
20. [Database Test Screen](#20-database-test-screen)

---

## 1. SPLASH SCREEN

**Dosya:** `src/screens/SplashScreen.tsx`

### Props Interface
```typescript
interface SplashScreenProps {
  onComplete: (hasUser: boolean) => void;
}
```

### State'ler
- **Animasyon değerleri:**
  - `logoScale`: Logo scale animasyonu (0 → 1)
  - `logoRotation`: Logo rotation animasyonu (-180° → 0°)
  - `loadingOpacity`: Loading dots opacity (0 → 1)
  - `taglineOpacity`: Tagline opacity (0 → 1)
  - `brandingOpacity`: Branding opacity (0 → 1)
  - `dot1Y`, `dot2Y`, `dot3Y`: Loading dots bounce animasyonları
  - `circleAnimations`: 20 adet background circle animasyonları

### Ana Fonksiyonlar

#### `useEffect` - Animasyon ve Kullanıcı Kontrolü
- **Web için:** Animasyonları atlar, 2 saniye sonra kullanıcı kontrolü yapar
- **Native için:** 
  - Logo animasyonu (spring effect)
  - Loading dots animasyonu (bouncing)
  - Tagline ve branding fade-in
  - Background circles animasyonu (20 circle, sırayla)
- **Kullanıcı kontrolü:**
  - AsyncStorage'dan `fan-manager-user` kontrolü
  - DEV mode'da test kullanıcısı oluşturma
  - Database'e kullanıcı senkronizasyonu
  - `onComplete(hasUser)` callback çağırma

### Handler Fonksiyonlar
- Yok (sadece `onComplete` callback kullanılıyor)

### Render Fonksiyonları
- **Background Pattern:** 20 adet animasyonlu circle
- **Logo Container:** Placeholder logo (FM 2026)
- **Loading Dots:** 3 adet bouncing dot
- **Tagline:** "Predict • Compete • Win"
- **Branding:** "Powered by Football Passion"

### Navigasyon
- `onComplete(true)` → `home` ekranına
- `onComplete(false)` → `language` ekranına

---

## 2. LANGUAGE SELECTION SCREEN

**Dosya:** `src/screens/LanguageSelectionScreen.tsx`

### Props Interface
```typescript
interface LanguageSelectionScreenProps {
  onLanguageSelect: (language: string) => void;
  onBack?: () => void;
}
```

### State'ler
- `scrollX`: Scrolling welcome text animasyonu için Animated.Value

### Ana Fonksiyonlar

#### `useEffect` - Welcome Text Animasyonu
- 6 dilde "Welcome" metinlerini sürekli scroll animasyonu
- 20 saniye döngü, sonsuz tekrar

### Desteklenen Diller
```typescript
const languages = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
];
```

### Handler Fonksiyonlar
- `onLanguageSelect(lang.code)`: Dil seçildiğinde çağrılır

### Render Fonksiyonları
- **Brand Zone:** Logo (FM 2026)
- **Language Grid:** 2 sütunlu dil seçim kartları
- **Welcome Scroll:** Sürekli kaydırılan hoş geldin mesajları
- **Footer:** Copyright bilgisi

### Navigasyon
- Dil seçildiğinde → `auth` ekranına

---

## 3. AUTH SCREEN

**Dosya:** `src/screens/AuthScreen.tsx`

### Props Interface
```typescript
interface AuthScreenProps {
  onLoginSuccess: () => void;
  onForgotPassword: () => void;
  onRegister: () => void;
  onBack?: () => void;
}
```

### State'ler
- `loginEmail`: Email input değeri
- `loginPassword`: Şifre input değeri
- `showPassword`: Şifre görünürlüğü toggle
- `loading`: Login işlemi loading durumu
- `emailStatus`: Email kontrol durumu ('idle' | 'checking' | 'available' | 'taken')

### Ana Fonksiyonlar

#### `handleEmailChange(text: string)`
- Email input değiştiğinde çağrılır
- Debounce ile email kontrolü (500ms)
- Email format kontrolü
- Email müsaitlik kontrolü (mockAuthService)

#### `handleLogin()`
- Email ve şifre validasyonu
- `authService.signIn()` çağrısı
- Başarılı login → AsyncStorage'a kaydet
- `onLoginSuccess()` callback çağırma
- Hata durumunda Alert göster

#### `handleGoogleSignIn()`
- Google Sign In başlatma
- `socialAuthService.signInWithGoogle()` çağrısı
- Başarılı → AsyncStorage'a kaydet
- `onLoginSuccess()` callback

#### `handleAppleSignIn()`
- Apple Sign In başlatma (iOS only)
- `socialAuthService.signInWithApple()` çağrısı
- Başarılı → AsyncStorage'a kaydet
- `onLoginSuccess()` callback

### Handler Fonksiyonlar
- `handleEmailChange`: Email input handler
- `handlePasswordChange`: Şifre input handler
- `handleLogin`: Login butonu handler
- `handleGoogleSignIn`: Google Sign In handler
- `handleAppleSignIn`: Apple Sign In handler
- `handleForgotPassword`: Şifremi unuttum handler
- `handleRegister`: Kayıt ol handler

### Render Fonksiyonları
- **Back Button:** Geri dön butonu
- **Brand Zone:** Logo ve başlık
- **Social Buttons:** Google ve Apple Sign In butonları
- **Divider:** "veya" ayırıcı
- **Email Input:** Email input alanı
- **Password Input:** Şifre input alanı (göster/gizle toggle)
- **Forgot Password Link:** Şifremi unuttum linki
- **Login Button:** Giriş yap butonu
- **Register Link:** Kayıt ol linki

### Navigasyon
- Login başarılı → `favorite-teams` veya `home` ekranına
- Register → `register` ekranına
- Forgot Password → `forgot-password` ekranına
- Back → `language` ekranına

---

## 4. REGISTER SCREEN

**Dosya:** `src/screens/RegisterScreen.tsx`

### Props Interface
```typescript
interface RegisterScreenProps {
  onRegisterSuccess: () => void;
  onBack: () => void;
}
```

### State'ler
- `email`: Email input
- `username`: Kullanıcı adı input
- `password`: Şifre input
- `confirmPassword`: Şifre tekrar input
- `showPassword`: Şifre görünürlüğü
- `showConfirmPassword`: Şifre tekrar görünürlüğü
- `loading`: Kayıt işlemi loading
- `usernameStatus`: Kullanıcı adı kontrol durumu
- `emailStatus`: Email kontrol durumu

### Ana Fonksiyonlar

#### `handleUsernameChange(text: string)`
- Kullanıcı adı değiştiğinde çağrılır
- Debounce ile kullanıcı adı kontrolü
- Format kontrolü (harf, rakam, alt çizgi)
- `authApi.checkUsername()` çağrısı

#### `handleEmailChange(text: string)`
- Email değiştiğinde çağrılır
- Email format kontrolü
- Email müsaitlik kontrolü

#### `handleRegister()`
- Tüm alanların validasyonu
- Şifre eşleşme kontrolü
- `authService.signUp()` çağrısı
- Başarılı → AsyncStorage'a kaydet
- `onRegisterSuccess()` callback

### Handler Fonksiyonlar
- `handleUsernameChange`: Kullanıcı adı input handler
- `handleEmailChange`: Email input handler
- `handlePasswordChange`: Şifre input handler
- `handleConfirmPasswordChange`: Şifre tekrar input handler
- `handleRegister`: Kayıt ol butonu handler

### Render Fonksiyonları
- **Back Button:** Geri dön butonu
- **Brand Zone:** Logo ve başlık
- **Username Input:** Kullanıcı adı input (real-time kontrol)
- **Email Input:** Email input (real-time kontrol)
- **Password Input:** Şifre input
- **Confirm Password Input:** Şifre tekrar input
- **Password Requirements:** Şifre gereksinimleri listesi
- **Register Button:** Kayıt ol butonu

### Navigasyon
- Kayıt başarılı → `favorite-teams` ekranına
- Back → `auth` ekranına

---

## 5. FORGOT PASSWORD SCREEN

**Dosya:** `src/screens/ForgotPasswordScreen.tsx`

### Props Interface
```typescript
interface ForgotPasswordScreenProps {
  onBack: () => void;
}
```

### State'ler
- `email`: Email input
- `loading`: Şifre sıfırlama işlemi loading
- `emailSent`: Email gönderildi durumu

### Ana Fonksiyonlar

#### `handleResetPassword()`
- Email validasyonu
- `authService.resetPassword()` çağrısı
- Başarılı → Email gönderildi mesajı göster
- Hata durumunda Alert göster

### Handler Fonksiyonlar
- `handleEmailChange`: Email input handler
- `handleResetPassword`: Şifre sıfırla butonu handler

### Render Fonksiyonları
- **Back Button:** Geri dön butonu
- **Brand Zone:** Logo ve başlık
- **Email Input:** Email input alanı
- **Reset Button:** Şifre sıfırla butonu
- **Success Message:** Email gönderildi mesajı (conditional)

### Navigasyon
- Back → `auth` ekranına

---

## 6. FAVORITE TEAMS SCREEN

**Dosya:** `src/screens/FavoriteTeamsScreen.tsx`

### Props Interface
```typescript
interface FavoriteTeamsScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}
```

### State'ler
- `selectedTeams`: Seçilen takımlar array'i
- `searchQuery`: Arama sorgusu
- `loading`: Takımlar yükleniyor durumu
- `teams`: Tüm takımlar listesi

### Ana Fonksiyonlar

#### `useEffect` - Takımları Yükle
- API'den takımları çek
- AsyncStorage'dan seçili takımları yükle
- State'e set et

#### `handleTeamToggle(teamId: number)`
- Takım seçimi/kaldırma toggle
- Maksimum 5 takım kontrolü
- `selectedTeams` state'ini güncelle

#### `handleComplete()`
- Seçili takımları AsyncStorage'a kaydet
- `onComplete()` callback çağırma

### Handler Fonksiyonlar
- `handleTeamToggle`: Takım seçimi handler
- `handleSearch`: Arama input handler
- `handleComplete`: Tamamla butonu handler

### Render Fonksiyonları
- **Back Button:** Geri dön butonu (optional)
- **Search Bar:** Takım arama input'u
- **Team Grid:** Takım kartları grid'i (2 sütun)
- **Team Card:** Takım kartı (logo, isim, seçim toggle)
- **Complete Button:** Tamamla butonu (min 1 takım gerekli)

### Navigasyon
- Complete → `home` ekranına
- Back → `auth` ekranına

---

## 7. HOME SCREEN (DASHBOARD)

**Dosya:** `src/components/Dashboard.tsx`

### Props Interface
```typescript
interface DashboardProps {
  onNavigate: (screen: string, params?: any) => void;
  matchData: {
    pastMatches: any[];
    liveMatches: any[];
    upcomingMatches: any[];
    loading: boolean;
    error: string | null;
    hasLoadedOnce: boolean;
  };
}
```

### State'ler
- `selectedFocus`: Seçilen stratejik odak
- `selectedMatchId`: Seçilen maç ID'si
- `isPremium`: Premium kullanıcı durumu
- `selectedTeamId`: Seçilen favori takım ID'si
- `dropdownOpen`: Dropdown açık/kapalı
- `countdownTicker`: Geri sayım için ticker
- `focusSectionY`: Focus section Y pozisyonu
- `continueButtonY`: Continue button Y pozisyonu

### Ana Fonksiyonlar

#### `useEffect` - Premium Kontrolü
- AsyncStorage'dan kullanıcı bilgilerini çek
- Premium durumunu kontrol et
- `setIsPremium()` ile state'i güncelle

#### `useEffect` - Countdown Ticker
- Her saniye `countdownTicker`'ı artır
- Geri sayım güncellemelerini tetikler

#### `getTeamColors(teamName: string)`
- Takım ismine göre forma renkleri döndürür
- 15+ takım için özel renkler tanımlı

#### `getCountdown(matchTimestamp: number)`
- Maç başlangıcına kalan süreyi hesaplar
- 24 saat kala başlar
- Format: "Xs Xd Xsn" (saat, dakika, saniye)

#### `handleMatchSelect(matchId: string | number)`
- Maç seçimi handler
- Aynı maç tekrar seçilirse seçimi kaldır
- Focus section'a scroll yap
- Haptic feedback (mobile)

#### `handleFocusSelect(focusId: string)`
- Stratejik odak seçimi handler
- Aynı focus tekrar seçilirse seçimi kaldır
- Continue button'a scroll yap
- Haptic feedback (mobile)

#### `handleContinueToMatch()`
- Match detail ekranına geçiş
- Seçilen maç ve focus bilgilerini gönder

### Handler Fonksiyonlar
- `handleMatchSelect`: Maç seçimi handler
- `handleFocusSelect`: Focus seçimi handler
- `handleContinueToMatch`: Devam et butonu handler
- `handleTeamSelect`: Takım seçimi handler (dropdown)
- `getAnalystAdvice`: Analist tavsiyesi getir

### Render Fonksiyonları
- **Favorite Teams Dropdown:** Pro kullanıcılar için takım filtresi
- **Upcoming Matches Section:** Yaklaşan maçlar (horizontal scroll)
- **Focus Section:** Stratejik odak seçimi (grid, 2 sütun)
- **Continue Button:** Devam et butonu (maç seçildiyse)
- **Badges Section:** Kazanılan rozetler
- **Past Matches Section:** Geçmiş maçlar (horizontal scroll)

### Navigasyon
- Match select → `match-detail` ekranına
- Past match → `match-result-summary` ekranına
- Profile → `profile` ekranına

---

## 8. MATCH LIST SCREEN

**Dosya:** `src/screens/MatchListScreen.tsx`

### Props Interface
```typescript
interface MatchListScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
  matchData: {
    pastMatches: any[];
    liveMatches: any[];
    upcomingMatches: any[];
    loading: boolean;
    error: string | null;
  };
}
```

### State'ler
- `selectedFilter`: Seçilen filtre ('all' | 'upcoming' | 'live' | 'finished')
- `selectedLeague`: Seçilen lig filtresi
- `searchQuery`: Arama sorgusu

### Ana Fonksiyonlar

#### `getFilteredMatches()`
- Seçilen filtreye göre maçları filtrele
- Lig filtresine göre filtrele
- Arama sorgusuna göre filtrele
- Filtrelenmiş maçları döndür

#### `handleMatchPress(matchId: string)`
- Maç kartına tıklandığında çağrılır
- `onNavigate('match-detail', { id: matchId })` çağrısı

### Handler Fonksiyonlar
- `handleFilterChange`: Filtre değişimi handler
- `handleLeagueChange`: Lig filtresi handler
- `handleSearch`: Arama input handler
- `handleMatchPress`: Maç kartı press handler

### Render Fonksiyonları
- **Header:** Başlık ve geri butonu
- **Filter Tabs:** Filtre sekmeleri (Tümü, Yaklaşan, Canlı, Biten)
- **League Filter:** Lig filtresi dropdown
- **Search Bar:** Maç arama input'u
- **Match List:** Maç kartları listesi
- **Empty State:** Maç yoksa boş durum mesajı

### Navigasyon
- Match press → `match-detail` ekranına
- Back → `home` ekranına

---

## 9. MATCH DETAIL

**Dosya:** `src/components/MatchDetail.tsx`

### Props Interface
```typescript
interface MatchDetailProps {
  matchId: string;
  initialTab?: 'squad' | 'tactics' | 'stats' | 'predictions';
  onBack: () => void;
}
```

### State'ler
- `activeTab`: Aktif sekme
- `matchData`: Maç verileri
- `loading`: Maç verileri yükleniyor
- `squadData`: Kadro verileri
- `tacticsData`: Taktik verileri
- `statsData`: İstatistik verileri

### Ana Fonksiyonlar

#### `useEffect` - Maç Verilerini Yükle
- API'den maç detaylarını çek
- Kadro, taktik, istatistik verilerini yükle
- State'e set et

#### `handleTabChange(tab: string)`
- Sekme değişimi handler
- İlgili verileri yükle

### Handler Fonksiyonlar
- `handleTabChange`: Sekme değişimi handler
- `handlePredict`: Tahmin yap handler
- `handleSavePrediction`: Tahmini kaydet handler

### Render Fonksiyonları
- **Header:** Maç bilgileri ve geri butonu
- **Tab Navigation:** Sekmeler (Kadro, Taktik, İstatistik, Tahminler)
- **Squad Tab:** Kadro görünümü
- **Tactics Tab:** Taktik görünümü
- **Stats Tab:** İstatistik görünümü
- **Predictions Tab:** Tahmin görünümü

### Navigasyon
- Back → `home` ekranına

---

## 10. MATCH RESULT SUMMARY SCREEN

**Dosya:** `src/screens/MatchResultSummaryScreen.tsx`

### Props Interface
```typescript
interface MatchResultSummaryScreenProps {
  matchData: { id: string };
  onBack: () => void;
}
```

### State'ler
- `matchData`: Maç verileri
- `loading`: Maç verileri yükleniyor
- `userPrediction`: Kullanıcının tahmini
- `pointsEarned`: Kazanılan puanlar

### Ana Fonksiyonlar

#### `useEffect` - Maç Verilerini Yükle
- API'den maç sonuçlarını çek
- Kullanıcının tahminini çek
- Puan hesaplaması yap
- State'e set et

### Handler Fonksiyonlar
- Yok (sadece görüntüleme ekranı)

### Render Fonksiyonları
- **Match Header:** Maç bilgileri (takımlar, skor, tarih)
- **Result Card:** Maç sonucu kartı
- **User Prediction Card:** Kullanıcının tahmini
- **Points Card:** Kazanılan puanlar
- **Stats Summary:** Maç istatistikleri özeti

### Navigasyon
- Back → `matches` veya `home` ekranına

---

## 11. PROFILE SCREEN

**Dosya:** `src/screens/ProfileScreen.tsx`

### Props Interface
```typescript
interface ProfileScreenProps {
  onBack: () => void;
  onSettings: () => void;
  onProUpgrade: () => void;
  onDatabaseTest?: () => void;
  onTeamSelect: () => void;
  activeTab?: 'overview' | 'badges' | 'stats';
}
```

### State'ler
- `activeTab`: Aktif sekme
- `user`: Kullanıcı bilgileri
- `badges`: Rozetler listesi
- `earnedBadges`: Kazanılan rozetler
- `badgeCount`: Toplam rozet sayısı
- `loading`: Veriler yükleniyor
- `favoriteTeams`: Favori takımlar

### Ana Fonksiyonlar

#### `useEffect` - Kullanıcı Verilerini Yükle
- AsyncStorage'dan kullanıcı bilgilerini çek
- Supabase'den kullanıcı profilini çek
- Rozetleri yükle
- Favori takımları yükle
- State'e set et

#### `loadBadges()`
- Tüm rozetleri yükle
- Kazanılan rozetleri filtrele
- Rozet sayısını hesapla

### Handler Fonksiyonlar
- `handleTabChange`: Sekme değişimi handler
- `handleSettings`: Ayarlar butonu handler
- `handleProUpgrade`: Pro yükseltme handler
- `handleTeamSelect`: Takım seçimi handler

### Render Fonksiyonları
- **Profile Header:** Kullanıcı bilgileri kartı
- **Tab Navigation:** Sekmeler (Genel Bakış, Rozetler, İstatistikler)
- **Overview Tab:** Genel bakış (performans, en iyi küme)
- **Badges Tab:** Rozetler grid'i
- **Stats Tab:** İstatistikler (puanlar, doğruluk, seri)

### Navigasyon
- Settings → `profile-settings` ekranına
- Pro Upgrade → `pro-upgrade` ekranına
- Team Select → `favorite-teams` ekranına
- Back → `home` ekranına

---

## 12. PROFILE SETTINGS SCREEN

**Dosya:** `src/screens/ProfileSettingsScreen.tsx`

### Props Interface
```typescript
interface ProfileSettingsScreenProps {
  onBack: () => void;
  onNavigateToFavoriteTeams: () => void;
  onNavigateToLanguage: () => void;
  onLogout: () => void;
  onNavigateToChangePassword: () => void;
  onNavigateToNotifications: () => void;
  onNavigateToDeleteAccount: () => void;
  onNavigateToProUpgrade: () => void;
}
```

### State'ler
- `user`: Kullanıcı bilgileri
- `theme`: Tema ayarı ('dark' | 'light' | 'system')
- `loading`: Ayarlar yükleniyor

### Ana Fonksiyonlar

#### `useEffect` - Kullanıcı Ayarlarını Yükle
- AsyncStorage'dan kullanıcı bilgilerini çek
- Tema ayarını yükle
- State'e set et

#### `handleThemeChange(theme: Theme)`
- Tema değişimi handler
- AsyncStorage'a kaydet
- ThemeContext'i güncelle

#### `handleLogout()`
- Çıkış yap handler
- AsyncStorage'ı temizle
- `onLogout()` callback çağırma

### Handler Fonksiyonlar
- `handleThemeChange`: Tema değişimi handler
- `handleLogout`: Çıkış yap handler
- `handleNavigateToX`: Navigasyon handler'ları

### Render Fonksiyonları
- **Basic Info Card:** Temel bilgiler (isim, kullanıcı adı, email)
- **Favorite Teams Card:** Favori takımlar ayarı
- **PRO Membership Card:** Pro üyelik kartı
- **Language Card:** Dil ayarı
- **Theme Card:** Tema ayarı
- **Account Card:** Hesap ayarları (şifre, bildirimler, hesap silme)

### Navigasyon
- Favorite Teams → `favorite-teams` ekranına
- Language → `language` ekranına
- Change Password → `change-password` ekranına
- Notifications → `notifications` ekranına
- Delete Account → `delete-account` ekranına
- Pro Upgrade → `pro-upgrade` ekranına
- Logout → `splash` ekranına
- Back → `profile` ekranına

---

## 13. CHANGE PASSWORD SCREEN

**Dosya:** `src/screens/ChangePasswordScreen.tsx`

### Props Interface
```typescript
interface ChangePasswordScreenProps {
  onBack: () => void;
}
```

### State'ler
- `currentPassword`: Mevcut şifre input
- `newPassword`: Yeni şifre input
- `confirmPassword`: Şifre tekrar input
- `showCurrentPassword`: Mevcut şifre görünürlüğü
- `showNewPassword`: Yeni şifre görünürlüğü
- `showConfirmPassword`: Şifre tekrar görünürlüğü
- `loading`: Şifre değiştirme işlemi loading
- `userEmail`: Kullanıcı email'i (AsyncStorage'dan)

### Ana Fonksiyonlar

#### `useEffect` - Kullanıcı Email'ini Yükle
- AsyncStorage'dan kullanıcı email'ini çek
- `setUserEmail()` ile state'e set et

#### `handleSubmit()`
- Tüm alanların validasyonu
- Şifre uzunluk kontrolü (min 6 karakter)
- Şifre eşleşme kontrolü
- `authApi.changePassword()` çağrısı
- Başarılı → Alert göster ve geri dön
- Hata → Alert göster

### Handler Fonksiyonlar
- `handleSubmit`: Şifre değiştir butonu handler
- `setShowCurrentPassword`: Mevcut şifre görünürlüğü toggle
- `setShowNewPassword`: Yeni şifre görünürlüğü toggle
- `setShowConfirmPassword`: Şifre tekrar görünürlüğü toggle

### Render Fonksiyonları
- **Current Password Card:** Mevcut şifre input kartı
- **New Password Card:** Yeni şifre input kartı
  - Şifre güçlülük göstergesi
  - Şifre tekrar input'u
  - Şifre gereksinimleri listesi
- **Submit Button:** Şifreyi değiştir butonu (loading state ile)
- **Security Tips:** Güvenlik ipuçları kartı

### Navigasyon
- Success → `profile-settings` ekranına
- Back → `profile-settings` ekranına

---

## 14. NOTIFICATIONS SCREEN

**Dosya:** `src/screens/NotificationsScreen.tsx`

### Props Interface
```typescript
interface NotificationsScreenProps {
  onBack: () => void;
}
```

### State'ler
- `notifications`: Bildirimler listesi
- `loading`: Bildirimler yükleniyor
- `settings`: Bildirim ayarları

### Ana Fonksiyonlar

#### `useEffect` - Bildirimleri Yükle
- API'den bildirimleri çek
- Bildirim ayarlarını yükle
- State'e set et

#### `handleNotificationToggle(setting: string)`
- Bildirim ayarı toggle handler
- AsyncStorage'a kaydet
- API'ye gönder

### Handler Fonksiyonlar
- `handleNotificationToggle`: Bildirim ayarı toggle handler
- `handleMarkAsRead`: Bildirimi okundu olarak işaretle handler

### Render Fonksiyonları
- **Header:** Başlık ve geri butonu
- **Settings Card:** Bildirim ayarları kartı
  - Maç uyarıları toggle
  - Tahmin hatırlatıcıları toggle
  - Haberler toggle
  - Rozet bildirimleri toggle
- **Notifications List:** Bildirimler listesi

### Navigasyon
- Back → `profile-settings` ekranına

---

## 15. DELETE ACCOUNT SCREEN

**Dosya:** `src/screens/DeleteAccountScreen.tsx`

### Props Interface
```typescript
interface DeleteAccountScreenProps {
  onBack: () => void;
  onDeleteConfirm: () => void;
}
```

### State'ler
- `confirmText`: Onay metni input
- `loading`: Hesap silme işlemi loading
- `step`: Adım ('warning' | 'confirm')

### Ana Fonksiyonlar

#### `handleDeleteAccount()`
- Onay metni kontrolü
- `authService.deleteAccount()` çağrısı
- AsyncStorage'ı temizle
- `onDeleteConfirm()` callback çağırma

### Handler Fonksiyonlar
- `handleDeleteAccount`: Hesap sil butonu handler
- `handleConfirmTextChange`: Onay metni input handler

### Render Fonksiyonları
- **Warning Card:** Uyarı kartı
- **Confirm Input:** Onay metni input'u
- **Delete Button:** Hesabı sil butonu (kırmızı, tehlikeli)

### Navigasyon
- Delete Success → `splash` ekranına
- Back → `profile-settings` ekranına

---

## 16. PRO UPGRADE SCREEN

**Dosya:** `src/screens/ProUpgradeScreen.tsx`

### Props Interface
```typescript
interface ProUpgradeScreenProps {
  onBack: () => void;
  onUpgradeSuccess?: () => void;
}
```

### State'ler
- `selectedPlan`: Seçilen plan ('monthly' | 'yearly')
- `loading`: Yükseltme işlemi loading
- `plans`: Plan fiyatları

### Ana Fonksiyonlar

#### `handleUpgrade()`
- Seçilen planı kontrol et
- `iapService.purchase()` çağrısı
- Başarılı → AsyncStorage'a kaydet
- `onUpgradeSuccess()` callback

### Handler Fonksiyonlar
- `handlePlanSelect`: Plan seçimi handler
- `handleUpgrade`: Yükselt butonu handler

### Render Fonksiyonları
- **Header:** Başlık ve geri butonu
- **Pro Features Card:** Pro özellikleri listesi
- **Plan Selection:** Plan seçimi (Aylık/Yıllık)
- **Upgrade Button:** Yükselt butonu

### Navigasyon
- Upgrade Success → `profile` ekranına
- Back → `profile-settings` veya `profile` ekranına

---

## 17. LEGAL DOCUMENTS SCREEN

**Dosya:** `src/screens/LegalDocumentsScreen.tsx`

### Props Interface
```typescript
interface LegalDocumentsScreenProps {
  onBack: () => void;
  onNavigateToDocument: (documentId: string, title: string) => void;
}
```

### State'ler
- Yok (sadece görüntüleme)

### Ana Fonksiyonlar
- Yok (sadece navigasyon)

### Handler Fonksiyonlar
- `handleDocumentPress`: Döküman kartı press handler

### Render Fonksiyonları
- **Header:** Başlık ve geri butonu
- **Document Cards:** Yasal döküman kartları
  - Kullanım Şartları
  - Gizlilik Politikası
  - Çerez Politikası
  - Feragatname

### Navigasyon
- Document press → `legal-document` ekranına
- Back → `profile-settings` ekranına

---

## 18. LEGAL DOCUMENT SCREEN

**Dosya:** `src/screens/LegalDocumentScreen.tsx`

### Props Interface
```typescript
interface LegalDocumentScreenProps {
  documentId: string;
  title: string;
  onBack: () => void;
}
```

### State'ler
- `content`: Döküman içeriği
- `loading`: Döküman yükleniyor

### Ana Fonksiyonlar

#### `useEffect` - Döküman İçeriğini Yükle
- Döküman ID'sine göre içeriği yükle
- State'e set et

### Handler Fonksiyonlar
- Yok (sadece görüntüleme)

### Render Fonksiyonları
- **Header:** Başlık ve geri butonu
- **Content:** Döküman içeriği (ScrollView)

### Navigasyon
- Back → `legal` ekranına

---

## 19. LEADERBOARD

**Dosya:** `src/components/Leaderboard.tsx`

### Props Interface
```typescript
interface LeaderboardProps {
  onNavigate: (screen: string, params?: any) => void;
}
```

### State'ler
- `leaderboard`: Liderlik tablosu verileri
- `loading`: Liderlik tablosu yükleniyor
- `filter`: Filtre ('all' | 'weekly' | 'monthly')

### Ana Fonksiyonlar

#### `useEffect` - Liderlik Tablosunu Yükle
- API'den liderlik tablosunu çek
- Filtreye göre sırala
- State'e set et

### Handler Fonksiyonlar
- `handleFilterChange`: Filtre değişimi handler
- `handleUserPress`: Kullanıcı kartı press handler

### Render Fonksiyonları
- **Header:** Başlık
- **Filter Tabs:** Filtre sekmeleri
- **Leaderboard List:** Liderlik tablosu listesi
  - Sıralama (1, 2, 3...)
  - Kullanıcı avatar ve ismi
  - Toplam puan
  - Doğruluk yüzdesi

### Navigasyon
- User press → `profile` ekranına

---

## 20. DATABASE TEST SCREEN

**Dosya:** `src/screens/DatabaseTestScreen.tsx`

### Props Interface
```typescript
interface DatabaseTestScreenProps {
  onBack: () => void;
}
```

### State'ler
- `testResults`: Test sonuçları
- `loading`: Test çalışıyor

### Ana Fonksiyonlar

#### `handleRunTests()`
- Tüm database testlerini çalıştır
- Sonuçları state'e set et

### Handler Fonksiyonlar
- `handleRunTests`: Test çalıştır butonu handler

### Render Fonksiyonları
- **Header:** Başlık ve geri butonu
- **Test Results:** Test sonuçları listesi
- **Run Tests Button:** Test çalıştır butonu

### Navigasyon
- Back → `profile` ekranına

---

## 📊 EKRAN AKIŞ ŞEMASI

```
Splash Screen
    ↓ (hasUser: false)
Language Selection Screen
    ↓ (language selected)
Auth Screen
    ↓ (login success)
Favorite Teams Screen
    ↓ (teams selected)
Home Screen (Dashboard)
    ├─→ Match List Screen
    ├─→ Match Detail
    ├─→ Match Result Summary
    ├─→ Profile Screen
    │   ├─→ Profile Settings Screen
    │   │   ├─→ Change Password Screen
    │   │   ├─→ Notifications Screen
    │   │   ├─→ Delete Account Screen
    │   │   ├─→ Pro Upgrade Screen
    │   │   ├─→ Legal Documents Screen
    │   │   │   └─→ Legal Document Screen
    │   │   └─→ Favorite Teams Screen
    │   └─→ Pro Upgrade Screen
    ├─→ Leaderboard
    └─→ Database Test Screen (DEV only)
```

---

## 🔑 ÖNEMLİ NOTLAR

1. **Navigation Flow:** Tüm ekranlar `App.tsx` içindeki `renderScreen()` fonksiyonunda yönetiliyor
2. **State Management:** AsyncStorage kullanılıyor (kullanıcı session, ayarlar, favori takımlar)
3. **API Integration:** `src/services/api.ts` üzerinden backend API'ye bağlanılıyor
4. **Authentication:** Mock auth service kullanılıyor (production'da Supabase'e geçilecek)
5. **i18n Support:** 8 dil desteği var (TR, EN, ES, DE, FR, IT, AR, RU)
6. **Platform Support:** Web ve Native platform desteği var

---

**Son Güncelleme:** 14 Ocak 2026
