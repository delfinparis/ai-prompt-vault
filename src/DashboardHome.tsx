import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  UserProfile, 
  UserActivity,
  ActivityCompletion,
  getActivityById,
  getDaysSinceLastCompletion
} from './activities';

interface DashboardHomeProps {
  profile: UserProfile;
  userActivities: UserActivity[];
  completions: ActivityCompletion[];
  onActivityClick: (activityId: string) => void;
  onEditProfile: () => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  profile,
  userActivities,
  completions,
  onActivityClick,
  onEditProfile
}) => {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const getPriorityActivities = (): Activity[] => {
    return profile.priorityActivities
      .map(id => getActivityById(id))
      .filter((a): a is Activity => a !== undefined);
  };

  const getActivityStatus = (activityId: string) => {
    const activity = userActivities.find(a => a.activityId === activityId);
    const daysSince = getDaysSinceLastCompletion(completions, activityId);
    const coreActivity = getActivityById(activityId);
    
    return {
      streak: activity?.streak || 0,
      daysSince,
      isOverdue: daysSince !== null && coreActivity && (
        (coreActivity.frequency === 'Daily' && daysSince > 1) ||
        (coreActivity.frequency === 'Weekly' && daysSince > 7) ||
        (coreActivity.frequency === 'Monthly' && daysSince > 30)
      ),
      totalCompletions: activity?.totalCompletions || 0
    };
  };

  const getUrgentActivities = (): { activity: Activity; status: ReturnType<typeof getActivityStatus> }[] => {
    return getPriorityActivities()
      .map(activity => ({
        activity,
        status: getActivityStatus(activity.id)
      }))
      .filter(({ status }) => status.isOverdue || status.daysSince === null)
      .sort((a, b) => {
        // Prioritize: never done > most overdue > highest impact
        if (a.status.daysSince === null && b.status.daysSince !== null) return -1;
        if (a.status.daysSince !== null && b.status.daysSince === null) return 1;
        if (a.status.daysSince !== null && b.status.daysSince !== null) {
          return b.status.daysSince - a.status.daysSince;
        }
        return b.activity.impactScore - a.activity.impactScore;
      });
  };

  const getStreakActivities = (): { activity: Activity; status: ReturnType<typeof getActivityStatus> }[] => {
    return getPriorityActivities()
      .map(activity => ({
        activity,
        status: getActivityStatus(activity.id)
      }))
      .filter(({ status }) => status.streak > 0)
      .sort((a, b) => b.status.streak - a.status.streak);
  };

  const getTotalCompletionsThisWeek = (): number => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return completions.filter(c => new Date(c.completedAt) >= oneWeekAgo).length;
  };

  const urgent = getUrgentActivities();
  const streaks = getStreakActivities();
  const completionsThisWeek = getTotalCompletionsThisWeek();

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          color: 'white',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.25)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                {greeting}, {profile.name}! 👋
              </h1>
              <p style={{ fontSize: '16px', opacity: 0.9, margin: 0 }}>
                {profile.market} · {profile.businessGoal}
              </p>
            </div>
            <button
              onClick={onEditProfile}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Edit Profile
            </button>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
                {completionsThisWeek}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                Activities this week
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
                {streaks.length > 0 ? `${streaks[0].status.streak} 🔥` : '0'}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                Longest streak
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
                {urgent.length}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                {urgent.length === 1 ? 'Activity needs' : 'Activities need'} attention
              </div>
            </div>
          </div>
        </div>

        {/* Urgent Actions */}
        {urgent.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#1a1a1a' }}>
              ⚠️ Needs Your Attention
            </h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              {urgent.map(({ activity, status }) => (
                <div
                  key={activity.id}
                  style={{
                    background: 'white',
                    border: '2px solid #FFCDD2',
                    borderRadius: '12px',
                    padding: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}
                  onClick={() => onActivityClick(activity.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '8px' }}>
                        {activity.title}
                      </h3>
                      <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                        {activity.description}
                      </p>
                      <div style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        background: '#FFEBEE',
                        color: '#C62828',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        {status.daysSince === null
                          ? '❌ Never completed'
                          : `⏰ ${status.daysSince} days since last completion`
                        }
                      </div>
                    </div>
                    <button
                      style={{
                        background: '#F44336',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        marginLeft: '16px'
                      }}
                    >
                      Do It Now →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Streaks */}
        {streaks.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#1a1a1a' }}>
              🔥 Your Streaks - Keep It Going!
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {streaks.map(({ activity, status }) => (
                <div
                  key={activity.id}
                  style={{
                    background: 'white',
                    border: '2px solid #C8E6C9',
                    borderRadius: '12px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => onActivityClick(activity.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4CAF50';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#C8E6C9';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>
                      {activity.title}
                    </h3>
                    <span style={{ fontSize: '24px' }}>
                      {status.streak} 🔥
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                    {status.streak} {activity.frequency.toLowerCase()} in a row!
                  </p>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    background: '#E8F5E9',
                    color: '#2E7D32',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {status.totalCompletions} total completions
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Priority Activities */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#1a1a1a' }}>
            Your Priority Activities
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {getPriorityActivities().map(activity => {
              const status = getActivityStatus(activity.id);
              return (
                <div
                  key={activity.id}
                  style={{
                    background: 'white',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => onActivityClick(activity.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', margin: 0, flex: 1 }}>
                      {activity.title}
                    </h3>
                    {activity.aiCanHelp && (
                      <span style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        marginLeft: '8px'
                      }}>
                        AI ✨
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px', lineHeight: '1.5' }}>
                    {activity.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '12px',
                      color: '#888',
                      background: '#f5f5f5',
                      padding: '4px 10px',
                      borderRadius: '4px'
                    }}>
                      {activity.frequency}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: '#888',
                      background: '#f5f5f5',
                      padding: '4px 10px',
                      borderRadius: '4px'
                    }}>
                      {activity.timeEstimate}
                    </span>
                    {status.streak > 0 && (
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#FF6B6B',
                        background: '#FFE8E8',
                        padding: '4px 10px',
                        borderRadius: '4px'
                      }}>
                        {status.streak} 🔥
                      </span>
                    )}
                  </div>

                  {status.daysSince !== null && (
                    <div style={{
                      marginTop: '12px',
                      padding: '8px',
                      background: status.isOverdue ? '#FFEBEE' : '#E8F5E9',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: status.isOverdue ? '#C62828' : '#2E7D32',
                      fontWeight: '600'
                    }}>
                      {status.isOverdue
                        ? `⚠️ ${status.daysSince} days since last completion`
                        : `✅ Completed ${status.daysSince} ${status.daysSince === 1 ? 'day' : 'days'} ago`
                      }
                    </div>
                  )}

                  {status.daysSince === null && (
                    <div style={{
                      marginTop: '12px',
                      padding: '8px',
                      background: '#FFF3E0',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#E65100',
                      fontWeight: '600'
                    }}>
                      ⭐ Ready to start your first completion?
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Motivational Footer */}
        {urgent.length === 0 && streaks.length >= 2 && (
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            color: 'white',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.25)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '12px', margin: 0 }}>
              You're crushing it, {profile.name}!
            </h2>
            <p style={{ fontSize: '16px', opacity: 0.9, margin: 0 }}>
              Keep up the momentum. Consistency is how top producers are made.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
