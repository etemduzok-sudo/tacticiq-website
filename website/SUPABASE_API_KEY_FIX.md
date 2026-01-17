# Supabase API Key Hatası Düzeltme Rehberi

"Invalid API key" hatası alıyorsanız, aşağıdaki adımları takip edin:

## 🔍 Sorun Teşhisi

"Invalid API key" hatası genellikle şu nedenlerden kaynaklanır:
1. API key yanlış veya eksik
2. API key'in süresi dolmuş
3. Supabase projesi değişmiş
4. Environment variable'lar doğru ayarlanmamış

## 🛠️ Çözüm Adımları

### 1. Supabase Dashboard'dan API Key Alın

1. [Supabase Dashboard](https://app.supabase.com) adresine gidin
2. Projenizi seçin: `jxdgiskusjljlpzvrzau` (veya yeni proje adı)
3. **Settings** (⚙️) > **API** sayfasına gidin
4. **Project API keys** bölümünde:
   - **`anon` `public`** key'i kopyalayın
   - ⚠️ **`service_role`** key'ini kullanmayın! (Bu güvenlik riski oluşturur)

### 2. Environment Variable Oluşturun (Önerilen)

**Seçenek A: .env Dosyası Oluşturma**

1. `website` klasöründe `.env` dosyası oluşturun:
   ```bash
   cd website
   touch .env  # Windows: type nul > .env
   ```

2. `.env` dosyasına şunları ekleyin:
   ```env
   VITE_SUPABASE_URL=https://jxdgiskusjljlpzvrzau.supabase.co
   VITE_SUPABASE_ANON_KEY=yeni_api_key_buraya_yapıştırın
   ```

3. **ÖNEMLİ**: `.env` dosyasını **git'e eklemeyin** (zaten `.gitignore`'da olmalı)

**Seçenek B: Kod İçinde Güncelleme (Geçici Çözüm)**

1. `src/config/supabase.ts` dosyasını açın
2. `supabaseAnonKey` değerini Supabase Dashboard'dan aldığınız yeni key ile değiştirin

### 3. Dev Server'ı Yeniden Başlatın

Environment variable'lar sadece server başlangıcında yüklenir:

```bash
# Server'ı durdurun (Ctrl+C)
# Sonra tekrar başlatın
npm run dev
```

### 4. Test Edin

1. Web sitesinde **Kayıt Ol** veya **Giriş Yap** butonuna tıklayın
2. Email ile kayıt/giriş deneyin
3. Console'da hata olup olmadığını kontrol edin

## ✅ Kontrol Listesi

- [ ] Supabase Dashboard'dan `anon` `public` key'i aldınız mı?
- [ ] `.env` dosyası oluşturuldu mu? (veya kod güncellendi mi?)
- [ ] API key doğru kopyalandı mı? (başında/sonunda boşluk yok mu?)
- [ ] Dev server yeniden başlatıldı mı?
- [ ] Browser cache temizlendi mi? (Hard refresh: Ctrl+Shift+R)

## 🔒 Güvenlik Notları

- **Asla** `service_role` key'ini frontend'de kullanmayın!
- Sadece `anon` `public` key'ini kullanın
- `.env` dosyasını git'e commit etmeyin
- Production'da environment variable'ları hosting platform'unuzda (Netlify, Vercel, vb.) ayarlayın

## 📝 Netlify Deployment İçin

Netlify'da environment variable'ları ayarlamak için:

1. Netlify Dashboard > Site Settings > Environment variables
2. **Add a variable** butonuna tıklayın
3. Şu değişkenleri ekleyin:
   - `VITE_SUPABASE_URL` = `https://jxdgiskusjljlpzvrzau.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = Supabase'den aldığınız `anon` `public` key

## 🆘 Hala Çalışmıyorsa

1. **Browser Console'u kontrol edin:**
   - F12 tuşuna basın
   - Console sekmesinde hata mesajlarını inceleyin

2. **Network sekmesini kontrol edin:**
   - F12 > Network sekmesi
   - Kayıt/giriş denemesi yapın
   - `signup` veya `signin` isteklerini inceleyin
   - Response'da ne hatası var bakın

3. **Supabase Dashboard'u kontrol edin:**
   - Settings > API > API keys bölümünde key'lerin aktif olduğundan emin olun
   - Authentication > Settings > Email signup'un aktif olduğundan emin olun

4. **API Key Formatını Kontrol Edin:**
   - API key şu formatta olmalı: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - JWT formatında bir token olmalı

## 📞 Yardım

Sorun devam ederse:
- Supabase Dashboard > Logs sayfasını kontrol edin
- Browser Console'daki tam hata mesajını not edin
- Supabase Community Discord'a başvurabilirsiniz
