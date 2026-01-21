# 🎯 TacticIQ - Screen Flow & Navigation Documentation

**Sayfa Akışları, Router Logic ve State Management Kılavuzu**  
*Frontend Geliştiriciler İçin Navigasyon Haritası*

---

## 📋 İçindekiler

1. [Tüm Ekranlar (Screens)](#1-tüm-ekranlar-screens)
2. [Ana Navigasyon Akışı](#2-ana-navigasyon-akışı)
3. [Detaylı Sayfa Geçişleri](#3-detaylı-sayfa-geçişleri)
4. [State Management](#4-state-management)
5. [Handler Functions](#5-handler-functions)
6. [Error Handling & Edge Cases](#6-error-handling--edge-cases)

---

## 1. Tüm Ekranlar (Screens)

### **📱 Screen Type Definition**

```typescript
type RootStackParamList = {
  Splash: undefined;
  LanguageSelection: undefined;
  Auth: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  FavoriteTeams: undefined;
  MainTabs: undefined;
  MatchDetail: { matchId: string };
  ProfileSettings: undefined;
  ChangePassword: undefined;
  Notifications: undefined;
  DeleteAccount: undefined;
  ProUpgrade: undefined;
  LegalDocuments: undefined;
  LegalDocument: { documentId: string; title: string };
};
```

---

## 2. Ana Navigasyon Akışı

### **🚀 İlk Açılış (First Launch)**

```
Splash (3 saniye)
  ↓
  hasUser? 
    → YES → MainTabs (Ana sayfa)
    → NO → LanguageSelection
             ↓
           Auth (Login/Register)
             ↓
           hasTeams?
             → YES → MainTabs
             → NO → FavoriteTeams
                      ↓
                    MainTabs
```

### **🔄 Return User Flow**

```
Splash (kontrol)
  ↓
localStorage check
  ↓
  hasUser = true
  ↓
MainTabs (Doğrudan ana sayfa)
```

---

## 3. Critical Navigation Rules

### **✅ DO's (Yapılması Gerekenler)**

1. **Splash Screen** her zaman `initialRouteName` olmalı
2. **LocalStorage** kontrolleri `SplashScreen.tsx` içinde
3. **MainTabs** → Ana uygulama entry point (Home, Matches, Profile)
4. **Back navigation** her ekranda doğru çalışmalı
5. **State persistence** → AsyncStorage/localStorage kullan

### **❌ DON'Ts (Yapılmaması Gerekenler)**

1. Splash'ı atlamayın
2. Navigation stack'i boşaltmayın (replace kullanın)
3. Circular navigation yapmayın
4. Return screen logic'i unutmayın (ProUpgrade, LegalDocument)

---

## 4. LocalStorage Keys

```typescript
// User session
"fan-manager-user"           // { authenticated: true }

// Onboarding data
"fan-manager-language"       // "tr" | "en" | "de" | "fr" | "es" | "it"
"fan-manager-favorite-clubs" // ["galatasaray", "fenerbahce", ...]

// Settings
"fan-manager-theme"          // "light" | "dark"
"fan-manager-notifications"  // { matchStart: true, goals: true, ... }
```

---

## 5. Navigation Handlers

### **SplashScreen Logic**

```typescript
useEffect(() => {
  const checkUser = async () => {
    const user = await AsyncStorage.getItem('fan-manager-user');
    const hasTeams = await AsyncStorage.getItem('fan-manager-favorite-clubs');
    
    setTimeout(() => {
      if (user) {
        navigation.replace('MainTabs');
      } else {
        navigation.replace('LanguageSelection');
      }
    }, 2500);
  };
  
  checkUser();
}, []);
```

### **Auth Success Logic**

```typescript
const handleLoginSuccess = async () => {
  await AsyncStorage.setItem('fan-manager-user', JSON.stringify({ authenticated: true }));
  
  const hasTeams = await AsyncStorage.getItem('fan-manager-favorite-clubs');
  
  if (hasTeams) {
    navigation.replace('MainTabs');
  } else {
    navigation.replace('FavoriteTeams');
  }
};
```

### **FavoriteTeams Completion**

```typescript
const handleContinue = async () => {
  if (selectedTeams.length === 0) {
    Alert.alert('Uyarı', 'Lütfen en az bir takım seçin');
    return;
  }
  
  await AsyncStorage.setItem('fan-manager-favorite-clubs', JSON.stringify(selectedTeams));
  navigation.replace('MainTabs');
};
```

---

## 6. Screen Flow Chart

```
┌─────────────┐
│   Splash    │ (initialRouteName)
└──────┬──────┘
       │
       ├─── hasUser = true ──────────► MainTabs
       │
       └─── hasUser = false ───┐
                               │
                        ┌──────▼──────────┐
                        │ LanguageSelection│
                        └──────┬───────────┘
                               │
                        ┌──────▼──────┐
                        │    Auth     │
                        └──────┬──────┘
                               │
                               ├─── success + hasTeams ────► MainTabs
                               │
                               └─── success + no teams ────┐
                                                            │
                                                     ┌──────▼──────────┐
                                                     │ FavoriteTeams   │
                                                     └──────┬──────────┘
                                                            │
                                                            ▼
                                                        MainTabs
```

---

## 7. Testing Checklist

### **First Launch Flow**
- [ ] Splash screen görünüyor (2.5 saniye)
- [ ] Dil seçimi açılıyor
- [ ] Dil seçince Auth'a gidiyor
- [ ] Login/Register çalışıyor
- [ ] FavoriteTeams açılıyor
- [ ] Takım seçip devam edince MainTabs açılıyor

### **Return User Flow**
- [ ] Splash screen görünüyor
- [ ] Direkt MainTabs açılıyor (3 saniye içinde)

### **Logout Flow**
- [ ] Logout → AsyncStorage temizleniyor
- [ ] Splash → LanguageSelection → Auth akışı başlıyor

---

**Last Updated:** 5 Ocak 2026  
**Version:** 1.0.0  
**Status:** Active Implementation
