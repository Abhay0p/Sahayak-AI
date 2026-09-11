import { Router } from 'express';
import { getAdminStats } from '../controllers/adminController';

const router = Router();

router.get('/', getAdminStats);

export default router;
