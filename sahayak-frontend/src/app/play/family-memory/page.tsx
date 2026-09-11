'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import { GameButton } from '@/components/ui/GameComponents/GameButton';
import { useGameEngine } from '@/lib/gameEngine';
import { isChallengeNovel, recordChallengeUsage } from '@/lib/noveltyEngine';
import { ElderlyButton } from '@/components/ui/ElderlyButton/ElderlyButton';

const AVATARS = ['👨🏼', '👩🏽', '👴🏾', '👵🏼', '👦🏻', '👧🏿', '👱🏻‍♂️', '👱🏽‍♀️', '👨🏿‍🦱', '👩🏻‍🦰', '👨🏽‍🦳', '👩🏾‍🦳'];
const NAMES = ['John', 'Mary', 'Robert', 'Patricia', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan'];

export default function FamilyMemoryPage() {
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
    gameId: 'family-memory',
    difficultyConfig: { scoreThreshold: 50, maxLevel: 5 }
  });
  
  const [gameState, setGameState] = useState<'LOADING' | 'SHOWING' | 'HIDDEN' | 'GUESSING' | 'GAMEOVER'>('LOADING');
  const [people, setPeople] = useState<{ id: string; avatar: string; name: string }[]>([]);
  const [targetPerson, setTargetPerson] = useState<{ id: string; avatar: string; name: string } | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    generateAndStart();
    startGame();
  }, [level]);

  const generateAndStart = async () => {
    setGameState('LOADING');
    setFeedback('');
    
    // Level 1: 2 people, Level 5: 6 people
    const numPeople = Math.min(AVATARS.length, 1 + level);
    
    let selectedAvatars: string[] = [];
    let selectedNames: string[] = [];
    let pairings: { id: string; avatar: string; name: string }[] = [];
    let target = null;
    let novel = false;
    let fallbackTries = 0;
    
    while (!novel && fallbackTries < 5) {
      const avatars = [...AVATARS].sort(() => 0.5 - /* eslint-disable-next-line react-hooks/purity */ Math.random());
      selectedAvatars = avatars.slice(0, numPeople);
      
      const names = [...NAMES].sort(() => 0.5 - /* eslint-disable-next-line react-hooks/purity */ Math.random());
      selectedNames = names.slice(0, numPeople);
      
      pairings = selectedAvatars.map((avatar, idx) => ({
        id: `person-${idx}`,
        avatar,
        name: selectedNames[idx]
      }));
      
      target = pairings[Math.floor(/* eslint-disable-next-line react-hooks/purity */ Math.random() * pairings.length)];
      
      const fingerprint = pairings.map(p => `${p.avatar}-${p.name}`).join(',') + `|Target:${target.name}`;
      novel = await isChallengeNovel(fingerprint, { userId: 'current_user', gameId: 'family-memory', level });
      fallbackTries++;
    }
    
    const fingerprint = pairings.map(p => `${p.avatar}-${p.name}`).join(',') + `|Target:${target!.name}`;
    await recordChallengeUsage(fingerprint, { userId: 'current_user', gameId: 'family-memory', level });

    setPeople(pairings);
    setTargetPerson(target);
    
    // Generate name options
    const availableNames = NAMES.filter(n => n !== target!.name);
    const distractors = availableNames.sort(() => 0.5 - /* eslint-disable-next-line react-hooks/purity */ Math.random()).slice(0, 3);
    const guessOptions = [target!.name, ...distractors].sort(() => 0.5 - /* eslint-disable-next-line react-hooks/purity */ Math.random());
    setOptions(guessOptions);
    
    setGameState('SHOWING');
    
    const displayTime = gentleMode ? 4000 + (numPeople * 1000) : 3000 + (numPeople * 800);
    
    setTimeout(() => {
      setGameState('HIDDEN');
      setTimeout(() => {
        setGameState('GUESSING');
      }, 800);
    }, displayTime);
  };

  const handleGuess = (name: string) => {
    if (gameState !== 'GUESSING' || isPaused || feedback) return;
    incrementAttempts();
    
    if (name === targetPerson?.name) {
      endGame(true, 10 * level);
      setFeedback('Correct! Well remembered.');
      
      setTimeout(() => {
        generateAndStart();
      }, 2000);
    } else {
      setFeedback('Not quite right. Try another name!');
      if (!gentleMode && attempts > 1) {
        endGame(false, 0); 
        setTimeout(() => generateAndStart(), 2000);
      } else {
        setTimeout(() => setFeedback(''), 1500);
      }
    }
  };

  const handleHint = () => {
    consumeHint();
    const incorrect = options.filter(opt => opt !== targetPerson?.name);
    if (incorrect.length > 0) {
      const toRemove = incorrect[0];
      setOptions(prev => prev.filter(opt => opt !== toRemove));
    }
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
      <GameContainer title="Family Memory" score={score} attempts={attempts} hintsUsed={hintsUsed} onExit={handleExit}>
        <GameResult 
          title="Wonderful!"
          subtitle="You're great at remembering faces and names."
          score={score}
          accuracy={100}
          onPlayAgain={() => {
            generateAndStart();
            startGame();
          }}
        />
      </GameContainer>
    );
  }

  return (
    <GameContainer
      title="Family Memory"
      instructions={`Remember the faces and names • Level ${level}`}
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
        {gameState === 'LOADING' && <h3>Preparing faces...</h3>}
        {gameState === 'SHOWING' && (
          <div>
            <h3>Remember these people:</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '2rem' }}>
              {people.map(person => (
                <div key={person.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: '4rem', background: '#334155', borderRadius: '50%', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                    {person.avatar}
                  </div>
                  <strong style={{ fontSize: '1.2rem', background: '#1e293b', padding: '4px 12px', borderRadius: '16px' }}>{person.name}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {gameState === 'HIDDEN' && <h3>Get ready...</h3>}
        
        {gameState === 'GUESSING' && targetPerson && (
          <div>
            <h3>What is this person's name?</h3>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', marginBottom: '2rem' }}>
              <div style={{ fontSize: '6rem', background: '#334155', borderRadius: '50%', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {targetPerson.avatar}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
              {options.map((opt, idx) => (
                <GameButton key={idx} variant="secondary" onClick={() => handleGuess(opt)} style={{ fontSize: '1.5rem', padding: '1rem 2rem' }}>
                  {opt}
                </GameButton>
              ))}
            </div>
          </div>
        )}
        
        {feedback && (
          <div style={{ margin: '1rem 0', fontSize: '1.25rem', color: feedback.includes('Correct') ? '#4ade80' : '#fbbf24' }}>
            {feedback}
          </div>
        )}
      </div>
    </GameContainer>
  );
}
