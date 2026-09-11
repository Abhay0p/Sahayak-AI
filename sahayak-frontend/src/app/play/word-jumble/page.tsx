'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameInput } from '@/components/ui/GameComponents/GameInput';
import { GameButton } from '@/components/ui/GameComponents/GameButton';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import { useGameEngine } from '@/lib/gameEngine';
import styles from './WordJumble.module.css';
import { apiClient } from '@/lib/apiClient';

export default function WordJumblePage() {
  const router = useRouter();
  const { 
    startGame, 
    endGame, 
    submitScore, 
    score, 
    level 
  } = useGameEngine({
    gameId: 'word-jumble',
    difficultyConfig: { scoreThreshold: 20, maxLevel: 5 }
  });
  
  const [questionCount, setQuestionCount] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const [jumbled, setJumbled] = useState<string>('');
  const [hint, setHint] = useState<string>('');
  
  const [input, setInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const TOTAL_QUESTIONS = 5;

  useEffect(() => {
    fetchChallenge();
    startGame();
  }, [level]);

  const fetchChallenge = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient('/api/games/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'word-jumble',
          gameType: 'word-jumble',
          difficulty: level
        })
      });
      if (data.success && data.data) {
        setCurrentWord(data.data.content.word);
        setJumbled(data.data.content.jumbled);
        setHint(data.data.content.hint);
      }
    } catch (e) {
      console.error('Failed to fetch challenge:', e);
    } finally {
      setIsLoading(false);
      setInput('');
      setMessage('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setAttempts(a => a + 1);
    
    if (input.toUpperCase() === currentWord) {
      endGame(true, 20 * level);
      setMessage('Correct!');
      setTimeout(() => {
        if (questionCount + 1 >= TOTAL_QUESTIONS) {
          handleGameOver();
        } else {
          setQuestionCount(c => c + 1);
          fetchChallenge();
        }
      }, 1500);
    } else {
      endGame(false, 0);
      setMessage('Try again!');
    }
  };

  const handleGameOver = async () => {
    setIsGameOver(true);
    await submitScore(score, (score / (TOTAL_QUESTIONS * 20 * level)) * 100);
  };

  const handleExit = () => {
    router.push('/play');
  };

  if (isGameOver) {
    return (
      <GameContainer title="Word Jumble" score={score} attempts={attempts} onExit={handleExit}>
        <GameResult 
          title="Game Over!"
          subtitle="You unscrambled all the words."
          score={score}
          accuracy={(score / (TOTAL_QUESTIONS * 20 * level)) * 100}
          onPlayAgain={() => window.location.reload()}
        />
      </GameContainer>
    );
  }

  return (
    <GameContainer
      title="Word Jumble"
      instructions={`Word ${questionCount + 1} of ${TOTAL_QUESTIONS} • Level ${level}`}
      score={score}
      attempts={attempts}
      onExit={handleExit}
    >
      <div className={styles.centerBox}>
        <p className={styles.hint}>
          {attempts > 0 ? `Hint: ${hint}` : 'Make a mistake to see the hint.'}
        </p>

        <div className={styles.jumbledBox}>
          {isLoading ? (
             <span className={styles.jumbleChar}>...</span>
          ) : (
            jumbled.split('').map((char, i) => (
              <span key={i} className={styles.jumbleChar}>{char}</span>
            ))
          )}
        </div>
        
        <form onSubmit={handleSubmit} className={styles.formBox}>
          <GameInput 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            placeholder="Type word here..."
            autoFocus
            disabled={isLoading}
            validationState={message === 'Correct!' ? 'correct' : message === 'Try again!' ? 'incorrect' : 'default'}
          />
          <GameButton type="submit" variant="primary" disabled={isLoading}>Check</GameButton>
        </form>
        
        {message && (
          <div className={`${styles.message} ${message === 'Correct!' ? styles.success : styles.error}`}>
            {message}
          </div>
        )}
      </div>
    </GameContainer>
  );
}
