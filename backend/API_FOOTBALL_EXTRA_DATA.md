# API-Football – Kullanılabilecek Ek Veriler

API-Football’da **mentalite**, **taktik**, **sağlık** gibi doğrudan alanlar yok; ama aşağıdaki endpoint’ler ve alanlar ek veri olarak kullanılabilir.

---

## 1. Sağlık / Sakatlık (Injuries)

- **Endpoint:** `/injuries` (maç veya takım/lig ile filtrelenebilir)
- **Ne verir:** Maça katılamayacak veya şüpheli oyuncular listesi (sakatlık nedeni, tahmini dönüş vb.)
- **Kullanım:** Oyuncu kartında “Sakat” / “Şüpheli” göstermek, kadro seçiminde uyarı vermek.
- **Not:** Pro planda mevcut; dokümantasyonda parametreler ve response yapısı var.

---

## 2. Teknik Direktör (Coaches)

- **Endpoint:** `/coachs` (zaten `getTeamCoach` ile kullanıyorsunuz)
- **Ne verir:** Takım antrenörü, bazen kariyer bilgisi.
- **Kullanım:** Maç kartında antrenör adı, ileride taktik/forma bilgisi eklenirse kullanılabilir.

---

## 3. Kupa / Kariyer (Trophies)

- **Endpoint:** Trophies endpoint’i (oyuncu veya takım kariyeri)
- **Ne verir:** Oyuncu/takımın kazandığı kupalar, sezonlar.
- **Kullanım:** “Form” veya “deneyim” gibi bir gösterge için dolaylı kullanılabilir; doğrudan mentalite/taktik değil.

---

## 4. Maç İstatistikleri (Fixture / Player Statistics)

- **Fixture statistics:** Şut, pas, top hakimiyeti, faul, kartlar vb. (takım bazlı)
- **Fixture players (maç bazlı oyuncu istatistikleri):** Maçtaki her oyuncunun dakika, gol, asist, pas, dribling, tackle, duels, kart vb.
- **Kullanım:** Zaten rating ve 6 öznitelik (hız, şut, pas, dribling, defans, fizik) bu verilerle hesaplanıyor. Ek olarak:
  - **Sarı/kırmızı kart, faul** → “Disiplin” veya “Agresyon” benzeri bir sayı türetilebilir (kart/faul az = yüksek disiplin).
  - Bu, “mentalite” yerine geçecek ham veri olarak kullanılabilir.

---

## 5. Tahminler (Predictions)

- **Endpoint:** Predictions (maç tahmini, sonuç olasılıkları)
- **Ne verir:** Maç sonucu tahmini, bazen 1X2, alt/üst gol vb.
- **Kullanım:** Uygulama içi “maça ait tahminler” ekranını beslemek için; oyuncu mentalite/taktik değil.

---

## 6. API-Football’da Olmayan Kavramlar

- **Mentalite (Mentality):** API’de böyle bir alan yok. Dolaylı türetim: kart/faul azlığı → “disiplin”, duels won → “mücadele” gibi sayılar üretilebilir.
- **Taktik (Tactics):** API’de oyuncu bazlı “taktik zeka” alanı yok. Takım/maç bazlı formation, strategy API’de varsa (fixture lineups’ta formation var) takım taktiği olarak kullanılabilir; oyuncu seviyesinde “taktik” sayısı yok.
- **Sağlık (Fitness) seviyesi:** Sadece Injuries endpoint’i var (sakat mı / şüpheli mi). “Fitness 1–100” gibi bir skor API’de yok; istersen sakatlık yoksa “Fit”, sakatlık varsa “Sakat”/“Şüpheli” gibi etiket kullanılabilir.

---

## Özet Tablo

| Veri / Kavram      | API-Football’da var mı? | Nasıl kullanılır? |
|--------------------|--------------------------|-------------------|
| Sakatlık / sağlık  | Evet (Injuries)          | Maç/takım için sakat/şüpheli liste; “Fit”/“Sakat” etiketi |
| Antrenör           | Evet (Coachs)            | Zaten kullanılıyor |
| Kupa / kariyer     | Evet (Trophies)          | Deneyim / başarı göstergesi |
| Kart, faul         | Evet (fixture/player stats) | Disiplin / agresyon benzeri türetim |
| Mentalite (sayı)   | Hayır                    | Kart/faul/duels ile dolaylı türetim |
| Taktik (oyuncu)    | Hayır                    | Yok; takım formation kullanılabilir |
| Form (son maçlar)  | Evet (fixtures + stats)  | Son maçlardaki rating/istatistiklerden türetilebilir |

İstersen bir sonraki adımda Injuries endpoint’ini backend’e ekleyip maç/kadro ekranında “sakat/şüpheli” göstermeyi veya kart/faul ile “disiplin” sayısı türetmeyi planlayabiliriz.
