'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import { useGameEngine } from '@/lib/gameEngine';
import { isChallengeNovel, recordChallengeUsage } from '@/lib/noveltyEngine';
import { ElderlyButton } from '@/components/ui/ElderlyButton/ElderlyButton';
import { Volume2, Play } from 'lucide-react';

const NOTES = [
  { id: 0, icon: '🔴', freq: 261.63 }, // C4
  { id: 1, icon: '🟠', freq: 293.66 }, // D4
  { id: 2, icon: '🟡', freq: 329.63 }, // E4
  { id: 3, icon: '🟢', freq: 349.23 }, // F4
  { id: 4, icon: '🔵', freq: 392.00 }, // G4
  { id: 5, icon: '🟣', freq: 440.00 }  // A4
];

export default function MusicMemoryPage() {
  const router = useRouter();
  
  const { 
    startGame, 
    endGame, 
    submitScore, 
    score, 
    level,
    gentleMode,
    setGentleMode,
    hintsUsed,
    useHint: consumeHint,
    attempts,
    incrementAttempts,
    isPaused,
    pauseGame,
    resumeGame
  } = useGameEngine({
    gameId: 'music-memory',
    difficultyConfig: { scoreThreshold: 50, maxLevel: 5 }
  });
  
  const [gameState, setGameState] = useState<'START' | 'LOADING' | 'SHOWING' | 'WAITING' | 'INPUT' | 'GAMEOVER'>('START');
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const playbackRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (playbackRef.current) clearTimeout(playbackRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playTone = (freq: number, duration: number) => {
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gainNode = audioCtxRef.current.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    osc.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);
    
    osc.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtxRef.current.currentTime + duration);
    
    setTimeout(() => {
      osc.stop();
    }, duration * 1000);
  };

  const handleStartGame = () => {
    initAudio();
    generateAndStart();
    startGame();
  };

  const generateAndStart = async () => {
    setGameState('LOADING');
    setFeedback('');
    setUserSequence([]);
    setActiveIndex(null);
    
    // Length of sequence increases with level
    const seqLength = 2 + Math.floor(level * 0.8); 
    
    let newSeq: number[] = [];
    let novel = false;
    let fallbackTries = 0;
    
    while (!novel && fallbackTries < 5) {
      newSeq = [];
      for (let i = 0; i < seqLength; i++) {
        let next: number;
        do {
          // eslint-disable-next-line react-hooks/purity
          next = Math.floor(Math.random() * NOTES.length);
        } while (newSeq.length > 0 && next === newSeq[newSeq.length - 1]);
        newSeq.push(next);
      }
      
      const fingerprint = newSeq.join('-');
      novel = await isChallengeNovel(fingerprint, { userId: 'current_user', gameId: 'music-memory', level });
      fallbackTries++;
    }
    
    await recordChallengeUsage(newSeq.join('-'), { userId: 'current_user', gameId: 'music-memory', level });

    setSequence(newSeq);
    
    setTimeout(() => {
      playSequence(newSeq);
    }, 1000);
  };

  const playSequence = (seq: number[]) => {
    setGameState('SHOWING');
    let i = 0;
    
    const playNext = () => {
      if (i >= seq.length) {
        setActiveIndex(null);
        setGameState('INPUT');
        return;
      }
      
      const noteIdx = seq[i];
      setActiveIndex(noteIdx);
      playTone(NOTES[noteIdx].freq, gentleMode ? 0.8 : 0.5);
      
      playbackRef.current = setTimeout(() => {
        setActiveIndex(null);
        playbackRef.current = setTimeout(() => {
          i++;
          playNext();
        }, gentleMode ? 400 : 200);
      }, gentleMode ? 800 : 500);
    };
    
    playNext();
  };

  const handleNoteClick = (index: number) => {
    if (gameState !== 'INPUT' || isPaused) return;
    
    playTone(NOTES[index].freq, 0.4);
    setActiveIndex(index);
    setTimeout(() => setActiveIndex(null), 200);

    const newUserSeq = [...userSequence, index];
    setUserSequence(newUserSeq);
    
    const isCorrectSoFar = newUserSeq.every((val, i) => val === sequence[i]);
    
    if (!isCorrectSoFar) {
      incrementAttempts();
      setFeedback('Oops! That wasn\'t it. Listen carefully.');
      setGameState('WAITING');
      
      if (!gentleMode && attempts >= 1) {
        endGame(false, 0);
        setTimeout(() => {
          generateAndStart();
        }, 2000);
      } else {
        setTimeout(() => {
          setUserSequence([]);
          setFeedback('');
          playSequence(sequence);
        }, 2000);
      }
      return;
    }
    
    if (newUserSeq.length === sequence.length) {
      incrementAttempts();
      endGame(true, 10 * level);
      setFeedback('Perfect tune!');
      setGameState('WAITING');
      
      setTimeout(() => {
        generateAndStart();
      }, 2000);
    }
  };

  const handleHint = () => {
    consumeHint();
    setUserSequence([]);
    playSequence(sequence);
  };

  const handleExit = async () => {
    await submitScore(score, 100);
    router.push('/play');
  };

  const handleFinishSession = async () => {
    setGameState('GAMEOVER');
    await submitScore(score, 100);
  };

  if (gameState === 'GAMEOVER') {
    return (
      <GameContainer title="Music Memory" score={score} attempts={attempts} hintsUsed={hintsUsed} onExit={handleExit}>
        <GameResult 
          title="Musical Genius!"
          subtitle="You have an excellent ear for music."
          score={score}
          accuracy={100}
          onPlayAgain={() => {
            setGameState('START');
          }}
        />
      </GameContainer>
    );
  }

  if (gameState === 'START') {
    return (
      <GameContainer title="Music Memory" score={score} attempts={attempts} hintsUsed={hintsUsed} onExit={handleExit}>
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Listen to the Melody</h2>
          <p style={{ color: '#94a3b8', marginBottom: '3rem', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto 3rem auto' }}>
            Pay attention to the sounds and colors, then repeat the sequence. Ensure your device volume is up.
          </p>
          <ElderlyButton variant="primary" onClick={handleStartGame}>
            <Volume2 style={{ marginRight: '10px' }} /> Start Listening
          </ElderlyButton>
        </div>
      </GameContainer>
    );
  }

  return (
    <GameContainer
      title="Music Memory"
      instructions={`Listen and repeat • Level ${level}`}
      score={score}
      attempts={attempts}
      hintsUsed={hintsUsed}
      isPaused={isPaused}
      gentleMode={gentleMode}
      onToggleGentleMode={() => setGentleMode(!gentleMode)}
      onPause={pauseGame}
      onResume={resumeGame}
      onHint={handleHint}
      onExit={handleExit}
    >
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <ElderlyButton variant="secondary" onClick={handleFinishSession}>
          🏁 Finish Session
        </ElderlyButton>
      </div>

      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        {gameState === 'LOADING' && <h3>Composing...</h3>}
        {gameState === 'SHOWING' && <h3>Listen closely...</h3>}
        {gameState === 'INPUT' && <h3>Your turn to play!</h3>}
        
        {feedback && (
          <div style={{ marginTop: '1rem', fontSize: '1.25rem', color: feedback.includes('Perfect') ? '#4ade80' : '#fbbf24' }}>
            {feedback}
          </div>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(3, 1fr)`,
          gap: gentleMode ? '20px' : '15px',
          maxWidth: '350px',
          margin: '3rem auto',
          width: '100%'
        }}>
          {NOTES.map((note, idx) => (
            <button
              key={idx}
              onClick={() => handleNoteClick(idx)}
              disabled={gameState !== 'INPUT' || isPaused}
              style={{
                aspectRatio: '1/1',
                borderRadius: '50%',
                background: activeIndex === idx ? '#334155' : 'var(--card-bg, #1e293b)',
                border: `4px solid ${activeIndex === idx ? '#a855f7' : 'var(--border-color, #334155)'}`,
                boxShadow: activeIndex === idx ? `0 0 25px rgba(168, 85, 247, 0.6)` : '0 4px 6px rgba(0,0,0,0.1)',
                cursor: gameState === 'INPUT' ? 'pointer' : 'default',
                transform: activeIndex === idx ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.15s ease-out',
                fontSize: '3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label={`Note ${idx + 1}`}
            >
              {note.icon}
            </button>
          ))}
        </div>
        
        {gameState === 'INPUT' && (
          <p style={{ color: '#94a3b8' }}>
            Note {userSequence.length + 1} of {sequence.length}
          </p>
        )}
      </div>
    </GameContainer>
  );
}
