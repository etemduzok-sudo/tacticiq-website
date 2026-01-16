# 🔑 Giriş Bilgileri

**Admin Şifresi:**
```
*130923*Tdd*
```

**Nasıl Giriş Yapılır:**
1. Footer'ın en altına scroll edin (copyright yazısının altı)
2. Mouse'u o alana götürün, gizli admin butonu belirginleşir
3. Admin butonuna tıklayın
4. Şifreyi girin: `*130923*Tdd*`
5. "Giriş Yap" butonuna basın
6. Artık admin panelini ve tüm istatistikleri görebilirsiniz!

---

## Admin Panel Özellikleri

### 1. İstatistikler (Analytics)
Admin olarak giriş yaptığınızda görebileceğiniz özellikler:

#### Ziyaretçi Sayacı
- **Toplam Ziyaretçi**: Tüm zamanların toplam ziyaretçi sayısı
- **Aktif Kullanıcılar**: Şu anda sitede olan kullanıcılar
- **Bugün**: Bugünkü ziyaretçi sayısı
- **Bu Ay**: Bu ayki toplam ziyaretçi sayısı

#### Ek Metrikler
- **Dönüşüm Oranı**: Ziyaretçilerin premium'a dönüşüm yüzdesi
- **Ortalama Süre**: Kullanıcıların sitede geçirdiği ortalama süre

### 2. Ziyaretçi Sayacının Görünürlüğü
- Ziyaretçi sayacı **sadece admin kullanıcılar** tarafından görülebilir
- Normal ziyaretçiler footer'da sayacı göremez
- Admin olarak giriş yaptığınızda footer'da sayaç otomatik görünür

### 3. Admin Panel Konumu
- Admin paneli **sağ alt köşede** sabit bir kart olarak görünür
- Sadece admin olarak giriş yaptığınızda görünür
- 3 farklı sekme içerir:
  - **İstatistikler**: Ziyaretçi verileri ve metrikler
  - **Kullanıcılar**: Kullanıcı yönetimi (Supabase gerektirir)
  - **Ayarlar**: Site ayarları

---

## Çıkış Yapma

1. Sağ üst köşedeki **"Çıkış"** butonuna tıklayın
2. Admin paneli otomatik olarak kaybolur
3. Ziyaretçi sayacı footer'dan gizlenir

---

## Teknik Detaylar

### Admin Durumu Yönetimi
- Admin girişi `localStorage` kullanılarak saklanır
- Sayfa yenilendiğinde admin durumu korunur
- Çıkış yapıldığında localStorage temizlenir

### Dosya Yapısı
```
/src
  /contexts
    AdminContext.tsx          # Admin durumu yönetimi
  /app/components
    /admin
      AdminLoginDialog.tsx    # Giriş dialog komponenti
      AdminPanel.tsx          # Ana admin panel
    Header.tsx                # Admin buton entegrasyonu
    /sections
      Footer.tsx              # Ziyaretçi sayacı entegrasyonu
```

### Context API Kullanımı
```typescript
import { useAdmin } from '@/contexts/AdminContext';

// Komponent içinde
const { isAdmin, login, logout } = useAdmin();
```

---

## Gelecek Geliştirmeler

### Supabase Entegrasyonu
Gerçek kullanıcı yönetimi ve veri saklama için Supabase eklenmesi önerilir:
- Gerçek kullanıcı kimlik doğrulama
- Veritabanı tabanlı ziyaretçi izleme
- Rol tabanlı erişim kontrolü (RBAC)
- Analytics data toplama

### Önerilen Özellikler
- [ ] Grafik ve chart'lar (ziyaretçi trendleri)
- [ ] Email bildirimler (günlük/haftalık raporlar)
- [ ] A/B test yönetimi
- [ ] İçerik yönetim sistemi (CMS)
- [ ] Kullanıcı davranış analizi
- [ ] SEO metrikleri

---

## Sık Sorulan Sorular

**S: Admin şifremi unuttum, ne yapmalıyım?**
C: `/src/contexts/AdminContext.tsx` dosyasında `ADMIN_PASSWORD` değişkenini kontrol edin.

**S: Birden fazla admin kullanıcısı ekleyebilir miyim?**
C: Şu anki implementasyon tek bir şifre kullanıyor. Çoklu kullanıcı desteği için Supabase entegrasyonu gerekir.

**S: Ziyaretçi verileri gerçek mi?**
C: Hayır, şu anda mock (sahte) veri kullanılıyor. Gerçek veriler için Google Analytics veya Supabase entegrasyonu gerekir.

**S: Mobile cihazlarda admin panel nasıl görünür?**
C: Admin panel responsive tasarıma sahiptir ve mobil cihazlarda da düzgün çalışır.

---

## Güvenlik Önerileri

1. **Şifreyi Paylaşmayın**: Admin şifresini kimseyle paylaşmayın
2. **HTTPS Kullanın**: Production'da mutlaka HTTPS kullanın
3. **Düzenli Şifre Değişimi**: Şifreyi düzenli aralıklarla değiştirin
4. **2FA Ekleyin**: İleriki versiyonlarda iki faktörlü kimlik doğrulama ekleyin
5. **IP Kısıtlaması**: Sadece belirli IP adreslerinden erişime izin verin

---

## Destek

Sorularınız için: **admin@tacticiq.app**