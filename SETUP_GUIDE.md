# 🚀 Fan Manager 2026 - Complete Setup Guide

## 📋 İçindekiler

1. [Proje Özeti](#proje-özeti)
2. [Kurulum](#kurulum)
3. [Backend Setup](#backend-setup)
4. [Supabase Setup](#supabase-setup)
5. [API-Football Setup](#api-football-setup)
6. [Development](#development)
7. [Deployment](#deployment)
8. [Architecture](#architecture)

---

## 🎯 Proje Özeti

**Fan Manager 2026** - React Native + Expo ile geliştirilmiş futbol maç tahmini ve yönetim uygulaması.

### Tech Stack
- **Frontend:** React Native 0.76.5, Expo SDK 52
- **Backend:** Node.js + Express
- **Database:** Supabase (PostgreSQL)
- **API:** API-Football.com (PRO Plan)
- **State:** React Hooks + AsyncStorage
- **Styling:** StyleSheet + theme system

---

## 🛠️ Kurulum

### 1. Prerequisites
```bash
Node.js >= 18
npm >= 9
Expo CLI
```

### 2. Install Dependencies
```bash
# Root
npm install

# Backend
cd backend
npm install
```

### 3. Environment Variables

#### Frontend (`src/config/api.ts`):
```typescript
export const API_BASE_URL = 
  Platform.OS === 'web' 
    ? 'http://localhost:3000' 
    : 'http://10.0.2.2:3000'; // Android emulator
```

#### Backend (`backend/.env`):
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key

# API-Football
FOOTBALL_API_KEY=your_api_football_key
API_FOOTBALL_KEY=your_api_football_key

# Server
PORT=3000
NODE_ENV=development
```

---

## 🎨 Backend Setup

### Architecture
```
backend/
├── config/
│   └── supabase.js          # Supabase client
├── services/
│   ├── footballApi.js       # API-Football integration
│   ├── databaseService.js   # Supabase operations
│   └── smartSyncService.js  # Adaptive API sync (15-60s)
├── routes/
│   ├── matches.js           # Match endpoints
│   ├── predictions.js       # Prediction endpoints
│   └── leaderboard.js       # Leaderboard endpoints
└── server.js                # Express server
```

### Start Backend
```bash
cd backend
npm run dev
```

**Backend runs on:** `http://localhost:3000`

---

## 🗄️ Supabase Setup

### 1. Create Project
1. Go to https://supabase.com
2. Create new project
3. Copy URL and Service Key

### 2. Run SQL Schema
```bash
# Sırayla çalıştır:
supabase/000_base_tables.sql         # Users, teams tables
supabase/003_matches_schema.sql      # Matches tables
supabase/001_predictions_schema.sql  # Predictions tables
supabase/004_leaderboard_complete.sql # Leaderboard views
```

### 3. Tables Created
- `users` - User profiles
- `teams` - Football teams
- `leagues` - Leagues
- `matches` - Match data
- `predictions` - User predictions
- `leaderboard` - Ranking view

---

## ⚽ API-Football Setup

### 1. Get API Key
1. Go to https://api-football.com
2. Subscribe to PRO plan (7,500 calls/day)
3. Copy API key

### 2. Smart Sync Strategy

**Peak-Aware Dynamic Sync:**
```
00:00-06:00 UTC (6h): 60s interval →  360 calls
06:00-14:00 UTC (8h): 30s interval →  960 calls
14:00-23:00 UTC (9h): 15s interval → 2,160 calls
23:00-00:00 UTC (1h): 30s interval →  120 calls
+ Live Match Boost: 12s interval (when matches active)
───────────────────────────────────────────────────────
ESTIMATED DAILY USAGE: ~3,600 calls (%48)
SAFE LIMIT: 7,200 calls (%96)
```

### 3. Data Flow
```
API-Football (live data)
    ↓ (Smart Sync: 15-60s)
Backend (Node.js + cache)
    ↓ (upsert)
Supabase (PostgreSQL)
    ↓ (unlimited reads)
Frontend (React Native)
    ↓ (timezone conversion)
Users (local time display)
```

---

## 💻 Development

### Start Development
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npx expo start --web

# Or Android
npx expo start
```

### Project Structure
```
src/
├── screens/          # Main screens
├── components/       # Reusable components
├── services/         # API services
├── hooks/            # Custom hooks
├── theme/            # Design system
├── utils/            # Utility functions
└── types/            # TypeScript types
```

### Key Files
- `App.tsx` - Main navigation (state-based routing)
- `src/theme/theme.ts` - Design tokens
- `src/services/api.ts` - API client
- `src/hooks/useFavoriteTeamMatches.ts` - Match data hook

---

## 🚀 Deployment

### Backend Deployment (Railway)

1. **Create Account**
   ```bash
   https://railway.app/
   ```

2. **Deploy**
   - Connect GitHub repo
   - Select `backend` directory
   - Add environment variables
   - Deploy

3. **Environment Variables**
   ```
   SUPABASE_URL
   SUPABASE_SERVICE_KEY
   FOOTBALL_API_KEY
   PORT=3000
   NODE_ENV=production
   ```

4. **Update Frontend**
   ```typescript
   // src/config/api.ts
   export const API_BASE_URL = 'https://your-app.up.railway.app';
   ```

### Frontend Deployment (Expo EAS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Build
eas build --platform android
eas build --platform ios

# Submit
eas submit --platform android
eas submit --platform ios
```

---

## 🏗️ Architecture

### State Management
- **LocalStorage Keys:**
  - `fan-manager-user` - User session
  - `fan-manager-language` - Language
  - `fan-manager-favorite-clubs` - Favorite teams

### Navigation Flow
```
Splash → Language Selection → Auth → Favorite Teams → Home
                                        ↓
                        Return User → Home (direct)
```

### API Integration
```javascript
// Priority-based fetching
1. Try Database (Supabase)
2. Try Backend (if DB empty)
3. Fallback to Mock Data (if backend fails)
```

---

## 📊 Monitoring

### Check Backend Status
```bash
GET http://localhost:3000/health
GET http://localhost:3000/api/sync-status
```

### Response
```json
{
  "isRunning": true,
  "currentInterval": "15s",
  "apiCallsToday": 245,
  "remaining": {
    "daily": 7255,
    "used": 245,
    "limit": 7500,
    "usagePercent": "3.3%"
  }
}
```

---

## 🔧 Troubleshooting

### Backend Issues
```bash
# Kill existing processes
taskkill /F /IM node.exe

# Restart backend
cd backend
npm run dev
```

### Database Issues
```bash
# Check Supabase connection
curl https://your-project.supabase.co/rest/v1/matches?limit=1 \
  -H "apikey: YOUR_KEY"
```

### Clear Cache
```bash
# Frontend
npm run clear-cache

# Backend
cd backend
npm run clear-cache
```

---

## 📝 Important Notes

### Timezone Handling
- **API returns:** UTC
- **Database stores:** UTC
- **Frontend displays:** User's local timezone
- **JavaScript handles conversion automatically**

### API Limits
- **PRO Plan:** 7,500 calls/day
- **Smart Sync:** Uses ~3,600 calls/day (48%)
- **Rate Protection:** Stops at 7,200 to leave buffer

### Design System
- **Colors:** `src/theme/theme.ts` (BRAND, COLORS)
- **Typography:** `TYPOGRAPHY` constants
- **Spacing:** `SPACING` constants
- **Always use design tokens, never hard-code!**

---

## 📚 Additional Resources

- **Design System:** `DESIGN_SYSTEM.md`
- **Navigation Map:** `docs/navigation-map.md`
- **API Strategy:** `backend/FINAL_API_STRATEGY.md`
- **Timezone Guide:** `backend/TIMEZONE_EXPLANATION.md`
- **Schema Fix:** `backend/SCHEMA_FIX_COMPLETE.md`

---

## 🎉 Quick Start Commands

```bash
# Development
npm run dev           # Start frontend (web)
npm run android       # Start Android
npm run ios           # Start iOS

# Backend
cd backend && npm run dev

# Clean
npm run clear-cache
npm run nuclear-clean

# Build
eas build --platform all
```

---

## 📞 Support

For issues or questions:
1. Check `SETUP_GUIDE.md` (this file)
2. Check relevant MD files in root
3. Check backend logs
4. Check Supabase dashboard

---

**Last Updated:** 9 Ocak 2026
**Version:** 1.0.0
**Status:** ✅ Production Ready
