import { Request, Response } from 'express';
import { prisma } from '@sahayak/database';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { emitNotification } from '../index';

const JWT_SECRET = process.env.JWT_SECRET || 'sahayak-fallback-secret-for-development';
// Local upload directory – photos stored on disk (no external bucket required)
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../../../uploads/memories');

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

/** Ensure uploader is authorized (family member or elderly) for this elderlyId */
async function isAuthorized(profileId: string, elderlyId: string): Promise<boolean> {
  if (profileId === elderlyId) return true;
  const rel = await prisma.familyRelationship.findFirst({
    where: {
      OR: [
        { elderlyId, familyMemberId: profileId },
        { elderlyId: profileId, familyMemberId: elderlyId },
      ]
    }
  });
  return !!rel;
}

/** GET /api/family/memories?elderlyId=XXX */
export const getMemories = async (req: Request, res: Response) => {
  const profileId = getProfileId(req);
  if (!profileId) return res.status(401).json({ error: 'Unauthorized' });

  const elderlyId = (req.query.elderlyId as string) || profileId;

  const authorized = await isAuthorized(profileId, elderlyId);
  if (!authorized) return res.status(403).json({ error: 'Access denied' });

  try {
    const memories = await prisma.familyMemory.findMany({
      where: { elderlyId },
      include: {
        uploader: { select: { firstName: true, lastName: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(memories);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch memories' });
  }
};

/** POST /api/family/memories
 * Body: multipart/form-data with fields: elderlyId, title, description, mediaBase64, mediaType
 */
export const createMemory = async (req: Request, res: Response) => {
  const profileId = getProfileId(req);
  if (!profileId) return res.status(401).json({ error: 'Unauthorized' });

  const { elderlyId, title, description, mediaBase64, mediaType } = req.body;
  if (!elderlyId || !title || !mediaBase64) {
    return res.status(400).json({ error: 'elderlyId, title and mediaBase64 are required' });
  }

  const authorized = await isAuthorized(profileId, elderlyId);
  if (!authorized) return res.status(403).json({ error: 'Access denied' });

  try {
    // Save base64 image to disk
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    const ext = mediaBase64.split(';')[0].split('/')[1] || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    const base64Data = mediaBase64.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    const mediaUrl = `/api/family/memories/file/${filename}`;

    const memory = await prisma.familyMemory.create({
      data: {
        elderlyId,
        uploaderId: profileId,
        title,
        description: description || null,
        mediaUrl,
        mediaType: mediaType || 'image',
      },
      include: {
        uploader: { select: { firstName: true, lastName: true, avatarUrl: true } }
      }
    });

    // Notify elderly user (if uploader is not elderly)
    if (profileId !== elderlyId) {
      const notification = await prisma.inAppNotification.create({
        data: {
          profileId: elderlyId,
          type: 'NEW_FAMILY_PHOTO',
          title: 'New Family Memory',
          body: `${memory.uploader.firstName} added a new family photo: "${title}"`,
          actionUrl: '/family-connect',
        }
      });
      emitNotification(elderlyId, notification);
    }

    return res.status(201).json(memory);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create memory' });
  }
};

/** GET /api/family/memories/file/:filename
 * Serve photo files – only to authorized users
 */
export const serveMemoryFile = async (req: Request, res: Response) => {
  const profileId = getProfileId(req);
  if (!profileId) return res.status(401).json({ error: 'Unauthorized' });

  const { filename } = req.params;
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

  // Verify the requesting user is authorized (owns or is related to) this memory
  const memory = await prisma.familyMemory.findFirst({
    where: { mediaUrl: { contains: filename } }
  });
  if (!memory) return res.status(404).json({ error: 'Memory not found' });

  const authorized = await isAuthorized(profileId, memory.elderlyId);
  if (!authorized) return res.status(403).json({ error: 'Access denied' });

  return res.sendFile(filePath);
};

/** DELETE /api/family/memories/:id */
export const deleteMemory = async (req: Request, res: Response) => {
  const profileId = getProfileId(req);
  if (!profileId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  try {
    const memory = await prisma.familyMemory.findUnique({ where: { id } });
    if (!memory) return res.status(404).json({ error: 'Memory not found' });

    // Only uploader or elderly themselves can delete
    if (memory.uploaderId !== profileId && memory.elderlyId !== profileId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Remove file from disk
    const filename = memory.mediaUrl.split('/').pop();
    if (filename) {
      const filePath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.familyMemory.delete({ where: { id } });
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete memory' });
  }
};
