import { Request, Response } from 'express';
import { prisma } from '@sahayak/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sahayak-fallback-secret-for-development';

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    if (decoded.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const totalUsers = await prisma.user.count();
    const activeSessions = await prisma.gameSession.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });

    return res.status(200).json({ totalUsers, activeSessions });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
