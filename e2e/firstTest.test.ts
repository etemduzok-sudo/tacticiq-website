// E2E Test - First Test
import { device, element, by, expect as detoxExpect } from 'detox';

describe('TacticIQ - E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show splash screen', async () => {
    await detoxExpect(element(by.text('TacticIQ'))).toBeVisible();
  });

  it('should navigate to language selection', async () => {
    await waitFor(element(by.text('Dil Seçimi')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should select language and proceed to auth', async () => {
    await element(by.text('Türkçe')).tap();
    await element(by.text('Devam Et')).tap();
    
    await waitFor(element(by.text('Giriş Yap')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should navigate to register screen', async () => {
    await element(by.text('Kayıt Ol')).tap();
    
    await detoxExpect(element(by.text('Hesap Oluştur'))).toBeVisible();
  });

  it('should go back to auth screen', async () => {
    await element(by.text('Geri')).tap();
    
    await detoxExpect(element(by.text('Giriş Yap'))).toBeVisible();
  });

  it('should show favorite teams screen after login', async () => {
    // Mock login (skip actual authentication)
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.text('Giriş Yap')).tap();
    
    await waitFor(element(by.text('Takımlarınızı Seçin')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should select favorite team', async () => {
    await element(by.text('Galatasaray')).tap();
    
    await detoxExpect(element(by.text('Galatasaray'))).toHaveToggleValue(true);
  });

  it('should navigate to home screen', async () => {
    await element(by.text('Devam Et')).tap();
    
    await waitFor(element(by.text('Ana Sayfa')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show matches list', async () => {
    await element(by.text('Maçlar')).tap();
    
    await detoxExpect(element(by.id('matches-list'))).toBeVisible();
  });

  it('should filter matches by category', async () => {
    await element(by.text('Canlı')).tap();
    
    // Should show live matches
    await waitFor(element(by.id('live-matches')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should open match detail', async () => {
    await element(by.id('match-card-0')).tap();
    
    await detoxExpect(element(by.text('Kadro'))).toBeVisible();
    await detoxExpect(element(by.text('Tahmin'))).toBeVisible();
  });

  it('should navigate to profile', async () => {
    await element(by.text('Profil')).tap();
    
    await detoxExpect(element(by.text('Seviye'))).toBeVisible();
    await detoxExpect(element(by.text('Puan'))).toBeVisible();
  });

  it('should open profile settings', async () => {
    await element(by.id('settings-button')).tap();
    
    await detoxExpect(element(by.text('Profil Ayarları'))).toBeVisible();
  });

  it('should logout successfully', async () => {
    await element(by.text('Çıkış Yap')).tap();
    await element(by.text('Evet')).tap();
    
    await waitFor(element(by.text('Giriş Yap')))
      .toBeVisible()
      .withTimeout(3000);
  });
});
