# TacticIQ – Oyun İçin İlgilendiğimiz Tüm Turnuvalar (Eksiksiz Liste)

Bu belge, oyunda maç/tahmin/istatistik için dahil ettiğimiz **tüm ligler**, **ülke içi kupalar**, **uluslararası kulüp kupaları** ve **milli takım turnuvalarını** tek listede toplar. ID’ler API-Football (api-sports.io) ile uyumludur.

---

## 1. Ulusal ligler (ülke içi)

| Ülke      | Turnuva adı              | API ID | Öncelik |
|-----------|--------------------------|--------|--------|
| Türkiye   | Süper Lig                | 203    | 1      |
| Türkiye   | TFF 1. Lig               | 204    | 2      |
| İngiltere | Premier League           | 39     | 1      |
| İngiltere | Championship             | 40     | 2      |
| İspanya   | La Liga                  | 140    | 1      |
| İspanya   | La Liga 2                | 141    | 2      |
| Almanya   | Bundesliga               | 78     | 1      |
| Almanya   | 2. Bundesliga            | 79     | 2      |
| İtalya    | Serie A                  | 135    | 1      |
| İtalya    | Serie B                  | 136    | 2      |
| Fransa    | Ligue 1                  | 61     | 1      |
| Fransa    | Ligue 2                  | 62     | 2      |
| Hollanda  | Eredivisie               | 88     | 1      |
| Portekiz  | Primeira Liga            | 94     | 1      |
| Belçika   | Pro League               | 144    | 2      |
| Rusya     | Russian Premier League   | 235    | 2      |

**Maç filtrelemede (isRelevantLeague) ek olarak isimle dahil edilen ligler** (API’den gelen isimle eşleşirse gösterilir; ayrı ID listesi yok):  
Scottish Premiership, Belgian Pro League, Austrian Bundesliga, Swiss Super League, İngiltere Championship.

---

## 2. Ulusal kupalar (ülke içi)

| Ülke      | Turnuva adı     | API ID | Öncelik |
|-----------|-----------------|--------|--------|
| Türkiye   | Türkiye Kupası  | 206    | 2      |
| İngiltere | FA Cup          | 45     | 2      |
| İngiltere | EFL Cup         | 48     | 3      |
| İspanya   | Copa del Rey    | 143    | 2      |
| Almanya   | DFB Pokal       | 81     | 2      |
| İtalya    | Coppa Italia    | 137    | 2      |
| Fransa    | Coupe de France | 66     | 2      |

Maç filtrelemede “cup / kupa / copa / coupe” içeren **tüm yerel kupa** turnuvaları (kadın/genç hariç) oyunda gösterilebilir; yukarıdaki liste oyuncu reytingi ve resmi desteklenen kupaları verir.

---

## 3. Uluslararası kulüp kupaları (kıta / dünya)

| Turnuva adı            | API ID | Öncelik |
|------------------------|--------|--------|
| UEFA Champions League  | 2      | 1      |
| UEFA Europa League     | 3      | 1      |
| UEFA Conference League | 848    | 2      |
| UEFA Super Cup         | 531    | 3      |

Maç filtrelemede UEFA / Champions League / Europa League / Conference / Euro / Nations League / European Championship / Euro qualification içeren **tüm UEFA turnuvaları** (kadın/genç hariç) dahil edilir.

---

## 4. Milli takım turnuvaları (uluslararası)

| Turnuva adı                    | API ID | Öncelik |
|--------------------------------|--------|--------|
| FIFA Dünya Kupası              | 1      | 1      |
| UEFA Avrupa Şampiyonası (Euro) | 4      | 1      |
| UEFA Uluslar Ligi              | 5      | 2      |
| Dünya Kupası Eleme – Avrupa    | 32     | 2      |

Maç filtrelemede şu içerikler **milli takım** kapsamında dahil edilir:  
World Cup, FIFA World Cup, World Cup qualification/group/qualifiers, Copa America, Africa Cup, Asian Cup, Concacaf (kadın/genç hariç).

---

## Özet sayılar

- **Ulusal lig:** 17 (Süper Lig, Premier League, La Liga, Bundesliga, Serie A, Ligue 1, 2. ligler, Eredivisie, Primeira Liga, Pro League, Russian Premier League).
- **Ulusal kupa:** 7 (Türkiye Kupası, FA Cup, EFL Cup, Copa del Rey, DFB Pokal, Coppa Italia, Coupe de France).
- **Uluslararası kulüp:** 4 (ŞL, EL, Conference League, UEFA Super Cup).
- **Milli takım:** 4 (Dünya Kupası, Euro, Nations League, WC Eleme Avrupa).

**Toplam (ID ile desteklenen):** 32 turnuva.

---

## Kod referansları

- **Lig/kupa ID listesi:** `backend/scripts/update-all-player-ratings.js` → `SUPPORTED_LEAGUES`
- **Maç filtreleme (hangi maçlar gösterilir):** `backend/services/footballApi.js` → `filterMatches` / `isRelevantLeague`
- **Takip edilen ligler (cache/upcoming):** `backend/services/aggressiveCacheService.js` → `trackedLeagues` (6 lig)
- **Static teams takip:** `backend/services/staticTeamsScheduler.js` → `TRACKED_LEAGUES` (ek: MLS, Brezilya Serie A, Arjantin Liga Profesional)

Bu dosya, oyun için ilgilendiğimiz tüm liglerin, ülke içi kupaların, ulusal ve uluslararası kupaların ve milli takım turnuvalarının eksiksiz listesidir.
