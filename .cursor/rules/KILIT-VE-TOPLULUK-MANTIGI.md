# Kilit ve Topluluk Verisi Mantığı – Basit Özet

Bu doküman, **locked-components.mdc** içindeki kilit/topluluk kurallarının ekranlar ve akış üzerinden özetidir. Orijinal mantık burada tek sayfada toplanıyor.

---

## Ne zaman tahminler kilitlenir? (4 durum)

Kurallara göre tahminler **sadece** şu 4 durumda kilitlenir:

| # | Durum | Nerede / Nasıl |
|---|--------|-----------------|
| 1 | Maç canlı | Maç başladığında otomatik |
| 2 | Maç bitti | Maç bittiğinde otomatik |
| 3 | "Topluluk Verilerini Gör"e basıldı **ve gerçek topluluk verisi mevcut** | Tahmin sekmesi → Kaydet sonrası modal veya saha içi buton; sadece `hasRealCommunityData` true iken kilitlenir |
| 4 | "Gerçek Kadroyu Gör"e basıldı **(ilk 11 API'dan gelmişse)** | Gerçek kadro butonu (maç başlamadan önce); ilk 11 belli değilse buton yok, kilit yok |

**Önemli:** Genel "Tahminleri Kaydet" butonu tahminleri **kaydeder** ama (maç başlamadıysa) **kilitlemez**. Kilit = yukarıdaki 4 durumdan biri. Topluluk verisi "yeterli değil" / "oluştuğunda görülecek" iken veya gerçek ilk 11 belli değilken tahminler **kalıcı kilitlenmez**.

---

## `hasViewedCommunityData` ne demek?

- **Anlamı:** "Bu maç için kullanıcı **Topluluk Verilerini Gör**'e bastı mı?"
- **True olunca:** Tahminler **kalıcı kilitli** kabul edilir; kilit butonu açılamaz (tasarım gereği).

---

## Bu değer nerede tutuluyor?

| Yer | Ne var? |
|-----|---------|
| **MatchDetail** (maç detay sayfası) | `hasViewedCommunityData` state (true/false). Bu sayfa açılınca bir fonksiyonla dolduruluyor. |
| **AsyncStorage** | Maçın tahmin kaydında `hasViewedCommunityData: true` alanı. Bir kez "Topluluk Verilerini Gör"e basılınca bu alan yazılıyor ve kalıcı kalıyor. |

---

## Sayfa açılınca ne oluyor? (Akış)

1. Kullanıcı maça tıklar → **MatchDetail** açılır.
2. **checkPredictions** fonksiyonu çalışır (maç detay sayfasının kendi fonksiyonu).
3. Bu fonksiyon AsyncStorage'dan **bu maçın** tahmin kaydını okur (key: `tacticiq-predictions-{matchId}` veya takıma göre `...-{matchId}-{teamId}`).
4. Kayıtta `hasViewedCommunityData === true` varsa → MatchDetail içinde `setHasViewedCommunityData(true)` çağrılır.
5. Bu state hem **Tahmin** sekmesine (MatchPrediction) hem **Kadro** sekmesine (MatchSquad) prop olarak gider; ikisinde de kilit butonu "açılamaz" davranışı gösterir.

Yani: **Bu maç için true olmasının tek nedeni**, daha önce (bu veya eski bir oturumda) bu maç için "Topluluk Verilerini Gör"e basılmış ve o anda storage'a `hasViewedCommunityData: true` yazılmış olmasıdır. Kod ekstra "bu maç için topluluk verisi gerçekten var mı?" kontrolü yapmıyor; sadece storage'daki bu bayrağa bakıyor.

---

## "Topluluk Verilerini Gör" / "Bağımsız Devam Et" nerede?

- **Ekran:** Maç detay → **Tahmin** sekmesi (**MatchPrediction**).
- **Ne zaman çıkar:** "Tahminleri Kaydet"e basıp kayıt başarıyla bitince.
- **Modal:** "Tahminler Kaydedildi! Şimdi ne yapmak istersiniz?"  
  - **Topluluk Verilerini Gör** → Tahminler kalıcı kilitlenir, `hasViewedCommunityData = true` olur ve storage'a yazılır.  
  - **Bağımsız Devam Et** → Tahminler kilitlenmez; maç başlayana kadar düzenlenebilir, maç başlayınca otomatik kilit + topluluk açılır + %10 bonus.

Bu modal `showCommunityConfirmModal` state'i ile gösterilir; kayıt sonrası `if (!hasViewedCommunityData) setShowCommunityConfirmModal(true)` ile açılır.

---

## İki favori takım maçında fark var mı?

- **MatchDetail** içinde **iki favori** maç için `checkPredictions(homeId, awayId, true)` çağrılıyor; bu dalda artık **hasViewedCommunityData** da her iki takımın storage'ından okunup set ediliyor (hangisi true ise).
- **Tek favori** maçta ise tek takımın tahmin key'i okunuyor ve oradan `hasViewedCommunityData` alınıp state'e yazılıyor.

---

## Kilit butonları (Tahmin + Kadro)

- **Tahmin sekmesi:** Soldaki kilit ikonu → `handleLockToggle`. Topluluk görüldüyse veya maç canlı/bitmişse kilit **açılamaz** ama buton **disabled değil**; tıklanınca "Neden açılamıyor?" popup'ı gösterilir.
- **Kadro sekmesi:** Formasyonun yanındaki kilit → Topluluk görüldüyse ve kadro kilitliyse kilit **açılamaz** ama buton tıklanabilir; tıklanınca "Kalıcı Kilit" açıklaması gösterilir.

---

## Özet tablo

| Kavram | Nerede | Ne işe yarıyor |
|--------|--------|-----------------|
| `hasViewedCommunityData` | MatchDetail state + AsyncStorage (tahmin kaydı) | "Topluluk Verilerini Gör"e basıldı mı? → Kalıcı kilit |
| `checkPredictions` | MatchDetail | Sayfa açılınca storage'dan tahmin + hasViewedCommunityData okuyup state'i doldurur |
| `showCommunityConfirmModal` | MatchPrediction | Kaydet sonrası "Topluluk Verilerini Gör" / "Bağımsız Devam Et" modal'ı |
| Kilitlenme (4 durum) | locked-components.mdc | Maç canlı / bitti / Topluluk Verilerini Gör / Gerçek Kadroyu Gör |

Bu mantık **locked-components.mdc** ve **three-field-view.mdc** ile uyumludur; değişiklik yaparken bu kurallar referans alınmalıdır.
