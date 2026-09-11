"use client";
import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { Clock, Calendar, CheckCircle, Circle } from 'lucide-react';
import { formatDateFriendly } from '@/lib/formatting';
import { apiClient } from '@/lib/apiClient';
import SummaryCard from '@/app/family/components/SummaryCard';

export default function UpcomingActivity({ patientId }: { patientId: string }) {
  const { profile } = useUserProfile();
  const { t } = useTranslation(profile?.languagePreference);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    apiClient(`/api/family/dashboard?elderlyId=${patientId}`)
      .then(d => {
        if (d.success && d.data.upcomingRoutine) {
          setUpcoming(d.data.upcomingRoutine);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [patientId]);

  return (
    <SummaryCard icon={<Calendar className="text-amber-400" />} title="What's Next" className="mb-4">
      {isLoading ? (
        <p className="text-white/70">Loading upcoming events...</p>
      ) : upcoming.length === 0 ? (
        <p className="text-white/70">No upcoming events scheduled for today.</p>
      ) : (
        <div className="relative border-l border-white/20 ml-3 pl-6 space-y-6">
          {upcoming.map((item, idx) => (
            <div key={item.id} className="relative">
              <div className="absolute -left-[31px] bg-[var(--bg-color)] p-1">
                {item.done ? (
                  <CheckCircle size={16} className="text-green-400 bg-[var(--bg-color)]" />
                ) : (
                  <Circle size={16} className="text-white/40 bg-[var(--bg-color)]" />
                )}
              </div>
              <div>
                <span className="text-sm font-semibold text-amber-400 mb-1 block">{item.time}</span>
                <span className="text-lg font-medium">{item.title}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </SummaryCard>
  );
}
