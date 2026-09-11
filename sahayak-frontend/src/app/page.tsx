"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { RightSchedule } from '@/components/RightPanel/RightSchedule';
import Greeting from '@/components/Greeting/Greeting';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { useAuth } from '@/components/AuthProvider/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider/LanguageProvider';
import { useNotifications } from '@/components/NotificationProvider/NotificationProvider';
import { DayCareTimeline } from '@/components/DayCareTimeline/DayCareTimeline';
import { 
  Gamepad2, 
  Clock, 
  Users, 
  Image as ImageIcon, 
  MessageSquare, 
  Flame, 
  Heart, 
  Bell, 
  Play
} from 'lucide-react';
import { getProfileBanner, getProfileBannerAltText } from '@/lib/profileVisuals';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import styles from './page.module.css';

export default function ElderlyDashboard() {
  const { textSize, setTextSize } = useAccessibility();
  const { session } = useAuth();
  const { t, language } = useLanguage();
  const { unreadCount } = useNotifications();
  const { profile } = useUserProfile();
  const router = useRouter();
  const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Sahayak AI';
  
  const [comfortMode, setComfortMode] = useState(false);
  const [timelineContext, setTimelineContext] = useState('');

  useEffect(() => {
    if (session.status === 'unauthenticated') {
      router.push('/login');
    }
  }, [session.status, router]);

  // Formatted date using current language locale
  const localeMap: Record<string, string> = {
    en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN', te: 'te-IN', mr: 'mr-IN',
    ta: 'ta-IN', ur: 'ur-PK', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN',
    pa: 'pa-IN', or: 'or-IN', as: 'as-IN', ne: 'ne-NP', sa: 'sa-IN'
  };
  const activeLocale = localeMap[language] || 'en-IN';

  const todayDate = new Date().toLocaleDateString(activeLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const toggleComfortMode = () => {
    const nextVal = !comfortMode;
    setComfortMode(nextVal);
    if (nextVal) {
      document.documentElement.setAttribute('data-theme', 'comfort');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  if (session.status === 'loading') {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'white' }}>Loading {APP_NAME}...</div>;
  }

  return (
    <div className={styles.dashboardLayout}>
      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Center Main Dashboard Content */}
      <main className={styles.mainContent}>
        {/* Top Header */}
        <header className={styles.topHeader}>
          <div className={styles.headerLeft}>
            <Greeting className={styles.greetingTitle} />
            <p className={styles.headerDate}>{todayDate}</p>
          </div>

          <div className={styles.headerControls}>
            {/* Text Sizing Controls */}
            <div className={styles.sizeBtnGroup}>
              <button 
                className={`${styles.sizeBtn} ${textSize === 'normal' ? styles.sizeBtnActive : ''}`}
                onClick={() => setTextSize('normal')}
                title="Normal text size"
              >
                A
              </button>
              <button 
                className={`${styles.sizeBtn} ${textSize === 'large' || textSize === 'extra-large' ? styles.sizeBtnActive : ''}`}
                onClick={() => setTextSize(textSize === 'large' ? 'extra-large' : 'large')}
                title="Larger text size"
              >
                A+
              </button>
            </div>

            {/* Comfort Mode Toggle */}
            <button 
              className={`${styles.comfortBtn} ${comfortMode ? styles.comfortBtnActive : ''}`}
              onClick={toggleComfortMode}
            >
              <Heart size={16} fill={comfortMode ? "#f43f5e" : "none"} />
              <span>{comfortMode ? t('home.comfortOn', 'Comfort Mode Active') : t('home.comfortOff', 'Comfort Mode')}</span>
            </button>

            {/* Notification Bell */}
            <Link href="/reminders">
              <button className={styles.notifBtn} aria-label="Notifications">
                <Bell size={18} />
                <span className={styles.notifBadge}>{unreadCount}</span>
              </button>
            </Link>
          </div>
        </header>

        {/* Hero Banner Card */}
        <div className={styles.heroBanner}>
          <img 
            src={getProfileBanner(profile?.gender)} 
            alt={getProfileBannerAltText(profile?.gender)} 
            className={styles.heroImage}
          />
          <div className={styles.heroOverlay}></div>
          <div className={styles.heroContent}>
            <h2 className={styles.heroHeading}>{t('home.doingGreat', "You're doing great today! 🌸")}</h2>
            <p className={styles.heroSubtext}>{t('home.wonderfulDay', "Let's make it a wonderful day.")}</p>
          </div>
        </div>

        {/* Section: Quick Actions */}
        <section className={styles.sectionBlock}>
          <h2 className={styles.sectionHeading}>{t('home.quickActions', 'What would you like to do?')}</h2>
          <div className={styles.actionGrid}>
            {/* Play Games */}
            <Link href="/play" className={`${styles.actionCard} ${styles.cardPurple}`}>
              <div className={styles.actionCardTop}>
                <div className={styles.actionIconBox}>
                  <Gamepad2 size={24} />
                </div>
              </div>
              <div>
                <h3 className={styles.actionCardTitle}>{t('nav.play', 'Play Games')}</h3>
                <p className={styles.actionCardDesc}>{t('home.keepMindActive', 'Keep your mind active')}</p>
              </div>
              <div className={styles.actionCardFooter}>
                <span className={styles.actionArrow}>→</span>
              </div>
            </Link>

            {/* My Day */}
            <Link href="/my-day" className={`${styles.actionCard} ${styles.cardGreen}`}>
              <div className={styles.actionCardTop}>
                <div className={styles.actionIconBox}>
                  <Clock size={24} />
                </div>
              </div>
              <div>
                <h3 className={styles.actionCardTitle}>{t('nav.routine', 'My Day')}</h3>
                <p className={styles.actionCardDesc}>{t('home.todayRoutine', "Today's routine & tasks")}</p>
              </div>
              <div className={styles.actionCardFooter}>
                <span className={styles.actionArrow}>→</span>
              </div>
            </Link>

            {/* Family */}
            <Link href="/family-connect" className={`${styles.actionCard} ${styles.cardBlue}`}>
              <div className={styles.actionCardTop}>
                <div className={styles.actionIconBox}>
                  <Users size={24} />
                </div>
              </div>
              <div>
                <h3 className={styles.actionCardTitle}>{t('nav.family', 'Family')}</h3>
                <p className={styles.actionCardDesc}>{t('home.connectLovedOnes', 'Connect with your loved ones')}</p>
              </div>
              <div className={styles.actionCardFooter}>
                <span className={styles.actionArrow}>→</span>
              </div>
            </Link>

            {/* Memories */}
            <Link href="/memories" className={`${styles.actionCard} ${styles.cardAmber}`}>
              <div className={styles.actionCardTop}>
                <div className={styles.actionIconBox}>
                  <ImageIcon size={24} />
                </div>
              </div>
              <div>
                <h3 className={styles.actionCardTitle}>{t('nav.memories', 'Memories')}</h3>
                <p className={styles.actionCardDesc}>{t('home.preciousMoments', 'Your precious moments')}</p>
              </div>
              <div className={styles.actionCardFooter}>
                <span className={styles.actionArrow}>→</span>
              </div>
            </Link>

            {/* Messages */}
            <Link href="/messages" className={`${styles.actionCard} ${styles.cardPink}`}>
              <div className={styles.actionCardTop}>
                <div className={styles.actionIconBox}>
                  <MessageSquare size={24} />
                </div>
                <span className={styles.actionBadge}>3</span>
              </div>
              <div>
                <h3 className={styles.actionCardTitle}>{t('nav.messages', 'Messages')}</h3>
                <p className={styles.actionCardDesc}>{t('home.familyMessages', 'Messages from family')}</p>
              </div>
              <div className={styles.actionCardFooter}>
                <span className={styles.actionArrow}>→</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Section: Today's Summary */}
        <section className={styles.sectionBlock}>
          <h2 className={styles.sectionHeading}>{t('home.todaySummary', "Today's Summary")}</h2>
          
          <div className={styles.summaryStatsGrid}>
            {/* Games Completed */}
            <div className={styles.statCard}>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>{t('home.gamesCompleted', 'Games Completed')}</span>
                <span className={styles.statValue}>2 / 5</span>
                <span className={styles.statSubtext}>{t('home.greatGoing', 'Great going!')}</span>
              </div>
              <div className={styles.statIconWrap}>
                <Gamepad2 size={24} color="#a855f7" />
              </div>
            </div>

            {/* Activity Time */}
            <div className={styles.statCard}>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>{t('home.activityTime', 'Activity Time')}</span>
                <span className={styles.statValue}>45 min</span>
                <span className={styles.statSubtext}>{t('home.keepItUp', 'Keep it up!')}</span>
              </div>
              <div className={styles.statIconWrap}>
                <Clock size={24} color="#34d399" />
              </div>
            </div>

            {/* Streak */}
            <div className={styles.statCard}>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>{t('home.streak', 'Streak')}</span>
                <span className={styles.statValue}>7 {t('home.days', 'days')}</span>
                <span className={styles.statSubtext}>{t('home.amazing', 'You are amazing!')}</span>
              </div>
              <div className={styles.statIconWrap}>
                <Flame size={24} color="#f59e0b" />
              </div>
            </div>
          </div>

          {/* Care Timeline — replaces old hydration card */}
          <DayCareTimeline onTimelineContextChange={setTimelineContext} />
        </section>

        {/* Section: Recommended For You */}
        <section className={styles.sectionBlock}>
          <h2 className={styles.sectionHeading}>{t('home.recommended', 'Recommended For You')}</h2>
          <div className={styles.gamesCarousel}>
            {/* Memory Match */}
            <Link href="/play/memory-match" className={styles.gameThumbnailCard}>
              <div className={styles.gameThumbWrap}>
                <img 
                  src="/assets/game_memory_match.jpg" 
                  alt="Memory Match" 
                  className={styles.gameImg}
                />
              </div>
              <div className={styles.gameCardMeta}>
                <span className={styles.gameCardName}>{t('game.memory-match.title', 'Memory Match')}</span>
                <Play size={16} className={styles.gamePlayIcon} />
              </div>
            </Link>

            {/* Spot the Difference */}
            <Link href="/play" className={styles.gameThumbnailCard}>
              <div className={styles.gameThumbWrap}>
                <img 
                  src="/assets/game_spot_diff.jpg" 
                  alt="Spot the Difference" 
                  className={styles.gameImg}
                />
              </div>
              <div className={styles.gameCardMeta}>
                <span className={styles.gameCardName}>{t('game.spot-difference.title', 'Spot the Difference')}</span>
                <Play size={16} className={styles.gamePlayIcon} />
              </div>
            </Link>

            {/* Number Recall */}
            <Link href="/play" className={styles.gameThumbnailCard}>
              <div className={styles.gameThumbWrap}>
                <img 
                  src="/assets/game_number_recall.jpg" 
                  alt="Number Recall" 
                  className={styles.gameImg}
                />
              </div>
              <div className={styles.gameCardMeta}>
                <span className={styles.gameCardName}>{t('game.number-recall.title', 'Number Recall')}</span>
                <Play size={16} className={styles.gamePlayIcon} />
              </div>
            </Link>

            {/* Memory Stories */}
            <Link href="/memories" className={styles.gameThumbnailCard}>
              <div className={styles.gameThumbWrap}>
                <img 
                  src="/assets/game_story_time.jpg" 
                  alt="Story Time" 
                  className={styles.gameImg}
                />
              </div>
              <div className={styles.gameCardMeta}>
                <span className={styles.gameCardName}>{t('game.memory-stories.title', 'Story Time')}</span>
                <Play size={16} className={styles.gamePlayIcon} />
              </div>
            </Link>
          </div>
        </section>
      </main>

      {/* Right Schedule & Reminders Panel */}
      <RightSchedule />
    </div>
  );
}
