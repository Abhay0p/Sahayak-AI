import React from 'react';
import { Phone, MessageCircle, Mic, Heart, Calendar } from 'lucide-react';
import SummaryCard from '@/app/family/components/SummaryCard';

interface QuickActionsProps {
  onCallClick?: () => void;
}

export default function QuickActions({ onCallClick }: QuickActionsProps) {
  const actions = [
    { id: 'call', icon: <Phone size={20} />, label: 'Call', color: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' },
    { id: 'message', icon: <MessageCircle size={20} />, label: 'Message', color: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' },
    { id: 'voicemessage', icon: <Mic size={20} />, label: 'Voice Message', color: 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' },
    { id: 'memory', icon: <Heart size={20} />, label: 'Add Memory', color: 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30' },
    { id: 'schedule', icon: <Calendar size={20} />, label: 'Schedule', color: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' }
  ];

  const handleActionClick = (id: string) => {
    if (id === 'call' && onCallClick) {
      onCallClick();
    }
  };

  return (
    <SummaryCard icon={<Phone size={20} className="text-emerald-400" />} title="Quick Actions" className="mb-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => handleActionClick(action.id)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition ${action.color}`}
          >
            <div className="mb-2">{action.icon}</div>
            <span className="text-xs font-medium text-white">{action.label}</span>
          </button>
        ))}
      </div>
    </SummaryCard>
  );
}
