# Supabase Security Advisor – 7 Kritik Hatanın Giderilmesi

Bu doküman, Supabase’in **Security Advisor** raporundaki 7 kritik hatayı tek migration ile nasıl gidereceğinizi açıklar.

## Yapılan Düzeltmeler

### 1. Security Definer View (4 adet)

Aşağıdaki view’lar **Security Invoker** yapıldı; artık çağıran kullanıcının yetkileriyle çalışıyor ve RLS kurallarına uyuyor:

- `public.v_active_static_teams`
- `public.leaderboard`
- `public.v_club_teams`
- `public.v_national_teams`

### 2. RLS Kapalı Tablolar (3–4 adet)

Aşağıdaki tablolarda **Row Level Security** açıldı ve politikalarla erişim kısıtlandı:

- `public.match_results` – Herkes okuyabilir, sadece service_role yazabilir.
- `public.player_power_scores` – Herkes okuyabilir, sadece service_role yazabilir.
- `public.match_end_snapshots` – Herkes okuyabilir, sadece service_role yazabilir.
- `public.match_and_snapshots` – Varsa aynı mantıkla RLS ve politikalar uygulanır.

## Migration’ı Çalıştırma

### Seçenek A: Supabase Dashboard (önerilen)

1. [Supabase Dashboard](https://supabase.com/dashboard) → projenizi seçin (TacticIQ.app).
2. Sol menüden **SQL Editor** → **New query**.
3. `supabase/migrations/20260306_security_advisor_fixes.sql` dosyasının **tüm içeriğini** kopyalayıp sorgu alanına yapıştırın.
4. **Run** (veya Ctrl+Enter) ile çalıştırın.
5. Hata yoksa “Success” görmelisiniz.

### Seçenek B: Supabase CLI

Proje kökünde:

```bash
supabase db push
```

veya sadece bu migration’ı uygulamak için:

```bash
supabase migration up
```

## Sonrasında

- **Security Advisor**’ı yeniden çalıştırın; bu 7 kritik hata listeden düşmüş olmalı.
- Uygulama ve backend **service_role** veya **anon** key ile çalışmaya devam eder; mevcut okuma/yazma akışları bu politikalarla uyumludur.

## Sorun Çıkarsa

- **“relation does not exist”**: İlgili view veya tablo projede yoksa o satır atlanır; `IF EXISTS` kullanıldığı için diğerleri yine uygulanır.
- **“match_and_snapshots”**: Dashboard’da bu isimle görünüyorsa migration içinde bu tablo için RLS otomatik eklenir; yoksa blok hiçbir şey yapmaz.
