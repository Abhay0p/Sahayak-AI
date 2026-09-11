"use client";
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Mic, User, LogOut, Settings, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { useAuth } from '@/components/AuthProvider/AuthProvider';
import { useNotifications } from '@/components/NotificationProvider/NotificationProvider';
import { VoiceAssistantModal } from '@/components/VoiceAssistant/VoiceAssistantModal';
import PatientSelector, { Patient } from './PatientSelector';
import { getProfileAvatar } from '@/lib/profileVisuals';
import { apiClient } from '@/lib/apiClient';

interface FamilyHeaderProps {
  selectedPatient: Patient | null;
  onSelectPatient: (p: Patient) => void;
  lastSyncTime: Date | null;
  /** unreadCount prop kept for compat but provider value takes precedence */
  unreadCount?: number;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function useGreeting(t: (k: string) => string, firstName?: string) {
  const [greeting, setGreeting] = useState('');
  useEffect(() => {
    const compute = () => {
      const h = new Date().getHours();
      let key = 'good_evening';
      if (h < 12) key = 'good_morning';
      else if (h < 17) key = 'good_afternoon';
      else if (h < 21) key = 'good_evening';
      else key = 'good_night';
      const emoji = key === 'good_night' ? '🌙' : '👋';
      setGreeting(`${t(key)}, ${firstName || ''}  ${emoji}`);
    };
    compute();
    const id = setInterval(compute, 60_000);
    return () => clearInterval(id);
  }, [t, firstName]);
  return greeting;
}

function useRelativeTime(t: (k: string) => string, date: Date | null): string {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const compute = () => {
      if (!date) { setLabel(''); return; }
      const diffMs = Date.now() - date.getTime();
      const diffMin = Math.floor(diffMs / 60_000);
      if (diffMin < 1) setLabel(t('just_now'));
      else setLabel(`${diffMin} ${t('min_ago')}`);
    };
    compute();
    const id = setInterval(compute, 30_000);
    return () => clearInterval(id);
  }, [date, t]);
  return label;
}

// ── Patient context card ──────────────────────────────────────────────────────

function PatientCard({
  patient,
  syncLabel,
  isOnline,
  t,
}: {
  patient: Patient | null;
  syncLabel: string;
  isOnline: boolean;
  t: (k: string) => string;
}) {
  if (!patient) return null;

  const displayName =
    patient.preferredName ||
    `${patient.firstName} ${patient.lastName}`.trim();
  const initials = `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-white/10"
      style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {patient.avatarUrl ? (
          <img
            src={patient.avatarUrl}
            alt={displayName}
            className="w-14 h-14 rounded-2xl object-cover"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' }}
          >
            {initials}
          </div>
        )}
        {/* online dot */}
        <span
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#131d33]"
          style={{ background: isOnline ? '#10b981' : '#f59e0b' }}
          title={isOnline ? t('connected') : t('offline')}
        />
      </div>

      {/* Info */}
      <div className="min-w-0">
        <p className="text-base font-bold text-white leading-tight truncate">{displayName}</p>
        {patient.relationshipType && (
          <p className="text-sm text-white/60 capitalize leading-tight">{patient.relationshipType}</p>
        )}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: isOnline ? '#10b981' : '#f59e0b' }}
          />
          <span className="text-xs text-white/50">
            {isOnline ? t('recently_active') : t('offline')}
            {syncLabel ? ` · ${t('last_synced')} ${syncLabel}` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Profile dropdown ──────────────────────────────────────────────────────────

function ProfileMenu({
  profile,
  displayName,
  onClose,
  t,
}: {
  profile: any;
  displayName: string;
  onClose: () => void;
  t: (k: string) => string;
}) {
  const { session } = useAuth();

  const handleLogout = async () => {
    await apiClient('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50"
      style={{ background: '#1a2540' }}
    >
      {/* header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
        {profile?.avatarUrl ? (
          <img src={profile.avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' }}
          >
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{displayName}</p>
          <p className="text-xs text-white/50 truncate">{t('family_member')}</p>
        </div>
      </div>

      {/* items */}
      <div className="py-1">
        <Link href="/settings" onClick={onClose}>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors text-left">
            <User size={15} /> {t('profile')}
          </button>
        </Link>
        <Link href="/settings" onClick={onClose}>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors text-left">
            <Settings size={15} /> {t('settings')}
          </button>
        </Link>
        <Link href="/settings#notifications" onClick={onClose}>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors text-left">
            <Bell size={15} /> {t('notification_prefs')}
          </button>
        </Link>
      </div>

      <div className="border-t border-white/10 py-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
        >
          <LogOut size={15} /> {t('logout')}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FamilyHeader({
  selectedPatient,
  onSelectPatient,
  lastSyncTime,
}: FamilyHeaderProps) {
  const { profile, displayName } = useUserProfile();
  const { t } = useTranslation(profile?.languagePreference);
  const { dbUnreadCount } = useNotifications();
  const safeDisplayName = displayName || profile?.firstName || 'User';
  const firstName = profile?.preferredName || profile?.firstName || safeDisplayName.split(' ')[0];

  const greeting = useGreeting(t, firstName);
  const syncLabel = useRelativeTime(t, lastSyncTime);
  const isOnline = lastSyncTime !== null;
  const unreadCount = dbUnreadCount; // always synced with NotificationProvider


  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = safeDisplayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="mb-8">
        {/* ── Top bar (greeting + actions) ─────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          {/* Left: Greeting */}
          <div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-white leading-tight"
              style={{ letterSpacing: '-0.01em' }}
            >
              {greeting}
            </h2>
            <p className="text-sm text-white/50 mt-1">{t('care_summary_subtitle')}</p>
          </div>

          {/* Right: Action group */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Notifications */}
            <Link href="/family#notifications">
              <button
                aria-label={`${t('notifications')}${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <Bell size={18} className="text-white/70" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                    aria-hidden="true"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </Link>

            {/* Ask Sahayak */}
            <button
              onClick={() => setIsVoiceOpen(true)}
              aria-label={t('ask_sahayak')}
              className="flex items-center gap-2 px-4 h-10 rounded-xl font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                color: 'white',
                boxShadow: '0 0 20px rgba(124, 58, 237, 0.35)',
              }}
            >
              <Mic size={15} />
              <span className="hidden sm:inline">{t('ask_sahayak')}</span>
            </button>

            {/* Profile */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setIsProfileOpen(o => !o)}
                aria-label={t('profile')}
                aria-expanded={isProfileOpen}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 overflow-hidden"
              >
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={safeDisplayName} className="w-full h-full object-cover" />
                ) : getProfileAvatar(profile?.gender) ? (
                  <img src={getProfileAvatar(profile?.gender) as string} alt={safeDisplayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-white">{initials}</span>
                )}
              </button>

              {isProfileOpen && (
                <ProfileMenu
                  profile={profile}
                  displayName={safeDisplayName}
                  onClose={() => setIsProfileOpen(false)}
                  t={t}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Patient context row ───────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Label */}
          <span className="text-xs font-semibold uppercase tracking-widest text-white/30">
            {t('caring_for')}
          </span>

          {/* Patient selector */}
          <PatientSelector onSelectPatient={onSelectPatient} />

          {/* Patient mini-card (visible when patient is selected) */}
          {selectedPatient && (
            <PatientCard
              patient={selectedPatient}
              syncLabel={syncLabel}
              isOnline={isOnline}
              t={t}
            />
          )}

          {/* Sync status chip */}
          {lastSyncTime && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-white/40">
              {isOnline ? (
                <Wifi size={12} className="text-emerald-400" />
              ) : (
                <WifiOff size={12} className="text-amber-400" />
              )}
              <span>
                {syncLabel ? `${t('last_synced')} ${syncLabel}` : t('connected')}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Voice modal */}
      <VoiceAssistantModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </>
  );
}
