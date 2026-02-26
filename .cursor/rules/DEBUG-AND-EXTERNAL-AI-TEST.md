# Debug Modu ve Dış AI ile Hata Ayıklama / Test

## Cursor’da “debug” ne anlama geliyor?

- **Agent modu:** Kod yazır/değiştirir. Günlük geliştirme ve “bunu yap” dediğiniz işler için.
- **Ask modu:** Sadece okur, açıklar, önerir; dosya değiştirmez. “Bu nasıl çalışıyor?”, “Nerede hata var?” gibi sorular için.
- **Terminal’de debug:** Uygulamayı `npm run web` veya `npx expo start` ile çalıştırıp tarayıcıda F12 → Console’da logları görmek; böylece `console.log` / `logger` çıktılarıyla hata ayıklamak.
- **Breakpoint / debugger:** VS Code/Cursor’da “Run and Debug” (F5) ile uygulamayı çalıştırıp satır satır ilerlemek. Daha çok “bu satırda değişken ne?”, “bu fonksiyon neden çağrılıyor?” için.

Özet: “Debug modu” denince genelde **hata ayıklama** kast edilir (loglar + isteğe bağlı breakpoint). Başka bir “özel mod” yok; Agent/Ask ayrımı ise sadece “kod değiştirsin mi, sadece cevap mı versin” farkı.

---

## Ne zaman debug / test için kullanırsınız?

- Bir davranış yanlış (örn. biten maç 24 saat sonra reyting açılıyor, stats açılması gerekirken).
- Console’da hata görüyorsunuz (kırmızı mesajlar, stack trace).
- API’den gelen veri şüpheli (örn. `elapsed` gelmiyor, snapshot boş).
- Yeni bir AI’a (Gemini, ChatGPT vb.) “bu kodu/hatayı incele” diyeceksiniz.

---

## Gemini / ChatGPT / başka güçlü bir AI’a nasıl hata ayıklattırırsınız?

1. **Hatayı net verin**
   - Ne yaptınız (adımlar).
   - Ne bekliyordunuz.
   - Ne oldu (ekran/console çıktısı, hata mesajı).
   - Mümkünse ilgili kod bloğunu (dosya adı + satır aralığı veya kopyala-yapıştır) ekleyin.

2. **Kuralları da verin**
   - “Bitiş zamanı sadece API’den (timestamp + elapsed), tahmin yok.”
   - “Snapshot sadece FT anında alınır.”
   - İsterseniz `.cursor/rules/match-end-and-snapshot-locked.mdc` içeriğini kopyalayıp yapıştırın; böylece öneriler bu kurallara aykırı olmasın.

3. **Test senaryolarını yazın**
   - Örnek: “Biten maç için elapsed=94, timestamp=… Verilen bu maç objesiyle getMatchEndTimestampSec ne döner? 24 saat sonra tıklanınca reyting mi stats mı açılmalı?”
   - API cevabı örneği (JSON) verirseniz: “Bu cevaba göre snapshot’ta ne saklanmalı, GET /matches/:id ne döndürmeli?”

4. **Cursor’da da aynı senaryoyu kullanın**
   - Composer’da: “Şu senaryoda [adımlar]. Beklenti: [X]. Console’da şu hata var: [log]. Bu kurallara uygun şekilde nerede hata olabilir, düzelt.” diyerek hem analiz hem düzeltme yaptırabilirsiniz.

5. **Otomatik test (ileride)**
   - Jest / React Native Testing Library ile senaryoları kodlayabilirsiniz (örn. “elapsed yoksa getMatchEndTimestampSec null döner”). Bu testleri hem Cursor hem dış AI’a “bu testler fail ediyor, neden?” diye vererek hata ayıklatabilirsiniz.

---

## Özet

- **Debug:** Loglar + isteğe bağlı breakpoint ile hata ayıklama; Cursor’da Agent = değişiklik, Ask = sadece açıklama.
- **Dış AI ile test:** Net adımlar + beklenti + hata/kod + kilitli kurallar (match-end-and-snapshot-locked) paylaşın; senaryo bazlı “bu girişte çıkış ne olmalı?” soruları sorun.
