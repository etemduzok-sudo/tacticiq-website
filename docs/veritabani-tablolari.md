# TacticIQ – Veritabanı Tabloları Özeti

Bu doküman, Supabase (PostgreSQL) veritabanında hangi verilerin tutulduğunu tablo bazında özetler.

---

## Özet tablo

| Tablo | Açıklama | Veri türü |
|-------|----------|-----------|
| **users** | Kullanıcı hesap bilgileri (email, username, puan, streak, accuracy, rank) | Kullanıcı |
| **user_profiles** | Supabase auth ile senkron profil (nickname, istatistikler, sıralama, rozetler) | Kullanıcı |
| **user_stats** | Kullanıcı istatistikleri, rozetler (JSONB) | Kullanıcı |
| **favorite_teams** | Kullanıcının favori takımları (takım id, ad, logo) | Kullanıcı |
| **predictions** | Maç tahminleri (sonuç, skor, golcü, kart, korner vb.) | Tahmin |
| **prediction_items** | Tahmin satırları (type + value, satır bazlı) | Tahmin |
| **squads** | Kullanıcının maç kadro tahminleri (formation, seçili oyuncular JSONB) | Tahmin |
| **squad_predictions** | Atak/defans formasyonu ve oyuncu tahminleri | Tahmin |
| **formation_statistics** | Formasyon popülerlik istatistikleri (maç bazlı) | Tahmin |
| **player_position_statistics** | Oyuncu–pozisyon eşleştirme istatistikleri | Tahmin |
| **match_squad_summary** | Maç bazlı kadro tahmin özeti | Tahmin |
| **ratings** | Maç sonrası takım/kategori puanlamaları (1–5) | Kullanıcı etkileşim |
| **achievements** | Açılan rozetler | Kullanıcı etkileşim |
| **notifications** | Bildirimler (maç, sonuç, rozet, premium, sıralama) | Kullanıcı etkileşim |
| **substitution_votes** | Canlı maç değişiklik oyları (çıkan/giren oyuncu) | Kullanıcı etkileşim |
| **leagues** | Ligler (id, ad, ülke, logo, sezon, type: league/cup) | Maç verisi |
| **teams** | Takımlar (id, ad, kod, ülke, logo, statü, kapasite) | Maç verisi |
| **matches** | Maçlar (tarih, skor, durum, takımlar, events, lineups, statistics) | Maç verisi |
| **match_end_snapshots** | Maç bitiş anı tek snapshot (FT anındaki veri) | Maç verisi |
| **match_timeline** | Maç dakika dakika olay akışı (gol, kart, değişiklik vb.) | Maç verisi |
| **match_summaries** | Biten maç özetleri (TR/EN, key moments, man of match) | Maç verisi |
| **match_live_status** | Canlı maç anlık durum (12 sn’de bir; eski kayıtlar silinir) | Maç verisi |
| **players** | Oyuncular (ad, pozisyon, takım, yaş, milliyet, foto) | Maç verisi |
| **match_players** | Maç kadrosu (pozisyon, grid, rating, dakika, gol, asist, kart) | Maç verisi |
| **team_squads** | Takım kadro önbelleği (team_id, season, players JSONB) | Maç verisi |
| **player_power_scores** | Oyuncu PowerScore + 6 attribute (ayda 1 güncellenir) | Maç verisi |
| **static_teams** | Statik takım listesi (API id, ad, ülke, lig, renkler, antrenör) | Statik veri |
| **static_leagues** | Statik lig listesi (API id, ad, ülke, logo, renkler) | Statik veri |
| **static_teams_update_history** | Statik takım sync geçmişi (full/incremental/cleanup) | Statik veri |
| **leaderboard_snapshots** | Sıralama geçmişi (günlük/haftalık/aylık, top 100 JSONB) | Sıralama |
| **api_usage_log** | Günlük API kullanım (çağrı sayıları, limit, kalan) | Sistem |
| **static_teams_sync_log** | Statik takım sync logları (günde 2 kez) | Sistem |
| **legal_documents** | Yasal metinler (terms, privacy, kvkk, consent vb. dil bazlı) | İçerik |

---

## Kategoriye göre gruplama

### Kullanıcı ve profil
- **users** – Uygulama tarafı kullanıcı tablosu (puan, streak, accuracy, rank, favorite_teams array).
- **user_profiles** – Auth ile bağlı profil; nickname, total_points, accuracy, country_rank, global_rank, level, xp, favorite_teams_json vb.
- **user_stats** – user_id başına istatistik ve rozetler (JSONB).
- **favorite_teams** – Kullanıcı–takım eşlemesi (ayrı tablo; bazı yerlerde users/user_profiles’taki array/json da kullanılıyor).

### Tahminler
- **predictions** – Maç başına tahmin (match_result, score, scorer, cards, first_goal, corner_count; prediction_value JSONB).
- **prediction_items** – Tahmin satırları (user_id, match_id, prediction_type, prediction_value).
- **squads** – Kadro tahmini (formation, selected_players JSONB).
- **squad_predictions** – Atak/defans formasyonu + attack_players / defense_players JSONB.
- **formation_statistics** – Maç bazlı formasyon kullanım sayıları.
- **player_position_statistics** – Maç/oyuncu/formasyon/pozisyon istatistikleri.
- **match_squad_summary** – Maç bazlı kadro tahmin özeti.

### Kullanıcı etkileşim
- **ratings** – Maç sonrası takım ve kategori bazlı 1–5 puan.
- **achievements** – Açılan achievement_type kayıtları.
- **notifications** – Bildirim metni ve tipi (match_start, result, achievement, premium, leaderboard).
- **substitution_votes** – Canlı maçta çıkan/giren oyuncu oyları (+ substitution_vote_counts view).

### Maç ve lig verisi
- **leagues** – Lig listesi (API-Football ile senkron).
- **teams** – Takım listesi.
- **matches** – Maç listesi (skor, status, events, lineups, statistics).
- **match_end_snapshots** – Maç bitiş (FT) anı tek snapshot.
- **match_timeline** – Dakika bazlı olay akışı.
- **match_summaries** – Biten maç özeti (TR/EN, key moments, man of match).
- **match_live_status** – Canlı maç anlık durum (geçmiş temizlenir).

### Oyuncu ve kadro
- **players** – Oyuncu master verisi.
- **match_players** – Maç bazlı kadro (pozisyon, rating, dakika, gol, asist, kart).
- **team_squads** – Takım–sezon kadro önbelleği (players JSONB).
- **player_power_scores** – Oyuncu güç skoru ve attribute’lar (ayda bir güncellenir).

### Statik veri ve sıralama
- **static_teams** – Uygulama tarafı statik takım listesi (lig tipi, renkler, antrenör).
- **static_leagues** – Statik lig listesi.
- **static_teams_update_history** – Statik takım güncelleme geçmişi.
- **leaderboard_snapshots** – Günlük/haftalık/aylık sıralama snapshot’ları (JSONB).

### Sistem ve içerik
- **api_usage_log** – Günlük API kullanım özeti.
- **static_teams_sync_log** – Statik takım sync zamanları ve sonuçları.
- **legal_documents** – Yasal dokümanlar (document_id + language, title, content).

---

## Notlar

- **RLS:** Kullanıcı verileri (predictions, squads, ratings, achievements, notifications, favorite_teams) `auth.uid() = user_id` ile kısıtlanır; lig/takım/maç/oyuncu/kadro verileri genelde public read.
- **View:** `substitution_vote_counts` – değişiklik oyları özeti.
- **Fonksiyonlar:** `update_user_ranks`, `calculate_user_accuracy`, `get_live_matches`, `get_matches_by_date_range`, `get_matches_by_team`, `cleanup_old_live_status` vb. birçok yardımcı fonksiyon mevcut.
- **Backend JSON:** `backend/data/` altında leagues, matches, players, teams, predictions, static_teams, team_squads vb. yedek/sync dosyaları bulunur; asıl canlı veri Supabase’dedir.

Bu tablo, veritabanında **hangi verilerin** tutulduğunu göstermek içindir; güncel şema için `supabase/FULL_SCHEMA.sql` ve ilgili migration dosyalarına bakılmalıdır.
