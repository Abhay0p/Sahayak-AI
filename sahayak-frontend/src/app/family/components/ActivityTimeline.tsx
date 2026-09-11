import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { Clock, Gamepad2, Droplets, Utensils, Pill, HelpCircle } from 'lucide-react';
import { formatGameName, formatDateFriendly } from '@/lib/formatting';
import SummaryCard from '@/app/family/components/SummaryCard';
import { apiClient } from '@/lib/apiClient';

export default function ActivityTimeline({ patientId }: { patientId: string }) {
  const { profile } = useUserProfile();
  const { t } = useTranslation(profile?.languagePreference);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;

    apiClient(`/api/family/dashboard?elderlyId=${patientId}`)
      .then(d => {
        if (d.success) {
          setTimeline(d.data.timeline || []);
        }
      })
      .finally(() => setIsLoading(false));
  }, [patientId]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'game': return <Gamepad2 size={16} className="text-indigo-400" />;
      case 'hydration': return <Droplets size={16} className="text-blue-400" />;
      case 'meal': return <Utensils size={16} className="text-orange-400" />;
      case 'medicine': return <Pill size={16} className="text-rose-400" />;
      default: return <Clock size={16} className="text-white/60" />;
    }
  };

  return (
    <SummaryCard icon={<Clock className="text-blue-400" />} title="Activity Timeline" className="mb-4">
      {isLoading ? (
        <p className="text-white/70">Loading activity...</p>
      ) : timeline.length === 0 ? (
        <p className="text-white/70">No activity recorded recently.</p>
      ) : (
        <div className="relative border-l border-white/20 ml-3 pl-6 space-y-6">
          {timeline.map((item, idx) => (
            <div key={item.id} className="relative">
              <div className="absolute -left-[32px] bg-[var(--bg-color)] p-1 rounded-full border border-white/20">
                {getIcon(item.type)}
              </div>
              <div>
                <span className="text-xs opacity-70 mb-1 block">
                  {formatDateFriendly(item.timestamp, profile?.timezone)}
                </span>
                <span className="text-md font-medium block">{item.title}</span>
                {item.detail && (
                  <span className="text-sm opacity-80 mt-1 block bg-black/20 p-2 rounded inline-block">
                    {item.detail}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SummaryCard>
  );
}
