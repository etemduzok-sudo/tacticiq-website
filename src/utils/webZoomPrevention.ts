import { Platform } from 'react-native';

// Web specific types
declare const window: any;
declare const document: any;

/**
 * Initialize web zoom prevention
 * Prevents pinch-zoom, double-tap zoom, and scroll zoom on web
 */
export function initWebZoomPrevention() {
  // Only run on web
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return;
  }

  // Meta viewport tag'ini kontrol et ve ekle
  const setViewportMeta = () => {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.getElementsByTagName('head')[0].appendChild(viewport);
    }
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
  };
  
  // CSS ile zoom'u tamamen engelle
  const addZoomPreventionCSS = () => {
    const styleId = 'zoom-prevention-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        * {
          touch-action: manipulation !important;
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          user-select: none !important;
        }
        input, textarea {
          -webkit-user-select: text !important;
          user-select: text !important;
        }
        html, body {
          zoom: 1 !important;
          -webkit-text-size-adjust: 100% !important;
          text-size-adjust: 100% !important;
        }
        #root {
          zoom: 1 !important;
          transform: scale(1) !important;
          -webkit-transform: scale(1) !important;
        }
      `;
      document.head.appendChild(style);
    }
  };
  
  // Zoom seviyesini sürekli kontrol et ve sıfırla
  const preventZoom = () => {
    setViewportMeta();
    
    // Document zoom'unu kontrol et
    if (document.documentElement.style.zoom !== '1') {
      document.documentElement.style.zoom = '1';
    }
    if (document.body.style.zoom !== '1') {
      document.body.style.zoom = '1';
    }
    
    // Visual viewport scale'i kontrol et
    if (window.visualViewport && window.visualViewport.scale !== 1) {
      try {
        window.visualViewport.scale = 1;
      } catch (e) {
        // Ignore
      }
    }
    
    // Root element transform'unu kontrol et
    const root = document.getElementById('root');
    if (root) {
      const computedStyle = window.getComputedStyle(root);
      const transform = computedStyle.transform;
      if (transform && transform !== 'none' && !transform.includes('scale(1)')) {
        root.style.transform = 'scale(1) !important';
        root.style.webkitTransform = 'scale(1) !important';
      }
      // Root'un zoom'unu da kontrol et
      if (root.style.zoom !== '1') {
        root.style.zoom = '1';
      }
    }
    
    // Tüm elementlerin zoom'unu kontrol et
    const allElements = document.querySelectorAll('*');
    allElements.forEach((el: any) => {
      if (el.style && el.style.zoom && el.style.zoom !== '1') {
        el.style.zoom = '1';
      }
    });
  };
  
  // İlk yüklemede çalıştır
  setViewportMeta();
  addZoomPreventionCSS();
  preventZoom();
  
  // Her 25ms'de bir kontrol et (daha sık)
  setInterval(preventZoom, 25);
  
  // Event listener'lar
  window.addEventListener('resize', preventZoom);
  window.addEventListener('focus', preventZoom);
  window.addEventListener('blur', preventZoom);
  document.addEventListener('DOMContentLoaded', preventZoom);
  window.addEventListener('load', preventZoom);
  document.addEventListener('touchstart', preventZoom, { passive: false });
  document.addEventListener('touchmove', preventZoom, { passive: false });
  document.addEventListener('touchend', preventZoom, { passive: false });
  
  // Çift tıklama engelle (çok agresif)
  document.addEventListener('dblclick', (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    preventZoom();
    return false;
  }, true);
  
  // Wheel zoom engelle
  document.addEventListener('wheel', (e: any) => {
    if (e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      preventZoom();
      return false;
    }
  }, { passive: false });
  
  // Touch zoom engelle
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e: any) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
      e.stopPropagation();
      preventZoom();
      return false;
    }
    lastTouchEnd = now;
  }, { passive: false });
}
