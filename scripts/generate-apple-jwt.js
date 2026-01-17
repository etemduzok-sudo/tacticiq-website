/**
 * Apple OAuth JWT Token Generator
 * 
 * Bu script, Apple Sign in with Apple için JWT token oluşturur.
 * 
 * Kullanım:
 * 1. npm install jsonwebtoken
 * 2. .p8 dosyasını bu klasöre kopyalayın
 * 3. Aşağıdaki bilgileri doldurun
 * 4. node generate-apple-jwt.js
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// ============================================
// AYARLAR - BURAYI DOLDURUN
// ============================================

const TEAM_ID = 'YOUR_TEAM_ID'; // Apple Developer'dan alın (örn: XYZ789TEAM)
const KEY_ID = 'YOUR_KEY_ID'; // Apple Developer'dan alın (örn: ABC123DEFG)
const SERVICES_ID = 'com.tacticiq.web'; // Services ID (örn: com.tacticiq.web)

// .p8 dosyasının yolu (AuthKey_XXX.p8 formatında)
// Dosyayı bu script'in olduğu klasöre kopyalayın
const PRIVATE_KEY_PATH = path.join(__dirname, `AuthKey_${KEY_ID}.p8`);

// ============================================
// JWT OLUŞTURMA
// ============================================

try {
  // .p8 dosyasını oku
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    console.error('❌ HATA: .p8 dosyası bulunamadı!');
    console.error(`   Beklenen dosya: ${PRIVATE_KEY_PATH}`);
    console.error('\n📝 Yapmanız gerekenler:');
    console.error('   1. Apple Developer Console\'dan .p8 dosyasını indirin');
    console.error(`   2. Dosyayı bu klasöre kopyalayın: ${path.dirname(PRIVATE_KEY_PATH)}`);
    console.error(`   3. Dosya adını şu formata çevirin: AuthKey_${KEY_ID}.p8`);
    process.exit(1);
  }

  const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

  // Şu anki zaman (Unix timestamp)
  const now = Math.floor(Date.now() / 1000);
  
  // 6 ay geçerlilik (15777000 saniye = ~182 gün)
  const expiration = now + 15777000;

  // JWT payload
  const payload = {
    iss: TEAM_ID, // Issuer (Team ID)
    iat: now, // Issued At (şu anki zaman)
    exp: expiration, // Expiration (6 ay sonra)
    aud: 'https://appleid.apple.com', // Audience (sabit)
    sub: SERVICES_ID, // Subject (Services ID)
  };

  // JWT header
  const header = {
    alg: 'ES256', // Algorithm (Elliptic Curve)
    kid: KEY_ID, // Key ID
  };

  // JWT oluştur
  const token = jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    header: header,
  });

  // Sonuçları göster
  console.log('\n✅ Apple JWT Token başarıyla oluşturuldu!\n');
  console.log('=' .repeat(60));
  console.log('📋 BİLGİLER:');
  console.log('=' .repeat(60));
  console.log(`Team ID:     ${TEAM_ID}`);
  console.log(`Key ID:      ${KEY_ID}`);
  console.log(`Services ID: ${SERVICES_ID}`);
  console.log(`Oluşturulma: ${new Date(now * 1000).toLocaleString('tr-TR')}`);
  console.log(`Geçerlilik:  ${new Date(expiration * 1000).toLocaleString('tr-TR')}`);
  console.log(`Süre:        6 ay (${Math.floor((expiration - now) / 86400)} gün)`);
  console.log('=' .repeat(60));
  console.log('\n🔑 JWT TOKEN (Secret Key):');
  console.log('─'.repeat(60));
  console.log(token);
  console.log('─'.repeat(60));
  console.log('\n📝 YAPILACAKLAR:');
  console.log('   1. Yukarıdaki JWT token\'ı kopyalayın');
  console.log('   2. Supabase Dashboard → Authentication → Providers → Apple');
  console.log('   3. "Secret Key" alanına JWT token\'ı yapıştırın');
  console.log('   4. Services ID, Team ID, Key ID bilgilerini girin');
  console.log('   5. Save butonuna tıklayın');
  console.log('\n⚠️  UYARI:');
  console.log('   - Bu JWT token 6 ay geçerlidir');
  console.log('   - Süresi dolmadan önce yeni token oluşturun');
  console.log('   - Token\'ı güvenli bir yerde saklayın\n');

} catch (error) {
  console.error('\n❌ HATA:', error.message);
  console.error('\n🔍 Kontrol Listesi:');
  console.error('   ✓ TEAM_ID doğru mu?');
  console.error('   ✓ KEY_ID doğru mu?');
  console.error('   ✓ SERVICES_ID doğru mu?');
  console.error('   ✓ .p8 dosyası doğru klasörde mi?');
  console.error('   ✓ .p8 dosyası adı doğru mu? (AuthKey_KEYID.p8)');
  console.error('   ✓ jsonwebtoken paketi yüklü mü? (npm install jsonwebtoken)\n');
  process.exit(1);
}
