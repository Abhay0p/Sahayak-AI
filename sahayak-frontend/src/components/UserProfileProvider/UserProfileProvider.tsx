"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/components/AuthProvider/AuthProvider';
import { apiClient } from '@/lib/apiClient';

export type UserProfile = {
  id: string;
  userId: string;
  firstName: string;
  lastName?: string;
  preferredName?: string;
  displayName?: string;
  role: string;
  avatarUrl?: string;
  languagePreference: string;
  voiceLanguage?: string;
  voicePreference?: string;
  timezone: string;
  notificationPrefs: string;
  accessibilityPrefs: string;
  gender: string;
  routinePreferences: string;
  selectedPatientName?: string;
  selectedPatientRelationship?: string;
};

interface UserProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  displayName: string | null;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (session.status !== 'authenticated') {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await apiClient('/api/profile');
      setProfile(data);
    } catch (error) {
      console.error('Failed to fetch profile', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [session.status]);

  useEffect(() => {
    if (profile?.languagePreference) {
      document.documentElement.lang = profile.languagePreference;
    }
  }, [profile?.languagePreference]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      const updatedData = await apiClient('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setProfile(updatedData);
    } catch (error) {
      console.error('Failed to update profile', error);
      throw error;
    }
  };

  const displayName = profile
    ? (profile.preferredName || profile.displayName || profile.firstName || null)
    : null;

  return (
    <UserProfileContext.Provider value={{ profile, loading, displayName, updateProfile, refreshProfile: fetchProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};
