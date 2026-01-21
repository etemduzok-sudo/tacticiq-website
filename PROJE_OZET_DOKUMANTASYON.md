# ⚽ TacticIQ - Proje Yapısı ve İçerik Özeti
## Tüm Yapılar, Klasörler ve İçeriklerin Kapsamlı Dokümantasyonu

**Tarih:** 5 Ocak 2026  
**Versiyon:** 1.0.0  
**Durum:** Aktif Geliştirme

---

## 📋 İÇİNDEKİLER

1. [Proje Genel Bakış](#1-proje-genel-bakış)
2. [Ana Klasör Yapısı](#2-ana-klasör-yapısı)
3. [Frontend Yapısı (React Native)](#3-frontend-yapısı-react-native)
4. [Backend Yapısı (Node.js)](#4-backend-yapısı-nodejs)
5. [Static Website](#5-static-website)
6. [Database ve Servisler](#6-database-ve-servisler)
7. [Dokümantasyon Dosyaları](#7-dokümantasyon-dosyaları)
8. [Konfigürasyon Dosyaları](#8-konfigürasyon-dosyaları)
9. [Test ve E2E](#9-test-ve-e2e)
10. [Build ve Deployment](#10-build-ve-deployment)

---

## 1. PROJE GENEL BAKIŞ

### 🎯 Proje Adı: **TacticIQ**

**Tip:** React Native + Expo Mobil Uygulama + Backend API + Static Website

**Amaç:** Skill-based (beceri tabanlı) futbol tahmin ve analiz uygulaması

**Özellikler:**
- ⚽ Maç tahminleri (skor, kartlar, istatistikler)
- 👥 Oyuncu bazlı tahminler (ilk 11)
- 🎯 Stratejik odak sistemi (3 tahmine odaklanma)
- 💪 Antrenman çarpanları (puan çarpanları)
- 📊 Canlı maç takibi
- 🏆 Liderlik tablosu
- 🏅 Rozet sistemi
- ⭐ Pro üyelik sistemi

### 🛠️ Teknoloji Stack

**Frontend:**
- React Native 0.81.5
- Expo SDK 54
- TypeScript
- React Navigation 7.x
- React Query (@tanstack/react-query)
- i18next (çoklu dil desteği)

**Backend:**
- Node.js
- Express.js
- Supabase (Database)
- API-Football (Futbol verileri)
- Firebase (Analytics, Auth)

**Static Website:**
- HTML5
- Netlify Deployment

---

## 2. ANA KLASÖR YAPISI

```
TacticIQ/
├── 📱 src/                    # Frontend kaynak kodları
├── 🔧 backend/                # Backend API servisleri
├── 🌐 tacticiq-website/       # Static website
├── 📱 android/                # Android native projesi
├── 📱 web/                    # Web build dosyaları
├── 📚 docs/                   # Dokümantasyon klasörü
├── 🗄️ supabase/               # Supabase şemaları
├── 🧪 e2e/                    # E2E test dosyaları
├── 📦 assets/                 # Genel asset'ler (logo, vb.)
├── 📸 screenshots/            # Ekran görüntüleri
├── 📄 *.md                    # Dokümantasyon dosyaları (87 adet)
└── ⚙️ Config dosyaları        # package.json, app.json, vb.
```

---

## 3. FRONTEND YAPISI (React Native)

### 📁 src/ Klasör Yapısı

#### **src/screens/** - Ekranlar (27 dosya)

**Auth & Onboarding:**
- `SplashScreen.tsx` - Splash ekranı (3 saniye)
- `LanguageSelectionScreen.tsx` - Dil seçimi (TR/EN)
- `AuthScreen.tsx` - Giriş/Kayıt ekranı
- `RegisterScreen.tsx` - Kayıt ekranı
- `ForgotPasswordScreen.tsx` - Şifre sıfırlama
- `FavoriteTeamsScreen.tsx` - Favori takım seçimi

**Ana Ekranlar:**
- `HomeScreen.tsx` - Ana sayfa (Dashboard)
- `MatchesScreen.tsx` - Maç listesi
- `MatchListScreen.tsx` - Gelişmiş maç listesi
- `EnhancedMatchListScreen.tsx` - Gelişmiş maç listesi
- `PredictionsScreen.tsx` - Tahminler ekranı

**Maç Detayları:**
- `MatchResultSummaryScreen.tsx` - Maç sonuç özeti
- `MatchSummaryModal.tsx` - Maç özet modalı

**Profil & Ayarlar:**
- `ProfileScreen.tsx` - Profil ekranı
- `ProfileSettingsScreen.tsx` - Profil ayarları
- `ChangePasswordScreen.tsx` - Şifre değiştirme
- `DeleteAccountScreen.tsx` - Hesap silme
- `NotificationsScreen.tsx` - Bildirimler

**Pro Üyelik:**
- `ProUpgradeScreen.tsx` - Pro üyelik ekranı
- `UpgradeToProScreen.tsx` - Pro yükseltme
- `PaymentOptionsModal.tsx` - Ödeme seçenekleri
- `PaymentSuccessModal.tsx` - Ödeme başarılı
- `PaymentFailedModal.tsx` - Ödeme başarısız

**Yasal:**
- `LegalDocumentsScreen.tsx` - Yasal belgeler listesi
- `LegalDocumentScreen.tsx` - Yasal belge detayı

**Test & Debug:**
- `DatabaseTestScreen.tsx` - Database test ekranı
- `TestScreen.tsx` - Test ekranı

**Tabs:**
- `tabs/` - Tab navigasyon ekranları

#### **src/components/** - Bileşenler

**Atoms (Temel Bileşenler):**
- `Button.tsx` - Buton bileşeni
- `Input.tsx` - Input bileşeni
- `Card.tsx` - Kart bileşeni
- `Avatar.tsx` - Avatar bileşeni
- `Badge.tsx` - Badge bileşeni
- `Skeleton.tsx` - Loading skeleton

**Molecules (Birleşik Bileşenler):**
- `MatchCard.tsx` - Maç kartı
- `PlayerCard.tsx` - Oyuncu kartı
- `ProfileCard.tsx` - Profil kartı

**Organisms (Karmaşık Bileşenler):**
- `Header.tsx` - Header bileşeni
- `BottomNavigation.tsx` - Alt navigasyon
- `Dashboard.tsx` - Dashboard bileşeni
- `Leaderboard.tsx` - Liderlik tablosu

**Match Components (Maç Bileşenleri):**
- `MatchDetail.tsx` - Maç detay ana bileşen
- `match/MatchSquad.tsx` - Kadro sekmesi
- `match/MatchPrediction.tsx` - Tahmin sekmesi ⭐ EN ÖNEMLİ
- `match/MatchLive.tsx` - Canlı sekmesi
- `match/MatchStats.tsx` - İstatistik sekmesi
- `match/MatchRatings.tsx` - Reyting sekmesi
- `match/MatchSummary.tsx` - Özet sekmesi

**Diğer Bileşenler:**
- `ErrorBoundary.tsx` - Hata yakalama
- `MaintenanceScreen.tsx` - Bakım ekranı
- `PremiumBadge.tsx` - Pro badge
- `SafeIcon.tsx` - Güvenli ikon wrapper
- `ScoreBreakdown.tsx` - Puan dağılımı
- `ads/AdBanner.tsx` - Reklam banner
- `ads/AdInterstitial.tsx` - Interstitial reklam
- `flags/` - Bayrak bileşenleri (7 dosya)
- `layouts/ScreenLayout.tsx` - Ekran layout'u

#### **src/services/** - Servisler (14 dosya)

**API Servisleri:**
- `api.ts` - Ana API servisi (API-Football entegrasyonu)
- `authService.ts` - Kimlik doğrulama servisi
- `databaseService.ts` - Database servisi (Supabase)
- `mockDataService.ts` - Mock data servisi
- `mockAuthService.ts` - Mock auth servisi

**Özellik Servisleri:**
- `badgeService.ts` - Rozet servisi
- `predictionScoringService.ts` - Tahmin puanlama servisi
- `socialAuthService.ts` - Sosyal giriş (Google, Apple)
- `iapService.ts` - In-App Purchase servisi
- `iapService.web.ts` - Web IAP servisi

**Analytics & Performance:**
- `analyticsService.ts` - Firebase Analytics
- `performanceService.ts` - Performance monitoring
- `featureFlagService.ts` - Feature flags
- `timeService.ts` - Zaman servisleri

#### **src/hooks/** - Custom Hooks

- `useMatches.ts` - Maç verileri hook'u
- `useFavoriteTeams.ts` - Favori takımlar hook'u
- `useFavoriteTeamMatches.ts` - Favori takım maçları
- `useFormState.ts` - Form state yönetimi
- `useTranslation.ts` - Çeviri hook'u
- `queries/useMatchesQuery.ts` - React Query hook'ları

#### **src/contexts/** - React Contexts

- `ThemeContext.tsx` - Tema yönetimi (Dark/Light)
- `PredictionContext.tsx` - Tahmin state yönetimi
- `MatchContext.tsx` - Maç state yönetimi

#### **src/navigation/** - Navigasyon

- `AppNavigator.tsx` - Ana navigasyon yapılandırması

#### **src/theme/** - Tema Sistemi

- `theme.ts` - Tema sabitleri (COLORS, SPACING, TYPOGRAPHY)
- `gradients.ts` - Gradient tanımları

#### **src/types/** - TypeScript Tipleri

- `user.types.ts` - Kullanıcı tipleri
- `match.types.ts` - Maç tipleri
- `prediction.types.ts` - Tahmin tipleri
- `badges.types.ts` - Rozet tipleri
- `game.types.ts` - Oyun tipleri
- `index.ts` - Tip export'ları

#### **src/utils/** - Yardımcı Fonksiyonlar

- `logger.ts` - Logging utility
- `styleHelpers.ts` - Style helper fonksiyonları
- `validation.ts` - Validasyon fonksiyonları
- `formatters.ts` - Format fonksiyonları
- `storage.ts` - Storage utility
- `errors.ts` - Hata yönetimi

#### **src/config/** - Konfigürasyon

- `constants.ts` - Uygulama sabitleri
- `firebase.ts` - Firebase konfigürasyonu
- `supabase.ts` - Supabase konfigürasyonu
- `AppVersion.ts` - Versiyon bilgileri

#### **src/constants/** - Sabitler

- `badges.ts` - Rozet sabitleri
- `gameRules.ts` - Oyun kuralları
- `languages.ts` - Dil sabitleri
- `userLimits.ts` - Kullanıcı limitleri

#### **src/locales/** - Çeviri Dosyaları

- `tr.json` - Türkçe
- `en.json` - İngilizce
- `ar.json` - Arapça
- `de.json` - Almanca
- `es.json` - İspanyolca
- `fr.json` - Fransızca
- `it.json` - İtalyanca
- `ru.json` - Rusça

#### **src/logic/** - İş Mantığı

- `ScoringEngine.ts` - Puan hesaplama motoru

#### **src/providers/** - Provider'lar

- `QueryProvider.tsx` - React Query provider

#### **src/i18n/** - Çoklu Dil

- `index.ts` - i18n konfigürasyonu

---

## 4. BACKEND YAPISI (Node.js)

### 📁 backend/ Klasör Yapısı

#### **backend/server.js** - Ana Server
- Express.js server
- Middleware yapılandırması
- Route tanımlamaları

#### **backend/routes/** - API Route'ları (9 dosya)

- `auth.js` - Kimlik doğrulama route'ları
- `matches.js` - Maç route'ları
- `matches.enhanced.js` - Gelişmiş maç route'ları
- `teams.js` - Takım route'ları
- `players.js` - Oyuncu route'ları
- `predictions.js` - Tahmin route'ları
- `scoring.js` - Puanlama route'ları
- `leagues.js` - Lig route'ları
- `email.js` - Email route'ları

#### **backend/services/** - Servisler (11 dosya)

**API Servisleri:**
- `footballApi.js` - API-Football entegrasyonu
- `databaseService.js` - Database servisi
- `liveMatchService.js` - Canlı maç servisi
- `realtimeService.js` - Real-time servisi

**Sync & Cache:**
- `smartSyncService.js` - Akıllı senkronizasyon
- `aggressiveCacheService.js` - Agresif cache
- `dailySyncService.js` - Günlük senkronizasyon

**Diğer Servisler:**
- `scoringService.js` - Puanlama servisi
- `emailService.js` - Email servisi
- `emailForwardingService.js` - Email yönlendirme
- `monitoringService.js` - Monitoring servisi

#### **backend/middleware/** - Middleware'ler

- `auth.js` - Kimlik doğrulama middleware
- `logger.js` - Logging middleware
- `rateLimiter.js` - Rate limiting
- `security.js` - Güvenlik middleware

#### **backend/config/** - Konfigürasyon

- `database.js` - Database konfigürasyonu
- `supabase.js` - Supabase konfigürasyonu

#### **backend/ Test & Utility Dosyaları**

- `test-api.js` - API test scripti
- `test-backend.ps1` - PowerShell test scripti
- `test-api.http` - HTTP test dosyası
- `find-turkey-*.js` - Takım bulma scriptleri (6 dosya)
- `check-team-details.js` - Takım detay kontrolü

#### **backend/ Deployment Dosyaları**

- `ecosystem.config.js` - PM2 konfigürasyonu
- `start-backend.bat` - Backend başlatma scripti
- `start-with-monitoring.bat` - Monitoring ile başlatma
- `env.template` - Environment variable şablonu

---

## 5. STATIC WEBSITE

### 📁 tacticiq-website/ Klasör Yapısı

```
tacticiq-website/
├── index.html              # Ana sayfa
├── assets/
│   └── logo.png           # Logo dosyası
└── legal/
    └── disclaimer.html    # Yasal uyarı sayfası
```

**Özellikler:**
- Minimal HTML5 static site
- Netlify deployment
- Logo referansı: `/assets/logo.png`
- Legal sayfalar: `/legal/disclaimer.html`

**Netlify Konfigürasyonu:**
- `netlify.toml` - Netlify yapılandırması
- Publish directory: `.` (root)

---

## 6. DATABASE VE SERVİSLER

### 🗄️ Supabase Schema

**supabase/** klasöründe:
- Database şema dosyaları
- Migration scriptleri
- Table tanımları

**Ana Tablolar:**
- `users` - Kullanıcılar
- `predictions` - Tahminler
- `match_results` - Maç sonuçları
- `badges` - Rozetler
- `leaderboard` - Liderlik tablosu

### 🔥 Firebase Entegrasyonu

**Özellikler:**
- Firebase Analytics
- Firebase Authentication
- Firebase Performance Monitoring
- Push Notifications (gelecekte)

**Dosyalar:**
- `google-services.json` - Android Firebase config
- `src/config/firebase.ts` - Firebase konfigürasyonu

---

## 7. DOKÜMANTASYON DOSYALARI

### 📚 Toplam: 87 Markdown Dosyası

#### **Ana Dokümantasyon:**
- `README.md` - Proje README
- `TACTICIQ_WEB_DESIGN_DOCUMENTATION.md` - Web tasarım dokümantasyonu (2,400+ satır)
- `DESIGN_SYSTEM.md` - Tasarım sistemi
- `SETUP_GUIDE.md` - Kurulum rehberi

#### **Feature Dokümantasyonları:**
- `ADVANCED_FEATURES.md` - Gelişmiş özellikler
- `BADGE_SYSTEM_COMPLETE.md` - Rozet sistemi
- `PREMIUM_FEATURES_COMPLETE.md` - Pro özellikler
- `GAME_FLOW_DESIGN.md` - Oyun akışı tasarımı
- `STRATEGIC_FOCUS_SYSTEM.md` - Stratejik odak sistemi

#### **Fix & Debug Dokümantasyonları:**
- `MATCH_DETAIL_FIX_COMPLETE.md` - Maç detay düzeltmeleri
- `LIVE_DATA_FIX_COMPLETE.md` - Canlı veri düzeltmeleri
- `PERFORMANCE_FIX_COMPLETE.md` - Performans düzeltmeleri
- `FLICKERING_FIX_COMPLETE.md` - Flickering düzeltmeleri
- `WEB_COMPATIBILITY_FIX.md` - Web uyumluluk düzeltmeleri
- Ve 30+ daha fix dokümantasyonu

#### **Backend Dokümantasyonları:**
- `backend/README.md` - Backend README
- `backend/API_STRATEGY_EXPLAINED.md` - API stratejisi
- `backend/FINAL_API_STRATEGY.md` - Final API stratejisi
- `backend/DEPLOYMENT_SUMMARY.md` - Deployment özeti
- `backend/MONITORING_SETUP.md` - Monitoring kurulumu

#### **Setup & Guide Dokümantasyonları:**
- `AUTH_TEST_GUIDE.md` - Auth test rehberi
- `IAP_SETUP.md` - In-App Purchase kurulumu
- `ADMOB_SETUP.md` - AdMob kurulumu
- `CACHE_CLEAR_INSTRUCTIONS.md` - Cache temizleme
- `FIREBASE_IOS_SETUP.md` - Firebase iOS kurulumu

#### **Analiz & Öneriler:**
- `UX_ANALYSIS_AND_RECOMMENDATIONS.md` - UX analizi
- `CURRENT_STATE_ANALYSIS.md` - Mevcut durum analizi
- `COST_OPTIMIZATION.md` - Maliyet optimizasyonu
- `PERFORMANCE_OPTIMIZATION.md` - Performans optimizasyonu

#### **docs/ Klasörü:**
- `docs/navigation-map.md` - Navigasyon haritası
- `docs/STRATEGIC_FOCUS_SYSTEM.md` - Stratejik odak sistemi
- `docs/reports/` - Rapor dosyaları (6 dosya)
- `docs/IOS_FIREBASE_SETUP.md` - iOS Firebase kurulumu
- `docs/SHA1_FINGERPRINT_GUIDE.md` - SHA-1 fingerprint rehberi

---

## 8. KONFİGÜRASYON DOSYALARI

### ⚙️ Root Level Config Dosyaları

**Package Management:**
- `package.json` - NPM dependencies ve scripts
- `package-lock.json` - Lock file

**Expo & React Native:**
- `app.json` - Expo konfigürasyonu
- `babel.config.js` - Babel konfigürasyonu
- `metro.config.js` - Metro bundler konfigürasyonu
- `react-native.config.js` - React Native konfigürasyonu

**TypeScript:**
- `tsconfig.json` - TypeScript konfigürasyonu

**Testing:**
- `jest.config.js` - Jest test konfigürasyonu
- `jest.setup.js` - Jest setup dosyası
- `.detoxrc.js` - Detox E2E test konfigürasyonu

**Build & Deployment:**
- `eas.json` - Expo Application Services konfigürasyonu
- `netlify.toml` - Netlify deployment konfigürasyonu

**Firebase:**
- `google-services.json` - Android Firebase config

**Entry Points:**
- `index.js` - React Native entry point
- `index.web.js` - Web entry point
- `App.tsx` - Ana uygulama component'i

---

## 9. TEST VE E2E

### 🧪 Test Yapısı

**Unit Tests:**
- `src/__tests__/components/MatchCard.test.tsx` - MatchCard testi
- `src/__tests__/hooks/useMatches.test.ts` - useMatches hook testi

**E2E Tests:**
- `e2e/` klasörü - Detox E2E test dosyaları

**Test Scripts:**
- `npm test` - Jest unit tests
- `npm run test:watch` - Watch mode
- `npm run test:coverage` - Coverage raporu
- `npm run detox:test:ios` - iOS E2E tests
- `npm run detox:test:android` - Android E2E tests

---

## 10. BUILD VE DEPLOYMENT

### 📱 Native Builds

**Android:**
- `android/` klasörü - Android native projesi
- `android/app/build.gradle` - Build konfigürasyonu
- `android/gradle.properties` - Gradle properties

**iOS:**
- iOS klasörü macOS'ta oluşturulur (Windows'ta yok)

### 🌐 Web Build

**Web Klasörü:**
- `web/` - Web build çıktıları
- `index.html` - Web entry point

### 🚀 Deployment

**Netlify (Static Website):**
- `netlify.toml` - Netlify konfigürasyonu
- Publish directory: `.` (root)
- Domain: tacticiq.app

**Backend Deployment:**
- PM2 ecosystem config
- Monitoring servisi
- Email bildirimleri

---

## 11. ASSETS VE MEDYA

### 📦 assets/ Klasörü

- `logo.png` - TacticIQ logosu
- `README.md` - Assets dokümantasyonu

### 📸 screenshots/ Klasörü

- Ekran görüntüleri klasörü
- `screenshots_clean/` - Temizlenmiş ekran görüntüleri

### 🎨 src/assets/ Klasörü

- `images/brand/` - Marka görselleri
- Brand dokümantasyonları

---

## 12. SCRIPTS VE UTILITIES

### 🔧 Batch Scripts (Windows)

- `start-dev.bat` - Development başlatma
- `quick-reload.bat` - Hızlı reload
- `nuclear-clean.bat` - Tam temizlik
- `clear-cache.bat` - Cache temizleme
- `backend/start-backend.bat` - Backend başlatma

### 🌐 HTML Debug Dosyaları

- `clear-browser-cache.html` - Browser cache temizleme
- `debug-favorite-teams.html` - Favori takımlar debug
- `debug-profile-teams.html` - Profil takımları debug
- `test-cache-clear.html` - Cache temizleme testi
- `test-social-auth.html` - Sosyal auth testi
- `fix-fenerbahce.html` - Fenerbahçe fix testi

---

## 13. ÖZEL KLASÖRLER

### 📱 android/
- Android native projesi
- Gradle build dosyaları
- AndroidManifest.xml
- Build konfigürasyonları

### 📱 web/
- Web build çıktıları
- Web-specific dosyalar

### 📚 docs/
- Dokümantasyon klasörü
- Setup rehberleri
- Raporlar
- Navigation map

### 🗄️ supabase/
- Supabase migration dosyaları
- Database şemaları
- SQL scriptleri

### 🧪 e2e/
- E2E test dosyaları
- Detox test senaryoları

### 📸 TACTICIQ EKRAN GÖRÜNTÜLERİ/
- Ekran görüntüleri referans klasörü
- Tasarım referansları

---

## 14. PROJE İSTATİSTİKLERİ

### 📊 Dosya İstatistikleri

**Toplam Dosya Sayıları:**
- TypeScript/TSX dosyaları: 100+
- JavaScript dosyaları: 50+
- Markdown dosyaları: 87
- HTML dosyaları: 10+
- Config dosyaları: 15+

**Kod Satırları (Tahmini):**
- Frontend: ~50,000+ satır
- Backend: ~10,000+ satır
- Dokümantasyon: ~30,000+ satır
- **Toplam: ~90,000+ satır**

### 🎯 Ekran Sayıları

- **Toplam Ekran:** 27 ekran
- **Ana Ekranlar:** 10
- **Modal Ekranlar:** 5
- **Tab Ekranları:** 6 sekme (Match Detail içinde)

### 🧩 Component Sayıları

- **Atoms:** 7+ bileşen
- **Molecules:** 3+ bileşen
- **Organisms:** 5+ bileşen
- **Match Components:** 6 bileşen
- **Toplam:** 20+ bileşen

### 🔌 API Endpoint'leri

- **Backend Routes:** 9 route dosyası
- **Toplam Endpoint:** 30+ endpoint

---

## 15. ÖNEMLİ ÖZELLİKLER VE SİSTEMLER

### ⭐ Core Features

1. **Tahmin Sistemi**
   - 14 farklı tahmin kategorisi
   - Oyuncu bazlı tahminler (7 kategori)
   - Stratejik odak sistemi (3 tahmin)
   - Antrenman çarpanları (5 tip)

2. **Maç Detay Sistemi**
   - 6 sekme: Kadro, Tahmin, Canlı, İstatistik, Reyting, Özet
   - 26 formasyon seçeneği
   - Canlı maç takibi
   - Detaylı istatistikler

3. **Puanlama Sistemi**
   - Baz puan sistemi
   - Antrenman çarpanları
   - Odak çarpanları (2x doğru, -1.5x yanlış)
   - Erken tahmin bonusları

4. **Rozet Sistemi**
   - 20+ farklı rozet
   - Otomatik rozet kazanma
   - Rozet popup'ları
   - Profil rozet gösterimi

5. **Liderlik Tablosu**
   - Global sıralama
   - Sezon bazlı sıralama
   - Haftalık/aylık filtreleme
   - Kullanıcı karşılaştırması

6. **Pro Üyelik**
   - In-App Purchase entegrasyonu
   - Özel özellikler
   - Reklamsız deneyim
   - Sınırsız favori takım

---

## 16. TEKNİK DETAYLAR

### 🔐 Authentication

- Email/Password
- Google Sign-In
- Apple Sign-In
- Supabase Auth
- Firebase Auth

### 📊 State Management

- React Context (Theme, Prediction, Match)
- React Query (Server state)
- AsyncStorage (Local storage)
- Custom Hooks

### 🌍 Internationalization

- 8 dil desteği
- i18next entegrasyonu
- Otomatik dil algılama
- Manuel dil seçimi

### 🎨 Theming

- Dark/Light mode
- Otomatik sistem teması
- Manuel tema değiştirme
- Tema persistence

### 📱 Platform Support

- iOS (native)
- Android (native)
- Web (React Native Web)

---

## 17. DEPENDENCIES ÖZETİ

### 📦 Ana Dependencies

**React & React Native:**
- react: 19.1.0
- react-native: 0.81.5
- react-dom: 19.1.0
- react-native-web: 0.21.0

**Expo:**
- expo: ~54.0.31
- expo-router: ~6.0.21
- expo-linear-gradient: ~15.0.8
- expo-font: ~14.0.10

**Navigation:**
- @react-navigation/native: ^7.0.14
- @react-navigation/bottom-tabs: ^7.2.0
- @react-navigation/native-stack: ^7.2.0

**State & Data:**
- @tanstack/react-query: ^5.90.16
- @supabase/supabase-js: ^2.90.0
- @react-native-async-storage/async-storage: 2.2.0

**Firebase:**
- @react-native-firebase/app: ^23.8.0
- @react-native-firebase/auth: ^23.8.0
- @react-native-firebase/analytics: ^23.8.0

**UI & Animations:**
- react-native-reanimated: ~4.1.1
- react-native-svg: 15.12.1
- @expo/vector-icons: ^15.0.3

**Internationalization:**
- i18next: ^25.7.4
- react-i18next: ^16.5.3

**Monetization:**
- react-native-iap: ^14.7.1

---

## 18. PROJE DURUMU

### ✅ Tamamlanan Özellikler

- ✅ Splash Screen & Dil Seçimi
- ✅ Kayıt/Giriş Sistemi (Email, Google, Apple)
- ✅ Favori Takım Seçimi
- ✅ Maç Listesi & Detayları
- ✅ Canlı Maç Takibi
- ✅ Tahmin Sistemi (14 kategori)
- ✅ Oyuncu Tahminleri (7 kategori)
- ✅ Stratejik Odak Sistemi
- ✅ Antrenman Çarpanları
- ✅ Profil Yönetimi
- ✅ Dark/Light Mode
- ✅ Pro Üyelik Sistemi
- ✅ Liderlik Tablosu
- ✅ Rozet Sistemi
- ✅ Backend API
- ✅ Static Website

### 🔄 Geliştirme Aşamasında

- 🔄 Push Notifications
- 🔄 Sosyal Özellikler (Arkadaşlar)
- 🔄 AI Tahmin Önerileri
- 🔄 Gelişmiş Analytics

---

## 19. ÖNEMLİ NOTLAR

### 🚨 Kritik Dosyalar

1. **App.tsx** - Ana uygulama entry point
2. **src/components/match/MatchPrediction.tsx** - En önemli component (tahmin sistemi)
3. **src/components/match/MatchSummary.tsx** - Maç özeti (detaylı analiz)
4. **backend/server.js** - Backend API server
5. **netlify.toml** - Static website deployment

### 📝 Önemli Dokümantasyonlar

1. **TACTICIQ_WEB_DESIGN_DOCUMENTATION.md** - Web tasarım için kapsamlı dokümantasyon (2,400+ satır)
2. **DESIGN_SYSTEM.md** - Tasarım sistemi
3. **docs/navigation-map.md** - Navigasyon haritası
4. **backend/FINAL_API_STRATEGY.md** - API stratejisi

### ⚙️ Önemli Config Dosyaları

1. **package.json** - Dependencies ve scripts
2. **app.json** - Expo konfigürasyonu
3. **tsconfig.json** - TypeScript konfigürasyonu
4. **netlify.toml** - Netlify deployment

---

## 20. HIZLI BAŞLANGIÇ

### 🚀 Development Başlatma

```bash
# Frontend başlatma
npm start

# Backend başlatma (ayrı terminal)
cd backend
npm start

# Web'de çalıştırma
npm run web:dev
```

### 📱 Build Komutları

```bash
# Android build
npm run android

# iOS build (macOS gerekli)
npm run ios

# Web build
npm run web
```

### 🧪 Test Komutları

```bash
# Unit tests
npm test

# E2E tests (iOS)
npm run detox:test:ios

# E2E tests (Android)
npm run detox:test:android
```

---

## 📊 ÖZET TABLO

| Kategori | Sayı |
|----------|------|
| **Ekranlar** | 27 |
| **Components** | 20+ |
| **Services** | 14 (frontend) + 11 (backend) |
| **API Routes** | 9 |
| **Dokümantasyon** | 87 dosya |
| **Dil Desteği** | 8 dil |
| **Tahmin Kategorileri** | 14 (maç) + 7 (oyuncu) |
| **Rozetler** | 20+ |
| **Formasyonlar** | 26 |

---

## 🎯 SONUÇ

**TacticIQ**, kapsamlı bir futbol tahmin ve analiz uygulamasıdır. Proje:

- ✅ **3 Platform:** iOS, Android, Web
- ✅ **Full-Stack:** React Native Frontend + Node.js Backend
- ✅ **Modern Stack:** TypeScript, Expo, React Query, Supabase
- ✅ **Kapsamlı Özellikler:** Tahmin sistemi, rozetler, liderlik tablosu
- ✅ **İyi Dokümante:** 87 dokümantasyon dosyası
- ✅ **Production Ready:** Backend API, Static website, Native builds

**Toplam Kod:** ~90,000+ satır  
**Toplam Dosya:** 200+ dosya  
**Durum:** Aktif Geliştirme

---

**Son Güncelleme:** 5 Ocak 2026  
**Versiyon:** 1.0.0
