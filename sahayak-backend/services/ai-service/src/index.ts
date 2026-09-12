import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 8004;

if (!process.env.IS_MONOLITH) {
  app.use(cors());
  app.use(express.json());
}

import aiRoutes from './routes/aiRoutes';

// Routes
app.use('/api', aiRoutes);
// app.use('/api/tts', ttsRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'AI Service' });
});

if (!process.env.IS_MONOLITH) {
  app.listen(PORT, () => {
    console.log(`AI Service is running on http://localhost:${PORT}`);
  });
}
