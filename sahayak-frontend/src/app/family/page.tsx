"use client";
import React, { useState, useEffect, useCallback } from 'react';

import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { MessageCircle, Send } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import FamilyHeader from '@/app/family/components/FamilyHeader';
import { Patient } from '@/app/family/components/PatientSelector';
import TodayGlance from '@/app/family/components/TodayGlance';
import NeedsAttention from '@/app/family/components/NeedsAttention';
import SettingsPanel from '@/app/family/components/SettingsPanel';
import CognitiveActivity from '@/app/family/components/CognitiveActivity';
import TrendVisualization from '@/app/family/components/TrendVisualization';
import UpcomingActivity from '@/app/family/components/UpcomingActivity';
import ActivityTimeline from '@/app/family/components/ActivityTimeline';
import RecentGames from '@/app/family/components/RecentGames';
import QuickActions from '@/app/family/components/QuickActions';
import FamilyMemories from '@/app/family/components/FamilyMemories';
import DailySummary from '@/app/family/components/DailySummary';
import NotificationCenter from '@/app/family/components/NotificationCenter';
import DisclaimerBanner from '@/app/family/components/DisclaimerBanner';
import { useTranslation } from '@/lib/useTranslation';
import { apiClient } from '@/lib/apiClient';
import { useCall } from '@/components/CallProvider/CallProvider';
import CallTypeSelector from '@/components/CallProvider/CallTypeSelector';

export default function FamilyPortal() {
  const { profile } = useUserProfile();
  const { t } = useTranslation(profile?.languagePreference);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [message, setMessage] = useState('');
  const [showCallSelector, setShowCallSelector] = useState(false);

  const { startCall, callState } = useCall();

  // ── Patient state (full object, not just ID) ──────────────────────────
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const selectedPatientId = selectedPatient?.id ?? '';

  // ── Sync tracking ─────────────────────────────────────────────────────
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const queryClient = useQueryClient();

  // ── Live unread notification count ───────────────────────────────────
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['familyUnreadCount'],
    queryFn: async () => {
      try {
        const data = await apiClient('/api/notifications');
        setLastSyncTime(new Date());
        if (Array.isArray(data)) {
          return data.filter((n: any) => !n.read).length;
        }
        if (data?.data && Array.isArray(data.data)) {
          return (data.data as any[]).filter(n => !n.read).length;
        }
        return 0;
      } catch {
        return 0;
      }
    },
    refetchInterval: 60_000
  });

  // ── Messages ──────────────────────────────────────────────────────────
  const { data: messages = [] } = useQuery({
    queryKey: ['familyMessages', selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      try {
        const data = await apiClient(`/api/messages?contactId=${selectedPatientId}`);
        if (Array.isArray(data)) return data;
        if (data?.data && Array.isArray(data.data)) return data.data;
        return [];
      } catch {
        return [];
      }
    },
    enabled: activeTab === 'messages' && !!selectedPatientId,
  });

  const markReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient('/api/messages/read', {
        method: 'PATCH',
        body: JSON.stringify({ senderId: selectedPatientId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMessages', selectedPatientId] });
    }
  });

  useEffect(() => {
    if (activeTab === 'messages' && selectedPatientId) {
      markReadMutation.mutate();
    }
  }, [activeTab, selectedPatientId]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const data = await apiClient('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ receiverId: selectedPatientId, content }),
      });
      return data;
    },
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ['familyMessages', selectedPatientId] });
      const previous = queryClient.getQueryData<any[]>(['familyMessages', selectedPatientId]);
      
      const optimisticMsg = {
        id: `opt-${Date.now()}`,
        content,
        senderId: profile?.id,
        createdAt: new Date().toISOString(),
        sender: { firstName: profile?.firstName }
      };

      if (previous) {
        queryClient.setQueryData<any[]>(['familyMessages', selectedPatientId], [...previous, optimisticMsg]);
      }
      return { previous, optimisticId: optimisticMsg.id };
    },
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData<any[]>(['familyMessages', selectedPatientId], old => {
        if (!old) return [data];
        return old.map(m => m.id === context?.optimisticId ? data : m);
      });
    },
    onError: (err, variables, context) => {
      setMessage(variables);
      if (context?.previous) {
        queryClient.setQueryData(['familyMessages', selectedPatientId], context.previous);
      }
    }
  });

  const sendMessage = async () => {
    if (!message.trim() || !selectedPatientId) return;
    const content = message.trim();
    setMessage('');
    sendMutation.mutate(content);
  };

  const tabs = ['dashboard', 'notifications', 'messages', 'settings'];

  return (
    <>
      {/* Call Type Selector sheet */}
      {showCallSelector && (
        <CallTypeSelector
          contacts={selectedPatient
            ? [{ id: selectedPatient.id, name: `${selectedPatient.firstName} ${selectedPatient.lastName || ''}`.trim(), avatarUrl: selectedPatient.avatarUrl || undefined }]
            : []
          }
          onClose={() => setShowCallSelector(false)}
        />
      )}

      {/* Premium header */}
      <FamilyHeader
        selectedPatient={selectedPatient}
        onSelectPatient={p => {
          setSelectedPatient(p);
          setLastSyncTime(new Date());
        }}
        unreadCount={unreadCount}
        lastSyncTime={lastSyncTime}
      />

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          marginBottom: '2rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: '0',
        }}
      >
        {tabs.map(tab => (
          <button
            key={tab}
            id={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.6rem 1.2rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: activeTab === tab ? '#a855f7' : 'rgba(255,255,255,0.45)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'color 0.2s',
              textTransform: 'capitalize',
            }}
          >
            {t(tab)}
            {activeTab === tab && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
                  borderRadius: '3px 3px 0 0',
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Dashboard tab ────────────────────────────────────────────── */}
      {activeTab === 'dashboard' && selectedPatientId && (
        <div className="grid gap-6">
          <DailySummary patientId={selectedPatientId} />
          <TodayGlance patientId={selectedPatientId} />
          <NeedsAttention patientId={selectedPatientId} />
          <div id="upcoming-activity"><UpcomingActivity patientId={selectedPatientId} /></div>
          <ActivityTimeline patientId={selectedPatientId} />
          <RecentGames patientId={selectedPatientId} />
          <QuickActions 
            onCallClick={() => setShowCallSelector(true)}
            onMessageClick={() => setActiveTab('messages')}
            onVoiceMessageClick={() => setActiveTab('messages')}
            onMemoryClick={() => { document.getElementById('memory-file-input')?.click(); }}
            onScheduleClick={() => { document.getElementById('upcoming-activity')?.scrollIntoView({behavior: 'smooth'}) }}
          />
          <div id="family-memories"><FamilyMemories patientId={selectedPatientId} /></div>
          <DisclaimerBanner />
          <TrendVisualization patientId={selectedPatientId} />
          <CognitiveActivity patientId={selectedPatientId} />
        </div>
      )}

      {activeTab === 'dashboard' && !selectedPatientId && (
        <div className="flex flex-col items-center justify-center py-24 text-white/40">
          <p className="text-lg">{t('no_patients_linked')}</p>
        </div>
      )}

      {/* ── Notifications tab ────────────────────────────────────────── */}
      {activeTab === 'notifications' && <NotificationCenter />}

      {/* ── Messages tab ─────────────────────────────────────────────── */}
      {activeTab === 'messages' && selectedPatientId && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '1rem',
            height: '500px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageCircle size={20} /> {t('family_chat')}
            </h3>
          </div>
          <div
            style={{
              flex: 1,
              padding: '1.5rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {messages.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{t('no_messages')}</p>
            )}
            {messages.map((msg: any, i: number) => {
              const isMe = msg.senderId === profile?.id;
              return (
                <div
                  key={msg.id || i}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    background: isMe ? '#7c3aed' : 'rgba(255,255,255,0.05)',
                    padding: '0.8rem 1rem',
                    borderRadius: isMe ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
                    maxWidth: '70%',
                  }}
                >
                  <p style={{ fontSize: '0.75rem', color: isMe ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)', marginBottom: '0.25rem' }}>
                    {msg.sender?.firstName || 'User'} ·{' '}
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p style={{ color: 'white' }}>{msg.content}</p>
                </div>
              );
            })}
          </div>
          <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder={t('type_message')}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                outline: 'none',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              style={{
                background: message.trim() ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,0.1)',
                color: 'white',
                border: 'none',
                padding: '0 1.25rem',
                borderRadius: '0.75rem',
                cursor: message.trim() ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── Settings tab ─────────────────────────────────────────────── */}
      {activeTab === 'settings' && <SettingsPanel />}
    </>
  );
}
