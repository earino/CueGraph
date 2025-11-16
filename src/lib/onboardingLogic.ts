import type { UserSettings } from './types';
import { getPhaseForDay, getDayContent } from './onboardingContent';

/**
 * Calculate which day the user should be on based on their start date
 * and last activity. This allows for flexible pacing - users can skip days
 * but won't be penalized for it.
 */
export function calculateCurrentDay(settings: UserSettings): number {
  const { onboardingStartDate, currentOnboardingDay } = settings;

  // If no start date, they're on day 1
  if (!onboardingStartDate) {
    return 1;
  }

  const now = new Date();
  const startDate = new Date(onboardingStartDate);

  // Calculate days since start (calendar days)
  const daysSinceStart = Math.floor(
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // For gentle progression: user advances to next calendar day, but never forced beyond day 60
  const calculatedDay = Math.min(daysSinceStart + 1, 60);

  // Return whichever is higher: the calculated day or their saved progress
  // This allows manual progression while respecting calendar time
  return Math.max(calculatedDay, currentOnboardingDay);
}

/**
 * Mark a specific day as completed
 */
export function markDayComplete(
  settings: UserSettings,
  day: number
): Partial<UserSettings> {
  const { onboardingDaysCompleted } = settings;

  // Don't re-add if already completed
  if (onboardingDaysCompleted.includes(day)) {
    return {};
  }

  const newCompleted = [...onboardingDaysCompleted, day].sort((a, b) => a - b);
  const updates: Partial<UserSettings> = {
    onboardingDaysCompleted: newCompleted,
    lastActivityDate: new Date().toISOString(),
  };

  // If completing day 60, mark onboarding as fully completed
  if (day === 60) {
    updates.onboardingCompleted = true;
    updates.onboardingPhase = 'completed';
    updates.onboardingMode = false; // Automatically exit onboarding mode
  }

  return updates;
}

/**
 * Advance to the next day manually (for testing or user control)
 */
export function advanceToNextDay(settings: UserSettings): Partial<UserSettings> {
  const nextDay = Math.min(settings.currentOnboardingDay + 1, 60);
  const newPhase = getPhaseForDay(nextDay);

  const updates: Partial<UserSettings> = {
    currentOnboardingDay: nextDay,
    onboardingPhase: newPhase,
    lastActivityDate: new Date().toISOString(),
  };

  // Set start date if not set
  if (!settings.onboardingStartDate) {
    updates.onboardingStartDate = new Date().toISOString();
  }

  return updates;
}

/**
 * Start the onboarding journey
 */
export function startOnboarding(): Partial<UserSettings> {
  return {
    onboardingStartDate: new Date().toISOString(),
    currentOnboardingDay: 1,
    onboardingDaysCompleted: [],
    onboardingPhase: 'foundation',
    lastActivityDate: new Date().toISOString(),
    onboardingMode: true,
  };
}

/**
 * Exit onboarding mode (switch to advanced/free mode)
 * User can still be in the 60-day period but chooses to explore freely
 */
export function exitOnboardingMode(): Partial<UserSettings> {
  return {
    onboardingMode: false,
  };
}

/**
 * Re-enter onboarding mode
 */
export function enterOnboardingMode(): Partial<UserSettings> {
  return {
    onboardingMode: true,
  };
}

/**
 * Check if a day is completed
 */
export function isDayCompleted(settings: UserSettings, day: number): boolean {
  return settings.onboardingDaysCompleted.includes(day);
}

/**
 * Get completion percentage
 */
export function getCompletionPercentage(settings: UserSettings): number {
  return (settings.onboardingDaysCompleted.length / 60) * 100;
}

/**
 * Get streak of consecutive completed days
 */
export function getCurrentStreak(settings: UserSettings): number {
  const completed = [...settings.onboardingDaysCompleted].sort((a, b) => b - a);
  if (completed.length === 0) return 0;

  let streak = 1;
  for (let i = 0; i < completed.length - 1; i++) {
    if (completed[i] - completed[i + 1] === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Suggest the ideal event types for a given day based on the curriculum
 */
export function getSuggestedEventTypesForDay(day: number): string[] {
  const dayContent = getDayContent(day);
  return dayContent?.suggestedEventTypes || [];
}

/**
 * Check if today's goal has been met (basic heuristic based on activity)
 * This is a simple implementation - can be enhanced with more specific goal tracking
 */
export function hasMetTodaysGoal(
  settings: UserSettings,
  eventCount: number
): boolean {
  const { currentOnboardingDay } = settings;

  // Simple heuristic: if user has logged at least 3 events today, they're making progress
  // This can be enhanced with more specific goal tracking per day
  if (currentOnboardingDay <= 7) {
    // Week 1: Just log events
    return eventCount >= 3;
  }

  // Default: any activity counts as progress
  return eventCount > 0;
}
