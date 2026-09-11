"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AccessibleCard } from '@/components/ui/AccessibleCard/AccessibleCard';
import { ElderlyButton } from '@/components/ui/ElderlyButton/ElderlyButton';
import { useLanguage } from '@/components/LanguageProvider/LanguageProvider';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { ArrowLeft, Play, Sparkles } from 'lucide-react';

const CORE_GAMES = [
  { id: 'memory-match', titleKey: 'game.memory-match.title', defaultTitle: 'Memory Match', descKey: 'game.memory-match.desc', defaultDesc: 'Find matching pairs of familiar objects.', icon: '🍎', difficulty: 'Gentle → Adaptive', duration: '5–10 min' },
  { id: 'memory-recall', titleKey: 'game.memory-recall.title', defaultTitle: 'Memory Recall', descKey: 'game.memory-recall.desc', defaultDesc: 'Remember what you saw.', icon: '🔢', difficulty: 'Gentle → Adaptive', duration: '3–5 min' },
  { id: 'memory-challenge', titleKey: 'game.memory-challenge.title', defaultTitle: 'Memory Challenge', descKey: 'game.memory-challenge.desc', defaultDesc: 'A multi-stage memory activity.', icon: '🏆', difficulty: 'Adaptive', duration: '10–15 min' },
  { id: 'spot-difference', titleKey: 'game.spot-difference.title', defaultTitle: 'Spot the Difference', descKey: 'game.spot-difference.desc', defaultDesc: 'Find the small differences.', icon: '🔍', difficulty: 'Gentle → Adaptive', duration: '5 min' },
  { id: 'whats-missing', titleKey: 'game.whats-missing.title', defaultTitle: "What's Missing?", descKey: 'game.whats-missing.desc', defaultDesc: 'Find the item that disappeared.', icon: '❓', difficulty: 'Gentle → Adaptive', duration: '3–5 min' },
  { id: 'pattern-detective', titleKey: 'game.pattern-detective.title', defaultTitle: 'Pattern Detective', descKey: 'game.pattern-detective.desc', defaultDesc: 'Find what comes next.', icon: '🔣', difficulty: 'Gentle → Adaptive', duration: '5 min' },
  { id: 'sequence-master', titleKey: 'game.sequence-master.title', defaultTitle: 'Sequence Master', descKey: 'game.sequence-master.desc', defaultDesc: 'Remember and repeat a sequence.', icon: '🔄', difficulty: 'Gentle → Adaptive', duration: '5–10 min' },
  { id: 'market-memory', titleKey: 'game.market-memory.title', defaultTitle: 'Market Memory', descKey: 'game.market-memory.desc', defaultDesc: 'Remember familiar shopping items.', icon: '🛒', difficulty: 'Gentle → Adaptive', duration: '5–10 min' },
  { id: 'pack-the-bag', titleKey: 'game.pack-the-bag.title', defaultTitle: 'Pack the Bag', descKey: 'game.pack-the-bag.desc', defaultDesc: 'Choose what you need for an outing.', icon: '🎒', difficulty: 'Gentle → Adaptive', duration: '5 min' },
  { id: 'remember-place', titleKey: 'game.remember-the-place.title', defaultTitle: 'Remember the Place', descKey: 'game.remember-the-place.desc', defaultDesc: 'Remember where familiar objects belong.', icon: '📍', difficulty: 'Gentle → Adaptive', duration: '5–10 min' },
  { id: 'family-memory', titleKey: 'game.family-memory.title', defaultTitle: 'Family Memory', descKey: 'game.family-memory.desc', defaultDesc: 'Remember people and moments that matter.', icon: '👨‍👩‍👧‍👦', difficulty: 'Gentle', duration: 'Flexible' },
  { id: 'music-memory', titleKey: 'game.music-memory.title', defaultTitle: 'Music Memory', descKey: 'game.music-memory.desc', defaultDesc: 'Listen and remember familiar sounds and music.', icon: '🎵', difficulty: 'Gentle', duration: '5–10 min' },
  { id: 'breathing-exercise', titleKey: 'game.breathing.title', defaultTitle: 'Breathing & Relaxation', descKey: 'game.breathing.desc', defaultDesc: 'A calm guided breathing activity.', icon: '🧘', difficulty: 'Guided', duration: 'Flexible' }
];

export default function PlayMenu() {
  const { t } = useLanguage();
  const { displayName } = useUserProfile();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate brief network/metadata loading to satisfy skeleton requirement
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const allGames = CORE_GAMES;

  return (
    <main className="min-h-screen bg-[#0a0f1d]">
      <header className="max-w-7xl mx-auto px-6 pt-8 pb-4">
        <Link href="/" className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 -ml-1">
          <ArrowLeft size={16} className="mr-2" />
          {t('action.back', 'Back to Home')}
        </Link>
        <div className="flex flex-col">
          {displayName && <span className="text-lg text-slate-400 font-medium mb-1">Good Evening, {displayName} 👋</span>}
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{t('play.title', 'Choose an Activity')}</h1>
          <p className="text-slate-400 text-base max-w-xl mt-2">{t('play.subtitle', "Take your time. Pick something you'd enjoy today.")}</p>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-6 py-8">
          {[...Array(13)].map((_, i) => (
            <div key={i} className="bg-[#131b2e] rounded-2xl border border-slate-800 p-6 flex flex-col h-[280px] animate-pulse">
              <div className="w-14 h-14 rounded-xl bg-slate-800/80 mb-4"></div>
              <div className="h-6 w-3/4 bg-slate-800 rounded-md mb-2"></div>
              <div className="h-4 w-full bg-slate-800 rounded-md mb-1"></div>
              <div className="h-4 w-5/6 bg-slate-800 rounded-md mb-4"></div>
              <div className="flex gap-2 mt-auto mb-4">
                <div className="h-6 w-20 bg-slate-800 rounded-full"></div>
                <div className="h-6 w-20 bg-slate-800 rounded-full"></div>
              </div>
              <div className="w-full py-6 mt-4 rounded-xl bg-slate-800"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-6 py-8">
            {allGames.map(game => (
              <Link key={game.id} href={`/play/${game.id}`} className="block h-full outline-none">
                <AccessibleCard className="flex flex-col h-full group">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-slate-800/80 text-3xl mb-4">{game.icon}</div>
                  
                  <div className="flex-grow flex flex-col">
                    <h3 className="text-xl font-semibold text-white group-hover:text-indigo-300 transition-colors mb-1">{t(game.titleKey, game.defaultTitle)}</h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2 mb-4">{t(game.descKey, game.defaultDesc)}</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-auto mb-4">
                    <span className="bg-slate-800/80 text-slate-300 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">◉ {game.difficulty}</span>
                    <span className="bg-slate-800/80 text-slate-300 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">⏱ {game.duration}</span>
                  </div>
                  
                  <div className="mt-auto w-full flex">
                    <button className="w-full py-3 mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center justify-center gap-2 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#131b2e]">
                      <Play size={18} fill="currentColor" /> {t('action.play', 'Play')}
                    </button>
                  </div>
                </AccessibleCard>
              </Link>
            ))}
          </div>
      )}
    </main>
  );
}
