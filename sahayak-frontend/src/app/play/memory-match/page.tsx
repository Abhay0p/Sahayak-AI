'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import styles from './MemoryMatch.module.css';
import { useGameEngine } from '@/lib/gameEngine';
import { apiClient } from '@/lib/apiClient';

export default function MemoryMatchPage() {
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
    gameId: 'memory-match',
    difficultyConfig: { scoreThreshold: 50, maxLevel: 5 }
  });

  const [cards, setCards] = useState<{ id: number; icon: string; isFlipped: boolean; isMatched: boolean }[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pairCount, setPairCount] = useState(4);

  useEffect(() => {
    fetchChallenge();
    startGame();
  }, [level]);

  const fetchChallenge = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient('/api/games/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'memory-match',
          gameType: 'memory-match',
          difficulty: level,
          gentleMode
        })
      });
      if (data.success && data.data) {
        setPairCount(data.data.content.pairCount);
        setCards(data.data.content.deck.map((card: any) => ({
          ...card,
          isFlipped: false,
          isMatched: false
        })));
      }
    } catch (e) {
      console.error('Failed to fetch challenge:', e);
    } finally {
      setIsLoading(false);
      setFlippedIndices([]);
    }
  };

  const handleHint = () => {
    consumeHint();
    // Find an unmatched card and flip it temporarily
    const unmatched = cards.findIndex(c => !c.isMatched && !c.isFlipped);
    if (unmatched !== -1) {
      const newCards = [...cards];
      newCards[unmatched].isFlipped = true;
      setCards(newCards);
      setTimeout(() => {
        setCards(prev => {
          const reset = [...prev];
          reset[unmatched].isFlipped = false;
          return reset;
        });
      }, gentleMode ? 2000 : 1000);
    }
  };

  const handleCardClick = (index: number) => {
    if (isProcessing || cards[index].isFlipped || cards[index].isMatched || isPaused) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlippedIndices = [...flippedIndices, index];
    setFlippedIndices(newFlippedIndices);

    if (newFlippedIndices.length === 2) {
      setIsProcessing(true);
      incrementAttempts();
      
      const [firstIndex, secondIndex] = newFlippedIndices;
      
      if (cards[firstIndex].icon === cards[secondIndex].icon) {
        // Match found
        setTimeout(async () => {
          const matchedCards = [...newCards];
          matchedCards[firstIndex].isMatched = true;
          matchedCards[secondIndex].isMatched = true;
          setCards(matchedCards);
          setFlippedIndices([]);
          setIsProcessing(false);
          
          if (matchedCards.every(c => c.isMatched)) {
            endGame(true, 10 * pairCount);
            setIsGameOver(true);
            await submitScore(score + (10 * pairCount), (pairCount / (attempts + 1)) * 100);
          }
        }, gentleMode ? 1200 : 800);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[firstIndex].isFlipped = false;
          resetCards[secondIndex].isFlipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
          setIsProcessing(false);
        }, gentleMode ? 2000 : 1200); // Give more time to memorize in gentle mode
      }
    }
  };

  const handleExit = () => {
    router.push('/play');
  };

  if (isGameOver) {
    return (
      <GameContainer 
        title="Memory Match" 
        score={score} 
        attempts={attempts} 
        hintsUsed={hintsUsed}
        onExit={handleExit}
      >
        <GameResult 
          title="Wonderful!"
          subtitle={`You found all ${pairCount} pairs in ${attempts} attempts. Great remembering!`}
          score={score}
          accuracy={(pairCount / attempts) * 100}
          onPlayAgain={() => {
            setIsGameOver(false);
            fetchChallenge();
            startGame();
          }}
        />
      </GameContainer>
    );
  }

  return (
    <GameContainer
      title="Memory Match"
      instructions={`Find the ${pairCount} matching pairs • Level ${level}`}
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
      <div className={styles.grid} style={{ 
        gridTemplateColumns: `repeat(${pairCount <= 4 ? 4 : (pairCount <= 6 ? 4 : 5)}, 1fr)` 
      }}>
        {isLoading ? (
          <div style={{ width: '100%', gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>Loading cards...</div>
        ) : (
          cards.map((card, index) => (
            <button
              key={card.id + '-' + index}
              className={`${styles.card} ${card.isFlipped || card.isMatched ? styles.flipped : ''}`}
              onClick={() => handleCardClick(index)}
              aria-label={card.isFlipped || card.isMatched ? `Card shows ${card.icon}` : "Hidden card"}
              disabled={card.isMatched || isProcessing || isPaused}
            >
              <div className={styles.cardInner}>
                <div className={styles.cardFront}>?</div>
                <div className={styles.cardBack}>{card.icon}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </GameContainer>
  );
}
