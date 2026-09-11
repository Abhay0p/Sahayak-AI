'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import { useGameEngine } from '@/lib/gameEngine';
import { isChallengeNovel, recordChallengeUsage } from '@/lib/noveltyEngine';
import { ElderlyButton } from '@/components/ui/ElderlyButton/ElderlyButton';

/* ─── Pattern Data ─────────────────────────────────────────────── */
// Shapes used for visual patterns
const SHAPES = ['🔵', '🔴', '🟩', '🟨', '🔺', '🔻', '⭐', '❤️'];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function generatePattern(level: number): { pattern: string[]; options: string[]; answer: string } {
  const a = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  let b: string;
  do { b = SHAPES[Math.floor(Math.random() * SHAPES.length)]; } while (b === a);
  let c: string;
  do { c = SHAPES[Math.floor(Math.random() * SHAPES.length)]; } while (c === a || c === b);

  let seq: string[];
  let answer: string;

  if (level <= 1) {
    // ABAB... → next is B
    seq = [a, b, a, b, a];
    answer = b;
  } else if (level === 2) {
    // AABB... → next is B
    seq = [a, a, b, b, a, a];
    answer = b;
  } else if (level === 3) {
    // ABCABC... → next is B
    seq = [a, b, c, a, b, c, a];
    answer = b;
  } else if (level === 4) {
    // ABACABAC... → next is C
    seq = [a, b, a, c, a, b, a];
    answer = c;
  } else {
    // Numeric ascending sequence
    const start = Math.floor(Math.random() * 8) + 1;
    const step  = Math.floor(Math.random() * 3) + 2;
    seq = [start, start + step, start + step * 2, start + step * 3].map(String);
    answer = String(start + step * 4);
  }

  // Build 4 options: 1 correct + 3 wrong
  const wrongs: string[] = [];
  if (level >= 5) {
    // numeric wrong options
    const answerNum = parseInt(answer);
    [-3, -1, 2, 4, 5].filter(d => d !== 0).forEach(d => {
      const v = String(answerNum + d);
      if (!wrongs.includes(v) && v !== answer) wrongs.push(v);
    });
  } else {
    SHAPES.filter(s => s !== answer).forEach(s => wrongs.push(s));
  }

  const options = shuffle([answer, ...shuffle(wrongs).slice(0, 3)]);

  return { pattern: seq, options, answer };
}

/* ─── Component ─────────────────────────────────────────────────── */
export default function PatternDetectivePage() {
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
    gameId: 'pattern-detective',
    difficultyConfig: { scoreThreshold: 50, maxLevel: 5 }
  });

  type Phase = 'LOADING' | 'PLAYING' | 'CORRECT' | 'WRONG' | 'GAMEOVER';
  const [phase, setPhase]   = useState<Phase>('LOADING');
  const [pattern,    setPattern]    = useState<string[]>([]);
  const [options,    setOptions]    = useState<string[]>([]);
  const [answer,     setAnswer]     = useState<string>('');
  const [hintOptions, setHintOptions] = useState<string[] | null>(null);

  // Keep levelRef in sync without triggering render issues
  const levelRef = useRef(level);
  useEffect(() => { levelRef.current = level; }, [level]);

  const generateRound = useCallback(async () => {
    setPhase('LOADING');
    setHintOptions(null);

    let result = generatePattern(levelRef.current);
    let novel = false;
    let tries = 0;
    while (!novel && tries < 5) {
      result = generatePattern(levelRef.current);
      const fingerprint = result.pattern.join('-') + '=' + result.answer;
      novel = await isChallengeNovel(fingerprint, {
        userId: 'current_user',
        gameId: 'pattern-detective',
        level: levelRef.current
      });
      tries++;
    }
    await recordChallengeUsage(result.pattern.join('-') + '=' + result.answer, {
      userId: 'current_user',
      gameId: 'pattern-detective',
      level: levelRef.current
    });

    setPattern(result.pattern);
    setOptions(result.options);
    setAnswer(result.answer);
    setPhase('PLAYING');
  }, []);

  // Start on mount
  useEffect(() => {
    startGame();
    generateRound();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Regenerate when level changes (but not on mount — handled above)
  const prevLevel = useRef(level);
  useEffect(() => {
    if (prevLevel.current !== level) {
      prevLevel.current = level;
      generateRound();
    }
  }, [level, generateRound]);

  const handleOptionClick = (opt: string) => {
    if (phase !== 'PLAYING' || isPaused) return;
    incrementAttempts();

    if (opt === answer) {
      endGame(true, 10 * levelRef.current);
      setPhase('CORRECT');
      setTimeout(() => generateRound(), 1400);
    } else {
      endGame(false, 0);
      setPhase('WRONG');
      setTimeout(() => {
        // In gentle mode or first attempt, let them try again on same question
        if (gentleMode || attempts <= 1) {
          setPhase('PLAYING');
        } else {
          generateRound();
        }
      }, 1500);
    }
  };

  const handleHint = () => {
    consumeHint();
    // Remove one wrong option
    const wrong = (hintOptions ?? options).filter(o => o !== answer);
    const toRemove = wrong[Math.floor(Math.random() * wrong.length)];
    setHintOptions((hintOptions ?? options).filter(o => o !== toRemove));
  };

  const handleFinishSession = async () => {
    setPhase('GAMEOVER');
    await submitScore(score, 100);
  };

  const handleExit = async () => {
    await submitScore(score, 100);
    router.push('/play');
  };

  /* ─── GAME OVER ──────────────────────────────────────────────── */
  if (phase === 'GAMEOVER') {
    return (
      <GameContainer title="Pattern Detective" score={score} attempts={attempts} hintsUsed={hintsUsed} onExit={handleExit}>
        <GameResult
          title="Master Detective!"
          subtitle="You cracked every pattern."
          score={score}
          accuracy={100}
          onPlayAgain={() => {
            startGame();
            generateRound();
          }}
        />
      </GameContainer>
    );
  }

  const displayOptions = hintOptions ?? options;

  /* ─── GAME UI ────────────────────────────────────────────────── */
  return (
    <GameContainer
      title="Pattern Detective"
      instructions={`What comes next? • Level ${level}`}
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
      {/* Finish session button */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <ElderlyButton variant="secondary" onClick={handleFinishSession}>
          🏁 Finish Session
        </ElderlyButton>
      </div>

      <div style={{ textAlign: 'center', padding: '1rem 0' }}>

        {/* Loading */}
        {phase === 'LOADING' && (
          <h3 style={{ color: '#94a3b8' }}>Building your pattern...</h3>
        )}

        {/* Playing / Feedback */}
        {(phase === 'PLAYING' || phase === 'CORRECT' || phase === 'WRONG') && (
          <div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '2rem', color: '#e2e8f0' }}>
              Look at the sequence — what comes next?
            </h3>

            {/* Pattern display */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              margin: '0 auto 2.5rem auto',
              padding: '1.5rem 2rem',
              background: 'rgba(30,41,59,0.8)',
              borderRadius: '20px',
              border: '2px solid #334155',
              width: 'fit-content',
              maxWidth: '100%'
            }}>
              {pattern.map((p, idx) => (
                <span key={idx} style={{ fontSize: '3rem', lineHeight: 1 }}>{p}</span>
              ))}
              {/* Mystery box */}
              <span style={{
                fontSize: '2rem',
                fontWeight: '800',
                color: '#94a3b8',
                border: '3px dashed #475569',
                borderRadius: '12px',
                width: '66px',
                height: '66px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>?</span>
            </div>

            {/* Options */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '14px',
              flexWrap: 'wrap',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              {displayOptions.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(opt)}
                  disabled={phase !== 'PLAYING' || isPaused}
                  style={{
                    fontSize: '2.5rem',
                    padding: '0.8rem 1.5rem',
                    background: phase === 'CORRECT' && opt === answer
                      ? '#166534'
                      : phase === 'WRONG' && opt === answer
                        ? '#1e3a5f'
                        : '#1e293b',
                    border: `2px solid ${phase === 'CORRECT' && opt === answer ? '#4ade80' : '#334155'}`,
                    borderRadius: '16px',
                    cursor: phase === 'PLAYING' ? 'pointer' : 'default',
                    transition: 'transform 0.15s, background 0.2s',
                    minWidth: '80px',
                    color: '#fff'
                  }}
                  onMouseEnter={e => {
                    if (phase === 'PLAYING') (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Feedback */}
            {phase === 'CORRECT' && (
              <div style={{ marginTop: '1.5rem', fontSize: '1.3rem', color: '#4ade80', fontWeight: '600' }}>
                ✅ Correct! Well done!
              </div>
            )}
            {phase === 'WRONG' && (
              <div style={{ marginTop: '1.5rem', fontSize: '1.3rem', color: '#fbbf24', fontWeight: '600' }}>
                Not quite — look carefully at the pattern.
              </div>
            )}
          </div>
        )}
      </div>
    </GameContainer>
  );
}
