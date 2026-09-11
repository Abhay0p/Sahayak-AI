import React from 'react';
import styles from './ElderlyButton.module.css';

interface ElderlyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const ElderlyButton: React.FC<ElderlyButtonProps> = ({
  variant = 'primary',
  icon,
  children,
  className,
  ...props
}) => {
  return (
    <button 
      className={`${styles.elderlyButton} ${styles[variant]} ${className || ''}`} 
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.text}>{children}</span>
    </button>
  );
};
