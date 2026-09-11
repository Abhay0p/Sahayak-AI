'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import { GameButton } from '@/components/ui/GameComponents/GameButton';
import { useGameEngine } from '@/lib/gameEngine';
import { isChallengeNovel, recordChallengeUsage } from '@/lib/noveltyEngine';
import { ElderlyButton } from '@/components/ui/ElderlyButton/ElderlyButton';

type BagItem = { id: string; icon: string; name: string };

const SCENARIOS = [
  {
    name: 'Going to the Beach',
    good: [
      { id: 'towel', icon: '🏖️', name: 'Towel' },
      { id: 'sunscreen', icon: '🧴', name: 'Sunscreen' },
      { id: 'sunglasses', icon: '🕶️', name: 'Sunglasses' },
      { id: 'swimsuit', icon: '🩱', name: 'Swimsuit' },
      { id: 'hat', icon: '👒', name: 'Sun Hat' },
      { id: 'water', icon: '💧', name: 'Water' },
    ],
    bad: [
      { id: 'scarf', icon: '🧣', name: 'Winter Scarf' },
      { id: 'laptop', icon: '💻', name: 'Laptop' },
      { id: 'tie', icon: '👔', name: 'Necktie' },
      { id: 'lamp', icon: '🛋️', name: 'Desk Lamp' },
      { id: 'gloves', icon: '🧤', name: 'Winter Gloves' },
      { id: 'pan', icon: '🍳', name: 'Frying Pan' },
    ]
  },
  {
    name: 'Going to the Doctor',
    good: [
      { id: 'idcard', icon: '🪪', name: 'ID Card' },
      { id: 'records', icon: '📁', name: 'Medical Records' },
      { id: 'glasses', icon: '👓', name: 'Reading Glasses' },
      { id: 'wallet', icon: '👛', name: 'Wallet' },
      { id: 'phone', icon: '📱', name: 'Phone' },
      { id: 'keys', icon: '🔑', name: 'Keys' },
    ],
    bad: [
      { id: 'swimsuit', icon: '🩱', name: 'Swimsuit' },
      { id: 'ball', icon: '⚽', name: 'Soccer Ball' },
      { id: 'spatula', icon: '🥄', name: 'Spatula' },
      { id: 'pillow', icon: '🛌', name: 'Pillow' },
      { id: 'guitar', icon: '🎸', name: 'Guitar' },
      { id: 'camera', icon: '📷', name: 'Camera' },
    ]
  },
  {
    name: 'Winter Walk',
    good: [
      { id: 'coat', icon: '🧥', name: 'Winter Coat' },
      { id: 'boots', icon: '👢', name: 'Snow Boots' },
      { id: 'gloves2', icon: '🧤', name: 'Gloves' },
      { id: 'beanie', icon: '🧢', name: 'Warm Hat' },
      { id: 'scarf2', icon: '🧣', name: 'Scarf' },
      { id: 'thermos', icon: '☕', name: 'Hot Tea' },
    ],
    bad: [
      { id: 'sandals', icon: '🩴', name: 'Sandals' },
      { id: 'shorts', icon: '🩳', name: 'Shorts' },
      { id: 'sunscreen2', icon: '🧴', name: 'Sunscreen' },
      { id: 'icecream', icon: '🍦', name: 'Ice Cream' },
      { id: 'swimsuit2', icon: '🩱', name: 'Swimsuit' },
      { id: 'towel2', icon: '🏖️', name: 'Beach Towel' },
    ]
  }
];

export default function PackTheBagPage() {
  const router = useRouter();
  
  const { 
    startGame, 
    endGame, 
    submitScore, 
    score, 
    level,
    gentleMode,
    setGentleMode,
    hintsUsed,
    useHint: consumeHint,
    attempts,
    incrementAttempts,
    isPaused,
    pauseGame,
    resumeGame
  } = useGameEngine({
    gameId: 'pack-the-bag',
    difficultyConfig: { scoreThreshold: 50, maxLevel: 5 }
  });
  
  const [gameState, setGameState] = useState<'LOADING' | 'PLAYING' | 'GAMEOVER'>('LOADING');
  const [scenarioName, setScenarioName] = useState('');
  const [options, setOptions] = useState<BagItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [targetGoodCount, setTargetGoodCount] = useState(0);
  const [correctIds, setCorrectIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    generateAndStart();
    startGame();
  }, [level]);

  const generateAndStart = async () => {
    setGameState('LOADING');
    setFeedback('');
    setSelectedItems([]);
    
    // Level 1: Find 2 items out of 4 options
    // Level 5: Find 5 items out of 10 options
    const goodToFind = Math.min(5, 1 + level);
    const totalOptions = goodToFind * 2;
    
    let scenario = SCENARIOS[0];
    let finalOptions: BagItem[] = [];
    let goodIds: string[] = [];
    
    let novel = false;
    let fallbackTries = 0;
    
    while (!novel && fallbackTries < 5) {
      scenario = SCENARIOS[Math.floor(/* eslint-disable-next-line react-hooks/purity */ Math.random() * SCENARIOS.length)];
      
      const goodPool = [...scenario.good].sort(() => 0.5 - /* eslint-disable-next-line react-hooks/purity */ Math.random());
      const badPool = [...scenario.bad].sort(() => 0.5 - /* eslint-disable-next-line react-hooks/purity */ Math.random());
      
      const selectedGood = goodPool.slice(0, goodToFind);
      const selectedBad = badPool.slice(0, totalOptions - goodToFind);
      
      finalOptions = [...selectedGood, ...selectedBad].sort(() => 0.5 - /* eslint-disable-next-line react-hooks/purity */ Math.random());
      goodIds = selectedGood.map(g => g.id);
      
      const fingerprint = scenario.name + '|' + finalOptions.map(o => o.id).sort().join('-');
      novel = await isChallengeNovel(fingerprint, { userId: 'current_user', gameId: 'pack-the-bag', level });
      fallbackTries++;
    }
    
    await recordChallengeUsage(scenario.name + '|' + finalOptions.map(o => o.id).sort().join('-'), { userId: 'current_user', gameId: 'pack-the-bag', level });

    setScenarioName(scenario.name);
    setTargetGoodCount(goodToFind);
    setCorrectIds(goodIds);
    setOptions(finalOptions);
    setGameState('PLAYING');
  };

  const handleItemSelect = (item: BagItem) => {
    if (gameState !== 'PLAYING' || isPaused || feedback) return;
    
    if (selectedItems.includes(item.id)) {
      setSelectedItems(selectedItems.filter(id => id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item.id]);
    }
  };

  const handleSubmit = () => {
    if (gameState !== 'PLAYING' || isPaused) return;
    incrementAttempts();
    
    const requiredIds = [...correctIds].sort();
    const chosenIds = [...selectedItems].sort();
    
    const isCorrect = JSON.stringify(requiredIds) === JSON.stringify(chosenIds);
    
    if (isCorrect) {
      endGame(true, 10 * level);
      setFeedback('Perfect! You are fully packed.');
      setTimeout(() => {
        generateAndStart();
      }, 2000);
    } else {
      setFeedback('Not quite. Are you sure you need all those?');
      if (!gentleMode && attempts > 1) {
        endGame(false, 0);
        setTimeout(() => generateAndStart(), 2000);
      } else {
        setTimeout(() => setFeedback(''), 1500);
      }
    }
  };

  const handleHint = () => {
    consumeHint();
    const unselectedCorrect = correctIds.find(id => !selectedItems.includes(id));
    if (unselectedCorrect) {
      setSelectedItems(prev => [...prev, unselectedCorrect]);
    }
  };

  const handleExit = async () => {
    await submitScore(score, 100);
    router.push('/play');
  };

  const handleFinishSession = async () => {
    setGameState('GAMEOVER');
    await submitScore(score, 100);
  };

  if (gameState === 'GAMEOVER') {
    return (
      <GameContainer title="Pack the Bag" score={score} attempts={attempts} hintsUsed={hintsUsed} onExit={handleExit}>
        <GameResult 
          title="Great Preparation!"
          subtitle="You picked the right items for every occasion."
          score={score}
          accuracy={100}
          onPlayAgain={() => {
            generateAndStart();
            startGame();
          }}
        />
      </GameContainer>
    );
  }

  return (
    <GameContainer
      title="Pack the Bag"
      instructions={`Prepare for the outing • Level ${level}`}
      score={score}
      attempts={attempts}
      hintsUsed={hintsUsed}
      isPaused={isPaused}
      gentleMode={gentleMode}
      onToggleGentleMode={() => setGentleMode(!gentleMode)}
      onPause={pauseGame}
      onResume={resumeGame}
      onHint={handleHint}
      onExit={handleExit}
    >
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <ElderlyButton variant="secondary" onClick={handleFinishSession}>
          🏁 Finish Session
        </ElderlyButton>
      </div>

      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        {gameState === 'LOADING' && <h3>Checking the itinerary...</h3>}

        {gameState === 'PLAYING' && (
          <div>
            <h2 style={{ fontSize: '2rem', color: '#a855f7', marginBottom: '0.5rem' }}>{scenarioName}</h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '1.2rem' }}>
              Select exactly <strong>{targetGoodCount}</strong> items you need.
            </p>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
              gap: '15px', 
              maxWidth: '700px', 
              margin: '0 auto 2rem auto' 
            }}>
              {options.map(item => (
                <button 
                  key={item.id}
                  onClick={() => handleItemSelect(item)}
                  disabled={isPaused}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    background: selectedItems.includes(item.id) ? '#3b82f6' : 'var(--card-bg, #1e293b)',
                    border: `2px solid ${selectedItems.includes(item.id) ? '#2563eb' : 'var(--border-color, #334155)'}`,
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedItems.includes(item.id) ? '0 0 15px rgba(59, 130, 246, 0.4)' : 'none',
                    transform: selectedItems.includes(item.id) ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{item.icon}</span>
                  <span style={{ fontWeight: '500' }}>{item.name}</span>
                </button>
              ))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
               <GameButton variant="primary" onClick={handleSubmit} disabled={selectedItems.length === 0 || isPaused}>
                 🎒 Pack Bag ({selectedItems.length}/{targetGoodCount})
               </GameButton>
            </div>
          </div>
        )}

        {feedback && (
          <div style={{ margin: '2rem 0', fontSize: '1.25rem', color: feedback.includes('Perfect') ? '#4ade80' : '#fbbf24' }}>
            {feedback}
          </div>
        )}
      </div>
    </GameContainer>
  );
}
