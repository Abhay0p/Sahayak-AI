"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import { GameButton } from '@/components/ui/GameComponents/GameButton';
import { ElderlyButton } from '@/components/ui/ElderlyButton/ElderlyButton';
import { useGameEngine } from '@/lib/gameEngine';
import { isChallengeNovel, recordChallengeUsage } from '@/lib/noveltyEngine';

const PAIRS = [
  { defaultEmoji: '🍎', oddEmoji: '🍅' },
  { defaultEmoji: '🐶', oddEmoji: '🐺' },
  { defaultEmoji: '😊', oddEmoji: '🙂' },
  { defaultEmoji: '🌻', oddEmoji: '🌼' },
  { defaultEmoji: '🚗', oddEmoji: '🚙' },
  { defaultEmoji: '🍓', oddEmoji: '🍒' },
  { defaultEmoji: '🌞', oddEmoji: '🌝' },
  { defaultEmoji: '🌳', oddEmoji: '🌲' },
  { defaultEmoji: '📘', oddEmoji: '📗' },
  { defaultEmoji: '🏠', oddEmoji: '🏡' }
];

export default function SpotDifferenceGame() {
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
    gameId: 'spot-difference',
    difficultyConfig: { scoreThreshold: 50, maxLevel: 5 }
  });

  const [grid, setGrid] = useState<{ id: number; isOdd: boolean; emoji: string }[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameState, setGameState] = useState<'LOADING' | 'PLAYING' | 'GAMEOVER'>('PLAYING');
  const [gridSize, setGridSize] = useState(2);

  useEffect(() => {
    generateGrid();
    startGame();
  }, [level]);

  const generateGrid = async () => {
    setGameState('LOADING');
    // Level 1 = 2x2, Level 5 = 6x6
    const size = gentleMode ? Math.min(4, level + 1) : level + 1;
    setGridSize(size);
    const totalCells = size * size;
    
    let pair = PAIRS[0];
    let oddIndex = 0;
    let novel = false;
    let fallbackTries = 0;
    let fingerprint = '';

    while (!novel && fallbackTries < 10) {
      const pairIndex = Math.floor(/* eslint-disable-next-line react-hooks/purity */ Math.random() * PAIRS.length);
      pair = PAIRS[pairIndex];
      oddIndex = Math.floor(/* eslint-disable-next-line react-hooks/purity */ Math.random() * totalCells);
      
      fingerprint = `${pair.defaultEmoji}-${pair.oddEmoji}-${oddIndex}-${size}`;
      novel = await isChallengeNovel(fingerprint, { userId: 'current_user', gameId: 'spot-difference', level });
      fallbackTries++;
    }

    if (fingerprint) {
      await recordChallengeUsage(fingerprint, { userId: 'current_user', gameId: 'spot-difference', level });
    }

    const newGrid = Array.from({ length: totalCells }).map((_, idx) => ({
      id: idx,
      isOdd: idx === oddIndex,
      emoji: idx === oddIndex ? pair.oddEmoji : pair.defaultEmoji
    }));
    
    setGrid(newGrid);
    setGameState('PLAYING');
  };

  const handleCellClick = (isOdd: boolean) => {
    if (gameState !== 'PLAYING' || isPaused) return;
    incrementAttempts();
    
    if (isOdd) {
      endGame(true, 10 * level);
      // Immediately fetch next
      generateGrid();
    } else {
      // In Gentle Mode, don't end the game immediately, just let them try again.
      // If not in gentle mode, or they made too many mistakes, we could level down via endGame(false)
      if (!gentleMode && attempts > 2) {
        endGame(false, 0); // Drop level
        generateGrid();
      }
    }
  };

  const handleHint = () => {
    consumeHint();
    const newGrid = [...grid];
    const normalIndices = newGrid.map((c, i) => (!c.isOdd ? i : -1)).filter(i => i !== -1);
    
    // Hide a few normal emojis to make it easier
    const toHideCount = gentleMode ? Math.floor(normalIndices.length / 2) : 2;
    for (let i = 0; i < toHideCount; i++) {
      if (normalIndices.length === 0) break;
      const randIdx = Math.floor(/* eslint-disable-next-line react-hooks/purity */ Math.random() * normalIndices.length);
      const gridIdx = normalIndices.splice(randIdx, 1)[0];
      newGrid[gridIdx].emoji = '⬜'; // Blank out
    }
    
    setGrid(newGrid);
  };

  const handleExit = async () => {
    await submitScore(score, 100);
    router.push('/play');
  };

  const handleFinishSession = async () => {
    setGameState('GAMEOVER');
    await submitScore(score, 100); // 100% since they can retry infinitely until finish
  };

  if (gameState === 'GAMEOVER') {
    return (
      <GameContainer title="Spot the Difference" score={score} attempts={attempts} hintsUsed={hintsUsed} onExit={handleExit}>
        <GameResult 
          title="Wonderful!"
          subtitle={`You spotted differences like a pro!`}
          score={score}
          accuracy={100}
          onPlayAgain={() => {
            generateGrid();
            startGame();
          }}
        />
      </GameContainer>
    );
  }

  return (
    <GameContainer
      title="Spot the Difference"
      instructions={`Find the one emoji that is different from the rest • Level ${level}`}
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
        <ElderlyButton variant="outline" onClick={handleFinishSession}>
          🏁 Finish Session
        </ElderlyButton>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gap: gentleMode ? '15px' : '10px',
        maxWidth: '500px',
        margin: '0 auto',
        width: '100%',
        opacity: gameState === 'LOADING' ? 0.5 : 1
      }}>
        {grid.map(cell => (
          <button
            key={cell.id}
            onClick={() => handleCellClick(cell.isOdd)}
            disabled={gameState !== 'PLAYING' || isPaused || cell.emoji === '⬜'}
            style={{
              fontSize: `${Math.max(20, 60 - (gridSize * 5))}px`,
              background: 'var(--card-bg, #ffffff)',
              border: '2px solid var(--border-color, #e5e7eb)',
              borderRadius: '12px',
              aspectRatio: '1/1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: (gameState !== 'PLAYING' || isPaused || cell.emoji === '⬜') ? 'default' : 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              color: '#111827',
              transition: 'all 0.2s'
            }}
            aria-label={cell.emoji === '⬜' ? "Hidden cell" : "Emoji cell"}
          >
            {cell.emoji !== '⬜' ? cell.emoji : ''}
          </button>
        ))}
      </div>
    </GameContainer>
  );
}
