# Bildirim Ayarları – Mevcut Durum ve E-posta Altyapısı

## Ekranda Görünenler (Profil → Ayarlar)

| Ayar | Kayıt | E-posta gönderimi |
|------|--------|-------------------|
| **E-posta Bildirimleri** | ✅ `user_profiles.notifications_enabled` (Supabase) | ❌ Yok – tercih kaydediliyor ama bu tercihe göre e-posta atan job yok |
| **Haftalık Özet** | ❌ Sadece yerel state (TODO: tabloya kaydet) | ❌ Yok – haftalık özet atan job yok |
| **Kampanya Bildirimleri** | ❌ Sadece yerel state (TODO) | ❌ Yok |
| **Canlı Bildirimler** | Tarayıcı/cihaz izni (client) | Push bildirimleri – uygulama tarafında ayrı implementasyon gerekir |

## Backend’de Olanlar

- **E-posta gönderme:** `backend/services/emailService.js` (nodemailer) – şu an kullanılanlar:
  - Şifre sıfırlama
  - Hoş geldin maili
  - Admin giriş bildirimi
- **Profil alanı:** `user_profiles.notifications_enabled` (boolean) – “E-posta bildirimleri” toggle’ı buna yazılıyor.

## Eksik Olan (E-posta Bildirimleri İçin)

1. **Maç sonuçları / tahmin hatırlatması**
   - Maç bittiğinde (veya belirli saatte) tetiklenecek bir job.
   - `notifications_enabled = true` ve ilgili maçı takip eden kullanıcıları bulup, her biri için e-posta (ör. maç özeti + tahmin sonucu) göndermek.
   - Örnek: Cron veya Supabase Edge Function / backend job.

2. **Haftalık özet**
   - Tercihin kalıcı kaydı: `user_profiles` veya ayrı bir `notification_settings` tablosunda `weekly_summary_enabled` (ve gerekirse gün/saat).
   - Her Pazartesi (veya seçilen günde) çalışacak bir job.
   - Job: `weekly_summary_enabled = true` kullanıcıları alır, son 7 gün tahmin/performans verisini hesaplar, `emailService.sendEmail` ile HTML özet maili atar.

3. **Kampanya bildirimleri**
   - Tercih alanı + kampanya içeriğini hazırlayan süreç + toplu e-posta job’ı (ayrı tasarım gerekir).

## Özet

- **“E-posta bildirimlerine abone olunca e-posta gönderecek miyiz?”**  
  Şu an **hayır**. Tercih sadece kaydediliyor; bu tercihe göre e-posta tetikleyen bir iş yok.

- **“Haftalık özet göndermek için altyapı lazım mı?”**  
  **Evet.** Hem haftalık özet tercihini kalıcı kaydetmek hem de haftada bir çalışacak bir job (cron / Edge Function) ve bu job’ın `emailService` ile özet maili atması gerekir.

E-posta altyapısı (nodemailer + `sendEmail`) mevcut; eksik olan, bu ayarları okuyup doğru zamanda doğru içerikle mail atacak job’lar ve gerekirse ek profil/notification tablolarıdır.
