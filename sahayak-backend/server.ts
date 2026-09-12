import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';

dotenv.config();
process.env.IS_MONOLITH = 'true';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));


// ==========================================
// 1. Mount Microservices
// ==========================================

import { app as authApp } from './services/auth-service/src/index';
import { app as healthcareApp } from './services/healthcare-service/src/index';
import { app as gameApp } from './services/game-service/src/index';
import { app as aiApp } from './services/ai-service/src/index';
import { app as notificationApp, io as notificationIo } from './services/notification-service/src/index';

app.use(authApp);
app.use(healthcareApp);
app.use(gameApp);
app.use(aiApp);
app.use(notificationApp);

// Attach the socket instance from notification-service to our monolith HTTP server
notificationIo.attach(server);

// ==========================================
// 2. Start Monolith Server
// ==========================================
server.listen(PORT, () => {
  console.log(`🚀 Sahayak AI Monolith Backend is running on http://localhost:${PORT}`);
});
