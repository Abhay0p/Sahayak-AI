import React, { useEffect, useState } from 'react';
import { Loader2, Gamepad2, Bell, Clock, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import SummaryCard from './SummaryCard';
import { apiClient } from '@/lib/apiClient';

export default function TodayGlance({ patientId }: { patientId: string }) {
  const { profile } = useUserProfile();
  const { t } = useTranslation(profile?.languagePreference);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    apiClient(`/api/family/dashboard?elderlyId=${patientId}`)
      .then(d => {
        if (d.success) setData(d.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }

  if (!data) return null;

  const { games, reminders, helpRequests, timeline } = data;
  const gameSessions = games?.sessions || [];
  const allReminders = reminders?.all || [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SummaryCard
        icon={<Gamepad2 size={24} />}
        title={t('games_today')}
        value={gameSessions.length}
        subtitle={t('completed')}
      >
        {gameSessions.slice(0, 3).map((g: any) => (
          <p key={g.id} className="text-white/80 text-sm">
            {g.game?.name || 'Game'} (Score: {g.score})
          </p>
        ))}
      </SummaryCard>

      <SummaryCard
        icon={<Bell size={24} />}
        title={t('reminders')}
        value={allReminders.length}
      >
        {allReminders.slice(0, 3).map((r: any) => (
          <p key={r.id} className="text-white/80 text-sm">
            {r.title}: {r.logs?.length > 0 ? r.logs[0].status : t('pending')}
          </p>
        ))}
      </SummaryCard>

      <SummaryCard
        icon={<AlertCircle size={24} />}
        title={t('help_requests')}
        value={helpRequests.length}
      >
        {helpRequests.slice(0, 3).map((h: any) => (
          <p key={h.id} className="text-white/80 text-sm">{h.message}</p>
        ))}
      </SummaryCard>

      <SummaryCard
        icon={<Clock size={24} />}
        title={t('activity_timeline')}
        className="md:col-span-2"
      >
        <ul className="space-y-1">
          {timeline.slice(0, 3).map((item: any) => (
            <li key={item.id} className="text-white/70 text-sm">
              [{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] {item.title}
            </li>
          ))}
        </ul>
      </SummaryCard>
    </div>
  );
}
