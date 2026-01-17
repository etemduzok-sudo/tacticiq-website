# Hızlı API Key Düzeltme

## 🚨 "Invalid API key" Hatası

Bu hatayı düzeltmek için:

### 1. Supabase Dashboard'dan Yeni Key Alın

1. [Supabase Dashboard](https://app.supabase.com) → Projeniz
2. **Settings** (⚙️) > **API** sayfasına gidin
3. **Project API keys** bölümünde:
   - **`anon` `public`** key'i bulun
   - **Reveal** butonuna tıklayın
   - Key'i kopyalayın (tamamını, başında/sonunda boşluk olmadan)

### 2. Key'i Güncelleyin

**Seçenek A: .env Dosyası (Önerilen)**

1. `website` klasöründe `.env` dosyası oluşturun
2. İçine şunu yazın:
   ```
   VITE_SUPABASE_URL=https://jxdgiskusjljlpzvrzau.supabase.co
   VITE_SUPABASE_ANON_KEY=buraya_yeni_key_yapıştırın
   ```
3. Dev server'ı **durdurup yeniden başlatın** (Ctrl+C, sonra `npm run dev`)

**Seçenek B: Kod İçinde (Hızlı Test)**

1. `website/src/config/supabase.ts` dosyasını açın
2. 6. satırdaki `supabaseAnonKey` değerini yeni key ile değiştirin
3. Dev server'ı **yeniden başlatın**

### 3. Test Edin

1. Hard refresh yapın (Ctrl+Shift+R)
2. Email ile kayıt olmayı deneyin
3. Console'da hata olup olmadığını kontrol edin

## ⚠️ Önemli

- Key formatı: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` gibi JWT token olmalı
- `sb_publishable_` ile başlayan key'ler eski format, artık geçerli değil
- Yeni key'ler `eyJ...` ile başlar

## 🔍 Key Nerede?

Supabase Dashboard:
```
Settings > API > Project API keys > anon public
```
