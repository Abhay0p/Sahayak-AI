import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 8002;

if (!process.env.IS_MONOLITH) {
  app.use(cors());
  app.use(express.json());
}

import helpRoutes from './routes/helpRoutes';
import { healthcareRoutes, contactsRoutes } from './routes/routes';

// Routes
app.use('/api/healthcare', healthcareRoutes);
app.use('/api/caregiver', healthcareRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/contacts', contactsRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Healthcare Service' });
});

if (!process.env.IS_MONOLITH) {
  app.listen(PORT, () => {
    console.log(`Healthcare Service is running on http://localhost:${PORT}`);
  });
}
