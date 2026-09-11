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

async function isAuthorized(profileId: string, otherId: string): Promise<boolean> {
  if (profileId === otherId) return true;
  const rel = await prisma.familyRelationship.findFirst({
    where: {
      OR: [
        { elderlyId: profileId, familyMemberId: otherId },
        { elderlyId: otherId, familyMemberId: profileId },
      ]
    }
  });
  if (rel) return true;

  const caregiverRel = await prisma.caregiverAssignment.findFirst({
    where: {
      OR: [
        { elderlyId: profileId, caregiverId: otherId },
        { elderlyId: otherId, caregiverId: profileId },
      ]
    }
  });
  return !!caregiverRel;
}

/** GET /api/messages?contactId=XXX  – conversation thread */
export const getMessages = async (req: Request, res: Response) => {
  const profileId = getProfileId(req);
  if (!profileId) return res.status(401).json({ error: 'Unauthorized' });

  const { contactId } = req.query;

  if (contactId) {
    const ok = await isAuthorized(profileId, String(contactId));
    if (!ok) return res.status(403).json({ error: 'Access denied' });

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: profileId, receiverId: String(contactId) },
          { senderId: String(contactId), receiverId: profileId },
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark incoming as read
    await prisma.message.updateMany({
      where: { senderId: String(contactId), receiverId: profileId, read: false },
      data: { read: true }
    });

    return res.status(200).json(messages);
  } else {
    // All recent conversations
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: profileId }, { receiverId: profileId }] },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }
      }
    });
    return res.status(200).json(messages);
  }
};

/** POST /api/messages  – send a message */
export const sendMessage = async (req: Request, res: Response) => {
  const profileId = getProfileId(req);
  if (!profileId) return res.status(401).json({ error: 'Unauthorized' });

  const { receiverId, content } = req.body;
  if (!receiverId || !content) {
    return res.status(400).json({ error: 'receiverId and content are required' });
  }

  const ok = await isAuthorized(profileId, receiverId);
  if (!ok) return res.status(403).json({ error: 'Access denied – not a connected family member or caregiver' });

  try {
    const message = await prisma.message.create({
      data: { senderId: profileId, receiverId, content }
    });

    // Create in-app notification for recipient
    const sender = await prisma.profile.findUnique({ where: { id: profileId } });
    const notification = await prisma.inAppNotification.create({
      data: {
        profileId: receiverId,
        type: 'NEW_MESSAGE',
        title: `Message from ${sender?.firstName || 'Family'}`,
        body: content.length > 80 ? content.slice(0, 80) + '…' : content,
        actionUrl: `/family-connect?tab=messages&contactId=${profileId}`,
      }
    });
    
    emitNotification(receiverId, notification);

    return res.status(201).json(message);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
};

/** PATCH /api/messages/read – mark messages as read */
export const markMessagesRead = async (req: Request, res: Response) => {
  const profileId = getProfileId(req);
  if (!profileId) return res.status(401).json({ error: 'Unauthorized' });

  const { senderId } = req.body;
  try {
    await prisma.message.updateMany({
      where: { senderId, receiverId: profileId, read: false },
      data: { read: true }
    });
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to mark messages read' });
  }
};

/** GET /api/messages/unread-count */
export const getUnreadCount = async (req: Request, res: Response) => {
  const profileId = getProfileId(req);
  if (!profileId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const count = await prisma.message.count({
      where: { receiverId: profileId, read: false }
    });
    return res.status(200).json({ count });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to get unread count' });
  }
};
