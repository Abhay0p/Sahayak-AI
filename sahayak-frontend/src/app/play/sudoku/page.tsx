/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import { useGameEngine } from '@/lib/gameEngine';
import styles from './Sudoku.module.css';

// 4x4 mini-sudoku for elderly accessibility
const SOLUTION = [
  [1, 2, 3, 4],
  [3, 4, 1, 2],
  [2, 1, 4, 3],
  [4, 3, 2, 1]
];

const INITIAL_BOARD = [
  [1, 2, null, 4],
  [null, 4, 1, null],
  [2, null, null, 3],
  [4, 3, 2, null]
];

export default function SudokuPage() {
  const router = useRouter();
  const { startTimer, stopTimer, calculateScore, saveScore, getElapsedTime } = useGameEngine();
  
  const [board, setBoard] = useState<(number | null)[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null);
  
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Deep copy INITIAL_BOARD
    setBoard(INITIAL_BOARD.map(row => [...row]));
    startTimer();
  }, []);

  const handleCellClick = (r: number, c: number) => {
    if (INITIAL_BOARD[r][c] !== null) return; // Cannot edit initial numbers
    setSelectedCell({ r, c });
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    
    setAttempts(a => a + 1);
    const { r, c } = selectedCell;
    
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = num;
    setBoard(newBoard);
    
    if (num === SOLUTION[r][c]) {
      setScore(s => s + 10);
      setMessage('Correct!');
      checkWin(newBoard);
    } else {
      setMessage('Incorrect number. Try again.');
      setTimeout(() => {
        newBoard[r][c] = null;
        setBoard([...newBoard]);
        setMessage('');
      }, 1000);
    }
  };

  const checkWin = (currentBoard: (number | null)[][]) => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentBoard[r][c] !== SOLUTION[r][c]) return;
      }
    }
    // If we reach here, it's a win
    handleGameOver();
  };

  const handleGameOver = async () => {
    stopTimer();
    setIsGameOver(true);
    const finalScore = calculateScore(6, attempts, getElapsedTime(), 1) + score + 50; // 6 empty cells
    await saveScore('sudoku', finalScore, (6 / attempts) * 100, 1);
  };

  const handleExit = () => {
    router.push('/play');
  };

  if (isGameOver) {
    return (
      <GameContainer title="Mini Sudoku" score={score} attempts={attempts} onExit={handleExit}>
        <GameResult 
          title="Puzzle Solved!"
          subtitle="Great job completing the Mini-Sudoku."
          score={score}
          accuracy={(6 / attempts) * 100}
          onPlayAgain={() => window.location.reload()}
        />
      </GameContainer>
    );
  }

  return (
    <GameContainer
      title="Mini Sudoku (4x4)"
      instructions="Fill the empty cells. Each row, column, and 2x2 block must contain 1-4."
      score={score}
      attempts={attempts}
      onExit={handleExit}
    >
      <div className={styles.centerBox}>
        <div className={styles.grid}>
          {board.map((row, r) => (
            <div key={r} className={styles.row}>
              {row.map((cell, c) => {
                const isInitial = INITIAL_BOARD[r][c] !== null;
                const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                
                return (
                  <button
                    key={c}
                    className={`
                      ${styles.cell} 
                      ${isInitial ? styles.initial : styles.editable}
                      ${isSelected ? styles.selected : ''}
                    `}
                    onClick={() => handleCellClick(r, c)}
                    disabled={isInitial}
                  >
                    {cell || ''}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        
        <div className={styles.numberPad}>
          {[1, 2, 3, 4].map(num => (
            <button 
              key={num} 
              className={styles.numBtn} 
              onClick={() => handleNumberInput(num)}
              disabled={!selectedCell}
            >
              {num}
            </button>
          ))}
        </div>
        
        {message && (
          <div className={`${styles.message} ${message === 'Correct!' ? styles.success : styles.error}`}>
            {message}
          </div>
        )}
      </div>
    </GameContainer>
  );
}

