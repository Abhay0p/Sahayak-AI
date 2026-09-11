"use client";

import React from 'react';
import styles from './GameButton.module.css';

export interface GameButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  icon?: React.ReactNode;
}

export const GameButton: React.FC<GameButtonProps> = ({
  variant = 'primary',
  icon,
  children,
  className,
  ...props
}) => {
  return (
    <button
      className={`
        ${styles.gameBtn} 
        ${styles[variant]} 
        ${className || ''}
      `}
      {...props}
    >
      {icon && <span className={styles.iconWrapper}>{icon}</span>}
      {children}
    </button>
  );
};
