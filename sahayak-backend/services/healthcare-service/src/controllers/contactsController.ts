import { Request, Response } from 'express';
import { prisma } from '@sahayak/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sahayak-fallback-secret-for-development';

export const getContacts = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const profileId = decoded.user.profileId;

    const contacts = await prisma.trustedContact.findMany({
      where: { elderlyId: profileId },
      orderBy: { priority: 'desc' }
    });

    return res.status(200).json(contacts);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
