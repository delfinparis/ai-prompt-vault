// Core data structures for the Realtor Execution App

export type ActivityStatus = 'doing-consistently' | 'doing-sometimes' | 'not-doing';
export type ActivityCategory = 'prospecting' | 'relationship' | 'marketing' | 'systems' | 'development';

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  impactScore: number; // 1-10, how much this moves the needle
  frequency: string; // "Daily", "Weekly", "Monthly"
  timeEstimate: string; // "5 mins", "30 mins", etc.
  avoidanceReasons: string[]; // Why agents skip this
  successMetric: string; // What "doing it" looks like
  aiCanHelp: boolean; // Can we generate content for this?
}

export const CORE_ACTIVITIES: Activity[] = [
  {
    id: 'prospecting',
    title: 'Daily Prospecting & Lead Generation',
    description: 'Making calls, sending texts, door knocking, reaching out to sphere (5+ contacts/day)',
    category: 'prospecting',
    impactScore: 10,
    frequency: 'Daily',
    timeEstimate: '30-60 mins',
    avoidanceReasons: [
      'Fear of rejection',
      'Don\'t know what to say',
      'Feels like pushy sales'
    ],
    successMetric: '5+ meaningful contacts per day',
    aiCanHelp: true
  },
  {
    id: 'past-client-followup',
    title: 'Past Client Follow-Up',
    description: 'Regular touchpoints with people who\'ve already bought/sold with you (monthly minimum)',
    category: 'relationship',
    impactScore: 9,
    frequency: 'Monthly',
    timeEstimate: '15-30 mins',
    avoidanceReasons: [
      'Feel like I\'m bothering them',
      'They\'ll call me when ready',
      'Don\'t know what to say'
    ],
    successMetric: 'Contact each past client at least monthly',
    aiCanHelp: true
  },
  {
    id: 'lead-response',
    title: 'Immediate Lead Response',
    description: 'Responding to online leads within 5 minutes of inquiry',
    category: 'prospecting',
    impactScore: 9,
    frequency: 'As needed',
    timeEstimate: '2-5 mins',
    avoidanceReasons: [
      'Not monitoring alerts',
      'Will call them later',
      'Overwhelmed by volume'
    ],
    successMetric: 'Respond within 5 minutes, 100% of the time',
    aiCanHelp: true
  },
  {
    id: 'crm-updates',
    title: 'CRM & Database Management',
    description: 'Adding contacts, logging interactions, setting follow-ups, tagging/categorizing',
    category: 'systems',
    impactScore: 8,
    frequency: 'Daily',
    timeEstimate: '10-15 mins',
    avoidanceReasons: [
      'Boring admin work',
      'Don\'t see immediate ROI',
      'CRM feels complicated'
    ],
    successMetric: 'Update after every interaction',
    aiCanHelp: false
  },
  {
    id: 'social-media',
    title: 'Social Media Content',
    description: 'Market updates, listings, neighborhood tours, personal brand content (3-5x/week)',
    category: 'marketing',
    impactScore: 8,
    frequency: 'Weekly',
    timeEstimate: '10-20 mins per post',
    avoidanceReasons: [
      'Don\'t know what to post',
      'Camera shy',
      'Perfectionism paralysis'
    ],
    successMetric: '3-5 posts per week minimum',
    aiCanHelp: true
  },
  {
    id: 'newsletter',
    title: 'Email/Newsletter to Sphere',
    description: 'Market updates, new listings, local events, value-add content to your database',
    category: 'marketing',
    impactScore: 9,
    frequency: 'Monthly',
    timeEstimate: '30-60 mins',
    avoidanceReasons: [
      'No one reads emails anymore',
      'Don\'t know what to write',
      'Takes too long'
    ],
    successMetric: 'Send at least monthly to entire sphere',
    aiCanHelp: true
  },
  {
    id: 'market-research',
    title: 'Property Previews & Market Research',
    description: 'Touring new listings, attending open houses, studying neighborhoods',
    category: 'development',
    impactScore: 7,
    frequency: 'Weekly',
    timeEstimate: '2-4 hours',
    avoidanceReasons: [
      'Time-consuming',
      'Not revenue-generating',
      'Prefer sitting at computer'
    ],
    successMetric: 'Preview 5+ properties per week',
    aiCanHelp: false
  },
  {
    id: 'open-houses',
    title: 'Hosting Open Houses',
    description: 'Hold open houses on your listings and other agents\' listings',
    category: 'prospecting',
    impactScore: 7,
    frequency: 'Monthly',
    timeEstimate: '3-4 hours per event',
    avoidanceReasons: [
      'They don\'t work anymore',
      'Weekends are for family',
      'Lead quality concerns'
    ],
    successMetric: '1-2 open houses per month minimum',
    aiCanHelp: true
  },
  {
    id: 'ask-referrals',
    title: 'Asking for Referrals & Testimonials',
    description: 'Directly asking clients "Who do you know?" at closing and quarterly',
    category: 'relationship',
    impactScore: 9,
    frequency: 'Monthly',
    timeEstimate: '5-10 mins',
    avoidanceReasons: [
      'Feels awkward',
      'Don\'t want to seem pushy',
      'Assume people will volunteer'
    ],
    successMetric: 'Ask every client at closing + quarterly check-ins',
    aiCanHelp: true
  },
  {
    id: 'skills-training',
    title: 'Skills Training & Script Practice',
    description: 'Role-playing objection handlers, practicing presentations, studying market data',
    category: 'development',
    impactScore: 8,
    frequency: 'Daily',
    timeEstimate: '30 mins',
    avoidanceReasons: [
      'Uncomfortable',
      'Feel like I already know it',
      'Will just wing it'
    ],
    successMetric: '30 minutes of practice daily',
    aiCanHelp: true
  }
];

export interface UserActivity {
  activityId: string;
  status: ActivityStatus;
  lastCompleted?: string; // ISO date string
  streak: number; // consecutive days/weeks/months
  totalCompletions: number;
  notes?: string;
}

export interface UserProfile {
  name: string;
  email?: string;
  market: string; // City, State
  experienceLevel: 'new' | 'intermediate' | 'experienced'; // 0-2 yrs, 3-5 yrs, 6+ yrs
  businessGoal: string; // "Close 24 deals this year", etc.
  priorityActivities: string[]; // Array of activity IDs
  onboardingComplete: boolean;
}

export interface ActivityCompletion {
  activityId: string;
  completedAt: string; // ISO date string
  generatedContent?: string; // If AI helped, store what was created
  notes?: string;
}

export interface DashboardData {
  profile: UserProfile;
  activities: UserActivity[];
  recentCompletions: ActivityCompletion[];
  streaks: {
    activityId: string;
    current: number;
    longest: number;
  }[];
  reminders: {
    activityId: string;
    message: string;
    urgency: 'low' | 'medium' | 'high';
  }[];
}

// Helper functions
export function getActivityById(id: string): Activity | undefined {
  return CORE_ACTIVITIES.find(a => a.id === id);
}

export function getActivitiesByCategory(category: ActivityCategory): Activity[] {
  return CORE_ACTIVITIES.filter(a => a.category === category);
}

export function calculateStreak(completions: ActivityCompletion[], activityId: string, frequency: string): number {
  const activityCompletions = completions
    .filter(c => c.activityId === activityId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  if (activityCompletions.length === 0) return 0;

  let streak = 0;
  const now = new Date();
  const frequencyDays = frequency === 'Daily' ? 1 : frequency === 'Weekly' ? 7 : 30;

  for (let i = 0; i < activityCompletions.length; i++) {
    const completedDate = new Date(activityCompletions[i].completedAt);
    const daysDiff = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= frequencyDays * (i + 1)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function getDaysSinceLastCompletion(completions: ActivityCompletion[], activityId: string): number | null {
  const activityCompletions = completions
    .filter(c => c.activityId === activityId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  if (activityCompletions.length === 0) return null;

  const lastCompletion = new Date(activityCompletions[0].completedAt);
  const now = new Date();
  return Math.floor((now.getTime() - lastCompletion.getTime()) / (1000 * 60 * 60 * 24));
}

// Content generation types
export type ContentType = 'newsletter' | 'social-post' | 'prospecting-script' | 'follow-up-email' | 'referral-request' | 'open-house-plan';

export interface GenerationRequest {
  contentType: ContentType;
  activityId: string;
  inputs: {
    market?: string;
    targetAudience?: string;
    listingAddress?: string;
    clientName?: string;
    topic?: string;
    tone?: 'professional' | 'casual' | 'friendly';
    length?: 'short' | 'medium' | 'long';
  };
}

export interface GenerationResult {
  content: string;
  subject?: string; // For emails
  hashtags?: string[]; // For social media
  callToAction?: string;
  metadata?: Record<string, any>;
}
