/**
 * Rating utility functions
 * Gösterim: 0-100 tam puan (60–70 arası fark korunur, gereksiz yuvarlama yok).
 * Hesaplama: backend/utils/playerRatingFromStats.js (API istatistikleri + 6 öznitelik → rating 65-95).
 */

/**
 * Normalize rating for display: 0-10 → ×10 (67), 11-100 → tam sayı (72). Default 75.
 */
export function normalizeRating(rating: number | null | undefined): number {
  if (rating == null || rating === 0) return 75;
  const r = Number(rating);
  if (r > 0 && r <= 10) return Math.min(100, Math.round(r * 10));
  if (r > 10 && r <= 100) return Math.round(r);
  if (r > 100) return 100;
  if (r < 0) return 0;
  return Math.round(r);
}

/**
 * Calculate overall rating from skill stats (pace, shooting, passing, dribbling, defending, physical)
 * Returns average of all 6 skills, normalized to 65-95 range
 */
export function calculateRatingFromStats(stats: {
  pace?: number | null;
  shooting?: number | null;
  passing?: number | null;
  dribbling?: number | null;
  defending?: number | null;
  physical?: number | null;
}): number {
  const skills = [
    stats.pace ?? 70,
    stats.shooting ?? 70,
    stats.passing ?? 70,
    stats.dribbling ?? 70,
    stats.defending ?? 70,
    stats.physical ?? 70,
  ];
  
  // Filter out null/undefined values
  const validSkills = skills.filter(s => s != null && s > 0);
  
  if (validSkills.length === 0) {
    return 75; // Default if no valid skills
  }
  
  // Calculate average
  const average = validSkills.reduce((sum, val) => sum + val, 0) / validSkills.length;
  
  // Normalize to 65-95 range
  return normalizeRating(average);
}

/**
 * Format rating for display (always show as integer)
 */
export function formatRating(rating: number | null | undefined): string {
  const normalized = normalizeRating(rating);
  return normalized.toString();
}
