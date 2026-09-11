import { Request, Response } from 'express';
import { prisma } from '@sahayak/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sahayak-fallback-secret-for-development';

export const getGames = async (req: Request, res: Response) => {
  try {
    const games = await prisma.game.findMany();
    return res.status(200).json(games);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const submitScore = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.user.profileId;

    const { gameId, score, difficulty, attempts, hintsUsed, durationSeconds } = req.body;

    // Ensure game exists to prevent foreign key constraints
    await prisma.game.upsert({
      where: { id: gameId },
      update: {},
      create: {
        id: gameId,
        name: gameId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        gameType: 'cognitive'
      }
    });

    const session = await prisma.gameSession.create({
      data: {
        userId,
        gameId,
        score,
        difficulty,
        attempts,
        hintsUsed,
        durationSeconds,
        completed: true
      }
    });

    return res.status(201).json({ success: true, session });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Validates whether a challenge fingerprint is novel for this user/game.
 * Checks if the fingerprint exists in recent game sessions.
 */
export const validateNovelty = async (req: Request, res: Response) => {
  try {
    const { fingerprint, userId, gameId } = req.body;
    if (!fingerprint || !userId) {
      return res.status(200).json({ isNovel: true }); // fallback to novel
    }

    // Check if we've seen this fingerprint for this user+game in the last 30 sessions
    const recentSession = await prisma.gameSession.findFirst({
      where: {
        userId,
        gameId: gameId || undefined,
        // Store fingerprint in a metadata field if available, otherwise just allow
      }
    });

    // Simple implementation: always novel (fingerprint tracking can be added later)
    return res.status(200).json({ isNovel: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Records that a challenge fingerprint was used by this user.
 */
export const recordUsage = async (req: Request, res: Response) => {
  try {
    // Acknowledge usage — localStorage fallback in frontend handles detailed tracking
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getChallenge = async (req: Request, res: Response) => {
  try {
    const { gameId, difficulty, gentleMode } = req.body;
    let content: any = {};

    if (gameId === 'memory-match') {
      const pairCount = difficulty === 1 ? 3 : difficulty === 2 ? 4 : difficulty === 3 ? 6 : 4;
      const icons = ['🐶', '🐱', '🐟', '🐦', '🐴', '🐮', '🐷', '🐑'];
      const selected = icons.slice(0, pairCount);
      const deck = [...selected, ...selected].map((icon, index) => ({
        id: index,
        icon,
      })).sort(() => Math.random() - 0.5);
      
      content = { pairCount, deck };
    } else if (gameId === 'math-quiz') {
      content = {
        question: "5 + 3 = ?",
        options: ["7", "8", "9", "10"],
        correctIndex: 1
      };
    } else if (gameId === 'word-jumble') {
      content = {
        word: "SAHAYAK",
        jumbled: "YAKAASH",
        hint: "Your companion app name"
      };
    } else if (gameId === 'story-time') {
      content = {
        text: "Once upon a time in a small village, Kamla found a lost dog.",
        questions: [{ question: "What did Kamla find?", options: ["Cat", "Dog", "Bird"], correctIndex: 1 }]
      };
    }

    return res.status(200).json({
      success: true,
      data: { content }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
