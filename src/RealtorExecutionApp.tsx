import React, { useState, useEffect } from 'react';
import { DiagnosticFlow } from './DiagnosticFlow';
import { DashboardHome } from './DashboardHome';
import { ExecutionEngine } from './ExecutionEngine';
import {
  UserProfile,
  UserActivity,
  ActivityCompletion,
  ActivityStatus,
  getActivityById
} from './activities';
import {
  saveProfile,
  loadProfile,
  saveActivityStatuses,
  loadActivityStatuses,
  addCompletion,
  loadCompletions,
  initializeUserActivities,
  hasCompletedOnboarding,
  saveBarriers,
  loadBarriers
} from './storage';

type AppView = 'diagnostic' | 'dashboard' | 'execution';

export const RealtorExecutionApp: React.FC = () => {
  const [view, setView] = useState<AppView>('diagnostic');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [completions, setCompletions] = useState<ActivityCompletion[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    const savedProfile = loadProfile();
    const savedCompletions = loadCompletions();
    
    setCompletions(savedCompletions);

    if (savedProfile && hasCompletedOnboarding()) {
      setProfile(savedProfile);
      const statuses = loadActivityStatuses();
      const barriers = loadBarriers();
      const activities = initializeUserActivities(savedProfile.priorityActivities, statuses, barriers);
      setUserActivities(activities);
      setView('dashboard');
    }
  }, []);

  const handleDiagnosticComplete = (
    newProfile: UserProfile,
    selectedActivityId: string,
    selectedBarrier: string
  ) => {
    // Save to localStorage
    saveProfile(newProfile);
    
    // Create single activity status
    const statuses = new Map<string, ActivityStatus>([[selectedActivityId, 'not-doing']]);
    saveActivityStatuses(statuses);
    
    // Save single barrier
    const barriers = new Map<string, string>([[selectedActivityId, selectedBarrier]]);
    saveBarriers(barriers);

    // Initialize user activities WITH barriers
    const activities = initializeUserActivities(newProfile.priorityActivities, statuses, barriers);

    // Update state
    setProfile(newProfile);
    setUserActivities(activities);
    setView('dashboard');
  };

  const handleActivityClick = (activityId: string) => {
    setSelectedActivityId(activityId);
    setView('execution');
  };

  const handleActivityComplete = (generatedContent?: string, notes?: string) => {
    if (!selectedActivityId) return;

    // Add completion to storage
    const completion = addCompletion(selectedActivityId, generatedContent, notes);

    // Update completions state
    const updatedCompletions = [...completions, completion];
    setCompletions(updatedCompletions);

    // Recalculate user activities with new completion
    if (profile) {
      const statuses = loadActivityStatuses();
      const barriers = loadBarriers();
      const activities = initializeUserActivities(profile.priorityActivities, statuses, barriers);
      setUserActivities(activities);
    }

    // Show success and return to dashboard
    setSelectedActivityId(null);
    setView('dashboard');

    // Optional: Show confetti or success message
    if (typeof window !== 'undefined' && (window as any).confetti) {
      (window as any).confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleBackToDashboard = () => {
    setSelectedActivityId(null);
    setView('dashboard');
  };

  const handleEditProfile = () => {
    setView('diagnostic');
  };

  // Render current view
  if (view === 'diagnostic') {
    return <DiagnosticFlow onComplete={handleDiagnosticComplete} />;
  }

  if (view === 'dashboard' && profile) {
    return (
      <DashboardHome
        profile={profile}
        userActivities={userActivities}
        completions={completions}
        onActivityClick={handleActivityClick}
        onEditProfile={handleEditProfile}
      />
    );
  }

  if (view === 'execution' && selectedActivityId && profile) {
    const activity = getActivityById(selectedActivityId);
    const userActivity = userActivities.find(ua => ua.activityId === selectedActivityId);
    
    if (!activity) {
      // Fallback if activity not found
      setView('dashboard');
      return null;
    }

    return (
      <ExecutionEngine
        activity={activity}
        userActivity={userActivity}
        profile={profile}
        onComplete={handleActivityComplete}
        onBack={handleBackToDashboard}
      />
    );
  }

  // Loading state
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e0e0e0',
          borderTopColor: '#667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{ fontSize: '16px', color: '#666' }}>Loading...</p>
      </div>
    </div>
  );
};

// Add this to your global CSS or inline:
// @keyframes spin {
//   to { transform: rotate(360deg); }
// }
