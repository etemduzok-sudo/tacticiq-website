# tacticiq.supabase.co — Sonraki Adımlar (Senin Çalıştırman Gerekenler)

Google callback’i ekledin. Sırada:

---

## 1. Supabase’e giriş (bir kez)

Terminal (PowerShell veya CMD) aç, proje klasörüne git, çalıştır:

```bash
cd c:\TacticIQ
npx supabase login
```

Tarayıcı açılacak; Supabase hesabınla giriş yap. “Success” görünce terminale dön.

---

## 2. Subdomain müsait mi kontrol et

```bash
npx supabase vanity-subdomains --project-ref jxdgiskusjljlpzvrzau check-availability --desired-subdomain tacticiq --experimental
```

“Available” / uygun derse devam et. Başka isim denemek istersen `tacticiq` yerine örn. `tacticiq-app` yaz.

---

## 3. Vanity subdomain’i aktif et

```bash
npx supabase vanity-subdomains --project-ref jxdgiskusjljlpzvrzau activate --desired-subdomain tacticiq --experimental
```

Başarılı olunca **tacticiq.supabase.co** kullanıma hazır olur.

---

## 4. Projede URL’leri güncelle

Tüm ortamlarda Supabase URL’ini değiştir:

- **Eski:** `https://jxdgiskusjljlpzvrzau.supabase.co`
- **Yeni:** `https://tacticiq.supabase.co`

Key’ler (anon key vb.) aynı kalır; sadece URL.

- Website (Vite): `.env` / `.env.local` → `VITE_SUPABASE_URL=https://tacticiq.supabase.co`
- Mobil (Expo): ilgili `.env` veya config → Supabase URL = `https://tacticiq.supabase.co`
- Backend: varsa `SUPABASE_URL=https://tacticiq.supabase.co`

---

## 5. Test

Uygulama veya web’de “Google ile giriş” dene. Giriş ekranında **tacticiq.supabase.co** görünmeli.

Bu adımları bitirince vanity subdomain tamam demektir.
