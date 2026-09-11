import { Request, Response } from 'express';
import { prisma } from '@sahayak/database';
import jwt from 'jsonwebtoken';

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

/**
 * GET /api/family/dashboard?elderlyId=X
 *
 * Aggregates real data from existing tables for the Family Portal dashboard.
 * Authorization: requires a FamilyRelationship between caller and elderlyId.
 * No schema changes — reads from existing Reminder, ReminderLog, GameSession,
 * HelpRequest, FamilyMemory, and Profile tables.
 */
export const getFamilyDashboard = async (req: Request, res: Response) => {
  const profileId = getProfileId(req);
  if (!profileId) return res.status(401).json({ error: 'Unauthorized' });

  const { elderlyId } = req.query;
  if (!elderlyId || typeof elderlyId !== 'string') {
    return res.status(400).json({ error: 'elderlyId query parameter is required' });
  }

  // Verify relationship
  const relationship = await prisma.familyRelationship.findFirst({
    where: {
      OR: [
        { elderlyId, familyMemberId: profileId },
        { elderlyId: profileId, familyMemberId: elderlyId },
      ]
    }
  });
  if (!relationship) {
    return res.status(403).json({ error: 'Access denied — not an authorized family member' });
  }

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // ── Elderly profile (for routine preferences) ──────────────────────────
    const elderlyProfile = await prisma.profile.findUnique({
      where: { id: elderlyId },
      select: {
        firstName: true,
        lastName: true,
        preferredName: true,
        avatarUrl: true,
        routinePreferences: true,
      }
    });

    // ── Reminders (all active) + today's logs ──────────────────────────────
    const reminders = await prisma.reminder.findMany({
      where: { userId: elderlyId, isActive: true },
      include: {
        logs: {
          where: { loggedAt: { gte: todayStart, lte: todayEnd } },
          orderBy: { loggedAt: 'desc' }
        }
      },
      orderBy: { scheduledTime: 'asc' }
    });

    // Categorize reminders
    const medicineReminders = reminders.filter(r =>
      r.type === 'MEDICINE' || r.title.toLowerCase().includes('medicine') || r.title.toLowerCase().includes('tablet') || r.title.toLowerCase().includes('pill')
    );
    const hydrationReminders = reminders.filter(r =>
      r.type === 'HYDRATION' || r.title.toLowerCase().includes('water') || r.title.toLowerCase().includes('hydration')
    );
    const mealReminders = reminders.filter(r =>
      r.type === 'MEAL' || r.title.toLowerCase().includes('breakfast') || r.title.toLowerCase().includes('lunch') || r.title.toLowerCase().includes('dinner') || r.title.toLowerCase().includes('meal')
    );

    const countAcknowledged = (arr: typeof reminders) =>
      arr.filter(r => r.logs.some(l => l.status === 'ACKNOWLEDGED' || l.status === 'DONE' || l.status === 'COMPLETED')).length;

    // ── Parse routine preferences ──────────────────────────────────────────
    let routineItems: any[] = [];
    try {
      if (elderlyProfile?.routinePreferences) {
        routineItems = JSON.parse(elderlyProfile.routinePreferences);
      }
    } catch { /* invalid JSON */ }

    // ── Today's game sessions ──────────────────────────────────────────────
    const todayGames = await prisma.gameSession.findMany({
      where: {
        userId: elderlyId,
        createdAt: { gte: todayStart, lte: todayEnd }
      },
      include: { game: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    // ── This week / last week game sessions for trends ─────────────────────
    const thisWeekGames = await prisma.gameSession.findMany({
      where: { userId: elderlyId, createdAt: { gte: weekAgo } },
      select: { score: true, accuracy: true, completed: true }
    });
    const lastWeekGames = await prisma.gameSession.findMany({
      where: { userId: elderlyId, createdAt: { gte: twoWeeksAgo, lt: weekAgo } },
      select: { score: true, accuracy: true, completed: true }
    });

    const avgAccuracy = (sessions: { accuracy: number | null }[]) => {
      const valid = sessions.filter(s => s.accuracy !== null);
      if (valid.length === 0) return null;
      return Math.round(valid.reduce((sum, s) => sum + (s.accuracy ?? 0), 0) / valid.length);
    };

    const engagementTrend = (() => {
      const diff = thisWeekGames.length - lastWeekGames.length;
      if (diff > 2) return '↑ Increasing';
      if (diff < -2) return '↓ Decreasing';
      return '→ Stable';
    })();

    const perfTrend = (() => {
      const thisAvg = avgAccuracy(thisWeekGames);
      const lastAvg = avgAccuracy(lastWeekGames);
      if (thisAvg === null) return '— No data';
      if (lastAvg === null) return `${thisAvg}% this week`;
      const diff = thisAvg - lastAvg;
      if (diff > 5) return '↑ Improving';
      if (diff < -5) return '↓ Declining';
      return '→ Consistent';
    })();

    // ── Active help requests ───────────────────────────────────────────────
    const helpRequests = await prisma.helpRequest.findMany({
      where: {
        elderlyId,
        status: { notIn: ['RESOLVED', 'CANCELLED'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // ── Recent memories ────────────────────────────────────────────────────
    const memories = await prisma.familyMemory.findMany({
      where: { elderlyId },
      include: {
        uploader: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 6
    });

    // ── Attention needed items ─────────────────────────────────────────────
    const attentionItems: { type: string; title: string; detail: string; action: string }[] = [];

    // Unacknowledged medicine reminders
    const missedMedicine = medicineReminders.filter(r => r.logs.length === 0);
    missedMedicine.slice(0, 2).forEach(r => {
      attentionItems.push({
        type: 'MEDICINE',
        title: `Medicine reminder not acknowledged`,
        detail: `${r.title} scheduled at ${r.scheduledTime}`,
        action: 'remind'
      });
    });

    // Active help requests
    helpRequests.slice(0, 2).forEach(h => {
      attentionItems.push({
        type: 'HELP',
        title: `Help request: ${h.requestType}`,
        detail: h.message || 'Needs attention',
        action: 'call'
      });
    });

    // Unacknowledged hydration
    const missedHydration = hydrationReminders.filter(r => r.logs.length === 0);
    if (missedHydration.length >= 2) {
      attentionItems.push({
        type: 'HYDRATION',
        title: `${missedHydration.length} hydration reminders pending`,
        detail: 'No acknowledgement recorded today',
        action: 'remind'
      });
    }

    // ── Activity timeline (games + reminder acknowledgements today) ─────────
    const timelineItems: { id: string; type: string; title: string; detail: string | null; timestamp: string }[] = [];

    todayGames.forEach(g => {
      timelineItems.push({
        id: g.id,
        type: 'game',
        title: `${g.game.name} completed`,
        detail: `Score: ${g.score}${g.accuracy != null ? ' · Accuracy: ' + g.accuracy + '%' : ''}`,
        timestamp: g.createdAt.toISOString()
      });
    });

    reminders.forEach(r => {
      r.logs.forEach(log => {
        timelineItems.push({
          id: log.id,
          type: r.type?.toLowerCase() || 'reminder',
          title: `${r.title} — ${log.status.toLowerCase()}`,
          detail: null,
          timestamp: log.loggedAt.toISOString()
        });
      });
    });

    timelineItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // ── Upcoming routine items (not yet past) ──────────────────────────────
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const upcomingRoutine = routineItems
      .filter(item => {
        if (!item.time) return false;
        let t = item.time;
        // Convert AM/PM if needed
        if (t.includes(' ')) {
          const [time, period] = t.split(' ');
          let [h, m] = time.split(':');
          let hour = parseInt(h);
          if (period?.toUpperCase() === 'PM' && hour !== 12) hour += 12;
          if (period?.toUpperCase() === 'AM' && hour === 12) hour = 0;
          t = `${String(hour).padStart(2, '0')}:${m}`;
        }
        return t >= currentTimeStr;
      })
      .slice(0, 5)
      .map(item => ({ ...item, done: false }));

    // ── Response ───────────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      data: {
        patient: {
          firstName: elderlyProfile?.firstName,
          lastName: elderlyProfile?.lastName,
          preferredName: elderlyProfile?.preferredName,
          avatarUrl: elderlyProfile?.avatarUrl,
        },
        routine: {
          items: routineItems,
          total: routineItems.length,
        },
        reminders: {
          medicine: {
            total: medicineReminders.length,
            acknowledged: countAcknowledged(medicineReminders)
          },
          hydration: {
            total: hydrationReminders.length,
            acknowledged: countAcknowledged(hydrationReminders)
          },
          meal: {
            total: mealReminders.length,
            acknowledged: countAcknowledged(mealReminders)
          },
          all: reminders
        },
        games: {
          today: todayGames.length,
          completed: todayGames.filter(g => g.completed).length,
          sessions: todayGames,
          lastGame: todayGames[0]?.game?.name ?? null,
          trends: {
            engagement: engagementTrend,
            performance: perfTrend,
            thisWeek: {
              gamesPlayed: thisWeekGames.length,
              avgAccuracy: avgAccuracy(thisWeekGames)
            },
            lastWeek: {
              gamesPlayed: lastWeekGames.length,
              avgAccuracy: avgAccuracy(lastWeekGames)
            }
          }
        },
        helpRequests,
        attentionItems,
        timeline: timelineItems.slice(0, 20),
        upcomingRoutine,
        memories
      }
    });
  } catch (error: any) {
    console.error('Family dashboard error:', error);
    return res.status(500).json({ error: 'Failed to load family dashboard' });
  }
};
