import { Request, Response } from 'express';
import { prisma } from '@sahayak/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sahayak-fallback-secret-for-development';

function getProfileIdFromToken(req: Request): string | null {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded.user.profileId;
  } catch {
    return null;
  }
}

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const profileId = getProfileIdFromToken(req);
    if (!profileId) return res.status(401).json({ error: 'Unauthorized' });

    const notifications = await prisma.inAppNotification.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(notifications);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const { id, read } = req.body;

    if (id) {
      const updated = await prisma.inAppNotification.update({
        where: { id },
        data: { read }
      });
      return res.status(200).json(updated);
    } else {
      const profileId = getProfileIdFromToken(req);
      if (!profileId) return res.status(401).json({ error: 'Unauthorized' });

      await prisma.inAppNotification.updateMany({
        where: { profileId },
        data: { read }
      });
      return res.status(200).json({ success: true });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ─── Hydration Tracking ───────────────────────────────────────────────────────
// Hydration logs are stored as InAppNotifications of type HYDRATION_LOG.
// This reuses the existing DB model — no schema migration required.

/** GET /api/notifications/hydration/today — get today's hydration count */
export const getTodayHydration = async (req: Request, res: Response) => {
  try {
    const profileId = getProfileIdFromToken(req);
    if (!profileId) return res.status(401).json({ error: 'Unauthorized' });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const count = await prisma.inAppNotification.count({
      where: {
        profileId,
        type: 'HYDRATION_LOG',
        createdAt: { gte: todayStart, lte: todayEnd }
      }
    });

    return res.status(200).json({ count });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/** POST /api/notifications/hydration — log one glass of water (idempotent per minute) */
export const logHydration = async (req: Request, res: Response) => {
  try {
    const profileId = getProfileIdFromToken(req);
    if (!profileId) return res.status(401).json({ error: 'Unauthorized' });

    // Idempotency: prevent duplicate submissions within the same minute
    const oneMinuteAgo = new Date(Date.now() - 60_000);
    const recentLog = await prisma.inAppNotification.findFirst({
      where: {
        profileId,
        type: 'HYDRATION_LOG',
        createdAt: { gte: oneMinuteAgo }
      }
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (recentLog) {
      // Already logged in the last minute — return current count without duplicate
      const count = await prisma.inAppNotification.count({
        where: { profileId, type: 'HYDRATION_LOG', createdAt: { gte: todayStart } }
      });
      return res.status(200).json({ count, duplicate: true });
    }

    await prisma.inAppNotification.create({
      data: {
        profileId,
        type: 'HYDRATION_LOG',
        title: 'Water Logged',
        body: 'You drank a glass of water.',
        read: true // Don't show as an unread notification toast
      }
    });

    const count = await prisma.inAppNotification.count({
      where: { profileId, type: 'HYDRATION_LOG', createdAt: { gte: todayStart } }
    });

    return res.status(201).json({ count });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
