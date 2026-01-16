# 🎯 TacticIQ Yönetim Paneli - Kullanım Kılavuzu

## 🔐 Giriş Bilgileri

### Admin Şifresi
```
*130923*Tdd*
```

### Nasıl Giriş Yapılır?
1. **Footer'ın en altına scroll edin** (sayfa sonuna kadar)
2. **Copyright yazısının altındaki boşluğa** mouse'u götürün
3. **Gizli admin butonu** belirginleşecek (opacity efektiyle)
4. **Butona tıklayın** ve şifreyi girin
5. **Giriş yapın** ve yönetim paneline erişin

---

## 📊 Yönetim Paneli Menüleri

Admin olarak giriş yaptıktan sonra **sağ alt köşede** kapsamlı bir yönetim paneli açılır:

### 1. 🏠 Dashboard (Ana Sayfa)
**Genel sistem durumu ve önemli metrikler:**
- **Hızlı İstatistikler:**
  - Toplam Ziyaretçi: 24,521 (+12.5%)
  - Aktif Kullanıcılar: 3,847 (+8.2%)
  - Aylık Gelir: €12,450 (+23.1%)
  - Dönüşüm Oranı: 12.4% (+2.3%)

- **Son Aktiviteler:**
  - Yeni kayıtlar
  - Premium satışlar
  - Blog yayınları
  - Sistem güncellemeleri

### 2. 📊 Analytics (Detaylı Analiz)
**Kapsamlı kullanım istatistikleri:**

- **Coğrafi Dağılım:**
  - Türkiye: %45
  - Almanya: %25
  - İngiltere: %15
  - Fransa: %10
  - Diğer: %5

- **Ziyaret Saatleri:**
  - Gece (00:00-06:00): %10
  - Sabah (06:00-12:00): %25
  - Öğlen (12:00-18:00): %40
  - Akşam (18:00-00:00): %35

- **Kullanıcı Segmentleri:**
  - Free Users: %70
  - Premium Monthly: %20
  - Premium Yearly: %10

- **Büyüme Metrikleri:**
  - Yeni kayıtlar, aktif kullanıcılar
  - Churn rate, LTV değerleri

### 3. 👥 Kullanıcılar
**Kullanıcı yönetimi ve istatistikler:**

- **Kullanıcı İstatistikleri:**
  - Toplam Kullanıcı: 12,458
  - Premium Kullanıcı: 3,847
  - Bugün Aktif: 1,234

- **Son Kayıt Olanlar:**
  - Kullanıcı listesi (isim, email, plan, durum)
  - Free / Premium ayırımı
  - Aktif / Pasif durumları

- **Yeni Kullanıcı Ekleme:** Buton ile hızlı erişim

### 4. 📝 İçerik Yönetimi
**Blog, sayfa ve medya içerikleri:**

- **İçerik Kategorileri:**
  - Blog Yazıları: 24 adet
  - Medya: 156 adet
  - Etiketler: 42 adet
  - Zamanlanmış: 8 adet

- **Son Yayınlanan İçerikler:**
  - İçerik başlığı, türü
  - Yayın durumu (Yayında / Taslak / Zamanlandı)
  - Yayın tarihi

- **Yeni İçerik Ekleme:** Hızlı oluşturma butonu

### 5. ⚙️ Sistem Ayarları
**Platform yapılandırması:**

- **Genel Ayarlar:**
  - Site adı, URL
  - Varsayılan dil
  - Zaman dilimi

- **E-posta Ayarları:**
  - SMTP sunucu bilgileri
  - Gönderici adresi
  - Günlük email limiti

- **Bildirim Ayarları:**
  - Yeni kayıt bildirimi ✅
  - Premium satış bildirimi ✅
  - Hata bildirimleri ✅
  - Günlük rapor ⬜

- **Veritabanı:**
  - Veritabanı boyutu: 2.4 GB
  - Son yedekleme tarihi
  - Manuel yedekleme / Optimizasyon butonları

### 6. 📋 Sistem Logları
**Aktivite ve hata kayıtları:**

- **Log Filtreleme:**
  - Tümü / Bilgi / Uyarı / Hata / Kritik

- **Log Kayıtları:**
  - Kullanıcı girişleri
  - Premium abonelikler
  - API uyarıları
  - Blog yayınları
  - Sistem güncellemeleri
  - Veritabanı işlemleri

---

## 🎛️ Panel Kontrolleri

### Minimize / Maximize
- **Minimize:** Panel sağ köşede küçük bir Shield icon'a dönüşür
- **Maximize:** Icon'a tıklayarak tam paneli açabilirsiniz

### Çıkış Yapma
- Panelin sağ üst köşesindeki **X** butonuna tıklayın
- Admin paneli kaybolur
- Footer'daki ziyaretçi sayacı gizlenir
- Normal kullanıcı moduna dönersiniz

---

## 🔍 Özel Özellikler

### Gizli Ziyaretçi Sayacı
Admin olarak giriş yaptığınızda:
- ✅ Footer'da detaylı ziyaretçi istatistikleri görünür
- ✅ Toplam ziyaretçi, aktif kullanıcılar
- ✅ Günlük ve aylık veriler

Normal kullanıcılar bu bilgileri **asla göremez**.

### Responsive Tasarım
Admin paneli tüm cihazlarda düzgün çalışır:
- 💻 Desktop: Tam genişlikte panel
- 📱 Tablet: Optimize edilmiş düzen
- 📱 Mobile: Scrollable içerik

---

## 🔒 Güvenlik ve Gizlilik

### Admin Butonu Gizliliği
- **Normal durumda:** %5 opacity (neredeyse görünmez)
- **Mouse hover:** %100 opacity (tam görünür)
- **Konum:** Footer'ın en altı (en az beklenen yer)

### Oturum Yönetimi
- Giriş bilgisi `localStorage`'da saklanır
- Sayfa yenilense bile admin olarak kalırsınız
- Çıkış yapana kadar oturum devam eder

### Şifre Değiştirme
Şifreyi değiştirmek için:
1. `/src/contexts/AdminContext.tsx` dosyasını açın
2. `ADMIN_PASSWORD` değişkenini düzenleyin
3. Yeni şifrenizi kaydedin

```typescript
const ADMIN_PASSWORD = 'YeniGüçlüŞifreniz';
```

---

## 📈 Gelecek Özellikler

### Yakında Eklenecekler
- [ ] Grafik ve chart'lar (Recharts entegrasyonu)
- [ ] Export fonksiyonu (CSV, PDF)
- [ ] Email raporları (Günlük/Haftalık)
- [ ] Push bildirimler

### Supabase Entegrasyonu İle
- [ ] Gerçek kullanıcı veritabanı
- [ ] Live ziyaretçi tracking
- [ ] Rol tabanlı erişim (RBAC)
- [ ] Çoklu admin kullanıcıları

---

## 💡 İpuçları

1. **Hızlı Erişim:** Admin butonu üzerine 2-3 saniye hover yapın
2. **Minimize:** Uzun çalışmalarda paneli küçültün, ihtiyaçta açın
3. **Log Takibi:** Düzenli olarak sistem loglarını kontrol edin
4. **Yedekleme:** Veritabanı yedeklemesini düzenli yapın

---

## 🆘 Sorun Giderme

### Giriş Yapamıyorum
- Şifrenin doğru olduğundan emin olun: `*130923*Tdd*`
- Büyük/küçük harf duyarlı, özel karakterlere dikkat
- Konsol hatalarını kontrol edin (F12)

### Panel Görünmüyor
- Admin olarak giriş yaptığınızdan emin olun
- Sayfayı yenileyin (F5)
- localStorage'ı kontrol edin: `tacticiq_admin` = "true"

### Sayaç Görünmüyor
- Admin olarak giriş yaptıysanız görünür olmalı
- Footer'a scroll edip kontrol edin
- Console'da hata var mı bakın

---

## 📞 Destek

Teknik destek ve sorularınız için:
- **Email:** admin@tacticiq.app
- **Acil Durum:** support@tacticiq.app

---

## 📚 Dokümantasyon

Detaylı teknik dokümantasyon:
- `/ADMIN_GUIDE.md` - Kapsamlı kullanım kılavuzu
- `/ADMIN_SYSTEM_SUMMARY.md` - Sistem özeti

---

**TacticIQ Admin Panel v1.0**  
*Güvenli, Hızlı, Profesyonel* 🛡️
