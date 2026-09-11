import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { Brain, Clock, Target, Hash } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

export default function CognitiveActivity({ patientId }: { patientId: string }) {
  const { profile } = useUserProfile();
  const { t } = useTranslation(profile?.languagePreference);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!patientId) return;
    apiClient(`/api/family/dashboard?elderlyId=${patientId}`)
      .then(d => {
        if (d.success) {
          const gameSessions = d.data.games?.sessions || [];
          setSessions(gameSessions.slice(0, 3));
        }
      });
  }, [patientId]);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 text-white">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Brain className="text-blue-400" />
        Cognitive Activity
      </h2>
      
      {sessions.length === 0 ? (
        <p className="text-white/70">No recent cognitive activity found.</p>
      ) : (
        <div className="space-y-4">
          {sessions.map((s, idx) => (
            <div key={idx} className="bg-black/20 rounded-md p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h4 className="font-semibold text-lg">{s.game.name}</h4>
                <p className="text-sm opacity-80">{new Date(s.createdAt).toLocaleString()}</p>
              </div>
              
              <div className="flex gap-4 mt-3 md:mt-0 opacity-90 text-sm">
                <div className="flex flex-col items-center">
                  <span className="text-xs uppercase opacity-70">Score</span>
                  <span className="font-medium text-lg">{s.score}</span>
                </div>
                {s.accuracy != null && (
                  <div className="flex flex-col items-center">
                    <span className="text-xs uppercase opacity-70">Accuracy</span>
                    <span className="font-medium text-lg">{s.accuracy}%</span>
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <span className="text-xs uppercase opacity-70">Difficulty</span>
                  <span className="font-medium text-lg">Lvl {s.difficulty}</span>
                </div>
                {s.durationSeconds && (
                  <div className="flex flex-col items-center">
                    <span className="text-xs uppercase opacity-70">Time</span>
                    <span className="font-medium text-lg">{Math.floor(s.durationSeconds / 60)}m {s.durationSeconds % 60}s</span>
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <span className="text-xs uppercase opacity-70">Status</span>
                  <span className="font-medium text-green-400">{s.completed ? 'Completed' : 'Incomplete'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
