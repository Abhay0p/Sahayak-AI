import React from 'react';
import { apiClient } from '@/lib/apiClient';

export type GameCategory = 'memory' | 'attention' | 'language' | 'problem_solving';

export type GameScore = {
  id: string;
  gameId: string;
  userId: string;
  score: number;
  accuracy: number; // percentage 0-100
  timeSpentSeconds: number;
  date: Date;
  level: number;
};

// Common Game Engine interface
export interface GameEngine {
  startTimer: () => void;
  stopTimer: () => void;
  getElapsedTime: () => number;
  calculateScore: (correctAnswers: number, totalQuestions: number, timeSpent: number, level: number) => number;
}

export const useGameEngine = (config?: { gameId: string; initialTimeLimit?: number; difficultyConfig?: { scoreThreshold: number; maxLevel: number } }) => {
  // Legacy / Basic Mode State
  const startTimeRef = React.useRef(0);
  const elapsedTimeRef = React.useRef(0);

  // Advanced Mode State
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [level, setLevel] = React.useState(1);
  const [timeLeft, setTimeLeft] = React.useState(config?.initialTimeLimit || 0);
  const [consecutiveWins, setConsecutiveWins] = React.useState(0);
  const [consecutiveLosses, setConsecutiveLosses] = React.useState(0);
  
  // New Final Suite State
  const [gentleMode, setGentleMode] = React.useState(false);
  const [hintsUsed, setHintsUsed] = React.useState(0);
  const [attempts, setAttempts] = React.useState(0);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isPaused && timeLeft > 0 && !gentleMode) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isPaused, timeLeft, gentleMode]);

  // Basic API
  const startTimer = () => {
    startTimeRef.current = Date.now();
  };

  const stopTimer = () => {
    if (startTimeRef.current > 0) {
      elapsedTimeRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
    }
    setIsPlaying(false);
  };

  const getElapsedTime = () => {
    return elapsedTimeRef.current;
  };

  const calculateScore = (correctAnswers: number, totalQuestions: number, timeSpent: number, level: number) => {
    const accuracy = (correctAnswers / totalQuestions) * 100;
    let computedScore = accuracy;
    if (!gentleMode && timeSpent < 60) computedScore += (60 - timeSpent) * 0.5;
    computedScore = computedScore * (1 + (level * 0.1));
    if (hintsUsed > 0) computedScore *= 0.9; // minor reduction for hints
    return Math.round(computedScore);
  };

  const saveScore = async (gameId: string, finalScore: number, accuracy: number, finalLevel: number) => {
    const durationSeconds = getElapsedTime() || (config?.initialTimeLimit ? config.initialTimeLimit - timeLeft : 0);
    try {
      await apiClient('/api/games/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          score: finalScore,
          accuracy,
          difficulty: finalLevel,
          durationSeconds,
          completed: true,
          attempts,
          hintsUsed
        })
      });
    } catch (e) {
      console.error('Failed to save score:', e);
    }
  };

  // Advanced API
  const startGame = (timeOverride?: number) => {
    setTimeLeft(gentleMode ? 0 : (timeOverride || config?.initialTimeLimit || 30));
    setIsPlaying(true);
    setIsPaused(false);
    startTimer();
  };

  const pauseGame = () => setIsPaused(true);
  const resumeGame = () => setIsPaused(false);
  const useHint = () => setHintsUsed(h => h + 1);
  const incrementAttempts = () => setAttempts(a => a + 1);

  const endGame = (success: boolean, addedScore: number) => {
    if (success) {
      setScore((s) => s + addedScore);
      setConsecutiveWins(w => w + 1);
      setConsecutiveLosses(0);
      
      if (consecutiveWins >= 2 && (!config?.difficultyConfig || level < config.difficultyConfig.maxLevel)) {
        setLevel((l) => l + 1);
        setConsecutiveWins(0); // Reset after leveling up
      }
    } else {
      setIsPlaying(false);
      setConsecutiveLosses(l => l + 1);
      setConsecutiveWins(0);
      
      if (consecutiveLosses >= 2 && level > 1) {
        setLevel(l => l - 1); // Adaptive difficulty: drop level if struggling
        setConsecutiveLosses(0);
      }
    }
  };

  const submitScore = async (finalScore: number, accuracy: number) => {
    setScore(finalScore);
    if (config?.gameId) {
      await saveScore(config.gameId, finalScore, accuracy, level);
    }
  };

  return {
    // Legacy basic API
    startTimer,
    stopTimer,
    getElapsedTime,
    calculateScore,
    saveScore,
    // Advanced API
    isPlaying,
    isPaused,
    score,
    level,
    timeLeft,
    gentleMode,
    hintsUsed,
    attempts,
    startGame,
    pauseGame,
    resumeGame,
    setGentleMode,
    useHint,
    incrementAttempts,
    endGame,
    submitScore
  };
};

export const getRecommendedGames = (recentScores: GameScore[]) => {
  // Simple logic to recommend games based on performance
  return ['memory-match', 'spot-difference'];
};
