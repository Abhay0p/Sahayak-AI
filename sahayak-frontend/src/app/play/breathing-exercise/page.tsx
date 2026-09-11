'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import { GameButton } from '@/components/ui/GameComponents/GameButton';
import styles from './Breathing.module.css';
import { useGameEngine } from '@/lib/gameEngine';

export default function BreathingExercisePage() {
  const router = useRouter();
  const { 
    startGame, 
    endGame, 
    submitScore, 
    score, 
    level,
    gentleMode,
    setGentleMode,
    isPaused,
    pauseGame,
    resumeGame
  } = useGameEngine({
    gameId: 'breathing-exercise',
    difficultyConfig: { scoreThreshold: 100, maxLevel: 5 }
  });
  
  const [phase, setPhase] = useState<'IDLE' | 'INHALE' | 'HOLD' | 'EXHALE'>('IDLE');
  const [cycles, setCycles] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const TOTAL_CYCLES = 5;

  useEffect(() => {
    startGame();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    if (phase !== 'IDLE') {
      const inhaleTime = gentleMode ? 5000 : 4000;
      const holdTime = gentleMode ? 1000 : 2000;
      const exhaleTime = gentleMode ? 6000 : 4000;

      if (phase === 'INHALE') {
        timerRef.current = setTimeout(() => setPhase('HOLD'), inhaleTime);
      } else if (phase === 'HOLD') {
        timerRef.current = setTimeout(() => setPhase('EXHALE'), holdTime);
      } else if (phase === 'EXHALE') {
        timerRef.current = setTimeout(() => {
          setCycles(c => {
            const newC = c + 1;
            if (newC >= TOTAL_CYCLES) {
              handleGameOver();
              return newC;
            } else {
              setPhase('INHALE');
              return newC;
            }
          });
        }, exhaleTime);
      }
    }
  }, [phase, isPaused, gentleMode]);

  const startExercise = () => {
    setCycles(0);
    setPhase('INHALE');
  };

  const handleGameOver = async () => {
    setPhase('IDLE');
    endGame(true, 100);
    setIsGameOver(true);
    await submitScore(score + 100, 100);
  };

  const handleExit = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    router.push('/play');
  };

  let instructionText = "Ready to relax?";
  if (phase === 'INHALE') instructionText = "Breathe In...";
  if (phase === 'HOLD') instructionText = "Hold...";
  if (phase === 'EXHALE') instructionText = "Breathe Out...";

  if (isGameOver) {
    return (
      <GameContainer title="Breathing Exercise" score={score} onExit={handleExit}>
        <GameResult 
          title="Great Job!"
          subtitle="You completed your breathing exercises. Notice how calm you feel."
          score={score}
          accuracy={100}
          onPlayAgain={() => {
            setIsGameOver(false);
            setCycles(0);
            startGame();
          }}
        />
      </GameContainer>
    );
  }

  return (
    <GameContainer
      title="Breathing Exercise"
      instructions={`Cycle ${cycles} of ${TOTAL_CYCLES}`}
      score={score}
      isPaused={isPaused}
      gentleMode={gentleMode}
      onToggleGentleMode={() => setGentleMode(!gentleMode)}
      onPause={pauseGame}
      onResume={resumeGame}
      onExit={handleExit}
    >
      <div className={styles.centerBox}>
        <div className={styles.circleContainer}>
          {/* Pause animations if paused */}
          <div 
            className={`${styles.circle} ${styles[phase.toLowerCase()]}`}
            style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
          ></div>
        </div>
        
        <h2 className={styles.instruction}>{instructionText}</h2>
        
        {phase === 'IDLE' && (
          <GameButton variant="primary" onClick={startExercise}>Start Exercise</GameButton>
        )}
      </div>
    </GameContainer>
  );
}
