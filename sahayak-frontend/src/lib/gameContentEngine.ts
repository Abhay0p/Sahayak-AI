import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface ChallengeRequest {
  userId: string;
  gameId: string;
  gameType: string;
  difficulty: DifficultyLevel;
  language?: string;
}

export interface GeneratedChallenge {
  challengeHash: string;
  challengeType: string;
  content: any;
  difficulty: number;
}

/**
 * Creates a deterministic hash of the challenge content to prevent duplicates.
 */
export function generateChallengeHash(content: any): string {
  const str = JSON.stringify(content, Object.keys(content).sort());
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Checks if a challenge has been used recently by the user for this game.
 * We look at the last 20 challenges to avoid immediate repetition.
 */
export async function isChallengeNovel(userId: string, gameId: string, challengeHash: string): Promise<boolean> {
  const recentHistory = await prisma.challengeHistory.findMany({
    where: { userId, gameId },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  return !recentHistory.some(history => history.challengeHash === challengeHash);
}

/**
 * Records a challenge in the user's history so they don't see it again soon.
 */
export async function recordChallengeHistory(userId: string, gameId: string, challenge: GeneratedChallenge) {
  await prisma.challengeHistory.create({
    data: {
      userId,
      gameId,
      challengeHash: challenge.challengeHash,
      challengeType: challenge.challengeType,
      difficulty: challenge.difficulty
    }
  });
}

/**
 * Safely fetches a fallback template from the curated pool if AI fails.
 */
export async function getFallbackChallenge(gameType: string, difficulty: number): Promise<any> {
  const templates = await prisma.gameContentPool.findMany({
    where: { gameType, difficulty, isActive: true }
  });

  if (templates.length === 0) {
    // If no exact match, grab any active template for the game
    const anyTemplates = await prisma.gameContentPool.findMany({
      where: { gameType, isActive: true }
    });
    if (anyTemplates.length === 0) return null;
    const randomTemplate = anyTemplates[Math.floor(Math.random() * anyTemplates.length)];
    return JSON.parse(randomTemplate.content);
  }

  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  return JSON.parse(randomTemplate.content);
}
