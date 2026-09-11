'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameContainer } from '@/components/ui/GameContainer/GameContainer';
import { GameResult } from '@/components/ui/GameComponents/GameResult';
import { GameButton } from '@/components/ui/GameComponents/GameButton';
import styles from './StoryTime.module.css';
import { useGameEngine } from '@/lib/gameEngine';
import { Play, Pause } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

type StorySegment = {
  pageNumber: number;
  text: string;
};

export default function StoryTimePage() {
  const router = useRouter();
  const { 
    startGame, 
    endGame, 
    submitScore, 
    score, 
    level,
    gentleMode,
    setGentleMode,
    isPaused,
    pauseGame,
    resumeGame
  } = useGameEngine({
    gameId: 'story-time',
    difficultyConfig: { scoreThreshold: 100, maxLevel: 5 } // 1 story per level essentially
  });
  
  const [story, setStory] = useState<StorySegment[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchStory();
    startGame();
  }, [level]);

  // Pause reading if game is paused
  useEffect(() => {
    if (isPaused && isPlaying) {
      window.speechSynthesis.pause();
    } else if (!isPaused && isPlaying) {
      window.speechSynthesis.resume();
    }
  }, [isPaused, isPlaying]);

  const fetchStory = async () => {
    setIsLoading(true);
    setCurrentPage(0);
    try {
      const data = await apiClient('/api/games/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameId: 'story-time', 
          gameType: 'story-time', 
          difficulty: level,
          gentleMode
        })
      });
      if (data.success && data.data) {
        setStory(data.data.content);
      } else {
        console.warn('API returned unsuccessful response, using fallback');
        setFallbackStory();
      }
    } catch (e) {
      console.error('Fetch failed, using fallback:', e);
      setFallbackStory();
    } finally {
      setIsLoading(false);
    }
  };

  const setFallbackStory = () => {
    setStory([
      { pageNumber: 1, text: "Once upon a time, in a quiet village nestled in the hills, lived a wise elder." },
      { pageNumber: 2, text: "Every morning, the elder would walk to the vibrant market to buy fresh vegetables." },
      { pageNumber: 3, text: "The market was always filled with the sweet scent of jasmine and lively chatter." },
      { pageNumber: 4, text: "Returning home, the elder felt peace and happiness knowing the community was strong." }
    ]);
  };

  const handleReadAloud = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    
    if (story[currentPage]) {
      const utterance = new SpeechSynthesisUtterance(story[currentPage].text);
      
      // Slower pace in gentle mode
      if (gentleMode) {
        utterance.rate = 0.8;
      }
      
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const handleNext = async () => {
    if (isPaused) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    
    if (currentPage < story.length - 1) {
      setCurrentPage(c => c + 1);
    } else {
      endGame(true, 100);
      setIsGameOver(true);
      await submitScore(score + 100, 100);
    }
  };

  const handleExit = () => {
    window.speechSynthesis.cancel();
    router.push('/play');
  };

  if (isLoading) {
    return (
      <GameContainer title="Story Time" score={score} onExit={handleExit}>
        <div className={styles.loadingState}>
          <p>Writing a beautiful, unique story just for you...</p>
        </div>
      </GameContainer>
    );
  }

  if (isGameOver) {
    return (
      <GameContainer title="Story Time" score={score} onExit={handleExit}>
        <GameResult 
          title="The End"
          subtitle="We hope you enjoyed the story."
          score={score}
          accuracy={100}
          onPlayAgain={() => {
            setIsGameOver(false);
            fetchStory(); // Generates a new story
            startGame();
          }}
        />
      </GameContainer>
    );
  }

  const currentSegment = story[currentPage];

  return (
    <GameContainer
      title="Story Time"
      instructions={`Page ${currentPage + 1} of ${story.length} • Level ${level}`}
      score={score}
      isPaused={isPaused}
      gentleMode={gentleMode}
      onToggleGentleMode={() => setGentleMode(!gentleMode)}
      onPause={pauseGame}
      onResume={resumeGame}
      onExit={handleExit}
    >
      <div className={styles.storyContainer}>
        <div className={styles.bookArea}>
          <div className={styles.pageContent}>
            <p className={styles.storyText} style={{ fontSize: gentleMode ? '1.5rem' : '1.25rem' }}>
              {currentSegment?.text}
            </p>
          </div>
        </div>
        
        <div className={styles.controls} style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <GameButton variant="secondary" onClick={handleReadAloud} disabled={isPaused}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              {isPlaying ? 'Pause' : 'Read Aloud'}
            </span>
          </GameButton>
          
          <GameButton variant="primary" onClick={handleNext} disabled={isPaused}>
            {currentPage < story.length - 1 ? 'Next Page' : 'Finish Story'}
          </GameButton>
        </div>
      </div>
    </GameContainer>
  );
}
