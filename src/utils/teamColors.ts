// Team Colors Utility
// Takım renklerini static_teams tablosundan veya hardcoded mapping'den alır

/**
 * Takım ismine göre forma renklerini döndürür
 * Önce static_teams tablosundan almayı dener, yoksa hardcoded mapping kullanır
 */
export const getTeamColors = (teamName: string, teamId?: number): string[] => {
  const name = teamName.toLowerCase();
  
  // ✅ Hardcoded renkler (static_teams tablosu ile uyumlu)
  const teamColors: Record<string, string[]> = {
    // Türk Süper Lig
    'galatasaray': ['#FF0000', '#FFD700'], // Kırmızı-Sarı
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
    
    // Premier League
    'manchester city': ['#6CABDD', '#1C2C5B'], // Açık Mavi-Koyu Mavi
    'manchester united': ['#DA291C', '#FBE122'], // Kırmızı-Sarı
    'liverpool': ['#C8102E', '#00B2A9'], // Kırmızı-Turkuaz
    'arsenal': ['#EF0107', '#FFFFFF'], // Kırmızı-Beyaz
    'chelsea': ['#034694', '#FFFFFF'], // Mavi-Beyaz
    'tottenham': ['#132257', '#FFFFFF'], // Koyu Mavi-Beyaz
    'aston villa': ['#95BFE5', '#670E36'], // Açık Mavi-Bordo
    
    // La Liga
    'real madrid': ['#FFFFFF', '#00529F'], // Beyaz-Mavi
    'barcelona': ['#004D98', '#A50044'], // Mavi-Kırmızı
    'atletico madrid': ['#CB3524', '#FFFFFF'], // Kırmızı-Beyaz
    'atlético madrid': ['#CB3524', '#FFFFFF'],
    
    // Bundesliga
    'bayern munich': ['#DC052D', '#FFFFFF'], // Kırmızı-Beyaz ✅ DÜZELTME
    'bayern': ['#DC052D', '#FFFFFF'], // Kırmızı-Beyaz ✅ DÜZELTME
    'borussia dortmund': ['#FDE100', '#000000'], // Sarı-Siyah
    'bayer leverkusen': ['#E32221', '#000000'], // Kırmızı-Siyah
    
    // Serie A
    'ac milan': ['#AC1818', '#000000'], // Kırmızı-Siyah
    'inter': ['#010E80', '#000000'], // Mavi-Siyah
    'juventus': ['#000000', '#FFFFFF'], // Siyah-Beyaz
    'napoli': ['#12A0D7', '#FFFFFF'], // Mavi-Beyaz
    
    // Ligue 1
    'paris saint germain': ['#004170', '#DA291C'], // Mavi-Kırmızı
    'psg': ['#004170', '#DA291C'],
    'marseille': ['#2FAEE0', '#FFFFFF'], // Mavi-Beyaz
    'lyon': ['#0046A0', '#E10000'], // Mavi-Kırmızı
    
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
  };
  
  // Takım ismine göre eşleştirme
  for (const [key, colors] of Object.entries(teamColors)) {
    if (name.includes(key)) return colors;
  }
  
  // Varsayılan renkler (mavi-beyaz)
  return ['#1E40AF', '#FFFFFF'];
};

/**
 * Takım ID'sine göre renkleri döndürür (gelecekte static_teams API'sinden çekilebilir)
 */
export const getTeamColorsById = async (teamId: number): Promise<string[] | null> => {
  // TODO: Supabase'den static_teams tablosundan çek
  // Şimdilik null döndür (hardcoded mapping kullanılacak)
  return null;
};
