# DB Yedeği – Bilgisayar Kapalıyken (Sunucu + Cron)

Backend’i bir sunucuda (Render, Vercel, Railway vb.) çalıştırıyorsanız, yedek **sizin bilgisayarınız açık olmadan** alınabilir: harici bir cron servisi her gün backend’deki yedek API’sini tetikler, yedek Supabase Storage’a yazılır.

## 1. Supabase’de bucket oluşturma

1. [Supabase Dashboard](https://app.supabase.com) → projeniz → **Storage**.
2. **New bucket** → isim: `db-backups`.
3. **Public bucket** kapalı (private) kalsın.
4. Oluştur.

(İsterseniz RLS ile sadece service role erişebilsin; varsayılan ayarlar yeterli.)

## 2. Backend’de API anahtarı

**Vercel’de sadece web sitesi çalışıyorsa:** Backend orada değildir; `VALID_API_KEYS` Vercel’de tanımlanmaz. Backend Render (veya başka bir sunucu) üzerinde çalışıyorsa değişkeni **o sunucunun** ortamında tanımlayın.

- **Yerel:** `backend/.env` → `VALID_API_KEYS=tacticiq-db-backup-cron-2026` (veya kendi anahtarınız).
- **Render:** Dashboard → Backend servisi → **Environment** → `VALID_API_KEYS` = aynı değer. Sonra gerekirse yeniden deploy.

Cron isteğinde bu anahtarı `x-api-key` header’ında göndereceksiniz.

## 3. Cron servisi (bilgisayar kapalıyken tetikleme)

Backend’in canlı URL’i örnek: `https://your-app.onrender.com` (veya kullandığınız domain).

**cron-job.org (ücretsiz) ile:**

1. [cron-job.org](https://cron-job.org) → hesap aç → **Create cronjob**.
2. **URL:** `https://YOUR-BACKEND-URL/api/admin/backup-db`  
   (örn. `https://tacticiq-backend.onrender.com/api/admin/backup-db`)
3. **Request method:** POST.
4. **Headers:**  
   - Name: `x-api-key`  
   - Value: `VALID_API_KEYS` içine yazdığınız anahtar
5. **Schedule:** Her gün 04:00 (veya istediğiniz saat). Timezone’u ayarlayın.
6. Kaydedin.

Böylece her gün belirlediğiniz saatte cron, backend’e POST atar; backend yedeği alıp Supabase Storage’daki `db-backups` bucket’ına yükler. **Sizin bilgisayarınızın açık olması gerekmez.**

## 4. Yedeği indirme / geri yükleme

- **Storage’dan indirme:** Supabase Dashboard → Storage → `db-backups` → ilgili `backup-YYYY-MM-DDTHH-MM-SS` klasörü → dosyaları indir.
- **Yerelde geri yükleme:** İndirdiğiniz dosyaları `backend/backups/backup-YYYY-MM-DDTHH-MM-SS/` içine koyup:
  ```bash
  cd backend
  node scripts/restore-db.js backup-YYYY-MM-DDTHH-MM-SS
  ```

## Özet

| Ne | Nerede |
|----|--------|
| Yedek alan | Backend (Render/Vercel vb.) |
| Tetikleyen | cron-job.org (veya benzeri) – bilgisayar kapalı olsa da çalışır |
| Yedeğin yazıldığı yer | Supabase Storage, bucket: `db-backups` |
| Kimlik doğrulama | `x-api-key` header = `VALID_API_KEYS` içindeki değer |
