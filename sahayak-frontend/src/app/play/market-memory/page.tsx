'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import { GameButton } from '@/components/ui/GameComponents/GameButton';
import { useGameEngine } from '@/lib/gameEngine';
import { isChallengeNovel, recordChallengeUsage } from '@/lib/noveltyEngine';
import { ElderlyButton } from '@/components/ui/ElderlyButton/ElderlyButton';

type MarketItem = { id: string; icon: string; name: string };

const ALL_MARKET_ITEMS: MarketItem[] = [
  { id: 'apple', icon: '🍎', name: 'Apple' },
  { id: 'banana', icon: '🍌', name: 'Banana' },
  { id: 'bread', icon: '🍞', name: 'Bread' },
  { id: 'milk', icon: '🥛', name: 'Milk' },
  { id: 'egg', icon: '🥚', name: 'Eggs' },
  { id: 'cheese', icon: '🧀', name: 'Cheese' },
  { id: 'carrot', icon: '🥕', name: 'Carrot' },
  { id: 'broccoli', icon: '🥦', name: 'Broccoli' },
  { id: 'tomato', icon: '🍅', name: 'Tomato' },
  { id: 'potato', icon: '🥔', name: 'Potato' },
  { id: 'onion', icon: '🧅', name: 'Onion' },
  { id: 'garlic', icon: '🧄', name: 'Garlic' },
  { id: 'meat', icon: '🥩', name: 'Meat' },
  { id: 'chicken', icon: '🍗', name: 'Chicken' },
  { id: 'fish', icon: '🐟', name: 'Fish' },
  { id: 'butter', icon: '🧈', name: 'Butter' },
  { id: 'juice', icon: '🧃', name: 'Juice' },
  { id: 'water', icon: '💧', name: 'Water' },
  { id: 'coffee', icon: '☕', name: 'Coffee' },
  { id: 'tea', icon: '🍵', name: 'Tea' },
  { id: 'soap', icon: '🧼', name: 'Soap' },
  { id: 'tissue', icon: '🧻', name: 'Tissue' }
];

export default function MarketMemoryPage() {
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
    gameId: 'market-memory',
    difficultyConfig: { scoreThreshold: 50, maxLevel: 5 }
  });
  
  const [gameState, setGameState] = useState<'LOADING' | 'SHOWING' | 'HIDDEN' | 'RECALL' | 'GAMEOVER'>('LOADING');
  const [shoppingList, setShoppingList] = useState<MarketItem[]>([]);
  const [options, setOptions] = useState<MarketItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    generateAndStart();
    startGame();
  }, [level]);

  const generateAndStart = async () => {
    setGameState('LOADING');
    setFeedback('');
    setSelectedItems([]);
    
    // Level 1: 3 items, Level 5: 7 items
    const itemCount = 2 + level; 
    
    let selectedItemsList: MarketItem[] = [];
    let optionsList: MarketItem[] = [];
    let novel = false;
    let fallbackTries = 0;
    
    while (!novel && fallbackTries < 5) {
      const shuffled = [...ALL_MARKET_ITEMS].sort(() => 0.5 - /* eslint-disable-next-line react-hooks/purity */ Math.random());
      selectedItemsList = shuffled.slice(0, itemCount);
      
      const unselected = shuffled.slice(itemCount);
      const distractors = unselected.slice(0, Math.max(3, itemCount));
      
      optionsList = [...selectedItemsList, ...distractors].sort(() => 0.5 - /* eslint-disable-next-line react-hooks/purity */ Math.random());
      
      const fingerprint = selectedItemsList.map(i => i.id).sort().join('-');
      novel = await isChallengeNovel(fingerprint, { userId: 'current_user', gameId: 'market-memory', level });
      fallbackTries++;
    }
    
    await recordChallengeUsage(selectedItemsList.map(i => i.id).sort().join('-'), { userId: 'current_user', gameId: 'market-memory', level });

    setShoppingList(selectedItemsList);
    setOptions(optionsList);
    setGameState('SHOWING');
    
    const displayTime = gentleMode ? 5000 + (itemCount * 1500) : 3000 + (itemCount * 1000);
    
    setTimeout(() => {
      setGameState('HIDDEN');
      setTimeout(() => {
        setGameState('RECALL');
      }, 1000);
    }, displayTime);
  };

  const handleItemSelect = (item: MarketItem) => {
    if (gameState !== 'RECALL' || isPaused || feedback) return;
    
    if (selectedItems.includes(item.id)) {
      setSelectedItems(selectedItems.filter(id => id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item.id]);
    }
  };

  const handleSubmit = () => {
    if (gameState !== 'RECALL' || isPaused) return;
    incrementAttempts();
    
    const requiredIds = shoppingList.map(item => item.id).sort();
    const chosenIds = [...selectedItems].sort();
    
    const isCorrect = JSON.stringify(requiredIds) === JSON.stringify(chosenIds);
    
    if (isCorrect) {
      endGame(true, 15 * level);
      setFeedback('Great memory! Basket is perfect.');
      setTimeout(() => {
        generateAndStart();
      }, 2000);
    } else {
      setFeedback('Good try, but that\'s not quite right.');
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
    const unselectedCorrect = shoppingList.find(item => !selectedItems.includes(item.id));
    if (unselectedCorrect) {
      setSelectedItems(prev => [...prev, unselectedCorrect.id]);
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
      <GameContainer title="Market Memory" score={score} attempts={attempts} hintsUsed={hintsUsed} onExit={handleExit}>
        <GameResult 
          title="Super Shopper!"
          subtitle="You remembered all your groceries."
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
      title="Market Memory"
      instructions={`Memorize the list • Level ${level}`}
      score={score}
      attempts={attempts}
      hintsUsed={hintsUsed}
      isPaused={isPaused}
      gentleMode={gentleMode}
      onToggleGentleMode={() => setGentleMode(!gentleMode)}
      onPause={pauseGame}
      onResume={resumeGame}
      onHint={gameState === 'RECALL' ? handleHint : undefined}
      onExit={handleExit}
    >
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <ElderlyButton variant="secondary" onClick={handleFinishSession}>
          🏁 Finish Session
        </ElderlyButton>
      </div>

      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        {gameState === 'LOADING' && <h3>Writing shopping list...</h3>}
        
        {gameState === 'SHOWING' && (
          <div>
            <h3 style={{ marginBottom: '2rem' }}>Memorize this Shopping List:</h3>
            <ul style={{ 
              listStyle: 'none', 
              padding: '2rem', 
              background: '#fef3c7', 
              color: '#92400e',
              maxWidth: '350px',
              margin: '0 auto',
              borderRadius: '8px',
              boxShadow: '2px 4px 10px rgba(0,0,0,0.1)',
              fontFamily: '"Comic Sans MS", cursive, sans-serif'
            }}>
              {shoppingList.map(item => (
                <li key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px dashed #d97706', paddingBottom: '0.5rem' }}>
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {gameState === 'HIDDEN' && <h3>Walking to the store...</h3>}

        {gameState === 'RECALL' && (
          <div>
            <h3>What was on the list?</h3>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Select {shoppingList.length} items to fill your basket.</p>
            
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
                    background: selectedItems.includes(item.id) ? '#a855f7' : 'var(--card-bg, #1e293b)',
                    border: `2px solid ${selectedItems.includes(item.id) ? '#9333ea' : 'var(--border-color, #334155)'}`,
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedItems.includes(item.id) ? '0 0 15px rgba(168, 85, 247, 0.4)' : 'none',
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
                 🛒 Check Basket ({selectedItems.length}/{shoppingList.length})
               </GameButton>
            </div>
          </div>
        )}

        {feedback && (
          <div style={{ margin: '2rem 0', fontSize: '1.25rem', color: feedback.includes('Great') ? '#4ade80' : '#fbbf24' }}>
            {feedback}
          </div>
        )}
      </div>
    </GameContainer>
  );
}
