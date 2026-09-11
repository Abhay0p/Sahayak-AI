import { Request, Response } from 'express';
import { prisma } from '@sahayak/database';
import jwt from 'jsonwebtoken';
import { emitNotification } from '../index';

const JWT_SECRET = process.env.JWT_SECRET || 'sahayak-fallback-secret-for-development';

function getProfileId(req: Request): string | null {
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

async function isAuthorized(callerId: string, calleeId: string): Promise<boolean> {
  if (callerId === calleeId) return false;
  const rel = await prisma.familyRelationship.findFirst({
    where: {
      OR: [
        { elderlyId: callerId, familyMemberId: calleeId },
        { elderlyId: calleeId, familyMemberId: callerId },
      ]
    }
  });
  if (rel) return true;

  const caregiverRel = await prisma.caregiverAssignment.findFirst({
    where: {
      OR: [
        { elderlyId: callerId, caregiverId: calleeId },
        { elderlyId: calleeId, caregiverId: callerId },
      ]
    }
  });
  return !!caregiverRel;
}

/** POST /api/calls/initiate – log a new call attempt */
export const initiateCall = async (req: Request, res: Response) => {
  const callerId = getProfileId(req);
  if (!callerId) return res.status(401).json({ error: 'Unauthorized' });

  const { calleeId } = req.body;
  if (!calleeId) return res.status(400).json({ error: 'calleeId is required' });

  const ok = await isAuthorized(callerId, calleeId);
  if (!ok) return res.status(403).json({ error: 'Not authorized to call this user' });

  try {
    const callLog = await prisma.callLog.create({
      data: { callerId, calleeId, status: 'INITIATED' }
    });
    return res.status(201).json(callLog);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to initiate call log' });
  }
};

/** PATCH /api/calls/:id/status – update call status */
export const updateCallStatus = async (req: Request, res: Response) => {
  const profileId = getProfileId(req);
  if (!profileId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const { status } = req.body;
  // Allowed statuses
  const VALID = ['RINGING', 'CONNECTED', 'ENDED', 'FAILED', 'MISSED', 'DECLINED'];
  if (!VALID.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    const callLog = await prisma.callLog.findUnique({ where: { id } });
    if (!callLog) return res.status(404).json({ error: 'Call not found' });

    // Only participants can update
    if (callLog.callerId !== profileId && callLog.calleeId !== profileId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.callLog.update({
      where: { id },
      data: {
        status,
        endedAt: ['ENDED', 'FAILED', 'MISSED'].includes(status) ? new Date() : undefined
      }
    });

    // If missed, notify callee
    if (status === 'MISSED') {
      const caller = await prisma.profile.findUnique({ where: { id: callLog.callerId } });
      const notification = await prisma.inAppNotification.create({
        data: {
          profileId: callLog.calleeId,
          type: 'MISSED_CALL',
          title: 'Missed Call',
          body: `You missed a call from ${caller?.firstName || 'Family'}`,
          actionUrl: '/family-connect?tab=calls',
        }
      });
      emitNotification(callLog.calleeId, notification);
    }

    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update call status' });
  }
};

/** GET /api/calls?limit=20 – recent call history */
export const getCallHistory = async (req: Request, res: Response) => {
  const profileId = getProfileId(req);
  if (!profileId) return res.status(401).json({ error: 'Unauthorized' });

  const limit = parseInt(req.query.limit as string) || 20;

  try {
    const calls = await prisma.callLog.findMany({
      where: {
        OR: [{ callerId: profileId }, { calleeId: profileId }]
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        caller: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        callee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }
      }
    });
    return res.status(200).json(calls);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch call history' });
  }
};
