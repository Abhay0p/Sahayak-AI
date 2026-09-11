import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { Gamepad2, CheckCircle, Clock } from 'lucide-react';
import { formatGameName, formatDifficulty, formatDuration, formatDateFriendly } from '@/lib/formatting';
import SummaryCard from '@/app/family/components/SummaryCard';
import { apiClient } from '@/lib/apiClient';

export default function RecentGames({ patientId }: { patientId: string }) {
  const { profile } = useUserProfile();
  const { t } = useTranslation(profile?.languagePreference);
  const [games, setGames] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    apiClient(`/api/family/dashboard?elderlyId=${patientId}`)
      .then(d => {
        if (d.success) {
          const gameSessions = d.data.games?.sessions || [];
          setGames(gameSessions.slice(0, 5));
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [patientId]);

  return (
    <SummaryCard icon={<Gamepad2 className="text-indigo-400" />} title="Recent Games" className="mb-4">
      {isLoading ? (
        <p className="text-white/70">Loading recent games...</p>
      ) : games.length === 0 ? (
        <div className="bg-black/20 p-8 rounded-lg text-center border border-white/10 mt-4">
          <Gamepad2 className="mx-auto text-white/40 mb-3" size={32} />
          <p className="text-white/70">No cognitive activities recorded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {games.map((s, idx) => (
            <div key={s.id || idx} className="bg-white/10 border border-white/20 rounded-lg p-5 flex flex-col justify-between hover:bg-white/15 transition relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-white/5 rounded-bl-[100px] -z-10 group-hover:to-white/10 transition-all" />
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <Gamepad2 size={18} className="text-indigo-400" />
                    {formatGameName(s.game.name)}
                  </h4>
                  <p className="text-xs opacity-70 flex items-center gap-1 mt-1">
                    <Clock size={12} />
                    {formatDateFriendly(s.createdAt, profile?.timezone)}
                  </p>
                </div>
                {s.completed ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-md">
                    <CheckCircle size={14} /> Completed
                  </span>
                ) : (
                  <span className="text-xs font-medium text-orange-400 bg-orange-400/10 px-2 py-1 rounded-md">Incomplete</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="bg-black/20 p-2 rounded-md">
                  <span className="block text-[10px] uppercase opacity-60 tracking-wider mb-1">Score</span>
                  <span className="font-semibold text-sm">{s.score} / 100</span>
                </div>
                {s.accuracy != null && (
                  <div className="bg-black/20 p-2 rounded-md">
                    <span className="block text-[10px] uppercase opacity-60 tracking-wider mb-1">Accuracy</span>
                    <span className="font-semibold text-sm">{s.accuracy}%</span>
                  </div>
                )}
                <div className="bg-black/20 p-2 rounded-md">
                  <span className="block text-[10px] uppercase opacity-60 tracking-wider mb-1">Difficulty</span>
                  <span className="font-semibold text-sm">{formatDifficulty(s.difficulty)}</span>
                </div>
                {s.durationSeconds != null && (
                  <div className="bg-black/20 p-2 rounded-md">
                    <span className="block text-[10px] uppercase opacity-60 tracking-wider mb-1">Time</span>
                    <span className="font-semibold text-sm">{formatDuration(s.durationSeconds)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SummaryCard>
  );
}
