# Vercel Deployment Guide - TacticIQ Website

## 🚀 Vercel'e Geçiş Adımları

### 1. Vercel Hesabı Oluştur
1. https://vercel.com adresine git
2. "Sign Up" ile GitHub hesabınla giriş yap (veya email ile kayıt ol)
3. Ücretsiz plan otomatik olarak aktif olur

### 2. Projeyi Vercel'e Bağla

#### Seçenek A: GitHub Repository'den (Önerilen)
1. Vercel Dashboard'a git: https://vercel.com/dashboard
2. "Add New..." → "Project" tıkla
3. GitHub repository'ni seç: `tacticiq-website`
4. **Root Directory** seçimi:
   - **ÖNEMLİ:** `tacticiq-website` repository'si `git subtree split` ile oluşturulduğu için içerik zaten root'ta
   - Root Directory olarak **`tacticiq-website` (root)** seçin - `website` klasörü yok!
   - Modal'da en üstteki `tacticiq-website` satırındaki radio button'u seçin (✓ işareti)
5. Framework Preset: **Vite** seç (otomatik algılanır)
6. Build Settings:
   - Build Command: `npm run build` (otomatik algılanır)
   - Output Directory: `dist` (otomatik algılanır)
7. Environment Variables (gerekirse):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
8. "Deploy" butonuna tıkla

#### Seçenek B: Vercel CLI ile
```bash
# Vercel CLI'yi yükle
npm i -g vercel

# Website klasörüne git
cd C:\TacticIQ\website

# Vercel'e login ol
vercel login

# Projeyi deploy et
vercel

# Production'a deploy et
vercel --prod
```

### 3. Domain Ayarları (Opsiyonel)
1. Vercel Dashboard → Project → Settings → Domains
2. Custom domain ekle: `tacticiq.app`
3. DNS kayıtlarını güncelle (Vercel'in verdiği IP'leri kullan)

### 4. Otomatik Deploy Ayarları
- GitHub'a push yaptığınızda otomatik deploy olur
- Her branch için preview URL oluşturulur
- Production branch: `main` (veya `master`)

## 📊 Vercel vs Netlify Karşılaştırması

| Özellik | Vercel (Free) | Netlify (Free) |
|---------|---------------|----------------|
| Build Minutes | 6,000/dakika | 300/dakika |
| Bandwidth | 100 GB/ay | 100 GB/ay |
| Function Invocations | 100,000/ay | 125,000/ay |
| Team Members | Sınırsız | 1 |
| Custom Domain | ✅ | ✅ |
| SSL | ✅ Otomatik | ✅ Otomatik |
| CDN | ✅ Global | ✅ Global |

## ⚙️ Vercel Avantajları
- ✅ Daha fazla build dakikası (6,000 vs 300)
- ✅ Daha hızlı build süreleri
- ✅ Daha iyi Next.js/Vite optimizasyonu
- ✅ Ücretsiz plan daha cömert
- ✅ GitHub entegrasyonu daha sorunsuz

## 🔧 Sorun Giderme

### Build Hatası
```bash
# Local'de test et
cd website
npm run build

# Hata varsa düzelt, sonra tekrar deploy et
```

### Environment Variables
Vercel Dashboard → Project → Settings → Environment Variables
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Custom Domain
1. Vercel Dashboard → Project → Settings → Domains
2. Domain ekle
3. DNS kayıtlarını güncelle (A record veya CNAME)

## 📝 Notlar
- `vercel.json` dosyası zaten oluşturuldu
- Vercel otomatik olarak Vite projelerini algılar
- Build cache otomatik olarak yönetilir
- Preview deployments her PR için otomatik oluşturulur

## 🎯 Sonraki Adımlar
1. Vercel hesabı oluştur
2. GitHub repository'yi bağla
3. İlk deploy'u yap
4. Custom domain ekle (opsiyonel)
5. Netlify'dan domain'i kaldır (eğer custom domain kullanıyorsan)
