"use client";
import React from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { useNotifications } from '@/components/NotificationProvider/NotificationProvider';
import { Bell, Check, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import SummaryCard from '@/app/family/components/SummaryCard';

// Friendly relative time
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Icon per notification type
function typeIcon(type: string) {
  const map: Record<string, string> = {
    MESSAGE: '💬',
    GAME_COMPLETED: '🎮',
    REMINDER: '⏰',
    MEDICINE: '💊',
    HYDRATION: '💧',
    MEAL: '🍽',
    HELP_REQUEST: '🆘',
    APPOINTMENT: '📅',
    SYSTEM: '🔔',
  };
  return map[type?.toUpperCase()] ?? '🔔';
}

export default function NotificationCenter() {
  const { profile } = useUserProfile();
  const { t } = useTranslation(profile?.languagePreference);
  const { dbNotifications, dbUnreadCount, markDbRead, refreshDbNotifications } = useNotifications();

  // Sort: unread first, then by time
  const sorted = [...dbNotifications].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <SummaryCard
      icon={<Bell className="text-yellow-400" />}
      title={t('notifications')}
      className="mb-4"
    >
      {/* Header row */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          {dbUnreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {dbUnreadCount} unread
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {dbUnreadCount > 0 && (
            <button
              onClick={() => markDbRead()}
              className="text-xs text-white/60 hover:text-white flex items-center gap-1 transition"
            >
              <Check size={13} /> Mark all read
            </button>
          )}
          <button
            onClick={refreshDbNotifications}
            title="Refresh"
            className="text-white/40 hover:text-white transition"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Notification list */}
      {sorted.length === 0 ? (
        <p className="text-center text-white/50 py-6">You're all caught up! 🎉</p>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {sorted.map(n => (
            <div
              key={n.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                n.read
                  ? 'bg-white/3 border-white/5 opacity-60'
                  : 'bg-white/8 border-white/15'
              }`}
            >
              {/* Type icon */}
              <span className="text-xl flex-shrink-0 mt-0.5" role="img" aria-label={n.type}>
                {typeIcon(n.type)}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <p className={`text-sm font-semibold leading-tight ${n.read ? 'text-white/60' : 'text-white'}`}>
                    {n.title}
                  </p>
                  <span className="text-xs text-white/35 flex-shrink-0">{relativeTime(n.createdAt)}</span>
                </div>
                <p className="text-xs text-white/55 mt-0.5 leading-relaxed">{n.body}</p>
                {n.actionUrl && (
                  <Link
                    href={n.actionUrl}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition"
                    onClick={() => !n.read && markDbRead(n.id)}
                  >
                    View details <ArrowRight size={11} />
                  </Link>
                )}
              </div>

              {/* Mark as read button */}
              {!n.read && (
                <button
                  onClick={() => markDbRead(n.id)}
                  title="Mark as read"
                  className="text-white/30 hover:text-purple-400 transition flex-shrink-0 mt-0.5"
                >
                  <Check size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </SummaryCard>
  );
}
