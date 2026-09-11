import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 8001;

app.use(cors());
app.use(express.json());

import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import adminRoutes from './routes/adminRoutes';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Auth Service' });
});

if (!process.env.IS_MONOLITH) {
  app.listen(PORT, () => {
    console.log(`Auth Service is running on http://localhost:${PORT}`);
  });
}
