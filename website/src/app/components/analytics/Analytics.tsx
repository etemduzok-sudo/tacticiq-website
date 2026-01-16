import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Google Analytics configuration
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Replace with your GA ID

// Analytics event tracking
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Page view tracking
export const trackPageView = (url: string, title: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      page_title: title,
    });
  }
};

// Analytics component (add to App.tsx)
export function Analytics() {
  const { language } = useLanguage();

  useEffect(() => {
    // Google Analytics
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', {
        'language': '${language}',
        'anonymize_ip': true,
        'cookie_flags': 'SameSite=None;Secure'
      });
    `;
    document.head.appendChild(script2);

    // Track initial page view
    trackPageView(window.location.pathname, document.title);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, [language]);

  return null;
}

// Custom hooks for tracking
export const useTrackPageView = () => {
  useEffect(() => {
    trackPageView(window.location.pathname, document.title);
  }, []);
};

export const useTrackEvent = () => {
  return trackEvent;
};

// Event tracking helpers
export const analyticsEvents = {
  // User actions
  signup: (method: string) => trackEvent('User', 'Sign Up', method),
  login: (method: string) => trackEvent('User', 'Login', method),
  logout: () => trackEvent('User', 'Logout'),
  
  // Feature usage
  viewPrediction: (matchId: string) => trackEvent('Prediction', 'View', matchId),
  savePrediction: (matchId: string) => trackEvent('Prediction', 'Save', matchId),
  sharePrediction: (matchId: string) => trackEvent('Prediction', 'Share', matchId),
  
  // Subscription
  viewPricing: () => trackEvent('Subscription', 'View Pricing'),
  startCheckout: (plan: string) => trackEvent('Subscription', 'Start Checkout', plan),
  completePurchase: (plan: string, value: number) => trackEvent('Subscription', 'Complete Purchase', plan, value),
  
  // Engagement
  newsletterSignup: () => trackEvent('Engagement', 'Newsletter Signup'),
  contactFormSubmit: () => trackEvent('Engagement', 'Contact Form Submit'),
  downloadPressKit: (type: string) => trackEvent('Engagement', 'Download Press Kit', type),
  
  // Navigation
  clickExternalLink: (url: string) => trackEvent('Navigation', 'External Link', url),
  changeLanguage: (language: string) => trackEvent('Navigation', 'Change Language', language),
};
