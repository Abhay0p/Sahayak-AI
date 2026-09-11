import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
  getTodayHydration,
  logHydration
} from '../controllers/notificationController';
import {
  getMessages,
  sendMessage,
  markMessagesRead,
  getUnreadCount
} from '../controllers/messageController';
import {
  getFamilyMembers,
  verifyRelationship
} from '../controllers/familyController';
import {
  getFamilyDashboard
} from '../controllers/familyDashboardController';
import {
  getMemories,
  createMemory,
  serveMemoryFile,
  deleteMemory
} from '../controllers/memoriesController';
import {
  initiateCall,
  updateCallStatus,
  getCallHistory
} from '../controllers/callController';

// ─── Notifications ────────────────────────────────────────────────────────────
const notificationRoutes = Router();
notificationRoutes.get('/', getNotifications);
notificationRoutes.put('/', markNotificationRead);
notificationRoutes.patch('/', markNotificationRead);
notificationRoutes.get('/hydration/today', getTodayHydration);
notificationRoutes.post('/hydration', logHydration);

// ─── Messages ─────────────────────────────────────────────────────────────────
const messageRoutes = Router();
messageRoutes.get('/', getMessages);
messageRoutes.post('/', sendMessage);
messageRoutes.patch('/read', markMessagesRead);
messageRoutes.get('/unread-count', getUnreadCount);

// ─── Family ───────────────────────────────────────────────────────────────────
const familyRoutes = Router();
familyRoutes.get('/members', getFamilyMembers);
familyRoutes.get('/dashboard', getFamilyDashboard);
familyRoutes.get('/relationship/:targetProfileId', verifyRelationship);

// ─── Memories (photos) ────────────────────────────────────────────────────────
const memoriesRoutes = Router();
memoriesRoutes.get('/', getMemories);
memoriesRoutes.post('/', createMemory);
memoriesRoutes.get('/file/:filename', serveMemoryFile);
memoriesRoutes.delete('/:id', deleteMemory);

// ─── Calls ────────────────────────────────────────────────────────────────────
const callRoutes = Router();
callRoutes.post('/initiate', initiateCall);
callRoutes.patch('/:id/status', updateCallStatus);
callRoutes.get('/', getCallHistory);

export {
  notificationRoutes,
  messageRoutes,
  familyRoutes,
  memoriesRoutes,
  callRoutes
};
