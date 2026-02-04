# TacticIQ – Yedekleme ve Kurtarma Planı

## 1. Millî Takım Turnuvaları ve Maçlar

### ✅ Var mı?
**Evet.** Millî takım turnuvaları ve belirlenmiş maçlar sisteme dahildir.

### Kaynaklar

| Turnuva türü | Lig ID'leri | Script | Kapsam |
|--------------|-------------|--------|--------|
| **Kıta millî takım turnuvaları** | 4, 9, 16, 17, 22, 23 | sync-all-teams-matches | EURO, Copa América, AFC Asian Cup, Africa Cup, Gold Cup, OFC Nations Cup |
| **UEFA Nations League** | 5 | sync-all-teams-matches | Millî takım maçları |
| **FIFA World Cup** | 1 | sync-all-teams-matches | Dünya Kupası |
| **FIFA Club World Cup** | 10 | sync-all-teams-matches | Kulüpler Dünya Kupası |
| **Tarih aralığı maçları** | Tümü | sync-planned-matches | Bugün → sezon sonu tüm maçlar (millî takım dahil) |

`getFixturesByDateRange` tarih aralığındaki tüm maçları döndürür; EURO, Copa América vb. bu aralıktaysa otomatik gelir.

---

## 2. DB’ye Eklenebilecek Eksikler

| Eksik | Açıklama | Öncelik |
|-------|----------|---------|
| ~~teams, leagues yedekte yok~~ | ✅ Düzeltildi – backup/restore’a eklendi | — |
| ~~players tablosu~~ | Oyuncu rating’leri burada; Backup/restore'a eklendi (API + kullanıcı rating'leri geri getirilebilir) | — |
| ~~Otomatik yedek zamanlaması~~ | schedule-backup.bat ile günlük 04:00 | — |
| **Yedek saklama süresi** | Eski yedekleri silme politikası tanımlı değil | 🟢 Düşük |

---

## 3. Mevcut Yedekleme Sistemi

### Ne var?
- **backup-db.js**: Kritik tabloları JSON olarak yedekler
- **restore-db.js**: JSON yedeklerden geri yükler
- **Konum**: `backend/backups/backup-YYYY-MM-DDTHH-MM-SS/`

### Yedeklenen tablolar
- leagues
- teams
- static_teams
- team_squads
- **players** (API + kullanıcı katkılı rating'ler – geri getirilebilir)
- matches
- profiles
- predictions
- squad_predictions
- user_badges

### Çalıştırma
```bash
cd backend
node scripts/backup-db.js
```

---

## 4. Geri Dönüş: Ne Kadar Zamanda, Ne Kadar Geriye?

### Süre
- **Restore süresi**: ~2–10 dakika (kayıt sayısına göre)
- **50K maç**: ~3–5 dakika
- **10K takım + kadro**: ~1–2 dakika

### Ne kadar geriye dönebilirsin?
- **İstediğin yedek tarihine kadar**
- Koşul: O tarihli yedek dosyasının var olması
- Örnek: Günlük yedek alıyorsan → son 7 gün = 7 farklı noktaya dönüş

### Örnek kullanım
```bash
# Mevcut yedekleri listele
node scripts/restore-db.js

# Belirli bir yedekten geri yükle
node scripts/restore-db.js backup-2026-02-02T04-59-53
```

---

## 5. Önerilen Yedekleme Planı

| Sıklık | Zaman | Script | Açıklama |
|--------|-------|--------|----------|
| **Günlük** | 04:00 | backup-db.js | Sync’ten sonra (03:00), tam veri yedeği |
| **Haftalık** | Pazar 05:00 | backup-db.js | Haftalık arşiv (opsiyonel) |
| **Manuel** | İhtiyaç halinde | backup-db.js | Önemli değişiklik öncesi |

### Windows Görev Zamanlayıcı
- **schedule-backup.bat** ile günlük 04:00’de otomatik yedek
- `post-reset-full-sync` 03:00’de çalıştığı için yedek 04:00’te alınır

### Saklama politikası
- Son **7 günlük** yedek yerel tutulur
- İstenirse **30 günlük** arşiv klasörüne taşınır
- Eski yedekleri silen script: `cleanup-old-backups.js` (planlanan)

---

## 6. Sistem Çökerse Adımlar

1. **Yedek seç**: `node scripts/restore-db.js` ile mevcut yedekleri listele
2. **Restore çalıştır**: `node scripts/restore-db.js backup-YYYY-MM-DDTHH-MM-SS`
3. **Doğrula**: Uygulama ve API üzerinden maç / takım / kadro verilerini kontrol et
4. **Gerekirse**: Eksik veriler için `post-reset-full-sync.js` ile yeniden senkronizasyon

---

## 7. Özet

| Soru | Cevap |
|------|-------|
| Millî takım turnuvaları var mı? | Evet (EURO, Copa América, World Cup vb.) |
| Belirlenmiş maçlar var mı? | Evet (sync-planned + sync-all-teams) |
| Eksik ne kaldı? | players yedekte; otomatik yedek planı mevcut |
| Ne kadar sürede geri dönülür? | ~2–10 dakika |
| Ne kadar geriye gidilebilir? | Alınan yedeklerin tarihine kadar |
