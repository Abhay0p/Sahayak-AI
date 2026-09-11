import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { Heart, Plus, Edit3, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import SummaryCard from '@/app/family/components/SummaryCard';

export default function FamilyMemories({ patientId }: { patientId: string }) {
  const { profile } = useUserProfile();
  const { t } = useTranslation(profile?.languagePreference);
  const [memories, setMemories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    apiClient(`/api/family/dashboard?elderlyId=${patientId}`)
      .then(d => {
        if (d.success && d.data.memories) {
          setMemories(d.data.memories);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [patientId]);

  return (
    <SummaryCard icon={<Heart className="text-pink-400" />} title="Family Memories" className="mb-4">
      {isLoading ? (
        <p className="text-white/70">Loading memories...</p>
      ) : memories.length === 0 ? (
        <div className="text-center p-6 bg-black/20 rounded-lg">
          <ImageIcon className="mx-auto opacity-40 mb-2" size={32} />
          <p className="text-white/70">No memories added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {memories.map(memory => (
            <div key={memory.id} className="bg-black/20 p-4 rounded-lg relative group">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                <button className="text-white/60 hover:text-white bg-black/40 p-1.5 rounded-md">
                  <Edit3 size={14} />
                </button>
              </div>
              <p className="italic text-lg mb-2">\"{memory.title}\"</p>
              <p className="text-sm text-pink-300 font-medium">— {memory.uploader?.firstName} {memory.uploader?.lastName}</p>
            </div>
          ))}
        </div>
      )}
    </SummaryCard>
  );
}
