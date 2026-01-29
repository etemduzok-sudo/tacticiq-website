# 📋 TacticIQ - Repository Map

**Date:** 28 January 2026  
**Purpose:** Codebase analysis for safe refactoring

---

## 1. PROJECT TYPE

**Multi-platform project:**
- ✅ **React Native + Expo** (Mobile app) - `src/` directory
- ✅ **Vite + React** (Website) - `website/` directory  
- ✅ **Node.js + Express** (Backend API) - `backend/` directory

**Tech Stack:**
- Mobile: React Native 0.81.5, Expo SDK 54, TypeScript 5.3.3
- Website: React 18.3.1, Vite 6.0.5, TypeScript, Tailwind CSS v4
- Backend: Node.js, Express.js, Supabase

---

## 2. HOW TO RUN / DEV / BUILD

### Mobile App (React Native + Expo)
```bash
# Root directory
npm start              # Expo dev server
npm run android        # Run on Android
npm run ios           # Run on iOS
npm run web:dev        # Run web version (dev)
npm run web            # Run web version (production)
npm run type-check     # TypeScript check
npm run lint           # ESLint
```

### Website (Vite + React)
```bash
cd website
npm run dev           # Development server
npm run build         # Production build
```

### Backend (Node.js)
```bash
cd backend
npm start             # Production
npm run dev           # Development (nodemon)
```

---

## 3. ENTRY POINTS

### Mobile App
- **Main Entry:** `App.tsx` (root level)
  - Custom state-based navigation (switch-case)
  - 1,335 lines - **OVERSIZED!**
  - Handles all screen routing manually
  - Contains OAuth logic, maintenance mode, badge system

- **Alternative Entry:** `app/index.tsx` (Expo Router - redirects to `/`)

### Website
- **Main Entry:** `website/src/main.tsx`
  - Renders `website/src/app/App.tsx`
  - React Router (likely, needs verification)

### Backend
- **Main Entry:** `backend/server.js`
  - Express server setup

---

## 4. ROUTING / NAVIGATION STRUCTURE

### Mobile App
**Current:** Custom state-based navigation in `App.tsx`
- Uses `currentScreen` state with switch-case
- Screen types: `'splash' | 'onboarding' | 'auth' | 'home' | 'matches' | ...`
- **Problem:** All navigation logic in one file (1,335 lines)

**Alternative (unused):** `src/navigation/AppNavigator.tsx`
- React Navigation setup (Stack + Tabs)
- **Status:** Defined but not used (App.tsx uses custom navigation)

**Screens:**
- `src/screens/` - 27+ screen components
- Main screens: Splash, Onboarding, Auth, Home, Matches, Profile, Leaderboard

### Website
- React Router (needs verification)
- Sections in `website/src/app/components/sections/`

---

## 5. STATE MANAGEMENT APPROACH

### Mobile App
**Primary:**
- ✅ **React Context API:**
  - `ThemeContext` - Theme management
  - `PredictionContext` - Prediction state
  - `MatchContext` - Match data
- ✅ **React Query** (`@tanstack/react-query`):
  - `QueryProvider` wrapper
  - `useMatchesQuery` hook
- ✅ **Local State:**
  - `useState` in components
  - `AsyncStorage` for persistence

**Hooks:**
- `src/hooks/` - Custom hooks (useMatches, useProfile, useFavoriteTeams, etc.)

### Website
**Primary:**
- ✅ **React Context API:**
  - `UserAuthContext` - Authentication
  - `AdminContext` - Admin state
  - `AdminDataContext` - **2,743 lines - OVERSIZED!**
  - `LanguageContext` - i18n
  - `PaymentContext` - Payment state
- ✅ **Local State:**
  - `useState` in components

---

## 6. DATA MODELS / TYPES LOCATION

### Mobile App
**Location:** `src/types/`

**Files:**
- `badges.types.ts` - Badge system types
- `game.types.ts` - Game rules, training, scoring
- `match.types.ts` - Match, Team, Venue interfaces
- `prediction.types.ts` - Prediction types
- `profile.types.ts` - User profile types (UnifiedUserProfile)
- `user.types.ts` - User, UserStats interfaces
- `index.ts` - Re-exports

**Type Safety:**
- ✅ TypeScript strict mode enabled
- ✅ Well-organized type files
- ⚠️ Some `any` types may exist (needs audit)

### Website
- Types likely in `website/src/` (needs verification)
- May share types with mobile app

---

## 7. BIGGEST FILES (Top 10 by Size)

### 1. `App.tsx` - **1,335 lines** ⚠️ **OVERSIZED**
**Why big:**
- All navigation logic (switch-case for 20+ screens)
- OAuth handling (100+ lines)
- Zoom prevention for web (150+ lines)
- Badge system integration
- Multiple useEffect hooks
- Screen rendering logic
- Navigation handlers (20+ functions)

**Refactor opportunity:** Extract navigation to separate module

---

### 2. `website/src/contexts/AdminDataContext.tsx` - **~2,743 lines** ⚠️ **OVERSIZED**
**Why big:**
- Massive context provider
- All admin state management
- CRUD operations for multiple entities
- localStorage persistence
- Multiple useEffects

**Refactor opportunity:** Split into domain-specific contexts

---

### 3. `website/src/app/App.tsx` - **~350+ lines** (estimated)
**Why big:**
- Main website component
- Multiple section imports
- Admin panel lazy loading
- Context providers

**Status:** Acceptable size, but could be split

---

### 4. `src/navigation/AppNavigator.tsx` - **231 lines**
**Why big:**
- React Navigation setup
- Stack + Tab navigators
- Screen definitions
- Theme configuration

**Status:** Acceptable size, but **NOT USED** (App.tsx uses custom nav)

---

### 5. `src/contexts/MatchContext.tsx` - **~390 lines** (estimated)
**Why big:**
- Match data management
- API integration
- State management

**Status:** Acceptable, but could be optimized

---

### 6. `src/contexts/PredictionContext.tsx` - **303 lines**
**Why big:**
- Prediction CRUD operations
- API calls
- Local storage caching

**Status:** Acceptable size

---

### 7. `website/src/contexts/UserAuthContext.tsx` - **~977 lines** (estimated)
**Why big:**
- Authentication logic
- User state management
- Supabase integration
- Multiple auth methods

**Status:** Large but manageable

---

### 8. `src/components/MatchDetail.tsx` - **Size unknown**
**Why big (likely):**
- Complex match detail view
- Multiple tabs (Squad, Prediction, Live, Stats, Ratings, Summary)
- Match data handling

**Status:** Needs verification

---

### 9. `src/components/Dashboard.tsx` - **Size unknown**
**Why big (likely):**
- Main dashboard component
- Multiple sections
- Navigation handling

**Status:** Needs verification

---

### 10. `website/src/app/components/admin/AdminPanel.tsx` - **~1,730+ lines** (estimated)
**Why big:**
- Complete admin panel
- Multiple admin features
- Analytics, user management, content management

**Status:** Very large, should be split

---

## 8. PROJECT STRUCTURE SUMMARY

```
TacticIQ/
├── src/                    # React Native Mobile App
│   ├── components/         # UI Components
│   ├── screens/            # Screen components (27+)
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom hooks
│   ├── services/           # API services
│   ├── types/              # TypeScript types
│   ├── navigation/         # Navigation (unused)
│   └── utils/              # Utilities
│
├── website/                # Vite + React Website
│   └── src/
│       ├── app/            # Main app component
│       ├── components/     # UI components
│       ├── contexts/       # React Context (AdminDataContext is huge!)
│       ├── services/        # API services
│       └── i18n/           # Internationalization
│
├── backend/                # Node.js + Express API
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   └── middleware/         # Express middleware
│
└── App.tsx                 # Mobile app entry (OVERSIZED - 1,335 lines)
```

---

## 9. KEY FINDINGS

### ⚠️ Critical Issues
1. **App.tsx is 1,335 lines** - Should be split into:
   - Navigation module
   - Screen router component
   - OAuth handler
   - Badge system handler

2. **AdminDataContext.tsx is 2,743 lines** - Should be split into:
   - AdminUsersContext
   - AdminContentContext
   - AdminSettingsContext
   - etc.

3. **Unused Navigation:** `src/navigation/AppNavigator.tsx` exists but App.tsx uses custom navigation

### ✅ Good Practices
- TypeScript types well-organized
- Context API used appropriately (but some contexts too large)
- Custom hooks for reusable logic
- Services separated from components

### 🔍 Needs Investigation
- Website routing structure (React Router?)
- Duplicate code between mobile/web
- Type sharing between mobile/web
- Test coverage

---

## 10. REFACTOR PRIORITIES

### High Priority
1. Split `App.tsx` (1,335 lines)
2. Split `AdminDataContext.tsx` (2,743 lines)
3. Extract navigation logic

### Medium Priority
4. Consolidate duplicate types
5. Extract shared utilities
6. Optimize context providers

### Low Priority
7. Remove unused code (AppNavigator.tsx?)
8. Improve type safety (remove `any`)
9. Add missing tests

---

**Next Step:** Create detailed refactor plan (Section 2)
