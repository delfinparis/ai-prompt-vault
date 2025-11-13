import { useState, useEffect, useCallback } from 'react';

const KEY_AGENT_PROFILE = "rpv:agentProfile";

export interface AgentProfile {
  name: string;
  market: string;
  niche: string;
  channels: string[];
  setupComplete: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Pure mapping function for unit tests and reuse
export function mapAutoFillValue(profile: Partial<AgentProfile> | null, placeholder: string): string | null {
  if (!profile) return null;
  const lower = placeholder.toLowerCase();
  // Market synonyms: market, city, area, service area, farm, metro, neighborhood, zip, county
  if (
    lower.includes('market') ||
    lower.includes('city') ||
    lower.includes('area') ||
    lower.includes('service area') ||
    lower.includes('farm') ||
    lower.includes('metro') ||
    lower.includes('neighborhood') ||
    lower.includes('zip') ||
    lower.includes('county')
  ) {
    return profile.market || null;
  }
  // Niche synonyms: niche, specialty, avatar, icp, persona, ideal client
  if (
    lower.includes('niche') ||
    lower.includes('specialty') ||
    lower.includes('avatar') ||
    lower.includes('icp') ||
    lower.includes('persona') ||
    lower.includes('ideal client')
  ) {
    return profile.niche || null;
  }
  // Name synonyms: name, agent name, your full name
  if (lower.includes('name')) {
    return profile.name || null;
  }
  // Channel synonyms: channel, platform, primary platform
  if ((lower.includes('channel') || lower.includes('platform')) && profile.channels && profile.channels.length > 0) {
    return profile.channels[0] || null;
  }
  return null;
}

export function useAgentProfile() {
  const [profile, setProfile] = useState<Partial<AgentProfile> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY_AGENT_PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
      }
    } catch (error) {
      console.error('Failed to load agent profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save profile to localStorage
  const saveProfile = useCallback((updates: Partial<AgentProfile>) => {
    try {
      const now = new Date().toISOString();
      const updated = {
        ...profile,
        ...updates,
        updatedAt: now,
        createdAt: profile?.createdAt || now,
      };
      
      setProfile(updated);
      localStorage.setItem(KEY_AGENT_PROFILE, JSON.stringify(updated));
      
      return true;
    } catch (error) {
      console.error('Failed to save agent profile:', error);
      return false;
    }
  }, [profile]);

  // Clear profile
  const clearProfile = useCallback(() => {
    setProfile(null);
    localStorage.removeItem(KEY_AGENT_PROFILE);
  }, []);

  // Check if profile is complete
  const isProfileComplete = Boolean(
    profile?.setupComplete &&
    profile?.name &&
    profile?.market &&
    profile?.niche
  );

  // Auto-fill a field value from profile
  const getAutoFillValue = useCallback((placeholder: string): string | null => {
    return mapAutoFillValue(profile, placeholder);
  }, [profile]);

  return {
    profile,
    isLoading,
    isProfileComplete,
    saveProfile,
    clearProfile,
    getAutoFillValue,
  };
}
