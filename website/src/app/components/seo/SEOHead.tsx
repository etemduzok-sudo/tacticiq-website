import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
}

export function SEOHead({
  title,
  description,
  keywords,
  ogImage = 'https://tacticiq.app/og-image.jpg',
  canonical,
}: SEOHeadProps) {
  const { language } = useLanguage();

  const defaultTitle = 'TacticIQ - AI-Powered Football Analysis & Tactical Intelligence';
  const defaultDescription = 'Professional football match analysis platform powered by AI. Get tactical insights, predictions, and statistics for top leagues worldwide.';
  const defaultKeywords = 'football analysis, tactical intelligence, AI predictions, match statistics, football analytics, soccer insights';

  const finalTitle = title || defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalKeywords = keywords || defaultKeywords;
  const finalCanonical = canonical || `https://tacticiq.app/${language}`;

  useEffect(() => {
    // Update document title
    document.title = finalTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Standard meta tags
    updateMetaTag('description', finalDescription);
    updateMetaTag('keywords', finalKeywords);
    updateMetaTag('author', 'TacticIQ Team');
    updateMetaTag('language', language);
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');

    // Open Graph tags
    updateMetaTag('og:title', finalTitle, true);
    updateMetaTag('og:description', finalDescription, true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:url', finalCanonical, true);
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:site_name', 'TacticIQ', true);
    updateMetaTag('og:locale', language === 'tr' ? 'tr_TR' : 'en_US', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:site', '@tacticiq_app');
    updateMetaTag('twitter:creator', '@tacticiq_app');
    updateMetaTag('twitter:title', finalTitle);
    updateMetaTag('twitter:description', finalDescription);
    updateMetaTag('twitter:image', ogImage);

    // Additional SEO tags
    updateMetaTag('theme-color', '#0F2A24');
    updateMetaTag('apple-mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
    updateMetaTag('apple-mobile-web-app-title', 'TacticIQ');

    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', finalCanonical);

    // Alternate language links
    const languages = ['en', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh'];
    languages.forEach(lang => {
      let alternateLang = document.querySelector(`link[hreflang="${lang}"]`);
      if (!alternateLang) {
        alternateLang = document.createElement('link');
        alternateLang.setAttribute('rel', 'alternate');
        alternateLang.setAttribute('hreflang', lang);
        document.head.appendChild(alternateLang);
      }
      alternateLang.setAttribute('href', `https://tacticiq.app/${lang}`);
    });

  }, [finalTitle, finalDescription, finalKeywords, ogImage, finalCanonical, language]);

  return null;
}
