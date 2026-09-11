"use client";

/**
 * DayCareTimeline — My Day / Care Timeline
 *
 * Real-time, patient-specific daily care timeline for the Elderly portal.
 * Aggregates events from:
 *   - profile.routinePreferences (meals, medicine, hydration, rest, brain activity)
 *   - dbNotifications (messages, missed calls, new memories, SOS)
 *
 * Priority engine: P0 SOS > P1 Overdue > P2 Current > P3 Upcoming > P4 Notif
 *
 * All completion state persists to backend. No fake data.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Volume2, ChevronDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { useLanguage } from '@/components/LanguageProvider/LanguageProvider';
import { useNotifications } from '@/components/NotificationProvider/NotificationProvider';
import { speakText } from '@/lib/speech';
import { apiClient } from '@/lib/apiClient';

import styles from './DayCareTimeline.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoutineItem {
  id: number;
  time: string;
  title: string;
  category: string;
  status: 'pending' | 'completed';
}

interface DayEvent {
  id: string;
  time: string;       // "8:30 AM"
  timeMinutes: number; // minutes since midnight for sorting
  icon: string;
  title: string;
  message: string;
  category: 'meal' | 'hydration' | 'medicine' | 'brain' | 'rest' | 'family' | 'appointment' | 'exercise' | 'notification' | 'sos' | 'other';
  status: 'done' | 'current' | 'upcoming' | 'missed' | 'sos';
  priority: 0 | 1 | 2 | 3 | 4 | 5;
  actionType: 'done' | 'drink_water' | 'acknowledge' | 'start_activity' | 'call' | 'view' | 'open_messages' | 'call_back' | 'view_memory' | 'view_sos' | 'none';
  actionRoute?: string;   // route to navigate on action
  sourceId?: number;      // routineItem id if from routine
  notifId?: string;       // notification id if from notif
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const lower = timeStr.toLowerCase().trim();
  // Support both "8:30 AM" and "08:30" (24h)
  const match12 = lower.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
  if (!match12) return 0;
  let h = parseInt(match12[1]);
  const m = parseInt(match12[2]);
  const period = match12[3];
  if (period === 'pm' && h !== 12) h += 12;
  if (period === 'am' && h === 12) h = 0;
  return h * 60 + m;
}

function getCurrentLocalMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function getCategoryIcon(category: string, title: string): string {
  const lower = (category + ' ' + title).toLowerCase();
  if (lower.includes('sos') || lower.includes('help')) return '🆘';
  if (lower.includes('breakfast') || lower.includes('morning meal')) return '🥣';
  if (lower.includes('lunch') || lower.includes('midday meal')) return '🍲';
  if (lower.includes('dinner') || lower.includes('supper') || lower.includes('evening meal')) return '🍽️';
  if (lower.includes('snack')) return '🍎';
  if (lower.includes('meal') || lower.includes('food') || lower.includes('eat')) return '🍴';
  if (lower.includes('water') || lower.includes('hydrat')) return '💧';
  if (lower.includes('medicine') || lower.includes('medic') || lower.includes('pill') || lower.includes('tablet')) return '💊';
  if (lower.includes('brain') || lower.includes('game') || lower.includes('activ') || lower.includes('mind') || lower.includes('cogn') || lower.includes('memory')) return '🧠';
  if (lower.includes('exercise') || lower.includes('walk') || lower.includes('gym')) return '🚶';
  if (lower.includes('rest') || lower.includes('sleep') || lower.includes('nap') || lower.includes('bedtime')) return '😴';
  if (lower.includes('relax') || lower.includes('breath') || lower.includes('calm') || lower.includes('meditat')) return '🌿';
  if (lower.includes('family') || lower.includes('call') || lower.includes('loved')) return '❤️';
  if (lower.includes('appointment') || lower.includes('doctor') || lower.includes('clinic')) return '📅';
  if (lower.includes('wake') || lower.includes('morning')) return '☀️';
  if (lower.includes('message')) return '💬';
  if (lower.includes('missed call') || lower.includes('call back')) return '📞';
  if (lower.includes('memory') || lower.includes('photo')) return '🖼️';
  return '📌';
}

function classifyCategory(title: string, category: string): DayEvent['category'] {
  const lower = (title + ' ' + category).toLowerCase();
  if (lower.includes('sos') || lower.includes('help request')) return 'sos';
  if (lower.includes('water') || lower.includes('hydrat')) return 'hydration';
  if (lower.includes('medicine') || lower.includes('medic') || lower.includes('pill') || lower.includes('tablet')) return 'medicine';
  if (lower.includes('meal') || lower.includes('breakfast') || lower.includes('lunch') || lower.includes('dinner') || lower.includes('snack') || lower.includes('food') || lower.includes('eat')) return 'meal';
  if (lower.includes('brain') || lower.includes('game') || lower.includes('activ') || lower.includes('mind') || lower.includes('cogn')) return 'brain';
  if (lower.includes('family') || lower.includes('call') || lower.includes('loved')) return 'family';
  if (lower.includes('appointment') || lower.includes('doctor')) return 'appointment';
  if (lower.includes('exercise') || lower.includes('walk')) return 'exercise';
  if (lower.includes('rest') || lower.includes('sleep') || lower.includes('nap') || lower.includes('bedtime') || lower.includes('relax') || lower.includes('breath')) return 'rest';
  if (lower.includes('message')) return 'notification';
  return 'other';
}

function getActionType(category: DayEvent['category'], eventTitle: string): DayEvent['actionType'] {
  const lower = eventTitle.toLowerCase();
  if (category === 'sos') return 'view_sos';
  if (category === 'hydration') return 'drink_water';
  if (category === 'medicine') return 'acknowledge';
  if (category === 'brain') return 'start_activity';
  if (category === 'family') return 'call';
  if (category === 'appointment') return 'view';
  if (lower.includes('missed call')) return 'call_back';
  if (lower.includes('new message')) return 'open_messages';
  if (lower.includes('memory') || lower.includes('photo')) return 'view_memory';
  return 'done';
}

function getActionLabel(actionType: DayEvent['actionType'], t: (k: string, fallback: string) => string): string {
  switch (actionType) {
    case 'drink_water': return t('timeline.drinkWater', 'I drank water');
    case 'acknowledge': return t('timeline.acknowledge', 'Acknowledge');
    case 'start_activity': return t('timeline.startActivity', 'Start Activity');
    case 'call': return t('timeline.callFamily', 'Call Family');
    case 'view': return t('timeline.viewAppointment', 'View Appointment');
    case 'open_messages': return t('timeline.openMessages', 'Open Messages');
    case 'call_back': return t('timeline.callBack', 'Call Back');
    case 'view_memory': return t('timeline.viewMemory', 'View Memory');
    case 'view_sos': return t('timeline.viewSOS', 'View Status');
    case 'done': return t('timeline.done', '✓ Done');
    default: return t('timeline.done', '✓ Done');
  }
}

function getActionBtnClass(actionType: DayEvent['actionType'], styles: any): string {
  switch (actionType) {
    case 'drink_water': return `${styles.actionBtn} ${styles.actionBtnBlue}`;
    case 'acknowledge': return `${styles.actionBtn} ${styles.actionBtnAmber}`;
    case 'start_activity': return `${styles.actionBtn} ${styles.actionBtnPrimary}`;
    case 'call': case 'call_back': return `${styles.actionBtn} ${styles.actionBtnGreen}`;
    case 'view_sos': return `${styles.actionBtn} ${styles.actionBtnRed}`;
    default: return `${styles.actionBtn} ${styles.actionBtnGreen}`;
  }
}

function getStatusIcon(status: DayEvent['status']): string {
  switch (status) {
    case 'done': return '✓';
    case 'current': return '▶';
    case 'upcoming': return '○';
    case 'missed': return '⚠';
    case 'sos': return '🔴';
    default: return '○';
  }
}

// ─── Brain activity routes ────────────────────────────────────────────────────
const BRAIN_ACTIVITY_ROUTES = [
  '/play/memory-match',
  '/play/memory-recall',
  '/play/pattern-detective',
  '/play/story-time',
  '/play/memory-challenge',
  '/play/music-memory',
  '/play/word-search',
  '/play/sequence-master',
];

// ─── Main Component ───────────────────────────────────────────────────────────

export interface DayCareTimelineProps {
  /** Called when the timeline summary changes — passed up for voice assistant context */
  onTimelineContextChange?: (summary: string) => void;
}

export const DayCareTimeline: React.FC<DayCareTimelineProps> = ({ onTimelineContextChange }) => {
  const { profile, updateProfile } = useUserProfile();
  const { t, language } = useLanguage();
  const { dbNotifications } = useNotifications();
  const router = useRouter();

  const [routine, setRoutine] = useState<RoutineItem[]>([]);
  const [hydrationCount, setHydrationCount] = useState(0);
  const [hydrationTarget, setHydrationTarget] = useState(8);
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [now, setNow] = useState(getCurrentLocalMinutes());

  // ─── Load routine from profile ────────────────────────────────────────────
  useEffect(() => {
    if (!profile?.routinePreferences) return;
    try {
      const parsed = JSON.parse(profile.routinePreferences);
      if (Array.isArray(parsed)) {
        setRoutine(parsed);
      }
    } catch {}
  }, [profile?.routinePreferences]);

  // ─── Load hydration count from backend ───────────────────────────────────
  useEffect(() => {
    if (!profile?.id) return;
    apiClient('/api/notifications/hydration/today')
      .then(async (res: Response) => {
        const data = await res.json();
        if (typeof data.count === 'number') setHydrationCount(data.count);
      })
      .catch(() => {});
  }, [profile?.id]);

  // ─── Determine hydration target from routine ──────────────────────────────
  useEffect(() => {
    // Count hydration items in routine to set target; default 8
    const hydItems = routine.filter(r =>
      (r.category || r.title || '').toLowerCase().includes('hydrat') ||
      (r.category || r.title || '').toLowerCase().includes('water')
    );
    if (hydItems.length > 0) setHydrationTarget(Math.max(hydItems.length, 4));
  }, [routine]);

  // ─── Clock tick every 30s for time-based state ───────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setNow(getCurrentLocalMinutes()), 30_000);
    return () => clearInterval(interval);
  }, []);

  // ─── Build aggregated day events ──────────────────────────────────────────
  const dayEvents = useMemo((): DayEvent[] => {
    const events: DayEvent[] = [];

    // 1. Routine items
    for (const item of routine) {
      const timeMin = parseTimeToMinutes(item.time);
      const category = classifyCategory(item.title, item.category || '');

      // Skip hydration items — they're tracked separately in the hydration chip
      // But keep them as timeline events with their own status
      let status: DayEvent['status'];
      if (item.status === 'completed') {
        status = 'done';
      } else if (now >= timeMin && now <= timeMin + 20) {
        status = 'current';
      } else if (now > timeMin + 20) {
        status = 'missed';
      } else {
        status = 'upcoming';
      }

      const actionType = getActionType(category, item.title);

      events.push({
        id: `routine-${item.id}`,
        time: item.time,
        timeMinutes: timeMin,
        icon: getCategoryIcon(item.category || '', item.title),
        title: item.title,
        message: getEventMessage(category, item.title, item.time, t),
        category,
        status,
        priority: getPriority(status, category),
        actionType,
        actionRoute: category === 'brain' ? BRAIN_ACTIVITY_ROUTES[0] : category === 'family' ? '/family-connect' : category === 'appointment' ? '/my-day' : undefined,
        sourceId: item.id,
      });
    }

    // 2. Live notifications — messages, calls, memories, SOS
    const recentNotifs = dbNotifications
      .filter(n => !n.read && n.type !== 'HYDRATION_LOG')
      .slice(0, 5); // max 5 live notification events

    for (const notif of recentNotifs) {
      const type = notif.type.toUpperCase();
      let category: DayEvent['category'] = 'notification';
      let actionType: DayEvent['actionType'] = 'open_messages';
      let icon = '🔔';

      if (type === 'HELP_REQUEST' || type === 'SOS') {
        category = 'sos';
        actionType = 'view_sos';
        icon = '🆘';
      } else if (type === 'MISSED_CALL') {
        icon = '📞';
        actionType = 'call_back';
      } else if (type === 'NEW_MESSAGE') {
        icon = '💬';
        actionType = 'open_messages';
      } else if (type.includes('MEMORY') || type.includes('PHOTO')) {
        icon = '🖼️';
        actionType = 'view_memory';
      }

      events.push({
        id: `notif-${notif.id}`,
        time: new Date(notif.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        timeMinutes: 0, // live events shown at current time
        icon,
        title: notif.title,
        message: notif.body,
        category,
        status: category === 'sos' ? 'sos' : 'current',
        priority: category === 'sos' ? 0 : 4,
        actionType,
        actionRoute: notif.actionUrl || undefined,
        notifId: notif.id,
      });
    }

    // Sort: priority ASC (0 first), then time ASC
    return events.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.timeMinutes - b.timeMinutes;
    });
  }, [routine, dbNotifications, now, t]);

  // ─── Top event (what to show in the main card) ────────────────────────────
  const currentEvent = useMemo(() => {
    // P0: SOS
    const sos = dayEvents.find(e => e.status === 'sos');
    if (sos) return sos;
    // P1: overdue medicine/meal
    const overdue = dayEvents.find(e => e.status === 'missed' && (e.category === 'medicine' || e.category === 'meal'));
    if (overdue) return overdue;
    // P2: current (active window)
    const current = dayEvents.find(e => e.status === 'current');
    if (current) return current;
    // P3: next upcoming
    const upcoming = dayEvents.find(e => e.status === 'upcoming');
    if (upcoming) return upcoming;
    // P4: live notification
    const notif = dayEvents.find(e => e.category === 'notification');
    return notif || null;
  }, [dayEvents]);

  const nextEvent = useMemo(() => {
    if (!currentEvent) return null;
    const idx = dayEvents.findIndex(e => e.id === currentEvent.id);
    return dayEvents.slice(idx + 1).find(e => e.status === 'upcoming' || e.status === 'current') || null;
  }, [dayEvents, currentEvent]);

  // ─── Summary counts ───────────────────────────────────────────────────────
  const { countDone, countCurrent, countUpcoming, countMissed } = useMemo(() => {
    const routineEvents = dayEvents.filter(e => e.id.startsWith('routine-'));
    return {
      countDone: routineEvents.filter(e => e.status === 'done').length,
      countCurrent: routineEvents.filter(e => e.status === 'current').length,
      countUpcoming: routineEvents.filter(e => e.status === 'upcoming').length,
      countMissed: routineEvents.filter(e => e.status === 'missed').length,
    };
  }, [dayEvents]);

  // ─── Timeline context for voice assistant ─────────────────────────────────
  useEffect(() => {
    const summary = buildTimelineContext(dayEvents, currentEvent, nextEvent, hydrationCount, hydrationTarget);
    // Write to sessionStorage so the Sidebar VoiceAssistantModal can access it across components
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sahayak_timeline_context', summary);
    }
    if (onTimelineContextChange) {
      onTimelineContextChange(summary);
    }
  }, [dayEvents, currentEvent, nextEvent, hydrationCount, hydrationTarget, onTimelineContextChange]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleListen = useCallback((event: DayEvent) => {
    setIsListening(true);
    speakText(event.message, language, () => setIsListening(false));
  }, [language]);

  const handleAction = useCallback(async (event: DayEvent) => {
    switch (event.actionType) {
      case 'drink_water': {
        try {
          const res = await apiClient('/api/notifications/hydration', { method: 'POST' });
          const data = await res.json();
          if (typeof data.count === 'number') setHydrationCount(data.count);
        } catch {}
        break;
      }
      case 'done':
      case 'acknowledge': {
        if (event.sourceId !== undefined) {
          // Mark routine item complete
          const updated = routine.map(r =>
            r.id === event.sourceId ? { ...r, status: 'completed' as const } : r
          );
          setRoutine(updated);
          await updateProfile({ routinePreferences: JSON.stringify(updated) });
        }
        if (event.notifId) {
          // Mark notification read
          await apiClient('/api/notifications', {
            method: 'PATCH',
            body: JSON.stringify({ id: event.notifId, read: true }),
          }).catch(() => {});
        }
        break;
      }
      case 'start_activity': {
        const route = event.actionRoute || '/play';
        router.push(route);
        break;
      }
      case 'call': {
        router.push('/family-connect?tab=calls');
        break;
      }
      case 'call_back': {
        router.push('/family-connect?tab=calls');
        break;
      }
      case 'view': {
        router.push(event.actionRoute || '/my-day');
        break;
      }
      case 'open_messages': {
        router.push('/messages');
        break;
      }
      case 'view_memory': {
        router.push('/memories');
        break;
      }
      case 'view_sos': {
        router.push('/help');
        break;
      }
      default:
        break;
    }
  }, [routine, router, updateProfile]);

  // ─── Render helpers ───────────────────────────────────────────────────────

  const cardClass = useMemo(() => {
    if (!currentEvent) return styles.currentEventCard;
    if (currentEvent.status === 'sos') return `${styles.currentEventCard} ${styles.prioritySOS}`;
    if (currentEvent.status === 'missed') return `${styles.currentEventCard} ${styles.priorityOverdue}`;
    return styles.currentEventCard;
  }, [currentEvent]);

  const badgeClass = useMemo(() => {
    if (!currentEvent) return styles.nowBadge;
    if (currentEvent.status === 'sos') return `${styles.nowBadge} ${styles.badgeSOS}`;
    if (currentEvent.status === 'missed') return `${styles.nowBadge} ${styles.badgeOverdue}`;
    return styles.nowBadge;
  }, [currentEvent]);

  const badgeText = useMemo(() => {
    if (!currentEvent) return t('timeline.now', 'NOW');
    if (currentEvent.status === 'sos') return t('timeline.urgent', '🔴 URGENT');
    if (currentEvent.status === 'missed') return t('timeline.overdue', '⚠ OVERDUE');
    if (currentEvent.status === 'upcoming') return t('timeline.next', 'NEXT');
    return t('timeline.now', '▶ NOW');
  }, [currentEvent, t]);

  // ─── Empty routine ────────────────────────────────────────────────────────
  if (routine.length === 0 && dbNotifications.filter(n => !n.read && n.type !== 'HYDRATION_LOG').length === 0) {
    return (
      <div className={styles.timelineWrapper}>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>🗓️</div>
          <p className={styles.emptyStateText}>
            {t('timeline.noSchedule', 'Your daily schedule is empty. Add activities to see your Care Timeline here.')}
          </p>
          <Link href="/my-day">
            <span className={styles.emptyStateLink}>
              {t('timeline.addActivities', '+ Add My Day Activities')}
            </span>
          </Link>
        </div>
      </div>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────────────────
  return (
    <div className={styles.timelineWrapper}>

      {/* ── Section label ── */}
      <div className={styles.sectionLabel}>
        🧭 {t('timeline.myDay', 'MY DAY — WHAT\'S HAPPENING NOW')}
      </div>

      {/* ── Current / Priority Event Card ── */}
      {currentEvent ? (
        <div className={cardClass}>
          <div className={styles.currentEventMeta}>
            <span className={badgeClass}>
              <span className={styles.pulseDot} />
              {badgeText}
            </span>
            {currentEvent.time && (
              <span className={styles.eventTime}>{currentEvent.time}</span>
            )}
          </div>

          <div className={styles.currentEventBody}>
            <span className={styles.eventIconLarge} role="img" aria-label={currentEvent.title}>
              {currentEvent.icon}
            </span>
            <div className={styles.eventTextBlock}>
              <h3 className={styles.eventTitle}>{currentEvent.title}</h3>
              <p className={styles.eventMessage}>{currentEvent.message}</p>
            </div>
          </div>

          <div className={styles.currentEventActions}>
            {/* Listen button */}
            <button
              className={`${styles.listenBtn} ${isListening ? styles.active : ''}`}
              onClick={() => handleListen(currentEvent)}
              aria-label={t('action.listen', 'Listen')}
            >
              <Volume2 size={16} />
              {isListening ? t('voice.playing', 'Playing...') : t('action.listen', '🔊 Listen')}
            </button>

            {/* Context-appropriate action button */}
            {currentEvent.status !== 'done' && (
              <button
                className={getActionBtnClass(currentEvent.actionType, styles)}
                onClick={() => handleAction(currentEvent)}
              >
                {getActionLabel(currentEvent.actionType, t)}
              </button>
            )}

            {/* Link to source page for appointments/family */}
            {(currentEvent.actionType === 'view' || currentEvent.actionType === 'call') && currentEvent.actionRoute && (
              <button
                className={`${styles.actionBtn} ${styles.actionBtnGreen}`}
                onClick={() => router.push(currentEvent.actionRoute!)}
              >
                <ArrowRight size={15} /> {t('timeline.view', 'View')}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.currentEventCard}>
          <div className={styles.currentEventMeta}>
            <span className={styles.nowBadge}>
              <span className={styles.pulseDot} />
              {t('timeline.allDone', '✓ ALL DONE')}
            </span>
          </div>
          <div className={styles.currentEventBody}>
            <span className={styles.eventIconLarge}>🌟</span>
            <div className={styles.eventTextBlock}>
              <h3 className={styles.eventTitle}>{t('timeline.greatJob', 'Great job today!')}</h3>
              <p className={styles.eventMessage}>{t('timeline.allTasksDone', "You've completed all your scheduled activities for today. Well done!")}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Next Event Preview ── */}
      {nextEvent && (
        <div className={styles.nextEventRow}>
          <span className={styles.nextLabel}>{t('timeline.next', 'NEXT')}</span>
          <span className={styles.nextEventIcon}>{nextEvent.icon}</span>
          <div className={styles.nextEventInfo}>
            <div className={styles.nextEventTitle}>{nextEvent.title}</div>
            <div className={styles.nextEventTime}>{nextEvent.time}</div>
          </div>
        </div>
      )}

      {/* ── Daily Summary Bar ── */}
      <div className={styles.dailySummaryBar}>
        {countDone > 0 && (
          <span className={`${styles.summaryChip} ${styles.chipDone}`}>
            ✓ {countDone} {t('timeline.done', 'Done')}
          </span>
        )}
        {countCurrent > 0 && (
          <span className={`${styles.summaryChip} ${styles.chipCurrent}`}>
            ▶ {countCurrent} {t('timeline.current', 'Now')}
          </span>
        )}
        {countUpcoming > 0 && (
          <span className={`${styles.summaryChip} ${styles.chipUpcoming}`}>
            ○ {countUpcoming} {t('timeline.upcoming', 'Upcoming')}
          </span>
        )}
        {countMissed > 0 && (
          <span className={`${styles.summaryChip} ${styles.chipMissed}`}>
            ⚠ {countMissed} {t('timeline.missed', 'Missed')}
          </span>
        )}
        {/* Hydration chip */}
        <span className={styles.hydrationChip}>
          💧 {hydrationCount}/{hydrationTarget}
          <span className={styles.hydrationBar}>
            <span
              className={styles.hydrationFill}
              style={{ width: `${Math.min(100, (hydrationCount / hydrationTarget) * 100)}%` }}
            />
          </span>
        </span>
      </div>

      {/* ── Expandable Full Day Timeline ── */}
      <div className={styles.compactTimelineCard}>
        <div
          className={styles.compactTimelineHeader}
          onClick={() => setIsExpanded(prev => !prev)}
          role="button"
          aria-expanded={isExpanded}
          aria-label="Toggle full day timeline"
        >
          <div className={styles.compactTimelineHeaderLeft}>
            📋 {t('timeline.todaySchedule', 'Today\'s Schedule')}
          </div>
          <ChevronDown
            size={18}
            className={`${styles.chevron} ${isExpanded ? styles.open : ''}`}
          />
        </div>

        {isExpanded && (
          <div className={styles.compactTimelineBody}>
            {dayEvents
              .filter(e => e.id.startsWith('routine-'))
              .map(event => (
                <div
                  key={event.id}
                  className={`${styles.timelineRow} ${event.status === 'current' ? styles.rowCurrent : ''} ${event.status === 'missed' ? styles.rowMissed : ''}`}
                >
                  <span className={styles.rowStatusIcon}>{getStatusIcon(event.status)}</span>
                  <span className={styles.rowTime}>{event.time}</span>
                  <span className={styles.rowEventIcon}>{event.icon}</span>
                  <span className={`${styles.rowTitle} ${event.status === 'current' ? styles.titleCurrent : ''} ${event.status === 'done' ? styles.titleDone : ''} ${event.status === 'missed' ? styles.titleMissed : ''}`}>
                    {event.title}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Pure helper functions ────────────────────────────────────────────────────

function getEventMessage(
  category: DayEvent['category'],
  title: string,
  time: string,
  t: (k: string, fallback: string) => string
): string {
  switch (category) {
    case 'sos': return t('timeline.msg.sos', 'Your help request has been sent. Your caregiver has been notified.');
    case 'hydration': return t('timeline.msg.hydration', "Time to drink some water. Stay hydrated, stay healthy!");
    case 'medicine': return t('timeline.msg.medicine', "It's time for your scheduled medicine.");
    case 'meal': {
      const lower = title.toLowerCase();
      if (lower.includes('breakfast')) return t('timeline.msg.breakfast', "It's breakfast time. A healthy start to your day!");
      if (lower.includes('lunch')) return t('timeline.msg.lunch', "It's time for lunch. Enjoy your meal!");
      if (lower.includes('dinner')) return t('timeline.msg.dinner', "It's dinner time. Have a warm, nourishing meal!");
      if (lower.includes('snack')) return t('timeline.msg.snack', "Snack time! Have something light and healthy.");
      return t('timeline.msg.meal', "It's meal time. Enjoy your food!");
    }
    case 'brain': return t('timeline.msg.brain', "Time for your mind activity. Let's keep your brain sharp and active!");
    case 'rest': {
      const lower = title.toLowerCase();
      if (lower.includes('sleep') || lower.includes('bedtime')) return t('timeline.msg.bedtime', "Time for bed. Have a restful and peaceful night!");
      if (lower.includes('relax') || lower.includes('breath')) return t('timeline.msg.relax', "Let's take a few calm, deep breaths together.");
      return t('timeline.msg.rest', "Time to rest. Take it easy for a little while.");
    }
    case 'family': return t('timeline.msg.family', "You have a family interaction scheduled. Your loved ones are thinking of you!");
    case 'appointment': return t('timeline.msg.appointment', `Your appointment is scheduled for ${time}.`);
    case 'exercise': return t('timeline.msg.exercise', "Time for your walk or exercise. Movement keeps you healthy and happy!");
    default: return title;
  }
}

function getPriority(status: DayEvent['status'], category: DayEvent['category']): DayEvent['priority'] {
  if (status === 'sos') return 0;
  if (status === 'missed' && (category === 'medicine' || category === 'meal')) return 1;
  if (status === 'current') return 2;
  if (status === 'upcoming') return 3;
  if (category === 'notification') return 4;
  return 5;
}

function buildTimelineContext(
  events: DayEvent[],
  currentEvent: DayEvent | null,
  nextEvent: DayEvent | null,
  hydrationCount: number,
  hydrationTarget: number
): string {
  const parts: string[] = [];

  if (currentEvent) {
    if (currentEvent.status === 'sos') {
      parts.push(`URGENT: Active help request - ${currentEvent.title}.`);
    } else if (currentEvent.status === 'missed') {
      parts.push(`Overdue: ${currentEvent.title} at ${currentEvent.time} was not completed.`);
    } else {
      parts.push(`Current: ${currentEvent.title} at ${currentEvent.time}.`);
    }
  }

  if (nextEvent) {
    parts.push(`Next: ${nextEvent.title} at ${nextEvent.time}.`);
  }

  const done = events.filter(e => e.status === 'done').map(e => e.title);
  if (done.length) parts.push(`Completed today: ${done.join(', ')}.`);

  const missed = events.filter(e => e.status === 'missed').map(e => e.title);
  if (missed.length) parts.push(`Missed: ${missed.join(', ')}.`);

  parts.push(`Hydration: ${hydrationCount} of ${hydrationTarget} glasses today.`);

  const upcoming = events.filter(e => e.status === 'upcoming').slice(0, 3).map(e => `${e.title} at ${e.time}`);
  if (upcoming.length) parts.push(`Coming up: ${upcoming.join(', ')}.`);

  return parts.join(' ');
}
