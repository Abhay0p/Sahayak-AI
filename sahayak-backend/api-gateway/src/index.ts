import express from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express() as any;
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(morgan('dev'));

// Service URLs from Environment Variables or Defaults
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8001';
const HEALTHCARE_SERVICE_URL = process.env.HEALTHCARE_SERVICE_URL || 'http://localhost:8002';
const GAME_SERVICE_URL = process.env.GAME_SERVICE_URL || 'http://localhost:8003';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8004';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8005';

// Helper to keep original path
const proxyOptions = {
  proxyReqPathResolver: (req: express.Request) => req.originalUrl
};

// API Routes routing to respective microservices
app.use('/api/auth', proxy(AUTH_SERVICE_URL, proxyOptions));
app.use('/api/profile', proxy(AUTH_SERVICE_URL, proxyOptions));

app.use('/api/healthcare', proxy(HEALTHCARE_SERVICE_URL, proxyOptions));
app.use('/api/help', proxy(HEALTHCARE_SERVICE_URL, proxyOptions));
app.use('/api/caregiver', proxy(HEALTHCARE_SERVICE_URL, proxyOptions));

app.use('/api/game', proxy(GAME_SERVICE_URL, proxyOptions));
app.use('/api/games', proxy(GAME_SERVICE_URL, proxyOptions));
app.use('/api/adaptive-difficulty', proxy(GAME_SERVICE_URL, proxyOptions));

app.use('/api/ai', proxy(AI_SERVICE_URL, proxyOptions));
app.use('/api/voice-chat', proxy(AI_SERVICE_URL, proxyOptions));
app.use('/api/tts', proxy(AI_SERVICE_URL, proxyOptions));
app.use('/api/stt', proxy(AI_SERVICE_URL, proxyOptions));
app.use('/api/memory-assistant', proxy(AI_SERVICE_URL, proxyOptions));

app.use('/api/notifications', proxy(NOTIFICATION_SERVICE_URL, proxyOptions));
app.use('/api/messages', proxy(NOTIFICATION_SERVICE_URL, proxyOptions));
app.use('/api/contacts', proxy(NOTIFICATION_SERVICE_URL, proxyOptions));
app.use('/api/family/memories', proxy(NOTIFICATION_SERVICE_URL, proxyOptions));
app.use('/api/family', proxy(NOTIFICATION_SERVICE_URL, proxyOptions));
app.use('/api/calls', proxy(NOTIFICATION_SERVICE_URL, proxyOptions));
app.use('/api/admin', proxy(AUTH_SERVICE_URL, proxyOptions));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'API Gateway' });
});

app.listen(PORT, () => {
  console.log(`API Gateway is running on http://localhost:${PORT}`);
});
