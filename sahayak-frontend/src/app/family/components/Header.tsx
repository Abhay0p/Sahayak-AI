import React from 'react';
import { Bell, User } from 'lucide-react';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { useTranslation } from '@/lib/useTranslation';

interface HeaderProps {
  patientName: string;
  relationship: string;
  lastSyncMinutesAgo?: number; // minutes ago
  unreadCount?: number;
}

export default function Header({ patientName, relationship, lastSyncMinutesAgo = 5, unreadCount = 0 }: HeaderProps) {
  const { profile } = useUserProfile();
  const { t } = useTranslation(profile?.languagePreference);

  const greeting = `Good Evening${profile?.firstName ? ', ' + profile.firstName : ''} 👋`;

  return (
    <header className="header card">
      <div>
        <h2 className="greeting">{greeting}</h2>
        <p className="patient-info">
          Caring for: {patientName} • {relationship}
        </p>
        <div className="status-badge">
          <span className="dot online" />
          <span>{`Synced ${lastSyncMinutesAgo} min ago`}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-secondary" aria-label={t('notifications')}> 
          <Bell size={20} />
          {unreadCount > 0 && <span style={{ marginLeft: '4px' }}>{unreadCount}</span>}
        </button>
        <button className="btn btn-secondary" aria-label={t('profile')}> 
          <User size={20} />
        </button>
      </div>
    </header>
  );
}
