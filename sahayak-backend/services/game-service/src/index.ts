import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8003;

app.use(cors());
app.use(express.json());

import gameRoutes from './routes/gameRoutes';

// Routes
app.use('/api/games', gameRoutes);
app.use('/api/game', gameRoutes);
// app.use('/api/adaptive-difficulty', difficultyRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Game Service' });
});

app.listen(PORT, () => {
  console.log(`Game Service is running on http://localhost:${PORT}`);
});
