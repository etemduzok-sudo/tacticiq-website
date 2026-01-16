// Email Service - Waitlist için e-posta gönderme servisi
interface WaitlistEmailParams {
  email: string;
  name?: string;
  language?: string;
}

interface EmailResponse {
  success: boolean;
  message: string;
}

// Email templates
const getEmailTemplate = (language: string = 'tr') => {
  const templates = {
    tr: {
      subject: '🎉 TacticIQ Bekleme Listesine Hoş Geldiniz!',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #0F2A24 0%, #1FA2A6 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⚽ TacticIQ</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Profesyonel Futbol Analiz Platformu</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #0F2A24; margin-top: 0;">Hoş Geldiniz! 🎉</h2>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              TacticIQ bekleme listesine katıldığınız için teşekkür ederiz! Futbol analiz yolculuğunuza başlamaya hazır mısınız?
            </p>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="color: #0F2A24; margin-top: 0;">📱 Mobil Uygulamalarımızı İndirin</h3>
              <p style="color: #333; margin-bottom: 20px;">iOS ve Android cihazlarınızdan TacticIQ'ya erişin:</p>
              
              <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                <a href="https://apps.apple.com/app/tacticiq" style="display: inline-block;">
                  <img src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg" alt="App Store" style="height: 50px;">
                </a>
                <a href="https://play.google.com/store/apps/details?id=com.tacticiq" style="display: inline-block;">
                  <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Google Play" style="height: 50px;">
                </a>
              </div>
            </div>
            
            <div style="background-color: #fff4e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0F2A24; margin-top: 0;">🎯 Ne Sunuyoruz?</h3>
              <ul style="color: #333; line-height: 1.8; padding-left: 20px;">
                <li><strong>14 Tahmin Kategorisi:</strong> Skor, kartlar, şutlar, kornerler ve daha fazlası</li>
                <li><strong>Detaylı İstatistikler:</strong> xG, pas ağları, ısı haritaları</li>
                <li><strong>Canlı Bildirimler:</strong> Goller, kartlar ve kritik anlar</li>
                <li><strong>Performans Analizi:</strong> Doğruluk oranı, kategori güçleri</li>
                <li><strong>Global Sıralama:</strong> En iyi analistlerle yarışın</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tacticiq.app" style="display: inline-block; background-color: #1FA2A6; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Platformu Keşfet
              </a>
            </div>
            
            <div style="border-top: 2px solid #e5e5e5; padding-top: 20px; margin-top: 30px;">
              <p style="color: #666; font-size: 14px; margin: 10px 0;">
                ⚠️ <strong>Önemli Not:</strong> TacticIQ bir bahis platformu değildir. Tüm puanlar ve ödüller sanaldır.
              </p>
              <p style="color: #666; font-size: 14px; margin: 10px 0;">
                📧 Sorularınız için: <a href="mailto:support@tacticiq.app" style="color: #1FA2A6;">support@tacticiq.app</a>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© 2026 TacticIQ. Tüm hakları saklıdır.</p>
            <p>Made with ⚽ for football analysts worldwide</p>
          </div>
        </div>
      `,
    },
    en: {
      subject: '🎉 Welcome to TacticIQ Waitlist!',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #0F2A24 0%, #1FA2A6 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⚽ TacticIQ</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Professional Football Analysis Platform</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #0F2A24; margin-top: 0;">Welcome! 🎉</h2>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Thank you for joining the TacticIQ waitlist! Are you ready to start your football analysis journey?
            </p>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="color: #0F2A24; margin-top: 0;">📱 Download Our Mobile Apps</h3>
              <p style="color: #333; margin-bottom: 20px;">Access TacticIQ from your iOS and Android devices:</p>
              
              <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                <a href="https://apps.apple.com/app/tacticiq" style="display: inline-block;">
                  <img src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg" alt="App Store" style="height: 50px;">
                </a>
                <a href="https://play.google.com/store/apps/details?id=com.tacticiq" style="display: inline-block;">
                  <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Google Play" style="height: 50px;">
                </a>
              </div>
            </div>
            
            <div style="background-color: #fff4e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0F2A24; margin-top: 0;">🎯 What We Offer?</h3>
              <ul style="color: #333; line-height: 1.8; padding-left: 20px;">
                <li><strong>14 Prediction Categories:</strong> Score, cards, shots, corners and more</li>
                <li><strong>Detailed Statistics:</strong> xG, pass networks, heat maps</li>
                <li><strong>Live Notifications:</strong> Goals, cards and critical moments</li>
                <li><strong>Performance Analysis:</strong> Accuracy rate, category strengths</li>
                <li><strong>Global Ranking:</strong> Compete with top analysts</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tacticiq.app" style="display: inline-block; background-color: #1FA2A6; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Explore Platform
              </a>
            </div>
            
            <div style="border-top: 2px solid #e5e5e5; padding-top: 20px; margin-top: 30px;">
              <p style="color: #666; font-size: 14px; margin: 10px 0;">
                ⚠️ <strong>Important Note:</strong> TacticIQ is not a betting platform. All points and rewards are virtual.
              </p>
              <p style="color: #666; font-size: 14px; margin: 10px 0;">
                📧 For questions: <a href="mailto:support@tacticiq.app" style="color: #1FA2A6;">support@tacticiq.app</a>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© 2026 TacticIQ. All rights reserved.</p>
            <p>Made with ⚽ for football analysts worldwide</p>
          </div>
        </div>
      `,
    },
  };

  return templates[language as keyof typeof templates] || templates.tr;
};

// Mock email sending function - Production'da gerçek API kullanılacak
export async function sendWaitlistEmail({
  email,
  name,
  language = 'tr',
}: WaitlistEmailParams): Promise<EmailResponse> {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Email validation
    if (!email || !email.includes('@')) {
      return {
        success: false,
        message: 'Geçersiz e-posta adresi',
      };
    }

    const template = getEmailTemplate(language);

    // Production'da burada gerçek email API çağrısı yapılacak
    // Örnek: SendGrid, Mailgun, AWS SES, Resend vb.
    
    console.log('📧 Email sent to:', email);
    console.log('Subject:', template.subject);
    console.log('Language:', language);

    // Mock response - başarılı
    return {
      success: true,
      message: 'E-posta başarıyla gönderildi! Lütfen gelen kutunuzu kontrol edin.',
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      message: 'E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin.',
    };
  }
}

// Webhook için endpoint simülasyonu
export async function submitToWaitlist(data: WaitlistEmailParams) {
  try {
    // 1. Email gönder
    const emailResult = await sendWaitlistEmail(data);

    // 2. Database'e kaydet (Supabase, Firebase vb.)
    // await supabase.from('waitlist').insert({
    //   email: data.email,
    //   name: data.name,
    //   language: data.language,
    //   created_at: new Date().toISOString(),
    // });

    // 3. Analytics track (Google Analytics, Mixpanel vb.)
    // track('waitlist_signup', { email: data.email, language: data.language });

    console.log('✅ Waitlist submission successful:', data);

    return emailResult;
  } catch (error) {
    console.error('Waitlist submission error:', error);
    return {
      success: false,
      message: 'Bir hata oluştu. Lütfen tekrar deneyin.',
    };
  }
}
