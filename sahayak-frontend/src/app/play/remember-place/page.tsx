'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import { useGameEngine } from '@/lib/gameEngine';
import { isChallengeNovel, recordChallengeUsage } from '@/lib/noveltyEngine';
import { ElderlyButton } from '@/components/ui/ElderlyButton/ElderlyButton';

const ITEMS = ['🍎', '🐶', '🚗', '🌻', '📚', '🎁', '🎈', '🍕', '🔑', '🧸'];

export default function RememberPlacePage() {
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
    gameId: 'remember-place',
    difficultyConfig: { scoreThreshold: 50, maxLevel: 5 }
  });
  
  const [gameState, setGameState] = useState<'LOADING' | 'SHOWING' | 'HIDDEN' | 'GUESSING' | 'GAMEOVER'>('LOADING');
  const [grid, setGrid] = useState<{ id: number; item: string | null }[]>([]);
  const [targetItem, setTargetItem] = useState<string>('');
  const [gridSize, setGridSize] = useState(2);
  const [feedback, setFeedback] = useState<string>('');
  const [revealedIndex, setRevealedIndex] = useState<number | null>(null);

  useEffect(() => {
    generateAndStart();
    startGame();
  }, [level]);

  const generateAndStart = async () => {
    setGameState('LOADING');
    setFeedback('');
    setRevealedIndex(null);
    
    // Level 1-2: 2x2, Level 3-4: 3x3, Level 5: 4x4
    let size = 2;
    if (level >= 3) size = 3;
    if (level >= 5) size = 4;
    
    setGridSize(size);
    const totalCells = size * size;
    
    // Number of items to place
    const numItems = Math.min(level, ITEMS.length);
    
    let selectedCells: number[] = [];
    let selectedItems: string[] = [];
    let target = '';
    let novel = false;
    let fallbackTries = 0;
    
    while (!novel && fallbackTries < 5) {
      // Pick random unique cells
      const cells = Array.from({ length: totalCells }, (_, i) => i).sort(() => 0.5 - /* eslint-disable-next-line react-hooks/purity */ Math.random());
      selectedCells = cells.slice(0, numItems);
      
      // Pick random unique items
      const items = [...ITEMS].sort(() => 0.5 - /* eslint-disable-next-line react-hooks/purity */ Math.random());
      selectedItems = items.slice(0, numItems);
      
      target = selectedItems[Math.floor(/* eslint-disable-next-line react-hooks/purity */ Math.random() * selectedItems.length)];
      
      const fingerprint = selectedCells.join(',') + '-' + selectedItems.join(',') + '-' + target;
      novel = await isChallengeNovel(fingerprint, { userId: 'current_user', gameId: 'remember-place', level });
      fallbackTries++;
    }
    
    const fingerprint = selectedCells.join(',') + '-' + selectedItems.join(',') + '-' + target;
    await recordChallengeUsage(fingerprint, { userId: 'current_user', gameId: 'remember-place', level });

    const newGrid = Array.from({ length: totalCells }).map((_, idx) => {
      const itemIndex = selectedCells.indexOf(idx);
      return {
        id: idx,
        item: itemIndex !== -1 ? selectedItems[itemIndex] : null
      };
    });
    
    setGrid(newGrid);
    setTargetItem(target);
    setGameState('SHOWING');
    
    const displayTime = gentleMode ? 3000 + (numItems * 1000) : 2000 + (numItems * 500);
    
    setTimeout(() => {
      setGameState('HIDDEN');
      setTimeout(() => {
        setGameState('GUESSING');
      }, 500);
    }, displayTime);
  };

  const handleCellClick = (index: number) => {
    if (gameState !== 'GUESSING' || isPaused || feedback) return;
    incrementAttempts();
    
    const clickedItem = grid[index].item;
    
    if (clickedItem === targetItem) {
      setRevealedIndex(index);
      endGame(true, 10 * level);
      setFeedback('You found it! Excellent memory.');
      
      setTimeout(() => {
        generateAndStart();
      }, 2000);
    } else {
      setRevealedIndex(index);
      setFeedback('Not quite there. Try again!');
      
      setTimeout(() => {
        setRevealedIndex(null);
        setFeedback('');
        if (!gentleMode && attempts > 1) {
          endGame(false, 0); 
          generateAndStart();
        }
      }, 1500);
    }
  };

  const handleHint = () => {
    consumeHint();
    // Temporarily reveal all items for 1 second
    setGameState('SHOWING');
    setTimeout(() => {
      setGameState('GUESSING');
    }, gentleMode ? 2000 : 1000);
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
      <GameContainer title="Remember the Place" score={score} attempts={attempts} hintsUsed={hintsUsed} onExit={handleExit}>
        <GameResult 
          title="Brilliant Spatial Memory!"
          subtitle="You remembered where everything belongs."
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
      title="Remember the Place"
      instructions={`Memorize the locations • Level ${level}`}
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
        {gameState === 'LOADING' && <h3>Setting up the grid...</h3>}
        {gameState === 'SHOWING' && <h3>Remember where the items are!</h3>}
        {gameState === 'HIDDEN' && <h3>Hiding...</h3>}
        {gameState === 'GUESSING' && (
          <h3>
            Where was the <span style={{ fontSize: '2rem' }}>{targetItem}</span>?
          </h3>
        )}
        
        {feedback && (
          <div style={{ margin: '1rem 0', fontSize: '1.25rem', color: feedback.includes('found it') ? '#4ade80' : '#fbbf24' }}>
            {feedback}
          </div>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap: gentleMode ? '15px' : '10px',
          maxWidth: gridSize === 2 ? '250px' : gridSize === 3 ? '350px' : '450px',
          margin: '2rem auto',
          width: '100%'
        }}>
          {grid.map(cell => (
            <button
              key={cell.id}
              onClick={() => handleCellClick(cell.id)}
              disabled={gameState !== 'GUESSING' || isPaused}
              style={{
                aspectRatio: '1/1',
                borderRadius: '12px',
                background: 'var(--card-bg, #1e293b)',
                border: '2px solid var(--border-color, #334155)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${Math.max(2, 5 - gridSize)}rem`,
                cursor: gameState === 'GUESSING' ? 'pointer' : 'default',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {(gameState === 'SHOWING' || revealedIndex === cell.id) ? cell.item : '?'}
            </button>
          ))}
        </div>
      </div>
    </GameContainer>
  );
}
