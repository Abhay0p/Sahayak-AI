'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import { useGameEngine } from '@/lib/gameEngine';
import { isChallengeNovel, recordChallengeUsage } from '@/lib/noveltyEngine';
import { ElderlyButton } from '@/components/ui/ElderlyButton/ElderlyButton';

const COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1'  // indigo
];

export default function SequenceMasterPage() {
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
    gameId: 'sequence-master',
    difficultyConfig: { scoreThreshold: 50, maxLevel: 5 }
  });
  
  const [gameState, setGameState] = useState<'LOADING' | 'SHOWING' | 'WAITING' | 'INPUT' | 'GAMEOVER'>('LOADING');
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [gridSize, setGridSize] = useState(2);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');

  const playbackRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    generateAndStart();
    startGame();
    return () => {
      if (playbackRef.current) clearTimeout(playbackRef.current);
    };
  }, [level]);

  const generateAndStart = async () => {
    setGameState('LOADING');
    setFeedback('');
    setUserSequence([]);
    setActiveIndex(null);
    
    // Level 1-2: 2x2, Level 3-5: 3x3
    const size = level <= 2 ? 2 : 3;
    setGridSize(size);
    const totalCells = size * size;
    
    // Length of sequence
    const seqLength = 2 + level; 
    
    let newSeq: number[] = [];
    let novel = false;
    let fallbackTries = 0;
    
    while (!novel && fallbackTries < 5) {
      newSeq = [];
      for (let i = 0; i < seqLength; i++) {
        // Prevent immediate repeats if possible for variety
        let next: number;
        do {
          // eslint-disable-next-line react-hooks/purity
          next = Math.floor(Math.random() * totalCells);
        } while (newSeq.length > 0 && next === newSeq[newSeq.length - 1] && totalCells > 1);
        newSeq.push(next);
      }
      
      const fingerprint = newSeq.join('-');
      novel = await isChallengeNovel(fingerprint, { userId: 'current_user', gameId: 'sequence-master', level });
      fallbackTries++;
    }
    
    await recordChallengeUsage(newSeq.join('-'), { userId: 'current_user', gameId: 'sequence-master', level });

    setSequence(newSeq);
    
    setTimeout(() => {
      playSequence(newSeq);
    }, 1000);
  };

  const playSequence = (seq: number[]) => {
    setGameState('SHOWING');
    let i = 0;
    
    const playNext = () => {
      if (i >= seq.length) {
        setActiveIndex(null);
        setGameState('INPUT');
        return;
      }
      
      setActiveIndex(seq[i]);
      playbackRef.current = setTimeout(() => {
        setActiveIndex(null);
        playbackRef.current = setTimeout(() => {
          i++;
          playNext();
        }, gentleMode ? 600 : 300);
      }, gentleMode ? 1000 : 600);
    };
    
    playNext();
  };

  const handleCellClick = (index: number) => {
    if (gameState !== 'INPUT' || isPaused) return;
    
    // Flash cell temporarily
    setActiveIndex(index);
    setTimeout(() => setActiveIndex(null), 200);

    const newUserSeq = [...userSequence, index];
    setUserSequence(newUserSeq);
    
    // Check correctness so far
    const isCorrectSoFar = newUserSeq.every((val, i) => val === sequence[i]);
    
    if (!isCorrectSoFar) {
      incrementAttempts();
      setFeedback('Oops! That wasn\'t it. Watch again.');
      setGameState('WAITING');
      
      if (!gentleMode && attempts >= 1) {
        // If they fail multiple times not in gentle mode, end game (level down)
        endGame(false, 0);
        setTimeout(() => {
          generateAndStart();
        }, 2000);
      } else {
        setTimeout(() => {
          setUserSequence([]);
          setFeedback('');
          playSequence(sequence);
        }, 2000);
      }
      return;
    }
    
    if (newUserSeq.length === sequence.length) {
      // Completed sequence
      incrementAttempts();
      endGame(true, 10 * level);
      setFeedback('Perfect!');
      setGameState('WAITING');
      
      setTimeout(() => {
        generateAndStart();
      }, 2000);
    }
  };

  const handleHint = () => {
    consumeHint();
    // Play sequence again
    setUserSequence([]);
    playSequence(sequence);
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
      <GameContainer title="Sequence Master" score={score} attempts={attempts} hintsUsed={hintsUsed} onExit={handleExit}>
        <GameResult 
          title="Masterful!"
          subtitle="You have excellent sequence memory."
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
      title="Sequence Master"
      instructions={`Watch the pattern, then repeat it • Level ${level}`}
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
        {gameState === 'LOADING' && <h3>Preparing...</h3>}
        {gameState === 'SHOWING' && <h3>Watch carefully...</h3>}
        {gameState === 'INPUT' && <h3>Your turn!</h3>}
        
        {feedback && (
          <div style={{ marginTop: '1rem', fontSize: '1.25rem', color: feedback.includes('Perfect') ? '#4ade80' : '#fbbf24' }}>
            {feedback}
          </div>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap: gentleMode ? '20px' : '15px',
          maxWidth: gridSize === 2 ? '300px' : '400px',
          margin: '2rem auto',
          width: '100%'
        }}>
          {Array.from({ length: gridSize * gridSize }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              disabled={gameState !== 'INPUT' || isPaused}
              style={{
                aspectRatio: '1/1',
                borderRadius: '16px',
                background: activeIndex === idx ? COLORS[idx % COLORS.length] : 'var(--card-bg, #1e293b)',
                border: `4px solid ${activeIndex === idx ? COLORS[idx % COLORS.length] : 'var(--border-color, #334155)'}`,
                boxShadow: activeIndex === idx ? `0 0 20px ${COLORS[idx % COLORS.length]}` : '0 4px 6px rgba(0,0,0,0.1)',
                cursor: gameState === 'INPUT' ? 'pointer' : 'default',
                transform: activeIndex === idx ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.15s ease-out'
              }}
              aria-label={`Cell ${idx + 1}`}
            />
          ))}
        </div>
        
        {gameState === 'INPUT' && (
          <p style={{ color: '#94a3b8' }}>
            Step {userSequence.length + 1} of {sequence.length}
          </p>
        )}
      </div>
    </GameContainer>
  );
}
