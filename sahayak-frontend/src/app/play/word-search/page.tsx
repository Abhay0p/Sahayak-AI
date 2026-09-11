'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import { useGameEngine } from '@/lib/gameEngine';
import styles from './WordSearch.module.css';

const GRID_SIZE = 8;
const WORDS = ['MANGO', 'LOTUS', 'TIGER'];

// A simple hardcoded grid for demonstration. 
// A real app would generate this dynamically.
const INITIAL_GRID = [
  ['M', 'A', 'N', 'G', 'O', 'X', 'Y', 'Z'],
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  ['L', 'O', 'T', 'U', 'S', 'I', 'J', 'K'],
  ['P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'],
  ['X', 'Y', 'Z', 'T', 'I', 'G', 'E', 'R'],
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  ['I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'],
  ['Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X'],
];

export default function WordSearchPage() {
  const router = useRouter();
  const { startTimer, stopTimer, calculateScore, saveScore, getElapsedTime } = useGameEngine();
  
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    startTimer();
  }, []);

  const getCellId = (r: number, c: number) => `${r}-${c}`;

  const handlePointerDown = (r: number, c: number) => {
    setIsDragging(true);
    setSelectedCells(new Set([getCellId(r, c)]));
  };

  const handlePointerEnter = (r: number, c: number) => {
    if (isDragging) {
      const newSet = new Set(selectedCells);
      newSet.add(getCellId(r, c));
      setSelectedCells(newSet);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    checkSelectedWord();
  };

  const checkSelectedWord = () => {
    // Collect letters
    let word = '';
    const cells = Array.from(selectedCells);
    // Note: this is a simple check that doesn't enforce straight lines perfectly
    // for MVP, we just sort them by row/col and string together
    cells.sort().forEach(id => {
      const [r, c] = id.split('-').map(Number);
      word += INITIAL_GRID[r][c];
    });

    let found = false;
    WORDS.forEach(w => {
      if (word === w || word.split('').reverse().join('') === w) {
        if (!foundWords.has(w)) {
          const newFound = new Set(foundWords);
          newFound.add(w);
          setFoundWords(newFound);
          setScore(s => s + 50);
          found = true;
          
          if (newFound.size === WORDS.length) {
            handleGameOver();
          }
        }
      }
    });

    setSelectedCells(new Set());
  };

  const handleGameOver = async () => {
    stopTimer();
    setIsGameOver(true);
    const finalScore = calculateScore(WORDS.length, WORDS.length, getElapsedTime(), 1) + (WORDS.length * 50);
    await saveScore('word-search', finalScore, 100, 1);
  };

  const handleExit = () => {
    router.push('/play');
  };

  if (isGameOver) {
    return (
      <GameContainer title="Word Search" score={score} onExit={handleExit}>
        <GameResult 
          title="Game Over!"
          subtitle="You found all words!"
          score={score}
          onPlayAgain={() => window.location.reload()}
        />
      </GameContainer>
    );
  }

  return (
    <GameContainer
      title="Word Search"
      instructions={`Find the words: ${WORDS.filter(w => !foundWords.has(w)).join(', ')}`}
      score={score}
      onExit={handleExit}
    >
      <div 
        className={styles.grid}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {INITIAL_GRID.map((row, r) => (
          <div key={r} className={styles.row}>
            {row.map((letter, c) => {
              const cellId = getCellId(r, c);
              const isSelected = selectedCells.has(cellId);
              return (
                <div
                  key={c}
                  className={`${styles.cell} ${isSelected ? styles.selected : ''}`}
                  onPointerDown={() => handlePointerDown(r, c)}
                  onPointerEnter={() => handlePointerEnter(r, c)}
                  style={{ touchAction: 'none' }} // prevent scrolling while dragging
                >
                  {letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      <div className={styles.wordList}>
        {WORDS.map(w => (
          <span key={w} className={`${styles.wordItem} ${foundWords.has(w) ? styles.found : ''}`}>
            {w}
          </span>
        ))}
      </div>
    </GameContainer>
  );
}
