# Logo Setup Instructions

## ⚠️ CRITICAL: Logo File Required

The application requires a logo image file at:
```
src/assets/logo.png
```

**Current Status:** Logo file is **MISSING** - this is causing Metro bundler errors.

---

## How to Add the Logo

1. **Get your shield logo image** (the golden shield logo shown in the design)

2. **Save it as PNG**:
   - Format: PNG (with transparency recommended)
   - Location: `src/assets/logo.png`
   - Recommended size: 192x192px or higher resolution
   - Aspect ratio: Square (1:1)

3. **File structure should be:**
```
src/
  assets/
    logo.png  ← ADD THIS FILE
    README.md
```

---

## After Adding the Logo

1. **Restart Metro bundler**:
   ```bash
   npx expo start --web --port 8082 --clear
   ```

2. **Verify**:
   - The logo should appear on all auth screens
   - No Metro bundler errors should occur

---

## Logo Usage

The logo is used in these screens:
- ✅ SplashScreen (160x160px)
- ✅ LanguageSelectionScreen (120x120px)  
- ✅ AuthScreen (96x96px)
- ✅ RegisterScreen (96x96px)
- ✅ ForgotPasswordScreen (96x96px)

---

## Error Resolution

If you see:
```
GET http://localhost:8082/index.bundle... net::ERR_ABORTED 500
```

**Cause:** Logo file (`src/assets/logo.png`) is missing

**Solution:** Add the logo file as described above, then restart Metro bundler
