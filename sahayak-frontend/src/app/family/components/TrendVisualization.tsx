import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { LineChart, Activity, Info } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

export default function TrendVisualization({ patientId }: { patientId: string }) {
  const { profile } = useUserProfile();
  const { t } = useTranslation(profile?.languagePreference);
  const [trends, setTrends] = useState<any>(null);

  useEffect(() => {
    if (!patientId) return;
    apiClient(`/api/family/dashboard?elderlyId=${patientId}`)
      .then(d => {
        if (d.success && d.data.games?.trends) {
          setTrends(d.data.games.trends);
        }
      });
  }, [patientId]);

  if (!trends) return null;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 text-white mt-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <LineChart className="text-purple-400" />
        Activity Trends
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black/20 p-4 rounded-md">
          <h3 className="text-sm uppercase opacity-70 mb-2 flex items-center gap-2">
            <Activity size={16} /> Engagement Trend
          </h3>
          <p className="text-2xl font-semibold">{trends.engagement}</p>
          <p className="text-xs opacity-60 mt-2">Based on {trends.thisWeek.gamesPlayed} sessions this week vs {trends.lastWeek.gamesPlayed} last week.</p>
        </div>
        
        <div className="bg-black/20 p-4 rounded-md">
          <h3 className="text-sm uppercase opacity-70 mb-2 flex items-center gap-2">
            <Target size={16} /> Game Performance
          </h3>
          <p className="text-2xl font-semibold">{trends.performance}</p>
          <p className="text-xs opacity-60 mt-2">Average accuracy: {trends.thisWeek.avgAccuracy}% (This week) vs {trends.lastWeek.avgAccuracy}% (Last week).</p>
        </div>
      </div>
    </div>
  );
}

function Target(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>;
}
