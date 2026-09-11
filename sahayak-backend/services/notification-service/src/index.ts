import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';
import { prisma } from '@sahayak/database';

dotenv.config();

export const app = express();
export const server = http.createServer(app);
const PORT = process.env.PORT || 8005;

export const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE'] }
});

app.use(cors());
app.use(express.json({ limit: '20mb' })); // Allow large base64 images

// Serve uploaded memory photos (static, but gated by memoriesController.serveMemoryFile)
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../../uploads/memories');

import {
  notificationRoutes,
  messageRoutes,
  familyRoutes,
  memoriesRoutes,
  callRoutes
} from './routes/routes';

// ─── HTTP Routes ──────────────────────────────────────────────────────────────
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/family/memories', memoriesRoutes);
app.use('/api/calls', callRoutes);

// Internal route: other services push events here (replaces Redis pub/sub)
app.post('/internal/notify', async (req, res) => {
  const { event, payload } = req.body;
  if (event === 'help_requested') {
    // 1. Persist notification in DB for Caregiver/Family
    const profileToNotify = payload.caregiverId || payload.contactId;
    if (profileToNotify) {
      const dbNotif = await prisma.inAppNotification.create({
        data: {
          profileId: profileToNotify,
          type: 'HELP_REQUEST',
          title: 'SOS / Help Request',
          body: payload.message || 'The user has requested immediate assistance.',
          actionUrl: '/caregiver'
        }
      });
      emitNotification(profileToNotify, dbNotif);
    }
    
    // 2. Fallback broadcast
    if (payload.caregiverId) {
      io.emit(`caregiver:${payload.caregiverId}`, { type: 'NEW_HELP_REQUEST', payload });
    }
    io.emit('help_requested', { type: 'NEW_HELP_REQUEST', payload });
  }
  // Broadcast any generic socket event
  if (event && payload?.to) {
    io.to(payload.to).emit(event, payload);
  }
  res.status(200).json({ ok: true });
});

// ─── Elderly Reminder Routine Scheduler ───────────────────────────────────────
setInterval(async () => {
  try {
    const now = new Date();
    // We'll compute the current time per-user below since they have custom timezones

    // Get all elderly profiles with custom routines
    const elderlyProfiles = await prisma.profile.findMany({
      where: { role: 'elderly', routinePreferences: { not: '[]' } }
    });

    for (const profile of elderlyProfiles) {
      if (!profile.routinePreferences) continue;
      try {
        const routines = JSON.parse(profile.routinePreferences);
        // Get current time in user's timezone
        const userTimezone = profile.timezone || 'UTC';
        
        // Ensure robust parsing
        let localTimeStr;
        try {
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: userTimezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          const parts = formatter.formatToParts(now);
          const localHour = parts.find(p => p.type === 'hour')?.value;
          const localMinute = parts.find(p => p.type === 'minute')?.value;
          
          if (localHour && localMinute) {
             // formatToParts can sometimes return 24 for hour12: false, need to map to 00
             const h = localHour === '24' ? '00' : localHour;
             localTimeStr = `${h}:${localMinute}`;
          }
        } catch(e) {
          // fallback to UTC if timezone is invalid
          const h = now.getUTCHours().toString().padStart(2, '0');
          const m = now.getUTCMinutes().toString().padStart(2, '0');
          localTimeStr = `${h}:${m}`;
        }

        for (const routine of routines) {
          // Time format in routine is usually HH:MM or HH:MM AM/PM
          let routineTime = routine.time;
          if (routineTime && routineTime.includes(' ')) {
            // Convert to 24h
            const [time, period] = routineTime.split(' ');
            let [h, m] = time.split(':');
            let hour = parseInt(h);
            if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12;
            if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;
            routineTime = `${hour.toString().padStart(2, '0')}:${m}`;
          }

          if (localTimeStr && routineTime === localTimeStr) {
            // It's time! Check if we already sent this in the last 1 minute
            const recent = await prisma.inAppNotification.findFirst({
              where: {
                profileId: profile.id,
                title: routine.title,
                createdAt: { gte: new Date(Date.now() - 60000) }
              }
            });

            if (!recent) {
              const categoryMap: Record<string, string> = {
                breakfast: 'MEAL', lunch: 'MEAL', dinner: 'MEAL',
                medicine: 'MEDICINE', hydration: 'HYDRATION', doctor: 'APPOINTMENT',
              };
              const itemType = (routine.type || routine.title || '').toLowerCase();
              const category = Object.entries(categoryMap).find(([k]) => itemType.includes(k))?.[1] ?? 'REMINDER';

              const notif = await prisma.inAppNotification.create({
                data: {
                  profileId: profile.id,
                  type: category,
                  title: routine.title,
                  body: `It's time for ${routine.title.toLowerCase()}`,
                  actionUrl: '/my-day'
                }
              });
              emitNotification(profile.id, notif);
            }
          }
        }
      } catch (e) {
        // invalid JSON
      }
    }
  } catch (error) {
    console.error('Routine scheduler error:', error);
  }
}, 60000); // Check every minute


app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', service: 'Notification Service' });
});

// ─── WebRTC / Call Signaling via Socket.IO ────────────────────────────────────
// Maps profileId → Set of socketIds
export const connectedUsers = new Map<string, Set<string>>();

export function emitNotification(toProfileId: string, notification: any) {
  const socketIds = connectedUsers.get(toProfileId);
  if (socketIds) {
    for (const sid of socketIds) {
      io.to(sid).emit('new_notification', notification);
    }
  }
}

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Register user so they can receive calls
  socket.on('register', (userId: string) => {
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId)!.add(socket.id);
    console.log(`Registered user ${userId} → ${socket.id}`);
  });

  // ─── WebRTC Signaling ─────────────────────────────────────────────────────
  // Call initiation — forwards offer (RTCSessionDescriptionInit) to callee
  socket.on('call-user', (data: { to: string; from: string; name: string; offer: any; callType: 'audio' | 'video'; callId?: string }) => {
    const sids = connectedUsers.get(data.to);
    if (sids && sids.size > 0) {
      for (const sid of sids) {
        io.to(sid).emit('incoming-call', {
          from:     data.from,
          name:     data.name,
          offer:    data.offer,
          callType: data.callType || 'video',
          callId:   data.callId,
        });
      }
    } else {
      // Callee offline – immediately notify caller as missed
      socket.emit('call-rejected', { reason: 'offline' });
    }
  });

  // Answer — callee sends RTCSessionDescription answer to caller
  socket.on('answer-call', (data: { to: string; answer: any }) => {
    const sids = connectedUsers.get(data.to);
    if (sids) {
      for (const sid of sids) io.to(sid).emit('call-answered', data.answer);
    }
  });

  // Trickle ICE — relay candidate to the other peer
  socket.on('ice-candidate', (data: { to: string; candidate: any }) => {
    const sids = connectedUsers.get(data.to);
    if (sids) {
      for (const sid of sids) io.to(sid).emit('ice-candidate', data.candidate);
    }
  });

  socket.on('reject-call', (data: { to: string }) => {
    const sids = connectedUsers.get(data.to);
    if (sids) {
      for (const sid of sids) io.to(sid).emit('call-rejected', { reason: 'declined' });
    }
  });

  socket.on('cancel-call', (data: { to: string }) => {
    const sids = connectedUsers.get(data.to);
    if (sids) {
      for (const sid of sids) io.to(sid).emit('call-cancelled');
    }
  });

  socket.on('call-busy', (data: { to: string }) => {
    const sids = connectedUsers.get(data.to);
    if (sids) {
      for (const sid of sids) io.to(sid).emit('call-busy');
    }
  });

  socket.on('end-call', (data: { to: string }) => {
    const sids = connectedUsers.get(data.to);
    if (sids) {
      for (const sid of sids) io.to(sid).emit('call-ended');
    }
  });

  // Legacy simple-peer accept (kept for backward-compat during transition)
  socket.on('accept-call', (data: { to: string; signal: any }) => {
    const sids = connectedUsers.get(data.to);
    if (sids) {
      for (const sid of sids) io.to(sid).emit('call-accepted', data.signal);
    }
  });

  // ─── Real-time message delivery ───────────────────────────────────────────
  socket.on('new-message', (data: { to: string; message: any }) => {
    const sids = connectedUsers.get(data.to);
    if (sids) {
      for (const sid of sids) io.to(sid).emit('message-received', data.message);
    }
  });

  // ─── Real-time notification delivery ─────────────────────────────────────
  socket.on('notify', (data: { to: string; notification: any }) => {
    const sids = connectedUsers.get(data.to);
    if (sids) {
      for (const sid of sids) io.to(sid).emit('notification', data.notification);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
    for (const [userId, sids] of connectedUsers.entries()) {
      if (sids.has(socket.id)) {
        sids.delete(socket.id);
        if (sids.size === 0) {
          connectedUsers.delete(userId);
        }
        break;
      }
    }
  });
});

if (!process.env.IS_MONOLITH) {
  server.listen(PORT, () => {
    console.log(`✅ Notification Service running on http://localhost:${PORT}`);
  });
}
