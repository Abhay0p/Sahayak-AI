import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { Brain, Droplets, Utensils, Pill } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

export default function DailySummary({ patientId }: { patientId: string }) {
  const { profile } = useUserProfile();
  const { t } = useTranslation(profile?.languagePreference);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!patientId) return;
    apiClient(`/api/family/dashboard?elderlyId=${patientId}`)
      .then(d => {
        if (d.success) {
          const { games, reminders } = d.data;
          setStats({
            gamesPlayed: games.today,
            hydration: { completed: reminders.hydration.acknowledged, total: reminders.hydration.total },
            meals: { completed: reminders.meal.acknowledged, total: reminders.meal.total },
            medicine: { completed: reminders.medicine.acknowledged, total: reminders.medicine.total }
          });
        }
      });
  }, [patientId]);

  if (!stats) return null;

  return (
    <div className="mt-6 mb-8">
      <h3 className="text-sm font-semibold uppercase tracking-wider opacity-70 mb-4 text-white">Today at a glance</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex items-center md:items-start flex-col md:flex-row gap-3">
          <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400">
            <Brain size={24} />
          </div>
          <div className="text-center md:text-left">
            <span className="block text-2xl font-bold text-white">{stats.gamesPlayed}</span>
            <span className="text-xs text-white/70 font-medium">Activities</span>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex items-center md:items-start flex-col md:flex-row gap-3">
          <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
            <Droplets size={24} />
          </div>
          <div className="text-center md:text-left">
            <span className="block text-2xl font-bold text-white">{stats.hydration.completed}/{stats.hydration.total}</span>
            <span className="text-xs text-white/70 font-medium">Hydration</span>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex items-center md:items-start flex-col md:flex-row gap-3">
          <div className="p-3 bg-orange-500/20 rounded-lg text-orange-400">
            <Utensils size={24} />
          </div>
          <div className="text-center md:text-left">
            <span className="block text-2xl font-bold text-white">{stats.meals.completed}/{stats.meals.total}</span>
            <span className="text-xs text-white/70 font-medium">Meals</span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex items-center md:items-start flex-col md:flex-row gap-3">
          <div className="p-3 bg-rose-500/20 rounded-lg text-rose-400">
            <Pill size={24} />
          </div>
          <div className="text-center md:text-left">
            <span className="block text-2xl font-bold text-white">{stats.medicine.completed}/{stats.medicine.total}</span>
            <span className="text-xs text-white/70 font-medium">Medicine</span>
          </div>
        </div>

      </div>
    </div>
  );
}
