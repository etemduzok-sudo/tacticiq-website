# TacticIQ DB – Ligler, Ülke Ligleri, Yerel Kupalar, Kıta Kupaları, FIFA Kupaları

**Kaynak:** `backend/backups/backup-2026-03-07T02-00-02/leagues.json` (Supabase `leagues` tablosu yedeği)  
**Tarih:** 7 Mart 2026

**Not (Türkiye):** DB’de **Türkiye Kupası** (Ziraat, league id **206**) zaten kayıtlı; Süper Lig (203) ve Super Cup (551) ile birlikte. Favori takım maçları hem API’den (`getFixturesByTeam` + `filterMatches`) hem de artık maç sync script’lerinden (206 eklendi) Türkiye Kupası maçlarını içerebilir.

---

## Özet sayılar

| Kategori | Sayı |
|----------|------|
| **Toplam lig/kupa kaydı** | 405 |
| **Ülke sayısı** (en az 1 lig veya kupa) | 117 |
| **Country = "World"** (kıta/FIFA organizasyonları) | 38 |
| **Yerel kupa olan ülke** | 66 |

---

## 1. Hangi ligler / kayıtlar var?

DB’de **405** adet lig veya kupa kaydı var. Bunların **367** tanesi belirli bir ülkeye ait (`country` ≠ World), **38** tanesi `country: "World"` (kıta veya FIFA organizasyonu).

---

## 2. Kaç ülke ligi var? Hangi ülkeler?

**117 farklı ülke/bölge** için en az bir lig veya kupa kaydı var. Ülkeler (alfabetik):

Albania, Algeria, Andorra, Angola, Antigua-And-Barbuda, Argentina, Armenia, Aruba, Australia, Austria, Azerbaijan, Bahrain, Bangladesh, Barbados, Belarus, Belgium, Benin, Bosnia, Botswana, Brazil, Bulgaria, Burkina-Faso, Burundi, Cambodia, Chile, China, Chinese-Taipei, Colombia, Congo-DR, Costa-Rica, Cyprus, Czech-Republic, Dominican-Republic, Egypt, England, Eswatini, Ethiopia, Faroe-Islands, Finland, France, Gambia, Germany, Ghana, Gibraltar, Greece, Guinea, Hong-Kong, Hungary, Iceland, India, Indonesia, Iran, Iraq, Ireland, Israel, Italy, Ivory-Coast, Jamaica, Japan, Kazakhstan, Kenya, Kosovo, Kuwait, Kyrgyzstan, Latvia, Lebanon, Lesotho, Libya, Macedonia, Malaysia, Mali, Malta, Mauritania, Mexico, Moldova, Myanmar, Netherlands, Nigeria, Northern-Ireland, Norway, Oman, Peru, Portugal, Qatar, Romania, Russia, Rwanda, San-Marino, Saudi-Arabia, Scotland, Senegal, Serbia, Singapore, Slovakia, Slovenia, South-Africa, Spain, Sudan, Suriname, Sweden, Switzerland, Syria, Thailand, Trinidad-And-Tobago, Tunisia, Turkey, USA, Uganda, Ukraine, United-Arab-Emirates, Uruguay, Uzbekistan, Venezuela, Vietnam, Wales, Zambia.

*(Not: “Mock Country” test verisi varsa sayıya dahil edilmemiş olabilir.)*

---

## 3. Hangi ülkelerin yerel kupaları var?

**66 ülke** için yerel kupa (veya süper kupa) kaydı var. Ülke ve kupa isimleri:

| Ülke | Kupalar |
|------|--------|
| Albania | Cup |
| Algeria | Super Cup |
| Andorra | Copa Constitució |
| Argentina | Copa de la Liga Profesional |
| Armenia | Cup |
| Austria | Cup |
| Azerbaijan | Cup |
| Bahrain | King's Cup |
| Bangladesh | Federation Cup |
| Belarus | Super Cup |
| Belgium | Cup |
| Bosnia | Cup |
| Brazil | São Paulo Youth Cup |
| Bulgaria | Super Cup, Cup |
| Cambodia | Hun Sen Cup |
| Chile | Super Cup |
| China | Super Cup |
| Cyprus | Cup |
| Czech-Republic | Cup |
| Egypt | Cup, League Cup |
| England | National League Cup, Premier League Cup, FA Cup, WSL Cup, League Cup, FA Youth Cup |
| Faroe-Islands | Super Cup |
| Finland | Ykköscup, League Cup |
| Germany | Super Cup |
| Ghana | Cup |
| Gibraltar | Rock Cup |
| Greece | Cup |
| Iceland | Reykjavik Cup, Cup, League Cup |
| India | AIFF Super Cup |
| Iran | Hazfi Cup |
| Ireland | FAI Cup, FAI President's Cup |
| Israel | Toto Cup Ligat Al, State Cup |
| Kazakhstan | Super Cup, Cup |
| Kosovo | Cup |
| Kuwait | Crown Prince Cup, Super Cup, Emir Cup |
| Latvia | Super Cup |
| Lebanon | Cup |
| Macedonia | Cup |
| Malaysia | MFL Cup, Malaysia Cup |
| Malta | Super Cup |
| Moldova | Cupa |
| Northern-Ireland | League Cup, Irish Cup |
| Norway | Obos Supercup, NM Cupen |
| Oman | Sultan Cup |
| Portugal | Super Cup |
| Qatar | QSL Cup, Emir Cup |
| Romania | Cupa României |
| Russia | Cup |
| Saudi-Arabia | Super Cup, King's Cup |
| Scotland | FA Cup, SWPL Cup, Challenge Cup |
| Serbia | Cup |
| Singapore | Cup |
| Slovakia | Cup |
| Slovenia | Cup |
| South-Africa | Cup |
| Spain | Copa del Rey, Super Cup |
| Sweden | Svenska Cupen |
| Switzerland | Schweizer Cup |
| Thailand | League Cup, FA Cup |
| Tunisia | Cup |
| Turkey | **Türkiye Kupası** (Ziraat), Super Cup |
| USA | US Open Cup |
| United-Arab-Emirates | Presidents Cup |
| Uruguay | Copa De La Liga Auf |
| Vietnam | Cup |
| Wales | Welsh Cup, League Cup |

---

## 4. Hangi kıta kupaları var?

`country: "World"` olan kayıtlar içinden kıta / konfederasyon organizasyonları (örnekler):

- **UEFA:** UEFA Champions League, UEFA Europa League, UEFA Europa Conference League, UEFA Super Cup, UEFA Nations League, Euro Championship  
- **AFC:** AFC Cup, AFC U23 Asian Cup, AFC Champions League  
- **CAF:** CAF Champions League, CAF Confederation Cup, Africa Cup of Nations, African Nations Championship, African Nations Championship - Qualification  
- **CONCACAF:** CONCACAF Nations League, CONCACAF Champions League, CONCACAF Gold Cup  
- **OFC:** OFC Champions League  
- **Diğer:** Gulf Cup of Nations, AGCFF Gulf Champions League  

*(Tam liste için DB’deki `country = 'World'` ve isimde “Champions”, “Europa”, “Conference”, “Euro”, “AFC”, “CAF”, “CONCACAF”, “OFC”, “Gulf”, “Africa Cup”, “UEFA” geçen kayıtlara bakılabilir.)*

---

## 5. Hangi FIFA kupaları var?

DB’de **FIFA / Dünya** olarak geçen organizasyonlar:

- **World Cup**
- **World Cup - Qualification South America**
- **World Cup - Qualification Europe**
- **FIFA Intercontinental Cup**
- **FIFA Club World Cup**
- **Kings World Cup Nations** (varsa)

---

## Notlar

- **`leagues` tablosu:** API-Football’dan senkron edilen tüm lig/kupa kayıtları; `type` (league/cup) şemada olabilir veya başka bir tabloda tutuluyor olabilir.
- **`static_teams` / `static_leagues`:** Uygulama tarafında “takip edilen” ligler `league_type` ile (domestic_top, domestic_cup, continental, world_cup vb.) ayrılıyor; bu dokümandaki sayılar **gerçek DB’deki tüm `leagues` kayıtlarına** göredir.
- Maç çekilen ligler script’lerde sabit listelenebilir (örn. `sync-matches-direct.js`: Süper Lig, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Europa League, Conference League, Primeira Liga, Eredivisie).

Bu özeti güncellemek için yeni bir backup alıp `leagues.json` üzerinden aynı analiz tekrarlanabilir.
