/**
 * Grade system configuration
 * Must match backend config.py GradeRequirements
 */

export const GRADE_REQUIREMENTS = {
  Bronze: { routines: 10, streak: 5, timeHours: 1 },
  Silver: { routines: 50, streak: 15, timeHours: 5 },
  Gold: { routines: 150, streak: 30, timeHours: 15 },
  Platinum: { routines: 300, streak: 60, timeHours: 30 },
  Diamond: { routines: 600, streak: 120, timeHours: 60 },
  Legend: { routines: 1000, streak: 200, timeHours: 100 }
} as const;

export const GRADE_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Legend'] as const;

export type GradeName = keyof typeof GRADE_REQUIREMENTS;

export const GRADE_EMOJIS: Record<GradeName, string> = {
  Bronze: '🥉',
  Silver: '🥈',
  Gold: '🥇',
  Platinum: '💎',
  Diamond: '💠',
  Legend: '🏆'
};

export const GRADE_BADGES: Record<GradeName, string> = {
  Bronze: '/badges/bronze.png',
  Silver: '/badges/silver.png',
  Gold: '/badges/gold.png',
  Platinum: '/badges/platinum.png',
  Diamond: '/badges/diamond.png',
  Legend: '/badges/legend.png'
};

export const GRADE_COLORS: Record<GradeName, string> = {
  Bronze: 'from-orange-400 to-orange-600',
  Silver: 'from-gray-300 to-gray-500',
  Gold: 'from-yellow-400 to-yellow-600',
  Platinum: 'from-cyan-400 to-cyan-600',
  Diamond: 'from-blue-400 to-blue-600',
  Legend: 'from-purple-500 to-pink-600'
};

/**
 * Get the next grade for a given grade
 */
export function getNextGrade(currentGrade: GradeName): GradeName | null {
  const currentIndex = GRADE_ORDER.indexOf(currentGrade);
  if (currentIndex === -1 || currentIndex === GRADE_ORDER.length - 1) {
    return null; // Legend is max
  }
  return GRADE_ORDER[currentIndex + 1];
}

/**
 * Get requirements for the next grade
 */
export function getNextGradeRequirements(currentGrade: GradeName) {
  const nextGrade = getNextGrade(currentGrade);
  if (!nextGrade) return null;
  return GRADE_REQUIREMENTS[nextGrade];
}
