'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import { GameButton } from '@/components/ui/GameComponents/GameButton';
import { useGameEngine } from '@/lib/gameEngine';
import { isChallengeNovel, recordChallengeUsage } from '@/lib/noveltyEngine';
import { ElderlyButton } from '@/components/ui/ElderlyButton/ElderlyButton';

const ALL_ITEMS = ['🍎', '🍌', '🚗', '🐶', '⚽', '🎸', '🌻', '🎁', '🎈', '📚', '🍕', '🔑', '🧸', '📱', '📸', '☕'];

export default function WhatsMissingPage() {
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
    gameId: 'whats-missing',
    difficultyConfig: { scoreThreshold: 50, maxLevel: 5 }
  });
  
  const [gameState, setGameState] = useState<'LOADING' | 'SHOWING' | 'HIDDEN' | 'GUESSING' | 'GAMEOVER'>('LOADING');
  const [items, setItems] = useState<string[]>([]);
  const [missingItem, setMissingItem] = useState<string>('');
  const [options, setOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    generateAndStart();
    startGame();
  }, [level]);

  const generateAndStart = async () => {
    setGameState('LOADING');
    
    // Level 1: 3 items, Level 5: 7 items
    const itemCount = 2 + level; 
    
    let selectedItems: string[] = [];
    let target = '';
    let novel = false;
    let fallbackTries = 0;
    
    while (!novel && fallbackTries < 5) {
      const shuffled = [...ALL_ITEMS].sort(() => 0.5 - /* eslint-disable-next-line react-hooks/purity */ Math.random());
      selectedItems = shuffled.slice(0, itemCount);
      target = selectedItems[Math.floor(/* eslint-disable-next-line react-hooks/purity */ Math.random() * selectedItems.length)];
      
      const fingerprint = selectedItems.join('') + '-' + target;
      novel = await isChallengeNovel(fingerprint, { userId: 'current_user', gameId: 'whats-missing', level });
      fallbackTries++;
    }
    
    const fingerprint = selectedItems.join('') + '-' + target;
    await recordChallengeUsage(fingerprint, { userId: 'current_user', gameId: 'whats-missing', level });

    setItems(selectedItems);
    setMissingItem(target);
    
    const availableOthers = ALL_ITEMS.filter(item => !selectedItems.includes(item));
    const randomOthers = availableOthers.sort(() => 0.5 - /* eslint-disable-next-line react-hooks/purity */ Math.random()).slice(0, 3);
    const guessOptions = [target, ...randomOthers].sort(() => 0.5 - /* eslint-disable-next-line react-hooks/purity */ Math.random());
    
    setOptions(guessOptions);
    setGameState('SHOWING');
    
    const displayTime = gentleMode ? 4000 + (itemCount * 800) : 2000 + (itemCount * 500);
    
    setTimeout(() => {
      setGameState('HIDDEN');
      setTimeout(() => {
        setGameState('GUESSING');
      }, 1000);
    }, displayTime);
  };

  const handleGuess = (item: string) => {
    if (gameState !== 'GUESSING' || isPaused || feedback) return;
    incrementAttempts();
    
    if (item === missingItem) {
      endGame(true, 10 * level);
      setFeedback('Correct! Get ready for the next one...');
      
      setTimeout(() => {
        setFeedback('');
        generateAndStart();
      }, 2000);
    } else {
      setFeedback('Good try! That wasn\'t it.');
      if (!gentleMode && attempts > 1) {
        endGame(false, 0); 
        setTimeout(() => {
            setFeedback('');
            generateAndStart();
        }, 2000);
      } else {
        setTimeout(() => setFeedback(''), 1500);
      }
    }
  };

  const handleHint = () => {
    consumeHint();
    const incorrect = options.filter(opt => opt !== missingItem);
    if (incorrect.length > 0) {
      const toRemove = incorrect[0];
      setOptions(prev => prev.filter(opt => opt !== toRemove));
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
      <GameContainer title="What's Missing?" score={score} attempts={attempts} hintsUsed={hintsUsed} onExit={handleExit}>
        <GameResult 
          title="Great Job!"
          subtitle="You have a keen eye for what's missing."
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
      title="What's Missing?"
      instructions={`Identify the missing item • Level ${level}`}
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

      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        {gameState === 'LOADING' && <h3>Preparing...</h3>}
        
        {gameState === 'SHOWING' && !isPaused && (
          <div>
            <h3>Memorize these items:</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '2rem' }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ fontSize: '4rem' }}>{item}</div>
              ))}
            </div>
          </div>
        )}

        {gameState === 'HIDDEN' && !isPaused && (
          <div>
            <h3>Closing eyes...</h3>
          </div>
        )}

        {gameState === 'GUESSING' && !isPaused && (
          <div>
            <h3>What's missing?</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '2rem', marginBottom: '2rem' }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ fontSize: '4rem', opacity: item === missingItem ? 0 : 1 }}>
                  {item === missingItem ? '❓' : item}
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
              {options.map((opt, idx) => (
                <GameButton key={idx} variant="secondary" onClick={() => handleGuess(opt)} style={{ fontSize: '2rem', padding: '1rem 2rem' }}>
                  {opt}
                </GameButton>
              ))}
            </div>
          </div>
        )}

        {feedback && !isPaused && (
          <div style={{ marginTop: '2rem', fontSize: '1.25rem', color: feedback.includes('Correct') ? '#4ade80' : '#fbbf24' }}>
            {feedback}
          </div>
        )}
      </div>
    </GameContainer>
  );
}
