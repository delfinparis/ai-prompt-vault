/**
 * Analytics Utility for PromptCrafter
 *
 * Tracks user behavior to measure performance against targets:
 * - Completion Time: Target <40 seconds
 * - Abandon Rate: Target <5%
 * - Default Usage: Track which defaults users keep vs change
 */

export type AnalyticsEvent =
  | 'PromptCrafter_Started'
  | 'PromptCrafter_Completed'
  | 'PromptCrafter_Abandoned'
  | 'Default_Modified'
  | 'AI_Generated'
  | 'Quick_Mode_Toggled';

interface EventData {
  useCase?: string;
  timestamp?: number;
  duration?: number;
  defaultsChanged?: number;
  stepReached?: number;
  totalSteps?: number;
  questionId?: string;
  defaultValue?: string;
  userValue?: string;
  quickMode?: boolean;
  [key: string]: string | number | boolean | undefined;
}

class Analytics {
  private enabled: boolean = true;
  private sessionData: Map<string, any> = new Map();

  /**
   * Track an analytics event
   */
  track(eventName: AnalyticsEvent, data: EventData = {}) {
    if (!this.enabled) return;

    const event = {
      event: eventName,
      ...data,
      timestamp: data.timestamp || Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event);
    }

    // Send to Plausible Analytics (already configured in index.html)
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible(eventName, { props: data });
    }

    // Store in localStorage for later analysis
    this.storeEvent(event);
  }

  /**
   * Store event in localStorage for analysis
   */
  private storeEvent(event: any) {
    try {
      const events = this.getStoredEvents();
      events.push(event);

      // Keep only last 100 events
      const recentEvents = events.slice(-100);
      localStorage.setItem('analytics_events', JSON.stringify(recentEvents));
    } catch (e) {
      console.error('Failed to store analytics event:', e);
    }
  }

  /**
   * Get stored events from localStorage
   */
  private getStoredEvents(): any[] {
    try {
      const stored = localStorage.getItem('analytics_events');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Set session data (e.g., start time for duration tracking)
   */
  setSessionData(key: string, value: any) {
    this.sessionData.set(key, value);
  }

  /**
   * Get session data
   */
  getSessionData(key: string): any {
    return this.sessionData.get(key);
  }

  /**
   * Clear session data
   */
  clearSessionData(key: string) {
    this.sessionData.delete(key);
  }

  /**
   * Get analytics summary for testing
   */
  getSummary(): {
    totalEvents: number;
    completionRate: number;
    avgDuration: number;
    abandonRate: number;
  } {
    const events = this.getStoredEvents();
    const started = events.filter(e => e.event === 'PromptCrafter_Started').length;
    const completed = events.filter(e => e.event === 'PromptCrafter_Completed').length;
    const abandoned = events.filter(e => e.event === 'PromptCrafter_Abandoned').length;

    const durations = events
      .filter(e => e.event === 'PromptCrafter_Completed' && e.duration)
      .map(e => e.duration);

    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    return {
      totalEvents: events.length,
      completionRate: started > 0 ? (completed / started) * 100 : 0,
      avgDuration: avgDuration / 1000, // Convert to seconds
      abandonRate: started > 0 ? (abandoned / started) * 100 : 0
    };
  }

  /**
   * Export all events for analysis
   */
  exportEvents(): string {
    const events = this.getStoredEvents();
    return JSON.stringify(events, null, 2);
  }

  /**
   * Clear all stored events
   */
  clearEvents() {
    localStorage.removeItem('analytics_events');
    this.sessionData.clear();
  }
}

// Export singleton instance
export const analytics = new Analytics();
