import { Request, Response } from 'express';
import { prisma } from '@sahayak/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sahayak-fallback-secret-for-development';

/** Extract profileId from Authorization header */
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

/** GET /api/family/members
 * Returns authorized family members for the current user.
 * Works for both roles:
 *   - Elderly: returns their family network
 *   - Family member: returns the elderly users they are connected to
 */
export const getFamilyMembers = async (req: Request, res: Response) => {
  const profileId = getProfileId(req);
  if (!profileId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    if (profile.role === 'elderly') {
      // Return all connected family members
      const rels = await prisma.familyRelationship.findMany({
        where: { elderlyId: profileId },
        include: {
          familyMember: {
            include: { user: { select: { email: true } } }
          }
        }
      });
      return res.status(200).json(
        rels.map(r => ({
          relationshipId: r.id,
          profileId: r.familyMember.id,
          firstName: r.familyMember.firstName,
          lastName: r.familyMember.lastName,
          preferredName: r.familyMember.preferredName,
          avatarUrl: r.familyMember.avatarUrl,
          email: r.familyMember.user.email,
          relationshipType: r.relationshipType,
          role: r.familyMember.role,
        }))
      );
    } else {
      // Family/caregiver role: return elderly users they are linked to
      const rels = await prisma.familyRelationship.findMany({
        where: { familyMemberId: profileId },
        include: {
          elderly: {
            include: { user: { select: { email: true } } }
          }
        }
      });
      return res.status(200).json(
        rels.map(r => ({
          relationshipId: r.id,
          profileId: r.elderly.id,
          firstName: r.elderly.firstName,
          lastName: r.elderly.lastName,
          preferredName: r.elderly.preferredName,
          avatarUrl: r.elderly.avatarUrl,
          email: r.elderly.user.email,
          relationshipType: r.relationshipType,
          role: r.elderly.role,
        }))
      );
    }
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch family members' });
  }
};

/** GET /api/family/relationship/:targetProfileId
 * Verify a relationship exists between logged-in user and target
 */
export const verifyRelationship = async (req: Request, res: Response) => {
  const profileId = getProfileId(req);
  if (!profileId) return res.status(401).json({ error: 'Unauthorized' });

  const { targetProfileId } = req.params;
  try {
    const rel = await prisma.familyRelationship.findFirst({
      where: {
        OR: [
          { elderlyId: profileId, familyMemberId: targetProfileId },
          { elderlyId: targetProfileId, familyMemberId: profileId },
        ]
      }
    });
    if (!rel) return res.status(403).json({ authorized: false });
    return res.status(200).json({ authorized: true, relationship: rel });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to verify relationship' });
  }
};
