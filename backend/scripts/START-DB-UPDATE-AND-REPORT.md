# DB Güncelleme ve Rapor Nasıl Çalıştırılır

## Neden "ilerleme olmuyor"? / %84'te takılı kaldı

- **db-status-report.txt** sadece **mevcut DB sayılarını** yazar (koç %, kadro %, rating %). Bu sayıların artması için **DB'yi güncelleyen script'lerin** çalışması gerekir.
- **%84'te takılı kalma (API kullanılıyor ama yüzde ilerlemiyor):** Düzeltmeler (02.03.2026):
  1. **run-phased-db-complete.js** artık rating sayısını **tüm kadrolar** üzerinden hesaplıyor (önceden sadece ilk 2000 kadro sayılıyordu → yanlış % ve "ilerleme yok" ile erken çıkış).
  2. **Eksik takım listesi** ve rapor artık **sadece izlenen ligler** (TRACKED_LEAGUE_TYPES) ile çalışıyor: üst lig / profesyonel. **U19, alt lig, amatör** (Crotone U19 vb.) ne raporda sayılır ne de sync edilir; API bu takımlar için tüketilmez. Tüm takımlar için `--all-teams` kullanılabilir.
  3. Rating fazında "ilerleme yok" çıkışı **5 tur** sonra yapılıyor (önceden 2 tur).
  4. **update-all-player-ratings.js**: Kota 0 hesaplansa bile en az 3000 çağrı ile sınırlı bir run yapılabiliyor (kotada hata varsa ilerleme devam etsin diye).
- Rapor script'i (**db-status-report-every-5min.js**) sadece **ölçer ve dosyaya yazar**. Güncelleme yapmaz.
- **İlerleme** = `run-phased-db-complete.js` veya `run-db-sync-and-report.js` çalışınca koç/renk/kadro/rating verisi DB'ye yazılır; bir sonraki rapor blokunda sayılar artar.

## Tüm sayılar 0 ise (Toplam takım: 0, Coach: 0%, …)

Bu durum **API'den veri gelmiyor** demek değildir. Anlamı:

1. **`static_teams` tablosu boş** – Rapor sadece DB'den okur; API'ye istek atmaz. Sayıların artması için önce DB'ye veri yazan bir script çalışmalı.
2. **Backend'deki güncelleme servisleri** (squadSyncService, staticTeamsScheduler) sadece **zaten var olan** takımları günceller; yeni satır eklemez. Yani `static_teams` boşsa hiçbir şey güncellenmez.
3. **Çözüm:** Önce **ilk kurulum sync**'ini çalıştırın; bu script API'den lig/takım listesini çekip `static_teams` (ve isteğe bağlı maçlar) tablosuna yazar. Sonra koç/kadro/rating script'leri ilerleme kaydeder.

### İlk kurulum (static_teams’i doldurmak)

Aşağıdakilerden **birini** bir kez çalıştırın (API kotası kullanır, ~30–60 dk sürebilir):

```powershell
cd c:\TacticIQ\backend
node scripts/full-world-db-sync.js
```

veya daha kısa süre için sadece takım listesi:

```powershell
node scripts/full-db-sync.js
```

Bunlar API'den lig/takım verisini alıp `static_teams` tablosuna yazar. Ardından `run-phased-db-complete.js` veya `run-db-sync-and-report.js` çalıştırdığınızda rapor yüzdeleri artmaya başlar.

## Eski veriler kayıp mı? (Daha önce %84 tamamlanmıştı)

`db-status-report.txt` içinde **25.02.2026 15:42** zamanlı blokta veriler görünüyordu:

- **6620 takım**, Coach %69, Renkler %85, Kadrolar %86, Rating %93, **GENEL %83**
- Yaklaşık **5 dakika sonra** (15:47) aynı rapor tekrar **0** yazdı.

Yani veriler bir ara Supabase’te vardı; sonra tekrar 0’a düştü. Olası nedenler:

1. **Supabase’te veri silindi / sıfırlandı**  
   Projede tablolar truncate edildi, proje restore edildi veya başka bir veritabanı işlemi yapıldı. Veri artık bu projede yok.

2. **İki farklı ortam / farklı .env**  
   Rapor bazen backend sunucusundan (doğru `backend/.env`), bazen de başka bir dizinden (farklı veya eksik .env) çalışıyorsa, biri dolu projeye biri boş/farklı projeye bağlanıyor olabilir. Rapor script’ini **her zaman** `cd c:\TacticIQ\backend` ile backend klasöründen çalıştırın.

3. **Yedek**  
   `backend/backups/` altında eski bir yedek varsa `node scripts/restore-db.js backup-YYYY-MM-DD...` ile geri yüklenebilir. Şu an projede yedek klasörü yok; ileride `node scripts/backup-db.js` ile periyodik yedek almanız iyi olur.

**Ne yapmalı?**

- **Supabase Dashboard** → [Table Editor](https://supabase.com/dashboard/project/jxdgiskusjljlpzvrzau/editor) → `static_teams`, `team_squads` tablolarına bakın. Satır sayısı 0 ise veri bu projede silinmiş demektir; yeniden doldurmak için yukarıdaki “İlk kurulum” adımlarını uygulayın.
- Veri geri gelmeyecekse: `node scripts/full-world-db-sync.js` (veya `full-db-sync.js`) ile tekrar ilk sync’i çalıştırın; ardından koç/kadro/rating script’leriyle yüzdeleri tekrar artırabilirsiniz.

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
