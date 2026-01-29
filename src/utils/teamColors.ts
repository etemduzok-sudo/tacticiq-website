// Team Colors Utility
// Takım renklerini static_teams tablosundan veya hardcoded mapping'den alır
// ✅ TEK KAYNAK: Tüm uygulama bu dosyayı kullanır

// ✅ API'den gelen renkleri cache'le (runtime)
const teamColorsCache: Record<number, string[]> = {};

/**
 * Takım ID'sine göre cache'den renk al
 */
export const getCachedTeamColors = (teamId: number): string[] | null => {
  return teamColorsCache[teamId] || null;
};

/**
 * Takım renklerini cache'e kaydet
 */
export const setCachedTeamColors = (teamId: number, colors: string[]): void => {
  teamColorsCache[teamId] = colors;
};

/**
 * Takım ismine göre forma renklerini döndürür
 * Önce static_teams tablosundan almayı dener, yoksa hardcoded mapping kullanır
 */
export const getTeamColors = (teamName: string, teamId?: number): string[] => {
  // 1. Önce cache'den kontrol et (API'den gelen veriler)
  if (teamId && teamColorsCache[teamId]) {
    return teamColorsCache[teamId];
  }
  
  const name = teamName.toLowerCase();
  
  // ✅ Hardcoded renkler (static_teams tablosu ile uyumlu)
  const teamColors: Record<string, string[]> = {
    // Türk Süper Lig
    'galatasaray': ['#E30613', '#FDB913'], // Kırmızı-Sarı
    'fenerbahçe': ['#FFED00', '#00205B'], // Sarı-Lacivert
    'fenerbahce': ['#FFED00', '#00205B'],
    'beşiktaş': ['#000000', '#FFFFFF'], // Siyah-Beyaz
    'besiktas': ['#000000', '#FFFFFF'],
    'trabzonspor': ['#632134', '#00BFFF'], // Bordo-Mavi
    'başakşehir': ['#F37021', '#000000'], // Turuncu-Siyah
    'basaksehir': ['#F37021', '#000000'],
    'adana demirspor': ['#0000FF', '#FFFFFF'], // Mavi-Beyaz
    'antalyaspor': ['#FF0000', '#FFFFFF'], // Kırmızı-Beyaz
    'konyaspor': ['#006633', '#FFFFFF'], // Yeşil-Beyaz
    'kayserispor': ['#FF0000', '#FFD700'], // Kırmızı-Sarı
    'kayseri': ['#FF0000', '#FFD700'],
    'istanbulspor': ['#000000', '#FFD700'], // Siyah-Sarı
    'istanbul': ['#000000', '#FFD700'],
    'rize': ['#006633', '#0000FF'], // Yeşil-Mavi
    'rizespor': ['#006633', '#0000FF'],
    'samsunspor': ['#C8102E', '#FFFFFF'], // Kırmızı-Beyaz
    'samsun': ['#C8102E', '#FFFFFF'],
    'sivasspor': ['#FF0000', '#FFFFFF'], // Kırmızı-Beyaz
    'goztepe': ['#FFD700', '#C8102E'], // Sarı-Kırmızı
    'göztep': ['#FFD700', '#C8102E'],
    'alanyaspor': ['#FF6600', '#006633'], // Turuncu-Yeşil
    'hatayspor': ['#006633', '#C8102E'], // Yeşil-Kırmızı
    'gaziantep': ['#C8102E', '#000000'], // Kırmızı-Siyah
    'kasimpasa': ['#000066', '#FFFFFF'], // Lacivert-Beyaz
    'kasımpaşa': ['#000066', '#FFFFFF'],
    'pendikspor': ['#8B0000', '#FFFFFF'], // Bordo-Beyaz
    'bodrum': ['#0066CC', '#FFFFFF'], // Mavi-Beyaz
    'eyüpspor': ['#8B0000', '#FFD700'], // Bordo-Sarı
    
    // UEFA Europa League / Champions League Takımları
    'fcsb': ['#E30613', '#00205B'], // Kırmızı-Lacivert (Romanya)
    'steaua': ['#E30613', '#00205B'], // FCSB eski adı
    'ajax': ['#D2122E', '#FFFFFF'], // Kırmızı-Beyaz
    'porto': ['#003399', '#FFFFFF'], // Mavi-Beyaz
    'sporting': ['#008B00', '#FFFFFF'], // Yeşil-Beyaz
    'anderlecht': ['#660099', '#FFFFFF'], // Mor-Beyaz
    'brugge': ['#0066CC', '#000000'], // Mavi-Siyah
    'celtic': ['#006633', '#FFFFFF'], // Yeşil-Beyaz
    'rangers': ['#0066CC', '#FFFFFF'], // Mavi-Beyaz
    'olympiacos': ['#CC0000', '#FFFFFF'], // Kırmızı-Beyaz
    'panathinaikos': ['#006633', '#FFFFFF'], // Yeşil-Beyaz
    'aek': ['#FFD700', '#000000'], // Sarı-Siyah
    'red bull salzburg': ['#E30613', '#FFFFFF'], // Kırmızı-Beyaz
    'salzburg': ['#E30613', '#FFFFFF'],
    'shakhtar': ['#FF6600', '#000000'], // Turuncu-Siyah
    'dynamo kyiv': ['#0066CC', '#FFFFFF'], // Mavi-Beyaz
    'lazio': ['#87CEEB', '#FFFFFF'], // Açık Mavi-Beyaz
    'roma': ['#8B0000', '#FFD700'], // Bordo-Sarı
    'atalanta': ['#1B478D', '#000000'], // Mavi-Siyah
    'fiorentina': ['#472C84', '#FFFFFF'], // Mor-Beyaz
    'sevilla': ['#F43333', '#FFFFFF'], // Kırmızı-Beyaz
    'villarreal': ['#FFFF00', '#005592'], // Sarı-Mavi
    'real sociedad': ['#0067B1', '#FFFFFF'], // Mavi-Beyaz
    'athletic bilbao': ['#EE2523', '#FFFFFF'], // Kırmızı-Beyaz
    'bilbao': ['#EE2523', '#FFFFFF'],
    'betis': ['#00954C', '#FFFFFF'], // Yeşil-Beyaz
    'real betis': ['#00954C', '#FFFFFF'],
    'valencia': ['#EE7500', '#000000'], // Turuncu-Siyah
    
    // Premier League
    'manchester city': ['#6CABDD', '#1C2C5B'], // Açık Mavi-Koyu Mavi
    'man city': ['#6CABDD', '#1C2C5B'],
    'manchester united': ['#DA291C', '#FBE122'], // Kırmızı-Sarı
    'man united': ['#DA291C', '#FBE122'],
    'liverpool': ['#C8102E', '#00B2A9'], // Kırmızı-Turkuaz
    'arsenal': ['#EF0107', '#FFFFFF'], // Kırmızı-Beyaz
    'chelsea': ['#034694', '#FFFFFF'], // Mavi-Beyaz
    'tottenham': ['#132257', '#FFFFFF'], // Koyu Mavi-Beyaz
    'spurs': ['#132257', '#FFFFFF'],
    'aston villa': ['#95BFE5', '#670E36'], // Açık Mavi-Bordo
    'newcastle': ['#000000', '#FFFFFF'], // Siyah-Beyaz
    'west ham': ['#7A263A', '#1BB1E7'], // Bordo-Mavi
    'brighton': ['#0057B8', '#FFFFFF'], // Mavi-Beyaz
    'wolves': ['#FDB913', '#000000'], // Sarı-Siyah
    'everton': ['#003399', '#FFFFFF'], // Mavi-Beyaz
    'nottingham': ['#DD0000', '#FFFFFF'], // Kırmızı-Beyaz
    'crystal palace': ['#1B458F', '#C4122E'], // Mavi-Kırmızı
    'brentford': ['#E30613', '#FFFFFF'], // Kırmızı-Beyaz
    'fulham': ['#FFFFFF', '#000000'], // Beyaz-Siyah
    'bournemouth': ['#DA291C', '#000000'], // Kırmızı-Siyah
    
    // La Liga
    'real madrid': ['#FFFFFF', '#00529F'], // Beyaz-Mavi
    'barcelona': ['#004D98', '#A50044'], // Mavi-Kırmızı
    'atletico madrid': ['#CB3524', '#FFFFFF'], // Kırmızı-Beyaz
    'atlético madrid': ['#CB3524', '#FFFFFF'],
    'atletico': ['#CB3524', '#FFFFFF'],
    
    // Bundesliga
    'bayern munich': ['#DC052D', '#FFFFFF'], // Kırmızı-Beyaz
    'bayern': ['#DC052D', '#FFFFFF'],
    'borussia dortmund': ['#FDE100', '#000000'], // Sarı-Siyah
    'dortmund': ['#FDE100', '#000000'],
    'bayer leverkusen': ['#E32221', '#000000'], // Kırmızı-Siyah
    'leverkusen': ['#E32221', '#000000'],
    'rb leipzig': ['#DD0741', '#FFFFFF'], // Kırmızı-Beyaz
    'leipzig': ['#DD0741', '#FFFFFF'],
    'eintracht frankfurt': ['#E1000F', '#000000'], // Kırmızı-Siyah
    'frankfurt': ['#E1000F', '#000000'],
    
    // Serie A
    'ac milan': ['#AC1818', '#000000'], // Kırmızı-Siyah
    'milan': ['#AC1818', '#000000'],
    'inter': ['#010E80', '#000000'], // Mavi-Siyah
    'inter milan': ['#010E80', '#000000'],
    'juventus': ['#000000', '#FFFFFF'], // Siyah-Beyaz
    'napoli': ['#12A0D7', '#FFFFFF'], // Mavi-Beyaz
    
    // Ligue 1
    'paris saint germain': ['#004170', '#DA291C'], // Mavi-Kırmızı
    'psg': ['#004170', '#DA291C'],
    'paris': ['#004170', '#DA291C'],
    'marseille': ['#2FAEE0', '#FFFFFF'], // Mavi-Beyaz
    'lyon': ['#0046A0', '#E10000'], // Mavi-Kırmızı
    'monaco': ['#E30613', '#FFFFFF'], // Kırmızı-Beyaz
    'lille': ['#E30613', '#FFFFFF'], // Kırmızı-Beyaz
    
    // Primeira Liga
    'benfica': ['#FF0000', '#FFFFFF'], // Kırmızı-Beyaz
    
    // Milli Takımlar
    'türkiye': ['#E30A17', '#FFFFFF'], // Kırmızı-Beyaz
    'turkey': ['#E30A17', '#FFFFFF'],
    'almanya': ['#000000', '#DD0000'], // Siyah-Kırmızı
    'germany': ['#000000', '#DD0000'],
    'fransa': ['#002395', '#FFFFFF'], // Mavi-Beyaz
    'france': ['#002395', '#FFFFFF'],
    'ingiltere': ['#FFFFFF', '#CF081F'], // Beyaz-Kırmızı
    'england': ['#FFFFFF', '#CF081F'],
    'ispanya': ['#AA151B', '#F1BF00'], // Kırmızı-Sarı
    'spain': ['#AA151B', '#F1BF00'],
    'italya': ['#009246', '#FFFFFF'], // Yeşil-Beyaz
    'italy': ['#009246', '#FFFFFF'],
    'brezilya': ['#009C3B', '#FFDF00'], // Yeşil-Sarı
    'brazil': ['#009C3B', '#FFDF00'],
    'arjantin': ['#74ACDF', '#FFFFFF'], // Mavi-Beyaz
    'argentina': ['#74ACDF', '#FFFFFF'],
    'portekiz': ['#006600', '#FF0000'], // Yeşil-Kırmızı
    'portugal': ['#006600', '#FF0000'],
    'hollanda': ['#FF6600', '#FFFFFF'], // Turuncu-Beyaz
    'netherlands': ['#FF6600', '#FFFFFF'],
    'romanya': ['#FFCD00', '#002B7F'], // Sarı-Mavi
    'romania': ['#FFCD00', '#002B7F'],
  };
  
  // Takım ismine göre eşleştirme
  for (const [key, colors] of Object.entries(teamColors)) {
    if (name.includes(key)) return colors;
  }
  
  // Varsayılan renkler (mavi-beyaz)
  return ['#1E40AF', '#FFFFFF'];
};

/**
 * Takım ID'sine göre renkleri API'den çeker ve cache'e kaydeder
 */
export const fetchTeamColorsFromApi = async (teamId: number): Promise<string[] | null> => {
  // Önce cache'den kontrol et
  if (teamColorsCache[teamId]) {
    return teamColorsCache[teamId];
  }
  
  try {
    const response = await fetch(`http://localhost:3001/api/static-teams/${teamId}/colors`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.colors) {
        const colors = data.colors;
        teamColorsCache[teamId] = colors;
        return colors;
      }
    }
  } catch (error) {
    console.warn(`Failed to fetch colors for team ${teamId}:`, error);
  }
  
  return null;
};

/**
 * Takım ID'sine göre renkleri döndürür (cache + API + fallback)
 */
export const getTeamColorsById = async (teamId: number, teamName?: string): Promise<string[]> => {
  // 1. Cache'den kontrol et
  if (teamColorsCache[teamId]) {
    return teamColorsCache[teamId];
  }
  
  // 2. API'den çek
  const apiColors = await fetchTeamColorsFromApi(teamId);
  if (apiColors) {
    return apiColors;
  }
  
  // 3. İsimden çek (fallback)
  if (teamName) {
    return getTeamColors(teamName, teamId);
  }
  
  // 4. Varsayılan renkler
  return ['#1E40AF', '#FFFFFF'];
};
