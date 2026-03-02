# DB Güncelleme ve Rapor Nasıl Çalıştırılır

## Neden "ilerleme olmuyor"?

- **db-status-report.txt** sadece **mevcut DB sayılarını** yazar (koç %, kadro %, rating %). Bu sayıların artması için **DB'yi güncelleyen script'lerin** çalışması gerekir.
- Rapor script'i (**db-status-report-every-5min.js**) sadece **ölçer ve dosyaya yazar**. Güncelleme yapmaz.
- **İlerleme** = `run-phased-db-complete.js` veya `run-db-sync-and-report.js` çalışınca koç/renk/kadro/rating verisi DB'ye yazılır; bir sonraki rapor blokunda sayılar artar.

## 1. Backend (API) – tek instance

```powershell
cd c:\TacticIQ\backend
npm run dev
```

Port 3001’de çalışır. Açık kalsın.

## 2. Rapor (her 5 dk dosyaya yazar)

Ayrı bir PowerShell penceresinde:

```powershell
cd c:\TacticIQ\backend
node scripts/db-status-report-every-5min.js
```

Çıktı: `backend/data/db-status-report.txt` her 5 dakikada güncellenir. **Sayıların değişmesi için 3. adım gerekir.**

## 3. DB güncelleme (ilerleme buradan gelir)

Ayrı bir PowerShell penceresinde:

```powershell
cd c:\TacticIQ\backend
node scripts/run-phased-db-complete.js --delay=1000
```

Bu script koç, renk, kadro ve rating verisini API’den çekip DB’ye yazar. Çalıştığı sürece rapor dosyasındaki yüzdeler artar.

**Not:** `SUPABASE_SERVICE_ROLE_KEY` yoksa script `SUPABASE_ANON_KEY` ile dener. Yazma yetkisi için Supabase Dashboard’dan **Service Role Key** eklemen önerilir (Settings → API).

## Tek komutla (rapor + güncelleme)

`run-db-sync-and-report.js` hem raporu hem `update-coach-colors-squads.js` ile güncellemeyi çalıştırır (run-phased-db-complete’ten farklı bir güncelleme yöntemi):

```powershell
cd c:\TacticIQ\backend
node scripts/run-db-sync-and-report.js
```

## Özet

| Ne yapıyor?              | Script                          | İlerleme?     |
|--------------------------|----------------------------------|---------------|
| Sadece rapor yazar       | db-status-report-every-5min.js  | Hayır (ölçer) |
| DB’yi günceller + rapor  | run-phased-db-complete.js       | Evet          |
| DB’yi günceller + rapor  | run-db-sync-and-report.js       | Evet          |

Backend açık kalsın, ilerleme için 2 veya 3. adımdan birini sürekli çalıştır.
