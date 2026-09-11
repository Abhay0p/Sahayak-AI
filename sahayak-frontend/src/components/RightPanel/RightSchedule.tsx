"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { useLanguage } from '@/components/LanguageProvider/LanguageProvider';
import styles from './RightSchedule.module.css';

interface ScheduleItem {
  id: number;
  time: string;
  title: string;
  status: 'done' | 'pending';
  dotColor: 'done' | 'pending' | 'warning';
}

export const RightSchedule: React.FC = () => {
  const { profile, updateProfile } = useUserProfile();
  const { t } = useLanguage();
  
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    if (profile) {
      try {
        const customRoutine = JSON.parse(profile.routinePreferences);
        if (customRoutine && customRoutine.length > 0) {
           setSchedule(customRoutine);
           return;
        }
      } catch (e) {
        // Failed to parse
      }
      
      setSchedule([
        { id: 1, time: '8:00 AM', title: 'Breakfast', status: 'done', dotColor: 'done' },
        { id: 2, time: '10:00 AM', title: 'Hydration', status: 'pending', dotColor: 'pending' },
        { id: 3, time: '1:00 PM', title: 'Lunch', status: 'pending', dotColor: 'warning' },
        { id: 4, time: '4:00 PM', title: 'Medicine', status: 'pending', dotColor: 'warning' },
        { id: 5, time: '6:00 PM', title: 'Evening Walk', status: 'pending', dotColor: 'pending' },
        { id: 6, time: '8:00 PM', title: 'Dinner', status: 'pending', dotColor: 'warning' },
        { id: 7, time: '9:00 PM', title: 'Bedtime Medicine', status: 'pending', dotColor: 'warning' },
      ]);
    }
  }, [profile]);

  const toggleTask = (id: number) => {
    const updated = schedule.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'done' ? 'pending' : 'done';
        return {
          ...item,
          status: nextStatus,
          dotColor: nextStatus === 'done' ? 'done' : 'pending'
        };
      }
      return item;
    });
    setSchedule(updated as ScheduleItem[]);
    if (profile?.routinePreferences) {
      updateProfile({ routinePreferences: JSON.stringify(updated) });
    }
  };

  const getLocalizedTitle = (rawTitle: string) => {
    const lower = rawTitle.toLowerCase();
    if (lower.includes('breakfast')) return t('myday.breakfast', 'Breakfast');
    if (lower.includes('lunch')) return t('myday.lunch', 'Lunch');
    if (lower.includes('dinner')) return t('myday.dinner', 'Dinner');
    if (lower.includes('medicine')) return t('myday.medicine', 'Medicine');
    if (lower.includes('hydration') || lower.includes('water')) return t('myday.hydration', 'Hydration');
    if (lower.includes('walk')) return t('myday.walk', 'Walk');
    if (lower.includes('exercise')) return t('myday.exercise', 'Exercise');
    if (lower.includes('rest')) return t('myday.rest', 'Rest');
    if (lower.includes('game') || lower.includes('activity')) return t('myday.game', 'Brain Activity');
    return rawTitle;
  };

  return (
    <aside className={styles.container}>
      {/* Today's Schedule Card */}
      <div className={styles.panelCard}>
        <h3 className={styles.cardTitle}>{t('home.todayRoutine', "Today's Schedule")}</h3>
        
        <div className={styles.scheduleList}>
          {schedule.map((item) => (
            <div 
              key={item.id} 
              className={styles.scheduleItem}
              onClick={() => toggleTask(item.id)}
              style={{ cursor: 'pointer' }}
              title="Click to toggle status"
            >
              <div className={styles.scheduleLeft}>
                <span className={`${styles.dot} ${
                  item.dotColor === 'done' ? styles.dotDone : 
                  item.dotColor === 'pending' ? styles.dotPending : styles.dotWarning
                }`} />
                <span className={styles.timeText}>{item.time}</span>
                <span className={styles.taskTitle}>{getLocalizedTitle(item.title)}</span>
              </div>
              <span className={`${styles.statusBadge} ${
                item.status === 'done' ? styles.statusDone : styles.statusPending
              }`}>
                {item.status === 'done' ? t('myday.completed', 'Done ✓') : t('myday.pending', 'Pending')}
              </span>
            </div>
          ))}
        </div>

        <Link href="/my-day">
          <button className={styles.viewAllBtn}>{t('myday.viewFull', 'View Full Routine')}</button>
        </Link>
      </div>

      {/* Upcoming Reminder Card — dynamic from actual schedule */}
      <div className={styles.panelCard}>
        <h3 className={styles.cardTitle}>{t('home.upcomingReminder', 'Upcoming Reminder')}</h3>
        
        {(() => {
          const nextPending = schedule.find(item => item.status !== 'done');
          if (!nextPending) {
            return (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem 0' }}>
                ✓ {t('home.allTasksDone', 'All tasks done for now!')}
              </p>
            );
          }
          const lower = (nextPending.title || '').toLowerCase();
          const icon = lower.includes('medicine') || lower.includes('pill') ? '💊'
            : lower.includes('water') || lower.includes('hydrat') ? '💧'
            : lower.includes('breakfast') ? '🥣'
            : lower.includes('lunch') ? '🍲'
            : lower.includes('dinner') ? '🍽️'
            : lower.includes('rest') ? '😴'
            : lower.includes('brain') || lower.includes('game') ? '🧠'
            : lower.includes('walk') || lower.includes('exercise') ? '🚶'
            : lower.includes('family') ? '❤️'
            : '📌';
          return (
            <div className={styles.reminderItem}>
              <div className={styles.reminderIconWrap}>{icon}</div>
              <div className={styles.reminderDetails}>
                <div className={styles.reminderHeader}>
                  <span className={styles.reminderName}>{getLocalizedTitle(nextPending.title)}</span>
                  <span className={styles.reminderTimeBadge}>{nextPending.time}</span>
                </div>
                <p className={styles.reminderSub}>{t('notif.upcoming', 'Coming up next')}</p>
              </div>
            </div>
          );
        })()}

        <Link href="/reminders">
          <button className={styles.viewAllBtn}>{t('home.viewAllReminders', 'View All Reminders')}</button>
        </Link>
      </div>

      {/* Daily Motivation Card */}
      <div className={`${styles.panelCard} ${styles.motivationCard}`}>
        <h3 className={styles.cardTitle}>{t('home.dailyMotivation', 'Daily Motivation')}</h3>
        <div className={styles.motivationContent}>
          <p className={styles.motivationQuote}>
            "{t('home.motivationQuote', 'Every day is a new opportunity to take care of yourself.')}"
          </p>
          <div className={styles.motivationIcon}>💖</div>
        </div>
      </div>
    </aside>
  );
};
