# TacticIQ – Proje Tarama Raporu (1. Tarama)

**Tarih:** 25 Şubat 2026  
**Tarama türü:** TypeScript (`npm run type-check`)  
**Toplam hata:** ~1.440

---

## 1. Taramayı Nasıl Yaparsınız?

### Yöntem A: Komut satırı (her zaman kullanılabilir)
```powershell
cd c:\TacticIQ
npm run type-check
```
Çıktı tüm TypeScript hatalarını listeler. Çıktı uzunsa bir dosyaya yönlendirebilirsiniz:
```powershell
npm run type-check 2>&1 | Out-File -FilePath typecheck-report.txt
```

### Yöntem B: Cursor / Bugbot ile “tüm proje” taraması
- **Chat’te istek:** “Projede `npm run type-check` çalıştır, çıkan tüm hataları listele ve kategorize et, çözüm öner.”
- **Bugbot:** Belirli bir hata mesajını veya dosya yolunu yapıştırıp “bu hatayı düzelt” derseniz odaklı düzeltme önerir. Tek seferde “tüm projeyi tara” butonu yok; bu yüzden önce `npm run type-check` çıktısı (veya bu rapor) referans alınır.

### Yöntem C: ESLint (şu an projede eksik bağımlılık var)
```powershell
npx eslint . --ext .ts,.tsx
```
Şu anda `@eslint/eslintrc` bulunamadığı için hata veriyor. Düzeltmek için:
```powershell
npm install --save-dev eslint @eslint/eslintrc
```
Sonra tekrar `npm run lint` çalıştırabilirsiniz.

---

## 2. Hata Özeti – Evet, Tüm Hatalar Listelenir; Çözüm Önerileri Aşağıda

Tarama **tüm projeyi** (React Native app + `website` + `src/admin`) kapsıyor.  
**Evet:** Tarama size **tüm tespit edilen hataları** verir.  
**Evet:** Aşağıdaki kategorilerde **çözüm önerileri** sunuluyor; isterseniz her kategori için “şu dosyaları düzelt” diye Bugbot’a/Cursor’a adım adım verebilirsiniz.

---

## 3. Hata Kategorileri ve Çözüm Önerileri

### Kategori 1: Eksik / Yanlış Modül (Import)

| Hata | Dosya | Çözüm önerisi |
|------|--------|----------------|
| `Cannot find module './src/screens/DatabaseTestScreen'` | `App.tsx` | `DatabaseTestScreen` kullanılmıyorsa import ve ilgili ekranı navigasyondan kaldırın; kullanıyorsanız `src/screens/DatabaseTestScreen.tsx` dosyasını oluşturun. |
| `Cannot find module 'expo-ads-admob'` | `src/components/ads/AdInterstitial.tsx` | Paket artık desteklenmiyorsa import’u kaldırıp farklı reklam çözümüne geçin veya uyumlu bir paket kullanın. |
| `Cannot find module '@/...'` (website) | `website/src/` altı birçok dosya | `website/tsconfig.json` içinde `paths` ile `@/*` doğru klasöre (örn. `src/*`) yönlendirilmiş olmalı. Eksikse ekleyin. |

**Pratik:** Önce `App.tsx` içindeki `DatabaseTestScreen` satırını kaldırmak veya dosyayı eklemek tek dosyada birçok hatayı azaltır.

---

### Kategori 2: Tema Renkleri (Theme) – En Çok Hata

**Sorun:** `src/admin/*` ve bazı bileşenler `colors.textSecondary`, `colors.text`, `colors.error`, `colors.warning`, `colors.success` kullanıyor; fakat kullandıkları tema tipi sadece `LIGHT_MODE` / `DARK_MODE` anahtarlarını içeriyor (background, foreground, card, primary, …). Bu tip tanımında `text`, `textSecondary`, `error`, `warning`, `success` yok.

**Etkilenen alanlar:**  
`src/admin/AdminScreen.tsx`, `AdminAds.tsx`, `AdminContent.tsx`, `AdminDashboard.tsx`, `AdminPartners.tsx`, `AdminSettings.tsx`, `AdminSystem.tsx`, `AdminTeam.tsx`, `AdminUsers.tsx` ve benzeri.

**Çözüm seçenekleri (birini uygulayın):**

- **Seçenek A – Tema tipine alan eklemek:**  
  Tema tipi (ör. `Theme` / `Colors` interface’i) içine şunları ekleyin:  
  `text`, `textSecondary`, `error`, `warning`, `success`  
  Değerleri `src/theme/theme.ts` içindeki `COLORS.light` / `COLORS.dark` ile aynı tutun (zaten orada tanımlı: `text`, `textSecondary`, `error`, `warning`, `success`).

- **Seçenek B – Admin’in kullandığı renkleri doğru objeden almak:**  
  Admin tarafında tema/renk alırken doğrudan `LIGHT_MODE`/`DARK_MODE` yerine `COLORS.light` / `COLORS.dark` (veya bu genişletilmiş renk objesini döndüren bir hook) kullanın. Böylece `text`, `textSecondary`, `error`, `warning`, `success` mevcut olur.

- **Seçenek C – Eşleme (mapping):**  
  Mevcut tema objesinde:  
  `text` → `foreground`,  
  `textSecondary` → `mutedForeground`,  
  `error` → `destructive`,  
  `warning` / `success` → uygun bir renk (örn. `accent`, `secondary`) ile eşleyen bir yardımcı kullanın.  
  Bu durumda tip tanımına da bu alanları eklemek gerekir.

En temiz ve kalıcı çözüm: **tema tipini `COLORS.light` / `COLORS.dark` yapısıyla uyumlu hale getirmek** (Seçenek A veya B).

---

### Kategori 3: İkon İsmi (Ionicons)

| Hata | Dosya | Çözüm |
|------|--------|--------|
| `"handshake-outline"` is not assignable to type... | `src/admin/AdminScreen.tsx` (satır 52) | Ionicons’ta bu isim yoksa geçerli bir isim kullanın (ör. `"people-outline"` veya dokümandaki başka bir ikon). |

---

### Kategori 4: `implicit any` / `unknown` Tipi

- **Örnek:** `Parameter 'error' implicitly has an 'any' type` (`AdBanner.tsx` vb.).  
  **Çözüm:** İlgili parametreye tip yazın, örn. `(error: unknown)` veya `(error: Error)`.
- **Örnek:** `'err' is of type 'unknown'`, `Property 'code' does not exist on type 'Error'` (website `UserAuthContext.tsx`, `useApi.ts`).  
  **Çözüm:** `err` için type guard kullanın (`if (err && typeof err === 'object' && 'code' in err)`) veya `ErrorLike` gibi bir tip tanımlayıp `err as ErrorLike` ile kullanın; `ErrorLike` tipinde `code` tanımlı olsun.

---

### Kategori 5: Website – Path Alias (`@/`) ve Modüller

- **Hata:** `Cannot find module '@/app/App'`, `@/config/api.config`, `@/translations/en`, vb.  
- **Çözüm:**  
  - `website/tsconfig.json` (ve varsa Vite config) içinde `"@/*": ["./src/*"]` veya proje yapınıza uygun path tanımı olmalı.  
  - Dosyalar gerçekten `website/src/...` altında olmalı (örn. `src/app/App.tsx`, `src/config/api.config.ts`).

---

### Kategori 6: Website – Property İsimleri (snake_case vs camelCase)

- **Hata:** `Property 'mediaUrl' does not exist... Did you mean 'media_url'?` (ve `linkUrl` → `link_url`, `displayCount` → `display_count`, `currentDisplays` → `current_displays`).  
- **Çözüm:**  
  - Ya tip tanımında (interface) alanları API’ye uygun şekilde `media_url`, `link_url`, `display_count`, `current_displays` yapıp kodu buna göre güncelleyin,  
  - Ya da API’den gelen objeyi camelCase’e çeviren bir katman kullanın ve tipi camelCase tutun.

---

## 4. Öncelik Sırası Önerisi

1. **App.tsx** – `DatabaseTestScreen` import’unu kaldırın veya dosyayı ekleyin.  
2. **Tema tipi** – Admin ve ilgili bileşenlerde kullanılan tema tipine `text`, `textSecondary`, `error`, `warning`, `success` ekleyin (veya `COLORS.light`/`COLORS.dark` kullanın). Bu, en çok hatayı tek seferde azaltır.  
3. **AdminScreen** – İkon ismini `handshake-outline` yerine geçerli bir Ionicons ismiyle değiştirin.  
4. **expo-ads-admob** – AdInterstitial’da paketi değiştirin veya import’u kaldırın.  
5. **Website** – `tsconfig` path alias ve modül yollarını düzeltin; ardından snake_case/camelCase ve `unknown`/`ErrorLike` hatalarını tek tek veya toplu düzeltin.

---

## 5. Bugbot / Cursor ile Nasıl Kullanılır?

- **“Tüm hataları verir mi?”**  
  Evet. `npm run type-check` çıktısı (veya bu rapor) tüm tespit edilen hataları kapsar.

- **“Çözüm önerisi sunar mı?”**  
  Evet. Yukarıdaki tablolar ve kategoriler çözüm önerisi niteliğindedir. İsterseniz Cursor/Bugbot’a şöyle diyebilirsiniz:  
  - “`App.tsx` içindeki DatabaseTestScreen import’unu kaldır, ekranı navigasyondan da çıkar.”  
  - “Tema tipine `text`, `textSecondary`, `error`, `warning`, `success` ekle; admin bileşenleri buna göre güncellensin.”  
  - “`AdminScreen.tsx` satır 52’deki ikonu geçerli bir Ionicons ismiyle değiştir.”

- **Tek seferde tüm projeyi taratma:**  
  Tarama zaten `npm run type-check` ile tüm projeyi kapsıyor. Bugbot’un “tüm projeyi tek tıkla düzelt” gibi bir modu yok; bu yüzden önce bu rapor veya type-check çıktısına göre kategorilere ayırıp, sonra her kategori için ayrı isteklerle düzeltme yaptırmak en verimli yöntemdir.

---

*Bu rapor, projede çalıştırılan `npm run type-check` çıktısına göre oluşturulmuştur. Yeni değişikliklerden sonra taramayı tekrarlayıp raporu güncelleyebilirsiniz.*
