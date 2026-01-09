# Supabase Hızlı Kurulum

## 1️⃣ Supabase Projesi Oluştur (5 dakika)

### Adım 1: Kayıt Ol
1. https://supabase.com adresine git
2. "Start your project" → GitHub ile giriş yap
3. "New Project" butonuna tıkla

### Adım 2: Proje Ayarları
- **Name:** fan-manager-2026
- **Database Password:** Güçlü bir şifre belirle (kaydet!)
- **Region:** Europe West (Frankfurt) - en yakın bölge
- **Plan:** Free (başlangıç için yeterli)

### Adım 3: API Anahtarlarını Kopyala
Proje oluştuktan sonra:
1. Sol menüden "Settings" → "API"
2. **Project URL** ve **anon/public key** kopyala

### Adım 4: Database Schema'yı Çalıştır
1. Sol menüden "SQL Editor"
2. `supabase/schema.sql` dosyasını aç
3. Tüm içeriği SQL Editor'e yapıştır
4. "Run" butonuna bas

### Adım 5: Credentials'ı Ekle
`src/config/supabase.ts` dosyasını güncelle:

```typescript
const SUPABASE_URL = 'https://XXXXXXXX.supabase.co';  // Buraya Project URL
const SUPABASE_ANON_KEY = 'eyJhbGc...';  // Buraya anon key
```

**✅ Hazır! Artık email kontrolü çalışacak!**

---

## 2️⃣ Geçici Mock Sistemi (Hızlı Test)

Supabase olmadan test etmek için mock kontrol kullanabiliriz.
Ancak gerçek production'da Supabase gerekli.

Hangisini yapmak istersiniz?
- **A:** Supabase projesi oluştur (önerilen)
- **B:** Mock sistemle hızlı test et
