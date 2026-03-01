#!/usr/bin/env node
/**
 * Tüm cache ve kullanıcı verilerini siler - BELİRTİLEN EMAIL HARİÇ.
 * Kullanım: node scripts/clear-all-users-except-one.js
 * 
 * - Supabase public tablolardan tüm kullanıcı verilerini siler (etemduzok@gmail.com hariç)
 * - Supabase Auth'dan diğer tüm kullanıcıları siler
 * - Veritabanı şeması ve maç/takım verilerine DOKUNMAZ
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const KEEP_EMAIL = 'etemduzok@gmail.com';

const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli (.env)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  TÜM KULLANICI VERİLERİNİ SİL (Korunan: ' + KEEP_EMAIL + ')  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  // 1) Korunacak kullanıcının id'sini bul (public.users veya auth)
  let keepUserId = null;

  const { data: publicUser } = await supabase
    .from('users')
    .select('id')
    .ilike('email', KEEP_EMAIL)
    .limit(1)
    .single();

  if (publicUser?.id) {
    keepUserId = publicUser.id;
    console.log('✅ Korunan kullanıcı public.users\'da bulundu:', keepUserId);
  }

  if (!keepUserId) {
    const { data: authList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const keepAuth = authList?.users?.find((u) => (u.email || '').toLowerCase() === KEEP_EMAIL.toLowerCase());
    if (keepAuth) {
      keepUserId = keepAuth.id;
      console.log('✅ Korunan kullanıcı auth.users\'dan bulundu:', keepUserId);
    }
  }

  if (!keepUserId) {
    console.log('⚠️  ' + KEEP_EMAIL + ' hiçbir yerde bulunamadı. Sadece public tablolardan diğer kullanıcılar silinecek.');
    console.log('   (Auth\'da bu email yoksa auth silme atlanacak.)');
  }

  const tablesWithUserId = [
    'predictions',
    'prediction_scores',
    'user_stats',
    'match_results',
    'player_community_ratings',
    'squad_predictions',
    'favorite_teams',
  ];

  for (const table of tablesWithUserId) {
    try {
      let query = supabase.from(table).select('id', { count: 'exact', head: true });
      if (keepUserId) {
        query = query.neq('user_id', keepUserId);
      }
      const { count, error } = await query;
      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.log('   ⏭️  Tablo yok, atlanıyor:', table);
          continue;
        }
        console.error('   ❌', table, error.message);
        continue;
      }
      if (count === 0) {
        console.log('   ✓', table, ': silinecek kayıt yok');
        continue;
      }

      let deleteQuery = supabase.from(table).delete().neq('user_id', keepUserId);
      if (!keepUserId) {
        deleteQuery = supabase.from(table).delete().not('user_id', 'is', null);
      }
      const { error: delErr } = await deleteQuery;
      if (delErr) {
        console.error('   ❌ Silme hatası', table, delErr.message);
        continue;
      }
      console.log('   🗑️', table, ':', count, 'kayıt silindi');
    } catch (e) {
      console.error('   ❌', table, e.message);
    }
  }

  // leaderboard_snapshots: rankings JSON içinde user_id var; tüm snapshot'ları silebiliriz (yeniden üretilir)
  try {
    const { data: snapshots, error } = await supabase.from('leaderboard_snapshots').select('id');
    if (!error && snapshots?.length > 0) {
      for (const row of snapshots) {
        await supabase.from('leaderboard_snapshots').delete().eq('id', row.id);
      }
      console.log('   🗑️ leaderboard_snapshots:', snapshots.length, 'kayıt silindi');
    } else if (error && error.code !== '42P01') {
      console.log('   ⚠️ leaderboard_snapshots:', error.message);
    }
  } catch (e) {
    console.log('   ⏭️ leaderboard_snapshots:', e.message);
  }

  // public.users: korunan hariç hepsini sil
  try {
    let userDeleteQuery = supabase.from('users').select('id', { count: 'exact', head: true });
    if (keepUserId) userDeleteQuery = userDeleteQuery.neq('id', keepUserId);
    const { count: userCount, error: userErr } = await userDeleteQuery;
    if (!userErr && userCount > 0) {
      let del = supabase.from('users').delete().neq('id', keepUserId);
      if (!keepUserId) del = supabase.from('users').delete().not('id', 'is', null);
      const { error: delErr } = await del;
      if (!delErr) console.log('   🗑️ users:', userCount, 'kayıt silindi');
      else console.error('   ❌ users silme:', delErr.message);
    } else if (!userErr) {
      console.log('   ✓ users: silinecek kayıt yok');
    }
  } catch (e) {
    console.error('   ❌ users', e.message);
  }

  // Supabase Auth: korunan email hariç tüm kullanıcıları sil
  if (keepUserId) {
    console.log('');
    console.log('Auth kullanıcıları kontrol ediliyor...');
    let page = 1;
    let totalDeleted = 0;
    const perPage = 1000;

    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) {
        console.error('   ❌ auth.admin.listUsers:', error.message);
        break;
      }
      const users = data?.users || [];
      if (users.length === 0) break;

      for (const user of users) {
        if ((user.email || '').toLowerCase() === KEEP_EMAIL.toLowerCase()) continue;
        const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
        if (delErr) {
          console.error('   ❌ auth delete', user.email, delErr.message);
        } else {
          totalDeleted++;
          console.log('   🗑️ Auth silindi:', user.email || user.id);
        }
      }
      if (users.length < perPage) break;
      page++;
    }
    if (totalDeleted > 0) console.log('   Toplam Auth silinen:', totalDeleted);
  }

  console.log('');
  console.log('✅ İşlem tamamlandı. Veritabanı şeması ve maç/takım verileri aynen kaldı.');
  console.log('');
  console.log('Backend önbelleğini temizlemek için:');
  console.log('  - Sunucuyu yeniden başlatın veya');
  console.log('  - POST /api/admin/clear-cache (Header: x-api-key)');
  console.log('');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
