"use client";
import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { useNotifications } from '@/components/NotificationProvider/NotificationProvider';
import { getStatusColor } from '@/lib/notifications';
import { Bell, Plus, Check, Clock, Play } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

export default function RemindersPage() {
  const { dbNotifications, markDbRead } = useNotifications();
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED'>('UPCOMING');

  const mappedDbNotifs: any[] = (dbNotifications || []).map(db => ({
    id: db.id,
    category: db.type,
    title: db.title,
    message: db.body,
    scheduledFor: new Date(db.createdAt),
    status: db.read ? 'COMPLETED' : 'SCHEDULED',
    actionUrl: db.actionUrl,
    isDb: true
  }));

  const allNotifications = [...mappedDbNotifs];

  // Sort by time: earliest first for UPCOMING, latest first for COMPLETED
  const sortedNotifications = allNotifications.sort((a, b) => {
    if (activeTab === 'UPCOMING') return a.scheduledFor.getTime() - b.scheduledFor.getTime();
    return b.scheduledFor.getTime() - a.scheduledFor.getTime();
  });

  const filteredNotifs = sortedNotifications.filter(n => {
    if (activeTab === 'UPCOMING') return n.status === 'SCHEDULED' || n.status === 'DELIVERED' || n.status === 'SNOOZED';
    return n.status === 'COMPLETED' || n.status === 'ACKNOWLEDGED';
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.mainContent}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Reminders</h1>
          <button className={styles.addBtn}>
            <Plus size={20} /> New Reminder
          </button>
        </div>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'UPCOMING' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('UPCOMING')}
          >
            Upcoming
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'COMPLETED' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('COMPLETED')}
          >
            Completed
          </button>
        </div>

        <div className={styles.remindersList}>
          {filteredNotifs.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Bell size={48} />
              </div>
              <h2>No {activeTab.toLowerCase()} reminders</h2>
              <p>You're all caught up for now.</p>
            </div>
          ) : (
            filteredNotifs.map(notif => (
              <div key={notif.id} className={styles.reminderCard}>
                <div className={styles.reminderInfo}>
                  <div className={styles.timeBox}>
                    <span className={styles.time}>{formatTime(notif.scheduledFor).split(' ')[0]}</span>
                    <span className={styles.ampm}>{formatTime(notif.scheduledFor).split(' ')[1]}</span>
                  </div>
                  <div className={styles.details}>
                    <h3>{notif.title}</h3>
                    <p>{notif.message}</p>
                    <span 
                      className={styles.statusBadge}
                      style={{ 
                        backgroundColor: `${getStatusColor(notif.status)}33`,
                        color: getStatusColor(notif.status)
                      }}
                    >
                      {notif.status}
                    </span>
                  </div>
                </div>
                
                {activeTab === 'UPCOMING' && (
                  <div className={styles.actions}>
                    {notif.actionUrl ? (
                      <Link href={notif.actionUrl} className={styles.playBtn}>
                        <Play size={18} /> {notif.actionUrl.includes('play') ? 'Play Now' : 'Go'}
                      </Link>
                    ) : (
                      <>
                        <button 
                          className={styles.actionBtn + ' ' + styles.snoozeBtn}
                          onClick={() => markDbRead(notif.id)}
                        >
                          <Clock size={18} /> Snooze
                        </button>
                        <button 
                          className={styles.actionBtn + ' ' + styles.completeBtn}
                          onClick={() => markDbRead(notif.id)}
                        >
                          <Check size={18} /> Done
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
