// LocalStorage utility for persisting user data

import { 
  UserProfile, 
  UserActivity, 
  ActivityCompletion,
  ActivityStatus
} from './activities';

const STORAGE_KEYS = {
  PROFILE: 'realtor_exec_profile',
  ACTIVITIES: 'realtor_exec_activities',
  COMPLETIONS: 'realtor_exec_completions',
  BARRIERS: 'realtor_exec_barriers',
};

// Profile Management
export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Failed to save profile:', error);
  }
}

export function loadProfile(): UserProfile | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load profile:', error);
    return null;
  }
}

// Activity Status Management
export function saveActivityStatuses(activities: Map<string, ActivityStatus>): void {
  try {
    const activityArray = Array.from(activities.entries());
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activityArray));
  } catch (error) {
    console.error('Failed to save activity statuses:', error);
  }
}

export function loadActivityStatuses(): Map<string, ActivityStatus> {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    if (data) {
      const activityArray: [string, ActivityStatus][] = JSON.parse(data);
      return new Map(activityArray);
    }
  } catch (error) {
    console.error('Failed to load activity statuses:', error);
  }
  return new Map();
}

// Barrier Management (activityId -> barrierId or custom:text)
export function saveBarriers(barriers: Map<string, string>): void {
  try {
    const arr = Array.from(barriers.entries());
    localStorage.setItem(STORAGE_KEYS.BARRIERS, JSON.stringify(arr));
  } catch (error) {
    console.error('Failed to save barriers:', error);
  }
}

export function loadBarriers(): Map<string, string> {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BARRIERS);
    if (data) {
      const arr: [string, string][] = JSON.parse(data);
      return new Map(arr);
    }
  } catch (error) {
    console.error('Failed to load barriers:', error);
  }
  return new Map();
}

// Completion Management
export function saveCompletions(completions: ActivityCompletion[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COMPLETIONS, JSON.stringify(completions));
  } catch (error) {
    console.error('Failed to save completions:', error);
  }
}

export function loadCompletions(): ActivityCompletion[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.COMPLETIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load completions:', error);
    return [];
  }
}

export function addCompletion(
  activityId: string,
  generatedContent?: string,
  notes?: string
): ActivityCompletion {
  const completion: ActivityCompletion = {
    activityId,
    completedAt: new Date().toISOString(),
    generatedContent,
    notes
  };

  const completions = loadCompletions();
  completions.push(completion);
  saveCompletions(completions);

  return completion;
}

// User Activity (combined status + tracking) Management
export function initializeUserActivities(
  activityIds: string[],
  statuses: Map<string, ActivityStatus>,
  barriers?: Map<string, string> // activityId -> barrierId
): UserActivity[] {
  const completions = loadCompletions();
  const barrierMap = barriers || loadBarriers();
  
  return activityIds.map(id => {
    const status = statuses.get(id) || 'not-doing';
    const selectedBarrier = barrierMap.get(id); // Use provided or persisted barrier
    const activityCompletions = completions.filter(c => c.activityId === id);
    const lastCompletion = activityCompletions.length > 0 
      ? activityCompletions.sort((a, b) => 
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        )[0]
      : undefined;

    // Calculate streak based on activity frequency
    // This is simplified - you'd need the Activity object to get frequency
    const streak = calculateStreakSimple(activityCompletions);

    return {
      activityId: id,
      status,
      selectedBarrier, // Store the barrier
      lastCompleted: lastCompletion?.completedAt,
      streak,
      totalCompletions: activityCompletions.length,
      notes: lastCompletion?.notes
    };
  });
}

function calculateStreakSimple(completions: ActivityCompletion[]): number {
  if (completions.length === 0) return 0;

  const sorted = completions.sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  let streak = 0;
  const now = new Date();
  
  for (let i = 0; i < sorted.length; i++) {
    const completedDate = new Date(sorted[i].completedAt);
    const daysDiff = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Simplified: count if within 7 days intervals
    if (daysDiff <= 7 * (i + 1)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Utility to check if user has completed onboarding
export function hasCompletedOnboarding(): boolean {
  const profile = loadProfile();
  return profile?.onboardingComplete === true;
}

// Reset everything (for testing or starting over)
export function clearAllData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
    localStorage.removeItem(STORAGE_KEYS.COMPLETIONS);
    localStorage.removeItem(STORAGE_KEYS.BARRIERS);
  } catch (error) {
    console.error('Failed to clear data:', error);
  }
}

// Get dashboard summary data
export function getDashboardSummary() {
  const profile = loadProfile();
  const completions = loadCompletions();
  
  // Completions this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const completionsThisWeek = completions.filter(
    c => new Date(c.completedAt) >= oneWeekAgo
  );

  // Activities by streak
  const activityStreaks = new Map<string, number>();
  const activityIds = new Set(completions.map(c => c.activityId));
  
  activityIds.forEach(id => {
    const activityCompletions = completions.filter(c => c.activityId === id);
    const streak = calculateStreakSimple(activityCompletions);
    if (streak > 0) {
      activityStreaks.set(id, streak);
    }
  });

  const longestStreak = activityStreaks.size > 0 
    ? Math.max(...Array.from(activityStreaks.values()))
    : 0;

  return {
    profile,
    completionsThisWeek: completionsThisWeek.length,
    longestStreak,
    totalCompletions: completions.length,
    activeStreaks: activityStreaks.size
  };
}
