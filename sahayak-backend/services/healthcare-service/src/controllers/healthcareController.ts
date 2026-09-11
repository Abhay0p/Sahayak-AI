import { Request, Response } from 'express';
import { prisma } from '@sahayak/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sahayak-fallback-secret-for-development';

function getUserFromToken(req: Request): { profileId: string; role: string } | null {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded.user;
  } catch {
    return null;
  }
}

// ─── GET /api/healthcare ────────────────────────────────────────────────────
// Returns aggregated dashboard data: patient roster + summary stats
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (user.role !== 'healthcare' && user.role !== 'caregiver') {
      return res.status(403).json({ error: 'Forbidden: healthcare/caregiver role required' });
    }

    // Fetch raw patient profiles
    let patientProfiles = [];
    if (user.role === 'healthcare') {
      patientProfiles = await prisma.profile.findMany({
        where: { role: 'elderly' }
      });
    } else {
      const assignments = await prisma.caregiverAssignment.findMany({
        where: { caregiverId: user.profileId },
        include: { elderly: true },
      });
      patientProfiles = assignments.map((a: any) => a.elderly);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const currentDayIndex = today.getDay() === 0 ? 7 : today.getDay(); // 1-7 (Mon-Sun)

    // Enrich each patient with recent activity data
    const enrichedPatients = await Promise.all(
      patientProfiles.map(async (p: any) => {
        // Recent challenge history (cognitive activity proxy for healthcare portal)
        const cognitiveActivity = await prisma.challengeHistory.findMany({
          where: { userId: p.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { createdAt: true, challengeType: true },
        });

        // Real cognitive activity for caregiver portal
        const gameSessions = await prisma.gameSession.findMany({
          where: { userId: p.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { game: true }
        });

        // Help requests as alerts
        const helpRequests = await prisma.helpRequest.findMany({
          where: { elderlyId: p.id, status: { in: ['CREATED', 'SENT'] } },
          take: 5,
          orderBy: { createdAt: 'desc' },
        });

        const alerts: string[] = helpRequests.map((h: any) =>
          `${h.requestType}: ${h.message || 'Needs attention'}`
        );

        // Routine / medicine adherence (simplified string for healthcare portal)
        let todaysActivity = { medicine: 'No data' };
        if (p.routinePreferences) {
          try {
            const routines = JSON.parse(p.routinePreferences);
            const hasMedicine = routines.some((r: any) =>
              (r.type || r.title || '').toLowerCase().includes('medicine')
            );
            todaysActivity.medicine = hasMedicine ? 'Pending' : 'All caught up';
          } catch { /* invalid JSON */ }
        }

        // Real reminders / tasks logic for caregiver portal (from routinePreferences)
        let tasksTodayCount = 0;
        let tasksCompletedCount = 0;
        let missedCount = 0;

        let routinesList: any[] = [];
        if (p.routinePreferences) {
          try {
            routinesList = JSON.parse(p.routinePreferences);
            tasksTodayCount = routinesList.length;
            
            for (const r of routinesList) {
              if (r.status === 'completed') tasksCompletedCount++;
              // Simplified miss check: if it's pending and it's past the time (heuristically)
              // We'll just mark it as pending for now to avoid false misses
            }
          } catch {}
        }

        // Determine status color
        const statusColor = helpRequests.length > 0 ? 'danger'
          : tasksTodayCount > 0 && tasksCompletedCount === 0 ? 'warning'
          : 'success';

        return {
          id: p.id,
          name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown',
          avatarUrl: p.avatarUrl || null,
          statusColor,
          alerts,
          todaysActivity,
          cognitiveActivity,
          gameSessions,
          tasksToday: tasksTodayCount,
          tasksCompleted: tasksCompletedCount,
          missedTasks: missedCount,
          activeHelpRequests: helpRequests.length,
          languagePreference: p.languagePreference,
          role: p.role,
          adherenceScore: tasksTodayCount > 0 ? Math.round((tasksCompletedCount / tasksTodayCount) * 100) : 100
        };
      })
    );

    const requiringAttention = enrichedPatients.filter(
      (p: any) => p.statusColor === 'danger' || p.statusColor === 'warning'
    ).length;

    let appointmentsToday = 0;
    try {
      appointmentsToday = await prisma.appointment.count({
        where: {
          patientId: { in: patientProfiles.map((p: any) => p.id) },
          scheduledAt: { gte: today, lt: tomorrow },
        },
      });
    } catch { /* ignored */ }

    // Aggregate stats for Caregiver
    const totalTasksToday = enrichedPatients.reduce((acc, p) => acc + p.tasksToday, 0);
    const totalTasksCompleted = enrichedPatients.reduce((acc, p) => acc + p.tasksCompleted, 0);
    const totalActiveHelpRequests = enrichedPatients.reduce((acc, p) => acc + p.activeHelpRequests, 0);

    return res.status(200).json({
      success: true,
      data: {
        totalAssigned: enrichedPatients.length,
        requiringAttention,
        appointmentsToday,
        totalTasksToday,
        totalTasksCompleted,
        totalActiveHelpRequests,
        patients: enrichedPatients,
      },
    });
  } catch (error: any) {
    console.error('Healthcare dashboard error:', error);
    return res.status(500).json({ error: 'Failed to load healthcare dashboard' });
  }
};

// ─── GET /api/healthcare/patients ────────────────────────────────────────────
export const getPatients = async (req: Request, res: Response) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.role === 'healthcare') {
      const patients = await prisma.profile.findMany({
        where: { role: 'elderly' },
        orderBy: { firstName: 'asc' },
      });
      return res.status(200).json({ success: true, patients });
    }

    if (user.role === 'caregiver') {
      const assignments = await prisma.caregiverAssignment.findMany({
        where: { caregiverId: user.profileId },
        include: { elderly: true },
      });
      return res.status(200).json({
        success: true,
        patients: assignments.map((a: any) => a.elderly),
      });
    }

    return res.status(403).json({ error: 'Forbidden' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ─── GET /api/healthcare/patients/:patientId ─────────────────────────────────
export const getPatientById = async (req: Request, res: Response) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (user.role !== 'healthcare' && user.role !== 'caregiver') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { patientId } = req.params;

    if (user.role === 'caregiver') {
      const assignment = await prisma.caregiverAssignment.findFirst({
        where: { caregiverId: user.profileId, elderlyId: patientId },
      });
      if (!assignment) {
        return res.status(403).json({ error: 'Not authorized to view this patient' });
      }
    }

    const patient = await prisma.profile.findUnique({
      where: { id: patientId },
    });

    if (!patient || patient.role !== 'elderly') {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const cognitiveActivity = await prisma.challengeHistory.findMany({
      where: { userId: patientId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { createdAt: true, challengeType: true },
    });

    const helpRequests = await prisma.helpRequest.findMany({
      where: { elderlyId: patientId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const recentNotifications = await prisma.inAppNotification.findMany({
      where: { profileId: patientId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    let routines: any[] = [];
    if (patient.routinePreferences) {
      try { routines = JSON.parse(patient.routinePreferences); } catch { /* ignore */ }
    }

    const gameSessions = await prisma.gameSession.findMany({
      where: { userId: patientId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { game: true }
    });

    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reminders = await prisma.reminder.findMany({
      where: { userId: patientId },
      include: { 
        logs: { 
          where: { loggedAt: { gte: today, lt: tomorrow } },
          orderBy: { loggedAt: 'desc' },
          take: 1 
        } 
      }
    });

    let appointments: any[] = [];
    let careNotes: any[] = [];
    try {
      appointments = await prisma.appointment.findMany({
        where: { patientId: patientId },
        orderBy: { scheduledAt: 'asc' },
        take: 10
      });
      careNotes = await prisma.careNote.findMany({
        where: { patientId: patientId },
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { firstName: true, lastName: true, role: true } } },
        take: 20
      });
    } catch {} 

    const pendingRoutines = routines.filter(r => r.status !== 'completed');
    let changesFromUsual = "No significant changes observed.";
    if (pendingRoutines.length > 2) {
      changesFromUsual = "Several routines remain pending today. Consider checking in with the patient.";
    } else if (gameSessions.length === 0 && cognitiveActivity.length > 0) {
      changesFromUsual = "Activity is lower than usual. No recent cognitive activities completed today.";
    }

    return res.status(200).json({
      success: true,
      patient: {
        id: patient.id,
        name: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
        preferredName: patient.preferredName,
        avatarUrl: patient.avatarUrl,
        languagePreference: patient.languagePreference,
        routines,
        clinicalDetails: null,
        cognitiveActivity,
        helpRequests,
        recentNotifications,
        gameSessions,
        reminders,
        appointments,
        careNotes,
        changesFromUsual
      },
    });
  } catch (error: any) {
    console.error('Patient detail error:', error);
    return res.status(500).json({ error: 'Failed to load patient details' });
  }
};

export const createCareNote = async (req: Request, res: Response) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (user.role !== 'caregiver') return res.status(403).json({ error: 'Forbidden' });

    const { patientId } = req.params;
    const { text } = req.body;

    const assignment = await prisma.caregiverAssignment.findFirst({
      where: { caregiverId: user.profileId, elderlyId: patientId },
    });
    if (!assignment) return res.status(403).json({ error: 'Not authorized' });

    const note = await prisma.careNote.create({
      data: {
        patientId,
        authorId: user.profileId,
        text
      },
      include: { author: { select: { firstName: true, lastName: true, role: true } } }
    });

    return res.status(201).json({ success: true, note });
  } catch (error) {
    console.error('Create care note error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCareNotes = async (req: Request, res: Response) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (user.role !== 'caregiver' && user.role !== 'healthcare') return res.status(403).json({ error: 'Forbidden' });

    const { patientId } = req.params;

    if (user.role === 'caregiver') {
      const assignment = await prisma.caregiverAssignment.findFirst({
        where: { caregiverId: user.profileId, elderlyId: patientId },
      });
      if (!assignment) return res.status(403).json({ error: 'Not authorized' });
    }

    const notes = await prisma.careNote.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { firstName: true, lastName: true, role: true } } }
    });

    return res.status(200).json({ success: true, notes });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRoutineStatus = async (req: Request, res: Response) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (user.role !== 'caregiver') return res.status(403).json({ error: 'Forbidden' });

    const { patientId } = req.params;
    const { routineIndex, status } = req.body;

    const assignment = await prisma.caregiverAssignment.findFirst({
      where: { caregiverId: user.profileId, elderlyId: patientId },
    });
    if (!assignment) return res.status(403).json({ error: 'Not authorized' });

    const patient = await prisma.profile.findUnique({ where: { id: patientId } });
    if (!patient || !patient.routinePreferences) {
      return res.status(404).json({ error: 'Patient or routines not found' });
    }

    let routines = JSON.parse(patient.routinePreferences);
    if (routineIndex >= 0 && routineIndex < routines.length) {
      routines[routineIndex].status = status;
    } else {
      return res.status(400).json({ error: 'Invalid routine index' });
    }

    await prisma.profile.update({
      where: { id: patientId },
      data: { routinePreferences: JSON.stringify(routines) }
    });

    return res.status(200).json({ success: true, routines });
  } catch (error) {
    console.error('Update routine error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
