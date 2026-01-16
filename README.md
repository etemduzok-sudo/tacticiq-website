# TacticIQ.app - Football Intelligence Platform

A professional football analysis and match prediction platform. **Not a betting platform** - skill-based tactical intelligence.

## 🎯 Product Overview

TacticIQ is a match-based interactive analysis platform where users make predictions and evaluations before and during matches. Earn points, XP, and rankings based on accuracy and logical consistency.

### Core Principles

- ✅ **Skill-based** prediction and analysis
- ✅ **Data-driven** tactical intelligence
- ✅ **No betting** - no real money wagering
- ✅ **No financial risk** - virtual rewards only
- ✅ **Fair & transparent** scoring system

## 🌍 Multi-Language Support

The platform supports 8 languages with full localization:

- 🇬🇧 English (EN)
- 🇩🇪 German (DE)
- 🇫🇷 French (FR)
- 🇪🇸 Spanish (ES)
- 🇮🇹 Italian (IT)
- 🇹🇷 Turkish (TR)
- 🇸🇦 Arabic (AR) - with RTL support
- 🇨🇳 Chinese (ZH - Simplified)

### RTL Support

The application automatically switches to RTL layout for Arabic, including:
- Mirrored navigation
- Right-to-left text flow
- Culturally appropriate UI adjustments

## ✨ Features

### 🎯 Match Predictions
- Pre-match result predictions
- Goal timing predictions
- Cards and fouls analysis
- Possession percentage forecasts
- Player-level event predictions

### 📡 Live Match Intelligence
- Real-time match events
- xG (Expected Goals) statistics
- Live possession tracking
- Player performance indicators
- Match flow visualization

### ⭐ Rating & Evaluation System
- Team ratings
- Player ratings
- Coach ratings
- Tactical accuracy scores
- Fair, explainable scoring

### 📈 Skill Progression
- XP and level system
- Achievement badges
- Global leaderboards
- Country-based rankings
- Season competitions

## 🏗️ Technical Stack

- **React 18** with TypeScript
- **Tailwind CSS v4** for styling
- **Radix UI** for accessible components
- **Lucide React** for icons
- **Context API** for state management
- **Vite** for fast development

## 🎨 Design System

### Brand Colors

```css
--primary: #0F2A24 (Dark Forest Green)
--secondary: #1FA2A6 (Teal/Analytics)
--accent: #C9A44C (Gold)
--error: #8C3A3A (Muted Red)
--dark: #121212
--light: #E6E6E6
```

### Design Philosophy

- **Calm & Professional** - No casino aesthetics
- **Data First** - Information over decoration
- **Accessible** - WCAG compliant
- **Responsive** - Mobile-first approach

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── sections/         # Page sections
│   │   ├── legal/            # Legal pages
│   │   ├── ui/               # Reusable UI components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── LanguageSwitcher.tsx
│   └── App.tsx
├── contexts/
│   └── LanguageContext.tsx   # Multi-language context
├── translations/             # Language files
│   ├── en.ts
│   ├── de.ts
│   ├── fr.ts
│   ├── es.ts
│   ├── it.ts
│   ├── tr.ts
│   ├── ar.ts
│   └── zh.ts
└── styles/
    ├── theme.css             # Theme variables
    ├── tailwind.css
    └── index.css
```

## 🚀 Getting Started

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Adding a New Language

1. Create translation file in `/src/translations/{lang}.ts`
2. Add language code to `Language` type in `LanguageContext.tsx`
3. Add language option in `LanguageSwitcher.tsx`
4. Test RTL support if applicable

## 📄 Legal & Compliance

### Fair Play Statement

TacticIQ is **NOT** a betting platform:
- No real money wagering
- No odds or financial payouts
- All rewards are virtual and non-monetary
- Skill-based, not chance-based

### Compliance

Designed to comply with:
- App Store guidelines
- Google Play policies
- Advertising platform requirements
- GDPR and data protection regulations

## 🎯 Roadmap

- [ ] User authentication
- [ ] Real match data integration
- [ ] Advanced analytics dashboard
- [ ] Social features (leagues, challenges)
- [ ] Mobile app (iOS/Android)
- [ ] API for third-party integrations

## 📝 License

© 2026 TacticIQ. All rights reserved.

---

**Remember:** TacticIQ is a professional football analysis tool, not a gambling platform. Play responsibly, analyze intelligently.
