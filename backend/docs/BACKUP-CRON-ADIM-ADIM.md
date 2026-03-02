# Günlük DB Yedeği – Adım Adım Kurulum

Bilgisayar kapalıyken yedek almak için bu 3 adımı sırayla uygulayın.

---

## Adım 1: Supabase’de `db-backups` bucket’ı

1. Tarayıcıda açın: **https://app.supabase.com**
2. Projenize tıklayın (TacticIQ projesi).
3. Sol menüden **Storage** seçin.
4. **New bucket** butonuna tıklayın.
5. Ayarlar:
   - **Name:** `db-backups` (tam bu isim)
   - **Public bucket:** **Kapalı** (private kalsın)
6. **Create bucket** ile oluşturun.

✅ Bucket hazır.

---

## Adım 2: API anahtarını kontrol etme

**Not:** Vercel’de sadece web sitesi (frontend) çalışıyor; backend orada yok. `VALID_API_KEYS` **Vercel’de tanımlanmaz**. Backend Render’da çalışıyorsa değişkeni **Render**’da ekleyin.

- **Yerel (backend):** `c:\TacticIQ\backend\.env`  
  Zaten var: `VALID_API_KEYS=tacticiq-db-backup-cron-2026`  
  (İsterseniz kendi gizli anahtarınızla değiştirin.)

- **Render (backend sunucusu):**  
  1. **https://dashboard.render.com** → Backend servisinizi seçin.  
  2. **Environment** → **Environment Variables**.  
  3. **Add Environment Variable:**  
     - Key: `VALID_API_KEYS`  
     - Value: `tacticiq-db-backup-cron-2026` (yerel .env ile aynı olmalı).  
  4. Kaydedin; gerekirse **Manual Deploy** ile yeniden deploy edin.

Cron’da kullanacağınız değer, burada yazdığınız `VALID_API_KEYS` değerinin **aynısı** olacak (Adım 3’te Header’a yapıştıracaksınız).

---

## Adım 3: cron-job.org ile günlük tetikleyici

1. **https://cron-job.org** adresine gidin, gerekirse ücretsiz hesap açın ve giriş yapın.

2. **Create cronjob** (veya “Cronjobs” → “Create cronjob”) tıklayın.

3. **Title:** Örn. `TacticIQ DB Yedek`

4. **URL:** Backend’inizin canlı adresi + endpoint:
   - Yerel test için: `http://localhost:3001/api/admin/backup-db`  
     (Sadece bilgisayar ve backend açıkken çalışır.)
   - Sunucu (Render vb.) için:  
     `https://SIZIN-BACKEND-URL/api/admin/backup-db`  
     Örnek: `https://tacticiq-api.onrender.com/api/admin/backup-db`  
     (Backend’i nerede host ediyorsanız o adresi yazın.)

5. **Request method:** **POST** seçin.

6. **Request headers** bölümüne bir header ekleyin:
   - **Name:** `x-api-key`
   - **Value:** `.env` içindeki `VALID_API_KEYS` değeri (örn. `tacticiq-db-backup-cron-2026`)

7. **Schedule:**
   - **Daily** (günlük)
   - Saat: **04:00** (veya istediğiniz saat)
   - Timezone: **Europe/Istanbul** (veya kendi diliniz)

8. **Create** / **Save** ile kaydedin.

✅ Her gün belirlediğiniz saatte cron, backend’e GET atacak; yedek alınıp Supabase Storage’daki `db-backups` bucket’ına yüklenecek.

---

## Test (isteğe bağlı)

Backend çalışırken yerelde denemek için PowerShell:

```powershell
$headers = @{ "x-api-key" = "tacticiq-db-backup-cron-2026" }
Invoke-RestMethod -Uri "http://localhost:3001/api/admin/backup-db" -Method POST -Headers $headers
```

Başarılıysa yanıtta `success: true` ve `folderName` (örn. `backup-2026-03-02T...`) görünür. Supabase Dashboard → Storage → `db-backups` içinde aynı isimde klasör oluşmuş olmalı.

---

## Özet

| Adım | Ne yaptınız |
|------|-------------|
| 1    | Supabase → Storage → bucket `db-backups` (private) |
| 2    | `.env` / sunucu env’de `VALID_API_KEYS` tanımlı |
| 3    | cron-job.org’da POST, URL + header `x-api-key`, günlük 04:00 |

Bundan sonra bilgisayarınız kapalı olsa da, backend’in çalıştığı sunucu açık olduğu sürece cron her gün yedeği alıp `db-backups`’a yükleyecektir.
