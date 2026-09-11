'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameInput } from '@/components/ui/GameComponents/GameInput';
import { GameButton } from '@/components/ui/GameComponents/GameButton';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import { useGameEngine } from '@/lib/gameEngine';
import styles from './MathQuiz.module.css';
import { apiClient } from '@/lib/apiClient';

export default function MathQuizPage() {
  const router = useRouter();
  const { 
    startGame, 
    endGame, 
    submitScore, 
    isPlaying,
    score, 
    level
  } = useGameEngine({
    gameId: 'math-quiz',
    difficultyConfig: { scoreThreshold: 20, maxLevel: 5 }
  });
  
  const [questionCount, setQuestionCount] = useState(0);
  const [question, setQuestion] = useState({ a: 0, b: 0, op: '+', answer: 0 });
  const [input, setInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const TOTAL_QUESTIONS = 10;

  useEffect(() => {
    fetchChallenge();
    startGame();
  }, [level]); // Fetch a new challenge whenever level changes or on mount

  const fetchChallenge = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient('/api/games/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'math-quiz',
          gameType: 'math-quiz',
          difficulty: level
        })
      });
      if (data.success && data.data) {
        setQuestion(data.data.content);
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
    
    if (parseInt(input) === question.answer) {
      endGame(true, 10 * level); // More points for higher levels
      setMessage('Correct!');
      setTimeout(() => {
        if (questionCount + 1 >= TOTAL_QUESTIONS) {
          handleGameOver();
        } else {
          setQuestionCount(c => c + 1);
          fetchChallenge(); // Get next generated question
        }
      }, 1000);
    } else {
      endGame(false, 0); // Fails streak
      setMessage('Try again!');
    }
  };

  const handleGameOver = async () => {
    setIsGameOver(true);
    await submitScore(score, (score / (TOTAL_QUESTIONS * 10 * level)) * 100);
  };

  const handleExit = () => {
    router.push('/play');
  };

  if (isGameOver) {
    return (
      <GameContainer title="Math Quiz" score={score} attempts={attempts} onExit={handleExit}>
        <GameResult 
          title="Quiz Complete!"
          subtitle="You answered all 10 questions."
          score={score}
          accuracy={(score / (TOTAL_QUESTIONS * 10 * level)) * 100}
          onPlayAgain={() => window.location.reload()}
        />
      </GameContainer>
    );
  }

  return (
    <GameContainer
      title="Math Quiz"
      instructions={`Question ${questionCount + 1} of ${TOTAL_QUESTIONS}`}
      score={score}
      attempts={attempts}
      onExit={handleExit}
    >
      <div className={styles.centerBox}>
        {isLoading ? (
          <div className={styles.equation}>
            <span>Loading...</span>
          </div>
        ) : (
          <div className={styles.equation}>
            <span>{question.a}</span>
            <span>{question.op}</span>
            <span>{question.b}</span>
            <span>=</span>
            <span>?</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.formBox}>
          <GameInput 
            type="number" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Answer"
            autoFocus
            disabled={isLoading}
            validationState={message === 'Correct!' ? 'correct' : message === 'Try again!' ? 'incorrect' : 'default'}
          />
          <GameButton type="submit" variant="primary" disabled={isLoading}>Submit</GameButton>
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
