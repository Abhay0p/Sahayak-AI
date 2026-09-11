"use client";

import React from 'react';
import styles from './GameResult.module.css';
import { GameButton } from './GameButton';

export interface GameResultProps {
  title?: string;
  subtitle?: string;
  score: number;
  accuracy?: number;
  timeStr?: string;
  onPlayAgain: () => void;
}

export const GameResult: React.FC<GameResultProps> = ({
  title = "Great Work!",
  subtitle = "You've successfully completed the activity.",
  score,
  accuracy,
  timeStr,
  onPlayAgain
}) => {
  return (
    <div className={styles.resultContainer}>
      <div className={styles.icon}>
        <span style={{ fontSize: '4rem' }}>🎉</span>
      </div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.subtitle}>{subtitle}</p>
      
      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{score}</span>
          <span className={styles.statLabel}>Score</span>
        </div>
        {accuracy !== undefined && (
          <div className={styles.statItem}>
            <span className={styles.statValue}>{Math.round(accuracy)}%</span>
            <span className={styles.statLabel}>Accuracy</span>
          </div>
        )}
        {timeStr !== undefined && (
          <div className={styles.statItem}>
            <span className={styles.statValue}>{timeStr}</span>
            <span className={styles.statLabel}>Time</span>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <GameButton variant="primary" onClick={onPlayAgain}>
          Play Again
        </GameButton>
      </div>
    </div>
  );
};
