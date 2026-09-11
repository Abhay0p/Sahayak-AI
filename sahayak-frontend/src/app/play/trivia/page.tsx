/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import { GameButton } from '@/components/ui/GameComponents/GameButton';
import styles from './Trivia.module.css';
import { useGameEngine } from '@/lib/gameEngine';
import { apiClient } from '@/lib/apiClient';

type TriviaQuestion = {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
};

export default function TriviaPage() {
  const router = useRouter();
  const { startTimer, stopTimer, calculateScore, saveScore, getElapsedTime } = useGameEngine();
  
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient('/api/ai/generate-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType: 'trivia' })
      });
      if (data.success && data.data) {
        setQuestions(data.data);
        startTimer();
      } else {
        // Fallback questions if AI fails
        setQuestions([
          {
            question: "What is the national bird of India?",
            options: ["Peacock", "Parrot", "Pigeon", "Eagle"],
            correctAnswerIndex: 0,
            explanation: "The Indian peacock is the national bird of India."
          }
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(index);
    setAttempts(a => a + 1);
    
    if (index === questions[currentIndex].correctAnswerIndex) {
      setScore(s => s + 20);
    }
    
    setShowExplanation(true);
  };

  const handleNext = async () => {
    setSelectedOption(null);
    setShowExplanation(false);
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      // Game Over
      stopTimer();
      setIsGameOver(true);
      const finalTime = getElapsedTime();
      const finalScore = calculateScore(questions.length, attempts, finalTime, 1) + score;
      const accuracy = ((score / 20) / questions.length) * 100;
      await saveScore('trivia', finalScore, accuracy, 1);
    }
  };

  const handleExit = () => {
    router.push('/play');
  };

  if (isLoading) {
    return (
      <GameContainer title="Memory Trivia" score={0} onExit={handleExit}>
        <div className={styles.loadingState}>
          <p>Generating personalized trivia for you...</p>
        </div>
      </GameContainer>
    );
  }

  if (isGameOver) {
    return (
      <GameContainer title="Memory Trivia" score={score} attempts={attempts} onExit={handleExit}>
        <GameResult 
          title="Well Done!"
          subtitle="You completed the trivia game."
          score={score}
          accuracy={((score / 20) / questions.length) * 100}
          onPlayAgain={() => window.location.reload()}
        />
      </GameContainer>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <GameContainer
      title="Memory Trivia"
      instructions={`Question ${currentIndex + 1} of ${questions.length}`}
      score={score}
      attempts={attempts}
      onExit={handleExit}
    >
      <div className={styles.triviaContainer}>
        <h3 className={styles.questionText}>{currentQ.question}</h3>
        
        <div className={styles.optionsGrid}>
          {currentQ.options.map((opt, i) => {
            let variant: 'secondary' | 'success' | 'danger' | 'primary' = 'secondary';
            if (selectedOption !== null) {
              if (i === currentQ.correctAnswerIndex) {
                variant = 'success';
              } else if (i === selectedOption) {
                variant = 'danger';
              }
            }
            return (
              <GameButton
                key={i}
                variant={variant}
                onClick={() => handleOptionSelect(i)}
                disabled={selectedOption !== null}
              >
                {opt}
              </GameButton>
            );
          })}
        </div>

        {showExplanation && (
          <div className={styles.explanationBox}>
            <p>{currentQ.explanation}</p>
            <GameButton variant="primary" onClick={handleNext}>
              {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Game'}
            </GameButton>
          </div>
        )}
      </div>
    </GameContainer>
  );
}
