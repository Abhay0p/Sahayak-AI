"use client";

import React from 'react';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { useLanguage } from '@/components/LanguageProvider/LanguageProvider';

const getPartOfDayKey = (hour: number): { key: string; fallback: string; emoji: string } => {
  if (hour >= 5 && hour < 12) return { key: 'greeting.morning', fallback: 'Good Morning', emoji: '☀️' };
  if (hour >= 12 && hour < 17) return { key: 'greeting.afternoon', fallback: 'Good Afternoon', emoji: '🌤️' };
  if (hour >= 17 && hour < 21) return { key: 'greeting.evening', fallback: 'Good Evening', emoji: '🌅' };
  return { key: 'greeting.night', fallback: 'Good Night', emoji: '🌙' };
};

export default function Greeting({ className }: { className?: string }) {
  const { displayName, loading } = useUserProfile();
  const { t } = useLanguage();

  const now = new Date();
  const { key, fallback, emoji } = getPartOfDayKey(now.getHours());
  const translatedGreeting = t(key, fallback);

  // Fallback while loading
  if (loading) {
    return <h1 className={className || "greeting"}>{translatedGreeting} {emoji}</h1>;
  }

  const namePart = displayName ? `, ${displayName}` : '';
  return (
    <h1 className={className || "greeting"}>
      {translatedGreeting}{namePart} {emoji}
    </h1>
  );
}
