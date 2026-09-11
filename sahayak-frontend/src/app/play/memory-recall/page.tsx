'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import { GameInput } from '@/components/ui/GameComponents/GameInput';
import { GameButton } from '@/components/ui/GameComponents/GameButton';
import { useGameEngine } from '@/lib/gameEngine';
import { isChallengeNovel, recordChallengeUsage } from '@/lib/noveltyEngine';
import styles from './MemoryRecall.module.css';

export default function MemoryRecallPage() {
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
    gameId: 'memory-recall',
    difficultyConfig: { scoreThreshold: 50, maxLevel: 5 }
  });
  
  const [targetNumber, setTargetNumber] = useState('');
  const [inputNumber, setInputNumber] = useState('');
  const [gameState, setGameState] = useState<'LOADING' | 'SHOWING' | 'INPUT' | 'RESULT' | 'GAMEOVER'>('LOADING');
  const [digitCount, setDigitCount] = useState(3);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    generateAndStart();
    startGame();
  }, [level]);

  const generateAndStart = async () => {
    setGameState('LOADING');
    // Calculate digits based on level
    const numDigits = 2 + level; // Level 1 = 3 digits, Level 5 = 7 digits
    setDigitCount(numDigits);
    
    const min = Math.pow(10, numDigits - 1);
    const max = Math.pow(10, numDigits) - 1;
    
    let num = '';
    let novel = false;
    let fallbackTries = 0;
    
    while (!novel && fallbackTries < 5) {
      num = Math.floor(min + /* eslint-disable-next-line react-hooks/purity */ Math.random() * (max - min + 1)).toString();
      novel = await isChallengeNovel(num, { userId: 'current_user', gameId: 'memory-recall', level });
      fallbackTries++;
    }
    
    await recordChallengeUsage(num, { userId: 'current_user', gameId: 'memory-recall', level });

    setTargetNumber(num);
    setInputNumber('');
    setGameState('SHOWING');
    
    // Display time increases in Gentle Mode
    const baseDisplayTime = 2000 + (numDigits * (gentleMode ? 1000 : 500));
    
    setTimeout(() => {
      setGameState('INPUT');
    }, baseDisplayTime);
  };

  const handleHint = () => {
    consumeHint();
    // Show the first half of the number
    const half = Math.ceil(targetNumber.length / 2);
    setInputNumber(targetNumber.substring(0, half));
  };

  const handleSubmit = async () => {
    incrementAttempts();
    if (inputNumber === targetNumber) {
      endGame(true, 10 * level);
      setFeedbackMsg('Wonderful! Get ready for the next one...');
      setGameState('RESULT');
      
      setTimeout(() => {
        // We let the game engine handle leveling up, so we just check if it leveled up
        // Actually, we'll just generate a new one based on the new level (handled by useEffect if level changes)
        // For continuous play within the same level:
        generateAndStart();
      }, 2000);
    } else {
      setFeedbackMsg('Good try! Let\'s look at it again.');
      setGameState('RESULT');
      setTimeout(() => {
        setInputNumber('');
        setGameState('INPUT');
      }, 2000);
    }
  };

  const handleExit = async () => {
    await submitScore(score, 100);
    router.push('/play');
  };

  if (gameState === 'GAMEOVER') {
    return (
      <GameContainer title="Memory Recall" score={score} attempts={attempts} hintsUsed={hintsUsed} onExit={handleExit}>
        <GameResult 
          title="Wonderful Effort!"
          subtitle={`You remembered up to ${digitCount} digits.`}
          score={score}
          accuracy={100} // Basic mock
          onPlayAgain={() => {
            setGameState('LOADING');
            generateAndStart();
            startGame();
          }}
        />
      </GameContainer>
    );
  }

  return (
    <GameContainer
      title="Memory Recall"
      instructions={`Remember the number shown • Level ${level}`}
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
      <div className={styles.centerBox}>
        {gameState === 'LOADING' && (
          <h3 className={styles.instruction}>Preparing a new sequence...</h3>
        )}
        
        {gameState === 'SHOWING' && !isPaused && (
          <>
            <h3 className={styles.instruction}>Memorize this number:</h3>
            <div className={styles.bigNumber}>{targetNumber}</div>
          </>
        )}

        {gameState === 'INPUT' && !isPaused && (
          <>
            <h3 className={styles.instruction}>What was the number?</h3>
            <GameInput 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputNumber}
              onChange={e => setInputNumber(e.target.value.replace(/[^0-9]/g, ''))}
              autoFocus
            />
            <GameButton variant="primary" onClick={handleSubmit} disabled={!inputNumber} style={{ marginTop: '1rem' }}>
              Submit
            </GameButton>
          </>
        )}

        {gameState === 'RESULT' && !isPaused && (
          <div className={styles.correctMessage}>
            {feedbackMsg}
          </div>
        )}
      </div>
    </GameContainer>
  );
}
