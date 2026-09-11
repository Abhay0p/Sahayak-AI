'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameButton } from '@/components/ui/GameComponents/GameButton';
import { useGameEngine } from '@/lib/gameEngine';
import styles from './TicTacToe.module.css';

type Player = 'X' | 'O' | null;

export default function TicTacToePage() {
  const router = useRouter();
  const { startTimer, stopTimer, calculateScore, saveScore, getElapsedTime } = useGameEngine();
  
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    startTimer();
  }, []);

  const calculateWinner = (squares: Player[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    if (!squares.includes(null)) return 'DRAW';
    return null;
  };

  const handleSquareClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);

    const newWinner = calculateWinner(newBoard);
    if (newWinner) {
      setWinner(newWinner);
      handleGameOver(newWinner);
    }
  };

  const handleGameOver = async (gameWinner: Player | 'DRAW') => {
    stopTimer();
    let finalScore = 0;
    if (gameWinner === 'X') {
      finalScore = calculateScore(1, 1, getElapsedTime(), 1) + 100;
      setScore(finalScore);
    } else if (gameWinner === 'DRAW') {
      finalScore = 50;
      setScore(50);
    }
    await saveScore('tic-tac-toe', finalScore, gameWinner === 'X' ? 100 : 50, 1);
  };

  const handleExit = () => {
    router.push('/play');
  };

  return (
    <GameContainer
      title="Tic-Tac-Toe"
      instructions="Get 3 in a row to win! You are X."
      score={score}
      onExit={handleExit}
    >
      <div className={styles.gameArea}>
        {winner ? (
          <div className={styles.statusBox}>
            {winner === 'DRAW' ? "It's a draw!" : `${winner} wins!`}
          </div>
        ) : (
          <div className={styles.statusBox}>
            Next player: {isXNext ? 'X' : 'O'}
          </div>
        )}

        <div className={styles.board}>
          {board.map((sq, i) => (
            <button 
              key={i} 
              className={styles.square} 
              onClick={() => handleSquareClick(i)}
              disabled={!!winner}
            >
              {sq}
            </button>
          ))}
        </div>

        {winner && (
          <GameButton variant="primary" onClick={() => window.location.reload()} style={{ marginTop: '2rem' }}>
            Play Again
          </GameButton>
        )}
      </div>
    </GameContainer>
  );
}
