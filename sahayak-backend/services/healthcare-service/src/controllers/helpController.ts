import { Request, Response } from 'express';
import { prisma } from '@sahayak/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sahayak-fallback-secret-for-development';

const getUserFromHeader = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded.user;
  } catch (e) {
    return null;
  }
};

export const getHelpRequests = async (req: Request, res: Response) => {
  try {
    const user = getUserFromHeader(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { profileId, role } = user;
    let helpRequests: any[] = [];

    if (role === 'elderly') {
      helpRequests = await prisma.helpRequest.findMany({
        where: { elderlyId: profileId },
        orderBy: { createdAt: 'desc' },
        include: { caregiver: true, contact: true }
      });
    } else if (role === 'caregiver') {
      helpRequests = await prisma.helpRequest.findMany({
        where: { caregiverId: profileId },
        orderBy: { createdAt: 'desc' },
        include: { elderly: true, contact: true }
      });
    }

    return res.status(200).json({ success: true, helpRequests });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createHelpRequest = async (req: Request, res: Response) => {
  try {
    const user = getUserFromHeader(req);
    if (!user || user.role !== 'elderly') return res.status(401).json({ error: 'Unauthorized' });

    const { requestType, message, contactId } = req.body;
    const profileId = user.profileId;

    if (!requestType) return res.status(400).json({ error: 'Invalid input' });

    const recentRequest = await prisma.helpRequest.findFirst({
      where: {
        elderlyId: profileId,
        requestType,
        status: { in: ['CREATED', 'SENT', 'RECEIVED'] },
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) }
      }
    });

    if (recentRequest) {
      return res.status(200).json({ success: true, message: 'Request already exists', helpRequest: recentRequest });
    }

    const caregiverAssignment = await prisma.caregiverAssignment.findFirst({
      where: { elderlyId: profileId }
    });

    const helpRequest = await prisma.helpRequest.create({
      data: {
        elderlyId: profileId,
        caregiverId: caregiverAssignment?.caregiverId || null,
        contactId: contactId || null,
        requestType,
        message,
        status: 'SENT'
      }
    });

    // Notify notification service via HTTP (fire-and-forget, no Redis needed)
    const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8005';
    fetch(`${NOTIFICATION_SERVICE_URL}/internal/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'help_requested', payload: helpRequest }),
    }).catch(() => {
      // Non-critical: notification service may be offline, don't fail the request
    });

    return res.status(201).json({ success: true, helpRequest });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
