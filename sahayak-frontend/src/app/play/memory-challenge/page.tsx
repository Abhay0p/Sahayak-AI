'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import { GameButton } from '@/components/ui/GameComponents/GameButton';
import { useGameEngine } from '@/lib/gameEngine';
import { isChallengeNovel, recordChallengeUsage } from '@/lib/noveltyEngine';
import { ElderlyButton } from '@/components/ui/ElderlyButton/ElderlyButton';

const ITEMS = ['🍎', '🍌', '🚗', '🐶', '⚽', '🎸', '🌻', '🎁', '🎈', '📚', '🍕', '🔑', '🧸', '📱', '📸', '☕', '🍔', '🚀', '🪴', '🎨'];

type Question = {
  text: string;
  options: string[];
  answer: string;
};

export default function MemoryChallengePage() {
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
    gameId: 'memory-challenge',
    difficultyConfig: { scoreThreshold: 50, maxLevel: 5 }
  });
  
  const [gameState, setGameState] = useState<'LOADING' | 'SHOWING' | 'HIDDEN' | 'QUESTION' | 'GAMEOVER'>('LOADING');
  const [items, setItems] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    generateAndStart();
    startGame();
  }, [level]);

  const generateAndStart = async () => {
    setGameState('LOADING');
    setFeedback('');
    setCurrentQuestionIndex(0);
    
    // Level 1: 4 items, Level 5: 8 items
    const itemCount = 3 + level; 
    
    let selectedItems: string[] = [];
    let qList: Question[] = [];
    let novel = false;
    let fallbackTries = 0;
    
    while (!novel && fallbackTries < 5) {
      const shuffled = [...ITEMS].sort(() => 0.5 - /* eslint-disable-next-line react-hooks/purity */ Math.random());
      selectedItems = shuffled.slice(0, itemCount);
      
      const unselected = shuffled.slice(itemCount);
      
      // Question 1: Which of these was in the set?
      const q1Correct = selectedItems[Math.floor(/* eslint-disable-next-line react-hooks/purity */ Math.random() * selectedItems.length)];
      const q1Options = [q1Correct, ...unselected.slice(0, 3)].sort(() => 0.5 - /* eslint-disable-next-line react-hooks/purity */ Math.random());
      
      // Question 2: Which of these was NOT in the set?
      const q2Incorrect = unselected[Math.floor(/* eslint-disable-next-line react-hooks/purity */ Math.random() * unselected.length)];
      const q2Others = selectedItems.filter(i => i !== q1Correct).slice(0, 3); // pick 3 that WERE in the set
      // If we don't have enough (level 1 only has 4 items, filtering out q1correct leaves 3. Perfect.)
      const q2Options = [q2Incorrect, ...q2Others].sort(() => 0.5 - /* eslint-disable-next-line react-hooks/purity */ Math.random());
      
      qList = [
        { text: 'Which of these items was in the set?', options: q1Options, answer: q1Correct },
        { text: 'Which of these items was NOT in the set?', options: q2Options, answer: q2Incorrect }
      ];
      
      const fingerprint = selectedItems.join('') + '-' + q1Correct + '-' + q2Incorrect;
      novel = await isChallengeNovel(fingerprint, { userId: 'current_user', gameId: 'memory-challenge', level });
      fallbackTries++;
    }
    
    const fingerprint = selectedItems.join('') + '-' + qList[0].answer + '-' + qList[1].answer;
    await recordChallengeUsage(fingerprint, { userId: 'current_user', gameId: 'memory-challenge', level });

    setItems(selectedItems);
    setQuestions(qList);
    setGameState('SHOWING');
    
    const displayTime = gentleMode ? 5000 + (itemCount * 1000) : 3000 + (itemCount * 800);
    
    setTimeout(() => {
      setGameState('HIDDEN');
      setTimeout(() => {
        setGameState('QUESTION');
      }, 1000);
    }, displayTime);
  };

  const handleGuess = (answer: string) => {
    if (gameState !== 'QUESTION' || isPaused || feedback) return;
    
    const currentQ = questions[currentQuestionIndex];
    
    if (answer === currentQ.answer) {
      setFeedback('Correct!');
      
      setTimeout(() => {
        setFeedback('');
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          incrementAttempts();
          endGame(true, 15 * level);
          generateAndStart();
        }
      }, 1500);
    } else {
      incrementAttempts();
      setFeedback('Not quite right.');
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
    const currentQ = questions[currentQuestionIndex];
    const incorrect = currentQ.options.filter(opt => opt !== currentQ.answer);
    if (incorrect.length > 0) {
      const toRemove = incorrect[0];
      setQuestions(prev => {
        const next = [...prev];
        next[currentQuestionIndex].options = next[currentQuestionIndex].options.filter(opt => opt !== toRemove);
        return next;
      });
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
      <GameContainer title="Memory Challenge" score={score} attempts={attempts} hintsUsed={hintsUsed} onExit={handleExit}>
        <GameResult 
          title="Incredible Memory!"
          subtitle="You passed the advanced memory challenges."
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

  const currentQ = questions[currentQuestionIndex];

  return (
    <GameContainer
      title="Memory Challenge"
      instructions={`Multi-stage memory activity • Level ${level}`}
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
        {gameState === 'LOADING' && <h3>Setting up challenge...</h3>}
        
        {gameState === 'SHOWING' && (
          <div>
            <h3>Memorize everything you see:</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '2rem', maxWidth: '600px', margin: '2rem auto' }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ fontSize: '4rem', padding: '10px', background: 'var(--card-bg, #1e293b)', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {gameState === 'HIDDEN' && <h3>Focusing...</h3>}

        {gameState === 'QUESTION' && currentQ && (
          <div>
            <h3>Question {currentQuestionIndex + 1} of {questions.length}</h3>
            <h2 style={{ fontSize: '2rem', margin: '2rem 0' }}>{currentQ.text}</h2>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              {currentQ.options.map((opt, idx) => (
                <GameButton key={idx} variant="secondary" onClick={() => handleGuess(opt)} style={{ fontSize: '3rem', padding: '1rem 2rem' }}>
                  {opt}
                </GameButton>
              ))}
            </div>
          </div>
        )}

        {feedback && (
          <div style={{ margin: '2rem 0', fontSize: '1.25rem', color: feedback.includes('Correct') ? '#4ade80' : '#fbbf24' }}>
            {feedback}
          </div>
        )}
      </div>
    </GameContainer>
  );
}
