"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Calendar, 
  Gamepad2, 
  Bell, 
  Users, 
  Image as ImageIcon, 
  MessageSquare, 
  UserCheck, 
  HelpCircle, 
  Settings, 
  Globe, 
  Mic, 
  Sparkles,
  ChevronDown,
  User
} from 'lucide-react';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { useLanguage } from '@/components/LanguageProvider/LanguageProvider';
import { LANGUAGES, LanguageCode } from '@/lib/i18n';
import { updateProfile } from '@/lib/profile';
import { getProfileAvatar } from '@/lib/profileVisuals';
import { useAuth } from '@/components/AuthProvider/AuthProvider';
import { VoiceAssistantModal } from '@/components/VoiceAssistant/VoiceAssistantModal';
import styles from './Sidebar.module.css';
import { apiClient } from '@/lib/apiClient';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { displayName, profile } = useUserProfile();
  const { t, setLanguage, language } = useLanguage();
  const { session } = useAuth();
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTimelineContext, setVoiceTimelineContext] = useState('');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  const openVoiceAssistant = () => {
    // Read the latest timeline context written by DayCareTimeline
    const ctx = typeof window !== 'undefined'
      ? (sessionStorage.getItem('sahayak_timeline_context') || '')
      : '';
    setVoiceTimelineContext(ctx);
    setIsVoiceActive(true);
  };

  // Fetch real unread message count from the API
  useEffect(() => {
    if (!session?.user) return;
    const fetchUnread = async () => {
      try {
        const res = await apiClient('/api/messages');
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) setUnreadMsgCount(data.unreadCount ?? 0);
      } catch {}
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 60_000);
    return () => clearInterval(id);
  }, [session?.user]);

  const role = session?.user?.role || 'elderly';

  let navItems: any[] = [];
  if (role === 'elderly') {
    navItems = [
      { labelKey: 'nav.dashboard', label: 'Home', href: '/', icon: Home },
      { labelKey: 'nav.routine', label: 'My Day', href: '/my-day', icon: Calendar },
      { labelKey: 'nav.play', label: 'Play Games', href: '/play', icon: Gamepad2 },
      { labelKey: 'nav.reminders', label: 'Reminders', href: '/reminders', icon: Bell },
      { labelKey: 'nav.family', label: 'Family', href: '/family', icon: Users },
      { labelKey: 'nav.memories', label: 'Memories', href: '/memories', icon: ImageIcon },
      { labelKey: 'nav.help', label: 'Help & SOS', href: '/help', icon: HelpCircle },
      { labelKey: 'nav.settings', label: 'Settings', href: '/settings', icon: Settings },
    ];
  } else if (role === 'family') {
    navItems = [
      { labelKey: 'nav.dashboard', label: 'Dashboard', href: '/family', icon: Home },
      { labelKey: 'nav.messages', label: 'Messages', href: '/messages', icon: MessageSquare, badge: unreadMsgCount > 0 ? String(unreadMsgCount) : undefined },
      { labelKey: 'nav.settings', label: 'Settings', href: '/settings', icon: Settings },
    ];
  } else if (role === 'caregiver') {
    navItems = [
      { labelKey: 'nav.dashboard', label: 'Dashboard', href: '/caregiver', icon: Home },
      { labelKey: 'nav.patients', label: 'Patients', href: '/caregiver', icon: Users },
      { labelKey: 'nav.settings', label: 'Settings', href: '/settings', icon: Settings },
    ];
  } else if (role === 'healthcare') {
    navItems = [
      { labelKey: 'nav.dashboard', label: 'Dashboard', href: '/healthcare', icon: Home },
      { labelKey: 'nav.patients', label: 'Patients', href: '/healthcare', icon: Users },
      { labelKey: 'nav.settings', label: 'Settings', href: '/settings', icon: Settings },
    ];
  } else if (role === 'admin') {
    navItems = [
      { labelKey: 'nav.dashboard', label: 'Dashboard', href: '/admin', icon: Home },
      { labelKey: 'nav.users', label: 'Users', href: '/admin', icon: Users },
      { labelKey: 'nav.settings', label: 'Settings', href: '/settings', icon: Settings },
    ];
  }

  const handleVoiceToggle = () => {
    setIsVoiceActive(true);
  };

  const handleLangSelect = async (code: string) => {
    // 1. Update React language context immediately (UI rerenders)
    setLanguage(code as LanguageCode);
    // 2. Persist to database and profile
    await updateProfile({ languagePreference: code });
    setLangDropdownOpen(false);
  };

  const currentLang = LANGUAGES[language as keyof typeof LANGUAGES];

  return (
    <>
      <aside className={styles.sidebar}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.logoContainer}>
            <Sparkles className={styles.logoIcon} />
            <h1 className={styles.brandTitle}>SAHAYAK AI</h1>
          </div>
          <p className={styles.brandTagline}>Your Memory. Your Routine. Your People.</p>
        </div>

        {/* User Card */}
        <div className={styles.bottomSection}>
          <div className={styles.avatarWrapper}>
            {profile?.avatarUrl ? (
              <img 
                src={profile.avatarUrl}
                alt={displayName || 'User Avatar'} 
                className={styles.avatarImg}
              />
            ) : getProfileAvatar(profile?.gender) ? (
              <img 
                src={getProfileAvatar(profile?.gender) as string} 
                alt={displayName || 'User Avatar'} 
                className={styles.avatarImg}
              />
            ) : (
              <div className={styles.avatarImg} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card-bg)', color: 'var(--text-secondary)' }}>
                <User size={32} />
              </div>
            )}
          </div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{displayName || 'Guest User'}</p>
            <Link href="/settings">
              <button className={styles.editProfileBtn}>{t('action.editProfile', 'Edit Profile')}</button>
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.navMenu}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.label} 
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                <Icon className={styles.navIcon} />
                <span>{t(item.labelKey, item.label)}</span>
                {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Tools */}
        <div className={styles.footerSection}>
          <div 
            className={styles.langSelector}
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
          >
            <div className={styles.langLeft}>
              <Globe size={16} />
              <span>{currentLang?.nativeName || 'English'} ({currentLang?.name || 'EN'})</span>
            </div>
            <ChevronDown size={14} />
          </div>

          {langDropdownOpen && (
            <div style={{
              backgroundColor: '#1e293b',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
              maxHeight: '200px',
              overflowY: 'auto',
              position: 'relative',
              zIndex: 9999,
            }}>
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <button
                  key={code}
                  onClick={() => handleLangSelect(code)}
                  style={{
                    textAlign: 'left',
                    padding: '0.4rem 0.6rem',
                    fontSize: '0.8rem',
                    borderRadius: '4px',
                    backgroundColor: language === code ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                    color: language === code ? '#a855f7' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  {lang.nativeName} ({lang.name}) {language === code ? '✓' : ''}
                </button>
              ))}
            </div>
          )}

          <button 
            className={`${styles.voiceBtn} ${isVoiceActive ? styles.voiceBtnActive : ''}`}
            onClick={openVoiceAssistant}
          >
            <Mic size={16} />
            <span>{t('voice.assistant', 'Voice Assistant')}</span>
          </button>
        </div>
      </aside>

      {/* Interactive Multilingual Voice Assistant Modal */}
      <VoiceAssistantModal 
        isOpen={isVoiceActive} 
        onClose={() => setIsVoiceActive(false)}
        timelineContext={voiceTimelineContext}
      />
    </>
  );
};
