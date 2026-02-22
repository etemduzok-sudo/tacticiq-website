import { type AnalysisFocusType } from '../components/AnalysisFocusModal';

export const FOCUS_CATEGORY_MAPPING: Record<AnalysisFocusType, string[]> = {
  defense: ['yellowCards', 'redCards', 'yellowCard', 'redCard', 'secondYellowRed', 'directRedCard'],
  offense: ['firstHalfHomeScore', 'firstHalfAwayScore', 'secondHalfHomeScore', 'secondHalfAwayScore', 'totalGoals', 'firstGoalTime', 'goal', 'willScore', 'penaltyTaker', 'penaltyScored', 'penaltyMissed'],
  midfield: ['possession', 'tempo'],
  physical: ['tempo', 'injuredOut', 'injurySubstitutePlayer', 'substitutedOut', 'substitutePlayer'],
  tactical: ['scenario', 'firstHalfInjuryTime', 'secondHalfInjuryTime'],
  player: ['manOfTheMatch', 'goal', 'assist', 'willScore', 'willAssist', 'penaltyTaker', 'penaltyScored', 'penaltyMissed'],
};

export const getCategoryFocus = (category: string): AnalysisFocusType | null => {
  for (const [focusId, categories] of Object.entries(FOCUS_CATEGORY_MAPPING)) {
    if (categories.includes(category)) {
      return focusId as AnalysisFocusType;
    }
  }
  return null;
};

export const PLAYER_RELATED_CATEGORIES = [
  'manOfTheMatch', 'goal', 'assist', 'willScore', 'willAssist',
  'yellowCard', 'redCard', 'secondYellowRed', 'directRedCard',
  'substitutedOut', 'injuredOut', 'substitutePlayer', 'injurySubstitutePlayer',
  'penaltyTaker', 'penaltyScored', 'penaltyMissed',
];

export const doesFocusIncludePlayerPredictions = (focusType: AnalysisFocusType | null): boolean => {
  if (!focusType) return false;
  const focusCategories = FOCUS_CATEGORY_MAPPING[focusType] || [];
  return PLAYER_RELATED_CATEGORIES.some(cat => focusCategories.includes(cat));
};
