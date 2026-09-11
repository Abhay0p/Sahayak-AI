import { Request, Response } from 'express';
import { prisma } from '@sahayak/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sahayak-fallback-secret-for-development';

export const getMemories = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const profileId = decoded.user.profileId;

    const memories = await prisma.conversationalMemory.findMany({
      where: { elderlyId: profileId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(memories);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
