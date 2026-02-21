/**
 * Rating utility functions
 * Normalizes ratings to consistent format (65-95 integer range)
 */

/**
 * Normalize rating to 65-95 integer range
 * Handles both match ratings (0-10 scale) and overall ratings (65-95 scale)
 */
export function normalizeRating(rating: number | null | undefined): number {
  if (rating == null || rating === 0) {
    return 75; // Default rating
  }
  
  // If rating is between 0-10 (match rating scale), convert to 65-95 scale
  if (rating > 0 && rating <= 10) {
    // Convert 0-10 scale to 65-95 scale
    // 0 → 65, 10 → 95
    const normalized = Math.round(65 + (rating / 10) * 30);
    return Math.max(65, Math.min(95, normalized));
  }
  
  // If rating is already in 65-95 range, round to integer
  if (rating >= 65 && rating <= 95) {
    return Math.round(rating);
  }
  
  // If rating is very high (>95), cap at 95
  if (rating > 95) {
    return 95;
  }
  
  // If rating is very low (<65), cap at 65
  if (rating < 65) {
    return 65;
  }
  
  // Default fallback
  return Math.round(rating);
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
