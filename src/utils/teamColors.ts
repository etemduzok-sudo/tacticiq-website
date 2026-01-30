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
    'tottenham hotspur': ['#132257', '#FFFFFF'],
    'aston villa': ['#95BFE5', '#670E36'], // Açık Mavi-Bordo
    'newcastle': ['#000000', '#FFFFFF'], // Siyah-Beyaz
    'newcastle united': ['#000000', '#FFFFFF'],
    'west ham': ['#7A263A', '#1BB1E7'], // Bordo-Mavi
    'west ham united': ['#7A263A', '#1BB1E7'],
    'brighton': ['#0057B8', '#FFFFFF'], // Mavi-Beyaz
    'brighton & hove albion': ['#0057B8', '#FFFFFF'],
    'wolves': ['#FDB913', '#000000'], // Sarı-Siyah
    'wolverhampton': ['#FDB913', '#000000'],
    'wolverhampton wanderers': ['#FDB913', '#000000'],
    'everton': ['#003399', '#FFFFFF'], // Mavi-Beyaz
    'nottingham': ['#DD0000', '#FFFFFF'], // Kırmızı-Beyaz
    'nottingham forest': ['#DD0000', '#FFFFFF'],
    'crystal palace': ['#1B458F', '#C4122E'], // Mavi-Kırmızı
    'brentford': ['#E30613', '#FFFFFF'], // Kırmızı-Beyaz
    'fulham': ['#FFFFFF', '#000000'], // Beyaz-Siyah
    'bournemouth': ['#DA291C', '#000000'], // Kırmızı-Siyah
    'afc bournemouth': ['#DA291C', '#000000'],
    'luton town': ['#F78F1E', '#002D62'], // Turuncu-Mavi
    'luton': ['#F78F1E', '#002D62'],
    'burnley': ['#6C1D45', '#99D6EA'], // Bordo-Açık Mavi
    'sheffield united': ['#EE2737', '#FFFFFF'], // Kırmızı-Beyaz
    'sheffield': ['#EE2737', '#FFFFFF'],
    'ipswich': ['#0000FF', '#FFFFFF'], // Mavi-Beyaz
    'ipswich town': ['#0000FF', '#FFFFFF'],
    'leicester': ['#003090', '#FDBE11'], // Mavi-Sarı
    'leicester city': ['#003090', '#FDBE11'],
    'southampton': ['#D71920', '#FFFFFF'], // Kırmızı-Beyaz
    
    // La Liga
    'real madrid': ['#FFFFFF', '#00529F'], // Beyaz-Mavi
    'barcelona': ['#004D98', '#A50044'], // Mavi-Kırmızı
    'atletico madrid': ['#CB3524', '#FFFFFF'], // Kırmızı-Beyaz
    'atlético madrid': ['#CB3524', '#FFFFFF'],
    'atletico': ['#CB3524', '#FFFFFF'],
    'girona': ['#CD2E34', '#FFFFFF'], // Kırmızı-Beyaz
    'rayo vallecano': ['#FFFFFF', '#E30613'], // Beyaz-Kırmızı
    'getafe': ['#0048BA', '#FFFFFF'], // Mavi-Beyaz
    'osasuna': ['#D91A21', '#00529F'], // Kırmızı-Mavi
    'celta vigo': ['#8FBCE5', '#FFFFFF'], // Açık Mavi-Beyaz
    'celta': ['#8FBCE5', '#FFFFFF'],
    'mallorca': ['#E30613', '#000000'], // Kırmızı-Siyah
    'almeria': ['#E30613', '#FFFFFF'], // Kırmızı-Beyaz
    'cadiz': ['#FFCC00', '#003399'], // Sarı-Mavi
    'las palmas': ['#FFCC00', '#003399'], // Sarı-Mavi
    'alaves': ['#003DA5', '#FFFFFF'], // Mavi-Beyaz
    'granada': ['#CF1027', '#FFFFFF'], // Kırmızı-Beyaz
    
    // Bundesliga
    'bayern munich': ['#DC052D', '#FFFFFF'], // Kırmızı-Beyaz
    'bayern münchen': ['#DC052D', '#FFFFFF'],
    'bayern': ['#DC052D', '#FFFFFF'],
    'borussia dortmund': ['#FDE100', '#000000'], // Sarı-Siyah
    'dortmund': ['#FDE100', '#000000'],
    'bayer leverkusen': ['#E32221', '#000000'], // Kırmızı-Siyah
    'leverkusen': ['#E32221', '#000000'],
    'rb leipzig': ['#DD0741', '#FFFFFF'], // Kırmızı-Beyaz
    'leipzig': ['#DD0741', '#FFFFFF'],
    'eintracht frankfurt': ['#E1000F', '#000000'], // Kırmızı-Siyah
    'frankfurt': ['#E1000F', '#000000'],
    'hamburger sv': ['#005B9E', '#FFFFFF'], // Mavi-Beyaz
    'hamburg': ['#005B9E', '#FFFFFF'],
    'hsv': ['#005B9E', '#FFFFFF'],
    'schalke 04': ['#004D9D', '#FFFFFF'], // Mavi-Beyaz
    'schalke': ['#004D9D', '#FFFFFF'],
    'werder bremen': ['#1D9053', '#FFFFFF'], // Yeşil-Beyaz
    'bremen': ['#1D9053', '#FFFFFF'],
    'vfb stuttgart': ['#E32219', '#FFFFFF'], // Kırmızı-Beyaz
    'stuttgart': ['#E32219', '#FFFFFF'],
    'borussia mönchengladbach': ['#000000', '#FFFFFF'], // Siyah-Beyaz
    'mönchengladbach': ['#000000', '#FFFFFF'],
    'gladbach': ['#000000', '#FFFFFF'],
    'hoffenheim': ['#1961B5', '#FFFFFF'], // Mavi-Beyaz
    '1899 hoffenheim': ['#1961B5', '#FFFFFF'],
    'tsg hoffenheim': ['#1961B5', '#FFFFFF'],
    'union berlin': ['#EB1923', '#FFFFFF'], // Kırmızı-Beyaz
    'fc köln': ['#ED1C24', '#FFFFFF'], // Kırmızı-Beyaz
    'köln': ['#ED1C24', '#FFFFFF'],
    'koln': ['#ED1C24', '#FFFFFF'],
    'mainz 05': ['#ED1C24', '#FFFFFF'], // Kırmızı-Beyaz
    'mainz': ['#ED1C24', '#FFFFFF'],
    'freiburg': ['#E2001A', '#FFFFFF'], // Kırmızı-Beyaz
    'wolfsburg': ['#65B32E', '#FFFFFF'], // Yeşil-Beyaz
    'augsburg': ['#BA3733', '#006633'], // Kırmızı-Yeşil
    'heidenheim': ['#C8102E', '#1E3A6E'], // Kırmızı-Mavi
    'darmstadt': ['#004DA0', '#FFFFFF'], // Mavi-Beyaz
    'bochum': ['#005CA9', '#FFFFFF'], // Mavi-Beyaz
    
    // Serie A
    'ac milan': ['#AC1818', '#000000'], // Kırmızı-Siyah
    'milan': ['#AC1818', '#000000'],
    'inter': ['#010E80', '#000000'], // Mavi-Siyah
    'inter milan': ['#010E80', '#000000'],
    'juventus': ['#000000', '#FFFFFF'], // Siyah-Beyaz
    'napoli': ['#12A0D7', '#FFFFFF'], // Mavi-Beyaz
    'torino': ['#8B0000', '#FFFFFF'], // Bordo-Beyaz
    'genoa': ['#990000', '#00247D'], // Kırmızı-Mavi
    'sampdoria': ['#0066B2', '#FFFFFF'], // Mavi-Beyaz
    'bologna': ['#1A2F5B', '#A11923'], // Mavi-Kırmızı
    'udinese': ['#000000', '#FFFFFF'], // Siyah-Beyaz
    'sassuolo': ['#00A650', '#000000'], // Yeşil-Siyah
    'empoli': ['#00529B', '#FFFFFF'], // Mavi-Beyaz
    'cagliari': ['#00247D', '#A11923'], // Mavi-Kırmızı
    'hellas verona': ['#FFCC00', '#003399'], // Sarı-Mavi
    'verona': ['#FFCC00', '#003399'],
    'lecce': ['#FFE600', '#E42217'], // Sarı-Kırmızı
    'monza': ['#FF0000', '#FFFFFF'], // Kırmızı-Beyaz
    'frosinone': ['#FFFF00', '#003399'], // Sarı-Mavi
    'salernitana': ['#8B0000', '#FFFFFF'], // Bordo-Beyaz
    
    // Ligue 1
    'paris saint germain': ['#004170', '#DA291C'], // Mavi-Kırmızı
    'paris saint-germain': ['#004170', '#DA291C'],
    'psg': ['#004170', '#DA291C'],
    'paris': ['#004170', '#DA291C'],
    'marseille': ['#2FAEE0', '#FFFFFF'], // Mavi-Beyaz
    'olympique marseille': ['#2FAEE0', '#FFFFFF'],
    'olympique de marseille': ['#2FAEE0', '#FFFFFF'],
    'lyon': ['#0046A0', '#E10000'], // Mavi-Kırmızı
    'olympique lyon': ['#0046A0', '#E10000'],
    'olympique lyonnais': ['#0046A0', '#E10000'],
    'monaco': ['#E30613', '#FFFFFF'], // Kırmızı-Beyaz
    'as monaco': ['#E30613', '#FFFFFF'],
    'lille': ['#E30613', '#FFFFFF'], // Kırmızı-Beyaz
    'losc lille': ['#E30613', '#FFFFFF'],
    'nice': ['#000000', '#E30613'], // Siyah-Kırmızı
    'ogc nice': ['#000000', '#E30613'],
    'lens': ['#FFE500', '#E30613'], // Sarı-Kırmızı
    'rc lens': ['#FFE500', '#E30613'],
    'rennes': ['#000000', '#E30613'], // Siyah-Kırmızı
    'stade rennais': ['#000000', '#E30613'],
    'reims': ['#E30613', '#FFFFFF'], // Kırmızı-Beyaz
    'stade de reims': ['#E30613', '#FFFFFF'],
    'montpellier': ['#1E2A45', '#FF6B00'], // Mavi-Turuncu
    'strasbourg': ['#0066B3', '#FFFFFF'], // Mavi-Beyaz
    'nantes': ['#FFD800', '#009933'], // Sarı-Yeşil
    'fc nantes': ['#FFD800', '#009933'],
    'toulouse': ['#663399', '#FFFFFF'], // Mor-Beyaz
    'brest': ['#E30613', '#FFFFFF'], // Kırmızı-Beyaz
    'stade brestois': ['#E30613', '#FFFFFF'],
    'le havre': ['#0066B3', '#FFFFFF'], // Mavi-Beyaz
    'clermont': ['#E30613', '#FFFFFF'], // Kırmızı-Beyaz
    'metz': ['#8B0000', '#FFFFFF'], // Bordo-Beyaz
    'lorient': ['#FF6600', '#000000'], // Turuncu-Siyah
    
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
