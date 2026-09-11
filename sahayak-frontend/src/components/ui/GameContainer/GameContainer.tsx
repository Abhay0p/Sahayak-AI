"use client";

import React, { useEffect, useState } from 'react';
import { ElderlyButton } from '../ElderlyButton/ElderlyButton';
import { useLanguage } from '@/components/LanguageProvider/LanguageProvider';
import { speakText } from '@/lib/speech';
import styles from './GameContainer.module.css';

interface GameContainerProps {
  title: string;
  instructions?: string;
  score: number;
  attempts?: number;
  hintsUsed?: number;
  onExit: () => void;
  onHelp?: () => void;
  onHint?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  isPaused?: boolean;
  gentleMode?: boolean;
  onToggleGentleMode?: () => void;
  children: React.ReactNode;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  title,
  instructions,
  score,
  attempts,
  hintsUsed,
  onExit,
  onHelp,
  onHint,
  onPause,
  onResume,
  isPaused,
  gentleMode,
  onToggleGentleMode,
  children,
}) => {
  const { t, language } = useLanguage();
  const [isPlayingInstructions, setIsPlayingInstructions] = useState(false);

  const handlePlayAudio = () => {
    if (instructions) {
      setIsPlayingInstructions(true);
      speakText(instructions, language, () => {
        setIsPlayingInstructions(false);
      });
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{title}</h1>
          {onToggleGentleMode && (
            <button 
              className={`${styles.gentleModeBtn} ${gentleMode ? styles.active : ''}`}
              onClick={onToggleGentleMode}
              aria-pressed={gentleMode}
            >
              🌿 {gentleMode ? 'Gentle Mode: ON' : 'Gentle Mode: OFF'}
            </button>
          )}
        </div>
        <div className={styles.stats}>
          <div className={styles.statBox}>
            <span>{t('game.score', 'Score')}</span>
            {score}
          </div>
          {attempts !== undefined && (
            <div className={styles.statBox}>
              <span>{t('game.attempts', 'Attempts')}</span>
              {attempts}
            </div>
          )}
          {hintsUsed !== undefined && hintsUsed > 0 && (
            <div className={styles.statBox}>
              <span>Hints</span>
              {hintsUsed}
            </div>
          )}
        </div>
      </header>

      {instructions && (
        <div className={styles.instructionArea}>
          <p className={styles.instructions}>{instructions}</p>
          <button 
            className={styles.voiceBtn} 
            onClick={handlePlayAudio}
            aria-label="Play instructions aloud"
          >
            {isPlayingInstructions ? `🔊 ${t('voice.listening', 'Playing...')}` : `🗣️ ${t('action.listen', 'Repeat Instruction')}`}
          </button>
        </div>
      )}

      <main className={styles.gameArea}>
        {isPaused ? (
          <div className={styles.pausedState}>
            <h2>{t('game.paused', 'Game Paused')}</h2>
            <p>{t('game.pausedMsg', 'Take your time. We are waiting for you.')}</p>
            <ElderlyButton variant="primary" onClick={onResume}>
              {t('action.resume', 'Continue')}
            </ElderlyButton>
          </div>
        ) : (
          children
        )}
      </main>

      <footer className={styles.footer}>
        <ElderlyButton variant="outline" onClick={onExit}>
          {t('action.exit', 'Exit')}
        </ElderlyButton>
        <div className={styles.footerControls}>
          {onPause && !isPaused && (
            <ElderlyButton variant="secondary" onClick={onPause}>
              ⏸️ {t('action.pause', 'Take a Break')}
            </ElderlyButton>
          )}
          {onHint && !isPaused && (
            <ElderlyButton variant="secondary" onClick={onHint}>
              💡 {t('action.hint', 'Hint')}
            </ElderlyButton>
          )}
          {onHelp && !isPaused && (
            <ElderlyButton variant="secondary" onClick={onHelp}>
              ❓ {t('action.help', 'Help')}
            </ElderlyButton>
          )}
        </div>
      </footer>
    </div>
  );
};
