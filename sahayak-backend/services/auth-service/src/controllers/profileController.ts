import { Request, Response } from 'express';
import { prisma } from '@sahayak/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sahayak-fallback-secret-for-development';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.user.id;

    const profile = await prisma.profile.findUnique({
      where: { userId }
    });

    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    return res.status(200).json(profile);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.user.id;

    const allowedFields = [
      'firstName', 'lastName', 'preferredName', 'avatarUrl', 
      'languagePreference', 'voiceLanguage', 'voicePreference', 
      'timezone', 'gender'
    ];

    const updates: any = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Convert object to JSON string if updating preferences
    if (req.body.routinePreferences !== undefined) {
      updates.routinePreferences = typeof req.body.routinePreferences === 'object' 
        ? JSON.stringify(req.body.routinePreferences) 
        : req.body.routinePreferences;
    }
    if (req.body.notificationPrefs !== undefined) {
      updates.notificationPrefs = typeof req.body.notificationPrefs === 'object' 
        ? JSON.stringify(req.body.notificationPrefs) 
        : req.body.notificationPrefs;
    }
    if (req.body.accessibilityPrefs !== undefined) {
      updates.accessibilityPrefs = typeof req.body.accessibilityPrefs === 'object' 
        ? JSON.stringify(req.body.accessibilityPrefs) 
        : req.body.accessibilityPrefs;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: updates
    });

    return res.status(200).json(updatedProfile);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
