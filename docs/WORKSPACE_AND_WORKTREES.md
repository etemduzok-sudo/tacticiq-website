# TacticIQ - Workspace ve Worktree Kullanımı

## Ana Workspace (Tek Kaynak)

**Ana workspace:** `c:\TacticIQ`

Tüm geliştirme, test ve commit işlemleri bu klasörden yapılır.

---

## Worktree Kullanımı

Worktree'ler (`C:\Users\EtemD\.cursor\worktrees\TacticIQ\*`) paralel çalışma için kullanılabilir, ancak:

### Kurallar
1. **Ana kaynak her zaman `c:\TacticIQ`**
2. Worktree'de yapılan değişiklikleri ana workspace'e taşı
3. Commit'leri ana workspace'ten yap
4. Cursor IDE'de ana workspace'i açık tut

### Senkronizasyon Komutları

| Komut | Açıklama |
|-------|----------|
| `npm run workspace:check` | Hangi dizinde olduğunu kontrol et |
| `npm run workspace:list` | Tüm worktree'leri listele |
| `npm run sync-from-worktree` | Worktree'deki değişiklikleri ana workspace'e kopyala |

### Sync Nasıl Yapılır?

Worktree'de (örn. `qlv`) değişiklik yaptıysan:

1. Worktree dizinine git (Explorer'da veya `cd` ile)
2. Çalıştır: `npm run sync-from-worktree`  
   veya `scripts\sync-from-worktree.bat` dosyasına çift tıkla
3. Ana workspace'e geç (`c:\TacticIQ`)
4. Değişiklikleri kontrol et, commit yap

### Hangi Dizinden Çalıştığını Bil

- Terminal'de: `npm run workspace:check`
- IDE'de: Sol üstteki açık klasör adına bak
- Ana workspace: `c:\TacticIQ` olmalı

---

## Cursor AI ile

`.cursor/rules/workspace-primary.mdc` kuralı AI asistanına ana workspace kullanmasını söyler. Worktree path'leri kullanılmaz.
