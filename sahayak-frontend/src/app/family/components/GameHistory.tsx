import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { Filter, History } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

export default function GameHistory({ patientId }: { patientId: string }) {
  const { profile } = useUserProfile();
  const { t } = useTranslation(profile?.languagePreference);
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!patientId) return;
    apiClient(`/api/family/games?patientId=${patientId}&filter=${filter}&limit=10`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setHistory(d.data);
      });
  }, [patientId, filter]);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 text-white mt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <History className="text-green-400" />
          Game History
        </h2>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Filter size={16} className="opacity-70" />
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="bg-black/30 border border-white/20 rounded-md p-1.5 text-sm text-white outline-none"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>
      
      {history.length === 0 ? (
        <p className="text-white/70">No games found for this period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-xs uppercase bg-black/20 text-white/70">
              <tr>
                <th className="px-4 py-3 rounded-tl-md">Game</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Accuracy</th>
                <th className="px-4 py-3">Diff.</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3 rounded-tr-md">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((s, idx) => (
                <tr key={idx} className="border-b border-white/10 hover:bg-white/5 transition cursor-pointer">
                  <td className="px-4 py-3 font-medium">{s.game.name}</td>
                  <td className="px-4 py-3">{new Date(s.createdAt).toLocaleDateString()} {new Date(s.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                  <td className="px-4 py-3">{s.score}</td>
                  <td className="px-4 py-3">{s.accuracy != null ? `${s.accuracy}%` : '-'}</td>
                  <td className="px-4 py-3">{s.difficulty}</td>
                  <td className="px-4 py-3">{s.durationSeconds ? `${Math.floor(s.durationSeconds/60)}m ${s.durationSeconds%60}s` : '-'}</td>
                  <td className={`px-4 py-3 ${s.completed ? 'text-green-400' : 'text-orange-400'}`}>
                    {s.completed ? 'Completed' : 'Incomplete'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
