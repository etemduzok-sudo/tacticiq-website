// =====================================================
// League/Organization Brand Colors
// =====================================================
// UEFA, FIFA gibi organizasyonların logo'ları telifli
// Bu dosya organizasyon renklerini (brand colors) sağlar
// Renkler telifli değildir ve kullanılabilir
// =====================================================

/**
 * Organizasyon renklerini getir (logo yerine renkler kullanılır)
 * ⚠️ TELİF HAKKI: Logo'lar ASLA kullanılmaz, sadece renkler
 */
function getLeagueColors(leagueName) {
  const name = (leagueName || '').toLowerCase();
  
  // UEFA Organizasyonları
  if (name.includes('champions league') || name.includes('uefa champions')) {
    return {
      primary: '#0C2340', // UEFA koyu mavisi
      secondary: '#0099FF', // UEFA açık mavisi
      gradient: ['#0C2340', '#0099FF'],
    };
  }
  
  if (name.includes('europa league') || name.includes('uefa europa')) {
    return {
      primary: '#FFCC00', // UEFA Europa altını
      secondary: '#FF6600', // UEFA Europa turuncusu
      gradient: ['#FFCC00', '#FF6600'],
    };
  }
  
  if (name.includes('conference league') || name.includes('uefa conference')) {
    return {
      primary: '#8B00FF', // UEFA Conference moru
      secondary: '#FF00FF', // UEFA Conference pembe-moru
      gradient: ['#8B00FF', '#FF00FF'],
    };
  }
  
  if (name.includes('uefa')) {
    return {
      primary: '#0C2340', // Genel UEFA mavisi
      secondary: '#0099FF',
      gradient: ['#0C2340', '#0099FF'],
    };
  }
  
  // FIFA Organizasyonları
  if (name.includes('fifa world cup') || name.includes('world cup')) {
    return {
      primary: '#E10600', // FIFA kırmızısı
      secondary: '#FFFFFF', // FIFA beyazı
      gradient: ['#E10600', '#FFFFFF'],
    };
  }
  
  if (name.includes('fifa')) {
    return {
      primary: '#E10600', // Genel FIFA kırmızısı
      secondary: '#FFFFFF',
      gradient: ['#E10600', '#FFFFFF'],
    };
  }
  
  // CONMEBOL (Güney Amerika)
  if (name.includes('libertadores') || name.includes('conmebol')) {
    return {
      primary: '#0066CC', // CONMEBOL mavisi
      secondary: '#FFCC00', // CONMEBOL altını
      gradient: ['#0066CC', '#FFCC00'],
    };
  }
  
  // AFC (Asya)
  if (name.includes('afc champions') || name.includes('afc')) {
    return {
      primary: '#FF6600', // AFC turuncusu
      secondary: '#FFFFFF',
      gradient: ['#FF6600', '#FFFFFF'],
    };
  }
  
  // CAF (Afrika)
  if (name.includes('caf') || name.includes('africa')) {
    return {
      primary: '#FF0000', // CAF kırmızısı
      secondary: '#FFD700', // CAF altını
      gradient: ['#FF0000', '#FFD700'],
    };
  }
  
  // CONCACAF (Kuzey/Kuzey-Orta Amerika)
  if (name.includes('concacaf')) {
    return {
      primary: '#0066CC', // CONCACAF mavisi
      secondary: '#FF6600',
      gradient: ['#0066CC', '#FF6600'],
    };
  }
  
  // Yerel Ligler (Genel renkler)
  if (name.includes('premier league')) {
    return {
      primary: '#38003C', // Premier League moru
      secondary: '#00FF87', // Premier League yeşili
      gradient: ['#38003C', '#00FF87'],
    };
  }
  
  if (name.includes('la liga')) {
    return {
      primary: '#FFD700', // La Liga altını
      secondary: '#FF0000',
      gradient: ['#FFD700', '#FF0000'],
    };
  }
  
  if (name.includes('serie a')) {
    return {
      primary: '#0068A8', // Serie A mavisi
      secondary: '#FFFFFF',
      gradient: ['#0068A8', '#FFFFFF'],
    };
  }
  
  if (name.includes('bundesliga')) {
    return {
      primary: '#D20515', // Bundesliga kırmızısı
      secondary: '#FFFFFF',
      gradient: ['#D20515', '#FFFFFF'],
    };
  }
  
  if (name.includes('ligue 1') || name.includes('ligue 1')) {
    return {
      primary: '#FFD700', // Ligue 1 altını
      secondary: '#0066CC',
      gradient: ['#FFD700', '#0066CC'],
    };
  }
  
  if (name.includes('süper lig') || name.includes('super lig')) {
    return {
      primary: '#E30A17', // Türkiye kırmızısı
      secondary: '#FFFFFF',
      gradient: ['#E30A17', '#FFFFFF'],
    };
  }
  
  // Default (bilinmeyen ligler için)
  return {
    primary: '#1E40AF',
    secondary: '#FFFFFF',
    gradient: ['#1E40AF', '#FFFFFF'],
  };
}

module.exports = {
  getLeagueColors,
};
