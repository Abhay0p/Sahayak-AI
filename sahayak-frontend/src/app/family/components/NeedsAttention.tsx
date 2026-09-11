import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import SummaryCard from './SummaryCard';
import { apiClient } from '@/lib/apiClient';

export default function NeedsAttention({ patientId }: { patientId: string }) {
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

  const attentionItems = data.attentionItems || [];

  return (
    <SummaryCard
      icon={<AlertCircle size={24} />}
      title={t('needs_attention')}
      value={attentionItems.length}
    >
      {attentionItems.slice(0, 4).map((item: any, idx: number) => (
        <div key={idx} className="mb-2">
          <p className="text-white/90 text-sm font-medium">{item.title}</p>
          <p className="text-white/60 text-xs">{item.detail}</p>
        </div>
      ))}
    </SummaryCard>
  );
}
