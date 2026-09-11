'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import { useGameEngine } from '@/lib/gameEngine';
import styles from './Jigsaw.module.css';

// We'll use a 2x2 grid (4 pieces)
const GRID_SIZE = 2;

type Piece = {
  id: number;
  currentPos: number; // 0 to 3
  correctPos: number; // 0 to 3
};

export default function JigsawPuzzlePage() {
  const router = useRouter();
  const { startTimer, stopTimer, calculateScore, saveScore, getElapsedTime } = useGameEngine();
  
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedPos, setSelectedPos] = useState<number | null>(null);
  
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    // Generate initial scrambled state
    const positions = [0, 1, 2, 3];
    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(/* eslint-disable-next-line react-hooks/purity */ Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Ensure it's not solved initially
    if (positions[0] === 0 && positions[1] === 1 && positions[2] === 2 && positions[3] === 3) {
      [positions[0], positions[1]] = [positions[1], positions[0]];
    }

    const initPieces = [0, 1, 2, 3].map(id => ({
      id,
      correctPos: id,
      currentPos: positions[id]
    }));
    
    setPieces(initPieces);
    startTimer();
  }, []);

  const handlePieceClick = (pos: number) => {
    if (selectedPos === null) {
      setSelectedPos(pos);
    } else {
      // Swap selectedPos with pos
      if (selectedPos === pos) {
        setSelectedPos(null);
        return;
      }
      
      setAttempts(a => a + 1);
      
      const newPieces = [...pieces];
      const p1 = newPieces.find(p => p.currentPos === selectedPos);
      const p2 = newPieces.find(p => p.currentPos === pos);
      
      if (p1 && p2) {
        p1.currentPos = pos;
        p2.currentPos = selectedPos;
        setPieces(newPieces);
        setSelectedPos(null);
        checkWin(newPieces);
      }
    }
  };

  const checkWin = (currentPieces: Piece[]) => {
    const isWin = currentPieces.every(p => p.currentPos === p.correctPos);
    if (isWin) {
      handleGameOver();
    }
  };

  const handleGameOver = async () => {
    stopTimer();
    setIsGameOver(true);
    const finalScore = calculateScore(4, attempts, getElapsedTime(), 1) + 100;
    setScore(finalScore);
    await saveScore('jigsaw-puzzle', finalScore, (4 / attempts) * 100, 1);
  };

  const handleExit = () => {
    router.push('/play');
  };

  if (isGameOver) {
    return (
      <GameContainer title="Jigsaw Puzzle" score={score} attempts={attempts} onExit={handleExit}>
        <GameResult 
          title="Puzzle Complete!"
          subtitle="You've successfully completed the jigsaw puzzle."
          score={score}
          onPlayAgain={() => window.location.reload()}
        />
      </GameContainer>
    );
  }

  // To render pieces in grid order
  const gridPositions = [0, 1, 2, 3];

  return (
    <GameContainer
      title="Jigsaw Puzzle"
      instructions="Tap two pieces to swap them and complete the image."
      score={0}
      attempts={attempts}
      onExit={handleExit}
    >
      <div className={styles.centerBox}>
        <div className={styles.grid}>
          {gridPositions.map(pos => {
            const piece = pieces.find(p => p.currentPos === pos);
            const isSelected = selectedPos === pos;
            
            return (
              <button
                key={pos}
                className={`${styles.piece} ${isSelected ? styles.selected : ''}`}
                onClick={() => handlePieceClick(pos)}
              >
                {piece && (
                  <div className={`${styles.imageSlice} ${styles[`slice-${piece.id}`]}`}></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </GameContainer>
  );
}
