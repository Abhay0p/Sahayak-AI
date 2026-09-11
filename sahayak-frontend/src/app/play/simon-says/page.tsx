/* eslint-disable */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import { useGameEngine } from '@/lib/gameEngine';
import styles from './SimonSays.module.css';

const COLORS = ['red', 'blue', 'green', 'yellow'];

export default function SimonSaysPage() {
  const router = useRouter();
  const { startTimer, stopTimer, calculateScore, saveScore, getElapsedTime } = useGameEngine();
  
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerSequence, setPlayerSequence] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    startTimer();
    nextRound([]);
  }, []);

  const nextRound = (currentSeq: string[]) => {
    const nextColor = COLORS[Math.floor(/* eslint-disable-next-line react-hooks/purity */ Math.random() * COLORS.length)];
    const newSeq = [...currentSeq, nextColor];
    setSequence(newSeq);
    setPlayerSequence([]);
    playSequence(newSeq);
  };

  const playSequence = (seq: string[]) => {
    setIsPlaying(true);
    let i = 0;
    const interval = setInterval(() => {
      if (i >= seq.length) {
        clearInterval(interval);
        setActiveColor(null);
        setIsPlaying(false);
        return;
      }
      setActiveColor(seq[i]);
      setTimeout(() => setActiveColor(null), 500);
      i++;
    }, 1000);
  };

  const handleColorClick = (color: string) => {
    if (isPlaying || isGameOver) return;
    
    setActiveColor(color);
    setTimeout(() => setActiveColor(null), 300);

    const newPlayerSeq = [...playerSequence, color];
    setPlayerSequence(newPlayerSeq);
    setAttempts(a => a + 1);

    const currentIndex = newPlayerSeq.length - 1;
    if (newPlayerSeq[currentIndex] !== sequence[currentIndex]) {
      handleGameOver();
      return;
    }

    if (newPlayerSeq.length === sequence.length) {
      setScore(s => s + (sequence.length * 10));
      setTimeout(() => {
        nextRound(sequence);
      }, 1000);
    }
  };

  const handleGameOver = async () => {
    stopTimer();
    setIsGameOver(true);
    const finalScore = calculateScore(sequence.length, attempts, getElapsedTime(), 1) + score;
    await saveScore('simon-says', finalScore, (sequence.length / attempts) * 100, 1);
  };

  const handleExit = () => {
    router.push('/play');
  };

  if (isGameOver) {
    return (
      <GameContainer title="Simon Says" score={score} attempts={attempts} onExit={handleExit}>
        <GameResult 
          title="Game Over!"
          subtitle={`You reached level ${sequence.length - 1}.`}
          score={score}
          onPlayAgain={() => window.location.reload()}
        />
      </GameContainer>
    );
  }

  return (
    <GameContainer
      title="Simon Says"
      instructions="Repeat the color sequence."
      score={score}
      attempts={attempts}
      onExit={handleExit}
    >
      <div className={styles.centerBox}>
        <div className={styles.simonBoard}>
          {COLORS.map(color => (
            <button
              key={color}
              className={`${styles.simonBtn} ${styles[color]} ${activeColor === color ? styles.active : ''}`}
              onClick={() => handleColorClick(color)}
              disabled={isPlaying}
            />
          ))}
        </div>
      </div>
    </GameContainer>
  );
}

