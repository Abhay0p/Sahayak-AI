"use client";

import React from 'react';
import styles from './GameInput.module.css';

export interface GameInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  validationState?: 'default' | 'correct' | 'incorrect';
  isGridCell?: boolean;
}

export const GameInput: React.FC<GameInputProps> = ({
  validationState = 'default',
  isGridCell = false,
  className,
  ...props
}) => {
  let stateClass = '';
  if (validationState === 'correct') stateClass = styles.stateCorrect;
  if (validationState === 'incorrect') stateClass = styles.stateIncorrect;

  return (
    <div className={styles.inputWrapper}>
      <input
        className={`
          ${styles.gameInput} 
          ${stateClass} 
          ${isGridCell ? styles.gridCell : ''} 
          ${className || ''}
        `}
        {...props}
      />
    </div>
  );
};
