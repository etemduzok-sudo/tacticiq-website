# 🔧 TacticIQ - Refactor Plan

**Date:** 28 January 2026  
**Goal:** Safe refactoring without changing behavior, UI/UX, or functionality  
**Constraint:** Last version is in git (sent today) - preserve all current behavior

---

## 📋 REFACTOR PRINCIPLES

1. ✅ **NO behavior changes** - App must work exactly the same
2. ✅ **NO UI/UX changes** - Visual appearance stays identical
3. ✅ **NO API contract changes** - Backend endpoints unchanged
4. ✅ **Small, safe steps** - One step at a time, verify after each
5. ✅ **Extract, don't rewrite** - Move code, don't change logic
6. ✅ **Preserve types** - Keep TypeScript strict, no new `any`

---

## 🎯 REFACTOR PLAN (10 Steps)

### **STEP 1: Quick Wins - Lint & Format** ⚡
**Priority:** High | **Risk:** Very Low | **Time:** 30 min

**Actions:**
- Run ESLint and fix auto-fixable issues
- Format code with Prettier (if configured)
- Remove unused imports
- Fix obvious type issues (no logic changes)

**Files Touched:**
- All `.ts` and `.tsx` files (via linting)

**Verification:**
```bash
npm run lint
npm run type-check
# App should still work identically
```

**Expected Outcome:**
- Cleaner codebase
- No functional changes
- Better type safety

---

### **STEP 2: Extract Navigation Module from App.tsx** 🧭
**Priority:** High | **Risk:** Medium | **Time:** 2-3 hours

**Problem:** `App.tsx` is 1,335 lines with all navigation logic

**Actions:**
1. Create `src/navigation/` directory structure:
   ```
   src/navigation/
   ├── types.ts          # Screen types, navigation types
   ├── handlers.ts       # Navigation handler functions
   ├── router.tsx        # Screen router component
   └── index.ts          # Exports
   ```

2. Extract navigation handlers:
   - Move all `handle*` functions from App.tsx to `handlers.ts`
   - Keep exact same logic, just move code
   - Pass dependencies as parameters

3. Extract screen router:
   - Move `renderScreen()` logic to `router.tsx`
   - Keep switch-case structure identical
   - Pass all props/state as parameters

4. Update App.tsx:
   - Import from navigation module
   - Keep same state management
   - Use extracted components

**Files Touched:**
- `App.tsx` (reduce to ~400-500 lines)
- `src/navigation/types.ts` (new)
- `src/navigation/handlers.ts` (new)
- `src/navigation/router.tsx` (new)
- `src/navigation/index.ts` (new)

**Verification:**
```bash
npm run type-check
npm start
# Test all navigation flows:
# - Splash → Onboarding → Auth → Home
# - Home → Matches → Match Detail → Back
# - Profile → Settings → Back
# - All tabs work
# - OAuth flow works
```

**Risk Mitigation:**
- Keep App.tsx working during extraction
- Test each screen transition
- Verify OAuth callback handling

---

### **STEP 3: Extract OAuth Logic from App.tsx** 🔐
**Priority:** High | **Risk:** Medium | **Time:** 1-2 hours

**Problem:** OAuth handling mixed into App.tsx (100+ lines)

**Actions:**
1. Create `src/services/oauthService.ts`:
   - Extract OAuth callback detection
   - Extract session checking logic
   - Extract URL cleanup logic

2. Create `src/hooks/useOAuth.ts`:
   - Extract OAuth state management
   - Extract useEffect hooks for OAuth
   - Return same interface as current state

3. Update App.tsx:
   - Use `useOAuth()` hook
   - Remove OAuth logic

**Files Touched:**
- `App.tsx` (remove OAuth code)
- `src/services/oauthService.ts` (new)
- `src/hooks/useOAuth.ts` (new)

**Verification:**
```bash
npm start
# Test OAuth flows:
# - Google login
# - Apple login
# - OAuth callback handling
# - Session persistence
```

---

### **STEP 4: Extract Zoom Prevention Logic** 🖥️
**Priority:** Medium | **Risk:** Low | **Time:** 1 hour

**Problem:** Web zoom prevention code (150+ lines) in App.tsx

**Actions:**
1. Create `src/utils/webZoomPrevention.ts`:
   - Extract all zoom prevention code
   - Keep exact same logic
   - Export initialization function

2. Update App.tsx:
   - Import and call initialization
   - Remove inline zoom code

**Files Touched:**
- `App.tsx` (remove zoom code)
- `src/utils/webZoomPrevention.ts` (new)

**Verification:**
```bash
npm run web:dev
# Test on web:
# - No zoom on double-tap
# - No zoom on pinch
# - No zoom on Ctrl+scroll
```

---

### **STEP 5: Split AdminDataContext** 📊
**Priority:** High | **Risk:** Medium | **Time:** 4-5 hours

**Problem:** `AdminDataContext.tsx` is 2,743 lines - too large

**Actions:**
1. Analyze context responsibilities:
   - Users management
   - Content management
   - Settings management
   - Advertisements
   - Games, Partners, Press Releases
   - etc.

2. Create domain-specific contexts:
   ```
   website/src/contexts/admin/
   ├── AdminUsersContext.tsx
   ├── AdminContentContext.tsx
   ├── AdminSettingsContext.tsx
   ├── AdminAdsContext.tsx
   ├── AdminGamesContext.tsx
   └── index.ts
   ```

3. Split state and logic:
   - Move user-related state to AdminUsersContext
   - Move content-related state to AdminContentContext
   - Keep same API surface (for backward compatibility)
   - Use composition pattern

4. Update consumers:
   - Update imports gradually
   - Test each admin feature

**Files Touched:**
- `website/src/contexts/AdminDataContext.tsx` (refactor to compose smaller contexts)
- `website/src/contexts/admin/AdminUsersContext.tsx` (new)
- `website/src/contexts/admin/AdminContentContext.tsx` (new)
- `website/src/contexts/admin/AdminSettingsContext.tsx` (new)
- `website/src/contexts/admin/AdminAdsContext.tsx` (new)
- `website/src/contexts/admin/AdminGamesContext.tsx` (new)
- All admin component consumers

**Verification:**
```bash
cd website
npm run dev
# Test all admin features:
# - User management (CRUD)
# - Content management
# - Settings
# - Advertisements
# - Games, Partners, etc.
```

**Risk Mitigation:**
- Keep AdminDataContext as wrapper initially
- Gradually migrate consumers
- Test each feature after migration

---

### **STEP 6: Extract Shared Types** 📝
**Priority:** Medium | **Risk:** Low | **Time:** 2 hours

**Problem:** Types may be duplicated between mobile/web

**Actions:**
1. Audit type definitions:
   - Check `src/types/` vs `website/src/` types
   - Identify duplicates
   - Identify shared types

2. Create shared types package:
   ```
   shared/types/
   ├── user.types.ts
   ├── match.types.ts
   ├── prediction.types.ts
   └── index.ts
   ```

3. Consolidate duplicates:
   - Move shared types to `shared/types/`
   - Update imports in both mobile and web
   - Keep platform-specific types separate

**Files Touched:**
- `src/types/` (update imports)
- `website/src/` (update imports if types exist)
- `shared/types/` (new, if shared types exist)

**Verification:**
```bash
npm run type-check
cd website && npm run build
# All types should resolve correctly
```

---

### **STEP 7: Extract Shared Utilities** 🛠️
**Priority:** Medium | **Risk:** Low | **Time:** 2-3 hours

**Problem:** Utilities may be duplicated

**Actions:**
1. Audit utility functions:
   - Check `src/utils/` vs `website/src/utils/`
   - Identify duplicates
   - Identify shared utilities

2. Create shared utilities:
   ```
   shared/utils/
   ├── dateUtils.ts
   ├── formatUtils.ts
   └── index.ts
   ```

3. Consolidate:
   - Move shared utilities
   - Update imports
   - Keep platform-specific utils separate

**Files Touched:**
- `src/utils/` (update if needed)
- `website/src/utils/` (update if needed)
- `shared/utils/` (new, if shared utils exist)

**Verification:**
```bash
npm run type-check
# Test affected features
```

---

### **STEP 8: Optimize Context Providers** ⚡
**Priority:** Medium | **Risk:** Low | **Time:** 2 hours

**Problem:** Some contexts may cause unnecessary re-renders

**Actions:**
1. Audit context providers:
   - Check `useMemo` usage
   - Check `useCallback` usage
   - Identify missing optimizations

2. Optimize:
   - Add `useMemo` for context values
   - Add `useCallback` for functions
   - Split contexts if too many consumers

**Files Touched:**
- `src/contexts/*.tsx` (optimize)
- `website/src/contexts/*.tsx` (optimize)

**Verification:**
```bash
npm start
# Test app performance
# Check React DevTools Profiler
```

---

### **STEP 9: Clean Up Unused Code** 🧹
**Priority:** Low | **Risk:** Very Low | **Time:** 1 hour

**Problem:** Unused code (e.g., AppNavigator.tsx)

**Actions:**
1. Identify unused files:
   - `src/navigation/AppNavigator.tsx` (if App.tsx doesn't use it)
   - Unused components
   - Unused utilities

2. Remove or archive:
   - Delete truly unused code
   - Or move to `archive/` folder
   - Update imports if needed

**Files Touched:**
- Unused files (to be identified)

**Verification:**
```bash
npm run type-check
npm start
# App should work identically
```

---

### **STEP 10: Improve Type Safety** 🔒
**Priority:** Low | **Risk:** Low | **Time:** 2-3 hours

**Problem:** May have `any` types or loose types

**Actions:**
1. Audit type safety:
   - Search for `any` types
   - Check for `@ts-ignore` comments
   - Identify loose types

2. Improve types:
   - Replace `any` with proper types
   - Remove unnecessary `@ts-ignore`
   - Add missing type definitions

**Files Touched:**
- Files with `any` types (to be identified)

**Verification:**
```bash
npm run type-check
# Should have fewer/no `any` types
# All types should be strict
```

---

## 📊 REFACTOR SUMMARY

| Step | Priority | Risk | Time | Files | Impact |
|------|----------|------|------|-------|--------|
| 1. Lint & Format | High | Very Low | 30m | All | Code quality |
| 2. Extract Navigation | High | Medium | 2-3h | 5 | App.tsx → 400 lines |
| 3. Extract OAuth | High | Medium | 1-2h | 3 | App.tsx → -100 lines |
| 4. Extract Zoom Logic | Medium | Low | 1h | 2 | App.tsx → -150 lines |
| 5. Split AdminDataContext | High | Medium | 4-5h | 10+ | 2,743 → 5×500 lines |
| 6. Extract Shared Types | Medium | Low | 2h | 5-10 | Type consolidation |
| 7. Extract Shared Utils | Medium | Low | 2-3h | 5-10 | Utility consolidation |
| 8. Optimize Contexts | Medium | Low | 2h | 5-10 | Performance |
| 9. Clean Unused Code | Low | Very Low | 1h | 5-10 | Codebase size |
| 10. Improve Types | Low | Low | 2-3h | 10-20 | Type safety |

**Total Estimated Time:** 18-25 hours

---

## ✅ VERIFICATION CHECKLIST (After Each Step)

### Build & Type Check
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes (or only acceptable warnings)
- [ ] `npm run build` succeeds (website)

### Mobile App Testing
- [ ] App starts without errors
- [ ] Splash screen → Onboarding → Auth flow works
- [ ] Home screen loads
- [ ] Navigation between tabs works
- [ ] Match detail screen works
- [ ] Profile screen works
- [ ] OAuth login works (Google/Apple)
- [ ] All screens render correctly

### Website Testing
- [ ] Website loads
- [ ] Admin panel works (if step 5 done)
- [ ] All admin features work
- [ ] No console errors

### Regression Testing
- [ ] No new bugs introduced
- [ ] All existing features work
- [ ] Performance not degraded

---

## 🚨 RISK MITIGATION

### High-Risk Steps (2, 3, 5)
1. **Create feature branch** before starting
2. **Test thoroughly** after each change
3. **Keep old code** commented initially (remove after verification)
4. **Incremental migration** - don't change everything at once

### Medium-Risk Steps (4, 6, 7)
1. **Test affected features** after changes
2. **Verify imports** are correct
3. **Check for circular dependencies**

### Low-Risk Steps (1, 8, 9, 10)
1. **Run tests** after changes
2. **Verify build** succeeds

---

## 📝 NOTES

- **No UI changes** - All refactoring is internal
- **No API changes** - Backend contracts unchanged
- **Preserve behavior** - App must work identically
- **Git-friendly** - Each step can be a separate commit
- **Reversible** - Can revert any step if issues found

---

## 🎯 SUCCESS CRITERIA

After refactoring:
- ✅ App.tsx < 500 lines (from 1,335)
- ✅ AdminDataContext split into 5+ smaller contexts
- ✅ No duplicate code between mobile/web
- ✅ All types are strict (no `any` unless justified)
- ✅ All tests pass
- ✅ App works identically to before
- ✅ Code is more maintainable

---

**Ready to proceed?** Start with Step 1 (Quick Wins) for immediate value with zero risk.
