# DNS Ayarları Kurulum Rehberi - TacticIQ.app

## 📍 DNS Ayarları Nereden Yapılır?

DNS ayarları, domain'inizi satın aldığınız yerde (Domain Registrar) yapılır.

## 🔍 Domain Registrar'ınızı Bulma

Domain'inizi nereden satın aldınız?
- **Namecheap** → namecheap.com
- **GoDaddy** → godaddy.com
- **Google Domains** → domains.google.com
- **Cloudflare** → cloudflare.com
- **Türkiye:** Turhost, Natro, İsimtescil, vs.

## 📋 Vercel DNS Kayıtları

Vercel Dashboard'da domain'inizin yanındaki **"Learn more"** linkine tıklayarak DNS kayıtlarını görebilirsiniz.

### Genel Vercel DNS Ayarları:

#### 1. Ana Domain (`tacticiq.app`) için:
**Seçenek A: A Record (IP Adresi)**
- **Type:** `A`
- **Name:** `@` veya boş bırakın
- **Value:** Vercel'in verdiği IP adresi (genellikle `76.76.21.21`)

**Seçenek B: CNAME (Önerilen)**
- **Type:** `CNAME`
- **Name:** `@` veya boş bırakın
- **Value:** `cname.vercel-dns.com`

#### 2. WWW Subdomain (`www.tacticiq.app`) için:
- **Type:** `CNAME`
- **Name:** `www`
- **Value:** `cname.vercel-dns.com`

## 🛠️ Popüler Registrar'lar için Adım Adım

### Namecheap
1. Namecheap.com'a giriş yapın
2. **Domain List** → `tacticiq.app` → **Manage**
3. **Advanced DNS** sekmesine gidin
4. **Add New Record** butonuna tıklayın
5. Aşağıdaki kayıtları ekleyin:
   - Type: `A Record`, Host: `@`, Value: `76.76.21.21`, TTL: Automatic
   - Type: `CNAME Record`, Host: `www`, Value: `cname.vercel-dns.com`, TTL: Automatic
6. **Save All Changes** butonuna tıklayın

### GoDaddy
1. GoDaddy.com'a giriş yapın
2. **My Products** → **Domains** → `tacticiq.app` → **DNS**
3. **Records** sekmesine gidin
4. Mevcut A ve CNAME kayıtlarını düzenleyin veya yeni ekleyin:
   - Type: `A`, Name: `@`, Value: `76.76.21.21`, TTL: 600
   - Type: `CNAME`, Name: `www`, Value: `cname.vercel-dns.com`, TTL: 600
5. **Save** butonuna tıklayın

### Google Domains
1. domains.google.com'a giriş yapın
2. `tacticiq.app` domain'ini seçin
3. **DNS** sekmesine gidin
4. **Custom records** bölümünde:
   - Type: `A`, Name: `@`, Data: `76.76.21.21`
   - Type: `CNAME`, Name: `www`, Data: `cname.vercel-dns.com`
5. Kaydedin

### Cloudflare
1. Cloudflare.com'a giriş yapın
2. Domain'inizi seçin
3. **DNS** → **Records** sekmesine gidin
4. Yeni kayıt ekleyin:
   - Type: `A`, Name: `@`, Content: `76.76.21.21`, Proxy: Off
   - Type: `CNAME`, Name: `www`, Target: `cname.vercel-dns.com`, Proxy: Off
5. Kaydedin

### Türkiye (Turhost, Natro, İsimtescil)
1. Domain yönetim panelinize giriş yapın
2. **DNS Yönetimi** veya **DNS Ayarları** bölümüne gidin
3. Aşağıdaki kayıtları ekleyin/düzenleyin:
   - **A Kaydı:** `@` → `76.76.21.21`
   - **CNAME Kaydı:** `www` → `cname.vercel-dns.com`
4. Değişiklikleri kaydedin

## ⏱️ DNS Yayılım Süresi

- **Minimum:** 5-10 dakika
- **Ortalama:** 1-2 saat
- **Maksimum:** 24-48 saat

## ✅ DNS Doğrulama

DNS ayarlarını yaptıktan sonra:

1. **Vercel Dashboard** → **Domains** → Domain'inizin yanında **"Refresh"** butonuna tıklayın
2. Vercel DNS kayıtlarını kontrol edecek
3. **"Invalid Configuration"** hatası kaybolmalı
4. Domain **"Valid Configuration"** olarak görünmeli

## 🔍 DNS Kontrolü (Terminal)

DNS kayıtlarının yayıldığını kontrol etmek için:

```bash
# Windows PowerShell
nslookup tacticiq.app
nslookup www.tacticiq.app

# Linux/Mac
dig tacticiq.app
dig www.tacticiq.app
```

## 📞 Yardım

- **Vercel DNS Dokümantasyonu:** https://vercel.com/docs/concepts/projects/domains
- **Domain Registrar Desteği:** Domain'inizi satın aldığınız yerin destek ekibiyle iletişime geçin

## ⚠️ Önemli Notlar

1. **Mevcut DNS kayıtlarını silmeyin** - Sadece gerekli olanları ekleyin/düzenleyin
2. **TTL değerini düşük tutun** - İlk kurulumda 300-600 saniye önerilir
3. **Email kayıtlarını koruyun** - Eğer email servisi kullanıyorsanız MX kayıtlarını silmeyin
4. **Subdomain'leri kontrol edin** - Başka subdomain'ler varsa onları da yönetin
